import Link from "next/link";
import { Shirt, FlaskConical, ShoppingBag, House, Smartphone, Store, Leaf, Utensils } from "lucide-react";

const shortcuts = [
  { label: "Mode", href: "/?categorie=mode#produits", icon: Shirt },
  { label: "Parfums", href: "/?categorie=parfums#produits", icon: FlaskConical },
  { label: "Accessoires", href: "/?categorie=sacs-accessoires#produits", icon: ShoppingBag },
  { label: "Maison", href: "/maison", icon: House },
  { label: "Électronique", href: "/?categorie=electronique#produits", icon: Smartphone },
  { label: "Boutiques", href: "/boutiques", icon: Store },
  { label: "Terroir", href: "/#boutiques-paysannes", icon: Leaf },
  { label: "Restaurants", href: "/restaurants", icon: Utensils },
];

export default function RevantMegaShortcuts() {
  return (
    <section aria-label="Explorer Revant Mega" className="px-3 pb-3 pt-5 sm:px-5 sm:pt-8">
      <div className="mb-3 flex items-end justify-between gap-3 px-1 sm:mb-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-accent)]">À découvrir</p>
          <h2 className="text-base font-extrabold tracking-tight sm:text-lg">Explorer Revant Mega</h2>
        </div>
        <Link href="/boutiques" className="shrink-0 px-2 py-2 text-xs font-bold text-[var(--brand-accent)] transition hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]">
          Tout explorer <span aria-hidden="true">→</span>
        </Link>
      </div>
      <nav aria-label="Raccourcis des univers Revant" className="relative">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shortcuts.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              aria-label={`Explorer : ${label}`}
              className="revant-shortcut group flex min-h-[76px] w-[68px] shrink-0 snap-start flex-col items-center justify-center gap-2 bg-transparent px-1 py-1 text-center transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] active:scale-[0.98] sm:w-[80px] sm:min-h-[88px]"
            >
              <span className="revant-shortcut-icon flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--brand-accent)] transition duration-200 group-hover:border-[var(--brand-accent)] group-hover:bg-[var(--brand-accent-soft)] group-active:scale-95 sm:h-13 sm:w-13">
                <Icon size={24} strokeWidth={1.65} aria-hidden />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-[var(--brand-text)] sm:text-[11px]">{label}</span>
            </Link>
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[var(--brand-bg)] to-transparent" />
      </nav>
    </section>
  );
}
