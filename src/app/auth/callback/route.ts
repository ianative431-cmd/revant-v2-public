import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_DESTINATIONS = new Set(["/compte", "/compte/boutique", "/admin", "/reinitialiser-mot-de-passe"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Use the configured canonical origin for redirects instead of trusting
  // the incoming Host header. Production must define NEXT_PUBLIC_SITE_URL.
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredSiteUrl && process.env.NODE_ENV === "production") {
    console.error("[auth-callback] canonical_site_url_missing");
    return NextResponse.json({ error: "Configuration de connexion indisponible." }, { status: 500 });
  }
  const redirectOrigin = new URL(configuredSiteUrl || requestUrl.origin).origin;
  const requestedNext = requestUrl.searchParams.get("next") ?? "/compte";
  const next = ALLOWED_DESTINATIONS.has(requestedNext) ? requestedNext : "/compte";
  const isAdminFlow = next === "/admin";
  const isPasswordResetFlow = next === "/reinitialiser-mot-de-passe";

  const errorUrl = new URL("/auth/erreur", redirectOrigin);
  errorUrl.searchParams.set("flow", isAdminFlow ? "admin" : isPasswordResetFlow ? "password" : "seller");

  if (!code) {
    // Never log query parameters: OAuth codes and tokens must not enter logs.
    console.error("[auth-callback] authorization_code_missing");
    errorUrl.searchParams.set("reason", "callback");
    return NextResponse.redirect(errorUrl);
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    console.error("[auth-callback] supabase_client_init_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    errorUrl.searchParams.set("reason", "configuration");
    return NextResponse.redirect(errorUrl);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth-callback] code_exchange_failed", {
      name: exchangeError.name,
      status: exchangeError.status ?? null,
      code: exchangeError.code ?? null,
    });
    errorUrl.searchParams.set("reason", "exchange");
    return NextResponse.redirect(errorUrl);
  }

  if (isAdminFlow) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[auth-callback] admin_session_verification_failed", {
        name: userError?.name ?? null,
        status: userError?.status ?? null,
        code: userError?.code ?? null,
      });
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "session");
      return NextResponse.redirect(errorUrl);
    }

    const { data: assignments, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError || !assignments?.some((assignment) => assignment.role === "super_admin")) {
      console.error("[auth-callback] super_admin_role_check_failed", {
        name: roleError?.name ?? null,
        code: roleError?.code ?? null,
      });
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "not_admin");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, redirectOrigin));
}
