import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveShops } from "@/server/shops/shops";

export const metadata = {
  title: "Boutiques — Revant",
  description: "Découvre les boutiques ouvertes sur Revant, sans compte obligatoire pour naviguer.",
};

function safePublicImage(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeShopColor(value: string | null): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#A79986";
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
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <header className="border-b border-brand-border bg-brand-surface text-brand-text">
        <div className="mx-auto flex min-h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/" className="text-2xl font-black tracking-tight sm:text-3xl">REVANT</Link>
          <nav aria-label="Navigation publique" className="flex items-center gap-4 text-xs font-medium text-brand-text/80 sm:gap-6">
            <Link href="/">Accueil</Link>
            <Link href="/#categories">Catégories</Link>
            <Link href="/#produits">Produits</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Link href="/" className="text-xs font-semibold text-brand-text/65 hover:text-brand-accent">← Retour à l’accueil</Link>
        <div className="mb-6 mt-5">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Les boutiques Revant</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-text/70">
            Parcours les boutiques publiques et consulte leurs articles sans créer de compte.
            La connexion est réservée aux actions qui nécessitent un compte.
          </p>
        </div>

        {publicShops.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {publicShops.map((shop) => {
              const bannerUrl = safePublicImage(shop.banner_url);
              const logoUrl = safePublicImage(shop.logo_url);
              const shopColor = safeShopColor(shop.background_color);
              return (
              <Link
                key={shop.id}
                href={`/shop/${shop.slug}`}
                aria-label={`Ouvrir la boutique ${shop.name}`}
                className="group relative aspect-[1.15] overflow-hidden rounded-xl bg-neutral-200 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: shopColor,
                    backgroundImage: bannerUrl ? `url("${bannerUrl}")` : undefined,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 p-3 text-white">
                  <div
                    role={logoUrl ? "img" : undefined}
                    aria-label={logoUrl ? `Logo de ${shop.name}` : undefined}
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-white/20 bg-cover bg-center text-lg font-black text-white shadow-md backdrop-blur-sm"
                    style={{ backgroundColor: logoUrl ? undefined : shopColor, backgroundImage: logoUrl ? `url("${logoUrl}")` : undefined }}
                  >
                    {!logoUrl && shop.name.slice(0, 1).toLocaleUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{shop.name}</strong>
                  <span className="mt-1 block text-[11px] text-white/80">{shop.city ?? "Niger"}</span>
                  <span className="mt-2 inline-block rounded bg-white px-2 py-1 text-[10px] font-bold text-black">OUVRIR →</span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <section className="rounded-2xl border border-brand-border bg-brand-surface px-5 py-10 text-center sm:px-10">
            <div aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-bg text-2xl">⌂</div>
            <h2 className="text-lg font-extrabold">Aucune boutique publique pour le moment</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-brand-text/70">
              Les vitrines de cette page s’ouvriront dès que des boutiques seront actives.
              Tu peux déjà parcourir les produits publiés, sans te connecter.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/#produits" className="rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white hover:brightness-95">Explorer les produits</Link>
              <Link href="/boutiques/creer" className="rounded-full border border-brand-border px-5 py-3 text-xs font-bold text-brand-text hover:bg-brand-bg">Ouvrir une boutique</Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
