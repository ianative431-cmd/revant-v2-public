import type { NextConfig } from "next";
import { createSecurityHeaders } from "./src/lib/security-headers.mjs";

// Domaine autorisé pour next/image, déduit de NEXT_PUBLIC_SUPABASE_URL.
let supabaseHostname: string | undefined;
try {
  supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
} catch {
  supabaseHostname = undefined;
}

const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : "";

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
  async headers() {
    return createSecurityHeaders(supabaseOrigin);
  },
};

export default nextConfig;
