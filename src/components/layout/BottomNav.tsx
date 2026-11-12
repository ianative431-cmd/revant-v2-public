"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CategoryIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[18px] w-[18px]" aria-hidden="true"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><rect x="14" y="14" width="6.5" height="6.5" rx="1"/></svg>;
}
function MessageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 11h9M7.5 14.5h6" strokeLinecap="round"/></svg>;
}
function CartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9.5" cy="20" r="1"/><circle cx="17.5" cy="20" r="1"/></svg>;
}
function Item({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`revant-nav-item group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 ${active ? "is-active text-[var(--brand-accent)]" : "text-[var(--brand-muted)] hover:text-[var(--brand-text)]"}`}
    >
      <span className={`flex h-7 w-10 items-center justify-center rounded-full ${active ? "bg-[var(--brand-accent)]/10" : ""}`}>{icon}</span>
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
      <Item href="/" label="Accueil" active={pathname === "/"} icon={<HomeIcon/>}/>
      <Item href="/categories" label="Catégorie" active={pathname === "/categories"} icon={<CategoryIcon/>}/>
      <Item href="/messages" label="Message" active={pathname === "/messages" || pathname.startsWith("/messages/")} icon={<MessageIcon/>}/>
      <Item href="/panier" label="Panier" active={pathname === "/panier"} icon={<CartIcon/>}/>
      <Item href="/parametres" label="Paramètres" active={pathname === "/parametres" || pathname.startsWith("/parametres/") || pathname === "/compte" || pathname.startsWith("/compte/")} icon={<Settings size={20} strokeWidth={1.8} aria-hidden="true"/>}/>
    </nav>
  );
}
