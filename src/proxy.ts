import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Construit une CSP par requête. Le nonce permet à Next.js d'autoriser
 * ses scripts d'hydratation sans ouvrir script-src à unsafe-inline.
 */
function buildContentSecurityPolicy(nonce: string, supabaseUrl: string | undefined) {
  let supabaseOrigin = "";
  let supabaseWebSocketOrigin = "";

  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      if (parsed.protocol === "https:") {
        supabaseOrigin = parsed.origin;
        supabaseWebSocketOrigin = `wss://${parsed.host}`;
      }
    } catch {
      // Une URL Supabase invalide ne doit jamais élargir la CSP.
    }
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://connect.facebook.net`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://images.unsplash.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://*.fbcdn.net`,
    "font-src 'self' data:",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseWebSocketOrigin}` : ""} https://connect.facebook.net https://graph.facebook.com`,
    "frame-src https://www.facebook.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Rafraîchit la session Supabase à chaque requête, propage les cookies
 * et transmet un nonce CSP à Next.js pour autoriser son hydratation.
 * Les contrôles d'accès par rôle restent dans les routes/pages serveur.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, supabaseUrl);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  // Ne pas initialiser le client avec une clé absente ; la CSP reste active.
  if (!supabaseUrl || !supabaseKey) {
    console.error("[supabase-proxy] URL ou clé publique Supabase manquante");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());

        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.headers.set("Content-Security-Policy", contentSecurityPolicy);

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    console.error("[supabase-proxy] Échec du rafraîchissement de session", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
