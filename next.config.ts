import type { NextConfig } from "next";

// Domaine autorisé pour next/image, déduit de NEXT_PUBLIC_SUPABASE_URL
// (jamais codé en dur : fonctionne avec n'importe quel projet Supabase,
// y compris le vrai projet une fois connecté).
let supabaseHostname: string | undefined;
try {
  supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
} catch {
  supabaseHostname = undefined;
}

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  // Les en-têtes CSP sont générés par src/proxy.ts avec un nonce unique
  // pour chaque requête, afin d'autoriser les scripts de démarrage Next.js
  // sans autoriser globalement les scripts inline.
  // Les autres en-têtes de sécurité restent définis ici.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
