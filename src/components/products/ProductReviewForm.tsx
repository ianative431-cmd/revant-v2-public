"use client";

import { useActionState } from "react";
import { submitProductReview, type ReviewActionState } from "@/server/products/review-actions";

const initialState: ReviewActionState = { error: null, success: null };

export default function ProductReviewForm({
  orderId,
  productId,
  productName,
}: {
  orderId: string;
  productId: string;
  productName: string;
}) {
  const [state, formAction, pending] = useActionState(submitProductReview, initialState);

  if (state.success) {
    return (
      <p role="status" aria-live="polite" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-relaxed text-emerald-900">
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="productId" value={productId} />
      <p className="text-xs font-extrabold">Évaluer : {productName}</p>
      <label className="mt-3 block text-xs font-bold" htmlFor={`review-rating-${productId}`}>Ta note</label>
      <select
        id={`review-rating-${productId}`}
        name="rating"
        required
        defaultValue="5"
        className="mt-1 min-h-11 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm"
      >
        <option value="5">★★★★★ — Excellent</option>
        <option value="4">★★★★☆ — Très bien</option>
        <option value="3">★★★☆☆ — Correct</option>
        <option value="2">★★☆☆☆ — Décevant</option>
        <option value="1">★☆☆☆☆ — Mauvais</option>
      </select>
      <label className="mt-3 block text-xs font-bold" htmlFor={`review-title-${productId}`}>Titre (facultatif)</label>
      <input
        id={`review-title-${productId}`}
        name="title"
        maxLength={120}
        className="mt-1 min-h-11 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm"
        placeholder="Résume ton expérience"
      />
      <label className="mt-3 block text-xs font-bold" htmlFor={`review-body-${productId}`}>Ton commentaire</label>
      <textarea
        id={`review-body-${productId}`}
        name="body"
        required
        minLength={10}
        maxLength={2000}
        rows={3}
        className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 text-sm"
        placeholder="Décris ton expérience avec ce produit…"
      />
      {state.error && <p role="alert" aria-live="assertive" className="mt-2 text-xs font-semibold text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 min-h-11 w-full rounded-full bg-brand-accent px-5 py-3 text-xs font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer mon avis"}
      </button>
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--brand-muted)]">
        Ton avis sera examiné par Revant avant sa publication. Un seul avis est autorisé par produit et par commande.
      </p>
    </form>
  );
}
