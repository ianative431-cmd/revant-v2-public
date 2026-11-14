import Link from "next/link";
import { getAllShopsForAdmin } from "@/server/admin/shops-admin";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { getShopStatusLabel } from "@/lib/shop-status.mjs";
import ShopStatusToggle from "./ShopStatusToggle";
import { hasPermission, requirePermission } from "@/server/auth/roles";

function statusColor(status: string) {
  if (status === "active") return "text-green-700";
  if (status === "pending") return "text-amber-700";
  if (status === "suspended") return "text-red-600";
  return "text-neutral-500";
}

export default async function AdminBoutiquesPage() {
  await requirePermission("shops.view");
  const [shops, canManageShops] = await Promise.all([
    getAllShopsForAdmin(),
    hasPermission("shops.manage"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Boutiques</h1>
      <p className="mb-6 text-sm text-black/60">
        {shops.length} boutique{shops.length > 1 ? "s" : ""}, tous types et statuts confondus.
      </p>

      {shops.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-black/40">
          Aucune boutique pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {shops.map((shop) => (
            <div key={shop.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{shop.name}</p>
                <p className="mt-0.5 text-xs text-black/50">
                  {getShopTypeLabel(shop)} ·{" "}
                  <span className={statusColor(shop.status)}>{getShopStatusLabel(shop.status)}</span>
                  {" "}· {new Date(shop.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={"/shop/" + shop.slug} className="text-xs text-black/50 underline">
                  Voir
                </Link>
                {canManageShops && <ShopStatusToggle shopId={shop.id} status={shop.status} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
