import assert from "node:assert/strict";
import test from "node:test";
import { createGuestCartTrackingToken, hashGuestTrackingToken } from "./guest-token.mjs";

const key = "6f1d8e21-45b9-4e6a-9c31-0e7a44a0a122";
const secret = "revant-test-secret-with-at-least-32-characters";

test("guest cart token is stable for the same checkout payload", () => {
  const fingerprint = "a".repeat(64);
  assert.equal(
    createGuestCartTrackingToken(key, fingerprint, secret),
    createGuestCartTrackingToken(key, fingerprint, secret),
  );
});

test("guest cart token changes when the cart fingerprint changes", () => {
  assert.notEqual(
    createGuestCartTrackingToken(key, "a".repeat(64), secret),
    createGuestCartTrackingToken(key, "b".repeat(64), secret),
  );
});

test("guest cart tracking token is stored as a one-way hash", () => {
  const token = createGuestCartTrackingToken(key, "c".repeat(64), secret);
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.match(hashGuestTrackingToken(token), /^[0-9a-f]{64}$/);
  assert.notEqual(hashGuestTrackingToken(token), token);
});

test("guest cart token rejects malformed fingerprints", () => {
  assert.throws(() => createGuestCartTrackingToken(key, "invalid", secret), /invalid_cart_fingerprint/);
});
