import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shop } from "@/types/shop";

/**
 * Boutique associée à un compte, s'il en existe une (un seul compte =
 * une seule boutique pour l'instant, voir migration 0002_shops.sql).
 */
export async function getShopByOwnerId(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as Shop;
}

export type ShopLookupResult =
  | { kind: "found"; shop: Shop }
  | { kind: "redirect"; toSlug: string }
  | { kind: "not_found" };

/**
 * Résout un slug de boutique public : boutique trouvée directement,
 * ancien slug à rediriger vers la nouvelle adresse (section 7 du
 * prompt maître), ou boutique introuvable.
 */
export async function resolveShopBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ShopLookupResult> {
  const { data: shop, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (shop) return { kind: "found", shop: shop as Shop };

  // L'historique des anciens slugs n'existe pas dans le schéma actuel.
  return { kind: "not_found" };
}

/** Restaurants réels et actifs pour la page de découverte publique. */
export async function getActiveRestaurants(supabase: SupabaseClient): Promise<Shop[]> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("is_restaurant", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Shop[];
}

/**
 * Boutiques actives uniquement. La recherche facultative couvre le nom,
 * la description et la ville, sans exposer les boutiques non actives.
 */
export async function getActiveShops(
  supabase: SupabaseClient,
  options?: { limit?: number; searchTerm?: string }
): Promise<Shop[]> {
  let query = supabase
    .from("shops")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (options?.searchTerm) {
    const safeTerm = options.searchTerm
      .replace(/[%,()_*\\]/g, " ")
      .replace(/\\s+/g, " ")
      .trim();
    if (safeTerm) {
      query = query.or(`name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%,city.ilike.%${safeTerm}%`);
    }
  }

  const { data, error } = await query.limit(options?.limit ?? 8);
  if (error) throw error;
  return (data ?? []) as Shop[];
}
