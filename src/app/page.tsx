import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";
import { getActiveShops } from "@/server/shops/shops";
import { getCategoryCoverImage } from "@/content/products/category-cover-images";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import RevantMegaShortcuts from "@/components/layout/RevantMegaShortcuts";
import InfiniteProductFeed from "@/components/products/InfiniteProductFeed";
import HeroCarousel from "@/components/home/HeroCarousel";

type Props = { searchParams: Promise<{ categorie?: string; q?: string }> };

const HERO_PHOTO = "/images/hero/accueil-dunes.jpg";

function safeShopBanner(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const image = new URL(value);
    const configuredStorage = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredStorage) return null;
    const storage = new URL(configuredStorage);
    if (
      image.protocol !== "https:" ||
      image.origin !== storage.origin ||
      image.username ||
      image.password ||
      !image.pathname.startsWith("/storage/v1/object/public/shop-media/")
    ) return null;
    return image.toString();
  } catch {
    return null;
  }
}

const HERO_SLIDES = [{
  id: "revant-editorial",
  eyebrow: "DÉCOUVRIR · ACHETER · VENDRE",
  title: "Le commerce local,",
  accent: "autrement.",
  description: "Des boutiques, des produits et des savoir-faire à découvrir. Une nouvelle façon de faire son marché, simplement et avec confiance.",
  ctaLabel: "Explorer les produits",
  ctaHref: "#produits",
  secondaryLabel: "Voir les boutiques",
  secondaryHref: "/boutiques",
  image: HERO_PHOTO,
}] as const;

