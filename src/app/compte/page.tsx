import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { signOutAction } from "../(auth)/actions";
import Link from "next/link";
import AvatarUploader from "@/components/profile/AvatarUploader";
import SignOutForm from "@/components/native/SignOutForm";

export default async function ComptePage() {
  const user = await requireUserWithLegalConsent();
  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm bg-brand-surface border border-brand-border rounded-[22px] p-8 shadow-sm">
        <AvatarUploader
          userId={user.id}
          initialAvatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
          email={user.email}
          phone={user.phone}
        />
        <h1 className="text-xl font-bold mb-1 text-center">Mon compte</h1>
        <p className="text-sm text-brand-text/60 mb-6 text-center">Connecté avec succès.</p>
        <dl className="text-sm mb-6 space-y-2">
          {user.email && <div className="flex justify-between"><dt className="text-brand-text/60">E-mail</dt><dd>{user.email}</dd></div>}
          {user.phone && <div className="flex justify-between"><dt className="text-brand-text/60">Téléphone</dt><dd>+{user.phone}</dd></div>}
          <div className="flex justify-between"><dt className="text-brand-text/60">Compte créé le</dt><dd>{new Date(user.created_at).toLocaleDateString("fr-FR")}</dd></div>
        </dl>
        <SignOutForm action={signOutAction} />
        <Link href="/compte/boutique" className="block text-center text-sm underline mt-4 text-brand-text/70">Ma boutique</Link>
        <Link href="/compte/commandes" className="block text-center text-sm underline mt-2 text-brand-text/70">Mes commandes</Link>
        <Link href="/compte/notifications" className="block text-center text-sm underline mt-2 text-brand-text/70">Notifications</Link>
        <Link href="/compte/livraisons" className="block text-center text-sm underline mt-2 text-brand-text/70">Espace livreur</Link>
        <Link href="/compte/blocages" className="block text-center text-sm underline mt-2 text-brand-text/70">Comptes bloqués</Link>
        <Link href="/parametres#securite" className="block text-center text-sm underline mt-2 text-brand-text/70">Confidentialité et données</Link>
      </div>
    </div>
  );
}
