import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveShopBySlug } from "@/server/shops/shops";
import { getActiveProductsForShop } from "@/server/products/products";
import ProductCard from "@/components/products/ProductCard";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";

type Props = { params: Promise<{ slug: string }> };

const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", host: "instagram.com" },
  { key: "tiktok", label: "TikTok", host: "tiktok.com" },
  { key: "snapchat", label: "Snapchat", host: "snapchat.com" },
] as const;

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeSocialUrl(value: string | null, host: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${host}/${raw.replace(/^@/, "")}`;
    const url = new URL(candidate);
    if (url.protocol !== "https:" || (url.hostname !== host && !url.hostname.endsWith(`.${host}`))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function safePhone(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? digits : null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind !== "found") {
    return { title: "Boutique — Revant" };
  }
  return {
    title: `${result.shop.name} — Revant`,
    description: result.shop.description ?? `Découvrez les produits de ${result.shop.name} sur Revant.`,
  };
}

export default async function ShopPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind === "not_found") notFound();

  if (result.kind === "redirect") {
    permanentRedirect(`/shop/${result.toSlug}`);
  }

  const { shop } = result;
  const isDefaultType = !shop.is_restaurant && !shop.is_pro && !shop.is_premium;
  const typeLabel = isDefaultType ? null : getShopTypeLabel(shop);
  const products = await getActiveProductsForShop(supabase, shop.id);
  const bannerUrl = safeImageUrl(shop.banner_url) ?? safeImageUrl(shop.background_image_url);
  const logoUrl = safeImageUrl(shop.logo_url);
  const phone = safePhone(shop.phone);
  const whatsapp = safePhone(shop.whatsapp ?? shop.phone);
  const whatsappDigits = whatsapp?.replace(/\D/g, "");
  const shopColor = shop.background_color && /^#[0-9a-fA-F]{6}$/.test(shop.background_color)
    ? shop.background_color
    : "#A79986";
  const socials = SOCIAL_NETWORKS.flatMap((network) => {
    const value = shop[network.key];
    const href = safeSocialUrl(value, network.host);
    return href ? [{ label: network.label, href }] : [];
  });

  return (
    <div className="min-h-screen bg-[#f5f3f0] pb-24 text-[#1f1d20]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1440px] px-3 pb-10 pt-4 sm:px-6 sm:pt-6">
        <nav aria-label="Fil d’Ariane" className="mb-4 text-xs text-neutral-500">
          <Link href="/" className="hover:text-black">Accueil</Link>
          <span className="px-2">/</span>
          <Link href="/boutiques" className="hover:text-black">Boutiques</Link>
          <span className="px-2">/</span>
          <span className="font-medium text-neutral-800">{shop.name}</span>
        </nav>

        <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div
            role={bannerUrl ? "img" : undefined}
            aria-label={bannerUrl ? `Bannière de ${shop.name}` : undefined}
            className="relative h-40 bg-cover bg-center sm:h-56 lg:h-72"
            style={{
              backgroundColor: shopColor,
              backgroundImage: bannerUrl ? `linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,.04)), url("${bannerUrl}")` : undefined,
            }}
          >
            {!bannerUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white/25 sm:text-7xl">
                {shop.name.slice(0, 1).toLocaleUpperCase()}
              </div>
            )}
            <div className="absolute left-4 top-4">
              <Link href="/boutiques" className="inline-flex rounded-full border border-white/30 bg-black/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/55">
                ← Toutes les boutiques
              </Link>
            </div>
          </div>

          <div className="relative px-4 pb-5 pt-14 sm:px-7 sm:pb-7">
            <div
              role={logoUrl ? "img" : undefined}
              aria-label={logoUrl ? `Logo de ${shop.name}` : undefined}
              className="absolute -top-12 left-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white bg-cover bg-center text-3xl font-black text-white shadow-md sm:left-7 sm:h-28 sm:w-28"
              style={{
                backgroundColor: shopColor,
                backgroundImage: logoUrl ? `url("${logoUrl}")` : undefined,
              }}
            >
              {!logoUrl && shop.name.slice(0, 1).toLocaleUpperCase()}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{shop.name}</h1>
                  {typeLabel && <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-700">{typeLabel}</span>}
                  {shop.is_premium && <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">Premium</span>}
                </div>
                {shop.city && <p className="mb-2 text-sm text-neutral-500">📍 {shop.city}{shop.country_code ? `, ${shop.country_code}` : ""}</p>}
                {shop.description && <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-neutral-600">{shop.description}</p>}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {whatsappDigits && (
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#128C7E] px-5 text-xs font-bold text-white transition hover:bg-[#0d7569]">
                    WhatsApp
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-300 px-5 text-xs font-bold text-neutral-800 transition hover:bg-neutral-100">
                    Appeler
                  </a>
                )}
              </div>
            </div>

            {(shop.phone || shop.whatsapp || socials.length > 0) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-100 pt-4 text-xs">
                {shop.phone && <span className="text-neutral-500">Téléphone : <span className="font-semibold text-neutral-800">{shop.phone}</span></span>}
                {shop.whatsapp && <span className="text-neutral-500">WhatsApp : <span className="font-semibold text-neutral-800">{shop.whatsapp}</span></span>}
                {socials.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:text-black">
                    {social.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="produits" className="mt-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-500">Le catalogue</p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">Les produits de la boutique</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-neutral-600 shadow-sm">
              {products.length} {products.length > 1 ? "produits" : "produit"}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl" aria-hidden="true">🛍️</div>
              <h3 className="text-sm font-bold text-neutral-800">La boutique prépare ses premières annonces</h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-neutral-500">Les produits publiés par cette boutique apparaîtront ici dès qu’ils seront disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
