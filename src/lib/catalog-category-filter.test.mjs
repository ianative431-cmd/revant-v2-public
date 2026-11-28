import test from "node:test";
import assert from "node:assert/strict";
import { resolveCatalogCategoryFilter } from "./catalog-category-filter.mjs";

const categories = [
  { id: "mode-id", slug: "mode" },
  { id: "parfums-id", slug: "parfums" },
  { id: "sport-id", slug: "sport" },
];

test("uses the real Mode category instead of filtering only clothing product types", () => {
  assert.deepEqual(resolveCatalogCategoryFilter("mode", categories), { categoryId: "mode-id" });
});

test("uses the real Parfums category instead of filtering only perfume product types", () => {
  assert.deepEqual(resolveCatalogCategoryFilter("parfums", categories), { categoryId: "parfums-id" });
});

test("uses real database IDs for ordinary categories", () => {
  assert.deepEqual(resolveCatalogCategoryFilter("sport", categories), { categoryId: "sport-id" });
});

test("retains the Mode product-type fallback only when category loading fails", () => {
  assert.deepEqual(resolveCatalogCategoryFilter("mode", [], true), { productType: "clothing" });
});

test("retains the Parfums product-type fallback only when category loading fails", () => {
  assert.deepEqual(resolveCatalogCategoryFilter("parfums", [], true), { productType: "perfume" });
});

test("does not silently treat an unknown category as a product type", () => {
  assert.equal(resolveCatalogCategoryFilter("inconnue", categories), null);
  assert.equal(resolveCatalogCategoryFilter("inconnue", [], true), null);
});

test("leaves the unfiltered catalog unchanged", () => {
  assert.deepEqual(resolveCatalogCategoryFilter("", categories), {});
});
