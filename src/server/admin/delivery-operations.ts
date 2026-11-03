import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";

type DeliveryRow = {
  id: string;
  order_id: string;
  driver_id: string | null;
  company_id: string | null;
  status: string;
  requested_at: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failure_reason: string | null;
  created_at: string;
};
type DriverRow = { id: string; full_name: string; vehicle_type: string | null };
type CompanyRow = { id: string; name: string };
type OrderRow = { id: string; order_number: string };

type QueryResult = { data: unknown[] | null; error: { message: string } | null };
type QueryBuilder = {
  select(columns: string): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): Promise<QueryResult>;
  in(column: string, values: string[]): Promise<QueryResult>;
};
type AdminQueryClient = { from(table: string): QueryBuilder };

export async function getAdminDeliveryOperations() {
  await requirePermission("support.manage");
  // The generated database types predate requested_at; keep this narrow read
  // adapter isolated and explicitly type the selected production columns.
  const admin = createSupabaseAdminClient() as unknown as AdminQueryClient;
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
