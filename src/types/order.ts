import type { Enums, Tables } from "@/types/database";

export type OrderStatus = Enums<"order_status">;
export type OrderItem = Tables<"order_items">;
export type OrderRecord = Tables<"orders">;

export type DeliverySummary = Pick<
  Tables<"deliveries">,
  | "id"
  | "order_id"
  | "status"
  | "requested_at"
  | "assigned_at"
  | "picked_up_at"
  | "delivered_at"
  | "driver_id"
  | "company_id"
  | "created_at"
  | "delivery_address"
  | "pickup_address"
>;

// Deliberately excludes idempotency keys, tracking-token hashes and stock flags.
export type Order = Pick<
  OrderRecord,
  | "id"
  | "buyer_id"
  | "order_number"
  | "status"
  | "subtotal"
  | "delivery_fee"
  | "total_amount"
  | "currency"
  | "shipping_address_id"
  | "placed_at"
  | "confirmed_at"
  | "delivered_at"
  | "cancelled_at"
  | "created_at"
  | "updated_at"
  | "guest_name"
  | "guest_phone"
  | "guest_city"
  | "guest_address"
> & { items: OrderItem[]; delivery: DeliverySummary | null };
