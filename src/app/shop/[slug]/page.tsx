import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductCard from "@/components/products/ProductCard";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProductsForShop } from "@/server/products/products";
import { resolveShopBySlug } from "@/server/shops/shops";

type Props = { params: Promise<{ slug: string }> };

const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", host: "instagram.com" },
  { key: "tiktok", label: "TikTok", host: "tiktok.com" },
  { key: "snapchat", label: "Snapchat", host: "snapchat.com" },
] as const;

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const image = new URL(value);
    const configuredStorage = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredStorage) return null;
    const storage = new URL(configuredStorage);
    const allowedPath = "/storage/v1/object/public/shop-media/";
    if (
      image.protocol !== "https:" ||
      image.origin !== storage.origin ||
      image.username ||
      image.password ||
      !image.pathname.startsWith(allowedPath)
    ) return null;
    return image.toString();
  } catch {
    return null;
  }
}

function safeSocialUrl(value: string | null, host: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const candidate = /^https?:\/\//i.test(raw)
      ? raw
      : `https://${host}/${raw.replace(/^@/, "")}`;
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== host && !url.hostname.endsWith(`.${host}`))
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function safePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? digits : null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);
  if (result.kind !== "found") return { title: "Boutique — Revant" };

  const image = safeImageUrl(result.shop.banner_url) ?? safeImageUrl(result.shop.logo_url);
  return {
    title: `${result.shop.name} — Revant`,
    description: result.shop.description ?? `Découvrez les produits de ${result.shop.name} sur Revant.`,
    openGraph: {
      title: `${result.shop.name} — Revant`,
      description: result.shop.description ?? undefined,
      images: image ? [image] : [],
    },
  };
}

