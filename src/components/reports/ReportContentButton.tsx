"use client";

import { useActionState } from "react";
import { submitContentReport, type ReportActionState } from "@/server/reports/actions";

type ReportTarget = {
  type: "user" | "shop" | "product" | "review" | "message" | "order";
  id: string;
  label: string;
};

const INITIAL_STATE: ReportActionState = { error: null };

export default function ReportContentButton({ targets }: { targets: ReportTarget[] }) {
  const [state, formAction, pending] = useActionState(submitContentReport, INITIAL_STATE);
  if (targets.length === 0) return null;

  return (
    <details className="mt-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4">
      <summary className="cursor-pointer text-xs font-bold text-[var(--brand-muted)]">
        Signaler un problème
      </summary>
      {state.success ? (
        <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">
          Merci. Ton signalement a été transmis à l’équipe de modération.
        </p>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
          <label className="block text-xs font-semibold">
            Élément concerné
            <select name="target" required className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm">
              {targets.map((target) => (
                <option key={`${target.type}:${target.id}`} value={`${target.type}:${target.id}`}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Motif
            <select name="reason" required defaultValue="" className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm">
              <option value="" disabled>Choisir un motif</option>
              <option value="spam">Spam ou annonce répétitive</option>
              <option value="fraud">Fraude ou tentative d’arnaque</option>
              <option value="counterfeit">Contrefaçon ou produit interdit</option>
              <option value="inappropriate">Contenu inapproprié</option>
              <option value="harassment">Harcèlement ou comportement abusif</option>
              <option value="misleading">Informations trompeuses</option>
              <option value="other">Autre problème</option>
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Détails (facultatif)
            <textarea name="description" maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm" placeholder="Explique brièvement le problème." />
          </label>
          {state.error && <p role="alert" className="text-xs text-red-700">{state.error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-full bg-brand-accent px-4 py-3 text-xs font-bold text-white disabled:opacity-50">
            {pending ? "Envoi…" : "Envoyer le signalement"}
          </button>
        </form>
      )}
    </details>
  );
}
