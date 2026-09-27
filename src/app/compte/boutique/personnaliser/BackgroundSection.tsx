import Image from "next/image";
import type { Background, UserBackground } from "@/types/background";
import { officialBackgroundPublicUrl } from "@/lib/background-image";
import SelectBackgroundButton from "./SelectBackgroundButton";
import PersonalBackgroundManager from "./PersonalBackgroundManager";

export default function BackgroundSection({
  officialBackgrounds,
  personalBackgrounds,
  currentBackgroundId,
  currentPersonalBackgroundId,
  supabaseUrl,
}: {
  officialBackgrounds: Background[];
  personalBackgrounds: UserBackground[];
  currentBackgroundId: string | null;
  currentPersonalBackgroundId: string | null;
  supabaseUrl: string;
}) {
  const hasSelection = Boolean(currentBackgroundId || currentPersonalBackgroundId);

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold mb-1">Arrière-plan de la boutique</h2>
      <p className="text-xs text-black/60 mb-3">
        Choisi dans la bibliothèque Revant, ou l&apos;un de tes arrière-plans personnels.
      </p>

      {hasSelection && (
        <div className="mb-3">
          <SelectBackgroundButton
            kind="none"
            selected={false}
            label="Revenir à l'arrière-plan par défaut"
          />
        </div>
      )}

      {officialBackgrounds.length === 0 ? (
        <p className="text-xs text-black/40 mb-4">
          Aucun arrière-plan officiel pour l&apos;instant — l&apos;administration n&apos;en a pas
          encore ajouté.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {officialBackgrounds.map((bg) => (
            <div key={bg.id} className="rounded-xl overflow-hidden bg-white">
              <div className="relative aspect-video bg-black/5">
                <Image
                  src={officialBackgroundPublicUrl(supabaseUrl, bg.image_path)}
                  alt={bg.name}
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{bg.name}</p>
                <p className="text-[10px] text-black/50 mb-2">{bg.category}</p>
                <SelectBackgroundButton
                  kind="official"
                  backgroundId={bg.id}
                  selected={currentBackgroundId === bg.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <PersonalBackgroundManager
        backgrounds={personalBackgrounds}
        currentPersonalBackgroundId={currentPersonalBackgroundId}
        supabaseUrl={supabaseUrl}
      />
    </div>
  );
}
