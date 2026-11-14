"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type SettingsSearchEntry = {
  href: string;
  label: string;
  description: string;
  group: string;
};

export default function SettingsSearch({ entries }: { entries: SettingsSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return entries.filter((entry) =>
      `${entry.label} ${entry.description} ${entry.group}`.toLocaleLowerCase("fr").includes(normalizedQuery),
    );
  }, [entries, normalizedQuery]);

  return (
    <section className="mb-7" aria-label="Recherche dans les paramètres">
      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface px-4 shadow-sm focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/15">
        <Search size={19} className="shrink-0 text-brand-muted" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Rechercher un paramètre…"
          aria-label="Rechercher dans les paramètres"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-accent">
            Effacer
          </button>
        )}
      </label>
      {normalizedQuery && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface" aria-live="polite">
          {results.length ? results.map((entry) => (
            <Link key={entry.href + entry.label} href={entry.href} className="block border-b border-brand-border px-4 py-3 last:border-b-0 hover:bg-brand-bg">
              <span className="block text-sm font-semibold text-brand-text">{entry.label}</span>
              <span className="mt-1 block text-xs text-brand-muted">{entry.description}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-brand-accent">{entry.group}</span>
            </Link>
          )) : (
            <p className="px-4 py-4 text-sm text-brand-muted">Aucun paramètre ne correspond à « {query} ».</p>
          )}
        </div>
      )}
    </section>
  );
}
