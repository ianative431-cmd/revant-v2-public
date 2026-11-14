import Link from "next/link";
import type { ReactNode } from "react";
import {
  Accessibility,
  Bell,
  ChevronRight,
  Globe,
  Headset,
  History,
  Palette,
  ReceiptText,
  Scale,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import PaletteSwitcher from "@/components/layout/PaletteSwitcher";
import SiteHeader from "@/components/layout/SiteHeader";
import SettingsSearch from "@/components/layout/SettingsSearch";
import { SITE_PALETTES } from "@/content/theme/site-palette";
import { getSitePalette } from "@/server/theme/site-palette";

type SettingsItem = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  color: string;
};

const GROUPS: { title: string; items: SettingsItem[] }[] = [
  {
    title: "Compte et sécurité",
    items: [
      { href: "/compte", label: "Mon compte", description: "Tes informations personnelles et ton profil", Icon: UserRound, color: "#F46A18" },
      { href: "#securite", label: "Sécurité et confidentialité", description: "Accès au compte et protection des données", Icon: ShieldCheck, color: "#57707A" },
      { href: "/compte/notifications", label: "Notifications", description: "Commandes, paiements et informations Revant", Icon: Bell, color: "#E6A23C" },
      { href: "#langue-region", label: "Langue et région", description: "Français · Niger · XOF", Icon: Globe, color: "#57707A" },
    ],
  },
  {
    title: "Activité",
    items: [
      { href: "/compte/historique", label: "Historique", description: "Achats, ventes et livraisons selon ton rôle", Icon: History, color: "#F46A18" },
      { href: "/compte/recus", label: "Mes reçus", description: "Consulter les reçus des commandes livrées", Icon: ReceiptText, color: "#E6A23C" },
    ],
  },
  {
    title: "Préférences",
    items: [
      { href: "#apparence", label: "Apparence", description: "Choisir le thème de Revant", Icon: Palette, color: "#989DAA" },
      { href: "#accessibilite", label: "Accessibilité", description: "Navigation et animations adaptées", Icon: Accessibility, color: "#57707A" },
    ],
  },
  {
    title: "Assistance et informations",
    items: [
      { href: "#aide", label: "Aide et assistance", description: "Messagerie et ressources utiles", Icon: Headset, color: "#F46A18" },
      { href: "/legal", label: "Informations légales", description: "Conditions, confidentialité et documents Revant", Icon: Scale, color: "#989DAA" },
    ],
  },
];

function SettingsRow({ item }: { item: SettingsItem }) {
  const Icon = item.Icon;
  return (
    <Link href={item.href} className="revant-settings-row flex min-h-[76px] items-center gap-3 px-4 py-3 transition hover:bg-brand-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-accent sm:px-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ color: item.color, backgroundColor: `${item.color}16` }}>
        <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-text">{item.label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-brand-muted">{item.description}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-brand-muted" aria-hidden="true" />
    </Link>
  );
}

function SettingsInfoCard({ children, id }: { children: ReactNode; id: string }) {
  return <section id={id} className="scroll-mt-24 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6">{children}</section>;
}

export default async function ParametresPage() {
  const palette = await getSitePalette();

  const searchEntries = GROUPS.flatMap((group) =>
    group.items.map(({ href, label, description }) => ({
      href,
      label,
      description,
      group: group.title,
    })),
  );

  return (
    <div className="min-h-screen bg-brand-bg pb-28 text-brand-text">
      <SiteHeader hideSearch />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <header className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">REVANT</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Paramètres</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Retrouve ton compte, ton activité et les préférences de ton application.</p>
        </header>

        <SettingsSearch entries={searchEntries} />

        <div className="space-y-6">
          {GROUPS.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-muted">{group.title}</h2>
              <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
                {group.items.map((item, index) => (
                  <div key={item.label}>
                    {index > 0 && <div className="mx-4 border-t border-brand-border sm:mx-5" />}
                    <SettingsRow item={item} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <SettingsInfoCard id="securite">
            <h2 className="text-base font-bold">Sécurité et confidentialité</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">Garde l’accès à ton compte sous contrôle et consulte les informations relatives à tes données.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/mot-de-passe-oublie" className="rounded-full border border-brand-border px-4 py-2.5 text-xs font-semibold text-brand-text transition hover:border-brand-accent hover:text-brand-accent">Réinitialiser mon mot de passe</Link>
              <Link href="/legal" className="rounded-full border border-brand-border px-4 py-2.5 text-xs font-semibold text-brand-text transition hover:border-brand-accent hover:text-brand-accent">Confidentialité et données</Link>
            </div>
          </SettingsInfoCard>

          <SettingsInfoCard id="langue-region">
            <h2 className="text-base font-bold">Langue et région</h2>
            <p className="mt-1 text-sm text-brand-muted">Configuration régionale actuelle de Revant.</p>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-brand-bg p-3"><dt className="text-xs text-brand-muted">Langue</dt><dd className="mt-1 text-sm font-semibold">Français</dd></div>
              <div className="rounded-xl bg-brand-bg p-3"><dt className="text-xs text-brand-muted">Région</dt><dd className="mt-1 text-sm font-semibold">Niger</dd></div>
              <div className="rounded-xl bg-brand-bg p-3"><dt className="text-xs text-brand-muted">Devise</dt><dd className="mt-1 text-sm font-semibold">FCFA (XOF)</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-brand-muted">La sélection d’autres langues ou régions n’est pas encore activée dans l’application.</p>
          </SettingsInfoCard>

          <SettingsInfoCard id="apparence">
            <h2 className="text-base font-bold">Apparence</h2>
            <p className="mt-1 text-sm text-brand-muted">Choisis le thème visuel de Revant.</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-medium">{SITE_PALETTES[palette].label}</span>
              <PaletteSwitcher current={palette} />
            </div>
          </SettingsInfoCard>

          <SettingsInfoCard id="accessibilite">
            <h2 className="text-base font-bold">Accessibilité</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">Revant respecte le réglage de réduction des animations de ton appareil. Les commandes conservent un contour visible lors de la navigation au clavier.</p>
          </SettingsInfoCard>

          <SettingsInfoCard id="aide">
            <h2 className="text-base font-bold">Aide et assistance</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">Retrouve tes échanges dans la messagerie et consulte tes commandes pour suivre leur avancement.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/messages" className="rounded-full bg-brand-accent px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--brand-accent-hover)]">Ouvrir la messagerie</Link>
              <Link href="/compte/commandes" className="rounded-full border border-brand-border px-4 py-2.5 text-xs font-semibold text-brand-text transition hover:border-brand-accent hover:text-brand-accent">Voir mes commandes</Link>
            </div>
          </SettingsInfoCard>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
