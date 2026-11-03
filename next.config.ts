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

  // La CSP est générée par requête dans src/proxy.ts afin d'injecter un
  // nonce Next.js compatible avec les scripts d'hydratation. Les autres
  // en-têtes de sécurité restent configurés ici.
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
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
