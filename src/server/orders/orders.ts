import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderStatus } from "@/types/order";

type OrderRow = Record<string, any>;
type ItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  shop_id: string;
  product_name: string;
  quantity: number;
  line_total: number;
  created_at: string;
};

function mapStatus(status: string): OrderStatus {
  if (status === "cancelled") return "annulee";
  if (status === "delivered" || status === "confirmed") return "confirmee";
  return "en_attente";
}

async function mapOrderRows(
  supabase: SupabaseClient,
  rows: OrderRow[],
  items: ItemRow[],
): Promise<Order[]> {
  if (!rows.length || !items.length) return [];
  const shopIds = [...new Set(items.map((item) => item.shop_id))];
  const { data: shops } = await supabase.from("shops").select("id, name").in("id", shopIds);
  const shopNames = new Map((shops ?? []).map((shop) => [shop.id, shop.name]));
  const orderMap = new Map(rows.map((row) => [row.id, row]));
  return items.flatMap((item) => {
    const row = orderMap.get(item.order_id);
    if (!row) return [];
    return [{
      id: row.id,
      product_id: item.product_id,
      shop_id: item.shop_id,
      buyer_id: row.buyer_id ?? null,
      buyer_name: row.guest_name ?? null,
      buyer_phone: row.guest_phone ?? null,
      delivery_city: row.delivery_city ?? null,
      delivery_address: row.delivery_address ?? null,
      product_title: item.product_name,
      shop_name: shopNames.get(item.shop_id) ?? "Boutique",
      price_fcfa: Number(item.line_total),
      status: mapStatus(String(row.status)),
      created_at: row.created_at,
      confirmed_at: row.delivered_at ?? (row.status === "confirmed" ? row.updated_at : null),
    } satisfies Order];
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getOrdersForBuyer(supabase: SupabaseClient): Promise<Order[]> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return [];

  const { data: rows, error } = await supabase.from("orders").select("*").eq("buyer_id", uid).order("created_at", { ascending: false });
  if (error || !rows?.length) return [];
  const { data: items } = await supabase.from("order_items").select("id, order_id, product_id, shop_id, product_name, quantity, line_total, created_at").in("order_id", rows.map((row) => row.id));
  return mapOrderRows(supabase, rows as OrderRow[], (items ?? []) as ItemRow[]);
}

export async function getOrdersForShop(supabase: SupabaseClient, shopId: string): Promise<Order[]> {
  // orders has no shop_id column: the seller's orders are discovered via order_items.
  const { data: items, error } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, shop_id, product_name, quantity, line_total, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error || !items?.length) return [];

  const { data: rows } = await supabase.from("orders").select("*").in("id", items.map((item) => item.order_id));
  return mapOrderRows(supabase, (rows ?? []) as OrderRow[], items as ItemRow[]);
}

export async function getOrderById(supabase: SupabaseClient, id: string): Promise<Order | null> {
  const { data: row } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!row) return null;
  const { data: items } = await supabase.from("order_items").select("id, order_id, product_id, shop_id, product_name, quantity, line_total, created_at").eq("order_id", id);
  const mapped = await mapOrderRows(supabase, [row as OrderRow], (items ?? []) as ItemRow[]);
  return mapped[0] ?? null;
}
