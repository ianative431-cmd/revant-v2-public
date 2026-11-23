import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { env } from "@/lib/env";
import SocialCalendar from "./SocialCalendar";

type SocialPost = { id: string; caption: string; media_url: string | null; product_url: string | null; platforms: string[]; scheduled_at: string; timezone: string; status: "scheduled" | "cancelled" };
type SocialPostsReader = { from: (table: "social_posts") => { select: (columns: string) => { eq: (column: string, value: string) => { order: (column: string, options: { ascending: boolean }) => PromiseLike<{ data: SocialPost[] | null; error: { message: string } | null }> } } } };

export default async function BoutiqueReseauxPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return <main className="min-h-screen bg-brand-bg px-4 py-10"><div className="mx-auto max-w-xl rounded-[24px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-sm"><h1 className="text-xl font-bold">Crée d’abord ta boutique</h1><Link className="mt-4 inline-block text-brand-accent underline" href="/boutiques/creer">Créer ma boutique</Link></div></main>;
  const db = supabase as unknown as SocialPostsReader;
  const { data, error } = await db.from("social_posts").select("id, caption, media_url, product_url, platforms, scheduled_at, timezone, status").eq("shop_id", shop.id).order("scheduled_at", { ascending: true });
  const posts = error ? [] : (data ?? []);
  const shopUrl = `${env.siteUrl()}/shop/${shop.slug}`;
  return <main className="revant-seller-social min-h-screen bg-brand-bg px-4 py-8"><div className="revant-seller-social-layout mx-auto max-w-4xl"><Link href="/compte/boutique" className="text-sm font-semibold text-[var(--brand-accent)] underline underline-offset-4">← Retour à Ma boutique</Link><header className="mb-6 mt-4"><h1 className="text-2xl font-black tracking-tight text-[var(--brand-text)]">Calendrier des réseaux sociaux</h1><p className="mt-1 text-sm text-[var(--brand-muted)]">{shop.name} · prépare tes publications au même endroit.</p></header>{error && <p role="alert" className="mb-4 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 text-sm text-[var(--brand-text)]">Impossible de charger le calendrier pour le moment. Recharge la page dans quelques instants.</p>}<SocialCalendar posts={posts} shopUrl={shopUrl} /></div></main>;
}
