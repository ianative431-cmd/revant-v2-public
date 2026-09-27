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
};

export default nextConfig;
