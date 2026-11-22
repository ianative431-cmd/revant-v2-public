"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImageKeepingAspect } from "@/lib/image";
import { shouldDeleteShopMediaObject } from "@/lib/shop-media.mjs";

type MediaKind = "logo" | "banner";
type Props = {
  shopId: string;
  userId: string;
  logoUrl: string | null;
  bannerUrl: string | null;
};

const MAX_BYTES = 8 * 1024 * 1024;

function extractOwnedShopMediaPath(value: string | null, userId: string, shopId: string): string | null {
  if (!value) return null;
  try {
    const image = new URL(value);
    const configuredStorage = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredStorage) return null;
    const storage = new URL(configuredStorage);
    const marker = "/storage/v1/object/public/shop-media/";
    if (
      image.protocol !== "https:" ||
      image.origin !== storage.origin ||
      image.username ||
      image.password ||
      !image.pathname.startsWith(marker)
    ) return null;
    const path = decodeURIComponent(image.pathname.slice(marker.length));
    return path.startsWith(`${userId}/${shopId}/`) ? path : null;
  } catch {
    return null;
  }
}

function detectImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

function extensionFor(type: "image/jpeg" | "image/png" | "image/webp") {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}

export default function ShopMediaForm({ shopId, userId, logoUrl, bannerUrl }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<MediaKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(kind: MediaKind, file?: File) {
    if (!file) return;
    setMessage(null);

    if (file.size === 0 || file.size > MAX_BYTES) {
      setMessage("Choisis une image de moins de 8 Mo.");
      return;
    }

    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const actualType = detectImageType(bytes);
    if (!actualType || file.type !== actualType) {
      setMessage("Format non valide. Utilise une image JPEG, PNG ou WebP.");
      return;
    }

    setBusy(kind);

    // Les bannières sont des images larges : les réduire avant l’envoi
    // évite de transférer et d’afficher des fichiers inutilement lourds.
    // Les logos restent dans leur format d’origine pour préserver la transparence.
    let uploadFile = file;
    if (kind === "banner") {
      try {
        const compressed = await compressImageKeepingAspect(file, 1800, 0.82);
        const baseName = file.name.replace(/\.[^.]+$/, "") || "banner";
        uploadFile = new File([compressed], `${baseName}.jpg`, {
          type: "image/jpeg",
        });
      } catch {
        // En cas d’échec de compression, l’image originale reste utilisable.
      }
    }
    const uploadType = uploadFile === file ? actualType : "image/jpeg";

    try {
      const supabase = createSupabaseBrowserClient();
      // Chaque remplacement crée un objet immuable avec une URL propre.
      // Cela évite l'upsert, qui peut exiger une permission SELECT sur Storage.
      const path = userId + "/" + shopId + "/" + kind + "-" + crypto.randomUUID() + "." + extensionFor(uploadType);
      const { error: uploadError } = await supabase.storage
        .from("shop-media")
        .upload(path, uploadFile, { upsert: false, contentType: uploadType, cacheControl: "31536000",
        });

      if (uploadError) {
        setMessage("L'envoi a échoué. Vérifie ta connexion et réessaie.");
        return;
      }

      const { data } = supabase.storage.from("shop-media").getPublicUrl(path);
      const previousUrl = kind === "logo" ? logoUrl : bannerUrl;
      const update = kind === "logo" ? { logo_url: data.publicUrl } : { banner_url: data.publicUrl };
      const { data: savedShop, error: updateError } = await supabase
        .from("shops")
        .update(update)
        .eq("id", shopId)
        .eq("owner_id", userId)
        .select("id")
        .maybeSingle();

      if (updateError || !savedShop) {
        // Ne pas laisser le nouvel objet orphelin si la boutique n'a pas été mise à jour.
        await supabase.storage.from("shop-media").remove([path]);
        setMessage("Image envoyée, mais impossible de l'associer à la boutique. Réessaie.");
        return;
      }

      // Ne supprimer l'ancien objet qu'après avoir vérifié qu'aucun autre champ
      // (logo ou bannière) ne référence encore la même image.
      const oldPath = extractOwnedShopMediaPath(previousUrl, userId, shopId);
      let cleanupWarning = false;
      if (oldPath && oldPath !== path) {
        const { data: currentMedia, error: mediaReadError } = await supabase
          .from("shops")
          .select("logo_url, banner_url")
          .eq("id", shopId)
          .eq("owner_id", userId)
          .maybeSingle();

        if (mediaReadError || !currentMedia) {
          // En cas de doute, conserver le fichier plutôt que casser une image encore utilisée.
          cleanupWarning = true;
        } else {
          const stillReferenced = !shouldDeleteShopMediaObject(
            oldPath,
            [currentMedia.logo_url, currentMedia.banner_url],
            (url: string | null) => extractOwnedShopMediaPath(url, userId, shopId),
          );
          if (!stillReferenced) {
            const { error: removeError } = await supabase.storage.from("shop-media").remove([oldPath]);
            if (removeError) cleanupWarning = true;
          }
        }
      }

      setMessage(
        cleanupWarning
          ? "Image mise à jour. L'ancien fichier a été conservé car son nettoyage n'a pas pu être confirmé."
          : kind === "logo" ? "Logo mis à jour." : "Bannière mise à jour.",
      );
      router.refresh();
    } catch {
      setMessage("Une erreur est survenue pendant l'envoi.");
    } finally {
      setBusy(null);
    }
  }

  function onChange(kind: MediaKind) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      void upload(kind, event.currentTarget.files?.[0]);
      event.currentTarget.value = "";
    };
  }

  return (
    <section className="bg-white rounded-2xl p-4 mt-6">
      <h2 className="text-sm font-semibold mb-3">Identité visuelle de la boutique</h2>
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage image
            <img src={logoUrl} alt="Logo actuel" className="w-16 h-16 rounded-full object-cover border border-black/10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-xs text-black/40">Logo</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Logo</p>
            <p className="text-xs text-black/50 mb-2">Carré recommandé · 8 Mo maximum</p>
            <label className="inline-flex cursor-pointer rounded-full border px-3 py-2 text-xs">
              {busy === "logo" ? "Envoi..." : "Ajouter / remplacer"}
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy !== null} onChange={onChange("logo")} />
            </label>
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Bannière</p>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage image
            <img src={bannerUrl} alt="Bannière actuelle" className="w-full h-28 rounded-xl object-cover" />
          ) : (
            <div className="w-full h-28 rounded-xl bg-black/5 flex items-center justify-center text-xs text-black/40">Aucune bannière</div>
          )}
          <p className="text-xs text-black/50">Format paysage recommandé · 8 Mo maximum</p>
          <label className="inline-flex w-fit cursor-pointer rounded-full border px-3 py-2 text-xs">
            {busy === "banner" ? "Envoi..." : "Ajouter / remplacer"}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy !== null} onChange={onChange("banner")} />
          </label>
        </div>
      </div>
      {message && <p aria-live="polite" className="text-xs mt-3 text-black/70">{message}</p>}
    </section>
  );
}
