import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { signOutAction } from "../(auth)/actions";
import Link from "next/link";
import AvatarUploader from "@/components/profile/AvatarUploader";
import SignOutForm from "@/components/native/SignOutForm";

export default async function ComptePage() {
  const user = await requireUserWithLegalConsent();
  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-xl rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-8">
        <AvatarUploader
          userId={user.id}
          initialAvatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
          email={user.email}
          phone={user.phone}
        />
        <h1 className="mb-1 text-center text-2xl font-black tracking-tight text-[var(--brand-text)]">Mon compte</h1>
        <p className="mb-6 text-center text-sm text-[var(--brand-muted)]">Connecté avec succès.</p>
        <dl className="mb-6 space-y-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4 text-sm">
          {user.email && <div className="flex justify-between"><dt className="text-[var(--brand-muted)]">E-mail</dt><dd>{user.email}</dd></div>}
          {user.phone && <div className="flex justify-between"><dt className="text-brand-text/60">Téléphone</dt><dd>{user.phone.startsWith("+") ? user.phone : `+${user.phone}`}</dd></div>}
          <div className="flex justify-between"><dt className="text-brand-text/60">Compte créé le</dt><dd>{new Date(user.created_at).toLocaleDateString("fr-FR")}</dd></div>
        </dl>
        <SignOutForm action={signOutAction} />
        <Link href="/compte/boutique" className="mt-4 block rounded-xl border border-[var(--brand-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]">Ma boutique</Link>
        <Link href="/compte/commandes" className="mt-2 block rounded-xl border border-[var(--brand-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]">Mes commandes</Link>
        <Link href="/compte/support" className="mt-2 block rounded-xl border border-[var(--brand-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]">Assistance Revant</Link>
        <Link href="/wallet" className="block text-center text-sm underline mt-2 text-brand-text/70">Mon Wallet</Link>
        <Link href="/compte/notifications" className="block text-center text-sm underline mt-2 text-brand-text/70">Notifications</Link>
        <Link href="/compte/livraisons" className="block text-center text-sm underline mt-2 text-brand-text/70">Espace livreur</Link>
        <Link href="/compte/blocages" className="block text-center text-sm underline mt-2 text-brand-text/70">Comptes bloqués</Link>
        <Link href="/parametres" className="block text-center text-sm underline mt-2 text-brand-text/70">Paramètres</Link>
        <Link href="/parametres#securite" className="block text-center text-sm underline mt-2 text-brand-text/70">Confidentialité et données</Link>
        <Link href="/compte/suppression" className="block text-center text-sm underline mt-2 text-brand-text/70">Suppression du compte</Link>
      </div>
    </div>
  );
}
