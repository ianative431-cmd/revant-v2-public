import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCategories } from "@/server/catalog/categories";

export const dynamic = "force-dynamic";

const virtualCategories = [
  { slug: "mode", name: "Mode", description: "Vêtements homme et femme" },
  { slug: "parfums", name: "Parfums", description: "Eaux de parfum et fragrances" },
];

// Images de couverture propres à chaque catégorie : aucun produit ni aucune
// boutique fictive n'est créé. Les images restent des visuels éditoriaux.
const categoryPhotos: Record<string, string> = {
  electronique: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
  mode: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
  maison: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
  beaute: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
  parfums: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85",
  sport: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85",
  auto: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85",
  restaurants: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  alimentation: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
  electromenager: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85",
};

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  try {
    categories = await getActiveCategories(await createSupabaseServerClient());
  } catch {
    categories = [];
  }

  const items = [
    ...virtualCategories,
    ...categories
      .filter((item) => !["mode", "parfums"].includes(item.slug))
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        description: item.description,
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
            const photo = categoryPhotos[item.slug] ?? categoryPhotos.mode;
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
                    backgroundColor: "#A79986",
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
