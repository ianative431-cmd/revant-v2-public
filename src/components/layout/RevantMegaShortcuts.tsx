import Link from "next/link";

const shortcuts = [
  { label: "Mode", href: "/?categorie=vetements-homme#produits", icon: "mode" },
  { label: "Parfums", href: "/?categorie=parfums#produits", icon: "perfume" },
  { label: "Accessoires", href: "/?categorie=sacs-accessoires#produits", icon: "bag" },
  { label: "Maison", href: "/maison", icon: "home" },
  { label: "Électronique", href: "/?categorie=electronique#produits", icon: "phone" },
  { label: "Boutiques", href: "/boutiques", icon: "shop" },
  { label: "Terroir", href: "/#boutiques-paysannes", icon: "leaf" },
  { label: "Restaurants", href: "/restaurants", icon: "food" },
];

function ShortcutIcon({ kind }: { kind: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" {...common}>
    {kind === "mode" && <><path d="M7 4h10l2 5-2 2v9H7v-9L5 9l2-5Z"/><path d="M9 4c0 2 1 3 3 3s3-1 3-3"/></>}
    {kind === "perfume" && <><rect x="7" y="8" width="10" height="13" rx="2"/><path d="M10 8V5h4v3M11 5V3h2v2M9.5 12h5"/></>}
    {kind === "bag" && <><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>}
    {kind === "home" && <><path d="m3 11 9-7 9 7"/><path d="M5.5 10v9h13v-9M9 19v-5h6v5"/></>}
    {kind === "phone" && <><rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/></>}
    {kind === "shop" && <><path d="M4 10v9h16v-9"/><path d="M3 4h18l1 5a2 2 0 0 1-4 1 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4-1l1-5Z"/><path d="M9 19v-5h6v5"/></>}
    {kind === "leaf" && <><path d="M20 4C10 4 5 8 5 14a5 5 0 0 0 5 5c6 0 10-6 10-15Z"/><path d="M3 21c3-6 7-9 13-12"/></>}
    {kind === "food" && <><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c3 2 4 5 4 8h-4"/></>}
  </svg>;
}

export default function RevantMegaShortcuts() {
  return <section aria-label="Explorer Revant Mega" className="px-2 pb-2 pt-5 sm:px-4 sm:pt-7">
    <div className="mb-3 flex items-center justify-between px-2">
      <h2 className="text-base font-extrabold sm:text-lg">Explorer Revant Mega</h2>
      <Link href="/boutiques" className="text-xs font-semibold text-[#803e2f] underline-offset-4 hover:underline">Tout explorer →</Link>
    </div>
    <div className="flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {shortcuts.map((item) => <Link key={item.label} href={item.href} className="group flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#803e2f] sm:w-[92px]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-[#3e3d38] shadow-sm transition group-hover:border-[#803e2f] group-hover:bg-[#803e2f] group-hover:text-white group-active:scale-95 sm:h-16 sm:w-16"><ShortcutIcon kind={item.icon}/></span>
        <span className="text-[11px] font-semibold leading-tight text-neutral-800 sm:text-xs">{item.label}</span>
      </Link>)}
    </div>
  </section>;
}
