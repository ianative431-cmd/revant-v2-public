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
};

const INITIAL_STATE: ShopReviewActionState = { error: null, success: null };

export default function ShopReviewPanel({ status, hasContact }: Props) {
  const [state, formAction, pending] = useActionState(submitShopForReview, INITIAL_STATE);

  if (status === "active") {
    return (
      <section className="mb-5 rounded-2xl border border-green-700/20 bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-green-700">Boutique publiée</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">Ta vitrine est accessible publiquement sur Revant.</p>
      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="mb-5 rounded-2xl border border-amber-700/20 bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-amber-700">Validation en attente</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">La demande a été envoyée. L&apos;équipe Revant doit approuver la boutique avant sa publication.</p>
      </section>
    );
  }

  if (status === "suspended") {
    return (
      <section className="mb-5 rounded-2xl border border-red-600/20 bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-red-600">Boutique suspendue</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">La vitrine n&apos;est pas visible publiquement. Contacte l&apos;administration Revant pour connaître la raison.</p>
      </section>
    );
  }

  if (status === "closed") {
    return (
      <section className="mb-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm">
        <p className="text-sm font-semibold">Boutique fermée</p>
        <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">Cette boutique n&apos;est pas publiée.</p>
      </section>
    );
  }

  if (status !== "draft") return null;

  return (
    <section className="mb-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Publication de la boutique</h2>
      <p className="mt-1 text-xs text-black/55">
        Ta boutique est encore en brouillon. Elle ne sera visible par les clients qu&apos;après validation.
      </p>

      {!hasContact ? (
        <p className="mt-3 text-xs text-amber-700">
          Ajoute d&apos;abord un téléphone ou WhatsApp dans{" "}
          <Link href="/compte/boutique/personnaliser#contacts" className="font-semibold underline">
            Coordonnées et réseaux sociaux
          </Link>.
        </p>
      ) : (
        <form action={formAction} className="mt-3">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--brand-accent)] py-3 text-sm font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Envoi..." : "Envoyer ma boutique pour validation"}
          </button>
        </form>
      )}

      {state.error && <p role="alert" className="mt-2 text-xs text-red-600">{state.error}</p>}
      {state.success && <p role="status" className="mt-2 text-xs text-green-700">{state.success}</p>}
    </section>
  );
}
