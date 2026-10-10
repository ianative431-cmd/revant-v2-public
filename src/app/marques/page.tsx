import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";

export default async function MarquesPage() {
  const supabase = await createSupabaseServerClient();
  const products = await getActiveProducts(supabase, { limit: 40 });
  const grouped = new Map<string, typeof products>();
  for (const product of products) {
    const key = product.categoryName ?? "Autres produits";
    grouped.set(key, [...(grouped.get(key) ?? []), product]);
  }
  return <div className="min-h-screen bg-[#f7f8fa] pb-24 text-[#101522]"><SiteHeader/><main className="mx-auto max-w-[1200px] px-4 py-8"><p className="text-[10px] font-extrabold uppercase tracking-widest text-[#f47b20]">Catalogue Revant</p><h1 className="mt-2 text-3xl font-black">Marques et sélections</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#687084]">Explore les annonces actuellement publiées. Les marques sont présentées à partir des produits réellement disponibles, sans inventer de stock ou de vendeurs.</p>{products.length === 0 ? <div className="mt-8 rounded-lg border border-[#e9ebf0] bg-white p-8"><p className="text-sm font-semibold">Aucun produit publié pour le moment.</p><p className="mt-2 text-xs text-[#687084]">Les marques et leurs produits apparaîtront ici au fur et à mesure des annonces vérifiées.</p><Link href="/boutiques/creer" className="mt-4 inline-flex rounded-md bg-[#f47b20] px-4 py-3 text-xs font-bold text-white">Vendre sur Revant →</Link></div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...grouped.entries()].map(([category, items])=><section key={category} className="rounded-lg border border-[#e9ebf0] bg-white p-5"><h2 className="font-extrabold">{category}</h2><p className="mt-1 text-xs text-[#687084]">{items.length} produit(s) disponible(s)</p><div className="mt-3 flex flex-wrap gap-2">{items.slice(0,4).map(item=><Link key={item.id} href={`/produit/${item.id}`} className="rounded-full border border-[#e9ebf0] px-3 py-2 text-[10px] font-semibold hover:border-[#f47b20] hover:text-[#f47b20]">{item.name}</Link>)}</div></section>)}</div>}</main><BottomNav/></div>;
}
