import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductById } from "@/server/products/products";
import { createGuestOrder } from "@/server/orders/guest-actions";
import { notFound } from "next/navigation";

type Props = { searchParams: Promise<{ productId?: string; erreur?: string }> };

export default async function GuestCheckoutPage({ searchParams }: Props) {
  const { productId, erreur } = await searchParams;
  if (!productId) notFound();
  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, productId);
  if (!product || product.status !== "active" || product.stock_quantity <= 0) notFound();

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-8 text-[#111]">
      <div className="mx-auto max-w-2xl">
        <Link href={`/produit/${product.id}`} className="text-sm text-neutral-500">← Retour au produit</Link>
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-widest text-neutral-500">COMMANDE INVITÉ</p>
          <h1 className="mt-2 text-2xl font-black">Commander sans compte</h1>
          <p className="mt-2 text-sm text-neutral-600">Remplis tes coordonnées de livraison. Aucun mot de passe ni inscription ne sont nécessaires.</p>
          <div className="mt-5 flex items-center gap-4 rounded-xl bg-neutral-50 p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-neutral-500">Prix affiché en base de données</p></div>
            <p className="shrink-0 text-sm font-black">{product.base_price.toLocaleString("fr-FR")} {product.currency}</p>
          </div>
          {erreur && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur === "validation" ? "Vérifie les informations saisies." : "La commande n’a pas pu être créée. Vérifie les informations et réessaie."}</p>}
          <form action={createGuestOrder} className="mt-6 grid gap-4">
            <input type="hidden" name="productId" value={product.id} />
            <div><label htmlFor="guest-name" className="mb-1 block text-xs font-semibold">Nom complet</label><input id="guest-name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="Ton nom complet" /></div>
            <div><label htmlFor="guest-phone" className="mb-1 block text-xs font-semibold">Téléphone</label><input id="guest-phone" name="phone" required minLength={8} maxLength={24} autoComplete="tel" inputMode="tel" className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="+227 ..." /></div>
            <div><label htmlFor="guest-city" className="mb-1 block text-xs font-semibold">Ville</label><input id="guest-city" name="city" required minLength={2} maxLength={100} autoComplete="address-level2" className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="Niamey, Maradi..." /></div>
            <div><label htmlFor="guest-address" className="mb-1 block text-xs font-semibold">Adresse ou point de repère</label><textarea id="guest-address" name="address" required minLength={5} maxLength={300} autoComplete="street-address" rows={3} className="w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="Quartier, rue, repère proche..." /></div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label htmlFor="guest-website">Ne pas remplir</label><input id="guest-website" name="website" tabIndex={-1} autoComplete="off" /></div>
            <button type="submit" className="mt-2 w-full rounded-full bg-black px-6 py-4 text-sm font-bold text-white hover:bg-neutral-800">Confirmer la commande</button>
            <p className="text-center text-xs text-neutral-500">Le montant est recalculé côté serveur. Aucun paiement n’est débité sur cette étape.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
