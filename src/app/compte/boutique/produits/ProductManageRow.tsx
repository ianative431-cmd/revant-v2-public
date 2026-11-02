"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

export default function ProductManageRow({ product, shopStatus }: { product: Product; shopStatus: "draft" | "pending" | "active" | "suspended" | "closed" }) {
  const router = useRouter();
  const [status, setStatus] = useState(product.status);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const nextStatus = status === "active" ? "archived" : "active";
    if (shopStatus !== "active" || status === "pending" || status === "rejected") {
      setPending(false);
      setError("Cette annonce ne peut pas être publiée avant la validation de la boutique ou après un refus.");
      return;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ status: nextStatus })
      .eq("id", product.id);

    setPending(false);
    if (updateError) {
      setError("Impossible de mettre à jour l'annonce.");
      return;
    }
    setStatus(nextStatus);
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: imageRows, error: imageQueryError } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", product.id);
    if (imageQueryError) {
      setPending(false);
      setError("Impossible de préparer la suppression des photos.");
      return;
    }

    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);

    setPending(false);
    if (deleteError) {
      setError("Impossible de supprimer l'annonce.");
      return;
    }
    const storagePrefix = `/storage/v1/object/public/product-images/`;
    const imagePaths = (imageRows ?? []).flatMap((row) => {
      const marker = row.image_url.indexOf(storagePrefix);
      if (marker < 0) return [];
      const path = decodeURIComponent(row.image_url.slice(marker + storagePrefix.length));
      return path.startsWith(`${product.shop_id}/`) && !path.includes("..") ? [path] : [];
    });
    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from("product-images").remove(imagePaths);
      if (storageError) setError("Annonce supprimée, mais certaines photos n'ont pas pu être nettoyées.");
    }
    router.refresh();
  }

  const imageUrl = product.images[0] ?? null;

  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} alt={product.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-black/30">
            Pas de photo
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        {product.categoryName && (
          <p className="text-xs text-black/60">{product.categoryName}</p>
        )}
        <p className="text-sm font-semibold">
          {product.base_price.toLocaleString("fr-FR")} {product.currency}
        </p>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={pending || shopStatus !== "active" || status === "pending" || status === "rejected"}
            className="text-xs border border-black rounded-full px-3 py-1 disabled:opacity-50"
          >
            {status === "active" ? "Retirer de la vente" : status === "archived" ? "Remettre en vente" : status === "pending" ? "En attente" : status === "rejected" ? "Refusée" : "Publier"}
          </button>

          {confirmDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-xs bg-red-600 text-white rounded-full px-3 py-1 disabled:opacity-50"
            >
              Confirmer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-600 underline"
            >
              Supprimer
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
