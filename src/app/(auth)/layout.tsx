export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-sm bg-[var(--brand-surface)] border border-[var(--brand-border)] text-brand-text rounded-[22px] p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
