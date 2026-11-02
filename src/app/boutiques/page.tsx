import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveShops } from "@/server/shops/shops";

export const metadata = {
  title: "Boutiques — Revant",
  description: "Découvre les boutiques ouvertes sur Revant, sans compte obligatoire pour naviguer.",
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

  const publicShops = shops.filter(
    (shop) => typeof shop.slug === "string" && shop.slug.length > 0
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-24 text-[#111]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Link href="/" className="text-xs font-semibold text-neutral-600 hover:text-black">← Retour à l’accueil</Link>
        <div className="mb-6 mt-5">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Les boutiques Revant</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Parcours les boutiques publiques et consulte leurs articles sans créer de compte.
            La connexion est réservée aux actions qui nécessitent un compte.
          </p>
        </div>

        {publicShops.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {publicShops.map((shop) => {
              const bannerUrl = safeImageUrl(shop.banner_url) ?? safeImageUrl(shop.background_image_url);
              const logoUrl = safeImageUrl(shop.logo_url);
              const shopColor = shop.background_color && /^#[0-9a-fA-F]{6}$/.test(shop.background_color)
                ? shop.background_color
                : "#A79986";

              return (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug}`}
                  aria-label={`Ouvrir la boutique ${shop.name}`}
                  className="group relative aspect-[1.15] overflow-hidden rounded-xl bg-neutral-200 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                  style={{ backgroundColor: shopColor }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                    style={{ backgroundImage: bannerUrl ? `url("${bannerUrl}")` : undefined }}
                  />
                  {!bannerUrl && (
                    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/35">
                      {shop.name.slice(0, 1).toLocaleUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  {logoUrl && (
                    <div
                      role="img"
                      aria-label={`Logo de ${shop.name}`}
                      className="absolute left-3 top-3 h-12 w-12 rounded-xl border-2 border-white bg-white bg-cover bg-center shadow"
                      style={{ backgroundImage: `url("${logoUrl}")` }}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <strong className="block text-sm">{shop.name}</strong>
                    <span className="mt-1 block text-[11px] text-white/80">{shop.city ?? "Niger"}</span>
                    <span className="mt-2 inline-block rounded bg-white px-2 py-1 text-[10px] font-bold text-black">OUVRIR →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-10 text-center sm:px-10">
            <div aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-2xl">⌂</div>
            <h2 className="text-lg font-extrabold">Aucune boutique publique pour le moment</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              Les vitrines de cette page s’ouvriront dès que des boutiques seront actives.
              Tu peux déjà parcourir les produits publiés, sans te connecter.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/#produits" className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white hover:bg-neutral-800">Explorer les produits</Link>
              <Link href="/boutiques/creer" className="rounded-full border border-neutral-300 px-5 py-3 text-xs font-bold text-black hover:bg-neutral-50">Ouvrir une boutique</Link>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
