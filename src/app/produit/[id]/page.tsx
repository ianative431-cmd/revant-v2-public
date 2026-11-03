import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { getProductById } from "@/server/products/products";
import AddToCartButton from "@/components/products/AddToCartButton";
import { startConversationAboutProduct } from "@/app/messages/actions";

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
    <div className="min-h-screen bg-brand-bg px-4 py-6 text-brand-text">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-[var(--brand-muted)] hover:text-black">← Retour aux produits</Link>
        <div className="mt-5 grid gap-8 rounded-2xl bg-[var(--brand-surface)] border border-[var(--brand-border)] p-4 shadow-sm sm:grid-cols-2 sm:p-7">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--brand-bg)]">
            {imageUrl ? <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--brand-muted)]">Photo indisponible</div>}
            {outOfStock && <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs text-white">Épuisé</span>}
          </div>
          <div className="flex flex-col items-start">
            {product.categoryName && <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">{product.categoryName}</p>}
            <h1 className="mt-2 text-2xl font-black">{product.name}</h1>
            {product.product_type === "perfume" && product.perfume_volume_ml && <p className="mt-2 text-sm text-[var(--brand-muted)]">{product.perfume_volume_ml} ml</p>}
            {product.product_type === "clothing" && Object.keys(product.size_stock).length > 0 && <section className="mt-4 w-full"><h2 className="text-sm font-bold">Tailles et disponibilités</h2><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(product.size_stock).sort(([a],[b]) => a.localeCompare(b, "fr")).map(([size, quantity]) => <div key={size} className="rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm"><span className="font-bold">{size}</span><span className="ml-2 text-[var(--brand-muted)]">{quantity > 0 ? `${quantity} disponible${quantity > 1 ? "s" : ""}` : "Épuisé"}</span></div>)}</div></section>}
            <p className="mt-3 text-2xl font-extrabold">{product.base_price.toLocaleString("fr-FR")} {product.currency}</p>
            {product.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[var(--brand-muted)]">{product.description}</p>}
            {shop && <Link href={`/shop/${shop.slug}`} className="mt-6 text-sm font-semibold underline">Voir la boutique {shop.name}</Link>}
            {!isOwner && shop && <form action={startConversationAboutProduct} className="mt-4 w-full"><input type="hidden" name="productId" value={product.id}/><button type="submit" className="w-full rounded-full border border-brand-accent px-5 py-3 text-sm font-bold text-brand-accent transition hover:bg-brand-accent/10">Contacter le vendeur</button></form>}
            {isOwner ? <p className="mt-6 rounded-lg bg-[var(--brand-bg)] p-3 text-sm">C’est ton annonce. Tu ne peux pas acheter ton propre produit.</p> : outOfStock ? <p className="mt-6 rounded-lg bg-[var(--brand-bg)] p-3 text-sm">Ce produit est actuellement épuisé.</p> : <><AddToCartButton item={{ id: product.id, name: product.name, price: product.base_price, currency: product.currency, image: imageUrl }} /><Link href={`/commande/visiteur?productId=${encodeURIComponent(product.id)}`} className="mt-3 block w-full rounded-full bg-brand-accent px-6 py-4 text-center text-sm font-bold text-white hover:brightness-95">Commander sans créer de compte</Link></>}
            <p className="mt-3 text-xs text-[var(--brand-muted)]">Aucun compte n’est nécessaire pour passer commande.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
