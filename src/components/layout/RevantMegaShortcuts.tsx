import Link from "next/link";

const shortcuts = [
  { label: "Mode", href: "/?categorie=mode#produits", icon: "mode" },
  { label: "Parfums", href: "/?categorie=parfums#produits", icon: "perfume" },
  { label: "Accessoires", href: "/?categorie=sacs-accessoires#produits", icon: "bag" },
  { label: "Maison", href: "/maison", icon: "home" },
  { label: "Électronique", href: "/?categorie=electronique#produits", icon: "phone" },
  { label: "Boutiques", href: "/boutiques", icon: "shop" },
  { label: "Terroir", href: "/#boutiques-paysannes", icon: "leaf" },
  { label: "Restaurants", href: "/restaurants", icon: "food" },
];

function ShortcutIcon({ kind }: { kind: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" {...common}>
      {kind === "mode" && <><path d="M7 4h10l2 5-2 2v9H7v-9L5 9l2-5Z" /><path d="M9 4c0 2 1 3 3 3s3-1 3-3" /></>}
      {kind === "perfume" && <><rect x="7" y="8" width="10" height="13" rx="2" /><path d="M10 8V5h4v3M11 5V3h2v2M9.5 12h5" /></>}
      {kind === "bag" && <><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>}
      {kind === "home" && <><path d="m3 11 9-7 9 7" /><path d="M5.5 10v9h13v-9M9 19v-5h6v5" /></>}
      {kind === "phone" && <><rect x="6.5" y="2.5" width="11" height="19" rx="2" /><path d="M10 5h4M11 18.5h2" /></>}
      {kind === "shop" && <><path d="M4 10v9h16v-9" /><path d="M3 4h18l1 5a2 2 0 0 1-4 1 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4-1l1-5Z" /><path d="M9 19v-5h6v5" /></>}
      {kind === "leaf" && <><path d="M20 4C10 4 5 8 5 14a5 5 0 0 0 5 5c6 0 10-6 10-15Z" /><path d="M3 21c3-6 7-9 13-12" /></>}
      {kind === "food" && <><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c3 2 4 5 4 8h-4" /></>}
    </svg>
  );
}

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
          {shortcuts.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-label={`Explorer : ${item.label}`}
              className="group flex min-h-[76px] w-[68px] shrink-0 snap-start flex-col items-center justify-center gap-2 bg-transparent px-1 py-1 text-center transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] active:scale-[0.98] sm:w-[80px] sm:min-h-[88px]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-accent-soft)] text-[var(--brand-accent)] transition duration-200 group-hover:bg-[var(--brand-accent)] group-hover:text-white group-active:scale-95 sm:h-13 sm:w-13">
                <ShortcutIcon kind={item.icon} />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-[var(--brand-text)] sm:text-[11px]">{item.label}</span>
            </Link>
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[var(--brand-bg)] to-transparent" />
      </nav>
    </section>
  );
}
