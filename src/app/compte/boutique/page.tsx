import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { env } from "@/lib/env";
import EditShopForm from "./EditShopForm";
import CopyShopLink from "./CopyShopLink";

export default async function MaBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
        <div className="w-full max-w-sm bg-white rounded-[22px] p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold mb-1">Aucune boutique pour l&apos;instant</h1>
          <p className="text-sm text-black/60 mb-6">
            Crée ta boutique pour commencer à vendre sur Revant.
          </p>
          <Link
            href="/boutiques/creer"
            className="inline-block bg-black text-white rounded-full px-6 py-3 text-sm font-medium"
          >
            Créer ma boutique
          </Link>
        </div>
      </div>
    );
  }

  const publicUrl = `${env.siteUrl()}/shop/${shop.slug}`;
  const qrCodeDataUrl = await generateQrCodeDataUrl(publicUrl);

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-[22px] p-8 shadow-sm">
        <h1 className="text-xl font-bold mb-1">Ma boutique</h1>
        <p className="text-sm text-black/60 mb-6">{shop.name}</p>

        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée côté serveur, pas une source distante à optimiser */}
          <img src={qrCodeDataUrl} alt={`QR code de la boutique ${shop.name}`} width={140} height={140} />
          <CopyShopLink url={publicUrl} />
        </div>

        <dl className="text-sm mb-6 space-y-2">
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">Revant ID</dt>
            <dd className="font-mono text-xs break-all text-right">{shop.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-black/60">Type</dt>
            <dd>{getShopTypeLabel(shop.shop_type)}</dd>
          </div>
        </dl>

        <EditShopForm
          initialName={shop.name}
          initialSlogan={shop.slogan ?? ""}
          initialDescription={shop.description ?? ""}
          initialSlug={shop.slug}
        />

        <Link
          href="/compte/boutique/produits"
          className="block text-center w-full bg-black text-white rounded-full py-3 text-sm font-medium mb-3"
        >
          Mes annonces
        </Link>

        <Link
          href="/compte/boutique/commandes"
          className="block text-center w-full border border-black rounded-full py-3 text-sm font-medium mb-3"
        >
          Commandes
        </Link>

        <div className="mt-6 border-t pt-4">
          <Link
            href="/compte/boutique/personnaliser"
            className="block text-center w-full border border-black rounded-full py-3 text-sm font-medium"
          >
            Personnaliser l&apos;apparence
          </Link>
        </div>
      </div>
    </div>
  );
}
