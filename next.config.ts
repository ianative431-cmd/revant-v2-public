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

// Hôte Supabase à autoriser dans la CSP (connect-src/img-src), en plus
// de next/image — même logique que supabaseHostname ci-dessus : déduit
// de l'env, jamais codé en dur.
const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : "";

// Content-Security-Policy : volontairement stricte par défaut
// ('self' partout), avec seulement les exceptions réellement utilisées
// aujourd'hui dans le code — le SDK Meta (connexion WhatsApp Business
// dans /admin, src/app/admin/whatsapp/ConnectButton.tsx) et Supabase
// (API + Storage). unsafe-inline reste nécessaire pour style-src :
// Tailwind et Next.js injectent des styles inline légitimes, et le
// risque (CSS) est bien moindre qu'un unsafe-inline sur script-src,
// volontairement absent ici.
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' https://connect.facebook.net`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://*.fbcdn.net`,
  `font-src 'self' data:`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} wss://${supabaseHostname}` : ""} https://connect.facebook.net https://graph.facebook.com`,
  `frame-src https://www.facebook.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
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

  // Headers de sécurité appliqués à toutes les réponses (cahier des
  // charges §26). frame-ancestors remplace X-Frame-Options pour
  // l'anti-clickjacking (plus flexible, supporté par tous les
  // navigateurs modernes) ; X-Frame-Options est quand même ajouté en
  // repli pour les très vieux navigateurs qui ignorent la CSP.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
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
