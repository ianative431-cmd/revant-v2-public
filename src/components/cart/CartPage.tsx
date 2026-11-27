"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { safeProductImageUrl } from "@/lib/product-image";

type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  shopId?: string;
  shopName?: string | null;
  variantLabel?: string | null;
  quantity?: number;
};

type CartGroup = { id: string; name: string; items: CartItem[] };
function cartLineKey(item: CartItem): string { return `${item.id}::${item.variantLabel?.trim() || ""}`; }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem =>
    Boolean(item) && typeof item === "object" &&
    typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.currency === "string"
  ).map((item) => ({
    ...item,
    shopId: typeof item.shopId === "string" && UUID_PATTERN.test(item.shopId) ? item.shopId : undefined,
    shopName: typeof item.shopName === "string" ? item.shopName.slice(0, 100) : null,
    variantLabel: typeof item.variantLabel === "string" && item.variantLabel.trim() ? item.variantLabel.trim().slice(0, 50) : null,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
  }));
}

function groupItems(items: CartItem[]): CartGroup[] {
  const groups = new Map<string, CartGroup>();
  for (const item of items) {
    // Older localStorage entries have no shop metadata; keep them separate rather than guessing.
    const key = item.shopId ? `shop:${item.shopId}` : `unresolved:${item.id}`;
    const existing = groups.get(key);
    if (existing) {
      if ((!existing.name || existing.name === "Boutique") && item.shopName) existing.name = item.shopName;
      existing.items.push(item);
    } else {
      groups.set(key, {
        id: key,
        name: item.shopName || (item.shopId ? "Boutique" : "Boutique à confirmer"),
        items: [item],
      });
    }
  }
  return [...groups.values()];
}

