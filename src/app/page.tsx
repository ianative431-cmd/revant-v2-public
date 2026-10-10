import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";
import { getActiveShops } from "@/server/shops/shops";
import ProductCard from "@/components/products/ProductCard";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";

type Props = { searchParams: Promise<{ categorie?: string; q?: string }> };

const FEATURES = [
  { title: "Vendeurs vérifiés", detail: "Des boutiques à découvrir" },
  { title: "Livraison", detail: "Options selon la boutique" },
  { title: "Achat simple", detail: "Sans compte obligatoire" },
];

export default async function Home({ searchParams }: Props) {
  const { categorie, q } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const categories = await getActiveCategories(supabase);
  const activeCategory = categories.find((c) => c.slug === categorie);
  const [loadedProducts, shops] = await Promise.all([
    getActiveProducts(supabase, { categoryId: activeCategory?.id, limit: 60 }),
    getActiveShops(supabase, { limit: 8 }),
  ]);
  const term = q?.trim().toLocaleLowerCase("fr");
  const products = term
    ? loadedProducts.filter((p) =>
        `${p.name} ${p.description ?? ""} ${p.categoryName ?? ""}`
          .toLocaleLowerCase("fr")
          .includes(term),
      )
    : loadedProducts;

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <SiteHeader />

      {!activeCategory && (
        <section className="relative mx-3 mt-3 mb-5 overflow-hidden rounded-2xl bg-[#064b38] text-white">
          <div className="relative min-h-[300px] sm:min-h-[360px]">
            <Image
              src="/images/hero/accueil-dunes.jpg"
              alt="Paysage du Niger"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
            <div className="relative z-10 flex min-h-[300px] items-center px-6 py-10 sm:min-h-[360px] sm:px-12">
              <div className="max-w-xl">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Achetez · Vendez · Grandissez</p>
                <h1 className="mb-3 text-3xl font-black leading-tight sm:text-5xl">Revant<br />La vraie marketplace<br /><span className="text-lime-300">au Niger</span></h1>
                <p className="mb-5 max-w-md text-sm leading-relaxed text-white/90">Des produits, des boutiques locales et des vendeurs à découvrir en toute simplicité.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="#produits" className="rounded-full bg-lime-400 px-5 py-3 text-sm font-bold text-[#103b2d] transition hover:bg-lime-300">Découvrir maintenant →</Link>
                  <Link href="/boutiques/creer" className="rounded-full border border-white/70 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Vendre sur Revant</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {!activeCategory && (
        <section className="grid grid-cols-1 gap-2 px-3 pb-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3 rounded-xl bg-brand-surface p-3 text-brand-on-surface">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0c704c] text-lg text-white" aria-hidden="true">✓</span>
              <span><strong className="block text-xs font-bold">{f.title}</strong><span className="mt-0.5 block text-[11px] opacity-75">{f.detail}</span></span>
            </div>
          ))}
        </section>
      )}

      <section id="categories" className="px-4 pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-text">Toutes les catégories</h2>
          <Link href="/#categories" className="text-xs font-semibold text-brand-accent">Voir tout →</Link>
        </div>
        <nav aria-label="Catégories" className="flex gap-2 overflow-x-auto pb-2">
          <Link href="/" className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${!activeCategory ? "bg-brand-accent text-white" : "bg-brand-surface text-brand-on-surface"}`}>Tout</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/?categorie=${encodeURIComponent(c.slug)}#produits`} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${activeCategory?.id === c.id ? "bg-brand-accent text-white" : "bg-brand-surface text-brand-on-surface"}`}>
              {c.name}
            </Link>
          ))}
        </nav>
      </section>

      {!activeCategory && shops.length > 0 && (
        <section id="boutiques-paysannes" className="pb-6">
          <div className="mb-3 flex items-center justify-between px-4">
            <div><h2 className="text-base font-bold text-brand-text">Nos boutiques</h2><p className="text-xs text-brand-text/60">Des vendeurs et commerces à découvrir</p></div>
            <Link href="/boutiques/creer" className="text-xs font-semibold text-brand-accent">Vendre ici →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/shop/${shop.slug}`} className="w-40 shrink-0 overflow-hidden rounded-xl bg-brand-surface text-brand-on-surface">
                <div className="relative aspect-[1.25] bg-black/10">
                  {shop.banner_url ? <Image src={shop.banner_url} alt={shop.name} fill sizes="160px" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-xs opacity-60">{shop.name.slice(0, 1).toUpperCase()}</div>}
                </div>
                <div className="p-3"><p className="truncate text-xs font-semibold">{shop.name}</p><p className="mt-1 truncate text-[11px] opacity-70">{shop.city ?? "Niger"}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <main id="produits" className="px-4 pb-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-text">{term ? `Résultats pour « ${q} »` : activeCategory ? activeCategory.name : "Produits populaires"}</h2>
          <Link href="/#produits" className="text-xs font-semibold text-brand-accent">Voir tout →</Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-xl border border-brand-text/10 bg-brand-surface px-5 py-12 text-center text-brand-on-surface">
            <p className="text-sm font-semibold">{term ? "Aucun résultat pour cette recherche." : activeCategory ? "Aucun article dans cette catégorie pour l'instant." : "Les premières annonces arrivent bientôt."}</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed opacity-70">{term ? "Essaie un autre mot ou explore les catégories." : "Les produits publiés apparaîtront ici dès qu'ils seront disponibles."}</p>
            <Link href="/boutiques/creer" className="mt-4 inline-flex rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white">Ouvrir une boutique</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.slice(0, 15).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>

      <section id="promotions" className="grid gap-3 px-4 pb-6 sm:grid-cols-3">
        <Link href="/#produits" className="relative flex min-h-32 items-end overflow-hidden rounded-xl bg-[#064b38] p-5 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#064b38] to-[#0f8b5e]" />
          <div className="relative"><strong className="text-sm font-extrabold">NOUVEAUTÉS</strong><p className="mt-1 text-xs text-white/80">Découvre les dernières annonces.</p><span className="mt-3 inline-block rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#064b38]">Voir les produits →</span></div>
        </Link>
        <Link href="/#boutiques-paysannes" className="relative flex min-h-32 items-end overflow-hidden rounded-xl bg-[#7a4b32] p-5 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7a4b32] to-[#c49a65]" />
          <div className="relative"><strong className="text-sm font-extrabold">ACHETER LOCAL</strong><p className="mt-1 text-xs text-white/80">Découvre les commerces et vendeurs.</p><span className="mt-3 inline-block rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#513321]">Découvrir →</span></div>
        </Link>
        <Link href="/boutiques/creer" className="relative flex min-h-32 items-end overflow-hidden rounded-xl bg-[#344d44] p-5 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#344d44] to-[#738c6c]" />
          <div className="relative"><strong className="text-sm font-extrabold">VENDS SUR REVANT</strong><p className="mt-1 text-xs text-white/80">Présente tes produits aux clients.</p><span className="mt-3 inline-block rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#344d44]">Créer ma boutique →</span></div>
        </Link>
      </section>

      <BottomNav />
    </div>
  );
}