export default async function ShopPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind === "not_found") notFound();
  if (result.kind === "redirect") permanentRedirect(`/shop/${result.toSlug}`);

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
    : "#F46A18";
  const socials = SOCIAL_NETWORKS.flatMap((network) => {
    const value = shop[network.key];
    const href = safeSocialUrl(value, network.host);
    return href ? [{ label: network.label, href }] : [];
  });
  const location = [shop.city, shop.country_code].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] pb-24 text-[var(--brand-text)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] px-3 pb-10 pt-4 sm:px-6 sm:pt-6">
        <nav aria-label="Fil d’Ariane" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--brand-muted)]">
          <Link href="/" className="transition hover:text-[var(--brand-accent)]">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link href="/boutiques" className="transition hover:text-[var(--brand-accent)]">Boutiques</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="max-w-[55vw] truncate font-semibold text-[var(--brand-text)]">{shop.name}</span>
        </nav>

        <section id="accueil" aria-labelledby="shop-title" className="overflow-hidden rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-[0_14px_42px_rgba(20,43,69,0.08)] sm:rounded-[32px]">
          <div
            role={bannerUrl ? "img" : undefined}
            aria-label={bannerUrl ? `Bannière de ${shop.name}` : undefined}
            className="relative h-40 overflow-hidden bg-cover bg-center sm:h-56 lg:h-64"
            style={{
              backgroundColor: shopColor,
              backgroundImage: bannerUrl
                ? `linear-gradient(100deg, rgba(20,29,38,.62), rgba(20,29,38,.08)), url("${bannerUrl}")`
                : "linear-gradient(115deg, var(--brand-accent), #F9A36B 58%, #F7D7BD)",
            }}
          >
            {!bannerUrl && (
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white/20 sm:text-8xl">
                {shop.name.slice(0, 1).toLocaleUpperCase("fr")}
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-7 sm:bottom-6">
              <span className="rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                Vitrine officielle Revant
              </span>
              {shop.is_premium && (
                <span className="rounded-full border border-amber-100/60 bg-amber-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900 shadow-sm">
                  Premium
                </span>
              )}
            </div>
          </div>

          <div className="relative px-4 pb-5 pt-14 sm:px-8 sm:pb-7 sm:pt-16">
            <div
              role={logoUrl ? "img" : undefined}
              aria-label={logoUrl ? `Logo de ${shop.name}` : undefined}
              className="absolute -top-11 left-4 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[22px] border-[5px] border-[var(--brand-surface)] bg-cover bg-center text-3xl font-black text-white shadow-xl sm:left-8 sm:h-28 sm:w-28 sm:rounded-[26px]"
              style={{
                backgroundColor: shopColor,
                backgroundImage: logoUrl ? `url("${logoUrl}")` : undefined,
              }}
            >
              {!logoUrl && shop.name.slice(0, 1).toLocaleUpperCase("fr")}
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 id="shop-title" className="text-2xl font-black tracking-tight sm:text-3xl">{shop.name}</h1>
                  {typeLabel && (
                    <span className="rounded-full bg-[var(--brand-bg)] px-3 py-1 text-[10px] font-bold text-[var(--brand-muted)]">{typeLabel}</span>
                  )}
                  {shop.is_premium && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold text-amber-900">Premium</span>
                  )}
                </div>
                {location && (
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[var(--brand-muted)]">
                    <span aria-hidden="true">⌖</span>{location}
                  </p>
                )}
                {shop.description && (
                  <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-[var(--brand-muted)]">{shop.description}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {whatsappDigits && (
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#128C7E] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0d7569] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]">
                    WhatsApp <span aria-hidden="true">↗</span>
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--brand-border)] px-5 text-xs font-bold text-[var(--brand-text)] transition hover:bg-[var(--brand-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]">
                    Appeler
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <nav aria-label="Navigation de la boutique" className="mt-4 flex items-center gap-1 overflow-x-auto rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <a href="#accueil" className="shrink-0 rounded-full bg-[var(--brand-accent)] px-4 py-2.5 text-[11px] font-extrabold text-white">Accueil boutique</a>
          <a href="#produits" className="shrink-0 rounded-full px-4 py-2.5 text-[11px] font-bold text-[var(--brand-muted)] transition hover:bg-[var(--brand-bg)] hover:text-[var(--brand-text)]">Produits ({products.length})</a>
          <a href="#apropos" className="shrink-0 rounded-full px-4 py-2.5 text-[11px] font-bold text-[var(--brand-muted)] transition hover:bg-[var(--brand-bg)] hover:text-[var(--brand-text)]">À propos & contact</a>
        </nav>

        <section id="produits" aria-labelledby="products-title" className="mt-5 scroll-mt-24 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:mt-7 sm:rounded-[30px] sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[var(--brand-accent)]">La sélection de la boutique</p>
              <h2 id="products-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Les produits</h2>
              <p className="mt-1 text-xs text-[var(--brand-muted)]">{products.length} article{products.length > 1 ? "s" : ""} publié{products.length > 1 ? "s" : ""}</p>
            </div>
            <Link href="/boutiques" className="rounded-full border border-[var(--brand-border)] px-4 py-2.5 text-[10px] font-bold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]">
              Explorer les boutiques <span aria-hidden="true">→</span>
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] px-5 py-12 text-center">
              <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-surface)] text-2xl shadow-sm">◇</div>
              <h3 className="mt-4 text-base font-extrabold">La boutique prépare ses produits</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--brand-muted)]">Aucun produit n’est publié pour le moment. Reviens bientôt pour découvrir les nouveautés.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>

        <section id="apropos" aria-labelledby="about-title" className="mt-5 grid scroll-mt-24 gap-4 lg:mt-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:rounded-[30px] sm:p-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[var(--brand-accent)]">Découvrez le vendeur</p>
            <h2 id="about-title" className="mt-1 text-xl font-black tracking-tight">À propos de la boutique</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--brand-muted)]">
              {shop.description || "Retrouvez ici les informations et les produits publiés par cette boutique sur Revant."}
            </p>
            {location && (
              <p className="mt-5 flex items-center gap-2 border-t border-[var(--brand-border)] pt-4 text-xs font-semibold text-[var(--brand-text)]">
                <span aria-hidden="true">⌖</span>{location}
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:rounded-[30px] sm:p-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[var(--brand-accent)]">Échangez avec le vendeur</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Contact & réseaux</h2>
            <div className="mt-4 grid gap-2">
              {phone && (
                <a href={`tel:${phone}`} className="flex min-h-12 items-center justify-between rounded-2xl border border-[var(--brand-border)] px-4 text-xs font-semibold transition hover:border-[var(--brand-accent)]">
                  <span>Téléphone</span><span className="text-[var(--brand-muted)]">{shop.phone}</span>
                </a>
              )}
              {whatsappDigits && (
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between rounded-2xl border border-[var(--brand-border)] px-4 text-xs font-semibold transition hover:border-[#128C7E]">
                  <span>WhatsApp</span><span className="text-[#128C7E]">Contacter ↗</span>
                </a>
              )}
              {socials.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between rounded-2xl border border-[var(--brand-border)] px-4 text-xs font-semibold transition hover:border-[var(--brand-accent)]">
                  <span>{social.label}</span><span className="text-[var(--brand-muted)]">Ouvrir ↗</span>
                </a>
              ))}
              {!phone && !whatsappDigits && socials.length === 0 && (
                <p className="rounded-2xl bg-[var(--brand-bg)] px-4 py-5 text-xs leading-6 text-[var(--brand-muted)]">Aucun moyen de contact public n’a été renseigné pour cette boutique.</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
