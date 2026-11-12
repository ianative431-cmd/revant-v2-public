import Link from "next/link";
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
    <main className="min-h-screen bg-brand-bg px-4 py-8 pb-28 text-brand-text">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-[var(--brand-muted)]">← Accueil</Link>
        <h1 className="mt-4 text-2xl font-black">Catégories</h1>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          Choisis une catégorie pour afficher les produits correspondants.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const photo = getCategoryCoverImage(item.slug, item.image_url);
            return (
              <Link
                key={item.slug}
                href={`/?categorie=${encodeURIComponent(item.slug)}#produits`}
                className="group overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  role="img"
                  aria-label={`Illustration de la catégorie ${item.name}`}
                  className="aspect-[1.35] bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.16)), url("${photo}")`,
                    backgroundColor: "var(--brand-surface)",
                  }}
                />
                <div className="p-3">
                  <h2 className="text-sm font-bold">{item.name}</h2>
                  {item.description && (
                    <p className="mt-1 text-xs text-[var(--brand-muted)]">{item.description}</p>
                  )}
                  <span className="mt-3 inline-block text-xs font-semibold text-brand-accent">
                    Voir les produits →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {items.length === virtualCategories.length && (
          <p className="mt-5 text-xs text-[var(--brand-muted)]">
            Les catégories supplémentaires s’afficheront dès que le catalogue sera disponible.
          </p>
        )}
      </div>
    </main>
  );
}
