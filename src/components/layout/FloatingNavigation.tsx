"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import PhotoActionMenu from "./PhotoActionMenu";

const iconProps = { size: 20, strokeWidth: 1.8, "aria-hidden": true as const };
const quickLinks = [
  { href: "/parametres", label: "Paramètres" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/boutiques/creer", label: "Vendre sur Revant" },
  { href: "/legal", label: "Centre juridique" },
];

export default function FloatingNavigation({
  hideSearch = false,
  allowAdd = false,
}: {
  hideSearch?: boolean;
  allowAdd?: boolean;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[70] h-11 px-3"
      aria-label="Commandes flottantes Revant"
    >
      {isHomePage && (
        <details className="pointer-events-auto absolute left-3 top-0 group">
          <summary
            aria-label="Ouvrir le menu principal"
            onClick={() => setSearchOpen(false)}
            className="flex h-11 w-11 list-none cursor-pointer items-center justify-center rounded-full border border-brand-border bg-brand-surface/95 text-brand-text shadow-lg backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent [&::-webkit-details-marker]:hidden"
          >
            <Menu {...iconProps} size={22} />
          </summary>
          <nav
            aria-label="Menu principal"
            className="absolute left-0 top-14 z-[71] w-64 rounded-2xl border border-brand-border bg-brand-surface p-2 text-sm text-brand-text shadow-2xl backdrop-blur-xl"
          >
            <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-brand-muted">
              Explorer Revant
            </p>
            {quickLinks.map((item) => (
              <a
                key={item.href + item.label}
                href={item.href}
                className="block rounded-xl px-3 py-3 font-medium hover:bg-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </details>
      )}

      {!hideSearch && (
        <>
          {!searchOpen && (
            <button
              type="button"
              aria-label="Afficher la recherche"
              aria-expanded={false}
              aria-controls="revant-global-search"
              onClick={() => setSearchOpen(true)}
              className="pointer-events-auto absolute right-3 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-brand-surface/95 text-brand-text shadow-lg backdrop-blur-xl transition hover:border-brand-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
            >
              <Search {...iconProps} size={21} />
            </button>
          )}

          {searchOpen && (
            <form
              id="revant-global-search"
              action="/#produits"
              method="get"
              role="search"
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
              className="pointer-events-auto absolute left-16 right-3 top-0 mx-auto flex h-11 w-auto max-w-[560px] items-center gap-2 rounded-full border border-brand-accent/50 bg-brand-surface/95 px-3 text-brand-text shadow-xl backdrop-blur-xl focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/20"
            >
              <button
                type="submit"
                aria-label="Lancer la recherche"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-bg hover:text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
              >
                <Search {...iconProps} size={19} />
              </button>
              <input
                ref={searchInputRef}
                name="q"
                aria-label="Rechercher des produits, boutiques et catégories"
                placeholder="Rechercher…"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-muted"
              />
              <PhotoActionMenu allowAdd={allowAdd} />
              <button
                type="button"
                aria-label="Fermer la recherche"
                onClick={() => setSearchOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-bg hover:text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
              >
                <X {...iconProps} size={18} />
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
