import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAuthenticatedAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { user: null, admin: null };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { user, admin: null };

  return {
    user,
    admin: createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export async function POST(request: Request) {
  const { user, admin } = await getAuthenticatedAdmin();
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Service de notification non configuré." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const token = typeof record.token === "string" ? record.token : "";
  const activityId = typeof record.activityId === "string" ? record.activityId : "";
  const orderReference = typeof record.orderReference === "string" ? record.orderReference.trim() : "";

  if (!/^[a-f0-9]{64}$/i.test(token) || !/^[A-Za-z0-9-]{1,128}$/.test(activityId) || !orderReference || orderReference.length > 80) {
    return NextResponse.json({ error: "Jeton Live Activity invalide." }, { status: 400 });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id")
    .eq("order_number", orderReference)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Commande introuvable pour ce compte." }, { status: 403 });
  }

  const { error } = await admin.from("user_live_activity_tokens").upsert({
    token,
    activity_id: activityId,
    user_id: user.id,
    order_reference: orderReference,
    updated_at: new Date().toISOString(),
  }, { onConflict: "activity_id" });

  if (error) {
    return NextResponse.json({ error: "Impossible d’enregistrer le suivi en direct." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { user, admin } = await getAuthenticatedAdmin();
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Service de notification non configuré." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const activityId = typeof body === "object" && body !== null && "activityId" in body
    ? String((body as { activityId: unknown }).activityId)
    : "";
  if (!/^[A-Za-z0-9-]{1,128}$/.test(activityId)) {
    return NextResponse.json({ error: "Référence Live Activity invalide." }, { status: 400 });
  }

  const { error } = await admin
    .from("user_live_activity_tokens")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Impossible de terminer le suivi." }, { status: 500 });
  return NextResponse.json({ success: true });
}
