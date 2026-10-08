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

  if (error || !data) return null;
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
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (shop) return { kind: "found", shop: shop as Shop };

  // NB : l'archivage des anciens slugs (table shop_slug_history) n'existe
  // plus dans le schéma actuel — un ancien lien renvoie directement
  // "introuvable" plutôt qu'une redirection.
  return { kind: "not_found" };
}

/**
 * Restaurants réels et actifs, pour la page de découverte publique
 * /restaurants. Aucune boutique fictive : si aucun vendeur n'a encore
 * créé de restaurant, la liste renvoyée est simplement vide (voir
 * l'état vide honnête géré par la page).
 */
export async function getActiveRestaurants(supabase: SupabaseClient): Promise<Shop[]> {
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("is_restaurant", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data ?? []) as Shop[];
}

/**
 * Boutiques réelles et actives (tous types confondus), pour la
 * section "Boutiques en vedette" de l'accueil. Aucune boutique
 * fictive : liste vide tant qu'aucun vendeur n'est actif.
 */
export async function getActiveShops(
  supabase: SupabaseClient,
  options?: { limit?: number }
): Promise<Shop[]> {
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 8);
  return (data ?? []) as Shop[];
}
