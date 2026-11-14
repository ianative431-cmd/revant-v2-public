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
    <section id="contacts" className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
      <h2 className="text-sm font-semibold">Coordonnées et réseaux sociaux</h2>
      <p className="mt-1 text-xs text-black/55">
        Ces informations apparaissent sur la vitrine publique de ta boutique.
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <label className="text-xs text-black/65">
          Téléphone
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={25}
            defaultValue={phone ?? ""}
            placeholder={phonePlaceholder}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
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
        <p className="-mt-2 text-[11px] text-black/45">
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
          className="rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : "Enregistrer les coordonnées"}
        </button>
      </form>
    </section>
  );
}
