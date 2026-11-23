"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Search, Store, X } from "lucide-react";
import PhotoActionMenu from "./PhotoActionMenu";

const quickLinks = [
  { href: "/categories", label: "Catégories" },
  { href: "/boutiques", label: "Boutiques" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/boutiques/creer", label: "Vendre sur Revant" },
  { href: "/legal", label: "Centre juridique" },
];

export default function FloatingNavigation({ hideSearch = false, allowAdd = false }: { hideSearch?: boolean; allowAdd?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (searchOpen) searchInputRef.current?.focus(); }, [searchOpen]);

  return (
    <header className="revant-topbar">
      <div className="revant-topbar__inner">
        <Link href="/" aria-label="Revant — accueil" className="revant-brand-lockup">
          <Image src="/images/logo-revant-officiel-192.png" alt="" width={42} height={42} priority />
          <span><span className="revant-brand-lockup__word">revant</span><span className="revant-brand-lockup__tag">Le marché, autrement</span></span>
        </Link>
        <nav aria-label="Navigation du site" className="revant-topbar__links">
          <Link href="/">Accueil</Link><Link href="/categories">Catégories</Link><Link href="/boutiques">Boutiques</Link><Link href="/restaurants">Restaurants</Link><Link href="/boutiques/creer">Vendre</Link>
        </nav>
        <div className="revant-topbar__actions">
          {!hideSearch && <button type="button" aria-label={searchOpen ? "Fermer la recherche" : "Ouvrir la recherche"} aria-expanded={searchOpen} aria-controls="revant-global-search" onClick={() => setSearchOpen((open) => !open)} className="revant-topbar__icon">{searchOpen ? <X size={19} aria-hidden="true" /> : <Search size={19} aria-hidden="true" />}</button>}
          <Link href={allowAdd ? "/compte" : "/connexion"} className="revant-topbar__action revant-topbar__action--primary">{allowAdd ? "Mon espace" : "Connexion"} <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <details className="revant-mobile-menu relative">
            <summary aria-label="Ouvrir le menu" className="revant-topbar__icon list-none [&::-webkit-details-marker]:hidden"><Menu size={19} aria-hidden="true" /></summary>
            <nav aria-label="Menu mobile" className="absolute right-0 top-12 z-[80] w-64 rounded-2xl border border-brand-border bg-brand-surface p-2 text-sm text-brand-text shadow-2xl">
              <p className="px-3 pb-2 pt-3 text-[9px] font-black uppercase tracking-[.2em] text-brand-muted">Explorer Revant</p>
              {quickLinks.map((item) => <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-3 font-semibold hover:bg-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">{item.label}</Link>)}
              <Link href={allowAdd ? "/compte" : "/connexion"} className="mt-1 flex items-center justify-between rounded-xl bg-brand-accent px-3 py-3 font-extrabold text-white">{allowAdd ? "Mon espace" : "Connexion"}<Store size={16} aria-hidden="true" /></Link>
            </nav>
          </details>
        </div>
        {searchOpen && !hideSearch && <form id="revant-global-search" action="/" method="get" role="search" onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }} className="revant-topbar__search flex items-center gap-2"><Search size={17} className="shrink-0 text-brand-muted" aria-hidden="true" /><input ref={searchInputRef} name="q" aria-label="Rechercher des produits, boutiques et catégories" placeholder="Que recherchez-vous ?" /><PhotoActionMenu allowAdd={allowAdd} /><button type="submit" aria-label="Lancer la recherche" className="rounded-lg bg-brand-accent px-3 py-2 text-xs font-extrabold text-white">OK</button></form>}
      </div>
    </header>
  );
}
