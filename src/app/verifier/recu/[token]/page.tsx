import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vérification d’un reçu — Revant",
  robots: { index: false, follow: false },
};

export default async function VerifyReceiptPage({ params }: Props) {
  const { token } = await params;

  // 32 random bytes encoded as base64url produce 43 characters.
  // Reject malformed tokens before any database request.
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();

  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("receipt_documents" as never)
    .select("document_number, document_type, issued_at, verification_revoked_at" as never)
    .eq("verification_token_hash" as never, tokenHash as never)
    .maybeSingle();

  if (error || !data) notFound();
  const document = data as unknown as {
    document_number: string;
    document_type: "receipt" | "invoice";
    issued_at: string;
    verification_revoked_at: string | null;
  };
  const valid = document.verification_revoked_at === null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-brand-text/45">Revant · Vérification officielle</p>
        <div className={valid ? "mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700" : "mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-700"} aria-hidden="true">{valid ? "✓" : "!"}</div>
        <h1 className="mt-4 text-xl font-bold">{valid ? "Document authentique" : "Document révoqué"}</h1>
        <p className="mt-2 text-sm text-brand-text/60">{valid ? "Ce document figure dans le registre officiel de Revant." : "Ce document figure dans le registre, mais sa vérification a été révoquée."}</p>
        <dl className="mt-6 space-y-3 rounded-xl bg-brand-bg/60 p-4 text-left text-sm">
          <div className="flex justify-between gap-4"><dt className="text-brand-text/55">Type</dt><dd className="font-medium">{document.document_type === "receipt" ? "Reçu" : "Facture"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-brand-text/55">Numéro</dt><dd className="font-mono font-semibold">{document.document_number}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-brand-text/55">Émis le</dt><dd>{new Date(document.issued_at).toLocaleDateString("fr-FR")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-brand-text/55">Authenticité</dt><dd className={valid ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{valid ? "Valide" : "Révoquée"}</dd></div>
        </dl>
        <p className="mt-5 text-xs text-brand-text/45">Cette vérification ne révèle aucune identité, adresse, coordonnée personnelle ni détail de paiement.</p>
      </section>
    </main>
  );
}
