import SettingsFeatureControl from "@/components/layout/SettingsFeatureControl";
import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

export default function LiquidGlassSettingsPage() {
  return <SettingsFeaturePage title="Effet Liquid Glass" description="Ajuste l’intensité de l’effet sur les surfaces de paramètres compatibles.">
    <SettingsFeatureControl setting="glass" />
  </SettingsFeaturePage>;
}
