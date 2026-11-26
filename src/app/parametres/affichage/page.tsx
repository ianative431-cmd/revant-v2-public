import Link from "next/link";
import { ChevronRight, Type, Zap } from "lucide-react";
import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

const ITEMS = [
  { href: "/parametres/affichage/animations", title: "Animations", description: "Vitesse des transitions et mouvements", Icon: Zap },
  { href: "/parametres/affichage/taille-texte", title: "Taille du texte", description: "Confort de lecture et taille générale", Icon: Type },
];

export default function DisplaySettingsPage() {
  return <SettingsFeaturePage title="Affichage et interactions" description="Personnalise le confort d’utilisation. Chaque préférence se règle sur sa propre page.">
    <div className="divide-y divide-brand-border">
      {ITEMS.map(({ href, title, description, Icon }) => <Link key={href} href={href} className="flex min-h-[72px] items-center gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent"><Icon size={19} /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block text-xs text-brand-muted">{description}</span></span>
        <ChevronRight size={17} className="text-brand-muted" />
      </Link>)}
    </div>
  </SettingsFeaturePage>;
}
