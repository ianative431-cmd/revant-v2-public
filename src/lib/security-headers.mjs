/**
 * Security headers shared by Next.js and the Node.js test suite.
 * HSTS is intentionally scoped to this host (no includeSubDomains/preload).
 */
export function createSecurityHeaders(supabaseOrigin = "") {
  const supabaseHostname = supabaseOrigin
    ? new URL(supabaseOrigin).hostname
    : "";

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://*.fbcdn.net`,
    "font-src 'self' data:",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} wss://${supabaseHostname}` : ""} https://connect.facebook.net https://graph.facebook.com`,
    "frame-src https://www.facebook.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return [
    {
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: cspDirectives },
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value:
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
        },
      ],
    },
  ];
}
