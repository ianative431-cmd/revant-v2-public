import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";
import { getActiveShops } from "@/server/shops/shops";
import ProductCard from "@/components/products/ProductCard";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";

type Props = { searchParams: Promise<{ categorie?: string; q?: string }> };

const CATEGORY_PHOTOS = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80",
];

const FARM_PHOTOS = [
  { title: "Produits frais", subtitle: "Du champ à la maison", photo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80" },
  { title: "Céréales locales", subtitle: "Le savoir-faire de nos régions", photo: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80" },
  { title: "Élevage", subtitle: "Des filières locales", photo: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=900&q=80" },
  { title: "Fruits du Niger", subtitle: "Récoltes de saison", photo: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80" },
];

const HERO_PHOTO = "https://images.unsplash.com/photo-1514435116008-a80913c597af?auto=format&fit=crop&w=1800&q=85";

export default async function Home({ searchParams }: Props) {
  const { categorie, q } = await searchParams;
  // Le catalogue public ne doit jamais être bloqué par l'absence de session
  // ou par une indisponibilité temporaire de la configuration Supabase.
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  let loadedProducts: Awaited<ReturnType<typeof getActiveProducts>> = [];
  let shops: Awaited<ReturnType<typeof getActiveShops>> = [];
  try {
    const supabase = await createSupabaseServerClient();
    categories = await getActiveCategories(supabase);
    const categoryId = categories.find((c) => c.slug === categorie)?.id;
    [loadedProducts, shops] = await Promise.all([
      getActiveProducts(supabase, { categoryId, limit: 24 }),
      getActiveShops(supabase, { limit: 8 }),
    ]);
  } catch {
    // On conserve la navigation publique et les états vides si le backend
    // n'est pas configuré, sans renvoyer le visiteur vers la connexion.
    categories = [];
    loadedProducts = [];
    shops = [];
  }
  const activeCategory = categories.find((c) => c.slug === categorie);
  const term = q?.trim().toLocaleLowerCase("fr");
  const products = term
    ? loadedProducts.filter((p) => `${p.name} ${p.description ?? ""} ${p.categoryName ?? ""}`.toLocaleLowerCase("fr").includes(term))
    : loadedProducts;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#111] pb-28">
      <SiteHeader />
      <section className="relative mx-3 mt-1 overflow-hidden rounded-2xl bg-[#101010] text-white min-h-[330px] sm:min-h-[390px]">
        <div className="absolute inset-0 bg-cover bg-[center_35%] opacity-75" style={{ backgroundImage: `url("${HERO_PHOTO}")` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/10" />
        <div className="relative z-10 flex min-h-[330px] sm:min-h-[390px] items-center px-6 py-10 sm:px-12">
          <div className="max-w-lg">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-white/70">MODE • MAISON • TERROIR</p>
            <h1 className="mb-4 text-3xl font-black leading-[1.04] tracking-tight sm:text-5xl">STYLE. QUALITÉ.<br />REVANT.</h1>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/80">Des trouvailles du quotidien, des boutiques locales et des produits qui font avancer nos communautés.</p>
            <Link href="#produits" className="inline-flex items-center gap-3 rounded-md bg-white px-5 py-3 text-xs font-bold text-black transition hover:bg-neutral-200">ACHETER MAINTENANT <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2" aria-hidden="true"><span className="h-2 w-2 rounded-full bg-white"/><span className="h-2 w-2 rounded-full border border-white/80"/><span className="h-2 w-2 rounded-full border border-white/80"/></div>
      </section>

      <section id="a-propos" className="grid grid-cols-2 gap-px border-b border-black/5 bg-[#e8e8e8] px-3 sm:grid-cols-4">
        {[
          ["↗", "LIVRAISON", "Options selon la boutique"],
          ["◇", "ACHAT SIMPLE", "Sans compte obligatoire"],
          ["□", "BOUTIQUES LOCALES", "Des vendeurs à découvrir"],
          ["○", "AIDE EN FRANÇAIS", "Un parcours clair"],
        ].map(([icon, title, detail]) => (
          <div key={title} className="flex min-h-[76px] items-center gap-3 bg-[#f7f7f7] px-3 py-4 sm:px-5">
            <span className="text-2xl font-light" aria-hidden="true">{icon}</span>
            <span><strong className="block text-[10px] font-extrabold tracking-wide">{title}</strong><span className="mt-1 block text-[10px] text-neutral-600">{detail}</span></span>
          </div>
        ))}
      </section>

      <section id="categories" className="px-4 pt-7">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Catégories</h2><a href="#categories" className="text-xs font-medium">Voir tout →</a></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => (
            <Link key={category.id} href={`/?categorie=${encodeURIComponent(category.slug)}#produits`} className="group relative aspect-[1.05] overflow-hidden rounded-lg bg-neutral-300">
              <div className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105" style={{ backgroundImage: `url("${CATEGORY_PHOTOS[index % CATEGORY_PHOTOS.length]}")` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="boutiques-paysannes" className="px-4 pt-7">
        <div className="mb-1 flex items-center justify-between"><h2 className="text-lg font-extrabold">Boutiques paysannes</h2><Link href="/boutiques/creer" className="text-xs font-medium">Vendre ici →</Link></div>
        <p className="mb-3 text-xs text-neutral-600">Des produits frais, locaux et de qualité.</p>
        {shops.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {shops.slice(0, 4).map((shop) => (
              <Link key={shop.id} href={`/shop/${shop.slug}`} className="relative aspect-[1.5] overflow-hidden rounded-lg bg-neutral-200">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: shop.banner_url ? `url("${shop.banner_url}")` : `url("${FARM_PHOTOS[0].photo}")` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white"><strong className="block text-sm">{shop.name}</strong><span className="text-[11px]">{shop.city ?? "Niger"}</span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {FARM_PHOTOS.map((farm) => (
              <Link key={farm.title} href="/boutiques" aria-label={`Ouvrir le répertoire des boutiques — ${farm.title}`} className="group relative aspect-[1.5] overflow-hidden rounded-lg bg-neutral-200 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black">
                <div className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105" style={{ backgroundImage: `url("${farm.photo}")` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white"><strong className="block text-sm">{farm.title}</strong><span className="text-[11px] text-white/80">{farm.subtitle}</span><span className="mt-2 inline-block rounded bg-white px-2 py-1 text-[10px] font-bold text-black">DÉCOUVRIR →</span></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <main id="produits" className="px-4 pt-7">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">{term ? `Résultats pour « ${q} »` : activeCategory ? activeCategory.name : "Produits populaires"}</h2><a href="#produits" className="text-xs font-medium">Voir tout →</a></div>
        {products.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center">
            <p className="text-sm font-semibold">{term ? "Aucun résultat pour cette recherche." : "Les premières annonces arrivent bientôt."}</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-neutral-500">{term ? "Essaie un autre mot ou explore les catégories." : "Aucun produit actif n’est encore publié. Les annonces réelles apparaîtront ici dès leur publication."}</p>
            <Link href="/boutiques/creer" className="mt-4 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white">Ouvrir une boutique</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.slice(0, 10).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>

      <section className="grid gap-3 px-4 pt-7 md:grid-cols-3">
        <Link href="#produits" className="relative flex min-h-32 items-end overflow-hidden rounded-xl bg-black p-5 text-white">
          <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: `url("${HERO_PHOTO}")` }} /><div className="relative"><strong className="text-sm font-extrabold">NOUVEAUTÉS</strong><p className="mt-1 text-xs text-white/80">Explore les dernières annonces.</p><span className="mt-3 inline-block rounded bg-white px-3 py-2 text-[10px] font-bold text-black">VOIR LES PRODUITS →</span></div>
        </Link>
        <Link href="#boutiques-paysannes" className="relative flex min-h-32 items-end overflow-hidden rounded-xl bg-black p-5 text-white">
          <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: `url("${FARM_PHOTOS[1].photo}")` }} /><div className="relative"><strong className="text-sm font-extrabold">ACHETER LOCAL</strong><p className="mt-1 text-xs text-white/80">Découvre les produits de nos régions.</p><span className="mt-3 inline-block rounded bg-white px-3 py-2 text-[10px] font-bold text-black">DÉCOUVRIR →</span></div>
        </Link>
        <Link href="/boutiques/creer" className="relative flex min-h-32 items-end overflow-hidden rounded-xl bg-black p-5 text-white">
          <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: `url("${FARM_PHOTOS[0].photo}")` }} /><div className="relative"><strong className="text-sm font-extrabold">VENDS SUR REVANT</strong><p className="mt-1 text-xs text-white/80">Présente tes produits à de nouveaux clients.</p><span className="mt-3 inline-block rounded bg-white px-3 py-2 text-[10px] font-bold text-black">CRÉER MA BOUTIQUE →</span></div>
        </Link>
      </section>
      <BottomNav />
    </div>
  );
}
