import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { getProductById } from "@/server/products/products";
import { getCategoryLabel } from "@/content/products/categories";
import { productImagePublicUrl } from "@/lib/product-image";
import { officialBackgroundPublicUrl } from "@/lib/background-image";
import { env } from "@/lib/env";
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

  const imageUrl = productImagePublicUrl(env.supabaseUrl(), product.image_path);

  // Arrière-plan de présentation (section 5 / 9 du prompt maître
  // "arrière-plans") : affiché derrière la photo, qui garde ses
  // proportions d'origine (object-contain plutôt que cover ici).
  let productBackgroundUrl: string | null = null;
  if (product.background_id) {
    const { data: bg } = await supabase
      .from("backgrounds")
      .select("image_path")
      .eq("id", product.background_id)
      .eq("is_active", true)
      .maybeSingle();
    if (bg) productBackgroundUrl = officialBackgroundPublicUrl(env.supabaseUrl(), bg.image_path);
  }

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm underline">
          ← Retour
        </Link>

        <div
          className="relative aspect-square rounded-2xl overflow-hidden bg-black/5 mt-4 bg-cover bg-center"
          style={productBackgroundUrl ? { backgroundImage: `url(${productBackgroundUrl})` } : undefined}
        >
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="100vw"
            className={productBackgroundUrl ? "object-contain p-6" : "object-cover"}
          />
          {product.status === "sold" && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
              Vendu
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold mt-4">{product.title}</h1>
        <p className="text-lg font-semibold">{product.price_fcfa.toLocaleString("fr-FR")} FCFA</p>
        <p className="text-xs text-black/60 mb-3">{getCategoryLabel(product.category)}</p>

        {product.description && (
          <p className="text-sm whitespace-pre-line mb-6">{product.description}</p>
        )}

        {shop && (
          <Link
            href={`/shop/${shop.slug}`}
            className="block text-center border border-black rounded-full py-3 text-sm font-medium"
          >
            Voir la boutique {shop.name}
          </Link>
        )}

        {product.status === "active" && !isOwner && (
          <div className="mt-3">
            {currentUser ? (
              <OrderButton productId={product.id} />
            ) : (
              <Link
                href="/connexion"
                className="block text-center bg-black text-white rounded-full py-3 text-sm font-medium"
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
