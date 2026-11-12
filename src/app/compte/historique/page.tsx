import Link from "next/link";
import { ChevronRight, ShoppingBag, Store, Truck } from "lucide-react";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

const HISTORY_LINKS = [
  {
    href: "/compte/commandes",
    title: "Mes achats",
    description: "Retrouver les commandes passées en tant qu’acheteur.",
    Icon: ShoppingBag,
    color: "#F46A18",
  },
  {
    href: "/compte/boutique/commandes",
    title: "Mes ventes",
    description: "Consulter les commandes reçues par ta boutique.",
    Icon: Store,
    color: "#57707A",
  },
  {
    href: "/compte/livraisons",
    title: "Mes livraisons",
    description: "Espace réservé aux livreurs activés par l’administration Revant.",
    Icon: Truck,
    color: "#E6A23C",
  },
];

export default async function HistoriquePage() {
  await requireUserWithLegalConsent();

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/parametres" className="text-sm font-medium text-brand-muted underline underline-offset-4">← Paramètres</Link>
        <header className="mb-6 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">ACTIVITÉ</p>
          <h1 className="mt-2 text-2xl font-black">Historique</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">Choisis l’activité à consulter. Chaque espace conserve ses propres droits d’accès.</p>
        </header>
        <div className="space-y-3">
          {HISTORY_LINKS.map(({ href, title, description, Icon, color }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm transition hover:border-brand-accent/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ color, backgroundColor: `${color}16` }}>
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-brand-muted">{description}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-brand-muted" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
