import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeliverySummary, Order, OrderItem } from "@/types/order";

const ORDER_SELECT = "id,buyer_id,order_number,status,subtotal,delivery_fee,total_amount,currency,shipping_address_id,placed_at,confirmed_at,delivered_at,cancelled_at,created_at,updated_at,guest_name,guest_phone,guest_city,guest_address";
const ITEM_SELECT = "id,order_id,product_id,shop_id,product_name,quantity,unit_price,line_total,currency,created_at";
const DELIVERY_SELECT = "id,order_id,status,requested_at,assigned_at,picked_up_at,delivered_at,driver_id,company_id,created_at,delivery_address,pickup_address";

function attachRelations(orders: Order[], items: OrderItem[], deliveries: DeliverySummary[]): Order[] {
  const byOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const current = byOrder.get(item.order_id) ?? [];
    current.push(item);
    byOrder.set(item.order_id, current);
  }
  const deliveryByOrder = new Map(deliveries.map((delivery) => [delivery.order_id, delivery]));
  return orders.map((order) => ({
    ...order,
    items: byOrder.get(order.id) ?? [],
    delivery: deliveryByOrder.get(order.id) ?? null,
  }));
}

async function getDeliveriesForOrders(supabase: SupabaseClient, orderIds: string[]): Promise<DeliverySummary[]> {
  if (orderIds.length === 0) return [];
  const { data, error } = await supabase
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .in("order_id", orderIds);
  if (error) return [];
  return (data ?? []) as DeliverySummary[];
}

export async function getOrdersForBuyer(supabase: SupabaseClient): Promise<Order[]> {
  const { data: userResult } = await supabase.auth.getUser();
  const buyerId = userResult.user?.id;
  if (!buyerId) return [];

  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });
  if (error || !orders?.length) return [];

  const orderIds = orders.map((order) => order.id);
  const [{ data: items, error: itemsError }, deliveries] = await Promise.all([
    supabase.from("order_items").select(ITEM_SELECT).in("order_id", orderIds).order("created_at", { ascending: true }),
    getDeliveriesForOrders(supabase, orderIds),
  ]);
  if (itemsError) return [];

  return attachRelations(orders as Order[], (items ?? []) as OrderItem[], deliveries);
}

export async function getOrdersForShop(supabase: SupabaseClient, shopId: string): Promise<Order[]> {
  // orders has no shop_id column: seller access is determined through the
  // order_items rows protected by the seller RLS policy.
  const { data: items, error } = await supabase
    .from("order_items")
    .select(ITEM_SELECT)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error || !items?.length) return [];

  const orderIds = [...new Set(items.map((item) => item.order_id))];
  const [{ data: orders, error: ordersError }, deliveries] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).in("id", orderIds).order("created_at", { ascending: false }),
    getDeliveriesForOrders(supabase, orderIds),
  ]);
  if (ordersError || !orders?.length) return [];

  return attachRelations(orders as Order[], items as OrderItem[], deliveries);
}

export async function getOrderById(supabase: SupabaseClient, id: string): Promise<Order | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !order) return null;

  const [{ data: items, error: itemsError }, deliveries] = await Promise.all([
    supabase.from("order_items").select(ITEM_SELECT).eq("order_id", id).order("created_at", { ascending: true }),
    getDeliveriesForOrders(supabase, [id]),
  ]);
  if (itemsError) return null;

  return attachRelations([order as Order], (items ?? []) as OrderItem[], deliveries)[0];
}
