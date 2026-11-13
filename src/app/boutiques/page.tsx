import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import ShopDirectory, { type PublicShopCard } from "@/components/shops/ShopDirectory";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveShops } from "@/server/shops/shops";

export const metadata = {
  title: "Boutiques — Revant",
  description: "Découvre les boutiques ouvertes sur Revant, sans compte obligatoire pour naviguer.",
};

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const image = new URL(value);
    const configuredStorage = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredStorage) return null;
    const storage = new URL(configuredStorage);
    const allowedPath = "/storage/v1/object/public/shop-media/";
    if (
      image.protocol !== "https:" ||
      image.origin !== storage.origin ||
      image.username ||
      image.password ||
      !image.pathname.startsWith(allowedPath)
    ) return null;
    return image.toString();
  } catch {
    return null;
  }
}

export default async function BoutiquesPage() {
  let shops: Awaited<ReturnType<typeof getActiveShops>> = [];

  // Page publique : aucune session n'est nécessaire pour consulter les boutiques.
  // Si Supabase est momentanément indisponible, la page affiche un état vide utile.
  try {
    const supabase = await createSupabaseServerClient();
    shops = await getActiveShops(supabase, { limit: 100 });
  } catch {
    shops = [];
  }

  const publicShops: PublicShopCard[] = shops
    .filter((shop) => typeof shop.slug === "string" && shop.slug.length > 0)
    .map((shop) => ({
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      city: shop.city,
      description: shop.description,
      typeLabel: getShopTypeLabel(shop),
      isRestaurant: shop.is_restaurant,
      isPremium: shop.is_premium,
      bannerUrl: safeImageUrl(shop.banner_url) ?? safeImageUrl(shop.background_image_url),
      logoUrl: safeImageUrl(shop.logo_url),
      color: shop.background_color && /^#[0-9a-fA-F]{6}$/.test(shop.background_color)
        ? shop.background_color
        : "#FFFFFF",
    }));

  return (
    <div className="min-h-screen bg-brand-bg pb-24 text-brand-text">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] px-3 py-8 sm:px-6 sm:py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-500">Marketplace Revant</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Les boutiques</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Découvre les boutiques publiques, leurs univers et leurs produits. Tu peux parcourir les vitrines sans créer de compte.
            </p>
          </div>
          <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-neutral-600">
            {publicShops.length} boutique{publicShops.length > 1 ? "s" : ""}
          </span>
        </div>

        {publicShops.length > 0 ? (
          <ShopDirectory shops={publicShops} />
        ) : (
          <section className="rounded-[28px] border border-black/5 bg-white px-5 py-12 text-center shadow-sm sm:px-10">
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg text-2xl">🛍️</div>
            <h2 className="mt-4 text-lg font-extrabold">Aucune boutique publique pour le moment</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              Les vitrines apparaîtront ici dès que des boutiques seront actives. Tu peux déjà parcourir les produits publiés.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/#produits" className="rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white hover:brightness-95">Explorer les produits</Link>
              <Link href="/boutiques/creer" className="rounded-full border border-neutral-300 px-5 py-3 text-xs font-bold text-neutral-800 hover:bg-neutral-50">Ouvrir une boutique</Link>
            </div>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
