import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Revant — accueil" className="mx-auto mb-4 block w-fit">
          <Image src="/images/logo-revant-app-512.png" alt="Logo Revant" width={56} height={56} priority className="h-12 w-12 object-contain" />
        </Link>
        <div className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] text-brand-text rounded-[22px] p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
