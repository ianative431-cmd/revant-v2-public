"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MessageCircle, ShoppingCart, UserRound } from "lucide-react";

type NavIcon = React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;

function Item({ href, label, icon: Icon, active }: { href: string; label: string; icon: NavIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`revant-nav-item group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 py-1.5 transition-colors ${active ? "is-active text-[var(--brand-accent)]" : "text-[var(--brand-muted)] hover:text-[var(--brand-text)]"}`}
    >
      <span className="flex h-6 w-8 items-center justify-center rounded-full">
        <Icon size={18} strokeWidth={active ? 2 : 1.7} aria-hidden />
      </span>
      <span className={`whitespace-nowrap text-[9px] tracking-[.01em] sm:text-[10px] ${active ? "font-bold" : "font-medium"}`}>{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="revant-bottom-nav fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] z-50 mx-auto flex min-h-[62px] w-[calc(100%-48px)] max-w-[560px] items-center justify-around gap-0.5 rounded-full border border-[var(--brand-border)] bg-[var(--brand-nav)] px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,.16)] backdrop-blur-xl"
    >
      <Item href="/" label="Accueil" active={pathname === "/"} icon={Home}/>
      <Item href="/categories" label="Catégorie" active={pathname === "/categories"} icon={LayoutGrid}/>
      <Item href="/messages" label="Message" active={pathname === "/messages" || pathname.startsWith("/messages/")} icon={MessageCircle}/>
      <Item href="/panier" label="Panier" active={pathname === "/panier"} icon={ShoppingCart}/>
      <Item href="/compte" label="Mon Revante" active={pathname === "/compte" || pathname.startsWith("/compte/") || pathname === "/parametres" || pathname.startsWith("/parametres/") || pathname === "/wallet" || pathname.startsWith("/wallet/")} icon={UserRound}/>
    </nav>
  );
}
