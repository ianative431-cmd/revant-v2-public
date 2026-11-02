import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminSecuritePage() {
  await requirePermission("audit.view");
  const supabase = createSupabaseAdminClient();
  const [{ data: logs, error: logsError }, { data: actions, error: actionsError }] = await Promise.all([
    supabase.from("audit_logs").select("id, actor_id, action, entity_type, entity_id, description, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("admin_actions").select("id, admin_id, action, target_type, target_id, reason, created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  if (logsError || actionsError) throw new Error("Impossible de charger les journaux de sécurité.");
  const rows = [
    ...(logs ?? []).map((item) => ({ id: item.id, source: "Journal système", acteur: item.actor_id?.slice(0, 8) ?? "Système", action: item.action, cible: item.entity_type, référence: item.entity_id?.slice(0, 8) ?? null, détail: item.description, date: new Date(item.created_at).toLocaleString("fr-FR") })),
    ...(actions ?? []).map((item) => ({ id: item.id, source: "Action admin", acteur: item.admin_id.slice(0, 8), action: item.action, cible: item.target_type, référence: item.target_id?.slice(0, 8) ?? null, détail: item.reason, date: new Date(item.created_at).toLocaleString("fr-FR") })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Sécurité et journaux d&apos;audit</h1><p className="mt-1 text-sm text-black/55">Événements d&apos;audit et actions administratives réels. Consultation uniquement ; les journaux ne peuvent pas être modifiés depuis cette page.</p></header><AdminDataTable rows={rows} columns={[{key:"source",label:"Source"},{key:"acteur",label:"Acteur"},{key:"action",label:"Action"},{key:"cible",label:"Type"},{key:"référence",label:"Référence"},{key:"détail",label:"Détail"},{key:"date",label:"Date"}]} /></section>;
}
