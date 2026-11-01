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

type PromotionRow = Pick<Tables<"store_promotions">, "id" | "shop_id" | "status" | "placement" | "budget" | "start_at" | "end_at" | "views" | "visits" | "clicks" | "favorites" | "attributed_sales" | "created_at">;
type ShopRow = Pick<Tables<"shops">, "id" | "name">;

export async function getAdminPromotions() {
  await requirePermission("catalog.manage");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_promotions")
    .select("id,shop_id,status,placement,budget,start_at,end_at,views,visits,clicks,favorites,attributed_sales,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Impossible de charger les promotions sponsorisées.");
  const promotions = (data ?? []) as PromotionRow[];
  const shopIds = [...new Set(promotions.map((item) => item.shop_id))];
  const shopsResult = shopIds.length
    ? await admin.from("shops").select("id,name").in("id", shopIds)
    : { data: [], error: null };
  if (shopsResult.error) throw new Error("Impossible de charger les boutiques associées.");
  return { promotions, shops: (shopsResult.data ?? []) as ShopRow[] };
}

type ReferralRow = Pick<Tables<"referrals">, "id" | "referral_code" | "status" | "reward_amount" | "currency" | "qualified_at" | "rewarded_at" | "created_at">;
export async function getAdminReferrals() {
  await requirePermission("users.view");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("referrals")
    .select("id,referral_code,status,reward_amount,currency,qualified_at,rewarded_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Impossible de charger les parrainages.");
  return (data ?? []) as ReferralRow[];
}

type ReviewRow = Pick<Tables<"reviews">, "id" | "product_id" | "shop_id" | "order_id" | "rating" | "title" | "body" | "is_published" | "created_at">;
type ReportRow = Pick<Tables<"reports">, "id" | "target_type" | "target_id" | "reason" | "description" | "status" | "resolution_note" | "created_at" | "updated_at">;
export async function getAdminReviewAndReportData() {
  await requirePermission("support.manage");
  const admin = createSupabaseAdminClient();
  const [reviewsResult, reportsResult] = await Promise.all([
    admin.from("reviews").select("id,product_id,shop_id,order_id,rating,title,body,is_published,created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("reports").select("id,target_type,target_id,reason,description,status,resolution_note,created_at,updated_at").order("created_at", { ascending: false }).limit(100),
  ]);
  if (reviewsResult.error || reportsResult.error) throw new Error("Impossible de charger les avis et signalements.");
  return {
    reviews: (reviewsResult.data ?? []) as ReviewRow[],
    reports: (reportsResult.data ?? []) as ReportRow[],
  };
}

type TicketRow = Pick<Tables<"support_tickets">, "id" | "subject" | "description" | "status" | "priority" | "assigned_to" | "created_at" | "updated_at">;
type SupportMessageRow = Pick<Tables<"support_messages">, "id" | "ticket_id" | "body" | "sender_id" | "created_at">;
export async function getAdminSupportInbox() {
  await requirePermission("support.manage");
  const admin = createSupabaseAdminClient();
  const { data: tickets, error } = await admin
    .from("support_tickets")
    .select("id,subject,description,status,priority,assigned_to,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Impossible de charger les tickets support.");
  const rows = (tickets ?? []) as TicketRow[];
  const ticketIds = rows.map((ticket) => ticket.id);
  const messagesResult = ticketIds.length
    ? await admin.from("support_messages").select("id,ticket_id,body,sender_id,created_at").in("ticket_id", ticketIds).order("created_at", { ascending: false }).limit(500)
    : { data: [], error: null };
  if (messagesResult.error) throw new Error("Impossible de charger les messages support.");
  const latestByTicket = new Map<string, SupportMessageRow>();
  for (const message of (messagesResult.data ?? []) as SupportMessageRow[]) {
    if (!latestByTicket.has(message.ticket_id)) latestByTicket.set(message.ticket_id, message);
  }
  return { tickets: rows, latestMessages: latestByTicket };
}

type AuditRow = Pick<Tables<"audit_logs">, "id" | "action" | "entity_type" | "entity_id" | "description" | "created_at">;
type AdminActionRow = Pick<Tables<"admin_actions">, "id" | "action" | "target_type" | "target_id" | "reason" | "created_at">;
export async function getAdminSecurityEvents() {
  await requirePermission("audit.view");
  const admin = createSupabaseAdminClient();
  const [auditResult, actionsResult] = await Promise.all([
    admin.from("audit_logs").select("id,action,entity_type,entity_id,description,created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("admin_actions").select("id,action,target_type,target_id,reason,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  if (auditResult.error || actionsResult.error) throw new Error("Impossible de charger les journaux de sécurité.");
  return {
    auditLogs: (auditResult.data ?? []) as AuditRow[],
    adminActions: (actionsResult.data ?? []) as AdminActionRow[],
  };
}

export async function getAdminSettingsOverview() {
  await requirePermission("settings.manage");
  const admin = createSupabaseAdminClient();
  const [settingsResult, publicValuesResult, providersResult, rulesResult] = await Promise.all([
    admin.from("system_settings").select("key,value_type,description,is_public,updated_at").order("key"),
    admin.from("system_settings").select("key,value").eq("is_public", true).order("key"),
    admin.from("payment_providers").select("code,name,enabled,supported_currencies").order("name"),
    admin.from("withdrawal_rules").select("currency,min_amount,max_amount,daily_limit,fee_amount,fee_percent,kyc_required,manual_approval_required,enabled").order("currency"),
  ]);
  if (settingsResult.error || publicValuesResult.error || providersResult.error || rulesResult.error) {
    throw new Error("Impossible de charger les paramètres de plateforme.");
  }
  return {
    settings: settingsResult.data ?? [],
    publicValues: publicValuesResult.data ?? [],
    providers: providersResult.data ?? [],
    withdrawalRules: rulesResult.data ?? [],
  };
}
