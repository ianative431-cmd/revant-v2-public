import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const directory = dirname(fileURLToPath(import.meta.url));
const cardPath = join(directory, "ProductCard.tsx");
const fallbackPath = join(directory, "ProductImageFallback.tsx");
const cardSource = readFileSync(cardPath, "utf8");

test("product cards use a branded fallback instead of a generic missing-photo state", () => {
  assert.ok(cardSource.includes("<ProductImageFallback />"));
  assert.doesNotMatch(cardSource, /Photo indisponible/);
  assert.ok(existsSync(fallbackPath), "the branded fallback component must exist");
});

test("the branded fallback uses Revant Tangerine and deep blue identity", () => {
  assert.ok(existsSync(fallbackPath), "the branded fallback component must exist");
  const fallbackSource = readFileSync(fallbackPath, "utf8");
  assert.match(fallbackSource, /#F46A18/i);
  assert.match(fallbackSource, /#142B45/i);
  assert.match(fallbackSource, /role="img"/);
  assert.match(fallbackSource, /aria-label="Visuel de remplacement Revant"/);
});
