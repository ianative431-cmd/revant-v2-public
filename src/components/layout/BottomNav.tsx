import Link from "next/link";

function Icon({ name }: { name: "home" | "grid" | "message" | "cart" | "user" }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, className: "h-[19px] w-[19px]", "aria-hidden": true as const };
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 9v11h13V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === "grid") return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></svg>;
  if (name === "message") return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3.7-.8L4 20l1.3-3.8A7 7 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === "cart") return <svg {...common}><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1.2-3.4 3.6-5.2 7-5.2s5.8 1.8 7 5.2" strokeLinecap="round"/></svg>;
}

export default function BottomNav() {
  const items = [
    { href: "/", label: "Accueil", icon: "home" as const },
    { href: "/#categories", label: "Catégorie", icon: "grid" as const },
    { href: "/messages", label: "Message", icon: "message" as const },
    { href: "/panier", label: "Panier", icon: "cart" as const },
    { href: "/compte", label: "Mon Revant", icon: "user" as const },
  ];
  return <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-5xl items-center justify-around border-t border-white/10 bg-[#171715]/95 px-1 pb-[env(safe-area-inset-bottom,0px)] pt-1 text-white shadow-[0_-4px_18px_rgba(0,0,0,0.12)] backdrop-blur-md">
    {items.map((item) => <Link key={item.label} href={item.href} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/75 transition-colors hover:text-[#76b56a] focus-visible:text-[#76b56a]">
      <Icon name={item.icon}/><span className="text-[10px] font-medium leading-4">{item.label}</span>
    </Link>)}
  </nav>;
}
