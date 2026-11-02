"use client";

import { useActionState } from "react";
import { updateShop } from "@/server/shops/actions";

type Props = {
  initialName: string;
  initialDescription: string;
  initialSlug: string;
  initialCity: string;
  initialPhone: string;
  initialWhatsapp: string;
  initialInstagram: string;
  initialTiktok: string;
  initialSnapchat: string;
};

export default function EditShopForm({
  initialName,
  initialDescription,
  initialSlug,
  initialCity,
  initialPhone,
  initialWhatsapp,
  initialInstagram,
  initialTiktok,
  initialSnapchat,
}: Props) {
  const [state, formAction, pending] = useActionState(updateShop, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-xs text-black/60">
        Nom
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initialName}
          className="mt-1 w-full border rounded-xl px-4 py-3 text-sm"
        />
      </label>

      <label className="text-xs text-black/60">
        Description
        <textarea
          name="description"
          maxLength={1000}
          rows={4}
          defaultValue={initialDescription}
          className="mt-1 w-full border rounded-xl px-4 py-3 text-sm resize-none"
        />
      </label>

      <div className="mt-2 border-t border-black/10 pt-3">
        <p className="mb-3 text-xs font-semibold text-black/80">Coordonnées publiques</p>
        <label className="mb-3 block text-xs text-black/60">
          Ville
          <input name="city" type="text" maxLength={80} defaultValue={initialCity} placeholder="Ex. Niamey" className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" />
        </label>
        <label className="mb-3 block text-xs text-black/60">
          Téléphone
          <input name="phone" type="tel" maxLength={30} defaultValue={initialPhone} placeholder="+227 ..." className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" />
        </label>
        <label className="mb-3 block text-xs text-black/60">
          WhatsApp
          <input name="whatsapp" type="tel" maxLength={30} defaultValue={initialWhatsapp} placeholder="+227 ..." className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" />
        </label>
      </div>

      <div className="mt-1 border-t border-black/10 pt-3">
        <p className="mb-3 text-xs font-semibold text-black/80">Réseaux sociaux</p>
        <label className="mb-3 block text-xs text-black/60">
          Instagram
          <input name="instagram" type="text" maxLength={160} defaultValue={initialInstagram} placeholder="@ma_boutique ou lien Instagram" className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" />
        </label>
        <label className="mb-3 block text-xs text-black/60">
          TikTok
          <input name="tiktok" type="text" maxLength={160} defaultValue={initialTiktok} placeholder="@ma_boutique ou lien TikTok" className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" />
        </label>
        <label className="mb-3 block text-xs text-black/60">
          Snapchat
          <input name="snapchat" type="text" maxLength={160} defaultValue={initialSnapchat} placeholder="Nom d’utilisateur ou lien Snapchat" className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" />
        </label>
        <p className="text-[11px] text-black/45">Tu peux saisir un nom d’utilisateur ou un lien HTTPS officiel.</p>
      </div>

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
      <p className="text-xs text-black/40 -mt-2">
        Si tu changes l&apos;adresse, l&apos;ancien lien ne fonctionnera plus : pense à partager
        la nouvelle adresse.
      </p>

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
