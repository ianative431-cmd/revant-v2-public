import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import {
  buildAuthenticationTemplatePayload,
  isValidE164,
  isValidOtp,
} from "./helpers.mjs";

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 20 * 1024;
const META_TIMEOUT_MS = 3500;

function jsonError(status, code) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: JSON_HEADERS,
  });
}

function requiredEnv(name) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("missing_configuration");
  return value;
}

function getHookSecrets() {
  const raw = requiredEnv("SEND_SMS_HOOK_SECRET");
  return raw.split("|").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    if (!entry.startsWith("v1,whsec_")) throw new Error("invalid_hook_secret");
    return entry.slice("v1,whsec_".length);
  });
}

function verifyHook(payload, headers, secrets) {
  for (const secret of secrets) {
    try {
      return new Webhook(secret).verify(payload, headers);
    } catch {
      // Try the next configured secret during an intentional key rotation.
    }
  }
  throw new Error("invalid_signature");
}

function getMetaApiVersion() {
  const version = requiredEnv("META_GRAPH_API_VERSION");
  if (!/^v\\d+\\.\\d+$/.test(version)) throw new Error("invalid_api_version");
  return version;
}

async function loadWhatsAppCredentials() {
  const supabase = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [{ data: connection, error: connectionError }, { data: secret, error: secretError }] =
    await Promise.all([
      supabase.from("whatsapp_connection")
        .select("phone_number_id,status")
        .eq("id", 1)
        .maybeSingle(),
      supabase.from("whatsapp_secret")
        .select("access_token")
        .eq("id", 1)
        .maybeSingle(),
    ]);

  if (connectionError || secretError || connection?.status !== "connected" ||
      !connection?.phone_number_id || !secret?.access_token) {
    throw new Error("whatsapp_not_configured");
  }

  return {
    phoneNumberId: connection.phone_number_id,
    accessToken: secret.access_token,
  };
}

async function sendAuthenticationCode({ phone, otp }) {
  const [{ phoneNumberId, accessToken }, templateName, languageCode, apiVersion] =
    await Promise.all([
      loadWhatsAppCredentials(),
      Promise.resolve(requiredEnv("META_WHATSAPP_OTP_TEMPLATE")),
      Promise.resolve(requiredEnv("META_WHATSAPP_OTP_LANGUAGE")),
      Promise.resolve(getMetaApiVersion()),
    ]);

  const payload = buildAuthenticationTemplatePayload({
    phone,
    otp,
    templateName,
    languageCode,
  });

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonError(405, "method_not_allowed");

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) return jsonError(413, "payload_too_large");

  const payload = await request.text();
  if (new TextEncoder().encode(payload).byteLength > MAX_BODY_BYTES) {
    return jsonError(413, "payload_too_large");
  }

  let event;
  try {
    const secrets = getHookSecrets();
    event = verifyHook(payload, Object.fromEntries(request.headers), secrets);
  } catch {
    return jsonError(401, "invalid_hook_signature");
  }

  const phone = event?.user?.phone;
  const otp = event?.sms?.otp;
  if (!isValidE164(phone) || !isValidOtp(otp)) {
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
