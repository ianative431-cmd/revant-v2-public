"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImageKeepingAspect } from "@/lib/image";

type MediaKind = "logo" | "banner";
type Props = {
  shopId: string;
  userId: string;
  logoUrl: string | null;
  bannerUrl: string | null;
};

const MAX_BYTES = 25 * 1024 * 1024;

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
      setMessage("Choisis une image de moins de 25 Mo.");
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

      // L'ancien fichier n'est supprimé qu'après confirmation de la mise à jour en base.
      const oldPath = extractOwnedShopMediaPath(previousUrl, userId, shopId);
      if (oldPath && oldPath !== path) {
        await supabase.storage.from("shop-media").remove([oldPath]);
      }

      setMessage(kind === "logo" ? "Logo mis à jour." : "Bannière mise à jour.");
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
    <section className="mt-6 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--brand-accent)]">Vitrine publique</p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--brand-text)]">Identité visuelle de la boutique</h2>
        </div>
        <span className="rounded-full bg-[var(--brand-bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--brand-muted)]">Logo & bannière</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage image
            <img src={logoUrl} alt="Logo actuel" className="h-16 w-16 shrink-0 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] object-contain p-2" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-surface)] text-xs font-semibold text-[var(--brand-muted)]">Logo</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--brand-text)]">Logo</p>
            <p className="mb-2 text-xs leading-5 text-[var(--brand-muted)]">Carré recommandé · 25 Mo maximum</p>
            <label className="inline-flex cursor-pointer rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2 text-xs font-bold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]">
              {busy === "logo" ? "Envoi..." : "Ajouter / remplacer"}
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy !== null} onChange={onChange("logo")} />
            </label>
          </div>
        </div>
        <div className="grid min-w-0 gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3">
          <p className="text-sm font-bold text-[var(--brand-text)]">Bannière</p>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage image
            <img src={bannerUrl} alt="Bannière actuelle" className="aspect-[16/5] w-full rounded-xl border border-[var(--brand-border)] object-cover" />
          ) : (
            <div className="flex aspect-[16/5] w-full items-center justify-center rounded-xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-surface)] text-xs font-semibold text-[var(--brand-muted)]">Aucune bannière</div>
          )}
          <p className="text-xs leading-5 text-[var(--brand-muted)]">Format paysage recommandé · 25 Mo maximum</p>
          <label className="inline-flex w-fit cursor-pointer rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2 text-xs font-bold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]">
            {busy === "banner" ? "Envoi..." : "Ajouter / remplacer"}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy !== null} onChange={onChange("banner")} />
          </label>
        </div>
      </div>
      {message && <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-2.5 text-xs leading-5 text-[var(--brand-text)]">{message}</p>}
    </section>
  );
}
