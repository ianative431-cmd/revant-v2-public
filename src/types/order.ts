import type { Enums, Tables } from "@/types/database";

export type OrderStatus = Enums<"order_status">;
export type OrderItem = Tables<"order_items">;
export type OrderRecord = Tables<"orders">;

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
> & { items: OrderItem[] };
