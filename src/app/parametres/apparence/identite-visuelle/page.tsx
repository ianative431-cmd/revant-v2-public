import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

const COLORS = [
  { name: "Orange Tangerine", hex: "#F46A18", role: "Accent principal" },
  { name: "Fond ivoire", hex: "#F8F5EF", role: "Fond clair" },
  { name: "Encre", hex: "#20252B", role: "Texte principal" },
  { name: "Ardoise", hex: "#142B45", role: "Éléments structurants" },
];

export default function BrandIdentitySettingsPage() {
  return <SettingsFeaturePage title="Identité visuelle" description="La palette officielle de Revant garantit une identité cohérente sur l’ensemble de la marketplace.">
    <div className="space-y-3">
      {COLORS.map((color) => <div key={color.hex} className="flex items-center gap-3 rounded-xl border border-brand-border p-3">
        <span className="h-10 w-10 shrink-0 rounded-xl border border-black/10" style={{ backgroundColor: color.hex }} />
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{color.name}</span><span className="block text-xs text-brand-muted">{color.role}</span></span>
        <span className="text-xs font-mono text-brand-muted">{color.hex}</span>
      </div>)}
      <p className="pt-2 text-xs leading-relaxed text-brand-muted">Cette identité est volontairement commune à tous les utilisateurs. Le thème Clair/Sombre adapte la luminosité sans remplacer les couleurs de marque.</p>
    </div>
  </SettingsFeaturePage>;
}
