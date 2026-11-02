import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminParametresPage() {
  await requirePermission("settings.manage");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("system_settings")
    .select("key, value, value_type, description, is_public, updated_at")
    .order("key", { ascending: true });
  if (error) throw new Error("Impossible de charger les paramètres.");
  const rows = (data ?? []).filter((item) => !/(secret|token|password|private_key|api_key)/i.test(item.key))
    .map((item) => ({
      id: item.key,
      clé: item.key,
      valeur: typeof item.value === "string" ? item.value : JSON.stringify(item.value),
      type: item.value_type,
      description: item.description,
      visibilité: item.is_public ? "Publique" : "Privée",
      modifié: new Date(item.updated_at).toLocaleString("fr-FR"),
    }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Paramètres de la plateforme</h1><p className="mt-1 text-sm text-black/55">Configuration réellement enregistrée dans Supabase. Les modifications passent par les RPC contrôlés et journalisés ; aucun secret n&apos;est affiché.</p></header><AdminDataTable rows={rows} columns={[{key:"clé",label:"Paramètre"},{key:"valeur",label:"Valeur"},{key:"type",label:"Type"},{key:"description",label:"Description"},{key:"visibilité",label:"Visibilité"},{key:"modifié",label:"Dernière mise à jour"}]} /></section>;
}
