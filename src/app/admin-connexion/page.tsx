"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInSuperAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { error: null };

export default function AdminConnexionPage() {
  const [state, formAction, pending] = useActionState(signInSuperAdmin, initialState);

  return (
    <main className="min-h-screen bg-[#0B0B10] px-5 py-10 text-white flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#803e2f] text-2xl font-bold">
            R
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Revant · Accès privé
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Espace super-administrateur</h1>
          <p className="mt-2 text-sm text-white/55">
            Connecte-toi avec le compte autorisé à gérer la plateforme.
          </p>
        </div>

        <form action={formAction} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <label htmlFor="admin-email" className="mb-2 block text-sm text-white/75">
            Adresse e-mail
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            maxLength={254}
            required
            className="mb-5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base outline-none focus:border-white/50"
            placeholder="Ton e-mail administrateur"
          />

          <label htmlFor="admin-password" className="mb-2 block text-sm text-white/75">
            Mot de passe
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base outline-none focus:border-white/50"
            placeholder="Ton mot de passe"
          />

          {state.error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0B0B10] disabled:opacity-50"
          >
            {pending ? "Vérification sécurisée…" : "Accéder à l’administration"}
          </button>
          <p className="mt-4 text-center text-xs text-white/40">
            L’accès est accordé uniquement si le rôle super-administrateur est confirmé côté serveur.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-white/45">
          <Link href="/" className="underline underline-offset-4 hover:text-white">
            Retour au site public
          </Link>
        </p>
      </section>
    </main>
  );
}