export default async function Home({ searchParams }: Props) {
  const { categorie, q } = await searchParams;
  // Le catalogue public ne doit jamais être bloqué par l'absence de session
  // ou par une indisponibilité temporaire de la configuration Supabase.
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  let loadedProducts: Awaited<ReturnType<typeof getActiveProducts>> = [];
  let shops: Awaited<ReturnType<typeof getActiveShops>> = [];
  let certifiedShopIds = new Set<string>();
  let categoriesUnavailable = false;
  let productsUnavailable = false;
  let shopsUnavailable = false;
  try {
    const supabase = await createSupabaseServerClient();
    try {
      categories = await getActiveCategories(supabase);
    } catch {
      categoriesUnavailable = true;
    }
    const productType = categorie === "mode" ? "clothing" : categorie === "parfums" ? "perfume" : undefined;
    const categoryId = productType ? undefined : categories.find((c) => c.slug === categorie)?.id;
    if (categorie && !productType && categoriesUnavailable) {
      productsUnavailable = true;
    } else if (categorie && !productType && !categoryId) {
      loadedProducts = [];
    } else {
      try {
        loadedProducts = await getActiveProducts(supabase, { categoryId, productType, limit: 24, searchTerm: q?.trim() || undefined });
      } catch {
        productsUnavailable = true;
      }
    }
    try {
      shops = await getActiveShops(supabase, {
        limit: q?.trim() ? 24 : 8,
        searchTerm: q?.trim() || undefined,
      });
    } catch {
      shopsUnavailable = true;
    }
    if (shops.length > 0) {
      try {
        const { data: certifications, error: certificationError } = await supabase.from("certifications").select("shop_id").eq("type", "shop").eq("status", "approved").in("shop_id", shops.map((shop) => shop.id));
        if (!certificationError) certifiedShopIds = new Set((certifications ?? []).map((item) => item.shop_id));
      } catch {
        certifiedShopIds = new Set();
      }
    }
  } catch {
    categoriesUnavailable = true;
    productsUnavailable = true;
    shopsUnavailable = true;
  }
  const fallbackCategories = [
    { id: "virtual-mode", slug: "mode", name: "Mode", image_url: null },
    { id: "virtual-parfums", slug: "parfums", name: "Parfums", image_url: null },
  ];
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const displayedCategories = [
    ...fallbackCategories.map((fallback) => categoryBySlug.get(fallback.slug) ?? fallback),
    ...categories.filter((category) => !["mode", "parfums"].includes(category.slug)),
  ];
  const activeCategory = categories.find((c) => c.slug === categorie);
  const shortcutCategoryTitle = categorie === "mode" ? "Mode" : categorie === "parfums" ? "Parfums" : null;
  const unknownCategory = !categoriesUnavailable && Boolean(categorie && !shortcutCategoryTitle && !activeCategory);
  const term = q?.trim();
  const normalizedTerm = term
    ?.normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLocaleLowerCase("fr");
  const matchingCategories = term
    ? displayedCategories.filter((category) => {
        const searchable = [category.name, category.slug]
          .filter(Boolean)
          .join(" ")
          .normalize("NFD")
          .replace(/[\\u0300-\\u036f]/g, "")
          .toLocaleLowerCase("fr");
        return searchable.includes(normalizedTerm ?? "");
      })
    : displayedCategories;

  return (
    <div className="revant-home min-h-screen bg-brand-bg text-brand-text pb-28">
      <SiteHeader />
      <HeroCarousel slides={HERO_SLIDES} />
      <RevantMegaShortcuts />

      <section id="a-propos" className="revant-home-section revant-editorial-strip">
        {[
          ["↗", "LIVRAISON", "Options selon la boutique"],
          ["◇", "ACHAT SIMPLE", "Sans compte obligatoire"],
          ["□", "BOUTIQUES LOCALES", "Des vendeurs à découvrir"],
          ["○", "AIDE EN FRANÇAIS", "Un parcours clair"],
        ].map(([icon, title, detail]) => (
          <div key={title} className="flex min-h-[76px] items-center gap-3 bg-brand-bg px-3 py-4 sm:px-5">
            <span className="text-2xl font-light" aria-hidden="true">{icon}</span>
            <span><strong className="block text-[10px] font-extrabold tracking-wide">{title}</strong><span className="mt-1 block text-[10px] text-brand-muted">{detail}</span></span>
          </div>
        ))}
      </section>

      <section id="categories" className="revant-home-section">
        <div className="revant-home-section__head"><div><p className="revant-home-section__eyebrow">Explorer les univers</p><h2 className="revant-home-section__title">{term ? "Catégories correspondantes" : "Choisir son univers"}</h2></div><Link href="/categories" className="revant-home-section__link">Toutes les catégories <span aria-hidden="true">↗</span></Link></div>
        {categoriesUnavailable && <p role="status" className="mb-3 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-xs leading-relaxed text-brand-muted">La liste complète des catégories est temporairement indisponible. La sélection de base reste affichée.</p>}
        {term && matchingCategories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-border bg-brand-surface px-4 py-5 text-xs text-brand-muted">
            Aucune catégorie ne correspond à cette recherche.
          </p>
        ) : (
          <div className="revant-category-grid">
            {matchingCategories.map((category) => (
              <Link key={category.id} href={`/?categorie=${encodeURIComponent(category.slug)}#produits`} className="revant-category-card group">
                <div
                  role="img"
                  aria-label={`Illustration de la catégorie ${category.name}`}
                  className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url("${getCategoryCoverImage(category.slug, category.image_url)}"), linear-gradient(135deg, var(--brand-accent), var(--brand-surface-soft))` }}
                />
                <div className="revant-category-card__veil" />
                <span className="revant-category-card__name">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
        </section>

      <section id="boutiques-locales" className="revant-home-section">
        <div className="revant-home-section__head"><div><p className="revant-home-section__eyebrow">Les vendeurs de la communauté</p><h2 className="revant-home-section__title">{term ? "Boutiques correspondantes" : "Des boutiques à découvrir"}</h2><p className="mt-2 text-xs text-brand-muted">Des vitrines actives, des catalogues réels.</p></div><Link href="/boutiques" className="revant-home-section__link">Toutes les boutiques <span aria-hidden="true">↗</span></Link></div>
        {shopsUnavailable ? (
          <div role="status" className="rounded-2xl border border-brand-border bg-brand-surface px-5 py-8 text-center">
            <h3 className="text-sm font-extrabold">Boutiques temporairement indisponibles</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-brand-muted">Nous ne pouvons pas charger les vitrines pour le moment. Réessaie dans quelques instants.</p>
            <Link href="/boutiques" className="mt-4 inline-flex rounded-full border border-brand-border px-5 py-3 text-xs font-bold text-brand-text">Réessayer</Link>
          </div>
        ) : shops.length > 0 ? (
          <div className="revant-shop-grid">
            {shops.slice(0, 4).map((shop) => {
              const shopImage = safeShopBanner(shop.banner_url) ?? safeShopBanner(shop.background_image_url) ?? safeShopBanner(shop.logo_url);
              return (
              <Link key={shop.id} href={`/shop/${shop.slug}`} className="revant-shop-card">
                <div className="revant-shop-card__image" style={{ backgroundImage: shopImage ? `url("${shopImage}")` : undefined }} />
                <div className="revant-shop-card__veil" />
                {(certifiedShopIds.has(shop.id) || shop.is_premium) && (
                  <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
                    {certifiedShopIds.has(shop.id) && <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-extrabold text-white">✓ BOUTIQUE VÉRIFIÉE</span>}
                    {shop.is_premium && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-extrabold text-amber-900">PREMIUM</span>}
                  </div>
                )}
                <div className="revant-shop-card__copy"><strong className="revant-shop-card__name">{shop.name}</strong><span className="revant-shop-card__meta">{shop.city ?? "Niger"}</span></div>
              </Link>
            );
            })}
          </div>
        ) : term ? (
          <p className="rounded-xl border border-dashed border-brand-border bg-brand-surface px-4 py-5 text-xs text-brand-muted">
            Aucune boutique ne correspond à cette recherche. Essaie un autre nom ou une autre ville.
          </p>
        ) : (
          <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface px-5 py-8 text-center">
            <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-bg text-2xl">🌾</div>
            <h3 className="mt-3 text-sm font-extrabold">Les boutiques locales arrivent bientôt</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-brand-muted">
              Les vitrines et les produits des vendeurs apparaîtront ici dès que leurs boutiques seront actives.
            </p>
            <Link href="/boutiques/creer" className="mt-4 inline-flex rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white">
              Ouvrir ma boutique
            </Link>
          </div>
        )}
      </section>

      <main id="produits" className="revant-home-section">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">{term ? `Résultats pour « ${q} »` : unknownCategory ? "Catégorie indisponible" : shortcutCategoryTitle ?? (activeCategory ? activeCategory.name : "Produits populaires")}</h2><a href="#produits" className="text-xs font-medium">Voir tout →</a></div>
        {productsUnavailable ? (
          <div role="status" className="rounded-xl border border-brand-border bg-brand-surface px-5 py-10 text-center">
            <p className="text-sm font-semibold">Catalogue temporairement indisponible</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-brand-muted">Nous n’avons pas pu charger les annonces. Réessaie dans quelques instants.</p>
            <Link href="/categories" className="mt-4 inline-flex rounded-full border border-brand-border px-5 py-3 text-xs font-bold text-brand-text">Explorer les catégories</Link>
          </div>
        ) : loadedProducts.length === 0 ? (
          <div className="rounded-xl border border-brand-border bg-brand-surface px-5 py-10 text-center">
            <p className="text-sm font-semibold">{term ? "Aucun produit correspondant à cette recherche." : unknownCategory ? "Cette catégorie n’est pas disponible pour le moment." : "Les premières annonces arrivent bientôt."}</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-brand-muted">{term ? "Essaie un autre mot ou explore les catégories." : unknownCategory ? "Choisis une catégorie actuellement proposée par Revant." : "Aucun produit actif n’est encore publié. Les annonces réelles apparaîtront ici dès leur publication."}</p>
            {unknownCategory && <Link href="/categories" className="mt-4 inline-flex rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white">Explorer les catégories</Link>}
          </div>
        ) : (
          <InfiniteProductFeed initialProducts={loadedProducts} category={categorie ?? ""} search={term ?? ""} />
        )}
      </main>

      <section className="revant-home-section pb-8">
        <div className="revant-editorial-strip revant-editorial-strip--three">
          <div><strong>Un marché ouvert à tous</strong><span>Découvre les annonces et les boutiques actives sur Revant.</span></div>
          <div><strong>Tu es vendeur ?</strong><span>Présente tes produits et développe ta boutique.</span><Link href="/boutiques/creer" className="mt-3 inline-flex text-xs font-extrabold text-brand-accent">Ouvrir ma boutique ↗</Link></div>
          <div><strong>Un achat en confiance</strong><span>Les disponibilités et les paiements sont confirmés au moment de la commande.</span></div>
        </div>
      </section>
      <BottomNav />
    </div>
  );
}
