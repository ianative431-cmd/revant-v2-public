import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

const VALUES = [
  { label: "Langue de l’interface", value: "Français" },
  { label: "Pays de référence", value: "Niger" },
  { label: "Devise", value: "Franc CFA (XOF)" },
];

export default function LanguageRegionSettingsPage() {
  return <SettingsFeaturePage title="Langue et région" description="Consulte les paramètres régionaux actuellement utilisés par Revant.">
    <div className="space-y-3">
      {VALUES.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-brand-border p-3">
        <span className="text-xs text-brand-muted">{item.label}</span><span className="text-sm font-semibold text-right">{item.value}</span>
      </div>)}
      <p className="pt-1 text-xs leading-relaxed text-brand-muted">Le changement de langue, de pays et de devise n’est pas encore activé. Ces valeurs restent informatives pour éviter de modifier les prix ou les transactions sans prise en charge complète.</p>
    </div>
  </SettingsFeaturePage>;
}
