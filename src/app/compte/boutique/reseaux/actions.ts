"use server";

import { revalidatePath } from "next/cache";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

const allowedPlatforms = new Set(["instagram", "facebook", "tiktok", "snapchat", "whatsapp", "manual"]);

export type SocialPostInput = {
  caption: string;
  mediaUrl?: string;
  productUrl?: string;
  platforms: string[];
  scheduledAt: string;
  timezone: string;
};

export async function createSocialPost(input: SocialPostInput) {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return { error: "Crée d’abord ta boutique." };

  const caption = input.caption?.trim();
  const scheduledAt = new Date(input.scheduledAt);
  const platforms = Array.isArray(input.platforms) ? [...new Set(input.platforms)] : [];
  const validUrl = (value?: string) => !value || /^https:\/\//i.test(value.trim());
  if (!caption || caption.length > 2200) return { error: "Le texte doit contenir entre 1 et 2 200 caractères." };
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000) return { error: "Choisis une date future, au moins une minute à l’avance." };
  if (!platforms.length || platforms.some((platform) => !allowedPlatforms.has(platform))) return { error: "Choisis au moins une destination valide." };
  if (!validUrl(input.mediaUrl) || !validUrl(input.productUrl)) return { error: "Les liens doivent commencer par https://." };
  const timezone = input.timezone?.trim() || "Africa/Niamey";
  if (timezone.length > 80) return { error: "Fuseau horaire invalide." };

  const { error } = await supabase.from("social_posts").insert({
    shop_id: shop.id,
    owner_id: user.id,
    caption,
    media_url: input.mediaUrl?.trim() || null,
    product_url: input.productUrl?.trim() || null,
    platforms,
    scheduled_at: scheduledAt.toISOString(),
    timezone,
    status: "scheduled",
  });
  if (error) return { error: "Impossible d’enregistrer la publication. Vérifie que la migration Supabase a été appliquée." };
  revalidatePath("/compte/boutique/reseaux");
  revalidatePath("/compte/boutique");
  return { success: true };
}

export async function cancelSocialPost(postId: string) {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop || !/^[0-9a-f-]{36}$/i.test(postId)) return { error: "Publication introuvable." };
  const { data, error } = await supabase.from("social_posts").update({ status: "cancelled" }).eq("id", postId).eq("shop_id", shop.id).eq("owner_id", user.id).eq("status", "scheduled").select("id").maybeSingle();
  if (error || !data) return { error: "Cette publication ne peut pas être annulée." };
  revalidatePath("/compte/boutique/reseaux");
  return { success: true };
}
