import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCategories } from "@/server/catalog/categories";

export const dynamic = "force-dynamic";
const virtualCategories = [
  { slug: "mode", name: "Mode", description: "Vêtements homme et femme" },
  { slug: "parfums", name: "Parfums", description: "Eaux de parfum et fragrances" },
];
const photos = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
];
export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  try { categories = await getActiveCategories(await createSupabaseServerClient()); } catch { categories = []; }
  const items = [...virtualCategories, ...categories.filter((item) => !["mode", "parfums"].includes(item.slug)).map((item) => ({ slug: item.slug, name: item.name, description: item.description ?? null as string | null }))];
  return <main className="min-h-screen bg-[#f7f7f7] px-4 py-8 pb-28 text-neutral-900"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm text-neutral-500">← Accueil</Link><h1 className="mt-4 text-2xl font-black">Catégories</h1><p className="mt-2 text-sm text-neutral-600">Choisis une catégorie pour afficher les produits correspondants.</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{items.map((item, index) => <Link key={item.slug} href={`/?categorie=${encodeURIComponent(item.slug)}#produits`} className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="aspect-[1.35] bg-cover bg-center" style={{ backgroundImage: `url("${photos[index % photos.length]}")` }}/><div className="p-3"><h2 className="text-sm font-bold">{item.name}</h2>{item.description && <p className="mt-1 text-xs text-neutral-500">{item.description}</p>}<span className="mt-3 inline-block text-xs font-semibold text-[#803e2f]">Voir les produits →</span></div></Link>)}</div>{items.length === virtualCategories.length && <p className="mt-5 text-xs text-neutral-500">Les catégories supplémentaires s’afficheront dès que le catalogue sera disponible.</p>}</div></main>;
}
