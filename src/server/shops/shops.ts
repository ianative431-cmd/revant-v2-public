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

  const { data: history } = await supabase
    .from("shop_slug_history")
    .select("shop_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!history) return { kind: "not_found" };

  const { data: currentShop } = await supabase
    .from("shops")
    .select("slug")
    .eq("id", history.shop_id)
    .maybeSingle();

  if (!currentShop) return { kind: "not_found" };
  return { kind: "redirect", toSlug: currentShop.slug };
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
    .eq("shop_type", "restaurant")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data ?? []) as Shop[];
}
