"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  submitShopForReview,
  type ShopReviewActionState,
} from "@/server/shops/review-actions";

type Props = {
  status: string;
  hasContact: boolean;
  pendingProductCount: number;
};

const INITIAL_STATE: ShopReviewActionState = { error: null, success: null };

function PendingProductsNote({ count, afterShopApproval = false }: { count: number; afterShopApproval?: boolean }) {
  if (count < 1) return null;

  return (
    <p className="mt-3 rounded-xl border border-amber-700/15 bg-amber-50/70 px-3 py-2.5 text-xs leading-5 text-amber-900">
      <strong>{count} annonce{count > 1 ? "s" : ""} en attente.</strong>{" "}
      {afterShopApproval
        ? "Elles pourront être examinées dès que la boutique sera approuvée."
        : "Elles ne seront visibles qu’après leur approbation par Revant."}
    </p>
  );
}

export default function ShopReviewPanel({ status, hasContact, pendingProductCount }: Props) {
  const [state, formAction, pending] = useActionState(submitShopForReview, INITIAL_STATE);

  if (status === "active") {
    return (
      <section className="mb-5 rounded-2xl border border-green-700/20 bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-green-700">Boutique publiée</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
          Ta vitrine est accessible publiquement sur Revant.
        </p>
        <PendingProductsNote count={pendingProductCount} />
      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="mb-5 rounded-2xl border border-amber-700/20 bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-amber-700">Validation de la boutique en attente</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
          Ta demande a bien été envoyée. L’équipe Revant doit approuver la boutique avant l’ouverture de la vitrine publique.
        </p>
        <PendingProductsNote count={pendingProductCount} afterShopApproval />
      </section>
    );
  }

  if (status === "suspended") {
    return (
      <section className="mb-5 rounded-2xl border border-red-600/20 bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-red-600">Boutique suspendue</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
          La vitrine n’est pas visible publiquement. Contacte l’administration Revant pour connaître la raison.
        </p>
      </section>
    );
  }

  if (status === "closed") {
    return (
      <section className="mb-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold">Boutique fermée</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">Cette boutique n’est pas publiée.</p>
      </section>
    );
  }

  if (status !== "draft") return null;

  return (
    <section className="mb-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:p-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
          Dernière étape avant publication
        </p>
        <h2 className="mt-1 text-base font-black">Rendre ma boutique visible</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
          Suis ces étapes dans l’ordre. Les produits déjà ajoutés sont conservés pendant la validation.
        </p>
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        <li className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-muted)]">Étape 1</p>
          <p className="mt-1 text-sm font-bold">Coordonnées publiques</p>
          <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
            {hasContact ? "Un numéro de contact est enregistré." : "Ajoute un téléphone ou un numéro WhatsApp valide."}
          </p>
          <Link
            href="/compte/boutique/personnaliser#contacts"
            className="mt-2 inline-flex text-xs font-bold underline underline-offset-2"
          >
            {hasContact ? "Vérifier les coordonnées" : "Ajouter mes coordonnées"}
          </Link>
        </li>

        <li className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-muted)]">Étape 2</p>
          <p className="mt-1 text-sm font-bold">Validation de la boutique</p>
          <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
            {hasContact
              ? "Tes coordonnées sont prêtes. Envoie maintenant la boutique à Revant."
              : "Cette demande sera disponible dès qu’un numéro public sera enregistré."}
          </p>
          <form action={formAction} className="mt-3">
            <button
              type="submit"
              disabled={pending || !hasContact}
              className="w-full rounded-full bg-[var(--brand-accent)] px-3 py-2.5 text-xs font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pending ? "Envoi..." : "Soumettre la boutique"}
            </button>
          </form>
        </li>

        <li className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-muted)]">Étape 3</p>
          <p className="mt-1 text-sm font-bold">Validation des produits</p>
          <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
            Après approbation de la boutique, Revant pourra examiner les annonces.
          </p>
          <p className="mt-2 text-xs font-semibold text-[var(--brand-text)]">
            {pendingProductCount} annonce{pendingProductCount > 1 ? "s" : ""} en attente
          </p>
        </li>
      </ol>

      {state.error && <p role="alert" className="mt-3 text-xs text-red-600">{state.error}</p>}
      {state.success && <p role="status" className="mt-3 text-xs text-green-700">{state.success}</p>}
    </section>
  );
}
