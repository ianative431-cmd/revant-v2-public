"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProductModerationState = { error: string | null };

export async function moderateProductStatus(
  _previousState: ProductModerationState,
  formData: FormData,
): Promise<ProductModerationState> {
  await requirePermission("products.manage");

  const productId = String(formData.get("productId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(productId)) {
    return { error: "Annonce invalide." };
  }
  if (nextStatus !== "active" && nextStatus !== "rejected") {
    return { error: "Décision de modération invalide." };
  }
  if (note.length > 500) {
    return { error: "Le motif ne peut pas dépasser 500 caractères." };
  }
  if (nextStatus === "rejected" && note.length < 3) {
    return { error: "Indique un motif avant de refuser cette annonce." };
  }

  const supabase = await createSupabaseServerClient();
  const rpc = supabase.rpc as unknown as (
    functionName: string,
    args: { p_product_id: string; p_status: "active" | "rejected"; p_note: string | null },
  ) => Promise<{ error: { message: string } | null }>;

  const { error } = await rpc("admin_moderate_product", {
    p_product_id: productId,
    p_status: nextStatus,
    p_note: note || null,
  });

  if (error) {
    if (error.message.includes("shop_not_active")) {
      return { error: "Valide d'abord la boutique avant d'approuver ses annonces." };
    }
    if (error.message.includes("product_not_pending")) {
      return { error: "Cette annonce a déjà été traitée. Recharge la page." };
    }
    if (error.message.includes("product_not_found")) {
      return { error: "Annonce introuvable." };
    }
    return { error: "La modération a échoué. Recharge la page puis réessaie." };
  }

  revalidatePath("/admin/produits");
  revalidatePath("/produit/" + productId);
  revalidatePath("/");
  revalidatePath("/boutiques");
  return { error: null };
}
