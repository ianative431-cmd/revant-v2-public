"use client";

import { useActionState } from "react";
import { updateShop } from "@/server/shops/actions";

type Props = {
  initialName: string;
  initialDescription: string;
  initialSlug: string;
};

export default function EditShopForm({
  initialName,
  initialDescription,
  initialSlug,
}: Props) {
  const [state, formAction, pending] = useActionState(updateShop, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-[var(--brand-muted)]">
        Nom
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initialName}
          className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/15"
        />
      </label>

      <label className="text-xs text-black/60">
        Description
        <textarea
          name="description"
          maxLength={1000}
          rows={4}
          defaultValue={initialDescription}
          className="mt-1 w-full resize-none rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/15"
        />
      </label>

      <label className="text-xs text-black/60">
        Adresse de la boutique (revant.app/shop/...)
        <input
          name="slug"
          type="text"
          required
          minLength={3}
          maxLength={40}
          pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
          defaultValue={initialSlug}
          className="mt-1 w-full border rounded-xl px-4 py-3 text-sm"
        />
      </label>
      <p className="text-xs text-[var(--brand-muted)] -mt-2">
        Attention : les anciens liens ne seront plus redirigés après un changement d&apos;adresse.
      </p>

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--brand-accent)] py-3 text-sm font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
