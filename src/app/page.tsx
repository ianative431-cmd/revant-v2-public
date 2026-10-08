import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";
import { getActiveShops } from "@/server/shops/shops";
import ProductCard from "@/components/products/ProductCard";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";

type Props = { searchParams: Promise<{ categorie?: string }> };

const FEATURES = [
  { title: "Vendeurs vérifiés", detail: "Identité contrôlée avant mise en ligne" },
  { title: "Paiement sécurisé", detail: "Fonds protégés jusqu'à la remise" },
  { title: "Support en français", detail: "Une équipe disponible pour t'aider" },
];

export default async function Home({ searchParams }: Props) {
  const { categorie } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const categories = await getActiveCategories(supabase);
  const activeCategory = categories.find((c) => c.slug === categorie);

  const [products, shops] = await Promise.all([
    getActiveProducts(supabase, { categoryId: activeCategory?.id, limit: activeCategory ? undefined : 10 }),
    getActiveShops(supabase, { limit: 8 }),
  ]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <SiteHeader />

      {!activeCategory && (
        <section className="relative mx-4 mt-2 mb-6 rounded-[28px] overflow-hidden">
          <div className="relative aspect-[3/4] sm:aspect-[16/9]">
            <Image
              src="/images/hero/accueil-dunes.jpg"
              alt="Désert au clair de lune"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs uppercase tracking-wide text-white/80 mb-1">Revant</p>
              <h1 className="text-2xl font-bold leading-tight mb-3">
                Seconde vie,
                <br />
                nouvelle valeur.
              </h1>
              <div className="flex gap-2">
                <a
                  href="#produits"
                  className="bg-brand-accent text-white rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  Découvrir
                </a>
                <Link
                  href="/boutiques/creer"
                  className="border border-white/70 text-white rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  Vendre
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {!activeCategory && (
        <section className="px-4 pb-6 grid grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-brand-surface text-brand-on-surface rounded-2xl p-3">
              <p className="text-xs font-semibold mb-0.5">{f.title}</p>
              <p className="text-[11px] opacity-80">{f.detail}</p>
            </div>
          ))}
        </section>
      )}

      <nav className="px-4 pb-4 flex gap-2 overflow-x-auto">
        <Link
          href="/"
          className={`shrink-0 text-xs font-medium rounded-full px-4 py-2 ${
            !activeCategory ? "bg-brand-accent text-white" : "bg-brand-text/5 text-brand-text"
          }`}
        >
          Tout
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?categorie=${c.slug}`}
            className={`shrink-0 text-xs font-medium rounded-full px-4 py-2 ${
              activeCategory?.id === c.id
                ? "bg-brand-accent text-white"
                : "bg-brand-text/5 text-brand-text"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {!activeCategory && shops.length > 0 && (
        <section className="pb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-brand-text">Boutiques en vedette</h2>
          </div>
          <div className="pl-4 flex gap-3 overflow-x-auto pb-1">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop/${shop.slug}`}
                className="shrink-0 w-36 bg-brand-surface text-brand-on-surface rounded-2xl overflow-hidden"
              >
                <div className="relative aspect-square bg-black/10">
                  {shop.banner_url ? (
                    <Image src={shop.banner_url} alt={shop.name} fill sizes="144px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs opacity-60">
                      {shop.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{shop.name}</p>
                  {shop.city && <p className="text-[11px] opacity-70 truncate">{shop.city}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <main id="produits" className="px-4 pb-24">
        <h2 className="text-base font-bold text-brand-text mb-3">
          {activeCategory ? activeCategory.name : "Produits récents"}
        </h2>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-brand-text/60 mb-4">
              {activeCategory
                ? "Aucun article dans cette catégorie pour l'instant."
                : "Aucun article pour l'instant — reviens bientôt."}
            </p>
            <Link
              href="/boutiques/creer"
              className="inline-block bg-brand-accent text-white rounded-full px-6 py-3 text-sm font-medium"
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

      <BottomNav />
    </div>
  );
}
