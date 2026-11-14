import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { getProductById } from "@/server/products/products";
import AddToCartButton from "@/components/products/AddToCartButton";
import ProductGallery from "@/components/products/ProductGallery";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import { startConversationAboutProduct } from "@/app/messages/actions";

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, id);
  if (!product || product.status !== "active") notFound();

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
    <div className="min-h-screen bg-brand-bg pb-28 text-brand-text">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-8">
        <nav aria-label="Fil d’Ariane" className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--brand-muted)] sm:text-sm">
          <Link href="/" className="transition hover:text-brand-accent">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link href="/categories" className="transition hover:text-brand-accent">Catégories</Link>
          <span aria-hidden="true">/</span>
          <span className="max-w-[55vw] truncate text-[var(--brand-text)]" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start lg:gap-8">
          <section aria-label="Photos du produit" className="min-w-0 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 shadow-sm sm:rounded-[30px] sm:p-3">
              <ProductGallery
                images={product.images}
                productName={product.name}
                outOfStock={outOfStock}
              />
            </div>
            <p className="mt-3 px-1 text-xs leading-relaxed text-[var(--brand-muted)]">
              Photos fournies par le vendeur. Les disponibilités sont indiquées sur cette fiche.
            </p>
          </section>

          <section className="min-w-0 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:rounded-[30px] sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {product.categoryName && (
                <span className="rounded-full bg-[var(--brand-bg)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-muted)]">
                  {product.categoryName}
                </span>
              )}
              <span className={outOfStock
                ? "rounded-full bg-[var(--brand-bg)] px-3 py-1.5 text-[10px] font-bold text-[var(--brand-muted)]"
                : "rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800"}>
                {outOfStock ? "Actuellement épuisé" : "Disponible"}
              </span>
            </div>

            <h1 className="mt-4 text-[26px] font-black leading-tight tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            {product.product_type === "perfume" && product.perfume_volume_ml && (
              <p className="mt-2 text-sm font-medium text-[var(--brand-muted)]">
                Format : {product.perfume_volume_ml} ml
              </p>
            )}

            <div className="mt-5 rounded-2xl bg-[var(--brand-bg)] px-4 py-4 sm:px-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-muted)]">
                Prix du produit
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-brand-accent sm:text-[34px]">
                {product.base_price.toLocaleString("fr-FR")} {product.currency}
              </p>
            </div>

            {product.product_type === "clothing" && Object.keys(product.size_stock).length > 0 && (
              <section className="mt-6" aria-labelledby="product-sizes">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="product-sizes" className="text-sm font-extrabold">Tailles et disponibilités</h2>
                  <span className="text-[11px] text-[var(--brand-muted)]">Stock vendeur</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(product.size_stock)
                    .sort(([a], [b]) => a.localeCompare(b, "fr"))
                    .map(([size, quantity]) => (
                      <div key={size} className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-3">
                        <span className="block text-sm font-extrabold">{size}</span>
                        <span className="mt-1 block text-[11px] font-medium text-[var(--brand-muted)]">
                          {quantity > 0
                            ? `${quantity} disponible${quantity > 1 ? "s" : ""}`
                            : "Épuisé"}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {product.description && (
              <section className="mt-6 border-t border-[var(--brand-border)] pt-5" aria-labelledby="product-description">
                <h2 id="product-description" className="text-sm font-extrabold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--brand-muted)]">
                  {product.description}
                </p>
              </section>
            )}

            {shop && (
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-[var(--brand-border)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-muted)]">Vendu par</p>
                  <p className="mt-0.5 truncate text-sm font-extrabold">{shop.name}</p>
                </div>
                <Link
                  href={`/shop/${shop.slug}`}
                  className="shrink-0 rounded-full border border-[var(--brand-border)] px-4 py-2 text-xs font-bold transition hover:border-brand-accent hover:text-brand-accent"
                >
                  Voir la boutique
                </Link>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--brand-border)] pt-5">
              {isOwner ? (
                <p className="rounded-2xl bg-[var(--brand-bg)] p-4 text-sm leading-relaxed">
                  C’est ton annonce. Tu ne peux pas acheter ton propre produit.
                </p>
              ) : outOfStock ? (
                <p className="rounded-2xl bg-[var(--brand-bg)] p-4 text-sm leading-relaxed">
                  Ce produit est actuellement épuisé. Consulte la boutique pour découvrir les autres articles.
                </p>
              ) : (
                <div className="grid gap-3">
                  <AddToCartButton
                    item={{
                      id: product.id,
                      name: product.name,
                      price: product.base_price,
                      currency: product.currency,
                      image: imageUrl,
                    }}
                  />
                  <Link
                    href={`/commande/visiteur?productId=${encodeURIComponent(product.id)}`}
                    className="block w-full rounded-full bg-brand-accent px-6 py-4 text-center text-sm font-extrabold text-white shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  >
                    Commander sans créer de compte
                  </Link>
                </div>
              )}

              {!isOwner && shop && (
                <form action={startConversationAboutProduct} className="mt-3">
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    className="w-full rounded-full border border-brand-accent px-5 py-3.5 text-sm font-bold text-brand-accent transition hover:bg-brand-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  >
                    Poser une question au vendeur
                  </button>
                </form>
              )}
              <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--brand-muted)]">
                Aucun compte n’est nécessaire pour passer commande.
              </p>
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