function currencyTotals(items: CartItem[]): [string, number][] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const currency = item.currency.trim() || "XOF";
    totals.set(currency, (totals.get(currency) ?? 0) + item.price * (item.quantity ?? 1));
  }
  return [...totals.entries()];
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const refresh = useCallback(() => {
    try { setItems(normalizeItems(JSON.parse(localStorage.getItem("revant-cart") || "[]"))); }
    catch { setItems([]); }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    window.addEventListener("revant-cart-updated", refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("revant-cart-updated", refresh);
    };
  }, [refresh]);

  function save(next: CartItem[]) {
    localStorage.setItem("revant-cart", JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("revant-cart-updated"));
  }

  function remove(key: string) {
    save(items.filter((item) => cartLineKey(item) !== key));
  }

  function updateQuantity(key: string, quantity: number) {
    const next = items.map((item) => cartLineKey(item) === key
      ? { ...item, quantity: Math.max(1, Math.min(99, Math.floor(quantity))) }
      : item);
    save(next);
  }

  const groups = groupItems(items);
  const totalLines = items.length;
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  return (
    <main className="revant-cart-page min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="revant-cart-layout mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-[var(--brand-muted)]">← Continuer les achats</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--brand-accent)]">Sélection Revant</p>
            <h1 className="mt-1 text-2xl font-black">Mon panier</h1>
          </div>
          {items.length > 0 && (
            <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1.5 text-xs font-bold text-[var(--brand-muted)]">
              {totalLines} ligne{totalLines > 1 ? "s" : ""} · {totalUnits} article{totalUnits > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <section className="mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 text-center shadow-sm">
            <div aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--brand-bg)] text-2xl">◇</div>
            <p className="mt-4 font-semibold">Ton panier est vide.</p>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">Ajoute un produit depuis une fiche ou une carte produit.</p>
            <Link href="/#produits" className="mt-5 inline-block rounded-full bg-brand-accent px-5 py-3 text-sm font-bold text-white">Découvrir les produits</Link>
          </section>
        ) : (
          <div className="mt-5 space-y-5">
            {groups.map((group) => {
              const totals = currencyTotals(group.items);
              const groupUnits = group.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
              const shopScoped = group.items.every((item) => Boolean(item.shopId) && item.shopId === group.items[0]?.shopId);
              const canBatchCheckout = shopScoped && totals.length === 1 && group.items.length <= 20;
              const checkoutItems = group.items.map((item) => ({
                productId: item.id,
                quantity: item.quantity ?? 1,
                variantLabel: item.variantLabel ?? null,
              }));
              const checkoutHref = `/commande/panier?items=${encodeURIComponent(JSON.stringify(checkoutItems))}`;

              return (
                <section key={group.id} className="revant-cart-group overflow-hidden rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-sm">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-muted)]">Vendeur</p>
                      <h2 className="mt-1 truncate text-sm font-black">{group.name}</h2>
                      <p className="mt-1 text-[10px] text-[var(--brand-muted)]">{group.items.length} ligne{group.items.length > 1 ? "s" : ""} · {groupUnits} article{groupUnits > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--brand-muted)]">Sous-total indicatif</p>
                      {totals.map(([currency, amount]) => (
                        <p key={currency} className="mt-1 text-sm font-black">{amount.toLocaleString("fr-FR")} {currency}</p>
                      ))}
                    </div>
                  </header>

                  <div className="divide-y divide-[var(--brand-border)]">
                    {group.items.map((item) => {
                      const quantity = item.quantity ?? 1;
                      const imageUrl = safeProductImageUrl(item.image);
                      return (
                        <article key={cartLineKey(item)} className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
                          {imageUrl ? (
                            <div className="revant-cart-product-image relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-bg)] sm:h-24 sm:w-24"><Image src={imageUrl} alt="" fill sizes="96px" unoptimized className="object-contain" /></div>
                          ) : (
                            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[var(--brand-bg)] text-xl text-[var(--brand-muted)] sm:h-24 sm:w-24">◇</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-bold">{item.name}</h3>
                            <p className="mt-1 text-sm font-extrabold text-[var(--brand-accent)]">{item.price.toLocaleString("fr-FR")} {item.currency}</p>
                            {item.variantLabel && <p className="mt-1 text-xs font-semibold text-[var(--brand-muted)]">Taille : {item.variantLabel}</p>}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button type="button" aria-label={`Diminuer la quantité de ${item.name}`} onClick={() => updateQuantity(cartLineKey(item), quantity - 1)} disabled={quantity <= 1} className="h-8 w-8 rounded-full border border-[var(--brand-border)] disabled:opacity-40">−</button>
                              <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                              <button type="button" aria-label={`Augmenter la quantité de ${item.name}`} onClick={() => updateQuantity(cartLineKey(item), quantity + 1)} disabled={quantity >= 99} className="h-8 w-8 rounded-full border border-[var(--brand-border)] disabled:opacity-40">+</button>
                              <button type="button" onClick={() => remove(cartLineKey(item))} className="ml-1 text-xs text-[var(--brand-muted)] underline">Retirer</button>
                            </div>
                            {!canBatchCheckout && (
                              <Link href={`/commande/visiteur?productId=${encodeURIComponent(item.id)}&quantity=${quantity}${item.variantLabel ? `&variantLabel=${encodeURIComponent(item.variantLabel)}` : ""}`} className="mt-3 inline-flex rounded-full border border-[var(--brand-border)] px-4 py-2.5 text-[10px] font-bold">
                                Commander cet article
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-bg)] p-4">
                    {canBatchCheckout ? (
                      <Link href={checkoutHref} className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-accent px-5 py-3 text-center text-sm font-bold text-white">
                        Commander les {groupUnits} article{groupUnits > 1 ? "s" : ""} de cette boutique
                      </Link>
                    ) : shopScoped ? (
                      <p className="text-xs leading-relaxed text-[var(--brand-muted)]">
                        {group.items.length > 20 ? "Cette boutique dépasse la limite de 20 lignes par demande. Tu peux commander chaque ligne séparément." : "Les articles de cette boutique utilisent plusieurs devises. Ils doivent être commandés séparément."}
                      </p>
                    ) : (
                      <p className="text-xs leading-relaxed text-[var(--brand-muted)]">Les anciennes lignes sans identifiant de boutique ne peuvent pas être regroupées automatiquement.</p>
                    )}
                  </footer>
                </section>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <aside className="revant-cart-note mt-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 text-xs leading-relaxed text-[var(--brand-muted)]">
            Les commandes sont regroupées par boutique : chaque boutique reçoit une demande distincte, qui peut contenir plusieurs articles. Les prix et les stocks sont revérifiés côté serveur. Les frais de livraison sont confirmés par la boutique. Le paiement en ligne n’est pas activé.
          </aside>
        )}
      </div>
    </main>
  );
}
