import test from "node:test";
import assert from "node:assert/strict";
import { formatShopLocation } from "./shop-location.mjs";

test("affiche le nom du pays en français au lieu du code ISO", () => {
  assert.equal(formatShopLocation("Niamey", "NE"), "Niamey, Niger");
});

test("affiche le pays même lorsque la ville est absente", () => {
  assert.equal(formatShopLocation("", "NE"), "Niger");
});

test("gère une ville seule et les valeurs vides", () => {
  assert.equal(formatShopLocation("Zinder", ""), "Zinder");
  assert.equal(formatShopLocation("", ""), "");
  assert.equal(formatShopLocation(null, null), "");
});

test("conserve un code non localisable plutôt que d'inventer un pays", () => {
  assert.equal(formatShopLocation("Centre-ville", "QZ"), "Centre-ville, QZ");
});
