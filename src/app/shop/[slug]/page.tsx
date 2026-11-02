import { notFound, permanentRedirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveShopBySlug } from "@/server/shops/shops";
import { getActiveProductsForShop } from "@/server/products/products";
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
  const products = await getActiveProductsForShop(supabase, shop.id);

  // Arrière-plan de la boutique : image personnalisée si définie, sinon
  // fallback silencieux vers le fond beige par défaut de Revant (jamais
  // d'image cassée).
  const backgroundUrl = shop.background_image_url;

  return (
    <div
      className="min-h-screen bg-brand-bg px-4 py-10 bg-cover bg-center"
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
    >
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-[22px] p-5 sm:p-8">
        {shop.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element -- public shop banner URL from Supabase Storage
          <img src={shop.banner_url} alt="" className="w-full h-36 sm:h-48 object-cover rounded-2xl mb-5" />
        )}
        <div className="flex items-center gap-3 mb-3">
          {shop.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- public shop logo URL from Supabase Storage
            <img src={shop.logo_url} alt="" className="w-16 h-16 rounded-full object-cover border border-black/10" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{shop.name}</h1>
              {typeLabel && (
                <span className="text-xs font-medium bg-brand-text/5 rounded-full px-2 py-1">
                  {typeLabel}
                </span>
              )}
            </div>
            {shop.city && <p className="text-xs text-brand-text/60 mt-1">{shop.city}</p>}
          </div>
        </div>

        {shop.description && (
          <p className="text-sm text-brand-text/80 mb-6 whitespace-pre-line">{shop.description}</p>
        )}

        {(shop.phone || shop.whatsapp || shop.instagram || shop.tiktok || shop.snapchat) && (
          <div className="flex flex-wrap gap-3 text-sm mb-6">
            {shop.phone && <a className="underline" href={`tel:${shop.phone.replace(/[^+\\d]/g, "")}`}>Téléphone</a>}
            {shop.whatsapp && <a className="underline" href={`https://wa.me/${shop.whatsapp.replace(/\\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
            {shop.instagram && <a className="underline" href={shop.instagram.startsWith("http") ? shop.instagram : `https://instagram.com/${shop.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">Instagram</a>}
            {shop.tiktok && <a className="underline" href={shop.tiktok.startsWith("http") ? shop.tiktok : `https://tiktok.com/@${shop.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer">TikTok</a>}
            {shop.snapchat && <a className="underline" href={shop.snapchat.startsWith("http") ? shop.snapchat : `https://snapchat.com/add/${shop.snapchat.replace(/^@/, "")}`} target="_blank" rel="noreferrer">Snapchat</a>}
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-brand-text/60 mb-3">Produits</h2>
          {products.length === 0 ? (
            <p className="text-sm text-brand-text/40">Aucun article pour l&apos;instant.</p>
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
