import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bell, ChevronRight, CircleHelp, Globe2, Info, LockKeyhole,
  Palette, ShieldCheck, UserRound, Zap,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import SiteHeader from "@/components/layout/SiteHeader";
import SettingsSearch from "@/components/layout/SettingsSearch";
import SettingsExperienceControls from "@/components/layout/SettingsExperienceControls";
import { getSitePalette } from "@/server/theme/site-palette";

type SettingsItem = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
};

const GROUPS: { title: string; items: SettingsItem[] }[] = [
  { title: "Compte", items: [{ href: "/compte", label: "Mon compte", description: "Informations personnelles, coordonnées et profil", Icon: UserRound }] },
  { title: "Sécurité", items: [{ href: "#securite", label: "Sécurité et appareils", description: "Accès au compte, mot de passe et appareils", Icon: ShieldCheck }] },
  { title: "Notifications", items: [{ href: "/compte/notifications", label: "Centre de notifications", description: "Commandes, paiements, messages et alertes", Icon: Bell }] },
  { title: "Apparence", items: [{ href: "#apparence", label: "Thème et effets visuels", description: "Thème Revant et finition Liquid Glass", Icon: Palette }] },
  { title: "Affichage et interactions", items: [{ href: "#interactions", label: "Vitesse et affichage", description: "Réactivité, animations et confort de lecture", Icon: Zap }] },
  { title: "Langue et région", items: [{ href: "#langue-region", label: "Préférences régionales", description: "Langue, pays et devise", Icon: Globe2 }] },
  { title: "Confidentialité", items: [{ href: "#confidentialite", label: "Données et autorisations", description: "Visibilité, comptes bloqués et gestion des données", Icon: LockKeyhole }] },
  { title: "Aide et assistance", items: [{ href: "#aide", label: "Centre d'aide", description: "Messagerie et ressources utiles", Icon: CircleHelp }] },
  { title: "À propos de Revant", items: [{ href: "#apropos", label: "Informations sur Revant", description: "Identité du service et informations légales", Icon: Info }] },
];

function SettingsRow({ item }: { item: SettingsItem }) {
  const Icon = item.Icon;
  return (
    <Link href={item.href} className="revant-settings-row flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-accent sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-text">{item.label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-brand-muted">{item.description}</span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-brand-muted" aria-hidden="true" />
    </Link>
  );
}

function SettingsSection({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id + "-title"} className="scroll-mt-24">
      <h2 id={id + "-title"} className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-muted">{title}</h2>
      <div className="revant-settings-glass overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm">{children}</div>
    </section>
  );
}

export default async function ParametresPage() {
  const palette = await getSitePalette();
  const searchEntries = GROUPS.flatMap((group) => group.items.map(({ href, label, description }) => ({ href, label, description, group: group.title })));

  return (
    <div className="revant-settings-page min-h-screen bg-brand-bg pb-28 text-brand-text">
      <SiteHeader hideSearch />
      <main className="mx-auto w-full max-w-3xl px-4 pb-8 pt-20 sm:px-6">
        <header className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">REVANT</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Paramètres</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Gérez votre compte et votre expérience Revant.</p>
        </header>
        <SettingsSearch entries={searchEntries} />
        <div className="space-y-5">
          <SettingsSection title="Mon compte" id="compte"><SettingsRow item={GROUPS[0].items[0]} /></SettingsSection>
          <SettingsSection title="Sécurité" id="securite">
            <SettingsRow item={GROUPS[1].items[0]} />
            <div className="border-t border-brand-border px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold">Protéger l'accès au compte</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">Utilisez la récupération officielle du mot de passe. La liste des sessions et la fermeture à distance seront proposées lorsqu'un contrôle de sessions sécurisé sera disponible.</p>
              <Link href="/mot-de-passe-oublie" className="mt-3 inline-flex min-h-10 items-center rounded-full border border-brand-border px-4 text-xs font-semibold text-brand-text hover:border-brand-accent hover:text-brand-accent">Réinitialiser mon mot de passe</Link>
            </div>
          </SettingsSection>
          <SettingsSection title="Notifications" id="notifications"><SettingsRow item={GROUPS[2].items[0]} /></SettingsSection>
          <SettingsSection title="Apparence" id="apparence">
            <SettingsRow item={GROUPS[3].items[0]} />
            <SettingsExperienceControls mode="appearance" currentPalette={palette} />
          </SettingsSection>
          <SettingsSection title="Affichage et interactions" id="interactions">
            <SettingsRow item={GROUPS[4].items[0]} />
            <SettingsExperienceControls mode="interactions" currentPalette={palette} />
          </SettingsSection>
          <SettingsSection title="Langue et région" id="langue-region">
            <SettingsRow item={GROUPS[5].items[0]} />
            <div className="grid grid-cols-3 gap-2 border-t border-brand-border p-4 sm:p-5">
              <div className="rounded-xl bg-brand-bg p-3"><p className="text-[10px] text-brand-muted">Langue</p><p className="mt-1 text-sm font-semibold">Français</p></div>
              <div className="rounded-xl bg-brand-bg p-3"><p className="text-[10px] text-brand-muted">Pays</p><p className="mt-1 text-sm font-semibold">Niger</p></div>
              <div className="rounded-xl bg-brand-bg p-3"><p className="text-[10px] text-brand-muted">Devise</p><p className="mt-1 text-sm font-semibold">XOF</p></div>
            </div>
            <p className="px-4 pb-4 text-xs text-brand-muted sm:px-5">Les autres langues, pays et devises ne sont pas encore activés.</p>
          </SettingsSection>
          <SettingsSection title="Confidentialité" id="confidentialite">
            <SettingsRow item={GROUPS[6].items[0]} />
            <div className="flex flex-wrap gap-2 border-t border-brand-border p-4 sm:px-5">
              <Link href="/compte/blocages" className="inline-flex min-h-10 items-center rounded-full border border-brand-border px-4 text-xs font-semibold hover:border-brand-accent">Comptes bloqués</Link>
              <Link href="/compte/suppression" className="inline-flex min-h-10 items-center rounded-full border border-brand-border px-4 text-xs font-semibold hover:border-brand-accent">Gestion et suppression du compte</Link>
              <Link href="/legal" className="inline-flex min-h-10 items-center rounded-full border border-brand-border px-4 text-xs font-semibold hover:border-brand-accent">Politique de confidentialité</Link>
            </div>
          </SettingsSection>
          <SettingsSection title="Aide et assistance" id="aide">
            <SettingsRow item={GROUPS[7].items[0]} />
            <div className="border-t border-brand-border p-4 sm:px-5"><Link href="/messages" className="inline-flex min-h-10 items-center rounded-full bg-brand-accent px-4 text-xs font-bold text-white hover:bg-brand-accent-hover">Ouvrir la messagerie</Link></div>
          </SettingsSection>
          <SettingsSection title="À propos de Revant" id="apropos">
            <SettingsRow item={GROUPS[8].items[0]} />
            <div className="border-t border-brand-border p-4 sm:px-5">
              <p className="text-sm font-semibold">Revant — seconde vie, nouvelle valeur</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">Marketplace conçue pour rapprocher acheteurs, boutiques et services de livraison.</p>
              <Link href="/legal" className="mt-3 inline-flex min-h-10 items-center rounded-full border border-brand-border px-4 text-xs font-semibold hover:border-brand-accent">Consulter les informations légales</Link>
            </div>
          </SettingsSection>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
