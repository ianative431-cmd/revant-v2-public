import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import BottomNav from "@/components/layout/BottomNav";
import SiteHeader from "@/components/layout/SiteHeader";

export default function SettingsFeaturePage({ title, description, backHref = "/parametres", children }: {
  title: string; description: string; backHref?: string; children: ReactNode;
}) {
  return (
    <div className="revant-settings-page min-h-screen bg-brand-bg pb-32 text-brand-text">
      <SiteHeader hideSearch />
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-20 sm:px-6">
        <Link href={backHref} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-brand-muted transition-colors hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
          <ArrowLeft size={17} aria-hidden="true" /><span>Retour aux paramètres</span>
        </Link>
        <header className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">REVANT · PARAMÈTRES</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">{description}</p>
        </header>
        <section className="revant-settings-glass rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm sm:p-5">{children}</section>
      </main>
      <BottomNav />
    </div>
  );
}
