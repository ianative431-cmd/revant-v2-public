"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MessageCircle, ShoppingCart, Settings } from "lucide-react";

type NavIcon = React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;

function Item({ href, label, icon: Icon, active }: { href: string; label: string; icon: NavIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`revant-nav-item group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 ${active ? "is-active text-[var(--brand-accent)]" : "text-[var(--brand-muted)] hover:text-[var(--brand-text)]"}`}
    >
      <span className={`flex h-7 w-10 items-center justify-center rounded-full ${active ? "bg-[var(--brand-accent)]/10" : ""}`}>
        <Icon size={20} strokeWidth={1.65} aria-hidden />
      </span>
      <span className={`whitespace-nowrap text-[9px] tracking-[.01em] sm:text-[10px] ${active ? "font-extrabold" : "font-medium"}`}>{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-2 z-50 mx-auto flex w-[calc(100%-16px)] max-w-lg items-stretch justify-around gap-1 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-nav)] px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1 shadow-[0_8px_30px_rgba(0,0,0,.16)] backdrop-blur-md"
    >
      <Item href="/" label="Accueil" active={pathname === "/"} icon={Home}/>
      <Item href="/categories" label="Catégorie" active={pathname === "/categories"} icon={LayoutGrid}/>
      <Item href="/messages" label="Message" active={pathname === "/messages" || pathname.startsWith("/messages/")} icon={MessageCircle}/>
      <Item href="/panier" label="Panier" active={pathname === "/panier"} icon={ShoppingCart}/>
      <Item href="/parametres" label="Paramètres" active={pathname === "/parametres" || pathname.startsWith("/parametres/") || pathname === "/compte" || pathname.startsWith("/compte/")} icon={Settings}/>
    </nav>
  );
}
