"use client";

import { useCallback, useState } from "react";
import type { PublishedProductReview } from "@/server/products/reviews";

type ReviewResponse = {
  reviews: PublishedProductReview[];
  total: number;
  hasMore: boolean;
};

export default function ProductReviews({
  productId,
  initialReviews,
  totalReviews,
}: {
  productId: string;
  initialReviews: PublishedProductReview[];
  totalReviews: number;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [total, setTotal] = useState(totalReviews);
  const [hasMore, setHasMore] = useState(initialReviews.length < totalReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        offset: String(reviews.length),
        limit: "10",
      });
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews?${params}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Reviews unavailable");
      const data = (await response.json()) as ReviewResponse;
      setReviews((current) => {
        const seen = new Set(current.map((review) => review.id));
        return [...current, ...data.reviews.filter((review) => !seen.has(review.id))];
      });
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, productId, reviews.length]);

  return (
    <section aria-labelledby="product-reviews-title" className="mt-7 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:rounded-[30px] sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[var(--brand-accent)]">Retours des acheteurs</p>
          <h2 id="product-reviews-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Avis sur ce produit</h2>
        </div>
        <span className="rounded-full bg-[var(--brand-bg)] px-3 py-1.5 text-xs font-bold text-[var(--brand-muted)]">
          {total} avis publié{total > 1 ? "s" : ""}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] px-5 py-8 text-center">
          <p className="text-sm font-bold">Aucun avis publié pour le moment.</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--brand-muted)]">
            Les acheteurs pourront partager leur expérience après la livraison de leur commande.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--brand-border)]">
          {reviews.map((review) => (
            <article key={review.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm tracking-[0.12em] text-amber-600" aria-label={`Note : ${review.rating} sur 5`}>
                    {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                    <span className="text-[var(--brand-border)]">{"☆".repeat(5 - Math.max(0, Math.min(5, review.rating)))}</span>
                  </span>
                  {review.verifiedPurchase && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Achat vérifié</span>
                  )}
                </div>
                <time className="text-[10px] text-[var(--brand-muted)]" dateTime={review.created_at}>
                  {new Date(review.created_at).toLocaleDateString("fr-FR")}
                </time>
              </div>
              <h3 className="mt-2 text-sm font-extrabold">{review.title || "Avis client"}</h3>
              {review.body && <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--brand-muted)]">{review.body}</p>}
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="rounded-full border border-[var(--brand-border)] px-5 py-3 text-xs font-bold transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-50"
          >
            {loading ? "Chargement…" : error ? "Réessayer" : "Afficher plus d’avis"}
          </button>
        </div>
      )}
    </section>
  );
}
