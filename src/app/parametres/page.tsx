import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell, ChevronRight, CircleHelp, LockKeyhole, ShieldCheck, UserRound,
  SlidersHorizontal, Globe2, FileText,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import SiteHeader from "@/components/layout/SiteHeader";
import SettingsExperienceControls from "@/components/layout/SettingsExperienceControls";
import { getSitePalette } from "@/server/theme/site-palette";

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">{title}</h2>
      <div className="divide-y divide-brand-border border-y border-brand-border">{children}</div>
    </section>
  );
}

function SettingsLink({ href, label, description, Icon }: { href: string; label: string; description?: string; Icon: LucideIcon }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 py-3 transition-colors hover:bg-brand-surface/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
      <Icon size={18} strokeWidth={1.8} className="shrink-0 text-brand-accent" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-brand-text">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-brand-muted">{description}</span>}
      </span>
      <ChevronRight size={16} className="shrink-0 text-brand-muted" aria-hidden="true" />
    </Link>
  );
}

export default async function ParametresPage() {
  const palette = await getSitePalette();

  return (
    <div className="min-h-screen bg-brand-bg pb-32 text-brand-text">
      <SiteHeader hideSearch />
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-20 sm:px-6">
        <header className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">REVANT</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Paramètres</h1>
        </header>

        <div className="space-y-7">
          <SettingsGroup title="Compte">
            <SettingsLink href="/compte" label="Mon compte" description="Photo, coordonnées et informations" Icon={UserRound} />
          </SettingsGroup>

          <SettingsGroup title="Sécurité">
            <SettingsLink href="/mot-de-passe-oublie" label="Mot de passe" description="Modifier ou récupérer l’accès" Icon={ShieldCheck} />
            <SettingsLink href="/compte/historique" label="Activité du compte" description="Achats, ventes et livraisons" Icon={LockKeyhole} />
          </SettingsGroup>

          <SettingsGroup title="Préférences">
            <details className="group py-3">
              <summary className="flex min-h-9 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal size={18} className="shrink-0 text-brand-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Affichage et accessibilité</span>
                  <span className="mt-0.5 block text-xs text-brand-muted">Thème, animations et taille du texte</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-brand-muted transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <div className="space-y-4 border-l border-brand-border py-4 pl-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">Apparence</p>
                  <SettingsExperienceControls mode="appearance" currentPalette={palette} />
                </div>
                <div className="border-t border-brand-border pt-4">
                  <SettingsExperienceControls mode="interactions" currentPalette={palette} />
                </div>
              </div>
            </details>
            <div className="flex min-h-14 items-center gap-3 py-3">
              <Globe2 size={18} className="shrink-0 text-brand-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Région actuelle</span>
                <span className="mt-0.5 block text-xs text-brand-muted">Français · Niger · XOF</span>
              </span>
            </div>
          </SettingsGroup>

          <SettingsGroup title="Notifications et confidentialité">
            <SettingsLink href="/compte/notifications" label="Notifications" description="Commandes, paiements, messages et alertes" Icon={Bell} />
            <SettingsLink href="/compte/blocages" label="Comptes bloqués" description="Gérer les personnes bloquées" Icon={LockKeyhole} />
          </SettingsGroup>

          <SettingsGroup title="Assistance et informations">
            <SettingsLink href="/messages" label="Contacter Revant" description="Assistance par messagerie" Icon={CircleHelp} />
            <SettingsLink href="/legal" label="Informations légales" description="Conditions, confidentialité et politiques" Icon={FileText} />
          </SettingsGroup>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
