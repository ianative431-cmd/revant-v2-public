import Link from "next/link";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductById } from "@/server/products/products";
import { createGuestOrder } from "@/server/orders/guest-actions";
import { notFound } from "next/navigation";

type Props = { searchParams: Promise<{ productId?: string; quantity?: string; erreur?: string }> };

export default async function GuestCheckoutPage({ searchParams }: Props) {
  const { productId, quantity: rawQuantity, erreur } = await searchParams;
  if (!productId) notFound();
  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, productId);
  if (!product || product.status !== "active" || product.stock_quantity <= 0) notFound();
  const quantity = rawQuantity === undefined ? 1 : Number(rawQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) notFound();
  const stockUnavailable = quantity > product.stock_quantity || erreur === "stock";
  const idempotencyKey = randomUUID();
  const subtotal = product.base_price * quantity;

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="mx-auto max-w-2xl">
        <Link href={`/produit/${product.id}`} className="text-sm text-brand-muted">← Retour au produit</Link>
        <div className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-widest text-brand-muted">COMMANDE INVITÉ</p>
          <h1 className="mt-2 text-2xl font-black">Commander sans compte</h1>
          <p className="mt-2 text-sm text-brand-muted">Remplis tes coordonnées de livraison. Aucun mot de passe ni inscription ne sont nécessaires.</p>
          <div className="mt-5 flex items-center gap-4 rounded-xl bg-brand-bg p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-brand-muted">Quantité : {quantity}</p></div>
            <div className="shrink-0 text-right"><p className="text-xs text-brand-muted">{product.base_price.toLocaleString("fr-FR")} × {quantity}</p><p className="text-sm font-black">{subtotal.toLocaleString("fr-FR")} {product.currency}</p></div>
          </div>
          {stockUnavailable && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">La quantité demandée dépasse le stock disponible. Retourne au panier pour la modifier.</p>}
          {erreur && erreur !== "stock" && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur === "validation" ? "Vérifie les informations saisies." : "La commande n’a pas pu être créée. Vérifie les informations et réessaie."}</p>}
          <div role="note" className="mt-5 rounded-xl border border-brand-border bg-brand-bg p-4 text-xs leading-relaxed text-brand-muted"><strong className="text-brand-text">Paiement en ligne indisponible pour le moment.</strong> La commande sera envoyée au vendeur et restera en attente de confirmation. Revant n’encaisse aucun paiement à cette étape : attends les instructions de la boutique avant tout règlement.</div>
          <form action={createGuestOrder} className="mt-6 grid gap-4">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value={quantity} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <div><label htmlFor="guest-name" className="mb-1 block text-xs font-semibold">Nom complet</label><input id="guest-name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="Ton nom complet" /></div>
            <div><label htmlFor="guest-phone" className="mb-1 block text-xs font-semibold">Téléphone</label><input id="guest-phone" name="phone" required minLength={8} maxLength={24} autoComplete="tel" inputMode="tel" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="+227 ..." /></div>
            <div><label htmlFor="guest-city" className="mb-1 block text-xs font-semibold">Ville</label><input id="guest-city" name="city" required minLength={2} maxLength={100} autoComplete="address-level2" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="Niamey, Maradi..." /></div>
            <div><label htmlFor="guest-address" className="mb-1 block text-xs font-semibold">Adresse ou point de repère</label><textarea id="guest-address" name="address" required minLength={5} maxLength={300} autoComplete="street-address" rows={3} className="w-full resize-y rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent" placeholder="Quartier, rue, repère proche..." /></div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label htmlFor="guest-website">Ne pas remplir</label><input id="guest-website" name="website" tabIndex={-1} autoComplete="off" /></div>
            <button type="submit" disabled={stockUnavailable} className="mt-2 w-full rounded-full bg-brand-accent px-6 py-4 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">Envoyer la demande de commande</button>
            <p className="text-center text-xs text-brand-muted">Le montant est recalculé côté serveur avant l’envoi de la demande.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
