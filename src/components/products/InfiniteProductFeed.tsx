"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types/product";

type FeedResponse = { products: Product[]; hasMore: boolean };

export default function InfiniteProductFeed({
  initialProducts,
  category,
  search,
}: {
  initialProducts: Product[];
  category: string;
  search: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialProducts.length === 24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        offset: String(products.length),
        limit: "24",
      });
      if (category) params.set("categorie", category);
      if (search) params.set("q", search);
      const response = await fetch(`/api/products/feed?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Impossible de charger les produits");
      const data = (await response.json()) as FeedResponse;
      setProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        return [...current, ...data.products.filter((product) => !seen.has(product.id))];
      });
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [category, hasMore, products.length, search]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "700px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      <div ref={sentinel} aria-live="polite" className="flex min-h-16 items-center justify-center py-5">
        {loading && <p className="text-xs text-neutral-500">Chargement des produits suivants…</p>}
        {!hasMore && products.length > 0 && <p className="text-xs text-neutral-500">Tu as vu tous les produits disponibles pour le moment.</p>}
        {error && (
          <button type="button" onClick={() => void loadMore()} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold">
            Réessayer le chargement
          </button>
        )}
      </div>
    </>
  );
}
