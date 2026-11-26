import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell, ChevronRight, CircleHelp, FileText, Globe2, Info,
  LockKeyhole, Palette, ShieldCheck, UserRound,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import SiteHeader from "@/components/layout/SiteHeader";
import SettingsSearch from "@/components/layout/SettingsSearch";

type SettingsItem = { href: string; label: string; description: string; Icon: LucideIcon };

const GROUPS: { title: string; id: string; items: SettingsItem[] }[] = [
  { title: "Mon compte", id: "mon-compte", items: [
    { href: "/compte", label: "Profil et coordonnées", description: "Photo, informations personnelles et coordonnées", Icon: UserRound },
  ]},
  { title: "Sécurité", id: "securite", items: [
    { href: "/mot-de-passe-oublie", label: "Mot de passe", description: "Modifier ou récupérer l’accès au compte", Icon: ShieldCheck },
    { href: "/compte/historique", label: "Activité du compte", description: "Consulter l’historique de tes opérations", Icon: LockKeyhole },
  ]},
  { title: "Notifications", id: "notifications", items: [
    { href: "/compte/notifications", label: "Centre de notifications", description: "Alertes de commandes, paiements, messages et livraisons", Icon: Bell },
  ]},
  { title: "Apparence", id: "apparence", items: [
    { href: "/parametres/apparence", label: "Personnaliser l’apparence", description: "Thème, luminosité, Liquid Glass et identité visuelle", Icon: Palette },
  ]},
  { title: "Affichage et interactions", id: "affichage-interactions", items: [
    { href: "/parametres/affichage", label: "Confort d’utilisation", description: "Animations et taille du texte", Icon: ChevronRight },
  ]},
  { title: "Langue et région", id: "langue-region", items: [
    { href: "/parametres/langue-region", label: "Préférences régionales", description: "Langue, pays et devise actuellement utilisés", Icon: Globe2 },
  ]},
  { title: "Confidentialité", id: "confidentialite", items: [
    { href: "/compte/blocages", label: "Comptes bloqués", description: "Gérer les comptes dont tu as limité les interactions", Icon: LockKeyhole },
    { href: "/compte/suppression", label: "Données et compte", description: "Consulter les options de gestion et de suppression du compte", Icon: FileText },
    { href: "/legal", label: "Politique de confidentialité", description: "Consulter les informations sur le traitement des données", Icon: ShieldCheck },
  ]},
  { title: "Aide et assistance", id: "aide-assistance", items: [
    { href: "/messages", label: "Contacter Revant", description: "Échanger avec l’équipe d’assistance", Icon: CircleHelp },
    { href: "/legal", label: "Centre juridique", description: "Conditions, politiques et documents officiels", Icon: FileText },
  ]},
  { title: "À propos de Revant", id: "a-propos", items: [
    { href: "/legal", label: "Informations sur Revant", description: "Identité du service et informations légales", Icon: Info },
  ]},
];

const FEATURE_SEARCH_ENTRIES = [
  { href: "/parametres/apparence/theme", label: "Thème et luminosité", description: "Automatique, clair ou sombre", group: "Apparence" },
  { href: "/parametres/apparence/liquid-glass", label: "Effet Liquid Glass", description: "Intensité de transparence et de flou", group: "Apparence" },
  { href: "/parametres/apparence/identite-visuelle", label: "Identité visuelle", description: "Palette officielle Tangerine électrique", group: "Apparence" },
  { href: "/parametres/affichage/animations", label: "Animations", description: "Transitions fluides ou réduites", group: "Affichage et interactions" },
  { href: "/parametres/affichage/taille-texte", label: "Taille du texte", description: "Taille standard ou agrandie", group: "Affichage et interactions" },
];

function SettingsGroup({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id + "-title"} className="scroll-mt-24 space-y-2">
      <h2 id={id + "-title"} className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">{title}</h2>
      <div className="revant-settings-glass overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm divide-y divide-brand-border">{children}</div>
    </section>
  );
}

function SettingsLink({ href, label, description, Icon }: SettingsItem) {
  return (
    <Link href={href} className="revant-settings-row flex min-h-[66px] items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-accent sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-text">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-brand-muted">{description}</span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-brand-muted" aria-hidden="true" />
    </Link>
  );
}

export default function ParametresPage() {
  const searchEntries = [
    ...GROUPS.flatMap((group) => group.items.map(({ href, label, description }) => ({ href, label, description, group: group.title }))),
    ...FEATURE_SEARCH_ENTRIES,
  ];

  return (
    <div className="revant-settings-page min-h-screen bg-brand-bg pb-32 text-brand-text">
      <SiteHeader hideSearch />
      <main className="mx-auto w-full max-w-3xl px-4 pb-8 pt-20 sm:px-6">
        <header className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">REVANT</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Centre de contrôle</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Gère ton compte et personnalise ton expérience Revant depuis un seul endroit.</p>
        </header>
        <SettingsSearch entries={searchEntries} />
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <SettingsGroup key={group.id} title={group.title} id={group.id}>
              {group.items.map((item) => <SettingsLink key={item.label} {...item} />)}
              {group.id === "securite" && <p className="px-4 py-3 text-xs leading-relaxed text-brand-muted sm:px-5">La gestion des appareils et la fermeture des sessions à distance nécessitent encore un service sécurisé dédié.</p>}
            </SettingsGroup>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
