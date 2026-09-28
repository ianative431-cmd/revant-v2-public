"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-image";

export type AdminModerationState = { error: string | null };

/**
 * Suspend/réactive une boutique. Le trigger shops_protect_admin_columns
 * (migration 0002) refuse ce changement à quiconque n'est pas
 * "service_role" — même un compte admin authentifié classique. Le
 * client service role est donc la seule voie possible ici, mais
 * requireAdmin() reste la garde qui décide QUI a le droit d'appeler
 * cette fonction.
 */
export async function setShopStatus(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requireAdmin();

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
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const imagePath = String(formData.get("imagePath") ?? "");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("products").delete().eq("id", productId);

  if (error) {
    return { error: "Impossible de supprimer cette annonce." };
  }

  if (imagePath) {
    await admin.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);
  }

  revalidatePath("/admin/produits");
  return { error: null };
}
