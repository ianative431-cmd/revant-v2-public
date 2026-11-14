"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-image";
import { canTransitionShopStatus } from "@/lib/shop-status.mjs";

export type AdminModerationState = { error: string | null };

/**
 * Change le statut d'une boutique après vérification de la transition
 * autorisée. La vérification de permission reste obligatoire et la
 * mise à jour compare aussi le statut courant pour éviter une course.
 */
export async function setShopStatus(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requirePermission("shops.manage");

  const shopId = String(formData.get("shopId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");

  if (!/^[0-9a-f-]{36}$/i.test(shopId)) {
    return { error: "Boutique invalide." };
  }
  if (nextStatus !== "active" && nextStatus !== "suspended") {
    return { error: "Statut demandé invalide." };
  }

  const admin = createSupabaseAdminClient();
  const { data: currentShop, error: readError } = await admin
    .from("shops")
    .select("status, slug")
    .eq("id", shopId)
    .maybeSingle();

  if (readError || !currentShop) {
    return { error: "Boutique introuvable." };
  }
  if (!canTransitionShopStatus(currentShop.status, nextStatus)) {
    return { error: "Cette transition de statut n'est pas autorisée." };
  }

  const { data: updatedShop, error } = await admin
    .from("shops")
    .update({ status: nextStatus })
    .eq("id", shopId)
    .eq("status", currentShop.status)
    .select("id")
    .maybeSingle();

  if (error || !updatedShop) {
    return { error: "Le statut a changé ou la mise à jour a échoué. Recharge la page puis réessaie." };
  }

  revalidatePath("/admin/boutiques");
  revalidatePath("/shop/" + currentShop.slug);
  revalidatePath("/");
  revalidatePath("/boutiques");
  revalidatePath("/restaurants");
  return { error: null };
}

/**
 * Suppression admin d'une annonce (modération) — distincte de la
 * suppression vendeur (products_owner_delete) : un admin n'est pas
 * propriétaire de la boutique concernée, donc la RLS normale ne
 * l'autoriserait pas. Nettoie aussi le fichier image orphelin.
 */
export async function deleteProductAsAdmin(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requirePermission("products.manage");

  const productId = String(formData.get("productId") ?? "");
  const imageUrlsRaw = String(formData.get("imageUrls") ?? "");
  const imageUrls = imageUrlsRaw.length > 0 ? imageUrlsRaw.split(",") : [];

  const admin = createSupabaseAdminClient();
  // product_images est en clé étrangère ON DELETE CASCADE vers products :
  // supprimer le produit suffit à nettoyer les lignes d'images associées.
  const { error } = await admin.from("products").delete().eq("id", productId);

  if (error) {
    return { error: "Impossible de supprimer cette annonce." };
  }

  const paths = imageUrls
    .map((url) => url.split("/" + PRODUCT_IMAGE_BUCKET + "/")[1])
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await admin.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  }

  revalidatePath("/admin/produits");
  return { error: null };
}
