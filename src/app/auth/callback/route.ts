import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_DESTINATIONS = new Set(["/compte", "/compte/boutique", "/admin", "/reinitialiser-mot-de-passe"]);

function redirectNoStore(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Preserve the exact host that initiated OAuth so the PKCE verifier and
  // session cookies remain on the same origin (Render URL or custom domain).
  const appOrigin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const nativeFlow = requestUrl.searchParams.get("native") === "1";
  const requestedNext = requestUrl.searchParams.get("next") ?? "/compte";
  const next = ALLOWED_DESTINATIONS.has(requestedNext) ? requestedNext : "/compte";
  const isAdminFlow = next === "/admin";

  const errorUrl = new URL("/auth/erreur", appOrigin);
  errorUrl.searchParams.set("flow", isAdminFlow ? "admin" : "seller");

  const supabase = await createSupabaseServerClient();

  if (!nativeFlow) {
    if (!code) {
      errorUrl.searchParams.set("reason", "callback");
      return redirectNoStore(errorUrl);
    }
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("[auth-callback] exchangeCodeForSession failed", {
        code: exchangeError.code,
        status: exchangeError.status,
        message: exchangeError.message,
      });
      errorUrl.searchParams.set("reason", "exchange");
      if (exchangeError.code) errorUrl.searchParams.set("code", exchangeError.code);
      return redirectNoStore(errorUrl);
    }
  }

  if (nativeFlow || isAdminFlow) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[auth-callback] session missing after OAuth exchange", userError?.message);
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "session");
      return redirectNoStore(errorUrl);
    }

    if (isAdminFlow) {
      const { data: assignments, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roleError || !assignments?.some((assignment) => assignment.role === "super_admin")) {
        console.error("[auth-callback] super-admin role check failed", roleError?.message);
        await supabase.auth.signOut();
        errorUrl.searchParams.set("reason", "not_admin");
        return redirectNoStore(errorUrl);
      }
    }
  }

  return redirectNoStore(new URL(next, appOrigin));
}
