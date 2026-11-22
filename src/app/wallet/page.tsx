import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CreditCard, LockKeyhole, ReceiptText, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import SiteHeader from "@/components/layout/SiteHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getShopByOwnerId } from "@/server/shops/shops";

type Props = { searchParams: Promise<{ vue?: string }> };

function WalletTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined}
    className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${active ? "bg-brand-accent text-white shadow-sm" : "border border-brand-border bg-brand-surface text-brand-muted hover:border-brand-accent"}`}>{children}</Link>;
}

function BuyerWallet() {
  return (
    <section aria-labelledby="buyer-wallet-title" className="space-y-5">
      <div className="rounded-[26px] border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-accent">REVANT · PAIEMENTS</p>
            <h2 id="buyer-wallet-title" className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Tes moyens de paiement</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-muted">Retrouve ici les cartes et moyens de paiement que tu auras enregistrés pour tes prochains achats.</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-bg text-brand-accent"><CreditCard size={22}/></span>
        </div>
        <div className="mt-6 overflow-hidden rounded-[22px] border border-dashed border-brand-border bg-brand-bg p-5 sm:p-7">
          <div className="mx-auto flex min-h-[150px] max-w-sm flex-col justify-between rounded-[20px] border border-white/30 bg-gradient-to-br from-[#e8e2ee] via-[#d9d1e3] to-[#c7c3d6] p-5 text-[#24212b] shadow-[0_14px_35px_rgba(65,50,85,.14)]">
            <div className="flex items-center justify-between"><span className="text-[10px] font-extrabold tracking-[.2em]">REVANT WALLET</span><LockKeyhole size={17}/></div>
            <div><p className="text-sm font-semibold">Tes cartes apparaîtront ici</p><p className="mt-1 text-[10px] text-[#4f4a59]">Visa · Mastercard · autres réseaux compatibles</p></div>
            <div className="flex items-center justify-between text-[10px] font-bold"><span>MOYENS DE PAIEMENT SÉCURISÉS</span><span className="tracking-wider">••••</span></div>
          </div>
          <div className="mx-auto mt-5 max-w-sm text-center">
            <h3 className="text-sm font-bold">Aucune carte enregistrée</h3>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted">L’enregistrement sécurisé par jeton sera activé avec le prestataire de paiement. Ne saisis aucune donnée bancaire ici pour le moment.</p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-accent"/>
        <div><p className="text-xs font-bold">Protection de tes données</p><p className="mt-1 text-xs leading-relaxed text-brand-muted">Revant ne doit jamais enregistrer le cryptogramme CVV ni conserver directement le numéro complet de ta carte. Le prestataire devra fournir un jeton sécurisé et les seules informations d’affichage nécessaires.</p></div>
      </div>
    </section>
  );
}

function SellerWallet({ shopName }: { shopName: string }) {
  const balances = [
    { label: "Disponible", detail: "Retirable après validation", icon: ArrowUpRight },
    { label: "En attente", detail: "Commandes en cours", icon: ArrowDownLeft },
    { label: "Bloqué", detail: "Vérification ou litige", icon: LockKeyhole },
  ];
  return (
    <section aria-labelledby="seller-wallet-title" className="space-y-5">
      <div className="rounded-[26px] border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-accent">REVANT · ESPACE VENDEUR</p>
        <div className="mt-2 flex items-center justify-between gap-3"><div><h2 id="seller-wallet-title" className="text-xl font-black tracking-tight sm:text-2xl">Wallet vendeur</h2><p className="mt-1 text-xs text-brand-muted">{shopName}</p></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-bg text-brand-accent"><WalletIcon size={22}/></span></div>
        <div className="mt-6 rounded-[22px] bg-gradient-to-br from-[#20232d] via-[#303344] to-[#4b4660] p-5 text-white shadow-lg sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/65">Solde total</p>
          <p className="mt-2 text-3xl font-black tracking-tight">— <span className="text-sm font-semibold text-white/70">FCFA</span></p>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-white/75"><span className="h-2 w-2 rounded-full bg-amber-300"/>Affichage en attente de l’activation du ledger financier</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {balances.map(({ label, detail, icon: Icon }) => <div key={label} className="min-w-0 rounded-2xl border border-brand-border bg-brand-bg p-3"><Icon size={17} className="text-brand-accent"/><p className="mt-2 text-xs font-bold">{label}</p><p className="mt-1 text-base font-black">—</p><p className="mt-1 text-[9px] leading-snug text-brand-muted">{detail}</p></div>)}
        </div>
      </div>
      <div className="space-y-3">
        <Link href="/compte/recus" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-surface px-3 text-xs font-bold transition hover:border-brand-accent"><ReceiptText size={17}/> Mes reçus</Link>
        <p className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-xs leading-relaxed text-brand-muted">Les statistiques seront affichées après activation du journal financier. Aucun montant estimatif ne sera présenté comme un revenu réel.</p>
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-accent"/><p className="text-xs leading-relaxed text-brand-muted">Les montants et les retraits seront activés uniquement après mise en place du journal financier immuable, des confirmations de paiement et des contrôles de libération des fonds.</p></div>
    </section>
  );
}

export default async function WalletPage({ searchParams }: Props) {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  const isSeller = Boolean(shop);
  const params = await searchParams;
  const view = isSeller && params.vue === "acheteur" ? "acheteur" : isSeller ? "vendeur" : "acheteur";
  return (
    <div className="revant-wallet-page min-h-screen bg-brand-bg pb-32 text-brand-text">
      <SiteHeader/>
      <main className="revant-wallet-layout mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <header className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-accent">REVANT</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Wallet</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">{view === "vendeur" ? "Suis les revenus de ta boutique et les mouvements de ton solde." : "Gère tes cartes et tes moyens de paiement en un seul endroit."}</p></header>
        {isSeller && <div className="mb-5 flex flex-wrap gap-2" aria-label="Type de wallet"><WalletTab href="/wallet?vue=acheteur" active={view === "acheteur"}>Acheteur</WalletTab><WalletTab href="/wallet?vue=vendeur" active={view === "vendeur"}>Vendeur</WalletTab></div>}
        {view === "vendeur" && shop ? <SellerWallet shopName={shop.name}/> : <BuyerWallet/>}
      </main>
      <BottomNav/>
    </div>
  );
}
