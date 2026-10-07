import { notFound, permanentRedirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveShopBySlug } from "@/server/shops/shops";
import { getProductsForShop } from "@/server/products/products";
import ProductCard from "@/components/products/ProductCard";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind !== "found") {
    return { title: "Boutique — Revant" };
  }
  return {
    title: `${result.shop.name} — Revant`,
    description: result.shop.description ?? undefined,
  };
}

export default async function ShopPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind === "not_found") {
    notFound();
  }

  if (result.kind === "redirect") {
    // Ancien lien de boutique : redirection permanente vers la nouvelle
    // adresse (section 7 du prompt maître), le Revant ID de la boutique
    // n'a jamais changé.
    permanentRedirect(`/shop/${result.toSlug}`);
  }

  const { shop } = result;
  const isDefaultType = !shop.is_restaurant && !shop.is_pro && !shop.is_premium;
  const typeLabel = isDefaultType ? null : getShopTypeLabel(shop);
  const products = await getProductsForShop(supabase, shop.id);

  // Arrière-plan de la boutique : image personnalisée si définie, sinon
  // fallback silencieux vers le fond beige par défaut de Revant (jamais
  // d'image cassée).
  const backgroundUrl = shop.background_image_url;

  return (
    <div
      className="min-h-screen bg-[#F3E9DA] px-4 py-10 bg-cover bg-center"
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
    >
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-[22px] p-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          {typeLabel && (
            <span className="text-xs font-medium bg-black/5 rounded-full px-2 py-1">
              {typeLabel}
            </span>
          )}
        </div>

        {shop.description && (
          <p className="text-sm text-black/80 mb-6 whitespace-pre-line">{shop.description}</p>
        )}

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-black/60 mb-3">Produits</h2>
          {products.length === 0 ? (
            <p className="text-sm text-black/40">Aucun article pour l&apos;instant.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
