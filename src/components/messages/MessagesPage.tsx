import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

type ConversationRow = { id: string; buyer_id: string; seller_id: string; shop_id: string | null; created_at: string; updated_at: string };
type MessageRow = { id: string; conversation_id: string; sender_id: string; type: string; body: string | null; created_at: string };
type ShopRow = { id: string; name: string; slug: string };

export default async function MessagesPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("conversations").select("id,buyer_id,seller_id,shop_id,created_at,updated_at").order("updated_at", { ascending: false }).limit(100).returns<ConversationRow[]>();
  const conversations = data ?? [];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const shopIds = [...new Set(conversations.map((conversation) => conversation.shop_id).filter((id): id is string => Boolean(id)))];
  let messages: MessageRow[] = [];
  let shops: ShopRow[] = [];
  if (conversationIds.length) {
    const result = await supabase.from("messages").select("id,conversation_id,sender_id,type,body,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(1000).returns<MessageRow[]>();
    messages = result.data ?? [];
  }
  if (shopIds.length) {
    const result = await supabase.from("shops").select("id,name,slug").in("id", shopIds).returns<ShopRow[]>();
    shops = result.data ?? [];
  }
  const latestByConversation = new Map<string, MessageRow>();
  for (const message of messages) if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message);
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const sorted = [...conversations].sort((a, b) => Date.parse(latestByConversation.get(b.id)?.created_at ?? b.updated_at) - Date.parse(latestByConversation.get(a.id)?.created_at ?? a.updated_at));

  return <main className="min-h-screen bg-[#f7f7f7] px-4 py-8 pb-28 text-neutral-900"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm text-neutral-500">← Accueil</Link><h1 className="mt-4 text-2xl font-black">Messages</h1><p className="mt-2 text-sm text-neutral-600">Tes conversations avec les acheteurs et les vendeurs sur Revant.</p>
    {sorted.length === 0 ? <section className="mt-5 rounded-2xl bg-white p-7 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg></div><h2 className="mt-4 font-bold">Aucune conversation pour le moment</h2><p className="mt-2 text-sm text-neutral-500">Quand tu commenceras à échanger avec une boutique ou un acheteur, tes messages apparaîtront ici.</p><Link href="/boutiques" className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-bold text-white">Découvrir les boutiques</Link></section> : <div className="mt-5 space-y-2">{sorted.map((conversation) => { const latest = latestByConversation.get(conversation.id); const isBuyer = conversation.buyer_id === user.id; const shop = conversation.shop_id ? shopById.get(conversation.shop_id) : null; const title = shop?.name ?? (isBuyer ? "Vendeur" : "Acheteur"); return <Link key={conversation.id} href={`/messages/${conversation.id}`} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f0e8e4] text-sm font-bold text-[#803e2f]">{title.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{title}</span><span className="mt-1 block truncate text-xs text-neutral-500">{latest ? `${latest.sender_id === user.id ? "Moi : " : ""}${latest.body ?? "Élément partagé"}` : "Démarrer la conversation"}</span></span><span className="shrink-0 text-[10px] text-neutral-400">{new Date(latest?.created_at ?? conversation.created_at).toLocaleDateString("fr-FR")}</span></Link>; })}</div>}
  </div></main>;
}
