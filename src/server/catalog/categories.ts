import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Category = { id: string; name: string; slug: string };

/**
 * Catégories réelles (table categories, gérée pour l'instant en base
 * directement). Remplace l'ancienne liste codée en dur — toute
 * modification se fait désormais dans Supabase, pas dans le code.
 */
export async function getActiveCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  return data ?? [];
}
