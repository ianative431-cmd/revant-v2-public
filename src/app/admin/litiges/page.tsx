import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { requirePermission, hasPermission } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateDisputeAction } from "@/server/admin/disputes";

type DisputeStatus = "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "rejected" | "closed";

const STATUS_LABEL: Record<DisputeStatus, string> = {
  open: "Ouvert",
  under_review: "En cours d’examen",
  resolved_buyer: "Résolu en faveur de l’acheteur",
  resolved_seller: "Résolu en faveur du vendeur",
  rejected: "Rejeté",
  closed: "Clôturé",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  ready_for_delivery: "Prête à livrer",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  disputed: "En litige",
};

const ACTION_LABEL: Record<string, string> = {
  review: "Prise en charge",
  buyer: "Décision en faveur de l’acheteur",
  seller: "Décision en faveur du vendeur",
  reject: "Litige rejeté",
  close: "Dossier clôturé",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Niamey",
  });
}

function personName(profile: { display_name: string | null; first_name: string | null; last_name: string | null } | undefined, fallbackId?: string | null) {
  if (profile?.display_name?.trim()) return profile.display_name;
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  return fallbackId ? `Compte ${fallbackId.slice(0, 8)}` : "Compte non renseigné";
}

export default async function AdminDisputesPage() {
  const user = await requireUserWithLegalConsent();
  await requirePermission("support.manage");
  const canManageAll = await hasPermission("users.manage");
  const admin = createSupabaseAdminClient();

  const { data: allDisputes, error: disputesError } = await admin
    .from("disputes")
    .select("id,order_id,opened_by,reason,description,status,assigned_to,resolution_note,resolved_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (disputesError) throw disputesError;

  const disputes = (allDisputes ?? []).filter((dispute) =>
    canManageAll ||
    dispute.status === "open" ||
    dispute.assigned_to === user.id ||
    (dispute.status === "under_review" && dispute.assigned_to === null)
  );

  const disputeIds = disputes.map((dispute) => dispute.id);
  const orderIds = [...new Set(disputes.map((dispute) => dispute.order_id))];

  const [{ data: orders, error: ordersError }, { data: items, error: itemsError }, { data: actions, error: actionsError }] = await Promise.all([
    orderIds.length
      ? admin.from("orders").select("id,order_number,status,total_amount,currency,buyer_id,guest_name,created_at").in("id", orderIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length
      ? admin.from("order_items").select("id,order_id,product_name,quantity,shop_id").in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null }),
    disputeIds.length
      ? admin.from("admin_actions").select("admin_id,action,reason,metadata,created_at,target_id").eq("target_type", "dispute").in("target_id", disputeIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ordersError) throw ordersError;
  if (itemsError) throw itemsError;
  if (actionsError) throw actionsError;

  const shopIds = [...new Set((items ?? []).map((item) => item.shop_id))];
  const { data: shops, error: shopsError } = shopIds.length
    ? await admin.from("shops").select("id,name,owner_id").in("id", shopIds)
    : { data: [], error: null };
  if (shopsError) throw shopsError;

  const profileIds = [...new Set([
    ...disputes.map((dispute) => dispute.opened_by),
    ...disputes.map((dispute) => dispute.assigned_to).filter((id): id is string => Boolean(id)),
    ...(orders ?? []).map((order) => order.buyer_id).filter((id): id is string => Boolean(id)),
    ...(shops ?? []).map((shop) => shop.owner_id),
    ...(actions ?? []).map((entry) => entry.admin_id),
  ])];
  const { data: profiles, error: profilesError } = profileIds.length
    ? await admin.from("profiles").select("id,display_name,first_name,last_name").in("id", profileIds)
    : { data: [], error: null };
  if (profilesError) throw profilesError;

  const orderById = new Map((orders ?? []).map((order) => [order.id, order]));
  const shopById = new Map((shops ?? []).map((shop) => [shop.id, shop]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const existing = itemsByOrder.get(item.order_id) ?? [];
    itemsByOrder.set(item.order_id, [...existing, item]);
  }
  const actionsByDispute = new Map<string, typeof actions>();
  for (const entry of actions ?? []) {
    if (!entry.target_id) continue;
    const existing = actionsByDispute.get(entry.target_id) ?? [];
    actionsByDispute.set(entry.target_id, [...existing, entry]);
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-accent">Opérations · Support</p>
          <h1 className="mt-2 text-3xl font-black">Litiges</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
            Dossiers liés à une commande. La prise en charge, les décisions et leur justification sont journalisées.
            Une seule procédure de litige peut être ouverte par commande.
          </p>
          <p className="mt-2 text-xs text-brand-muted">{disputes.length} dossier(s) affiché(s) · 100 plus récents maximum</p>
        </header>

        {disputes.length === 0 ? (
          <section className="rounded-3xl border border-brand-border bg-brand-surface p-8 text-center">
            <h2 className="text-lg font-bold">Aucun litige à traiter</h2>
            <p className="mt-2 text-sm text-brand-muted">Les nouveaux dossiers apparaîtront ici dès leur ouverture.</p>
          </section>
        ) : (
          <div className="space-y-5">
            {disputes.map((dispute) => {
              const order = orderById.get(dispute.order_id);
              const orderItems = itemsByOrder.get(dispute.order_id) ?? [];
              const shopNames = [...new Set(orderItems.map((item) => shopById.get(item.shop_id)?.name).filter((name): name is string => Boolean(name)))];
              const openedBy = profileById.get(dispute.opened_by);
              const assignedTo = dispute.assigned_to ? profileById.get(dispute.assigned_to) : undefined;
              const buyer = order?.buyer_id ? profileById.get(order.buyer_id) : undefined;
              const history = actionsByDispute.get(dispute.id) ?? [];
              const canDecide = canManageAll || dispute.assigned_to === user.id;
              const canClaim = (dispute.status === "open" || dispute.status === "under_review") &&
                (dispute.assigned_to === null || canManageAll);
              const canResolve = (dispute.status === "open" || dispute.status === "under_review") && canDecide;
              const canClose = ["resolved_buyer", "resolved_seller", "rejected"].includes(dispute.status) && canDecide;

              return (
                <article key={dispute.id} className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-accent">Litige · {dispute.id.slice(0, 8)}</p>
                      <h2 className="mt-1 text-xl font-black">Commande {order?.order_number ?? dispute.order_id.slice(0, 8)}</h2>
                      <p className="mt-1 text-xs text-brand-muted">Ouvert le {formatDate(dispute.created_at)}</p>
                    </div>
                    <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-2 text-xs font-bold">
                      {STATUS_LABEL[dispute.status as DisputeStatus] ?? dispute.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl bg-brand-bg p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-[10px] uppercase tracking-wide text-brand-muted">Commande</p><p className="mt-1 font-bold">{ORDER_STATUS_LABEL[order?.status ?? ""] ?? order?.status ?? "Introuvable"}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-brand-muted">Montant</p><p className="mt-1 font-bold">{order ? `${Number(order.total_amount).toLocaleString("fr-FR")} ${order.currency.trim()}` : "—"}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-brand-muted">Acheteur</p><p className="mt-1 font-bold">{personName(buyer, order?.guest_name ? null : order?.buyer_id)}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-brand-muted">Attribué à</p><p className="mt-1 font-bold">{personName(assignedTo, dispute.assigned_to)}</p></div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand-muted">Motif</p>
                      <p className="mt-1 text-sm font-bold">{dispute.reason}</p>
                      <p className="mt-2 text-xs text-brand-muted">Ouvert par : {personName(openedBy, dispute.opened_by)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand-muted">Boutique(s)</p>
                      <p className="mt-1 text-sm font-bold">{shopNames.length ? shopNames.join(", ") : "Non renseignée"}</p>
                    </div>
                  </div>

                  {dispute.description && <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-brand-border p-4 text-sm leading-relaxed">{dispute.description}</p>}

                  {orderItems.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-brand-border p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand-muted">Articles concernés par la commande</p>
                      <ul className="mt-2 space-y-1">
                        {orderItems.map((item) => <li key={item.id} className="text-xs">{item.product_name} · Qté {item.quantity}</li>)}
                      </ul>
                    </div>
                  )}

                  {dispute.resolution_note && (
                    <div className="mt-4 rounded-2xl border border-brand-border bg-brand-bg p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand-muted">Note de décision</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{dispute.resolution_note}</p>
                    </div>
                  )}

                  <div className="mt-5 border-t border-brand-border pt-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-brand-muted">Historique des décisions</h3>
                    {history.length === 0 ? (
                      <p className="mt-2 text-xs text-brand-muted">Aucune décision administrative enregistrée.</p>
                    ) : (
                      <ol className="mt-3 space-y-2">
                        {history.map((entry, index) => (
                          <li key={`${entry.created_at}-${index}`} className="flex flex-wrap justify-between gap-2 text-xs">
                            <span><strong>{ACTION_LABEL[entry.action] ?? entry.action}</strong> · {personName(profileById.get(entry.admin_id), entry.admin_id)}{entry.reason ? ` — ${entry.reason}` : ""}</span>
                            <time className="text-brand-muted">{formatDate(entry.created_at)}</time>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {(canClaim || canResolve || canClose) && (
                    <div className="mt-5 space-y-3 border-t border-brand-border pt-4">
                      {canClaim && (dispute.assigned_to === null || (canManageAll && dispute.assigned_to !== user.id)) && (
                        <form action={updateDisputeAction} className="flex flex-wrap items-end gap-3">
                          <input type="hidden" name="disputeId" value={dispute.id} />
                          <input type="hidden" name="action" value="review" />
                          <div className="min-w-0 flex-1">
                            <label className="text-xs font-bold" htmlFor={`claim-note-${dispute.id}`}>Note interne facultative</label>
                            <textarea id={`claim-note-${dispute.id}`} name="note" maxLength={1000} rows={2} className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg p-3 text-sm" placeholder="Contexte de prise en charge…" />
                          </div>
                          <button className="rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white">Prendre en charge</button>
                        </form>
                      )}

                      {canResolve && (
                        <form action={updateDisputeAction} className="space-y-3">
                          <input type="hidden" name="disputeId" value={dispute.id} />
                          <label className="block text-xs font-bold" htmlFor={`decision-note-${dispute.id}`}>Justification obligatoire · 10 à 1 000 caractères</label>
                          <textarea id={`decision-note-${dispute.id}`} name="note" required minLength={10} maxLength={1000} rows={3} className="w-full rounded-xl border border-brand-border bg-brand-bg p-3 text-sm" placeholder="Expliquez les éléments vérifiés et la raison de la décision…" />
                          <div className="flex flex-wrap gap-2">
                            <button name="action" value="buyer" className="rounded-full bg-brand-accent px-4 py-2.5 text-xs font-bold text-white">En faveur de l’acheteur</button>
                            <button name="action" value="seller" className="rounded-full border border-brand-border px-4 py-2.5 text-xs font-bold">En faveur du vendeur</button>
                            <button name="action" value="reject" className="rounded-full border border-red-300 px-4 py-2.5 text-xs font-bold text-red-700">Rejeter</button>
                          </div>
                        </form>
                      )}

                      {canClose && (
                        <form action={updateDisputeAction} className="space-y-2">
                          <input type="hidden" name="disputeId" value={dispute.id} />
                          <input type="hidden" name="action" value="close" />
                          <label className="block text-xs font-bold" htmlFor={`close-note-${dispute.id}`}>Note de clôture</label>
                          <textarea id={`close-note-${dispute.id}`} name="note" required minLength={10} maxLength={1000} rows={2} className="w-full rounded-xl border border-brand-border bg-brand-bg p-3 text-sm" placeholder="Motif de clôture…" />
                          <button className="rounded-full border border-brand-border px-4 py-2.5 text-xs font-bold">Clôturer le dossier</button>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
