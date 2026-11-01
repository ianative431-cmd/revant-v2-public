import test from "node:test";
import assert from "node:assert/strict";
import { createGuestTrackingToken, hashGuestTrackingToken } from "../src/server/orders/guest-token.mjs";

const key = "8b7d0a64-91f0-4e11-8d3c-9fbb8a0c1a21";
const secret = "revant-test-secret-that-is-at-least-32-characters-long";

test("guest tracking token is stable for the same idempotency key", () => {
  const first = createGuestTrackingToken(key, secret);
  const second = createGuestTrackingToken(key, secret);
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
});

test("different checkout keys or secrets produce different tracking tokens", () => {
  assert.notEqual(createGuestTrackingToken(key, secret), createGuestTrackingToken("7b7d0a64-91f0-4e11-8d3c-9fbb8a0c1a21", secret));
  assert.notEqual(createGuestTrackingToken(key, secret), createGuestTrackingToken(key, `${secret}-other`));
});

test("only a hash of the tracking token is stored", () => {
  const token = createGuestTrackingToken(key, secret);
  const hash = hashGuestTrackingToken(token);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, token);
});

test("rejects invalid idempotency keys and weak secrets", () => {
  assert.throws(() => createGuestTrackingToken("not-a-uuid", secret), /invalid_idempotency_key/);
  assert.throws(() => createGuestTrackingToken(key, "short"), /invalid_tracking_secret/);
  assert.throws(() => hashGuestTrackingToken("not-a-token"), /invalid_tracking_token/);
});
