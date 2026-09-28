import Link from "next/link";
import { getAllShopsForAdmin } from "@/server/admin/shops-admin";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import ShopStatusToggle from "./ShopStatusToggle";

export default async function AdminBoutiquesPage() {
  const shops = await getAllShopsForAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Boutiques</h1>
      <p className="text-sm text-black/60 mb-6">
        {shops.length} boutique{shops.length > 1 ? "s" : ""}, tous types et statuts confondus.
      </p>

      {shops.length === 0 ? (
        <p className="text-sm text-black/40 bg-white rounded-2xl p-6 text-center">
          Aucune boutique pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{shop.name}</p>
                <p className="text-xs text-black/50 mt-0.5">
                  {getShopTypeLabel(shop.shop_type)} ·{" "}
                  {shop.status === "suspended" ? (
                    <span className="text-red-600">Suspendue</span>
                  ) : (
                    "Active"
                  )}{" "}
                  · {new Date(shop.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Link href={`/shop/${shop.slug}`} className="text-xs underline text-black/50">
                  Voir
                </Link>
                <ShopStatusToggle shopId={shop.id} status={shop.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
