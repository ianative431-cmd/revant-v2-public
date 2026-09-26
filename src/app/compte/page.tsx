import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { signOutAction } from "../(auth)/actions";
import Link from "next/link";
import AvatarUploader from "@/components/profile/AvatarUploader";

export default async function ComptePage() {
  // Vérification côté serveur — inaccessible sans session valide, et
  // sans consentement légal à jour, quelle que soit l'URL tapée directement.
  const user = await requireUserWithLegalConsent();

  return (
    <div className="min-h-screen bg-[#EFEFED] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-[22px] p-8 shadow-sm">
        <AvatarUploader
          userId={user.id}
          initialAvatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
          email={user.email}
          phone={user.phone}
        />
        <h1 className="text-xl font-bold mb-1 text-center">Mon compte</h1>
        <p className="text-sm text-neutral-500 mb-6 text-center">Connecté avec succès.</p>

        <dl className="text-sm mb-6 space-y-2">
          {user.email && (
            <div className="flex justify-between">
              <dt className="text-neutral-500">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
          )}
          {user.phone && (
            <div className="flex justify-between">
              <dt className="text-neutral-500">Téléphone</dt>
              <dd>+{user.phone}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-neutral-500">Compte créé le</dt>
            <dd>{new Date(user.created_at).toLocaleDateString("fr-FR")}</dd>
          </div>
        </dl>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full border border-black rounded-full py-3 text-sm font-medium"
          >
            Se déconnecter
          </button>
        </form>

        <Link
          href="/compte/boutique"
          className="block text-center text-sm underline mt-4 text-neutral-600"
        >
          Ma boutique
        </Link>

        <Link
          href="/compte/confidentialite"
          className="block text-center text-sm underline mt-2 text-neutral-600"
        >
          Confidentialité et données
        </Link>
      </div>
    </div>
  );
}
