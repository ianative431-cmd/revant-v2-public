"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { productImagePublicUrl } from "@/lib/product-image";
import { getCategoryLabel } from "@/content/products/categories";
import type { Product } from "@/types/product";

export default function ProductManageRow({
  product,
  supabaseUrl,
}: {
  product: Product;
  supabaseUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(product.status);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const nextStatus = status === "active" ? "sold" : "active";

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

    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);

    setPending(false);
    if (deleteError) {
      setError("Impossible de supprimer l'annonce.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0">
        <Image
          src={productImagePublicUrl(supabaseUrl, product.image_path)}
          alt={product.title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.title}</p>
        <p className="text-xs text-black/60">{getCategoryLabel(product.category)}</p>
        <p className="text-sm font-semibold">{product.price_fcfa.toLocaleString("fr-FR")} FCFA</p>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={pending}
            className="text-xs border border-black rounded-full px-3 py-1 disabled:opacity-50"
          >
            {status === "active" ? "Marquer vendu" : "Remettre en vente"}
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
