import SettingsFeatureControl from "@/components/layout/SettingsFeatureControl";
import SettingsFeaturePage from "@/components/layout/SettingsFeaturePage";

export default function MotionSettingsPage() {
  return <SettingsFeaturePage title="Animations" description="Choisis le niveau de mouvement et de réactivité des transitions de Revant.">
    <SettingsFeatureControl setting="motion" />
  </SettingsFeaturePage>;
}
