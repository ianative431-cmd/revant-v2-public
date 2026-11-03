"use server";

import { revalidatePath } from "next/cache";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

const allowedPlatforms = new Set(["instagram", "facebook", "tiktok", "snapchat", "whatsapp", "manual"]);
type DbError = { message: string } | null;
type SocialPostsWriter = {
  from: (table: "social_posts") => {
    insert: (values: { shop_id: string; owner_id: string; caption: string; media_url: string | null; product_url: string | null; platforms: string[]; scheduled_at: string; timezone: string; status: "scheduled" }) => Promise<{ error: DbError }>;
    update: (values: { status: "cancelled" }) => { eq: (column: string, value: string) => { eq: (column: string, value: string) => { eq: (column: string, value: string) => { select: (columns: string) => { maybeSingle: () => Promise<{ data: { id: string } | null; error: DbError }> } } } } };
  };
};
export type SocialPostInput = { caption: string; mediaUrl?: string; productUrl?: string; platforms: string[]; scheduledAt: string; timezone: string };

function safeHttpsUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export async function createSocialPost(rawInput: unknown) {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return { error: "Crée d’abord ta boutique." };
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) return { error: "Informations invalides." };
  const input = rawInput as Record<string, unknown>;
  const caption = typeof input.caption === "string" ? input.caption.trim() : "";
  const scheduledAtRaw = typeof input.scheduledAt === "string" ? input.scheduledAt : "";
  const scheduledAt = new Date(scheduledAtRaw);
  const candidates = Array.isArray(input.platforms) ? input.platforms.filter((value): value is string => typeof value === "string") : [];
  const platforms = [...new Set(candidates)];
  const mediaUrl = safeHttpsUrl(input.mediaUrl);
  const productUrl = safeHttpsUrl(input.productUrl);
  const timezone = typeof input.timezone === "string" ? input.timezone.trim() : "Africa/Niamey";

  if (!caption || caption.length > 2200) return { error: "Le texte doit contenir entre 1 et 2 200 caractères." };
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000) return { error: "Choisis une date future, au moins une minute à l’avance." };
  if (!platforms.length || platforms.length > 6 || platforms.some((platform) => !allowedPlatforms.has(platform))) return { error: "Choisis au moins une destination valide." };
  if (mediaUrl === undefined || productUrl === undefined) return { error: "Les liens doivent être des adresses HTTPS valides." };
  if (!timezone || timezone.length > 80) return { error: "Fuseau horaire invalide." };
  try { new Intl.DateTimeFormat("fr-FR", { timeZone: timezone }); } catch { return { error: "Fuseau horaire invalide." }; }

  const db = supabase as unknown as SocialPostsWriter;
  const { error } = await db.from("social_posts").insert({
    shop_id: shop.id, owner_id: user.id, caption,
    media_url: mediaUrl, product_url: productUrl, platforms,
    scheduled_at: scheduledAt.toISOString(), timezone, status: "scheduled",
  });
  if (error) return { error: "Impossible d’enregistrer la publication. Réessaie dans un instant." };
  revalidatePath("/compte/boutique/reseaux");
  revalidatePath("/compte/boutique");
  return { success: true };
}

export async function cancelSocialPost(postId: string) {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop || typeof postId !== "string" || !/^[0-9a-f-]{36}$/i.test(postId)) return { error: "Publication introuvable." };
  const db = supabase as unknown as SocialPostsWriter;
  const { data, error } = await db.from("social_posts").update({ status: "cancelled" }).eq("id", postId).eq("shop_id", shop.id).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "Cette publication ne peut pas être annulée." };
  revalidatePath("/compte/boutique/reseaux");
  return { success: true };
}
