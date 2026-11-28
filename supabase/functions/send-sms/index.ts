import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import {
  buildAuthenticationTemplatePayload,
  isValidE164,
  isValidOtp,
} from "./helpers.mjs";

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 20 * 1024;
const DATABASE_TIMEOUT_MS = 700;
const META_TIMEOUT_MS = 2500;

type SendSmsEvent = {
  user?: { phone?: unknown };
  sms?: { otp?: unknown };
};

function jsonError(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: JSON_HEADERS,
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("missing_configuration");
  return value;
}

function getHookSecrets(): string[] {
  const raw = requiredEnv("SEND_SMS_HOOK_SECRET");
  return raw.split("|")
    .map((entry: string) => entry.trim())
    .filter(Boolean)
    .map((entry: string) => {
      if (!entry.startsWith("v1,whsec_")) throw new Error("invalid_hook_secret");
      return entry.slice("v1,whsec_".length);
    });
}

function verifyHook(
  payload: string,
  headers: Record<string, string>,
  secrets: string[],
): SendSmsEvent {
  for (const secret of secrets) {
    try {
      return new Webhook(secret).verify(payload, headers) as SendSmsEvent;
    } catch {
      // Try the next configured secret during an intentional key rotation.
    }
  }
  throw new Error("invalid_signature");
}

function getMetaApiVersion(): string {
  const version = requiredEnv("META_GRAPH_API_VERSION");
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("invalid_api_version");
  return version;
}

function getSupabaseSecretKey(): { key: string; legacyJwt: boolean } {
  const namedKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (namedKeys) {
    const parsed = JSON.parse(namedKeys);
    const key = parsed?.default;
    if (typeof key !== "string" || !key) throw new Error("missing_supabase_secret_key");
    return { key, legacyJwt: false };
  }

  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (legacyKey) return { key: legacyKey, legacyJwt: true };
  throw new Error("missing_supabase_secret_key");
}

async function readSupabaseSingleton(
  table: string,
  select: string,
): Promise<Record<string, unknown>> {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const { key, legacyJwt } = getSupabaseSecretKey();
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", select);
  url.searchParams.set("id", "eq.1");
  url.searchParams.set("limit", "1");

  const headers: Record<string, string> = {
    apikey: key,
    Accept: "application/json",
  };
  // Legacy service_role keys are JWTs. New sb_secret keys must be sent
  // only as apikey; putting them in Authorization makes the gateway reject them.
  if (legacyJwt) headers.Authorization = `Bearer ${key}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(DATABASE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("supabase_lookup_failed");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 ||
      typeof rows[0] !== "object" || rows[0] === null) {
    throw new Error("whatsapp_not_configured");
  }
  return rows[0] as Record<string, unknown>;
}

async function loadWhatsAppCredentials(): Promise<{
  phoneNumberId: string;
  accessToken: string;
}> {
  const [connection, secret] = await Promise.all([
    readSupabaseSingleton("whatsapp_connection", "phone_number_id,status"),
    readSupabaseSingleton("whatsapp_secret", "access_token"),
  ]);

  if (connection.status !== "connected" ||
      typeof connection.phone_number_id !== "string" ||
      !connection.phone_number_id ||
      typeof secret.access_token !== "string" ||
      !secret.access_token) {
    throw new Error("whatsapp_not_configured");
  }

  return {
    phoneNumberId: connection.phone_number_id,
    accessToken: secret.access_token,
  };
}

async function sendAuthenticationCode({
  phone,
  otp,
}: {
  phone: string;
  otp: string;
}): Promise<void> {
  const credentials = await loadWhatsAppCredentials();
  const templateName = requiredEnv("META_WHATSAPP_OTP_TEMPLATE");
  const languageCode = requiredEnv("META_WHATSAPP_OTP_LANGUAGE");
  const apiVersion = getMetaApiVersion();

  const payload = buildAuthenticationTemplatePayload({
    phone,
    otp,
    templateName,
    languageCode,
  });

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${credentials.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    },
  );

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.messages?.[0]?.id) {
    // Never log or return the OTP, access token, or raw provider response.
    throw new Error("meta_message_rejected");
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return jsonError(405, "method_not_allowed");

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) return jsonError(413, "payload_too_large");

  const payload = await request.text();
  if (new TextEncoder().encode(payload).byteLength > MAX_BODY_BYTES) {
    return jsonError(413, "payload_too_large");
  }

  let event: SendSmsEvent;
  try {
    const secrets = getHookSecrets();
    event = verifyHook(payload, Object.fromEntries(request.headers), secrets);
  } catch {
    return jsonError(401, "invalid_hook_signature");
  }

  const phone = event.user?.phone;
  const otp = event.sms?.otp;
  if (
    typeof phone !== "string" ||
    typeof otp !== "string" ||
    !isValidE164(phone) ||
    !isValidOtp(otp)
  ) {
    return jsonError(400, "invalid_otp_request");
  }

  try {
    await sendAuthenticationCode({ phone, otp });
    return new Response("{}", { status: 200, headers: JSON_HEADERS });
  } catch {
    // Supabase Auth must see a failure if WhatsApp did not accept the message.
    return jsonError(502, "otp_delivery_failed");
  }
});
