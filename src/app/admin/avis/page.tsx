import { requirePermission } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

export default async function AdminAvisPage() {
  await requirePermission("support.manage");
  return <section className="max-w-2xl space-y-4"><header><h1 className="text-xl font-bold">Avis et signalements</h1><p className="mt-1 text-sm text-black/55">État réel du module.</p></header><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-semibold">Le système d&apos;avis vérifiés n&apos;est pas encore créé.</p><p className="mt-2">La base actuelle ne contient pas de table d&apos;avis reliée à une commande livrée. Je ne crée donc pas de faux avis ni de faux signalements. La prochaine implémentation doit lier chaque avis à un achat réel, empêcher les doublons et prévoir la modération avec journalisation.</p></div></section>;
}
