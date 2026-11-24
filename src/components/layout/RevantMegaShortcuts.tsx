import Link from "next/link";
import { Shirt, FlaskConical, ShoppingBag, Smartphone, Store, Leaf, Utensils } from "lucide-react";

const shortcuts = [
  { label: "Mode", href: "/?categorie=mode#produits", icon: Shirt },
  { label: "Parfums", href: "/?categorie=parfums#produits", icon: FlaskConical },
  { label: "Beauté", href: "/?categorie=beaute#produits", icon: ShoppingBag },
  { label: "Électronique", href: "/?categorie=electronique#produits", icon: Smartphone },
  { label: "Boutiques", href: "/boutiques", icon: Store },
  { label: "Terroir", href: "/?categorie=alimentation#produits", icon: Leaf },
  { label: "Restaurants", href: "/restaurants", icon: Utensils },
];

export default function RevantMegaShortcuts() {
  return (
    <section aria-label="Explorer Revant Mega" className="revant-home-section revant-shortcuts">
      <div className="revant-home-section__head mb-3 px-1 sm:mb-4">
        <div>
          <p className="revant-home-section__eyebrow">Accès rapide</p>
          <h2 className="revant-home-section__title">Explorer les univers</h2>
        </div>
        <Link href="/boutiques" className="revant-home-section__link shrink-0 px-2 py-2">
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
              className="revant-shortcut group flex min-h-[82px] w-[72px] shrink-0 snap-start flex-col items-center justify-center gap-2 bg-transparent px-1 py-1 text-center transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] active:scale-[0.98] sm:w-[84px] sm:min-h-[94px]"
            >
              <span className="revant-shortcut-icon relative isolate flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[var(--brand-text)] bg-brand-accent-soft text-[var(--brand-text)] shadow-[var(--brand-shadow)] ring-1 ring-inset ring-[var(--brand-text)]/35 transition duration-200 before:pointer-events-none before:absolute before:inset-[4px] before:rounded-full before:border before:border-[var(--brand-text)]/45 before:content-[''] sm:h-[60px] sm:w-[60px]">
                <Icon size={25} strokeWidth={1.7} aria-hidden />
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
