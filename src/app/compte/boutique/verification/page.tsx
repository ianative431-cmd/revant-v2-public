import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { submitKycDocument } from "@/server/kyc/actions";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Non commencé",
  pending: "En attente de vérification",
  approved: "Vérification approuvée",
  rejected: "Dossier refusé",
  expired: "Document expiré",
};

const ERRORS: Record<string, string> = {
  identity: "Vérifie le nom légal (2 à 120 caractères).",
  type: "Choisis un type de document valide.",
  country: "Indique le code pays à deux lettres (ex. NE).",
  last4: "Les quatre derniers chiffres doivent être numériques.",
  size: "Le fichier est obligatoire et ne doit pas dépasser 8 Mo.",
  format: "Format accepté : PDF, JPG ou PNG.",
  load: "Impossible de charger ton dossier. Réessaie plus tard.",
  locked: "Ton dossier est déjà en cours de vérification ou approuvé.",
  upload: "Le document n'a pas pu être envoyé. Réessaie.",
  save: "Le document a été envoyé, mais l'enregistrement du dossier a échoué. Contacte le support.",
};

export default async function VerificationBoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  const params = await searchParams;

  if (!shop) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Vérification de la boutique</h1>
          <p className="mt-3 text-sm text-brand-text/70">Crée d&apos;abord ta boutique pour déposer tes justificatifs.</p>
          <Link href="/boutiques/creer" className="mt-5 inline-block rounded-full bg-brand-accent px-5 py-3 text-sm text-white">Créer ma boutique</Link>
        </div>
      </main>
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: kyc } = await admin
    .from("kyc_profiles")
    .select("status,legal_name,document_type,submitted_at,rejection_reason,document_path")
    .eq("user_id", user.id)
    .maybeSingle();
  const status = kyc?.status ?? "not_started";
  const canSubmit = status === "not_started" || status === "rejected" || status === "expired";

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-xl rounded-[22px] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/compte/boutique" className="text-sm text-brand-text/60 underline">← Ma boutique</Link>
        <h1 className="mt-4 text-2xl font-bold">Vérification de ma boutique</h1>
        <p className="mt-2 text-sm text-brand-text/65">Envoie un justificatif pour confirmer ton identité. Tes documents restent privés et ne sont visibles que par les personnes autorisées à traiter le dossier.</p>

        <section className="mt-6 rounded-xl border border-brand-border p-4">
          <p className="text-xs text-brand-text/60">État du dossier</p>
          <p className="mt-1 font-semibold">{STATUS_LABELS[status] ?? "Statut inconnu"}</p>
          {kyc?.submitted_at && <p className="mt-1 text-xs text-brand-text/60">Déposé le {new Date(kyc.submitted_at).toLocaleDateString("fr-FR")}</p>}
          {kyc?.rejection_reason && <p className="mt-3 text-sm text-red-700">Motif : {kyc.rejection_reason}</p>}
        </section>

        {params.submitted === "1" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Ton dossier a été transmis. Tu recevras une réponse après examen.</p>}
        {params.error && ERRORS[params.error] && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{ERRORS[params.error]}</p>}

        {canSubmit ? (
          <form action={submitKycDocument} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Nom complet légal
              <input name="legalName" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3" />
            </label>
            <label className="block text-sm font-medium">Type de justificatif
              <select name="documentType" required defaultValue="" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3">
                <option value="" disabled>Choisir un document</option>
                <option value="national_id">Carte nationale d&apos;identité</option>
                <option value="passport">Passeport</option>
                <option value="driver_license">Permis de conduire</option>
              </select>
            </label>
            <label className="block text-sm font-medium">Pays émetteur (code à 2 lettres)
              <input name="country" required minLength={2} maxLength={2} defaultValue="NE" placeholder="NE" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 uppercase" />
            </label>
            <label className="block text-sm font-medium">4 derniers chiffres (facultatif)
              <input name="last4" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="1234" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3" />
            </label>
            <label className="block text-sm font-medium">Photo ou scan du document
              <input name="document" type="file" required accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-1 block w-full text-sm" />
              <span className="mt-1 block text-xs text-brand-text/60">PDF, JPG ou PNG · 8 Mo maximum. N&apos;envoie jamais ton mot de passe ni tes coordonnées bancaires.</span>
            </label>
            <button type="submit" className="w-full rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-white">Envoyer pour vérification</button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-brand-text/65">{status === "pending" ? "Ton dossier est en cours d'examen. Tu n'as rien à faire pour le moment." : "Ta boutique est vérifiée."}</p>
        )}
      </div>
    </main>
  );
}
