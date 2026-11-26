import Link from "next/link";
import { ChevronRight, Moon, Palette, Sparkles } from "lucide-react";
import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

const ITEMS = [
  { href: "/parametres/apparence/theme", title: "Thème et luminosité", description: "Automatique, clair ou sombre", Icon: Moon },
  { href: "/parametres/apparence/liquid-glass", title: "Effet Liquid Glass", description: "Régler la transparence et le flou des surfaces de paramètres", Icon: Sparkles },
  { href: "/parametres/apparence/identite-visuelle", title: "Identité visuelle", description: "Consulter la palette officielle Tangerine électrique de Revant", Icon: Palette },
];

export default function ApparenceSettingsPage() {
  return <SettingsFeaturePage title="Apparence" description="Chaque réglage visuel dispose de sa propre page. Choisis ce que tu souhaites personnaliser.">
    <div className="divide-y divide-brand-border">
      {ITEMS.map(({ href, title, description, Icon }) => <Link key={href} href={href} className="flex min-h-[72px] items-center gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent"><Icon size={19} /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block text-xs text-brand-muted">{description}</span></span>
        <ChevronRight size={17} className="text-brand-muted" />
      </Link>)}
    </div>
  </SettingsFeaturePage>;
}
