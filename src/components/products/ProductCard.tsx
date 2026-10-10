import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images[0] ?? null;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/produit/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {imageUrl ? <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">Photo indisponible</div>}
          {outOfStock && <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white">Épuisé</span>}
        </div>
        <div className="px-3 pt-3">
          <p className="truncate text-sm font-semibold text-neutral-900">{product.name}</p>
          {product.categoryName && <p className="mt-1 text-[11px] text-neutral-500">{product.categoryName}</p>}
          <p className="mt-2 text-sm font-extrabold">{formatPrice(product.base_price, product.currency)}</p>
        </div>
      </Link>
      <div className="p-3 pt-2">
        {outOfStock ? <span className="block rounded-full bg-neutral-200 py-2 text-center text-[10px] font-bold text-neutral-500">INDISPONIBLE</span> : <Link href={`/commande/visiteur?productId=${encodeURIComponent(product.id)}`} className="block rounded-full bg-black py-2.5 text-center text-[10px] font-bold text-white transition hover:bg-neutral-800">ACHETER SANS COMPTE</Link>}
      </div>
    </article>
  );
}
