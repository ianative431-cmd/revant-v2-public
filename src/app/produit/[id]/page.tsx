import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { getProductById } from "@/server/products/products";

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, id);
  if (!product || product.status !== "active") notFound();

  const { data: shop } = await supabase.from("shops").select("slug, name, owner_id").eq("id", product.shop_id).maybeSingle();
  const currentUser = await getCurrentUser();
  const isOwner = !!currentUser && !!shop && shop.owner_id === currentUser.id;
  const outOfStock = product.stock_quantity <= 0;
  const imageUrl = product.images[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#111]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">← Retour aux produits</Link>
        <div className="mt-5 grid gap-8 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-7">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
            {imageUrl ? <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">Photo indisponible</div>}
            {outOfStock && <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs text-white">Épuisé</span>}
          </div>
          <div className="flex flex-col items-start">
            {product.categoryName && <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{product.categoryName}</p>}
            <h1 className="mt-2 text-2xl font-black">{product.name}</h1>
            <p className="mt-3 text-2xl font-extrabold">{product.base_price.toLocaleString("fr-FR")} {product.currency}</p>
            {product.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{product.description}</p>}
            {shop && <Link href={`/shop/${shop.slug}`} className="mt-6 text-sm font-semibold underline">Voir la boutique {shop.name}</Link>}
            {isOwner ? <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-sm">C’est ton annonce. Tu ne peux pas acheter ton propre produit.</p> : outOfStock ? <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-sm">Ce produit est actuellement épuisé.</p> : <Link href={`/commande/visiteur?productId=${encodeURIComponent(product.id)}`} className="mt-7 block w-full rounded-full bg-black px-6 py-4 text-center text-sm font-bold text-white hover:bg-neutral-800">Commander sans créer de compte</Link>}
            <p className="mt-3 text-xs text-neutral-500">Aucun compte n’est nécessaire pour passer commande.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
