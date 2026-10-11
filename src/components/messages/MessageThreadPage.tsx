import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { sendTextMessage } from "@/app/messages/actions";

type ConversationRow = { id: string; buyer_id: string; seller_id: string; shop_id: string | null; created_at: string; updated_at: string };
type MessageRow = { id: string; conversation_id: string; sender_id: string; type: string; body: string | null; created_at: string };

export default async function MessageThreadPage({ params, searchParams }: { params: Promise<{ conversationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const user = await requireUserWithLegalConsent();
  const { conversationId } = await params;
  const { status } = await searchParams;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: conversation } = await supabase.from("conversations").select("id,buyer_id,seller_id,shop_id,created_at,updated_at").eq("id", conversationId).maybeSingle().returns<ConversationRow>();
  if (!conversation) notFound();
  const { data } = await supabase.from("messages").select("id,conversation_id,sender_id,type,body,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(200).returns<MessageRow[]>();
  const messages = [...(data ?? [])].reverse();
  const isBuyer = conversation.buyer_id === user.id;
  let title = isBuyer ? "Conversation avec le vendeur" : "Conversation avec l’acheteur";
  if (conversation.shop_id) {
    const { data: shop } = await supabase.from("shops").select("name").eq("id", conversation.shop_id).maybeSingle();
    if (shop?.name) title = shop.name;
  }
  return <main className="min-h-screen bg-[#f7f7f7] px-3 py-5 pb-8 text-neutral-900 sm:px-4"><div className="mx-auto flex min-h-[82vh] max-w-2xl flex-col"><Link href="/messages" className="text-sm text-neutral-500">← Tous les messages</Link><header className="mt-4 rounded-t-2xl bg-white p-4 shadow-sm"><h1 className="text-lg font-black">{title}</h1><p className="mt-1 text-xs text-neutral-500">Échanges privés entre les participants de cette conversation.</p></header>
    <section className="flex-1 space-y-3 bg-white px-4 py-5">{messages.length === 0 ? <p className="py-12 text-center text-sm text-neutral-500">Aucun message. Tu peux commencer la conversation ci-dessous.</p> : messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${message.sender_id === user.id ? "rounded-br-sm bg-[#803e2f] text-white" : "rounded-bl-sm bg-neutral-100 text-neutral-900"}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body ?? (message.type === "order_link" ? "Commande partagée" : message.type === "product_link" ? "Produit partagé" : "Élément partagé")}</p><p className={`mt-1 text-right text-[10px] ${message.sender_id === user.id ? "text-white/65" : "text-neutral-400"}`}>{new Date(message.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div></div>)}</section>
    {status === "error" && <p role="status" className="bg-red-50 px-4 py-2 text-xs text-red-700">Le message n’a pas pu être envoyé. Réessaie.</p>}
    <form action={sendTextMessage} className="flex items-end gap-2 rounded-b-2xl bg-white p-3 shadow-sm"><input type="hidden" name="conversationId" value={conversationId}/><label className="flex-1"><span className="sr-only">Ton message</span><textarea name="body" required maxLength={2000} rows={2} placeholder="Écrire un message…" className="max-h-36 min-h-12 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-[#803e2f]"/></label><button type="submit" className="rounded-full bg-[#803e2f] px-4 py-3 text-sm font-bold text-white">Envoyer</button></form>
  </div></main>;
}
