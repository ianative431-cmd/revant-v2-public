import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveRestaurants } from "@/server/shops/shops";

export const metadata = {
  title: "Restaurants — Revant",
  description: "Découvre les restaurants présents sur Revant et consulte leurs menus et produits.",
};

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function RestaurantsPage() {
  let restaurants: Awaited<ReturnType<typeof getActiveRestaurants>> = [];

  // La découverte publique reste accessible même si Supabase est indisponible.
  try {
    const supabase = await createSupabaseServerClient();
    restaurants = await getActiveRestaurants(supabase);
  } catch {
    restaurants = [];
  }

  const publicRestaurants = restaurants.filter(
    (shop) => typeof shop.slug === "string" && shop.slug.length > 0
  );

  return (
    <div className="min-h-screen bg-[#f5f3f0] pb-24 text-[#1f1d20]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] px-3 py-8 sm:px-6 sm:py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-500">Marketplace Revant</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Restaurants</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Découvre les restaurants présents sur Revant et ouvre leur vitrine pour consulter leurs offres.
            </p>
          </div>
          <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-neutral-600">
            {publicRestaurants.length} restaurant{publicRestaurants.length > 1 ? "s" : ""}
          </span>
        </div>

        {publicRestaurants.length === 0 ? (
          <section className="rounded-[28px] border border-black/5 bg-white px-5 py-12 text-center shadow-sm sm:px-10">
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f3f0] text-2xl">🍽️</div>
            <h2 className="mt-4 text-lg font-extrabold">Aucun restaurant public pour le moment</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              Les restaurants apparaîtront ici dès que leurs boutiques seront actives.
            </p>
            <Link
              href="/boutiques/creer"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#803E2F] px-5 text-xs font-bold text-white hover:brightness-95"
            >
              Ouvrir mon restaurant sur Revant
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {publicRestaurants.map((shop) => {
              const bannerUrl = safeImageUrl(shop.banner_url) ?? safeImageUrl(shop.background_image_url);
              const logoUrl = safeImageUrl(shop.logo_url);
              const color = shop.background_color && /^#[0-9a-fA-F]{6}$/.test(shop.background_color)
                ? shop.background_color
                : "#A79986";

              return (
                <Link
                  key={shop.id}
                  href={`/shop/${encodeURIComponent(shop.slug)}`}
                  aria-label={`Ouvrir le restaurant ${shop.name}`}
                  className="group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
                >
                  <div className="relative h-36 overflow-hidden sm:h-40" style={{ backgroundColor: color }}>
                    {bannerUrl ? (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.28), transparent 65%), url("${bannerUrl}")` }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/30">
                        {shop.name.slice(0, 1).toLocaleUpperCase("fr")}
                      </div>
                    )}
                    {shop.is_premium && (
                      <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold text-amber-900">
                        PREMIUM
                      </span>
                    )}
                  </div>

                  <div className="relative px-4 pb-5 pt-11">
                    <div
                      aria-hidden="true"
                      className="absolute -top-9 left-4 flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-2xl font-black text-white shadow-md"
                      style={{
                        backgroundColor: color,
                        backgroundImage: logoUrl ? `url("${logoUrl}")` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!logoUrl && shop.name.slice(0, 1).toLocaleUpperCase("fr")}
                    </div>
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <h2 className="line-clamp-1 text-base font-black tracking-tight">{shop.name}</h2>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600">
                        {getShopTypeLabel(shop)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">{shop.city ?? "Lieu non renseigné"}</p>
                    {shop.description && (
                      <p className="mt-3 line-clamp-2 min-h-9 text-xs leading-relaxed text-neutral-600">
                        {shop.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="text-[11px] font-semibold text-neutral-500">Voir le restaurant</span>
                      <span aria-hidden="true" className="text-sm font-black transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
