import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/server/integrations/meta-whatsapp";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Handshake de vérification Meta (appelé une fois, quand l'admin
 * configure l'URL du webhook dans Meta for Developers). Compare le
 * verify_token au secret généré en base — jamais une valeur en dur
 * dans le code.
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
 * Événements WhatsApp réels (messages, statuts de livraison, etc.).
 * Signature HMAC vérifiée avant tout traitement — un webhook non
 * signé correctement est rejeté, jamais traité.
 *
 * Note pour la suite : ce point d'entrée journalise l'événement reçu
 * mais ne déclenche pas encore la logique métier (notifications,
 * commandes, assistant IA) — c'est la prochaine étape, pas encore
 * construite, pour ne rien faire semblant de fonctionner.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  let payload: Json | null = null;
  try {
    payload = JSON.parse(rawBody) as Json;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("audit_logs").insert({
    actor_id: null,
    action: "create",
    entity_type: "whatsapp_webhook",
    description: "Événement webhook WhatsApp reçu",
    metadata: { event: "webhook_received", payload },
  });

  return new NextResponse("OK", { status: 200 });
}
