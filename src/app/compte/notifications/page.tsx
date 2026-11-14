import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptDeliveryCode } from "@/server/delivery/code-crypto.mjs";
import { MarkAllNotificationsReadButton, MarkNotificationReadButton } from "./NotificationActions";
import NotificationPreferences from "@/components/native/NotificationPreferences";

const TYPE_LABEL: Record<string, string> = {
  order: "Commande",
  payment: "Paiement",
  payout: "Retrait vendeur",
  message: "Message",
  delivery: "Livraison",
  promotion: "Promotion",
  security: "Sécurité",
  system: "Information",
};

export default async function NotificationsPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,body,data,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = data ?? [];
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const deliverySecret = process.env.DELIVERY_CODE_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const displayNotifications = notifications.map((item) => {
    const payload = item.data && typeof item.data === "object" && !Array.isArray(item.data)
      ? item.data as Record<string, unknown>
      : {};
    let deliveryCode: string | null = null;
    if (payload.kind === "delivery_code" && typeof payload.code_ciphertext === "string" && deliverySecret) {
      try { deliveryCode = decryptDeliveryCode(payload.code_ciphertext, deliverySecret); } catch { deliveryCode = null; }
    }
    return { ...item, deliveryCode };
  });

  return <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
    <div className="w-full max-w-2xl space-y-5">
      <Link href="/compte" className="text-sm underline text-brand-text/60">← Mon compte</Link>
      <NotificationPreferences />
      <header><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-bold">Notifications</h1><p className="mt-1 text-sm text-brand-text/55">Tes commandes, paiements, livraisons et informations Revant.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs text-brand-text/65">{unreadCount} non lue(s)</span></div></header>
      {unreadCount > 0 && <div className="flex justify-end"><MarkAllNotificationsReadButton /></div>}
      {error ? <p className="rounded-xl bg-white p-4 text-sm text-red-700">Impossible de charger les notifications pour le moment.</p> : notifications.length === 0 ? <p className="rounded-2xl bg-white p-6 text-center text-sm text-brand-text/55">Tu n’as aucune notification pour le moment.</p> : <div className="space-y-3">{displayNotifications.map((item) => <article key={item.id} className={`rounded-2xl bg-white p-4 ${item.read_at ? "opacity-75" : "border-l-4 border-[var(--brand-accent)]"}`}>
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text/40">{TYPE_LABEL[item.type] ?? item.type}</p><h2 className="mt-1 text-sm font-semibold">{item.title}</h2></div>{!item.read_at && <span className="rounded-full bg-[var(--brand-accent)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--brand-accent)]">Nouveau</span>}</div>
        {item.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-text/75">{item.body}</p>}
        {item.deliveryCode && <div className="mt-3 rounded-xl bg-[var(--brand-accent)]/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-accent)]">Code de remise</p><p className="mt-1 text-xl font-black tracking-[0.25em]">{item.deliveryCode}</p><p className="mt-1 text-xs text-brand-text/55">À communiquer au livreur uniquement au moment de la remise physique.</p></div>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><time className="text-[11px] text-brand-text/40">{new Date(item.created_at).toLocaleString("fr-FR")}</time>{!item.read_at && <MarkNotificationReadButton notificationId={item.id} />}</div>
      </article>)}</div>}
    </div>
  </div>;
}
