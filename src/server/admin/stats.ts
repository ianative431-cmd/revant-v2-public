import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminOverviewStats = {
  shops: { total: number; standard: number; restaurant: number; pro: number; fournisseur: number; suspended: number };
  products: { total: number; active: number; sold: number };
  users: { total: number; admin: number; seller: number; customer: number };
  backgrounds: { total: number; active: number };
};

/**
 * Compteurs réels pour le tableau de bord (section 10 du prompt maître
 * "mise à jour"). Utilise le client service role : les boutiques
 * suspendues et les comptes autres que le sien ne sont, par conception,
 * pas visibles via les RLS normales (voir migrations 0002 et 0006).
 * Aucune donnée simulée — si une requête échoue, le compteur reste à 0
 * plutôt que d'afficher un chiffre inventé.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createSupabaseAdminClient();

  const [shopsRes, productsRes, profilesRes, backgroundsRes] = await Promise.all([
    admin.from("shops").select("shop_type, status"),
    admin.from("products").select("status"),
    admin.from("profiles").select("role"),
    admin.from("backgrounds").select("is_active"),
  ]);

  const shopsData = shopsRes.data ?? [];
  const productsData = productsRes.data ?? [];
  const profilesData = profilesRes.data ?? [];
  const backgroundsData = backgroundsRes.data ?? [];

  return {
    shops: {
      total: shopsData.length,
      standard: shopsData.filter((s) => s.shop_type === "standard").length,
      restaurant: shopsData.filter((s) => s.shop_type === "restaurant").length,
      pro: shopsData.filter((s) => s.shop_type === "pro").length,
      fournisseur: shopsData.filter((s) => s.shop_type === "fournisseur").length,
      suspended: shopsData.filter((s) => s.status === "suspended").length,
    },
    products: {
      total: productsData.length,
      active: productsData.filter((p) => p.status === "active").length,
      sold: productsData.filter((p) => p.status === "sold").length,
    },
    users: {
      total: profilesData.length,
      admin: profilesData.filter((p) => p.role === "admin").length,
      seller: profilesData.filter((p) => p.role === "seller").length,
      customer: profilesData.filter((p) => p.role === "customer").length,
    },
    backgrounds: {
      total: backgroundsData.length,
      active: backgroundsData.filter((b) => b.is_active).length,
    },
  };
}
