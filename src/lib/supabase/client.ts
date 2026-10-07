/**
 * Client Supabase utilisable UNIQUEMENT côté navigateur (composants "use client").
 * N'utilise que la clé publique (anon key) — jamais la clé service role ici.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
