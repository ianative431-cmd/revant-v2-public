import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  orders: true,
  payments: true,
  messages: true,
  deliveries: true,
  promotions: false,
  security: true,
  system: true,
};

const PREFERENCE_KEYS = Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[];

async function getAuthenticatedAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, admin: null };

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

export async function GET() {
  const { user, admin } = await getAuthenticatedAdmin();
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Service non configuré." }, { status: 503 });

  const { data, error } = await admin
    .from("user_notification_preferences")
    .select("orders,payments,messages,deliveries,promotions,security,system")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Impossible de charger les préférences." }, { status: 500 });
  return NextResponse.json({ ...DEFAULTS, ...(data ?? {}) });
}

export async function PUT(request: Request) {
  const { user, admin } = await getAuthenticatedAdmin();
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Service non configuré." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Préférences invalides." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (!PREFERENCE_KEYS.every((key) => typeof record[key] === "boolean")) {
    return NextResponse.json({ error: "Chaque préférence doit être un booléen." }, { status: 400 });
  }

  const preferences = Object.fromEntries(PREFERENCE_KEYS.map((key) => [key, record[key]]));
  const { error } = await admin.from("user_notification_preferences").upsert({
    user_id: user.id,
    ...preferences,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: "Impossible d’enregistrer les préférences." }, { status: 500 });
  return NextResponse.json({ success: true });
}
