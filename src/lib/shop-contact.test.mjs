import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeShopPhone,
  normalizeShopSocialUrl,
} from "./shop-contact.mjs";

test("normalise un numéro local nigérien avec +227", () => {
  assert.equal(normalizeShopPhone("90 12 34 56", "227"), "+22790123456");
  assert.equal(normalizeShopPhone("090-12-34-56", "227"), "+22790123456");
});

test("normalise un numéro international au format 00", () => {
  assert.equal(normalizeShopPhone("00227 90 12 34 56", "227"), "+22790123456");
  assert.equal(normalizeShopPhone("+33 6 12 34 56 78", "227"), "+33612345678");
});

test("refuse les numéros invalides et les numéros locaux sans pays connu", () => {
  assert.equal(normalizeShopPhone("", "227"), null);
  assert.equal(normalizeShopPhone("appel-moi", "227"), undefined);
  assert.equal(normalizeShopPhone("90 12 34 56", null), undefined);
});

test("construit les URL de profil Instagram, TikTok et Snapchat", () => {
  assert.equal(
    normalizeShopSocialUrl("@revant.store", "instagram"),
    "https://www.instagram.com/revant.store/"
  );
  assert.equal(
    normalizeShopSocialUrl("@revant_store", "tiktok"),
    "https://www.tiktok.com/@revant_store"
  );
  assert.equal(
    normalizeShopSocialUrl("revant-store", "snapchat"),
    "https://www.snapchat.com/add/revant-store"
  );
});

test("accepte une URL HTTPS du bon réseau et refuse les liens externes", () => {
  assert.equal(
    normalizeShopSocialUrl("https://www.instagram.com/revant.store/", "instagram"),
    "https://www.instagram.com/revant.store/"
  );
  assert.equal(normalizeShopSocialUrl("https://example.com/revant", "instagram"), undefined);
  assert.equal(normalizeShopSocialUrl("http://instagram.com/revant", "instagram"), undefined);
  assert.equal(normalizeShopSocialUrl("", "snapchat"), null);
});
