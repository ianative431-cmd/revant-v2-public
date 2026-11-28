import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import SupportTicketForm from "./SupportTicketForm";

export default async function NouveauDossierSupportPage() {
  await requireUserWithLegalConsent();
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/compte/support" className="text-sm text-brand-text/60 underline">← Assistance Revant</Link>
        <h1 className="mt-5 text-2xl font-black text-brand-text">Contacter l’assistance</h1>
        <p className="mt-2 mb-6 text-sm text-brand-text/60">Décris ton problème. Tu pourras suivre les réponses dans ton espace d’assistance.</p>
        <SupportTicketForm />
      </div>
    </main>
  );
}
