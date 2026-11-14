"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getShopByOwnerId } from "@/server/shops/shops";

export type ShopReviewActionState = {
  error: string | null;
  success: string | null;
};

/**
 * Le vendeur peut soumettre uniquement sa propre boutique en brouillon.
 * Le statut est protégé par un trigger en base : l'action vérifie d'abord
 * l'utilisateur et le propriétaire, puis effectue la transition serveur
 * draft -> pending avec le client admin.
 */
export async function submitShopForReview(
  _prevState: ShopReviewActionState,
  _formData: FormData
): Promise<ShopReviewActionState> {
  const user = await requireUserWithLegalConsent();
  const userClient = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(userClient, user.id);

  if (!shop) {
    return { error: "Aucune boutique associée à ce compte.", success: null };
  }
  if (shop.status !== "draft") {
    return { error: "Seule une boutique en brouillon peut être soumise.", success: null };
  }
  if (!(shop.phone?.trim() || shop.whatsapp?.trim())) {
    return {
      error: "Ajoute au moins un numéro de téléphone ou WhatsApp avant de demander la validation.",
      success: null,
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: updatedShop, error } = await admin
    .from("shops")
    .update({ status: "pending" })
    .eq("id", shop.id)
    .eq("owner_id", user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error || !updatedShop) {
    return {
      error: "La boutique a changé de statut ou l'envoi a échoué. Recharge la page puis réessaie.",
      success: null,
    };
  }

  revalidatePath("/compte/boutique");
  revalidatePath("/admin/boutiques");
  revalidatePath("/shop/" + shop.slug);
  return { error: null, success: "Demande envoyée. La boutique attend maintenant la validation de Revant." };
}
