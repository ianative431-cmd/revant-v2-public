import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bell, ChevronRight, Globe2, LockKeyhole, ShieldCheck, UserRound,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import SiteHeader from "@/components/layout/SiteHeader";
import SettingsExperienceControls from "@/components/layout/SettingsExperienceControls";
import { getSitePalette } from "@/server/theme/site-palette";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-muted">{title}</h2>
      <div className="revant-settings-glass overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm">{children}</div>
    </section>
  );
}

function SettingsLink({ href, label, description, Icon }: { href: string; label: string; description?: string; Icon: LucideIcon }) {
  return (
    <Link href={href} className="revant-settings-row flex min-h-[60px] items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-accent">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-text">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-brand-muted">{description}</span>}
      </span>
      <ChevronRight size={17} className="shrink-0 text-brand-muted" aria-hidden="true" />
    </Link>
  );
}

export default async function ParametresPage() {
  const palette = await getSitePalette();

  return (
    <div className="revant-settings-page min-h-screen bg-brand-bg pb-32 text-brand-text">
      <SiteHeader hideSearch />
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-20 sm:px-6">
        <header className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">REVANT</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Paramètres</h1>
          <p className="mt-1 text-sm text-brand-muted">Les réglages essentiels de votre compte et de votre application.</p>
        </header>

        <div className="space-y-5">
          <SettingsSection title="Sécurité">
            <SettingsLink href="/mot-de-passe-oublie" label="Mot de passe" description="Recevoir un lien de réinitialisation par e-mail" Icon={ShieldCheck} />
          </SettingsSection>

          <SettingsSection title="Préférences">
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Apparence</p>
                  <p className="mt-0.5 text-xs text-brand-muted">Choisissez le thème de Revant.</p>
                </div>
                <SettingsExperienceControls mode="appearance" currentPalette={palette} />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Notifications">
            <SettingsLink href="/compte/notifications" label="Centre de notifications" description="Commandes, paiements et messages" Icon={Bell} />
          </SettingsSection>

          <SettingsSection title="Confidentialité et région">
            <div className="divide-y divide-brand-border">
              <SettingsLink href="/compte/blocages" label="Comptes bloqués" Icon={LockKeyhole} />
              {process.env.ACCOUNT_DELETION_REQUESTS_ENABLED === "true" ? (
                <SettingsLink href="/compte/suppression" label="Suppression du compte" description="Consulter et gérer une demande de suppression" Icon={UserRound} />
              ) : (
                <div className="flex min-h-[60px] items-center gap-3 px-4 py-3" aria-disabled="true">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-muted"><UserRound size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-brand-text">Suppression du compte</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-brand-muted">Indisponible pour le moment · aucune donnée supprimée</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-brand-bg px-2.5 py-1 text-[10px] font-semibold text-brand-muted">Bientôt</span>
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent"><Globe2 size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Région</p>
                  <p className="mt-0.5 text-xs text-brand-muted">Français · Niger · XOF</p>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Assistance et informations">
            <div className="divide-y divide-brand-border">
              <Link href="/legal" className="flex min-h-[54px] items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-brand-text hover:bg-brand-bg">
                <span>Informations légales et confidentialité</span>
                <ChevronRight size={17} className="shrink-0 text-brand-muted" aria-hidden="true" />
              </Link>
            </div>
          </SettingsSection>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
