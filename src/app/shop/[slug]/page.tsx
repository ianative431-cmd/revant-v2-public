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

  if (result.kind === "not_found") notFound();

  if (result.kind === "redirect") {
    permanentRedirect(`/shop/${result.toSlug}`);
  }

  const { shop } = result;
  const isDefaultType = !shop.is_restaurant && !shop.is_pro && !shop.is_premium;
  const typeLabel = isDefaultType ? null : getShopTypeLabel(shop);
  const products = await getActiveProductsForShop(supabase, shop.id);
  const hasContact = Boolean(shop.phone || shop.whatsapp || shop.instagram || shop.tiktok || shop.snapchat);

  return (
    <main
      className="min-h-screen bg-brand-bg px-3 py-6 text-brand-text sm:px-6 sm:py-10 bg-cover bg-center"
      style={shop.background_image_url ? { backgroundImage: `url(${shop.background_image_url})` } : undefined}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-[var(--brand-border)] bg-[var(--brand-surface)] text-brand-text shadow-xl">
        <div className="px-4 pt-4 sm:px-7 sm:pt-6">
          <Link
            href="/boutiques"
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--brand-muted)] hover:bg-[var(--brand-bg)] hover:text-brand-text"
          >
            <span aria-hidden="true">←</span>
            Toutes les boutiques
          </Link>
        </div>

        {shop.banner_url ? (
          <div className="relative mx-4 mt-3 h-40 overflow-hidden rounded-2xl bg-[var(--brand-bg)] sm:mx-7 sm:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element -- public banner URL stored in Supabase Storage */}
            <img src={shop.banner_url} alt={`Bannière de ${shop.name}`} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="mx-4 mt-3 h-24 rounded-2xl bg-[var(--brand-accent)] sm:mx-7 sm:h-32" />
        )}

        <section className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {shop.logo_url ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-[var(--brand-surface)] bg-[var(--brand-bg)] shadow-md sm:h-24 sm:w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element -- public logo URL stored in Supabase Storage */}
                  <img src={shop.logo_url} alt={`Logo de ${shop.name}`} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-accent)] text-3xl font-black text-white shadow-md sm:h-24 sm:w-24">
                  {shop.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{shop.name}</h1>
                  {typeLabel && (
                    <span className="rounded-full bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-bold text-[var(--brand-accent)]">
                      {typeLabel}
                    </span>
                  )}
                </div>
                {shop.city && <p className="mt-1 text-sm text-[var(--brand-muted)]">{shop.city}</p>}
                <p className="mt-1 text-xs font-medium text-[var(--brand-muted)]">
                  {products.length} {products.length > 1 ? "articles disponibles" : "article disponible"}
                </p>
              </div>
            </div>
            {shop.whatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp.replace(/\\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand-accent)] px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-95"
              >
                Contacter la boutique
              </a>
            )}
          </div>

          {shop.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-6 text-[var(--brand-muted)]">{shop.description}</p>
          )}

          {hasContact && (
            <div className="mt-5 flex flex-wrap gap-2">
              {shop.phone && (
                <a className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--brand-accent)]" href={`tel:${shop.phone.replace(/[^+\\d]/g, "")}`}>
                  Téléphone
                </a>
              )}
              {shop.whatsapp && (
                <a className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--brand-accent)]" href={`https://wa.me/${shop.whatsapp.replace(/\\D/g, "")}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              {shop.instagram && (
                <a className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--brand-accent)]" href={shop.instagram.startsWith("http") ? shop.instagram : `https://instagram.com/${shop.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              )}
              {shop.tiktok && (
                <a className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--brand-accent)]" href={shop.tiktok.startsWith("http") ? shop.tiktok : `https://tiktok.com/@${shop.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  TikTok
                </a>
              )}
              {shop.snapchat && (
                <a className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--brand-accent)]" href={shop.snapchat.startsWith("http") ? shop.snapchat : `https://snapchat.com/add/${shop.snapchat.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  Snapchat
                </a>
              )}
            </div>
          )}
        </section>

        <section className="border-t border-[var(--brand-border)] px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-accent)]">Catalogue</p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">Les produits de la boutique</h2>
            </div>
            <span className="text-xs font-semibold text-[var(--brand-muted)]">{products.length} article(s)</span>
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] px-5 py-12 text-center">
              <p className="text-base font-bold">La boutique prépare son catalogue</p>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">Les produits publiés apparaîtront ici avec leurs photos et leurs prix.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
