import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase et génère une CSP stricte avec un nonce
 * imprévisible par requête. Next.js réutilise le nonce de la CSP transmise
 * dans les en-têtes de requête pour ses scripts de framework et d'hydratation.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  let supabaseHostname: string | undefined;
  try {
    supabaseHostname = new URL(supabaseUrl ?? "").hostname;
  } catch {
    supabaseHostname = undefined;
  }
  const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : "";

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://*.fbcdn.net https://images.unsplash.com`,
    "font-src 'self' data:",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} wss://${supabaseHostname}` : ""} https://connect.facebook.net https://graph.facebook.com`,
    "frame-src https://www.facebook.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Next.js doit recevoir la même CSP dans la requête pour extraire le nonce
  // et l'appliquer automatiquement aux scripts de framework.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  // Ne pas initialiser le client avec une clé absente.
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

        // Répercute les cookies rafraîchis dans les en-têtes transmis au rendu.
        const cookieHeader = request.cookies.toString();
        if (cookieHeader) requestHeaders.set("cookie", cookieHeader);
        else requestHeaders.delete("cookie");

        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.headers.set("Content-Security-Policy", cspHeader);

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
