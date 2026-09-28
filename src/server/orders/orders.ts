import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types/order";

export async function getOrdersForBuyer(supabase: SupabaseClient): Promise<Order[]> {
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  // La RLS orders_read filtre déjà sur buyer_id = auth.uid() OU vendeur OU admin —
  // pour cette page on ne veut que les commandes où l'utilisateur est l'ACHETEUR,
  // donc on filtre aussi côté application pour ne pas mélanger avec ses éventuelles
  // commandes vues en tant que vendeur.
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  return ((data ?? []) as Order[]).filter((o) => o.buyer_id === uid);
}

export async function getOrdersForShop(supabase: SupabaseClient, shopId: string): Promise<Order[]> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

export async function getOrderById(supabase: SupabaseClient, id: string): Promise<Order | null> {
  const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  return (data as Order) ?? null;
}
