import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import AddToCartButton from "@/components/products/AddToCartButton";
import { safeProductImageUrl } from "@/lib/product-image";

function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = safeProductImageUrl(product.images[0]);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--brand-text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/produit/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[var(--brand-bg)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 20vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-[var(--brand-muted)]">
              Photo indisponible
            </div>
          )}
          {outOfStock && (
            <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white">
              Épuisé
            </span>
          )}
        </div>
        <div className="px-3 pt-3">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          {product.categoryName && (
            <p className="mt-1 text-[11px] text-[var(--brand-muted)]">{product.categoryName}</p>
          )}
          <p className="mt-2 text-sm font-extrabold">{formatPrice(product.base_price, product.currency)}</p>
        </div>
      </Link>
      <div className="p-3 pt-2">
        {outOfStock ? (
          <span className="block rounded-full bg-[var(--brand-border)] py-2 text-center text-[10px] font-bold text-[var(--brand-muted)]">
            INDISPONIBLE
          </span>
        ) : (
          <>
            <AddToCartButton
              compact
              item={{
                id: product.id,
                name: product.name,
                price: product.base_price,
                currency: product.currency,
                image: imageUrl,
              }}
            />
            <Link
              href={`/commande/visiteur?productId=${encodeURIComponent(product.id)}`}
              className="mt-2 block rounded-full bg-[var(--brand-accent)] py-2.5 text-center text-[10px] font-bold text-white transition hover:brightness-95"
            >
              ACHETER SANS COMPTE
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
