import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";
import ProductCard from "@/components/products/ProductCard";

type Props = { searchParams: Promise<{ categorie?: string }> };

export default async function Home({ searchParams }: Props) {
  const { categorie } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const categories = await getActiveCategories(supabase);
  const activeCategory = categories.find((c) => c.slug === categorie);

  const products = await getActiveProducts(supabase, { categoryId: activeCategory?.id });

  return (
    <div className="min-h-screen bg-[#F3E9DA]">
      <header className="px-4 pt-6 pb-4 flex items-center justify-between">
        <span className="text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          Revant
        </span>
        <div className="flex items-center gap-4">
          <Link href="/restaurants" className="text-sm underline">
            Restaurants
          </Link>
          <Link href="/compte" className="text-sm underline">
            Mon compte
          </Link>
        </div>
      </header>

      <nav className="px-4 pb-4 flex gap-2 overflow-x-auto">
        <Link
          href="/"
          className={`shrink-0 text-xs font-medium rounded-full px-4 py-2 ${
            !activeCategory ? "bg-black text-white" : "bg-black/5"
          }`}
        >
          Tout
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?categorie=${c.slug}`}
            className={`shrink-0 text-xs font-medium rounded-full px-4 py-2 ${
              activeCategory?.id === c.id ? "bg-black text-white" : "bg-black/5"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <main className="px-4 pb-16">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-black/60 mb-4">
              {activeCategory
                ? "Aucun article dans cette catégorie pour l'instant."
                : "Aucun article pour l'instant — reviens bientôt."}
            </p>
            <Link
              href="/boutiques/creer"
              className="inline-block bg-black text-white rounded-full px-6 py-3 text-sm font-medium"
            >
              Créer ma boutique et vendre
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
