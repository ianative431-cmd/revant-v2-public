import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Shop } from "@/types/shop";

/**
 * Toutes les boutiques, tous statuts et types confondus — les RLS
 * normales (shops_public_read_active / shops_owner_read_own) ne
 * donnent volontairement pas cette vue à un compte authentifié
 * classique, y compris admin (voir migration 0002_shops.sql).
 */
export async function getAllShopsForAdmin(): Promise<Shop[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("shops").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Shop[];
}
