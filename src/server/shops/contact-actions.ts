"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeShopPhone, normalizeShopSocialUrl } from "@/lib/shop-contact.mjs";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getShopByOwnerId } from "@/server/shops/shops";

export type ShopContactActionState = {
  error: string | null;
  success: string | null;
};

export async function updateShopContacts(
  _prevState: ShopContactActionState,
  formData: FormData
): Promise<ShopContactActionState> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    return { error: "Aucune boutique associée à ce compte.", success: null };
  }

  const defaultCallingCode = shop.country_code === "NE" ? "227" : null;
  const phone = normalizeShopPhone(String(formData.get("phone") ?? ""), defaultCallingCode);
  const whatsapp = normalizeShopPhone(String(formData.get("whatsapp") ?? ""), defaultCallingCode);
  const instagram = normalizeShopSocialUrl(String(formData.get("instagram") ?? ""), "instagram");
  const tiktok = normalizeShopSocialUrl(String(formData.get("tiktok") ?? ""), "tiktok");
  const snapchat = normalizeShopSocialUrl(String(formData.get("snapchat") ?? ""), "snapchat");

  if (phone === undefined) {
    return {
      error: "Le téléphone est invalide. Utilise un numéro international (+indicatif) ou un numéro local nigérien valide.",
      success: null,
    };
  }
  if (whatsapp === undefined) {
    return {
      error: "Le numéro WhatsApp est invalide. Utilise un numéro international (+indicatif) ou un numéro local nigérien valide.",
      success: null,
    };
  }
  if (instagram === undefined || tiktok === undefined || snapchat === undefined) {
    return {
      error: "Vérifie les comptes sociaux : saisis un pseudo ou un lien HTTPS du bon réseau.",
      success: null,
    };
  }

  const { data: updatedShop, error } = await supabase
    .from("shops")
    .update({ phone, whatsapp, instagram, tiktok, snapchat })
    .eq("id", shop.id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !updatedShop) {
    return {
      error: "Impossible d'enregistrer les coordonnées. Vérifie ta connexion puis réessaie.",
      success: null,
    };
  }

  revalidatePath("/compte/boutique/personnaliser");
  revalidatePath("/shop/" + shop.slug);

  return { error: null, success: "Coordonnées et réseaux sociaux enregistrés." };
}
