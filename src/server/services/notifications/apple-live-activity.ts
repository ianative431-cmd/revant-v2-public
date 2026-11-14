import "server-only";

import { createSign } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export type AppleNotificationCategory =
  | "orders"
  | "payments"
  | "messages"
  | "deliveries"
  | "promotions"
  | "security"
  | "system";

type LiveActivityState = {
  event: "update" | "end";
  status: string;
  detail: string;
  etaLabel: string;
  progress: number;
};

type ActivityTokenRow = { token: string; activity_id: string };

const DEFAULT_PREFERENCES: Record<AppleNotificationCategory, boolean> = {
  orders: true,
  payments: true,
  messages: true,
  deliveries: true,
  promotions: false,
  security: true,
  system: true,
};

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createAPNsProviderToken() {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!teamId || !keyId || !privateKey) return null;

  const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = base64url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign("SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign({ key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${unsignedToken}.${signature}`;
}

function apnsHost() {
  return process.env.APNS_ENVIRONMENT === "production"
    ? "https://api.push.apple.com"
    : "https://api.sandbox.push.apple.com";
}

async function createAppleAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function sendApplePushAlertToUser(
  userId: string,
  category: AppleNotificationCategory,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    const [admin, providerToken] = await Promise.all([
      createAppleAdminClient(),
      Promise.resolve(createAPNsProviderToken()),
    ]);
    if (!admin || !providerToken) return;

    const { data: preferences } = await admin
      .from("user_notification_preferences")
      .select(category)
      .eq("user_id", userId)
      .maybeSingle();
    const enabled = preferences?.[category] ?? DEFAULT_PREFERENCES[category];
    if (!enabled) return;

    const { data: devices, error } = await admin
      .from("user_push_tokens")
      .select("token")
      .eq("user_id", userId);
    if (error || !devices?.length) return;

    const bundleId = process.env.APNS_BUNDLE_ID || "ne.revant.marketplace";
    await Promise.all(devices.map(async (device: { token: string }) => {
      if (!/^[a-f0-9]{64}$/i.test(device.token)) return;
      const response = await fetch(`${apnsHost()}/3/device/${device.token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${providerToken}`,
          "apns-topic": bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          aps: { alert: { title, body }, sound: "default" },
          category,
          ...data,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (response.status === 410) {
        await admin.from("user_push_tokens").delete().eq("token", device.token);
      }
    }));
  } catch (error) {
    console.error("Revant APNs alert failed", error instanceof Error ? error.message : "unknown error");
  }
}

export async function sendAppleOrderAlertForBuyer(
  orderId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const admin = await createAppleAdminClient();
    if (!admin) return;
    const { data: order, error } = await admin
      .from("orders")
      .select("buyer_id,order_number")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order?.buyer_id) return;
    await sendApplePushAlertToUser(order.buyer_id, "orders", title, body, {
      orderReference: String(order.order_number ?? ""),
      url: "/compte/commandes",
    });
  } catch (error) {
    console.error("Revant order alert lookup failed", error instanceof Error ? error.message : "unknown error");
  }
}

export async function sendAppleDeliveryAlertForDelivery(
  deliveryId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const admin = await createAppleAdminClient();
    if (!admin) return;
    const { data: delivery, error: deliveryError } = await admin
      .from("deliveries")
      .select("order_id")
      .eq("id", deliveryId)
      .maybeSingle();
    if (deliveryError || !delivery?.order_id) return;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("buyer_id,order_number")
      .eq("id", delivery.order_id)
      .maybeSingle();
    if (orderError || !order?.buyer_id) return;

    await sendApplePushAlertToUser(order.buyer_id, "deliveries", title, body, {
      orderReference: String(order.order_number ?? ""),
      url: "/compte/commandes",
    });
  } catch (error) {
    console.error("Revant delivery alert lookup failed", error instanceof Error ? error.message : "unknown error");
  }
}

export async function sendAppleLiveActivityUpdateForDelivery(
  deliveryId: string,
  state: LiveActivityState
): Promise<void> {
  try {
    const admin = await createAppleAdminClient();
    const providerToken = createAPNsProviderToken();
    if (!admin || !providerToken) return;

    const { data: delivery, error: deliveryError } = await admin
      .from("deliveries")
      .select("order_id")
      .eq("id", deliveryId)
      .maybeSingle();
    if (deliveryError || !delivery?.order_id) return;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("buyer_id,order_number")
      .eq("id", delivery.order_id)
      .maybeSingle();
    if (orderError || !order?.buyer_id || !order.order_number) return;

    const { data: activityTokens, error: tokenError } = await admin
      .from("user_live_activity_tokens")
      .select("token,activity_id")
      .eq("user_id", order.buyer_id)
      .eq("order_reference", order.order_number);
    if (tokenError || !activityTokens?.length) return;

    const bundleId = process.env.APNS_BUNDLE_ID || "ne.revant.marketplace";
    const timestamp = Math.floor(Date.now() / 1000);
    const aps: Record<string, unknown> = {
      timestamp,
      event: state.event,
      "content-state": {
        status: state.status,
        detail: state.detail,
        etaLabel: state.etaLabel,
        progress: Math.min(Math.max(state.progress, 0), 1),
      },
    };
    if (state.event === "end") aps["dismissal-date"] = timestamp;

    await Promise.all(activityTokens.map(async (row: ActivityTokenRow) => {
      if (!/^[a-f0-9]{64}$/i.test(row.token)) return;
      const response = await fetch(`${apnsHost()}/3/device/${row.token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${providerToken}`,
          "apns-topic": `${bundleId}.push-type.liveactivity`,
          "apns-push-type": "liveactivity",
          "apns-priority": "10",
          "apns-expiration": "0",
          "content-type": "application/json",
        },
        body: JSON.stringify({ aps }),
        signal: AbortSignal.timeout(4000),
      });

      if (response.status === 410) {
        await admin.from("user_live_activity_tokens").delete().eq("token", row.token);
      } else if (response.ok && state.event === "end") {
        await admin.from("user_live_activity_tokens").delete().eq("activity_id", row.activity_id);
      }
    }));
  } catch (error) {
    console.error("Revant Live Activity APNs update failed", error instanceof Error ? error.message : "unknown error");
  }
}
