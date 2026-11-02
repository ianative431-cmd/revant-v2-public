import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/server/integrations/meta-whatsapp";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Handshake de vérification Meta. Le jeton attendu est conservé en
 * base et n'est jamais codé en dur dans le dépôt.
 */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("whatsapp_secret")
    .select("webhook_verify_token")
    .eq("id", 1)
    .single();

  if (!data?.webhook_verify_token || data.webhook_verify_token !== token) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await supabase
    .from("whatsapp_connection")
    .update({ webhook_status: "operational", updated_at: new Date().toISOString() })
    .eq("id", 1);

  return new NextResponse(challenge, { status: 200 });
}

/**
 * Vérifie la signature Meta puis journalise uniquement des métadonnées
 * techniques. Le contenu des messages, les numéros et les profils ne
 * sont jamais copiés dans audit_logs.
 *
 * Le traitement métier (notifications, commandes, assistant IA) reste
 * désactivé tant que ses règles et permissions ne sont pas construites.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!isRecord(payload)) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const eventFields = new Set<string>();
  let changeCount = 0;

  for (const entry of entries) {
    if (!isRecord(entry) || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isRecord(change)) continue;
      changeCount += 1;
      if (typeof change.field === "string" && /^[a-z_]{1,64}$/.test(change.field)) {
        eventFields.add(change.field);
      }
    }
  }

  const metadata: Json = {
    event: "webhook_received",
    object: typeof payload.object === "string" ? payload.object.slice(0, 64) : null,
    entry_count: entries.length,
    change_count: changeCount,
    event_fields: [...eventFields],
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: null,
    action: "create",
    entity_type: "whatsapp_webhook",
    description: "Événement webhook WhatsApp reçu (contenu personnel masqué)",
    metadata,
  });

  if (error) {
    return new NextResponse("Unable to record webhook event", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
