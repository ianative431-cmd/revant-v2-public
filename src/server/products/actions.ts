"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getShopByOwnerId } from "@/server/shops/shops";

export type SubmitProductState = { error: string | null; success?: boolean };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Le vendeur peut uniquement soumettre son propre brouillon à la modération. */
export async function submitProductForReview(
  _previousState: SubmitProductState,
  formData: FormData
): Promise<SubmitProductState> {
  const user = await requireUserWithLegalConsent();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!UUID_PATTERN.test(productId)) return { error: "Référence d’annonce invalide." };

  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return { error: "Aucune boutique associée à ce compte." };

  const { data, error } = await supabase
    .from("products")
    .update({ status: "pending" })
    .eq("id", productId)
    .eq("shop_id", shop.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "Ce brouillon n’est plus disponible ou a déjà été soumis. Recharge la page." };
  }

  revalidatePath("/compte/boutique/produits");
  revalidatePath("/admin/produits");
  return { error: null, success: true };
}
