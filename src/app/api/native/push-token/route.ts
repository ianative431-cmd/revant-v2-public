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

  const token = typeof body === "object" && body !== null && "token" in body
    ? String((body as { token: unknown }).token)
    : "";
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json({ error: "Jeton APNs invalide." }, { status: 400 });
  }

  const { error } = await admin.from("user_push_tokens").upsert({
    token,
    user_id: user.id,
    platform: "ios",
    updated_at: new Date().toISOString(),
  }, { onConflict: "token" });

  if (error) {
    return NextResponse.json({ error: "Impossible d’enregistrer cet appareil." }, { status: 500 });
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

  const token = typeof body === "object" && body !== null && "token" in body
    ? String((body as { token: unknown }).token)
    : "";
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json({ error: "Jeton APNs invalide." }, { status: 400 });
  }

  const { error } = await admin
    .from("user_push_tokens")
    .delete()
    .eq("token", token)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Impossible de désactiver cet appareil." }, { status: 500 });
  return NextResponse.json({ success: true });
}
