import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveShopBySlug } from "@/server/shops/shops";
import { getProductsForShop } from "@/server/products/products";
import ProductCard from "@/components/products/ProductCard";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { getPaletteById } from "@/content/shops/color-palettes";

type Props = { params: Promise<{ slug: string }> };

function safeSocialLink(value: string | null, platform: "instagram" | "tiktok" | "snapchat"): string | null {
  if (!value?.trim()) return null;
  const hosts = { instagram: ["instagram.com", "www.instagram.com"], tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"], snapchat: ["snapchat.com", "www.snapchat.com"] };
  const raw = value.trim();
  if (/^https:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return hosts[platform].includes(url.hostname.toLowerCase()) ? url.toString() : null;
    } catch { return null; }
  }
  const handle = raw.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  if (!handle || /[\s/?#]/.test(handle)) return null;
  const paths = { instagram: `https://www.instagram.com/${encodeURIComponent(handle)}/`, tiktok: `https://www.tiktok.com/@${encodeURIComponent(handle)}`, snapchat: `https://www.snapchat.com/add/${encodeURIComponent(handle)}` };
  return paths[platform];
}

function whatsappHref(value: string | null, countryCode: string): string | null {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (countryCode.toUpperCase() === "NE" && digits.length === 8) digits = `227${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);
  if (result.kind !== "found") return { title: "Boutique — Revant" };
  return {
    title: `${result.shop.name} — Revant`,
    description: result.shop.description ?? `Découvrez les produits de ${result.shop.name} sur Revant.`,
    openGraph: {
      title: `${result.shop.name} — Revant`,
      description: result.shop.description ?? undefined,
      images: result.shop.banner_url ? [result.shop.banner_url] : result.shop.logo_url ? [result.shop.logo_url] : [],
    },
  };
}

export default async function ShopPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);
  if (result.kind !== "found") notFound();

  const { shop } = result;
  const products = await getProductsForShop(supabase, shop.id);
  const palette = shop.background_color ? getPaletteById(shop.background_color) : undefined;
  const surfaceColor = palette?.colors[palette.colors.length - 1] ?? "#F7F3EF";
  const customBackground = shop.background_image_url && /^https:\/\//i.test(shop.background_image_url)
    ? `url(${JSON.stringify(shop.background_image_url)})`
    : undefined;
  const bannerUrl = shop.banner_url || shop.background_image_url;
  const contactNumber = shop.whatsapp || shop.phone;
  const whatsapp = whatsappHref(contactNumber, shop.country_code);
  const instagram = safeSocialLink(shop.instagram, "instagram");
  const tiktok = safeSocialLink(shop.tiktok, "tiktok");
  const snapchat = safeSocialLink(shop.snapchat, "snapchat");

  return (
    <main className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundColor: surfaceColor, backgroundImage: customBackground ? `linear-gradient(rgba(247,243,239,.78), rgba(247,243,239,.88)), ${customBackground}` : undefined }}>
      <div className="mx-auto w-full max-w-6xl px-3 pb-16 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-neutral-600 transition hover:text-neutral-950">← Revant</Link>
          <span className="text-xs font-semibold tracking-[0.18em] text-neutral-400">REVANT MARKETPLACE</span>
        </div>

        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <div className="relative h-44 bg-neutral-200 sm:h-64">
            {bannerUrl ? <Image src={bannerUrl} alt={`Bannière de ${shop.name}`} fill priority sizes="100vw" className="object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#A79986] via-[#803E2F] to-[#1F1D20]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 sm:bottom-5 sm:left-8 sm:right-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">Boutique officielle sur Revant</p>
              {shop.is_premium && <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">Premium</span>}
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-neutral-100 shadow-md sm:h-24 sm:w-24">
                {shop.logo_url ? <Image src={shop.logo_url} alt={`Logo de ${shop.name}`} fill sizes="96px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#803E2F]">{shop.name.trim().charAt(0).toUpperCase()}</div>}
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1F7A4D] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17633E]">Contacter sur WhatsApp</a>}
                {shop.phone && <a href={`tel:${shop.phone.replace(/[^+\d]/g, "")}`} className="rounded-full border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-700">Appeler</a>}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">{shop.name}</h1>
              {shop.is_pro && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">Boutique Pro</span>}
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">{getShopTypeLabel(shop)}</span>
            </div>
            {shop.description && <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-neutral-600">{shop.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500">
              {shop.city && <span>{shop.city}{shop.country_code ? ` · ${shop.country_code}` : ""}</span>}
              <span>Sur Revant depuis {new Date(shop.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
              {contactNumber && <span>Contact disponible</span>}
            </div>
            {(instagram || tiktok || snapchat) && <nav aria-label="Réseaux sociaux de la boutique" className="mt-4 flex flex-wrap gap-2">{instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">Instagram ↗</a>}{tiktok && <a href={tiktok} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">TikTok ↗</a>}{snapchat && <a href={snapchat} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">Snapchat ↗</a>}</nav>}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#803E2F]">Le catalogue</p><h2 className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">Les produits de {shop.name}</h2></div>
            <span className="text-xs font-medium text-neutral-500">{products.length} article{products.length > 1 ? "s" : ""}</span>
          </div>
          {products.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-6 py-14 text-center"><p className="text-sm font-semibold text-neutral-700">Cette boutique prépare son catalogue.</p><p className="mt-2 text-xs text-neutral-500">Les produits disponibles apparaîtront ici.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
        </section>
      </div>
    </main>
  );
}
