import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getOrdersForShop } from "@/server/orders/orders";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { getShopTypeLabel } from "@/content/shops/shop-type-labels";
import { env } from "@/lib/env";
import EditShopForm from "./EditShopForm";
import CopyShopLink from "./CopyShopLink";
import ShopReviewPanel from "./ShopReviewPanel";

type Metric = { label: string; value: number; detail: string };

export default async function MaBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
        <div className="w-full max-w-md rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 text-center shadow-sm">
          <h1 className="text-xl font-black">Aucune boutique pour l’instant</h1>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">Crée ta boutique pour commencer à vendre sur Revant.</p>
          <Link href="/boutiques/creer" className="mt-6 inline-block rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-white">Créer ma boutique</Link>
        </div>
      </div>
    );
  }

  const [
    productTotalResult,
    activeProductsResult,
    pendingProductsResult,
    outOfStockResult,
    orders,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shop.id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).eq("status", "active").lte("stock_quantity", 0),
    getOrdersForShop(supabase, shop.id),
  ]);

  const results = [productTotalResult, activeProductsResult, pendingProductsResult, outOfStockResult];
  if (results.some((result) => result.error)) {
    throw new Error("Impossible de calculer les indicateurs réels de la boutique.");
  }
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const inProgressOrders = orders.filter((order) => ["confirmed", "processing", "ready_for_delivery", "shipped"].includes(order.status)).length;

  const metrics: Metric[] = [
    { label: "Commandes reçues", value: orders.length, detail: "Commandes visibles pour cette boutique" },
    { label: "À confirmer", value: pendingOrders, detail: "En attente de ta décision" },
    { label: "En cours", value: inProgressOrders, detail: "Confirmées ou en livraison" },
    { label: "Annonces actives", value: activeProductsResult.count ?? 0, detail: `Sur ${productTotalResult.count ?? 0} annonces enregistrées` },
    { label: "À valider", value: pendingProductsResult.count ?? 0, detail: "Annonces en attente de modération" },
    { label: "Stock épuisé", value: outOfStockResult.count ?? 0, detail: "Annonces actives sans stock" },
  ];

  const publicUrl = env.siteUrl() + "/shop/" + shop.slug;
  const qrCodeDataUrl = shop.status === "active" ? await generateQrCodeDataUrl(publicUrl) : null;
  const hasContact = Boolean(shop.phone?.trim() || shop.whatsapp?.trim());

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 text-brand-text sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[var(--brand-accent)]">Espace vendeur</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Ma boutique</h1>
            <p className="mt-1 text-sm text-[var(--brand-muted)]">{shop.name}</p>
          </div>
          {shop.status === "active" && (
            <Link href={`/shop/${shop.slug}`} className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-2.5 text-xs font-bold transition hover:border-brand-accent hover:text-brand-accent">
              Voir ma vitrine publique
            </Link>
          )}
        </header>

        <ShopReviewPanel status={shop.status} hasContact={hasContact} />

        <section aria-label="Indicateurs réels de la boutique" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-[22px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-muted)]">{metric.label}</p>
              <p className="mt-2 text-3xl font-black tabular-nums">{metric.value.toLocaleString("fr-FR")}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--brand-muted)]">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black">Gestion de la boutique</h2>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Gère tes annonces, commandes et informations publiques.</p>
              </div>
              <span className="rounded-full bg-[var(--brand-bg)] px-3 py-1.5 text-[10px] font-bold text-[var(--brand-muted)]">Revant ID · {shop.id.slice(0, 8)}</span>
            </div>
            <EditShopForm initialName={shop.name} initialDescription={shop.description ?? ""} initialSlug={shop.slug} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/compte/boutique/produits" className="rounded-2xl bg-brand-accent px-4 py-4 text-sm font-extrabold text-white transition hover:brightness-95">
                Mes annonces
                <span className="mt-1 block text-[10px] font-medium text-white/75">Créer, modifier et suivre les stocks</span>
              </Link>
              <Link href="/compte/boutique/commandes" className="rounded-2xl border border-[var(--brand-border)] px-4 py-4 text-sm font-extrabold transition hover:border-brand-accent">
                Commandes
                <span className="mt-1 block text-[10px] font-medium text-[var(--brand-muted)]">Confirmer et organiser les livraisons</span>
              </Link>
              <Link href="/compte/boutique/personnaliser" className="rounded-2xl border border-[var(--brand-border)] px-4 py-4 text-sm font-extrabold transition hover:border-brand-accent">
                Personnaliser la boutique
                <span className="mt-1 block text-[10px] font-medium text-[var(--brand-muted)]">Logo, bannière et informations</span>
              </Link>
              <Link href="/compte/boutique/verification" className="rounded-2xl border border-[var(--brand-border)] px-4 py-4 text-sm font-extrabold transition hover:border-brand-accent">
                Certification
                <span className="mt-1 block text-[10px] font-medium text-[var(--brand-muted)]">Suivre le dossier de vérification</span>
              </Link>
              <Link href="/compte/boutique/reseaux" className="rounded-2xl border border-[var(--brand-border)] px-4 py-4 text-sm font-extrabold transition hover:border-brand-accent sm:col-span-2">
                Calendrier des réseaux sociaux
                <span className="mt-1 block text-[10px] font-medium text-[var(--brand-muted)]">Préparer et organiser les publications autorisées</span>
              </Link>
            </div>
          </div>

          <aside className="rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm">
            <h2 className="text-sm font-black">Partager la boutique</h2>
            {qrCodeDataUrl ? (
              <div className="mt-4 flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée côté serveur */}
                <img src={qrCodeDataUrl} alt={`QR code de la boutique ${shop.name}`} width={176} height={176} />
                <CopyShopLink url={publicUrl} />
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-[var(--brand-bg)] p-3 text-center text-xs leading-relaxed text-[var(--brand-muted)]">
                Le QR code et le lien public seront disponibles après validation et publication de la boutique.
              </p>
            )}
            <dl className="mt-5 space-y-3 border-t border-[var(--brand-border)] pt-4 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-[var(--brand-muted)]">Type</dt><dd className="text-right font-semibold">{getShopTypeLabel(shop)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[var(--brand-muted)]">Statut</dt><dd className="text-right font-semibold">{shop.status === "active" ? "Publiée" : shop.status === "pending" ? "En validation" : shop.status === "suspended" ? "Suspendue" : shop.status === "closed" ? "Fermée" : "Brouillon"}</dd></div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
