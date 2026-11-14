import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCategories } from "@/server/catalog/categories";
import { getCategoryCoverImage } from "@/content/products/category-cover-images";

export const dynamic = "force-dynamic";

const virtualCategories = [
  { slug: "mode", name: "Mode", description: "Vêtements homme et femme", image_url: null },
  { slug: "parfums", name: "Parfums", description: "Eaux de parfum et fragrances", image_url: null },
];

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  try {
    categories = await getActiveCategories(await createSupabaseServerClient());
  } catch {
    categories = [];
  }

  const categoriesBySlug = new Map(categories.map((item) => [item.slug, item]));
  const items = [
    ...virtualCategories.map((item) => {
      const stored = categoriesBySlug.get(item.slug);
      return {
        ...item,
        description: stored?.description ?? item.description,
        image_url: stored?.image_url ?? null,
      };
    }),
    ...categories
      .filter((item) => !["mode", "parfums"].includes(item.slug))
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
      })),
  ];

  return (
    <div className="min-h-screen bg-brand-bg pb-28 text-brand-text">
      <SiteHeader />
      <main className="px-4 pb-10 pt-5 sm:pt-9">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-[var(--brand-muted)] transition hover:text-brand-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-accent)]"
          >
            <span aria-hidden="true">←</span>
            Accueil
          </Link>

          <section className="relative mt-5 overflow-hidden rounded-[28px] border border-[var(--brand-border)] bg-[var(--brand-surface)] px-5 py-7 shadow-sm sm:px-8 sm:py-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-accent/10 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-brand-bg px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-accent sm:text-xs">
                Explorer Revant
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Trouvez votre univers.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--brand-muted)] sm:text-base">
                Mode, parfums et bien plus : choisissez une catégorie pour découvrir les produits proposés par les boutiques Revant.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--brand-muted)]">
                <span className="h-2 w-2 rounded-full bg-brand-accent" />
                {items.length} {items.length > 1 ? "catégories à explorer" : "catégorie à explorer"}
              </div>
            </div>
          </section>

          <section className="mt-8 sm:mt-10" aria-labelledby="categories-list-title">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                  Le catalogue
                </p>
                <h2 id="categories-list-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                  Explorer par catégorie
                </h2>
              </div>
              <span className="hidden rounded-full border border-[var(--brand-border)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-muted)] sm:inline-flex">
                {items.length} disponibles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {items.map((item) => {
                const photo = getCategoryCoverImage(item.slug, item.image_url);
                return (
                  <Link
                    key={item.slug}
                    href={`/?categorie=${encodeURIComponent(item.slug)}#produits`}
                    aria-label={`Voir les produits de la catégorie ${item.name}`}
                    className="group overflow-hidden rounded-[22px] border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(20,43,69,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-accent)]"
                  >
                    <div className="relative aspect-[1.18] overflow-hidden bg-brand-bg sm:aspect-[1.25]">
                      <div
                        role="img"
                        aria-label={`Illustration de la catégorie ${item.name}`}
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url("${photo}")`,
                          backgroundColor: "var(--brand-surface)",
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
                      />
                      <span className="absolute bottom-3 left-3 right-3 text-sm font-extrabold tracking-tight text-white drop-shadow sm:bottom-4 sm:left-4 sm:text-base">
                        {item.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/20 text-sm font-semibold text-white backdrop-blur-sm transition group-hover:translate-x-0.5 group-hover:bg-brand-accent sm:right-4 sm:top-4"
                      >
                        ↗
                      </span>
                    </div>
                    <div className="flex min-h-[92px] flex-col justify-between p-3 sm:min-h-[104px] sm:p-4">
                      {item.description ? (
                        <p className="line-clamp-2 text-xs leading-5 text-[var(--brand-muted)] sm:text-sm">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--brand-muted)]">Découvrez notre sélection</p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-accent sm:text-xs">
                        Voir les produits
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {items.length === virtualCategories.length && (
            <p className="mt-6 rounded-2xl border border-dashed border-[var(--brand-border)] px-4 py-3 text-xs leading-5 text-[var(--brand-muted)]">
              Les catégories supplémentaires s’afficheront dès que le catalogue sera disponible.
            </p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
