"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Search, Sparkles, Store, UtensilsCrossed } from "lucide-react";

export type PublicShopCard = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  description: string | null;
  typeLabel: string;
  isRestaurant: boolean;
  isPremium: boolean;
  bannerUrl: string | null;
  logoUrl: string | null;
  color: string;
};

type Filter = "all" | "shops" | "restaurants" | "premium";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "shops", label: "Boutiques" },
  { value: "restaurants", label: "Restaurants" },
  { value: "premium", label: "Premium" },
];

export default function ShopDirectory({ shops }: { shops: PublicShopCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => ({
    all: shops.length,
    shops: shops.filter((shop) => !shop.isRestaurant).length,
    restaurants: shops.filter((shop) => shop.isRestaurant).length,
    premium: shops.filter((shop) => shop.isPremium).length,
  }), [shops]);

  const visibleShops = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return shops.filter((shop) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "shops" && !shop.isRestaurant) ||
        (filter === "restaurants" && shop.isRestaurant) ||
        (filter === "premium" && shop.isPremium);

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [shop.name, shop.city, shop.typeLabel, shop.description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr");
      return searchable.includes(normalizedQuery);
    });
  }, [filter, query, shops]);

  return (
    <section aria-label="Annuaire des boutiques Revant">
      <div className="mb-5 rounded-[24px] border border-black/5 bg-white p-3 shadow-sm sm:p-4">
        <label htmlFor="shop-directory-search" className="sr-only">
          Rechercher une boutique, une ville ou un type de commerce
        </label>
        <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-neutral-200 bg-[#faf9f7] px-3 focus-within:border-[var(--brand-accent)] focus-within:ring-2 focus-within:ring-[var(--brand-accent)]/15">
          <Search className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden="true" />
          <input
            id="shop-directory-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, ville ou type de boutique…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-brand-text outline-none placeholder:text-neutral-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full px-2 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]"
            >
              Effacer
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filtrer les boutiques">
          {FILTERS.map((item) => {
            const active = filter === item.value;
            const count = counts[item.value];
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.value)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] ${active
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"}`}
              >
                {item.value === "shops" && <Store className="h-3.5 w-3.5" aria-hidden="true" />}
                {item.value === "restaurants" && <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />}
                {item.value === "premium" && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                {item.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-neutral-500" aria-live="polite">
          {visibleShops.length} résultat{visibleShops.length > 1 ? "s" : ""}
          {query.trim() ? ` pour « ${query.trim()} »` : ""}
        </p>
      </div>

      {visibleShops.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {visibleShops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shop/${encodeURIComponent(shop.slug)}`}
              aria-label={`Ouvrir la boutique ${shop.name}`}
              className="group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-accent)]"
            >
              <div className="relative h-36 overflow-hidden sm:h-40" style={{ backgroundColor: shop.color }}>
                {shop.bannerUrl ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.28), transparent 65%), url("${shop.bannerUrl}")` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/30">
                    {shop.name.slice(0, 1).toLocaleUpperCase("fr")}
                  </div>
                )}
                {shop.isPremium && (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold text-amber-900">
                    PREMIUM
                  </span>
                )}
              </div>

              <div className="relative px-4 pb-5 pt-11">
                <div
                  aria-hidden="true"
                  className="absolute -top-9 left-4 flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-2xl font-black text-white shadow-md"
                  style={{
                    backgroundColor: shop.color,
                    backgroundImage: shop.logoUrl ? `url("${shop.logoUrl}")` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!shop.logoUrl && shop.name.slice(0, 1).toLocaleUpperCase("fr")}
                </div>

                <div className="flex min-w-0 items-start justify-between gap-2">
                  <h2 className="line-clamp-1 text-base font-black tracking-tight text-brand-text">
                    {shop.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600">
                    {shop.typeLabel}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {shop.city ?? "Lieu non renseigné"}
                </p>
                {shop.description && (
                  <p className="mt-3 line-clamp-2 min-h-9 text-xs leading-relaxed text-neutral-600">
                    {shop.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="text-[11px] font-semibold text-neutral-500">Voir la vitrine</span>
                  <span aria-hidden="true" className="text-sm font-black transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-neutral-300 bg-white px-5 py-12 text-center">
          <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg text-2xl">⌕</div>
          <h2 className="mt-4 text-base font-extrabold">Aucune boutique ne correspond</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
            Essaie un autre nom, une autre ville ou un autre filtre.
          </p>
          <button
            type="button"
            onClick={() => { setQuery(""); setFilter("all"); }}
            className="mt-5 rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            Réinitialiser la recherche
          </button>
        </div>
      )}
    </section>
  );
}
