import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionShopStatus,
  getShopStatusAction,
  getShopStatusLabel,
} from "./shop-status.mjs";

test("affiche correctement chaque statut de boutique", () => {
  assert.equal(getShopStatusLabel("draft"), "Brouillon");
  assert.equal(getShopStatusLabel("pending"), "En attente de validation");
  assert.equal(getShopStatusLabel("active"), "Active");
  assert.equal(getShopStatusLabel("suspended"), "Suspendue");
  assert.equal(getShopStatusLabel("closed"), "Fermée");
  assert.equal(getShopStatusLabel("unknown"), "Statut inconnu");
});

test("propose la bonne action selon le statut", () => {
  assert.deepEqual(getShopStatusAction("draft"), { nextStatus: "active", label: "Activer", kind: "activate" });
  assert.deepEqual(getShopStatusAction("pending"), { nextStatus: "active", label: "Approuver", kind: "activate" });
  assert.deepEqual(getShopStatusAction("suspended"), { nextStatus: "active", label: "Réactiver", kind: "activate" });
  assert.deepEqual(getShopStatusAction("active"), { nextStatus: "suspended", label: "Suspendre", kind: "suspend" });
  assert.equal(getShopStatusAction("closed"), null);
});

test("autorise uniquement les transitions prévues", () => {
  assert.equal(canTransitionShopStatus("draft", "active"), true);
  assert.equal(canTransitionShopStatus("pending", "active"), true);
  assert.equal(canTransitionShopStatus("suspended", "active"), true);
  assert.equal(canTransitionShopStatus("active", "suspended"), true);
  assert.equal(canTransitionShopStatus("closed", "active"), false);
  assert.equal(canTransitionShopStatus("draft", "suspended"), false);
  assert.equal(canTransitionShopStatus("pending", "suspended"), false);
  assert.equal(canTransitionShopStatus("active", "active"), false);
});
