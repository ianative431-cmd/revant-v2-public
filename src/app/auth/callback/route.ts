import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_DESTINATIONS = new Set(["/compte", "/compte/boutique", "/reinitialiser-mot-de-passe"]);

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
  // Super Admin authentication is local-only; Google OAuth cannot target /admin.
  const errorUrl = new URL("/auth/erreur", appOrigin);
  errorUrl.searchParams.set("flow", "seller");

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

  if (nativeFlow) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[auth-callback] session missing after OAuth exchange", userError?.message);
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "session");
      return redirectNoStore(errorUrl);
    }

  }

  return redirectNoStore(new URL(next, appOrigin));
}
