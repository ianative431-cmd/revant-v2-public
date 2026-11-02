"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-image";

export type AdminModerationState = { error: string | null; success?: boolean; warning?: string };

/**
 * Suspend/réactive une boutique. Le trigger shops_protect_admin_columns
 * (migration 0002) refuse ce changement à quiconque n'est pas
 * "service_role" — même un compte admin authentifié classique. Le
 * client service role est donc la seule voie possible ici, mais
 * requirePermission() reste la garde qui décide QUI a le droit d'appeler
 * cette fonction.
 */
export async function setShopStatus(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requirePermission("shops.manage");

  const shopId = String(formData.get("shopId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");

  if (nextStatus !== "active" && nextStatus !== "suspended") {
    return { error: "Statut invalide." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("shops").update({ status: nextStatus }).eq("id", shopId);

  if (error) {
    return { error: "Impossible de mettre à jour la boutique." };
  }

  revalidatePath("/admin/boutiques");
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
    .map((url) => url.split(`/${PRODUCT_IMAGE_BUCKET}/`)[1])
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await admin.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  }

  revalidatePath("/admin/produits");
  return { error: null };
}


/** Approuve ou refuse une annonce en attente, avec trace d'audit. */
export async function updateProductModeration(
  _previousState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  const actor = await requirePermission("products.manage");
  const productId = String(formData.get("productId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!UUID_PATTERN.test(productId)) return { error: "Référence d’annonce invalide." };
  if (nextStatus !== "active" && nextStatus !== "rejected") return { error: "Décision de modération invalide." };
  if (nextStatus === "rejected" && reason.length < 3) return { error: "Ajoute un motif de refus (3 caractères minimum)." };

  const admin = createSupabaseAdminClient();
  const { data: product, error: readError } = await admin
    .from("products")
    .select("id,shop_id,status")
    .eq("id", productId)
    .maybeSingle();
  if (readError || !product) return { error: "Annonce introuvable." };
  if (product.status !== "pending") return { error: "Cette annonce n’est plus en attente de validation." };

  const { data: shop, error: shopError } = await admin
    .from("shops")
    .select("status,slug")
    .eq("id", product.shop_id)
    .maybeSingle();
  if (shopError || !shop) return { error: "Boutique associée introuvable." };
  if (nextStatus === "active" && shop.status !== "active") {
    return { error: "La boutique doit être active avant de publier ses produits." };
  }

  const { data: updated, error: updateError } = await admin
    .from("products")
    .update({ status: nextStatus })
    .eq("id", productId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (updateError || !updated) return { error: "L’annonce a changé entre-temps. Recharge la page." };

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "update",
    entity_type: "product",
    entity_id: productId,
    description: nextStatus === "active" ? "Annonce approuvée et publiée" : "Annonce refusée",
    metadata: {
      before: { status: "pending" },
      after: { status: nextStatus },
      reason: reason || null,
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath("/compte/boutique/produits");
  revalidatePath(`/shop/${shop.slug}`);
  return {
    error: null,
    success: true,
    warning: auditError ? "Annonce mise à jour, mais la trace d’audit n’a pas pu être confirmée." : undefined,
  };
}
