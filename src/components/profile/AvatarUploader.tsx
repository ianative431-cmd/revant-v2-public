"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_OUTPUT_SIZE,
  AVATAR_ALLOWED_TYPES,
  buildAvatarPath,
  extractAvatarPathFromPublicUrl,
  initialsFromUser,
} from "@/lib/avatar";

type Status =
  | "idle"
  | "cropping"
  | "uploading"
  | "success"
  | "error-type"
  | "error-size"
  | "error-network"
  | "error-offline"
  | "error-generic";

const ERROR_MESSAGES: Record<string, string> = {
  "error-type": "Ce fichier n'est pas une image valide (JPEG, PNG ou WebP attendus).",
  "error-size": "L'image dépasse la taille maximale autorisée (5 Mo).",
  "error-network": "Le téléversement a échoué. Vérifie ta connexion et réessaie.",
  "error-offline": "Tu es hors ligne. Reconnecte-toi pour changer ta photo.",
  "error-generic": "Une erreur est survenue. Réessaie dans un instant.",
};

export default function AvatarUploader({
  userId,
  initialAvatarUrl,
  email,
  phone,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [status, setStatus] = useState<Status>("idle");
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(file: File | undefined) {
    setMenuOpen(false);
    if (!file) return; // annulation ou permission refusée : pas de fausse erreur

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setStatus("error-type");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setStatus("error-size");
      return;
    }

    cropToSquare(file)
      .then((blob) => {
        setPendingBlob(blob);
        setPendingPreviewUrl(URL.createObjectURL(blob));
        setStatus("cropping");
      })
      .catch(() => setStatus("error-generic"));
  }

  function cancelCrop() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingBlob(null);
    setPendingPreviewUrl(null);
    setStatus("idle");
  }

  async function confirmCrop() {
    if (!pendingBlob) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("error-offline");
      return;
    }

    setStatus("uploading");
    const supabase = createSupabaseBrowserClient();
    const path = buildAvatarPath(userId);
    const previousUrl = avatarUrl;

    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, pendingBlob, { contentType: "image/jpeg", upsert: false });

      if (uploadError) {
        setStatus("error-network");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const newUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl },
      });
      if (updateError) {
        // Le fichier est bien uploadé mais la référence n'a pas pu être
        // enregistrée : on nettoie le fichier orphelin plutôt que de le
        // laisser traîner dans le stockage.
        await supabase.storage.from(AVATAR_BUCKET).remove([path]);
        setStatus("error-network");
        return;
      }

      // Mise à jour immédiate de l'interface, sans recharger la page.
      setAvatarUrl(newUrl);
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      setPendingBlob(null);
      setPendingPreviewUrl(null);
      setStatus("success");

      // Ancienne photo devenue inutile : suppression best-effort, une fois
      // la nouvelle confirmée en base (jamais avant, pour ne jamais rester
      // sans photo si une étape précédente avait échoué).
      const oldPath = previousUrl ? extractAvatarPathFromPublicUrl(previousUrl) : null;
      if (oldPath) {
        supabase.storage.from(AVATAR_BUCKET).remove([oldPath]).catch(() => {});
      }
    } catch {
      setStatus("error-network");
    }
  }

  async function deleteAvatar() {
    setConfirmDelete(false);
    if (!avatarUrl) return;
    setStatus("uploading");
    const supabase = createSupabaseBrowserClient();

    try {
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if (error) {
        setStatus("error-network");
        return;
      }
      const oldPath = extractAvatarPathFromPublicUrl(avatarUrl);
      if (oldPath) {
        supabase.storage.from(AVATAR_BUCKET).remove([oldPath]).catch(() => {});
      }
      setAvatarUrl(null);
      setStatus("idle");
    } catch {
      setStatus("error-network");
    }
  }

  const isBusy = status === "uploading";

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={isBusy}
          className="w-24 h-24 rounded-full overflow-hidden bg-black/10 flex items-center justify-center text-xl font-semibold text-black/70 border border-black/15 disabled:opacity-60"
          aria-label="Modifier la photo de profil"
        >
          {status === "cropping" && pendingPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingPreviewUrl} alt="" className="w-full h-full object-cover" />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Photo de profil" className="w-full h-full object-cover" />
          ) : (
            <span>{initialsFromUser(email, phone)}</span>
          )}
          {isBusy && (
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
              …
            </span>
          )}
        </button>

        {menuOpen && status !== "cropping" && (
          <div className="absolute z-10 top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-black/10 rounded-xl shadow-md text-sm overflow-hidden w-48">
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-black/[0.03]"
              onClick={() => galleryInputRef.current?.click()}
            >
              Choisir dans la galerie
            </button>
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-black/[0.03] border-t border-black/[0.06]"
              onClick={() => cameraInputRef.current?.click()}
            >
              Prendre une photo
            </button>
            {avatarUrl && (
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-black/[0.03] border-t border-black/[0.06] text-red-600"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
              >
                Supprimer la photo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Galerie : pas d'attribut capture, ouvre le sélecteur de fichiers normal */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFileSelected(e.target.files?.[0]);
          e.target.value = ""; // permet de resélectionner le même fichier plus tard
        }}
      />
      {/* Appareil photo : capture=environment ouvre directement la caméra */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFileSelected(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {status === "cropping" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancelCrop}
            className="px-4 py-2 rounded-full border border-black/15 text-sm font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmCrop}
            className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium"
          >
            Confirmer la photo
          </button>
        </div>
      )}

      {status === "success" && (
        <p className="text-xs text-green-700">Photo de profil mise à jour.</p>
      )}
      {status.startsWith("error-") && (
        <p className="text-xs text-red-600 text-center max-w-[220px]">
          {ERROR_MESSAGES[status]}
        </p>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-center">
            <p className="text-sm mb-4">Supprimer définitivement ta photo de profil ?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-full border border-black/15 text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={deleteAvatar}
                className="flex-1 py-2 rounded-full bg-red-600 text-white text-sm font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Recadrage carré centré + redimensionnement + compression, entièrement
 * côté navigateur (Canvas API native — aucune dépendance ajoutée).
 */
function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas indisponible"));

      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("compression échouée"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image invalide"));
    };
    img.src = objectUrl;
  });
}
