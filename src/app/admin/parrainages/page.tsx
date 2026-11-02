import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminParrainagesPage() {
  await requirePermission("support.manage");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("referrals")
    .select("id, referrer_id, referred_user_id, referral_code, status, reward_amount, currency, created_at, qualified_at, rewarded_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Impossible de charger les parrainages.");
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    parrain: item.referrer_id.slice(0, 8),
    invité: item.referred_user_id ? item.referred_user_id.slice(0, 8) : "En attente",
    code: item.referral_code,
    statut: item.status,
    récompense: `${Number(item.reward_amount).toLocaleString("fr-FR")} ${item.currency}`,
    créé: new Date(item.created_at).toLocaleString("fr-FR"),
    qualifié: item.qualified_at ? new Date(item.qualified_at).toLocaleString("fr-FR") : null,
    récompensé: item.rewarded_at ? new Date(item.rewarded_at).toLocaleString("fr-FR") : null,
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Parrainages</h1><p className="mt-1 text-sm text-black/55">Suivi des invitations et récompenses réellement enregistrées. Aucune récompense n&apos;est déclenchée depuis cette page.</p></header><AdminDataTable rows={rows} columns={[{key:"id",label:"Parrainage"},{key:"parrain",label:"Parrain"},{key:"invité",label:"Invité"},{key:"code",label:"Code"},{key:"statut",label:"Statut"},{key:"récompense",label:"Récompense"},{key:"créé",label:"Créé le"},{key:"qualifié",label:"Qualifié le"},{key:"récompensé",label:"Récompensé le"}]} /></section>;
}
