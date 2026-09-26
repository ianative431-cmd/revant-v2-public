import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { hasCurrentLegalConsent } from "@/server/legal/consent";
import ReconsentForm from "./ReconsentForm";

export default async function ReconsentementPage() {
  const user = await requireUser();

  // Si l'utilisateur est déjà à jour (ex. accès direct à l'URL), inutile
  // de lui montrer cet écran.
  if (hasCurrentLegalConsent(user)) {
    redirect("/compte");
  }

  return (
    <div className="min-h-screen bg-[#EFEFED] px-4 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-[22px] p-8 shadow-sm">
        <h1 className="text-xl font-bold mb-1">Nos conditions ont été mises à jour</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Merci de relire et d&apos;accepter la nouvelle version avant de continuer à utiliser ton
          compte Revant.
        </p>
        <div className="flex flex-col gap-2 text-sm mb-6">
          <Link href="/legal/cgu" className="underline">
            Conditions Générales d&apos;Utilisation
          </Link>
          <Link href="/legal/confidentialite" className="underline">
            Politique de confidentialité
          </Link>
        </div>
        <ReconsentForm />
      </div>
    </div>
  );
}
