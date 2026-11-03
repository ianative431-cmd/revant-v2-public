import Image from "next/image";
import Link from "next/link";
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

  if (result.kind !== "found") return { title: "Boutique — Revant" };

  return {
    title: `${result.shop.name} — Revant`,
    description: result.shop.description ?? `Découvre les produits de ${result.shop.name} sur Revant.`,
    openGraph: {
      title: `${result.shop.name} — Revant`,
      description: result.shop.description ?? undefined,
      images: result.shop.banner_url ? [result.shop.banner_url] : result.shop.logo_url ? [result.shop.logo_url] : [],
    },
  };
}

function cleanPhone(value: string) {
  return value.replace(/[^+\d]/g, "");
}

function cleanWhatsApp(value: string) {
  return value.replace(/\D/g, "");
}

function externalProfile(value: string, baseUrl: string) {
  return value.startsWith("http") ? value : `${baseUrl}${value.replace(/^@/, "")}`;
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
  const backgroundUrl = shop.background_image_url;
  const safeBackgroundColor =
    shop.background_color && /^#[0-9a-f]{6}$/i.test(shop.background_color)
      ? shop.background_color
      : undefined;
  const initials = shop.name.trim().slice(0, 1).toLocaleUpperCase("fr");
  const hasContact =
    shop.phone || shop.whatsapp || shop.instagram || shop.tiktok || shop.snapchat;

  return (
    <main
      className="min-h-screen bg-brand-bg bg-cover bg-center px-3 py-5 text-brand-text sm:px-6 sm:py-9"
      style={{
        ...(backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")` } : {}),
        ...(safeBackgroundColor ? { backgroundColor: safeBackgroundColor } : {}),
      }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <Link href="/" aria-label="Revant, accueil" className="flex items-center gap-2">
            <Image src="/images/logo-revant.svg" alt="Revant" width={34} height={34} />
            <span className="text-lg font-black tracking-tight">REVANT</span>
          </Link>
          <nav aria-label="Navigation de la boutique" className="flex items-center gap-3 text-xs font-semibold sm:gap-5 sm:text-sm">
            <Link href="/boutiques" className="text-brand-text/70 transition hover:text-brand-accent">Toutes les boutiques</Link>
            <Link href="/#produits" className="hidden text-brand-text/70 transition hover:text-brand-accent sm:inline">Explorer les produits</Link>
          </nav>
        </header>

        <Link href="/boutiques" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-brand-text/75 shadow-sm transition hover:bg-white">
          <span aria-hidden="true">←</span> Retour aux boutiques
        </Link>

        <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white/95 shadow-xl shadow-black/10 backdrop-blur-sm">
          <div className="relative">
            {shop.banner_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- public shop banner stored in Supabase Storage
              <img src={shop.banner_url} alt="" className="h-48 w-full object-cover sm:h-64 lg:h-72" />
            ) : (
              <div className="h-40 w-full bg-gradient-to-br from-brand-surface via-brand-accent to-brand-bg sm:h-56" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />
            <span className="absolute right-4 top-4 rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              Boutique sur Revant
            </span>
          </div>

          <div className="relative px-4 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-3 sm:gap-4">
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- public shop logo stored in Supabase Storage
                  <img src={shop.logo_url} alt={`Logo de ${shop.name}`} className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-lg sm:h-28 sm:w-28" />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-brand-surface text-3xl font-black text-brand-on-surface shadow-lg sm:h-28 sm:w-28">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl">{shop.name}</h1>
                    {shop.is_premium && <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">Premium</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-text/60">
                    {shop.city && <span>{shop.city}</span>}
                    {shop.city && <span aria-hidden="true">·</span>}
                    <span>{typeLabel ?? "Boutique"}</span>
                  </div>
                </div>
              </div>

              {shop.whatsapp && (
                <a href={`https://wa.me/${cleanWhatsApp(shop.whatsapp)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1f8f55] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#187344] sm:mb-1">
                  <span aria-hidden="true">◉</span> Contacter sur WhatsApp
                </a>
              )}
            </div>

            {shop.description && <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-7 text-brand-text/75">{shop.description}</p>}

            {hasContact && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-black/5 pt-5">
                {shop.phone && <a href={`tel:${cleanPhone(shop.phone)}`} className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold transition hover:border-brand-accent hover:text-brand-accent">Téléphone</a>}
                {shop.whatsapp && <a href={`https://wa.me/${cleanWhatsApp(shop.whatsapp)}`} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold transition hover:border-brand-accent hover:text-brand-accent">WhatsApp</a>}
                {shop.instagram && <a href={externalProfile(shop.instagram, "https://instagram.com/")} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold transition hover:border-brand-accent hover:text-brand-accent">Instagram</a>}
                {shop.tiktok && <a href={externalProfile(shop.tiktok, "https://tiktok.com/@")} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold transition hover:border-brand-accent hover:text-brand-accent">TikTok</a>}
                {shop.snapchat && <a href={externalProfile(shop.snapchat, "https://snapchat.com/add/")} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold transition hover:border-brand-accent hover:text-brand-accent">Snapchat</a>}
              </div>
            )}
          </div>
        </section>

        <section id="produits" className="mt-7 rounded-[28px] border border-black/5 bg-white/95 p-4 shadow-lg shadow-black/5 backdrop-blur-sm sm:mt-9 sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-accent">La sélection de la boutique</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Nos produits</h2>
              <p className="mt-1 text-xs text-brand-text/55">{products.length} article{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}</p>
            </div>
            <Link href="/boutiques" className="text-xs font-bold text-brand-accent underline underline-offset-4">Découvrir d’autres boutiques</Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-brand-bg/20 px-5 py-12 text-center">
              <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg text-2xl">⌂</div>
              <h3 className="mt-4 text-base font-bold">La boutique prépare ses produits</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-text/60">Aucun produit n’est publié pour le moment. Reviens bientôt pour découvrir les nouveautés.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>

        <footer className="py-7 text-center text-[11px] font-medium text-white drop-shadow">
          <Link href="/" className="underline underline-offset-4">Revant</Link>
          <span className="mx-2">·</span>
          Marketplace du Niger
        </footer>
      </div>
    </main>
  );
}
