"use client";

import { useActionState } from "react";
import {
  updateShopContacts,
  type ShopContactActionState,
} from "@/server/shops/contact-actions";

type Props = {
  countryCode: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  snapchat: string | null;
};

const INITIAL_STATE: ShopContactActionState = { error: null, success: null };

export default function ShopContactForm({
  countryCode,
  phone,
  whatsapp,
  instagram,
  tiktok,
  snapchat,
}: Props) {
  const [state, formAction, pending] = useActionState(updateShopContacts, INITIAL_STATE);
  const phonePlaceholder = countryCode === "NE" ? "90 12 34 56 ou +227..." : "+indicatif numéro";

  return (
    <section id="contacts" className="mt-6 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-extrabold text-[var(--brand-text)]">Coordonnées et réseaux sociaux</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
        Ces informations apparaissent sur la vitrine publique de ta boutique.
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <label className="text-xs font-semibold text-[var(--brand-muted)]">
          Téléphone
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={25}
            defaultValue={phone ?? ""}
            placeholder={phonePlaceholder}
            className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/15"
          />
        </label>

        <label className="text-xs text-black/65">
          WhatsApp
          <input
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            maxLength={25}
            defaultValue={whatsapp ?? ""}
            placeholder={phonePlaceholder}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          />
        </label>
        <p className="-mt-2 text-[11px] leading-5 text-[var(--brand-muted)]">
          Au Niger, un numéro local est enregistré avec +227. Pour un autre pays, saisis le numéro avec son indicatif international. Si WhatsApp reste vide, le numéro de téléphone sera utilisé.
        </p>

        <label className="text-xs text-black/65">
          Instagram
          <input
            name="instagram"
            type="text"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={300}
            defaultValue={instagram ?? ""}
            placeholder="@boutique ou lien HTTPS"
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          />
        </label>

        <label className="text-xs text-black/65">
          TikTok
          <input
            name="tiktok"
            type="text"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={300}
            defaultValue={tiktok ?? ""}
            placeholder="@boutique ou lien HTTPS"
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          />
        </label>

        <label className="text-xs text-black/65">
          Snapchat
          <input
            name="snapchat"
            type="text"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={300}
            defaultValue={snapchat ?? ""}
            placeholder="Pseudo ou lien HTTPS"
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          />
        </label>

        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p role="status" className="text-sm text-green-700">{state.success}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--brand-accent)] py-3 text-sm font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : "Enregistrer les coordonnées"}
        </button>
      </form>
    </section>
  );
}
