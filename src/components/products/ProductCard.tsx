import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " " + currency;
}

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images[0] ?? null;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#e9ebf0] bg-white shadow-[0_2px_9px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:border-[#f3c19c] hover:shadow-md">
      <Link href={`/produit/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white p-2">
          {imageUrl ? (
            <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f7f8fa] text-[#f47b20]">
              <span className="text-5xl" aria-hidden="true">▣</span>
              <span className="mt-2 text-[10px] text-[#737b8b]">Photo à venir</span>
            </div>
          )}
          {outOfStock && <span className="absolute left-2 top-2 rounded bg-[#101522] px-2 py-1 text-[9px] font-bold text-white">ÉPUISÉ</span>}
        </div>
        <div className="px-3 pt-2">
          <p className="line-clamp-2 min-h-8 text-xs font-bold leading-4 text-[#151a26]">{product.name}</p>
          {product.categoryName && <p className="mt-1 truncate text-[10px] text-[#737b8b]">{product.categoryName}</p>}
          <p className="mt-2 text-sm font-extrabold text-[#151a26]">{formatPrice(product.base_price, product.currency)}</p>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 px-3 pb-3 pt-3">
        <Link href={`/produit/${product.id}`} className="text-[10px] font-semibold text-[#687084] hover:text-[#f47b20]">Voir le produit</Link>
        <Link href={outOfStock ? `/produit/${product.id}` : `/commande/visiteur?productId=${encodeURIComponent(product.id)}`} aria-label={outOfStock ? `Voir ${product.name}, épuisé` : `Acheter ${product.name} sans compte`} className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${outOfStock ? "border-[#e2e5eb] text-[#a1a7b3]" : "border-[#f47b20] bg-white text-[#f47b20] hover:bg-[#f47b20] hover:text-white"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>
        </Link>
      </div>
    </article>
  );
}
