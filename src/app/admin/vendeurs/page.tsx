import Link from "next/link";
import { getAdminUserDirectory } from "@/server/admin/user-directory";
import { getAllShopsForAdmin } from "@/server/admin/shops-admin";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";

export default async function AdminVendeursPage() {
  const [users, shops] = await Promise.all([getAdminUserDirectory(), getAllShopsForAdmin()]);

  const shopByOwnerId = new Map(shops.map((s) => [s.owner_id, s]));
  const sellers = users.filter((u) => u.role === "seller" || shopByOwnerId.has(u.id));

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Vendeurs</h1>
      <p className="text-sm text-black/60 mb-6">
        {sellers.length} vendeur{sellers.length > 1 ? "s" : ""} — comptes ayant le rôle vendeur ou
        possédant une boutique.
      </p>

      {sellers.length === 0 ? (
        <p className="text-sm text-black/40 bg-white rounded-2xl p-6 text-center">
          Aucun vendeur pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sellers.map((u) => {
            const shop = shopByOwnerId.get(u.id);
            return (
              <div key={u.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.email ?? u.phone ?? u.id}</p>
                  {shop ? (
                    <p className="text-xs text-black/50 mt-0.5">
                      {shop.name} · {getShopTypeLabel(shop)} ·{" "}
                      {shop.status === "suspended" ? "Suspendue" : "Active"}
                    </p>
                  ) : (
                    <p className="text-xs text-black/40 mt-0.5">Aucune boutique créée</p>
                  )}
                </div>
                {shop && (
                  <Link
                    href={`/shop/${shop.slug}`}
                    className="shrink-0 text-xs border border-black rounded-full px-3 py-1.5"
                  >
                    Voir
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
