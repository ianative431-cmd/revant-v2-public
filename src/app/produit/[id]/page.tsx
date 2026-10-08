import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { getProductById } from "@/server/products/products";
import OrderButton from "./OrderButton";

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, id);

  if (!product) {
    notFound();
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("slug, name, owner_id")
    .eq("id", product.shop_id)
    .maybeSingle();

  const currentUser = await getCurrentUser();
  const isOwner = !!currentUser && !!shop && shop.owner_id === currentUser.id;
  const outOfStock = product.stock_quantity <= 0;
  const imageUrl = product.images[0] ?? null;

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm underline">
          ← Retour
        </Link>

        <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-text/5 mt-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-text/30">
              Pas de photo
            </div>
          )}
          {outOfStock && (
            <span className="absolute top-3 left-3 bg-brand-accent text-white text-xs font-medium px-3 py-1 rounded-full">
              Épuisé
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold mt-4">{product.name}</h1>
        <p className="text-lg font-semibold">
          {product.base_price.toLocaleString("fr-FR")} {product.currency}
        </p>
        {product.categoryName && (
          <p className="text-xs text-brand-text/60 mb-3">{product.categoryName}</p>
        )}

        {product.description && (
          <p className="text-sm whitespace-pre-line mb-6">{product.description}</p>
        )}

        {shop && (
          <Link
            href={`/shop/${shop.slug}`}
            className="block text-center border border-brand-accent rounded-full py-3 text-sm font-medium"
          >
            Voir la boutique {shop.name}
          </Link>
        )}

        {product.status === "active" && !outOfStock && !isOwner && (
          <div className="mt-3">
            {currentUser ? (
              <OrderButton productId={product.id} />
            ) : (
              <Link
                href="/connexion"
                className="block text-center bg-brand-accent text-white rounded-full py-3 text-sm font-medium"
              >
                Se connecter pour commander
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
