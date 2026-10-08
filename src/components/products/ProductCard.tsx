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
    <Link href={`/produit/${product.id}`} className="block">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-text/5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-text/30">
            Pas de photo
          </div>
        )}
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-brand-accent text-white text-[11px] font-medium px-2 py-1 rounded-full">
            Épuisé
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
      {product.categoryName && (
        <p className="text-xs text-brand-text/60">{product.categoryName}</p>
      )}
      <p className="text-sm font-semibold">{formatPrice(product.base_price, product.currency)}</p>
    </Link>
  );
}
