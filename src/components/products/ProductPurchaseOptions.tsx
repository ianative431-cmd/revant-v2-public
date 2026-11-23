"use client";

import Link from "next/link";
import { useState } from "react";
import AddToCartButton from "@/components/products/AddToCartButton";

type PurchaseItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  shopId: string;
  shopName: string | null;
};

export default function ProductPurchaseOptions({
  item,
  sizeStock,
  stockQuantity,
}: {
  item: PurchaseItem;
  sizeStock: Record<string, number>;
  stockQuantity: number;
}) {
  const sizes = Object.entries(sizeStock).sort(([a], [b]) => a.localeCompare(b, "fr"));
  const requiresSize = sizes.length > 0;
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const selectedStock = selectedSize ? Number(sizeStock[selectedSize] ?? 0) : 0;
  const maxQuantity = Math.min(99, requiresSize ? Math.min(selectedStock, stockQuantity) : stockQuantity);
  const canOrder = requiresSize ? selectedStock > 0 && stockQuantity > 0 : stockQuantity > 0;
  const safeQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const variantQuery = requiresSize && selectedSize ? `&variantLabel=${encodeURIComponent(selectedSize)}` : "";
  const checkoutHref = `/commande/visiteur?productId=${encodeURIComponent(item.id)}&quantity=${safeQuantity}${variantQuery}`;

  return (
    <div className="grid gap-4">
      {requiresSize && (
        <fieldset>
          <legend className="text-sm font-extrabold">Choisir une taille <span className="text-[var(--brand-accent)]">*</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map(([size, available]) => {
              const inStock = Number.isSafeInteger(available) && available > 0;
              const selected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!inStock}
                  aria-pressed={selected}
                  onClick={() => { setSelectedSize(size); setQuantity(1); }}
                  className={`min-w-12 rounded-xl border px-4 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-35 ${selected ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white shadow-sm" : "border-[var(--brand-border)] bg-[var(--brand-bg)] text-[var(--brand-text)] hover:border-[var(--brand-accent)]"}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[var(--brand-muted)]">
            {selectedSize ? `${selectedStock} unité(s) disponible(s) en taille ${selectedSize}` : "Sélectionne une taille disponible avant de commander."}
          </p>
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-3">
        <div>
          <p className="text-xs font-bold">Quantité</p>
          <p className="mt-0.5 text-[10px] text-[var(--brand-muted)]">Maximum : {Math.max(0, maxQuantity)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Diminuer la quantité" disabled={safeQuantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] text-lg disabled:opacity-40">−</button>
          <span className="min-w-5 text-center text-sm font-extrabold" aria-live="polite">{safeQuantity}</span>
          <button type="button" aria-label="Augmenter la quantité" disabled={!canOrder || safeQuantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] text-lg disabled:opacity-40">+</button>
        </div>
      </div>

      <AddToCartButton
        disabled={!canOrder}
        item={{ ...item, variantLabel: requiresSize ? selectedSize : null, quantity: safeQuantity }}
      />
      {canOrder ? (
        <Link href={checkoutHref} className="block w-full rounded-full bg-brand-accent px-6 py-4 text-center text-sm font-extrabold text-white shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          Commander sans créer de compte
        </Link>
      ) : (
        <p role="status" className="rounded-xl bg-[var(--brand-bg)] px-4 py-3 text-center text-xs font-semibold text-[var(--brand-muted)]">
          Choisis une taille disponible pour continuer.
        </p>
      )}
    </div>
  );
}
