import "server-only";

import { createSign } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type LiveActivityState = {
  event: "update" | "end";
  status: string;
  detail: string;
  etaLabel: string;
  progress: number;
};

type DeliveryRow = { order_id: string };
type OrderRow = { buyer_id: string | null; order_number: string };
type ActivityTokenRow = { token: string; activity_id: string };

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

export async function sendAppleLiveActivityUpdateForDelivery(
  deliveryId: string,
  state: LiveActivityState
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bundleId = process.env.APNS_BUNDLE_ID || "ne.revant.marketplace";
    const providerToken = createAPNsProviderToken();
    if (!supabaseUrl || !serviceRoleKey || !providerToken) return;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: delivery, error: deliveryError } = await admin
      .from("deliveries")
      .select("order_id")
      .eq("id", deliveryId)
      .maybeSingle<DeliveryRow>();
    if (deliveryError || !delivery) return;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("buyer_id,order_number")
      .eq("id", delivery.order_id)
      .maybeSingle<OrderRow>();
    if (orderError || !order?.buyer_id) return;

    const { data: activityTokens, error: tokenError } = await admin
      .from("user_live_activity_tokens")
      .select("token,activity_id")
      .eq("user_id", order.buyer_id)
      .eq("order_reference", order.order_number);
    if (tokenError || !activityTokens?.length) return;

    const host = process.env.APNS_ENVIRONMENT === "production"
      ? "https://api.push.apple.com"
      : "https://api.sandbox.push.apple.com";
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
      const response = await fetch(`${host}/3/device/${row.token}`, {
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

      if (response.status === 410 || response.status === 400) {
        await admin.from("user_live_activity_tokens").delete().eq("token", row.token);
      }
    }));
  } catch (error) {
    console.error("Revant Live Activity APNs update failed", error instanceof Error ? error.message : "unknown error");
  }
}
