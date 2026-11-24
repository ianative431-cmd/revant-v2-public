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
      <nav aria-label="Raccourcis des univers Revant" className="relative">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shortcuts.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              aria-label={`Explorer : ${label}`}
              className="revant-shortcut group flex min-h-[82px] w-[72px] shrink-0 snap-start flex-col items-center justify-center gap-2 bg-transparent px-1 py-1 text-center transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] active:scale-[0.98] sm:w-[84px] sm:min-h-[94px]"
            >
              <span
                className="revant-shortcut-icon relative isolate flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 bg-transparent shadow-none ring-0 transition duration-200 sm:h-[60px] sm:w-[60px]"
                style={{
                  borderRadius: "50%",
                  borderWidth: 4,
                  borderStyle: "solid",
                  borderColor: "var(--brand-shortcut-outline)",
                  color: "var(--brand-shortcut-outline)",
                }}
              >
                <Icon
                  className="revant-shortcut-glyph"
                  size={25}
                  strokeWidth={1.7}
                  aria-hidden
                  style={{
                    color: "var(--brand-shortcut-outline)",
                    stroke: "currentColor",
                    fill: "none",
                  }}
                />
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
