import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductById } from "@/server/products/products";
import { createGuestOrder } from "@/server/orders/guest-actions";

type Props = { searchParams: Promise<{ productId?: string; error?: string }> };

const ERRORS: Record<string, string> = {
  produit: "Choisis un produit valide.",
  coordonnees: "Vérifie ton nom, ton numéro de téléphone et ton adresse de livraison.",
  indisponible: "Ce produit n'est plus disponible.",
  erreur: "La commande n'a pas pu être enregistrée. Réessaie dans un instant.",
};

export default async function GuestCheckoutPage({ searchParams }: Props) {
  const { productId, error } = await searchParams;
  if (!productId) notFound();

  const supabase = await createSupabaseServerClient();
  const product = await getProductById(supabase, productId);
  if (!product || product.status !== "active" || product.stock_quantity < 1) notFound();

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="max-w-md mx-auto">
        <Link href={`/produit/${product.id}`} className="text-sm underline text-brand-text/60">← Retour au produit</Link>
        <section className="bg-white rounded-[22px] p-6 shadow-sm mt-4">
          <h1 className="text-xl font-bold mb-1">Commander sans compte</h1>
          <p className="text-sm text-brand-text/60 mb-5">Pas besoin de créer un compte ni de te connecter.</p>
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-brand-bg">
              {product.images[0] && <Image src={product.images[0]} alt={product.name} fill sizes="64px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{product.name}</p>
              <p className="text-sm font-bold">{product.base_price.toLocaleString("fr-FR")} {product.currency}</p>
              <p className="text-xs text-brand-text/50">Livraison à convenir avec le vendeur</p>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 mb-3">{ERRORS[error] ?? ERRORS.erreur}</p>}
          <form action={createGuestOrder} className="flex flex-col gap-3">
            <input type="hidden" name="productId" value={product.id} />
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label>Ne pas remplir <input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <label className="text-sm font-medium">Nom complet
              <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" placeholder="Ton nom" />
            </label>
            <label className="text-sm font-medium">Téléphone
              <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" placeholder="+227 ..." />
            </label>
            <label className="text-sm font-medium">Ville
              <input name="city" required minLength={2} maxLength={120} autoComplete="address-level2" className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" placeholder="Niamey..." />
            </label>
            <label className="text-sm font-medium">Adresse ou point de livraison
              <textarea name="address" required minLength={3} maxLength={500} autoComplete="street-address" rows={3} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm resize-none" placeholder="Quartier, rue, repère..." />
            </label>
            <p className="text-xs text-brand-text/60">Aucun paiement en ligne n'est effectué à cette étape. Le vendeur te contactera pour confirmer la commande et la livraison.</p>
            <button type="submit" className="w-full bg-brand-accent text-white rounded-full py-3 text-sm font-medium">Confirmer la commande</button>
          </form>
        </section>
      </div>
    </main>
  );
}
