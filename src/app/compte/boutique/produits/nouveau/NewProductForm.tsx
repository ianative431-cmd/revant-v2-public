"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_BUCKET,
  buildProductImagePath,
  compressProductImage,
} from "@/lib/product-image";
import { PRODUCT_CATEGORIES } from "@/content/products/categories";

type Status =
  | "idle"
  | "submitting"
  | "error-type"
  | "error-size"
  | "error-network"
  | "error-offline"
  | "error-generic"
  | "error-validation";

const ERROR_MESSAGES: Record<string, string> = {
  "error-type": "Cette image n'est pas valide (JPEG, PNG ou WebP attendus).",
  "error-size": "L'image dépasse la taille maximale autorisée (8 Mo).",
  "error-network": "L'envoi a échoué. Vérifie ta connexion et réessaie.",
  "error-offline": "Tu es hors ligne. Reconnecte-toi pour publier ton annonce.",
  "error-generic": "Une erreur est survenue. Réessaie dans un instant.",
  "error-validation": "Vérifie le titre, le prix et la photo avant de publier.",
};

export default function NewProductForm({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  function handleFileSelected(selected: File | undefined) {
    if (!selected) return;

    if (!PRODUCT_IMAGE_ALLOWED_TYPES.includes(selected.type)) {
      setStatus("error-type");
      return;
    }
    if (selected.size > PRODUCT_IMAGE_MAX_BYTES) {
      setStatus("error-size");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "").trim();
    const category = String(formData.get("category") ?? "");
    const price = Number(priceRaw);

    if (title.length < 2 || title.length > 120 || !Number.isFinite(price) || price <= 0 || !file) {
      setStatus("error-validation");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("error-offline");
      return;
    }

    setStatus("submitting");

    try {
      const compressed = await compressProductImage(file);
      const supabase = createSupabaseBrowserClient();
      const path = buildProductImagePath(shopId);

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

      if (uploadError) {
        setStatus("error-network");
        return;
      }

      const { error: insertError } = await supabase.from("products").insert({
        shop_id: shopId,
        title,
        description: description.length > 0 ? description : null,
        price_fcfa: Math.round(price),
        category,
        image_path: path,
      });

      if (insertError) {
        // Image envoyée mais annonce non enregistrée : on nettoie le
        // fichier orphelin plutôt que de le laisser traîner en stockage.
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
        setStatus("error-generic");
        return;
      }

      router.push("/compte/boutique/produits");
      router.refresh();
    } catch {
      setStatus("error-generic");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
        className="text-sm"
      />

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob URL), pas une image distante à optimiser
        <img
          src={previewUrl}
          alt="Aperçu de l'annonce"
          className="rounded-xl w-full aspect-square object-cover"
        />
      )}

      <input
        name="title"
        type="text"
        required
        minLength={2}
        maxLength={120}
        placeholder="Titre de l'annonce"
        className="border rounded-xl px-4 py-3 text-sm"
      />

      <select name="category" required defaultValue="" className="border rounded-xl px-4 py-3 text-sm bg-white">
        <option value="" disabled>
          Catégorie
        </option>
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>

      <input
        name="price"
        type="number"
        required
        min={1}
        step={1}
        placeholder="Prix (FCFA)"
        className="border rounded-xl px-4 py-3 text-sm"
      />

      <textarea
        name="description"
        maxLength={2000}
        rows={4}
        placeholder="Description (facultatif)"
        className="border rounded-xl px-4 py-3 text-sm resize-none"
      />

      {status !== "idle" && status !== "submitting" && (
        <p className="text-red-600 text-sm">{ERROR_MESSAGES[status]}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {status === "submitting" ? "Publication..." : "Publier l'annonce"}
      </button>
    </form>
  );
}
