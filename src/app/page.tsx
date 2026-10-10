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

const categoryVisuals = [
  { match: /téléphone|smartphone|mobile/i, icon: "▣" },
  { match: /ordinateur|tablette|informatique/i, icon: "▤" },
  { match: /montre/i, icon: "◷" },
  { match: /accessoire|écouteur|audio/i, icon: "◉" },
  { match: /vêtement|chaussure|mode/i, icon: "◇" },
  { match: /maison|meuble|déco/i, icon: "⌂" },
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
  const heroImages = loadedProducts.flatMap((p) => p.images).filter(Boolean).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-24 text-[#101522]">
      <SiteHeader />

      {!activeCategory && !term && (
        <section className="mx-auto mt-4 max-w-[1500px] px-3 sm:px-5">
          <div className="relative grid min-h-[330px] overflow-hidden rounded-sm bg-[#edf0ff] sm:min-h-[390px] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-9 sm:px-10 lg:px-12">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f47b20]">Nouveautés Revant</p>
              <h1 className="max-w-xl text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl">La technologie qui vous accompagne.<br /><span className="text-[#f47b20]">Les meilleures offres.</span></h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#465066]">Smartphones, accessoires, mode et produits du quotidien auprès des boutiques et vendeurs du Niger.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="#produits" className="rounded-md bg-[#f47b20] px-5 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#df6815]">ACHETER MAINTENANT <span aria-hidden="true">→</span></Link>
                <Link href="#categories" className="rounded-md border border-[#8b92a0] bg-white/80 px-5 py-3 text-xs font-bold text-[#101522] transition hover:bg-white">EXPLORER LES CATÉGORIES</Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold text-[#3d4658]">
                <span>♧ Produits authentiques</span><span>♧ Livraison selon la boutique</span><span>✓ Achat sans compte</span>
              </div>
            </div>
            <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#d9e0fa] to-[#f5f6ff] px-6 py-8">
              <div className="absolute right-8 top-8 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-white bg-white/90 text-center shadow-md sm:right-12 sm:h-24 sm:w-24">
                <span className="text-[8px] font-bold uppercase">Offres</span><strong className="text-2xl font-black text-[#f47b20]">Top</strong><span className="text-[8px] font-bold">sélection</span>
              </div>
              {heroImages.length > 0 ? (
                <div className="relative flex h-[240px] w-full max-w-[510px] items-end justify-center gap-[-8px] sm:h-[300px]">
                  {heroImages.map((src, i) => <div key={src + i} className={`relative h-[75%] w-[30%] overflow-hidden rounded-2xl border-[5px] border-[#171923] bg-white shadow-2xl ${i === 1 ? "z-10 h-[95%] w-[34%]" : "translate-y-4"}`}><Image src={src} alt="Produit en vedette sur Revant" fill sizes="(max-width: 640px) 30vw, 180px" className="object-contain p-1" /></div>)}
                </div>
              ) : (
                <div className="relative flex h-[250px] w-full max-w-[440px] items-end justify-center sm:h-[300px]">
                  <div className="absolute bottom-2 h-7 w-[95%] rounded-[50%] bg-white shadow-lg" />
                  {[0,1,2].map((n) => <div key={n} className={`relative mb-5 h-[190px] w-[82px] rounded-[20px] border-[5px] border-[#252833] bg-gradient-to-br from-[#d5d6d9] via-[#9ea3ad] to-[#444a57] shadow-2xl sm:h-[235px] sm:w-[105px] ${n===1 ? "z-10 h-[220px] w-[96px] bg-gradient-to-br from-[#292c36] via-[#11131b] to-[#8d4a32] sm:h-[270px] sm:w-[125px]" : "translate-y-3"}`}><div className="absolute left-1/2 top-2 h-2 w-9 -translate-x-1/2 rounded-full bg-black/80"/><div className="absolute left-2 top-3 flex h-10 w-10 flex-wrap gap-1 rounded-lg bg-black/20 p-1"><i className="h-3 w-3 rounded-full bg-[#20232b]"/><i className="h-3 w-3 rounded-full bg-[#20232b]"/><i className="h-3 w-3 rounded-full bg-[#20232b]"/></div></div>)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!activeCategory && !term && (
        <section id="categories" className="mx-auto max-w-[1500px] px-3 pt-7 sm:px-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-extrabold uppercase tracking-tight">Acheter par catégorie</h2><Link href="/#categories" className="text-[10px] font-bold hover:text-[#f47b20]">VOIR TOUTES LES CATÉGORIES →</Link></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 12).map((c, i) => {
              const visual = categoryVisuals.find((v) => v.match.test(c.name))?.icon ?? ["▧","◈","⌂","◇","◉","▣"][i % 6];
              return <Link key={c.id} href={`/?categorie=${encodeURIComponent(c.slug)}#produits`} className="group flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-[#eceef2] bg-white p-4 text-center shadow-[0_2px_8px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:border-[#f5bd91] hover:shadow-md"><span className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-[#f7f7fa] text-4xl font-light text-[#f47b20] transition group-hover:bg-[#fff0e4]">{visual}</span><span className="text-xs font-bold">{c.name}</span></Link>;
            })}
            {categories.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-[#d9dce3] bg-white p-8 text-center text-sm text-[#657084]">Les catégories apparaîtront ici dès qu'elles seront activées.</div>}
          </div>
        </section>
      )}

      {!activeCategory && !term && (
        <section id="promotions" className="mx-auto max-w-[1500px] px-3 pt-6 sm:px-5">
          <div className="relative grid min-h-[180px] overflow-hidden rounded-xl bg-[#080d18] text-white md:grid-cols-[0.85fr_1.15fr]">
            <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8"><p className="text-[10px] font-extrabold uppercase tracking-widest text-[#f6a15f]">Offres à découvrir</p><h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Les bonnes affaires<br/>sur <span className="text-[#f47b20]">Revant</span></h2><p className="mt-2 max-w-sm text-xs text-white/70">Explorez les produits et trouvez les offres des boutiques.</p><Link href="#produits" className="mt-4 inline-flex w-fit rounded-md bg-[#f47b20] px-4 py-2.5 text-[10px] font-extrabold text-white hover:bg-[#df6815]">VOIR LES PRODUITS →</Link></div>
            <div className="flex items-center justify-center gap-3 overflow-hidden px-4 py-5 sm:gap-5">
              {heroImages.length > 0 ? heroImages.map((src,i)=><div key={src+i} className={`relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-1 shadow-xl sm:h-36 sm:w-24 ${i===1 ? "h-36 w-24 sm:h-44 sm:w-32"}`}><Image src={src} alt="Sélection de produits" fill sizes="120px" className="object-contain p-1"/></div>) : <div className="flex gap-4 text-6xl text-white/80"><span>▣</span><span className="text-[#f47b20]">◉</span><span>▤</span><span>◇</span></div>}
              <div className="hidden h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border border-white/50 sm:flex"><span className="text-[9px] font-bold">À DÉCOUVRIR</span><strong className="text-xl text-[#f47b20]">REVANT</strong></div>
            </div>
          </div>
        </section>
      )}

      {!activeCategory && !term && shops.length > 0 && (
        <section id="boutiques" className="mx-auto max-w-[1500px] px-3 pt-7 sm:px-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-extrabold uppercase">Boutiques populaires</h2><p className="mt-1 text-xs text-[#687084]">Des commerces et vendeurs à découvrir</p></div><Link href="/boutiques" className="text-[10px] font-bold hover:text-[#f47b20]">VOIR TOUT →</Link></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {shops.slice(0,6).map((shop) => <Link key={shop.id} href={`/shop/${shop.slug}`} className="overflow-hidden rounded-lg border border-[#eceef2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative aspect-[1.4] bg-[#f0f1f5]">{shop.banner_url ? <Image src={shop.banner_url} alt={shop.name} fill sizes="200px" className="object-cover"/> : <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-[#f47b20]">{shop.name.slice(0,1).toUpperCase()}</div>}</div><div className="p-3"><p className="truncate text-xs font-bold">{shop.name}</p><p className="mt-1 truncate text-[10px] text-[#697386]">{shop.city ?? "Niger"}</p></div></Link>)}
          </div>
        </section>
      )}

      <main id="produits" className="mx-auto max-w-[1500px] px-3 pt-7 sm:px-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-extrabold uppercase">{term ? `Résultats pour « ${q} »` : activeCategory ? activeCategory.name : "Produits populaires"}</h2><p className="mt-1 text-xs text-[#687084]">Découvrez les dernières annonces disponibles</p></div><Link href="/#produits" className="text-[10px] font-bold hover:text-[#f47b20]">VOIR TOUS LES PRODUITS →</Link></div>
        {products.length === 0 ? <div className="rounded-lg border border-[#eceef2] bg-white px-5 py-12 text-center"><p className="text-sm font-semibold">{term ? "Aucun résultat pour cette recherche." : activeCategory ? "Aucun article dans cette catégorie pour l'instant." : "Aucun produit publié pour le moment."}</p><p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#687084]">{term ? "Essaie un autre mot ou explore les catégories." : "Les produits réels apparaîtront ici dès leur publication par les vendeurs."}</p><Link href="/boutiques/creer" className="mt-4 inline-flex rounded-md bg-[#f47b20] px-5 py-3 text-xs font-bold text-white">Ouvrir une boutique</Link></div> :
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{products.slice(0,15).map((product)=><ProductCard key={product.id} product={product}/>)}</div>}
      </main>

      {!activeCategory && !term && <section className="mx-auto grid max-w-[1500px] grid-cols-2 gap-3 px-3 py-8 sm:grid-cols-4 sm:px-5">
        {[["♙","Des vendeurs à découvrir","Boutiques et commerces du Niger"],["◇","Des offres claires","Les prix affichés par les vendeurs"],["♧","Achat simple","La commande sans compte est possible"],["☏","Une aide accessible","Contactez l'équipe Revant"]].map(([icon,title,desc])=><div key={title} className="flex gap-3 rounded-lg border border-[#eceef2] bg-white p-4"><span className="text-2xl text-[#f47b20]">{icon}</span><span><strong className="block text-xs">{title}</strong><span className="mt-1 block text-[10px] leading-relaxed text-[#687084]">{desc}</span></span></div>)}
      </section>}
      <BottomNav />
    </div>
  );
}
