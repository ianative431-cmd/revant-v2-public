import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types/order";

export type ShopOrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  shop_id: string;
};

export type ShopOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  placed_at: string | null;
  created_at: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_city: string | null;
  guest_address: string | null;
  order_items: ShopOrderItem[];
};

export async function getOrdersForBuyer(supabase: SupabaseClient): Promise<Order[]> {
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  return ((data ?? []) as unknown as Order[]).filter((o) => o.buyer_id === uid);
}

/**
 * Seller orders use the current schema: shop_id belongs to order_items,
 * not orders. RLS on orders and order_items limits this result to shops
 * owned by the current user.
 */
export async function getOrdersForShop(supabase: SupabaseClient, shopId: string): Promise<ShopOrder[]> {
  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("order_id, product_name, quantity, unit_price, shop_id")
      .eq("shop_id", shopId),
  ]);

  const itemsByOrder = new Map<string, ShopOrderItem[]>();
  for (const item of items ?? []) {
    const current = itemsByOrder.get(item.order_id) ?? [];
    current.push({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      shop_id: item.shop_id,
    });
    itemsByOrder.set(item.order_id, current);
  }

  const visibleOrders = (orders ?? []) as unknown as Omit<ShopOrder, "order_items">[];
  return visibleOrders
    .filter((order) => itemsByOrder.has(order.id))
    .map((order) => ({ ...order, order_items: itemsByOrder.get(order.id) ?? [] }));
}

export async function getOrderById(supabase: SupabaseClient, id: string): Promise<Order | null> {
  const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  return (data as unknown as Order) ?? null;
}
