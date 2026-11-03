import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import type { Tables } from "@/types/database";

type DeliveryRow = Pick<Tables<"deliveries">, "id" | "order_id" | "driver_id" | "company_id" | "status" | "requested_at" | "assigned_at" | "picked_up_at" | "delivered_at" | "failure_reason" | "created_at">;
type DriverRow = Pick<Tables<"drivers">, "id" | "full_name" | "vehicle_type">;
type CompanyRow = Pick<Tables<"delivery_companies">, "id" | "name">;
type OrderRow = Pick<Tables<"orders">, "id" | "order_number">;

export async function getAdminDeliveryOperations() {
  await requirePermission("support.manage");
  const admin = createSupabaseAdminClient();
  const { data: deliveries, error } = await admin
    .from("deliveries")
    .select("id,order_id,driver_id,company_id,status,requested_at,assigned_at,picked_up_at,delivered_at,failure_reason,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Impossible de charger les livraisons.");

  const rows = (deliveries ?? []) as DeliveryRow[];
  const driverIds = [...new Set(rows.map((row) => row.driver_id).filter((id): id is string => Boolean(id)))];
  const companyIds = [...new Set(rows.map((row) => row.company_id).filter((id): id is string => Boolean(id)))];
  const orderIds = [...new Set(rows.map((row) => row.order_id))];
  const [driversResult, companiesResult, ordersResult] = await Promise.all([
    driverIds.length ? admin.from("drivers").select("id,full_name,vehicle_type").in("id", driverIds) : Promise.resolve({ data: [], error: null }),
    companyIds.length ? admin.from("delivery_companies").select("id,name").in("id", companyIds) : Promise.resolve({ data: [], error: null }),
    orderIds.length ? admin.from("orders").select("id,order_number").in("id", orderIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (driversResult.error || companiesResult.error || ordersResult.error) throw new Error("Impossible de charger les informations de livraison associées.");
  return {
    deliveries: rows,
    drivers: (driversResult.data ?? []) as DriverRow[],
    companies: (companiesResult.data ?? []) as CompanyRow[],
    orders: (ordersResult.data ?? []) as OrderRow[],
  };
}
