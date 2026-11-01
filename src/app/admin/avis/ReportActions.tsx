"use client";

import { useActionState } from "react";
import { updateAdminReport, type ReportActionState } from "@/server/admin/report-actions";

const initialState: ReportActionState = { error: null };

export default function ReportActions({ reportId, status }: { reportId: string; status: string }) {
  const [state, formAction, pending] = useActionState(updateAdminReport, initialState);
  if (status === "resolved" || status === "dismissed") return <span className="text-xs text-black/40">Clôturé</span>;

  return <form action={formAction} className="mt-3 space-y-2">
    <input type="hidden" name="reportId" value={reportId} />
    <label className="block text-xs font-medium text-black/55" htmlFor={`report-action-${reportId}`}>Action</label>
    <select id={`report-action-${reportId}`} name="action" defaultValue={status === "open" ? "review" : "resolve"} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs">
      {status === "open" && <option value="review">Prendre en charge</option>}
      <option value="resolve">Résoudre</option>
      <option value="dismiss">Rejeter le signalement</option>
    </select>
    <textarea name="note" maxLength={500} rows={2} placeholder="Note de traitement (obligatoire pour clôturer)" className="w-full rounded-lg border border-black/10 px-3 py-2 text-xs" />
    <button type="submit" disabled={pending} className="rounded-full bg-[#0B0B10] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer"}</button>
    {state.error && <p role="alert" className="text-xs text-red-700">{state.error}</p>}
  </form>;
}
