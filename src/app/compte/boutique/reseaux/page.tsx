import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { env } from "@/lib/env";
import SocialCalendar from "./SocialCalendar";

export default async function BoutiqueReseauxPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) return <main className="min-h-screen bg-brand-bg px-4 py-10"><div className="mx-auto max-w-xl rounded-2xl bg-white p-6"><h1 className="text-xl font-bold">Crée d’abord ta boutique</h1><Link className="mt-4 inline-block text-brand-accent underline" href="/boutiques/creer">Créer ma boutique</Link></div></main>;

  const { data, error } = await supabase.from("social_posts").select("id, caption, media_url, product_url, platforms, scheduled_at, timezone, status").eq("shop_id", shop.id).order("scheduled_at", { ascending: true });
  const posts = error ? [] : (data ?? []);
  const shopUrl = `${env.siteUrl()}/shop/${shop.slug}`;
  return <main className="min-h-screen bg-brand-bg px-4 py-8"><div className="mx-auto max-w-3xl"><Link href="/compte/boutique" className="text-sm text-brand-accent underline">← Retour à Ma boutique</Link><header className="mb-6 mt-4"><h1 className="text-2xl font-bold">Calendrier des réseaux sociaux</h1><p className="mt-1 text-sm text-brand-text/60">{shop.name} · prépare tes publications au même endroit.</p></header>{error && <p role="alert" className="mb-4 rounded-xl bg-white p-4 text-sm">La table du calendrier n’est pas encore disponible. Applique la migration Supabase <code>20261027190000_social_publishing_calendar.sql</code> puis recharge cette page.</p>}<SocialCalendar posts={posts} shopUrl={shopUrl} /></div></main>;
}
