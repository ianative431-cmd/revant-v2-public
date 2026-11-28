"use client";

import { useActionState } from "react";
import {
  claimSupportTicketAction,
  updateSupportTicketAction,
  type SupportActionState,
} from "@/server/support/actions";

const INITIAL_STATE: SupportActionState = { error: null };

const STATUSES = [
  ["open", "Ouvert"],
  ["in_progress", "En cours"],
  ["waiting_user", "En attente du client"],
  ["resolved", "Résolu"],
  ["closed", "Clôturé"],
] as const;

const PRIORITIES = [
  ["low", "Basse"],
  ["normal", "Normale"],
  ["high", "Haute"],
  ["urgent", "Urgente"],
] as const;

export default function SupportTicketControls({
  ticketId,
  status,
  priority,
  assignedTo,
  currentUserId,
  canManageAll,
}: {
  ticketId: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  currentUserId: string;
  canManageAll: boolean;
}) {
  const [claimState, claimAction, claimPending] = useActionState(claimSupportTicketAction, INITIAL_STATE);
  const [updateState, updateAction, updatePending] = useActionState(updateSupportTicketAction, INITIAL_STATE);
  const canClaim = !assignedTo || assignedTo === currentUserId || canManageAll;

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">Prise en charge</p>
          <p className="mt-1 text-sm text-[var(--brand-text)]">{assignedTo === currentUserId ? "Tu es responsable de ce dossier." : assignedTo ? "Dossier pris en charge par un autre agent." : "Dossier non attribué."}</p>
        </div>
        {canClaim && assignedTo !== currentUserId && (
          <form action={claimAction}>
            <input type="hidden" name="ticketId" value={ticketId} />
            <button type="submit" disabled={claimPending} className="rounded-full border border-brand-accent px-4 py-2 text-xs font-bold text-brand-accent disabled:opacity-50">
              {claimPending ? "Attribution…" : "Prendre en charge"}
            </button>
          </form>
        )}
      </div>
      {claimState.error && <p role="alert" className="text-xs text-red-700">{claimState.error}</p>}
      {claimState.success && <p role="status" className="text-xs text-emerald-700">Dossier attribué.</p>}
      <form action={updateAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="block text-xs font-semibold text-[var(--brand-muted)]">
          Statut
          <select name="status" defaultValue={status} className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm font-normal text-[var(--brand-text)]">
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[var(--brand-muted)]">
          Priorité
          <select name="priority" defaultValue={priority} className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm font-normal text-[var(--brand-text)]">
            {PRIORITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit" disabled={updatePending} className="rounded-full bg-brand-accent px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
          {updatePending ? "Mise à jour…" : "Enregistrer"}
        </button>
      </form>
      {updateState.error && <p role="alert" className="text-xs text-red-700">{updateState.error}</p>}
      {updateState.success && <p role="status" className="text-xs text-emerald-700">Dossier mis à jour.</p>}
    </div>
  );
}
