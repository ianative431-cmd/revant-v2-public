"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImageKeepingAspect } from "@/lib/image";

type MediaKind = "logo" | "banner";

const BUCKET = "shop-media";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ShopMediaForm({
  shopId,
  ownerId,
  initialLogoUrl,
  initialBannerUrl,
}: {
  shopId: string;
  ownerId: string;
  initialLogoUrl: string | null;
  initialBannerUrl: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<MediaKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(kind: MediaKind, file: File | undefined, input: HTMLInputElement, uniqueId: string) {
    input.value = "";
    setError(null);
    setMessage(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Format refusé. Choisis une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("L’image doit peser 8 Mo maximum.");
      return;
    }

    setSaving(kind);
    const supabase = createSupabaseBrowserClient();
    let uploadedPath: string | null = null;
    try {
      const compressed = await compressImageKeepingAspect(file, kind === "logo" ? 900 : 1800, 0.84);
      uploadedPath = `${ownerId}/${shopId}/${kind}-${uniqueId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(uploadedPath, compressed, { contentType: "image/jpeg", upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath);
      const updateResult = kind === "logo"
        ? await supabase.from("shops").update({ logo_url: data.publicUrl }).eq("id", shopId).eq("owner_id", ownerId)
        : await supabase.from("shops").update({ banner_url: data.publicUrl }).eq("id", shopId).eq("owner_id", ownerId);
      if (updateResult.error) throw updateResult.error;

      setMessage(kind === "logo" ? "Logo mis à jour." : "Bannière mise à jour.");
      router.refresh();
    } catch {
      if (uploadedPath) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]).catch(() => undefined);
      }
      setError("L’envoi n’a pas abouti. Vérifie ta connexion et réessaie.");
    } finally {
      setSaving(null);
    }
  }

  function onChange(kind: MediaKind) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.currentTarget.files?.[0];
      const input = event.currentTarget;
      const uniqueId = selected && typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${selected?.lastModified ?? 0}-${selected?.size ?? 0}`;
      void upload(kind, selected, input, uniqueId);
    };
  }

  return (
    <section className="mb-8 rounded-2xl border border-black/10 bg-white p-4">
      <h2 className="text-sm font-semibold">Logo et bannière</h2>
      <p className="mt-1 text-xs text-black/55">
        Ajoute les visuels qui apparaîtront sur la vitrine publique de ta boutique.
      </p>

      <div className="mt-4 grid gap-4">
        <div>
          <p className="mb-2 text-xs font-medium">Logo de la boutique</p>
          {initialLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une URL publique Supabase
            <img src={initialLogoUrl} alt="Logo actuel de la boutique" className="mb-2 h-20 w-20 rounded-xl border object-cover" />
          ) : (
            <div className="mb-2 grid h-20 w-20 place-items-center rounded-xl bg-neutral-100 text-xs text-neutral-400">Aucun logo</div>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-full border px-4 py-2 text-xs font-medium">
            {saving === "logo" ? "Envoi..." : "Choisir un logo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving !== null} onChange={onChange("logo")} className="sr-only" />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium">Bannière de la boutique</p>
          {initialBannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une URL publique Supabase
            <img src={initialBannerUrl} alt="Bannière actuelle de la boutique" className="mb-2 aspect-[16/6] w-full rounded-xl border object-cover" />
          ) : (
            <div className="mb-2 grid aspect-[16/6] w-full place-items-center rounded-xl bg-neutral-100 text-xs text-neutral-400">Aucune bannière</div>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-full border px-4 py-2 text-xs font-medium">
            {saving === "banner" ? "Envoi..." : "Choisir une bannière"}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving !== null} onChange={onChange("banner")} className="sr-only" />
          </label>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
      {message && <p role="status" className="mt-3 text-xs text-green-700">{message}</p>}
      <p className="mt-3 text-[11px] text-black/45">JPEG, PNG ou WebP · 8 Mo maximum avant optimisation.</p>
    </section>
  );
}
