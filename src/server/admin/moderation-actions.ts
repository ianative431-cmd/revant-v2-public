"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-image";

export type AdminModerationState = { error: string | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Une boutique en brouillon doit d'abord être soumise par son propriétaire.
 * L'administration ne peut approuver que l'état pending.
 */
export async function setShopStatus(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requirePermission("shops.manage");

  const shopId = String(formData.get("shopId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");

  if (!UUID_RE.test(shopId)) return { error: "Boutique invalide." };
  if (nextStatus !== "active" && nextStatus !== "suspended") {
    return { error: "Statut demandé invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_moderate_shop", {
    p_shop_id: shopId,
    p_next_status: nextStatus,
    p_note: null,
  });

  if (error) {
    return {
      error: error.message.includes("shop_transition_forbidden")
        ? "Transition refusée : une boutique doit être soumise avant son approbation."
        : "Impossible d'enregistrer la décision. Recharge la page puis vérifie tes permissions.",
    };
  }

  revalidatePath("/admin/boutiques");
  revalidatePath("/compte/boutique");
  revalidatePath("/shop/[slug]", "page");
  revalidatePath("/");
  revalidatePath("/boutiques");
  revalidatePath("/restaurants");
  return { error: null };
}

/** Décision de modération atomique, autorisée et journalisée en base. */
export async function moderateProductAction(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requirePermission("products.manage");

  const productId = String(formData.get("productId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!UUID_RE.test(productId)) return { error: "Annonce invalide." };
  if (nextStatus !== "active" && nextStatus !== "rejected") {
    return { error: "Décision de modération invalide." };
  }
  if (nextStatus === "rejected" && (reason.length < 5 || reason.length > 500)) {
    return { error: "Le motif du refus doit contenir entre 5 et 500 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_moderate_product", {
    p_product_id: productId,
    p_next_status: nextStatus,
    p_note: reason || null,
  });

  if (error) {
    return {
      error: error.message.includes("shop_not_active")
        ? "La boutique doit être publiée avant l'approbation de cette annonce."
        : error.message.includes("product_not_pending")
          ? "Cette annonce n'est plus en attente de validation. Recharge la page."
          : "Impossible d'enregistrer cette décision. Vérifie tes permissions puis réessaie.",
    };
  }

  revalidatePath("/admin/produits");
  revalidatePath("/produit/" + productId);
  revalidatePath("/");
  return { error: null };
}

/**
 * Suppression admin d'une annonce — distincte de la suppression vendeur.
 * Nettoie aussi les fichiers image après la suppression en base.
 */
export async function deleteProductAsAdmin(
  _prevState: AdminModerationState,
  formData: FormData
): Promise<AdminModerationState> {
  await requirePermission("products.manage");

  const productId = String(formData.get("productId") ?? "");
  const imageUrlsRaw = String(formData.get("imageUrls") ?? "");
  const imageUrls = imageUrlsRaw.length > 0 ? imageUrlsRaw.split(",") : [];

  if (!UUID_RE.test(productId)) return { error: "Annonce invalide." };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("products").delete().eq("id", productId);
  if (error) return { error: "Impossible de supprimer cette annonce." };

  const paths = imageUrls
    .map((url) => url.split("/" + PRODUCT_IMAGE_BUCKET + "/")[1])
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await admin.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  }

  revalidatePath("/admin/produits");
  return { error: null };
}
