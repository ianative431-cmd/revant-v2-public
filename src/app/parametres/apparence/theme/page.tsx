import DisplayModeSwitcher from "@/components/layout/DisplayModeSwitcher";
import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";
import { getDisplayMode } from "@/server/theme/display-mode";

export default async function ThemeSettingsPage() {
  const currentMode = await getDisplayMode();
  return <SettingsFeaturePage title="Thème et luminosité" description="Choisis comment Revant adapte son apparence à tes préférences.">
    <fieldset>
      <legend className="text-sm font-semibold">Mode d’affichage</legend>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted">Le mode Système suit automatiquement le réglage de ton appareil. Clair et Sombre permettent de choisir manuellement.</p>
      <div className="mt-4"><DisplayModeSwitcher current={currentMode} /></div>
    </fieldset>
  </SettingsFeaturePage>;
}
