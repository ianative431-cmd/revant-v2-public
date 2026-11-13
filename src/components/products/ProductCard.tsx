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
    <article className="revant-card group relative overflow-hidden rounded-[22px] border border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--brand-text)] shadow-[0_5px_20px_rgba(20,43,69,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(20,43,69,0.13)] focus-within:border-[var(--brand-accent)]">
      <Link
        href={`/produit/${product.id}`}
        aria-label={`Voir le produit : ${product.name}`}
        className="block rounded-t-[22px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--brand-accent)]"
      >
        <div className="revant-card-media relative aspect-square overflow-hidden bg-[var(--brand-bg)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.055]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--brand-surface)] via-[var(--brand-bg)] to-[var(--brand-border)] px-2 text-center text-xs font-medium text-[var(--brand-muted)]">
              <span aria-hidden="true" className="text-2xl">◇</span>
              Photo indisponible
            </div>
          )}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />
          {product.categoryName && (
            <span className="absolute left-2 top-2 max-w-[75%] truncate rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#20252B] shadow-sm backdrop-blur-sm">
              {product.categoryName}
            </span>
          )}
          {outOfStock && (
            <span className="absolute bottom-2 right-2 rounded-full bg-[#20252B]/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              Épuisé
            </span>
          )}
        </div>
        <div className="revant-card-content px-3 pt-3">
          <p className="line-clamp-2 min-h-10 text-[13px] font-bold leading-snug tracking-[-0.01em]">{product.name}</p>
          <p className="mt-2 text-[15px] font-black tracking-tight text-[var(--brand-accent)]">
            {formatPrice(product.base_price, product.currency)}
          </p>
        </div>
      </Link>
      <div className="px-3 pb-3 pt-3">
        {outOfStock ? (
          <span className="block rounded-full bg-[var(--brand-border)] py-2.5 text-center text-[10px] font-bold tracking-wide text-[var(--brand-muted)]">
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
              className="mt-2 block rounded-full bg-[var(--brand-accent)] py-2.5 text-center text-[10px] font-extrabold tracking-wide text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
            >
              ACHETER SANS COMPTE
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
