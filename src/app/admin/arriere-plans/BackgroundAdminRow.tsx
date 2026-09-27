"use client";

import { useState } from "react";
import { useActionState } from "react";
import { toggleBackgroundActive, deleteBackground } from "@/server/backgrounds/admin-actions";
import type { Background } from "@/types/background";

export default function BackgroundAdminRow({
  background,
  usageCount,
}: {
  background: Background;
  usageCount: number;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleBackgroundActive, {
    error: null,
  });
  const [deleteState, deleteAction, deletePending] = useActionState(deleteBackground, {
    error: null,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{background.name}</p>
      <p className="text-xs text-black/50">{background.category}</p>
      <p className="text-[11px] text-black/40 mb-2">
        {background.is_active ? "Actif" : "Désactivé"} · Utilisé par {usageCount} boutique
        {usageCount !== 1 ? "s" : ""}
      </p>

      <div className="flex gap-2">
        <form action={toggleAction}>
          <input type="hidden" name="id" value={background.id} />
          <input type="hidden" name="nextActive" value={(!background.is_active).toString()} />
          <button
            type="submit"
            disabled={togglePending}
            className="text-xs border border-black rounded-full px-3 py-1 disabled:opacity-50"
          >
            {background.is_active ? "Désactiver" : "Activer"}
          </button>
        </form>

        {confirmDelete ? (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={background.id} />
            <input type="hidden" name="path" value={background.image_path} />
            <button
              type="submit"
              disabled={deletePending}
              className="text-xs bg-red-600 text-white rounded-full px-3 py-1 disabled:opacity-50"
            >
              Confirmer
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-red-600 underline"
          >
            Supprimer
          </button>
        )}
      </div>

      {(toggleState.error || deleteState.error) && (
        <p className="text-red-600 text-xs mt-1">{toggleState.error ?? deleteState.error}</p>
      )}
    </div>
  );
}
