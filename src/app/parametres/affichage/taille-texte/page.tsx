import SettingsFeatureControl from "@/components/layout/SettingsFeatureControl";
import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

export default function TextSizeSettingsPage() {
  return <SettingsFeaturePage title="Taille du texte" description="Ajuste la lisibilité de l’interface selon ton confort.">
    <SettingsFeatureControl setting="text" />
  </SettingsFeaturePage>;
}
