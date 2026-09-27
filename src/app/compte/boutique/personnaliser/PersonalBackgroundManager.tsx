"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PERSONAL_BACKGROUND_BUCKET,
  BACKGROUND_IMAGE_ALLOWED_TYPES,
  BACKGROUND_IMAGE_MAX_BYTES,
  buildPersonalBackgroundPath,
  compressBackgroundImage,
  personalBackgroundPublicUrl,
} from "@/lib/background-image";
import { selectShopBackground } from "@/server/backgrounds/actions";
import type { UserBackground } from "@/types/background";

function ChooseButton({ backgroundId }: { backgroundId: string }) {
  const [state, formAction, pending] = useActionState(selectShopBackground, { error: null });
  return (
    <form action={formAction}>
      <input type="hidden" name="kind" value="personal" />
      <input type="hidden" name="backgroundId" value={backgroundId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[11px] bg-black text-white rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
      >
        {pending ? "..." : "Choisir"}
      </button>
      {state.error && <p className="text-red-600 text-[10px] mt-1">{state.error}</p>}
    </form>
  );
}

export default function PersonalBackgroundManager({
  backgrounds,
  currentPersonalBackgroundId,
  supabaseUrl,
}: {
  backgrounds: UserBackground[];
  currentPersonalBackgroundId: string | null;
  supabaseUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!BACKGROUND_IMAGE_ALLOWED_TYPES.includes(file.type)) {
      setError("Format non supporté (JPEG, PNG ou WebP attendus).");
      return;
    }
    if (file.size > BACKGROUND_IMAGE_MAX_BYTES) {
      setError("Image trop volumineuse (8 Mo maximum).");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expirée, reconnecte-toi.");
        return;
      }

      const compressed = await compressBackgroundImage(file);
      const path = buildPersonalBackgroundPath(user.id);

      const { error: uploadError } = await supabase.storage
        .from(PERSONAL_BACKGROUND_BUCKET)
        .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

      if (uploadError) {
        setError("Échec de l'envoi. Réessaie.");
        return;
      }

      const { error: insertError } = await supabase
        .from("user_backgrounds")
        .insert({ owner_id: user.id, name: "Arrière-plan personnel", image_path: path });

      if (insertError) {
        await supabase.storage.from(PERSONAL_BACKGROUND_BUCKET).remove([path]);
        setError("Impossible d'enregistrer l'arrière-plan.");
        return;
      }

      router.refresh();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(bg: UserBackground) {
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const { error: deleteError } = await supabase.from("user_backgrounds").delete().eq("id", bg.id);
    if (deleteError) {
      setError("Impossible de supprimer.");
      setBusy(false);
      return;
    }
    await supabase.storage.from(PERSONAL_BACKGROUND_BUCKET).remove([bg.image_path]);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <h3 className="text-xs font-semibold mb-2">Mes arrière-plans</h3>

      {backgrounds.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {backgrounds.map((bg) => (
            <div key={bg.id} className="rounded-xl overflow-hidden bg-white">
              <div className="relative aspect-video bg-black/5">
                <Image
                  src={personalBackgroundPublicUrl(supabaseUrl, bg.image_path)}
                  alt={bg.name}
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-2 flex items-center justify-between gap-2">
                {currentPersonalBackgroundId === bg.id ? (
                  <span className="text-[11px] text-black/50">Sélectionné</span>
                ) : (
                  <ChooseButton backgroundId={bg.id} />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(bg)}
                  className="text-[11px] text-red-600 underline disabled:opacity-50"
                >
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={(e) => handleUpload(e.target.files?.[0])}
        className="text-xs"
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
