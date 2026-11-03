import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClaimDeliveryButton, DeliveryCodeForm, DeliveryStepButton } from "./DriverActions";

type AvailableDelivery = {
  delivery_id: string;
  order_id: string;
  order_number: string;
  pickup_address: string | null;
  created_at: string;
  requested_at: string;
};

type AssignedDelivery = {
  delivery_id: string;
  order_id: string;
  order_number: string;
  status: "assigned" | "picked_up" | "in_transit" | "failed";
  pickup_address: string | null;
  delivery_address: string | null;
  delivery_code_hint: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

type DriverDashboardRpc = {
  rpc: (name: string) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const DELIVERY_STATUS: Record<AssignedDelivery["status"], string> = {
  assigned: "À récupérer",
  picked_up: "Récupérée",
  in_transit: "En route",
  failed: "Échec signalé",
};

export default async function DriverDeliveriesPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id,full_name,vehicle_type,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (driverError || !driver || driver.status !== "active") {
    return <div className="min-h-screen bg-brand-bg px-4 py-10"><div className="mx-auto max-w-xl rounded-2xl bg-white p-6">
      <Link href="/compte" className="text-sm underline text-brand-text/60">← Mon compte</Link>
      <h1 className="mt-4 text-xl font-bold">Espace livreur</h1>
      <p className="mt-3 text-sm leading-6 text-brand-text/65">Cet espace est réservé aux livreurs dont le profil a été activé par l’administration Revant. Si tu dois effectuer des livraisons, demande l’activation de ton profil.</p>
    </div></div>;
  }

  const rpc = supabase as unknown as DriverDashboardRpc;
  const [availableResult, assignedResult] = await Promise.all([
    rpc.rpc("driver_list_available_deliveries"),
    rpc.rpc("driver_list_assigned_deliveries"),
  ]);
  const available = availableResult.error ? [] : (availableResult.data as AvailableDelivery[] | null) ?? [];
  const assigned = assignedResult.error ? [] : (assignedResult.data as AssignedDelivery[] | null) ?? [];

  return <div className="min-h-screen bg-brand-bg px-4 py-10">
    <div className="mx-auto max-w-3xl space-y-6">
      <header><Link href="/compte" className="text-sm underline text-brand-text/60">← Mon compte</Link><h1 className="mt-4 text-xl font-bold">Espace livreur</h1><p className="mt-1 text-sm text-brand-text/55">Bonjour {driver.full_name}. Les adresses clients ne sont visibles qu’après attribution de la livraison.</p></header>
      <section className="rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Mes livraisons attribuées</h2><span className="text-xs text-brand-text/45">{assigned.length}</span></div>
        {assigned.length === 0 ? <p className="mt-3 text-sm text-brand-text/55">Aucune livraison ne t’est actuellement attribuée.</p> : <div className="mt-3 space-y-3">{assigned.map((delivery) => <article key={delivery.delivery_id} className="rounded-xl border border-black/5 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">Commande {delivery.order_number}</p><p className="mt-1 text-xs text-brand-text/45">Attribuée le {delivery.assigned_at ? new Date(delivery.assigned_at).toLocaleString("fr-FR") : "—"}</p></div><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs">{DELIVERY_STATUS[delivery.status]}</span></div>
          {delivery.pickup_address && <p className="mt-3 text-sm"><span className="font-semibold">Retrait : </span>{delivery.pickup_address}</p>}
          {delivery.delivery_address && <p className="mt-2 text-sm"><span className="font-semibold">Destination : </span>{delivery.delivery_address}</p>}
          {delivery.delivery_code_hint && delivery.status === "in_transit" && <p className="mt-2 text-xs text-brand-text/50">Le code de remise se termine par {delivery.delivery_code_hint}.</p>}
          <div className="mt-3">{delivery.status === "assigned" && <DeliveryStepButton deliveryId={delivery.delivery_id} status="picked_up" />}{delivery.status === "picked_up" && <DeliveryStepButton deliveryId={delivery.delivery_id} status="in_transit" />}{delivery.status === "in_transit" && <DeliveryCodeForm deliveryId={delivery.delivery_id} />}{delivery.status === "failed" && <p className="text-xs text-red-700">{delivery.failure_reason || "Contacte le support pour résoudre cet incident."}</p>}</div>
        </article>)}</div>}
      </section>
      <section className="rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Livraisons disponibles</h2><span className="text-xs text-brand-text/45">{available.length}</span></div>
        {available.length === 0 ? <p className="mt-3 text-sm text-brand-text/55">Aucune nouvelle livraison disponible pour le moment.</p> : <div className="mt-3 space-y-3">{available.map((delivery) => <article key={delivery.delivery_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 p-3"><div className="min-w-0"><p className="font-semibold">Commande {delivery.order_number}</p><p className="mt-1 text-sm text-brand-text/65">{delivery.pickup_address || "Point de retrait à confirmer"}</p><p className="mt-1 text-xs text-brand-text/45">Demande du {new Date(delivery.requested_at).toLocaleString("fr-FR")}</p></div><ClaimDeliveryButton deliveryId={delivery.delivery_id} /></article>)}</div>}
      </section>
      <p className="text-xs text-brand-text/45">Le code de remise doit être fourni par l’acheteur au moment de la remise physique. Ne le demande pas à l’avance et ne confirme jamais une livraison non effectuée.</p>
    </div>
  </div>;
}
