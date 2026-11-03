"use server";

import { revalidatePath } from "next/cache";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

const allowedPlatforms = new Set([
  "instagram",
  "facebook",
  "tiktok",
  "snapchat",
  "whatsapp",
  "manual",
]);

type DbError = { message: string } | null;
type SocialPostsWriter = {
  from: (table: "social_posts") => {
    insert: (values: {
      shop_id: string;
      owner_id: string;
      caption: string;
      media_url: string | null;
      product_url: string | null;
      platforms: string[];
      scheduled_at: string;
      timezone: string;
      status: "scheduled";
    }) => Promise<{ error: DbError }>;
    update: (values: { status: "cancelled" }) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            select: (columns: string) => {
              maybeSingle: () => Promise<{ data: { id: string } | null; error: DbError }>;
            };
          };
        };
      };
    };
  };
};

export type SocialPostInput = {
  caption: string;
  mediaUrl?: string;
  productUrl?: string;
  platforms: string[];
  scheduledAt: string;
  timezone: string;
};

function normalizeHttpsUrl(value: unknown): string | null | false {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname ? url.toString() : false;
  } catch {
    return false;
  }
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function createSocialPost(input: SocialPostInput) {
  const user = await requireUserWithLegalConsent();
  const caption = typeof input?.caption === "string" ? input.caption.trim() : "";
  const scheduledAtValue = typeof input?.scheduledAt === "string" ? input.scheduledAt : "";
  const scheduledAt = new Date(scheduledAtValue);
  const rawPlatforms = Array.isArray(input?.platforms)
    ? input.platforms.filter((value): value is string => typeof value === "string")
    : [];
  const platforms = [...new Set(rawPlatforms)];
  const mediaUrl = normalizeHttpsUrl(input?.mediaUrl);
  const productUrl = normalizeHttpsUrl(input?.productUrl);
  const timezone =
    typeof input?.timezone === "string" && input.timezone.trim()
      ? input.timezone.trim()
      : "Africa/Niamey";

  if (!caption || caption.length > 2200) {
    return { error: "Le texte doit contenir entre 1 et 2 200 caractères." };
  }
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000) {
    return { error: "Choisis une date future, au moins une minute à l’avance." };
  }
  if (!platforms.length || platforms.some((platform) => !allowedPlatforms.has(platform))) {
    return { error: "Choisis au moins une destination valide." };
  }
  if (mediaUrl === false || productUrl === false) {
    return { error: "Les liens doivent être des URL HTTPS valides." };
  }
  if (timezone.length > 80 || !isValidTimezone(timezone)) {
    return { error: "Fuseau horaire invalide. Vérifie les réglages de date de ton appareil." };
  }

  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return { error: "Crée d’abord ta boutique." };

  const db = supabase as unknown as SocialPostsWriter;
  const { error } = await db.from("social_posts").insert({
    shop_id: shop.id,
    owner_id: user.id,
    caption,
    media_url: mediaUrl,
    product_url: productUrl,
    platforms,
    scheduled_at: scheduledAt.toISOString(),
    timezone,
    status: "scheduled",
  });

  if (error) {
    return { error: "Impossible d’enregistrer la publication. Réessaie dans un instant." };
  }

  revalidatePath("/compte/boutique/reseaux");
  revalidatePath("/compte/boutique");
  return { success: true };
}

export async function cancelSocialPost(postId: string) {
  const user = await requireUserWithLegalConsent();
  const validUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postId);

  if (!validUuid) return { error: "Publication introuvable." };

  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return { error: "Publication introuvable." };

  const db = supabase as unknown as SocialPostsWriter;
  const { data, error } = await db
    .from("social_posts")
    .update({ status: "cancelled" })
    .eq("id", postId)
    .eq("shop_id", shop.id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Cette publication ne peut pas être annulée." };

  revalidatePath("/compte/boutique/reseaux");
  return { success: true };
}
