import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_DESTINATIONS = new Set(["/compte", "/compte/boutique", "/admin", "/reinitialiser-mot-de-passe"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const appOrigin = configuredSiteUrl ? new URL(configuredSiteUrl).origin : requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/compte";
  const next = ALLOWED_DESTINATIONS.has(requestedNext) ? requestedNext : "/compte";
  const isAdminFlow = next === "/admin";

  const errorUrl = new URL("/auth/erreur", appOrigin);
  errorUrl.searchParams.set("flow", isAdminFlow ? "admin" : "seller");

  if (!code) {
    errorUrl.searchParams.set("reason", "callback");
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth-callback] exchangeCodeForSession failed", {
      code: exchangeError.code,
      status: exchangeError.status,
      message: exchangeError.message,
    });
    errorUrl.searchParams.set("reason", "exchange");
    return NextResponse.redirect(errorUrl);
  }

  if (isAdminFlow) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[auth-callback] session missing after OAuth exchange", userError?.message);
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "session");
      return NextResponse.redirect(errorUrl);
    }

    const { data: assignments, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError || !assignments?.some((assignment) => assignment.role === "super_admin")) {
      console.error("[auth-callback] super-admin role check failed", roleError?.message);
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "not_admin");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, appOrigin));
}
