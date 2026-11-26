"use server";

import { submitProductReview } from "@/server/products/review-actions";

type ReviewableOrder = {
  id: string;
  delivered_at: string | null;
  created_at: string;
};

type PreviousReview = {
  order_id: string;
  is_published: boolean;
  created_at: string;
};

export default function ProductReviewForm({
  productId,
  eligibleOrders,
  previousReviews,
  notice,
}: {
  productId: string;
  eligibleOrders: ReviewableOrder[];
  previousReviews: PreviousReview[];
  notice: string | null;
}) {
  const noticeMessages: Record<string, { text: string; tone: string }> = {
    submitted: { text: "Ton avis a bien été envoyé. Il sera visible après validation par Revant.", tone: "success" },
    already: { text: "Un avis existe déjà pour cette commande et ce produit.", tone: "neutral" },
    "not-eligible": { text: "Cette commande ne permet pas de déposer un avis pour ce produit.", tone: "error" },
    limited: { text: "Tu as atteint la limite temporaire d’envoi d’avis. Réessaie plus tard.", tone: "error" },
    invalid: { text: "Les informations envoyées ne sont pas valides. Vérifie le formulaire.", tone: "error" },
    error: { text: "L’envoi n’a pas abouti. Réessaie dans quelques instants.", tone: "error" },
  };
  const activeNotice = notice ? noticeMessages[notice] : null;

  return (
    <section id="product-review-form" aria-labelledby="product-review-form-title" className="mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:rounded-[30px] sm:p-7">
      <div className="mb-5">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[var(--brand-accent)]">Après réception</p>
        <h2 id="product-review-form-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Donner ton avis</h2>
        <p className="mt-2 text-xs leading-relaxed text-[var(--brand-muted)]">
          Seuls les acheteurs ayant reçu ce produit peuvent publier un avis. Chaque avis est contrôlé avant sa publication.
        </p>
      </div>

      {activeNotice && (
        <p role="status" className={`mb-4 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          activeNotice.tone === "success" ? "bg-emerald-50 text-emerald-900" :
          activeNotice.tone === "error" ? "bg-rose-50 text-rose-900" :
          "bg-[var(--brand-bg)] text-[var(--brand-text)]"
        }`}>
          {activeNotice.text}
        </p>
      )}

      {previousReviews.length > 0 && (
        <div className="mb-4 space-y-2">
          {previousReviews.map((review) => (
            <p key={review.order_id} className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-3 text-xs leading-relaxed">
              {review.is_published
                ? "Ton avis lié à un achat précédent est publié."
                : "Ton avis lié à un achat précédent est en attente de modération."}
            </p>
          ))}
        </div>
      )}

      {eligibleOrders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-5 text-sm leading-relaxed text-[var(--brand-muted)]">
          {previousReviews.length > 0
            ? "Tu as déjà laissé un avis pour chacun de tes achats livrés de ce produit."
            : "Aucun achat livré de ce produit n’est associé à ton compte pour le moment."}
        </p>
      ) : (
        <form action={submitProductReview} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <div>
            <label htmlFor="review-order" className="mb-2 block text-xs font-bold">Commande concernée</label>
            <select id="review-order" name="orderId" required defaultValue="" className="min-h-12 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 text-sm">
              <option value="" disabled>Choisir une commande livrée</option>
              {eligibleOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Commande du {new Date(order.delivered_at ?? order.created_at).toLocaleDateString("fr-FR")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="review-rating" className="mb-2 block text-xs font-bold">Ta note</label>
            <select id="review-rating" name="rating" required defaultValue="5" className="min-h-12 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 text-sm">
              <option value="5">★★★★★ — Excellent</option>
              <option value="4">★★★★☆ — Très bien</option>
              <option value="3">★★★☆☆ — Correct</option>
              <option value="2">★★☆☆☆ — Décevant</option>
              <option value="1">★☆☆☆☆ — Très mauvais</option>
            </select>
          </div>
          <div>
            <label htmlFor="review-title" className="mb-2 block text-xs font-bold">Titre (facultatif)</label>
            <input id="review-title" name="title" type="text" maxLength={120} placeholder="Résume ton expérience" className="min-h-12 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="review-body" className="mb-2 block text-xs font-bold">Ton commentaire</label>
            <textarea id="review-body" name="body" required minLength={10} maxLength={2000} rows={4} placeholder="Décris ton expérience avec ce produit…" className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-3 text-sm leading-relaxed" />
          </div>
          <button type="submit" className="min-h-12 w-full rounded-full bg-brand-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
            Envoyer mon avis
          </button>
          <p className="text-[11px] leading-relaxed text-[var(--brand-muted)]">
            Ton avis reste privé jusqu’à sa validation. N’inclus pas de numéro de téléphone ni d’information personnelle dans ton commentaire.
          </p>
        </form>
      )}
    </section>
  );
}
