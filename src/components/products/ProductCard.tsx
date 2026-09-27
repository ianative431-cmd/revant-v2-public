import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { getCategoryLabel } from "@/content/products/categories";
import { productImagePublicUrl } from "@/lib/product-image";

function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export default function ProductCard({
  product,
  supabaseUrl,
}: {
  product: Product;
  supabaseUrl: string;
}) {
  const imageUrl = productImagePublicUrl(supabaseUrl, product.image_path);

  return (
    <Link href={`/produit/${product.id}`} className="block">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/5">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover"
        />
        {product.status === "sold" && (
          <span className="absolute top-2 left-2 bg-black text-white text-[11px] font-medium px-2 py-1 rounded-full">
            Vendu
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium truncate">{product.title}</p>
      <p className="text-xs text-black/60">{getCategoryLabel(product.category)}</p>
      <p className="text-sm font-semibold">{formatFcfa(product.price_fcfa)}</p>
    </Link>
  );
}
