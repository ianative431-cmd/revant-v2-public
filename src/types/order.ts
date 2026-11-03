import type { Enums, Tables } from "@/types/database";

export type OrderStatus = Enums<"order_status">;
export type OrderItem = Tables<"order_items">;

export type OrderRecord = {
  id: string;
  buyer_id: string | null;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  shipping_address_id: string | null;
  placed_at: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_city: string | null;
  guest_address: string | null;
};

export type DeliverySummary = {
  id: string;
  order_id: string;
  status: Enums<"delivery_status">;
  requested_at: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  driver_id: string | null;
  company_id: string | null;
  created_at: string;
  delivery_address: string | null;
  pickup_address: string | null;
};

// Deliberately excludes idempotency keys, tracking-token hashes and stock flags.
export type Order = OrderRecord & { items: OrderItem[]; delivery: DeliverySummary | null };
