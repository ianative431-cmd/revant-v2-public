import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  past_due: "Paiement en attente",
  cancelled: "Annulé",
  expired: "Expiré",
};

function formatDate(value: string | null) {
  if (!value) return "Non définie";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Niamey",
  });
}

export default async function AbonnementBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl bg-white p-6">
        <h1 className="text-xl font-bold">Abonnement boutique</h1>
        <p className="mt-2 text-sm text-black/60">Crée d&apos;abord ta boutique pour consulter son abonnement.</p>
        <Link href="/boutiques/creer" className="mt-4 inline-block underline">Créer ma boutique</Link>
      </section>
    );
  }

  // La politique RLS « owners view subscriptions » limite cette lecture
  // aux abonnements appartenant à l'utilisateur connecté.
  const { data: subscription, error } = await supabase
    .from("store_subscriptions")
    .select("plan_name, amount, currency, status, provider, started_at, current_period_start, current_period_end, cancelled_at")
    .eq("shop_id", shop.id)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Impossible de charger l'abonnement de cette boutique.");
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <Link href="/compte/boutique" className="text-sm underline text-black/60">← Ma boutique</Link>
      <header>
        <h1 className="mt-3 text-xl font-bold">Abonnement de {shop.name}</h1>
        <p className="mt-1 text-sm text-black/60">Consulte le statut réellement enregistré pour ta boutique.</p>
      </header>

      {subscription ? (
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-black/60">Statut</span>
            <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium">
              {STATUS_LABELS[subscription.status] ?? subscription.status}
            </span>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-black/55">Offre</dt><dd className="font-medium">{subscription.plan_name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-black/55">Montant enregistré</dt><dd className="font-medium">{Number(subscription.amount).toLocaleString("fr-FR")} {subscription.currency}/mois</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-black/55">Début</dt><dd>{formatDate(subscription.started_at)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-black/55">Début de période</dt><dd>{formatDate(subscription.current_period_start)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-black/55">Fin de période</dt><dd>{formatDate(subscription.current_period_end)}</dd></div>
            {subscription.cancelled_at && <div className="flex justify-between gap-4"><dt className="text-black/55">Annulé le</dt><dd>{formatDate(subscription.cancelled_at)}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-black/55">Prestataire</dt><dd>{subscription.provider ?? "Non renseigné"}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="font-semibold">Aucun abonnement enregistré</p>
          <p className="mt-2 text-sm text-black/60">Aucun contrat actif ou historique n&apos;est actuellement associé à cette boutique.</p>
        </div>
      )}

      <div className="rounded-2xl bg-black/5 p-4 text-sm text-black/65">
        <p className="font-semibold text-black">Information importante</p>
        <p className="mt-1">Le tarif de référence prévu est de 5 000 XOF par mois. Le paiement, le renouvellement automatique et l&apos;activation de l&apos;offre ne sont pas encore disponibles. Cette page est uniquement consultative : aucun prélèvement ni changement de statut n&apos;est effectué ici.</p>
      </div>
    </section>
  );
}
