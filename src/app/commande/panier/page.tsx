import Link from "next/link";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductsByIds } from "@/server/products/products";
import { createGuestOrderBatch } from "@/server/orders/guest-actions";
import { notFound } from "next/navigation";

type CheckoutLine = { productId: string; quantity: number; variantLabel: string | null };
type Props = { searchParams: Promise<{ items?: string; erreur?: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseItems(raw: string | undefined): CheckoutLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 20) return [];
    const items = parsed.map((entry): CheckoutLine | null => {
      if (!entry || typeof entry !== "object") return null;
      const value = entry as Record<string, unknown>;
      const productId = String(value.productId ?? value.product_id ?? "").trim();
      const quantity = Number(value.quantity);
      const rawVariant = value.variantLabel ?? value.variant_label ?? null;
      const variantLabel = rawVariant === null || rawVariant === undefined || String(rawVariant).trim() === ""
        ? null : String(rawVariant).trim();
      if (!UUID_PATTERN.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 || (variantLabel !== null && variantLabel.length > 50)) return null;
      return { productId: productId.toLowerCase(), quantity, variantLabel };
    });
    if (items.some((item) => item === null)) return [];
    const normalized = items as CheckoutLine[];
    const keys = normalized.map((item) => `${item.productId}::${item.variantLabel ?? ""}`);
    if (new Set(keys).size !== keys.length) return [];
    return normalized.sort((a, b) => a.productId.localeCompare(b.productId) || (a.variantLabel ?? "").localeCompare(b.variantLabel ?? ""));
  } catch {
    return [];
  }
}

export default async function GuestCartCheckoutPage({ searchParams }: Props) {
  const { items: rawItems, erreur } = await searchParams;
  const items = parseItems(rawItems);
  if (items.length === 0) notFound();

  const supabase = await createSupabaseServerClient();
  const products = await getProductsByIds(supabase, items.map((item) => item.productId));
  if (products.length !== items.length) notFound();
  const byId = new Map(products.map((product) => [product.id, product]));
  const resolved = items.map((item) => ({ ...item, product: byId.get(item.productId) })).filter((item) => item.product);
  if (resolved.length !== items.length) notFound();

  const shopIds = new Set(resolved.map((item) => item.product!.shop_id));
  const currencies = new Set(resolved.map((item) => item.product!.currency));
  const validScope = shopIds.size === 1 && currencies.size === 1;
  const invalidProducts = resolved.filter(({ product, quantity, variantLabel }) => {
    if (product!.status !== "active" || product!.stock_quantity <= 0 || quantity > product!.stock_quantity) return true;
    const requiresVariant = product!.product_type === "clothing" && Object.keys(product!.size_stock).length > 0;
    if (requiresVariant) {
      const stock = variantLabel ? product!.size_stock[variantLabel] : undefined;
      return !variantLabel || !Number.isSafeInteger(stock) || Number(stock) < quantity;
    }
    return variantLabel !== null;
  });
  const aggregateStockInvalid = [...new Set(items.map((item) => item.productId))].some((productId) => {
    const product = byId.get(productId)!;
    const total = items.filter((item) => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0);
    return total > product.stock_quantity;
  });
  const unavailable = !validScope || invalidProducts.length > 0 || aggregateStockInvalid;
  const subtotal = resolved.reduce((sum, item) => sum + item.product!.base_price * item.quantity, 0);
  const currency = resolved[0]?.product?.currency ?? "XOF";
  const idempotencyKey = randomUUID();

  return (
    <main className="revant-checkout-page min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="revant-checkout-layout mx-auto max-w-4xl">
        <Link href="/panier" className="text-sm text-brand-muted">← Retour au panier</Link>
        <div className="revant-checkout-panel mt-5 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-widest text-brand-muted">COMMANDE INVITÉ · UNE BOUTIQUE</p>
          <h1 className="mt-2 text-2xl font-black">Commander les articles</h1>
          <p className="mt-2 text-sm text-brand-muted">Les articles de cette boutique sont regroupés dans une seule demande. Tu peux commander sans créer de compte.</p>

          <div className="mt-5 space-y-2 rounded-xl bg-brand-bg p-3">
            {resolved.map(({ product, quantity, variantLabel }) => (
              <div key={`${product!.id}::${variantLabel ?? ""}`} className="flex items-start justify-between gap-4 border-b border-brand-border py-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{product!.name}</p>
                  {variantLabel && <p className="mt-1 text-xs text-brand-muted">Taille : {variantLabel}</p>}
                  <p className="mt-1 text-xs text-brand-muted">Quantité : {quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-black">{(product!.base_price * quantity).toLocaleString("fr-FR")} {product!.currency}</p>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-sm font-bold">Sous-total</span>
              <span className="text-lg font-black">{subtotal.toLocaleString("fr-FR")} {currency}</span>
            </div>
          </div>

          {unavailable && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Un article n’est plus disponible, une taille a changé ou le panier ne correspond pas à une seule boutique et une seule devise. Retourne au panier pour corriger ta sélection.</p>}
          {erreur && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur === "stock" ? "Le stock vient de changer. Vérifie les quantités dans ton panier." : erreur === "variant" ? "Une taille n’est plus disponible. Modifie ta sélection." : erreur === "validation" ? "La sélection ne peut pas être commandée en une seule demande." : "La commande n’a pas pu être créée. Vérifie les informations et réessaie."}</p>}
          <div role="note" className="mt-5 rounded-xl border border-brand-border bg-brand-bg p-4 text-xs leading-relaxed text-brand-muted"><strong className="text-brand-text">Paiement en ligne indisponible.</strong> La demande sera envoyée à la boutique et restera en attente de confirmation. Revant n’encaisse aucun paiement à cette étape.</div>

          <form action={createGuestOrderBatch} className="revant-checkout-form mt-6 grid gap-4">
            <input type="hidden" name="items" value={JSON.stringify(items)} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <div><label htmlFor="guest-cart-name" className="mb-1 block text-xs font-semibold">Nom complet</label><input id="guest-cart-name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="Ton nom complet" /></div>
            <div><label htmlFor="guest-cart-phone" className="mb-1 block text-xs font-semibold">Téléphone</label><input id="guest-cart-phone" name="phone" required minLength={8} maxLength={24} autoComplete="tel" inputMode="tel" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="+227 ..." /></div>
            <div><label htmlFor="guest-cart-city" className="mb-1 block text-xs font-semibold">Ville</label><input id="guest-cart-city" name="city" required minLength={2} maxLength={100} autoComplete="address-level2" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="Niamey, Maradi..." /></div>
            <div><label htmlFor="guest-cart-address" className="mb-1 block text-xs font-semibold">Adresse ou point de repère</label><textarea id="guest-cart-address" name="address" required minLength={5} maxLength={300} autoComplete="street-address" rows={3} className="w-full resize-y rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="Quartier, rue, repère proche..." /></div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label htmlFor="guest-cart-website">Ne pas remplir</label><input id="guest-cart-website" name="website" tabIndex={-1} autoComplete="off" /></div>
            <button type="submit" disabled={unavailable} className="mt-2 w-full rounded-full bg-brand-accent px-6 py-4 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">Envoyer la demande pour {items.length} article{items.length > 1 ? "s" : ""}</button>
            <p className="text-center text-xs text-brand-muted">Les prix, les tailles et les stocks sont revérifiés dans une transaction côté serveur.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
