import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

type DocumentRow = {
  id: string;
  order_id: string;
  document_type: "receipt" | "invoice";
  document_number: string;
  issued_at: string;
  verification_revoked_at: string | null;
};

export default async function AdminDocumentsFinanciersPage() {
  await requirePermission("finance.view");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("receipt_documents" as never)
    .select("id, order_id, document_type, document_number, issued_at, verification_revoked_at" as never)
    .order("issued_at" as never, { ascending: false })
    .limit(200);

  if (error) throw new Error("Impossible de charger les reçus et factures.");
  const rows = ((data ?? []) as unknown as DocumentRow[]).map((document) => ({
    numéro: document.document_number,
    type: document.document_type === "receipt" ? "Reçu" : "Facture",
    commande: document.order_id.slice(0, 8),
    émission: new Date(document.issued_at).toLocaleString("fr-FR"),
    vérification: document.verification_revoked_at ? "Révoquée" : "Valide",
  }));

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Reçus et factures</h1>
        <p className="mt-1 text-sm text-black/55">Registre central des documents émis par Revant. Consultation uniquement : aucun document ne peut être modifié ou supprimé depuis cet écran.</p>
      </header>
      <p className="rounded-xl bg-black/5 p-3 text-sm text-black/65">Aucun document financier n’a encore été émis. Les reçus et factures apparaîtront ici après leur première émission. Les associés n’ont pas accès à ce module.</p>
      <AdminDataTable rows={rows} columns={[{key:"numéro",label:"Numéro"},{key:"type",label:"Type"},{key:"commande",label:"Commande"},{key:"émission",label:"Émis le"},{key:"vérification",label:"Vérification"}]} />
    </section>
  );
}
