export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="min-h-[65vh] bg-brand-bg px-4 py-6 text-brand-text sm:py-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center gap-3" role="status" aria-live="polite">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-accent/25 border-t-brand-accent" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Chargement de Revant…</span>
            <span className="mt-0.5 block text-xs text-brand-muted">La page arrive.</span>
          </span>
        </div>

        <div aria-hidden="true">
          <div className="mb-5 h-7 w-44 rounded-lg bg-brand-surface-soft revant-skeleton" />
          <div className="mb-7 h-4 w-64 max-w-full rounded bg-brand-surface-soft revant-skeleton" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3"
              >
                <div className="aspect-[4/3] rounded-xl bg-brand-surface-soft revant-skeleton" />
                <div className="mt-3 h-3 w-4/5 rounded bg-brand-surface-soft revant-skeleton" />
                <div className="mt-2 h-3 w-1/2 rounded bg-brand-surface-soft revant-skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
