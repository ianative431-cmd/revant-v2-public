import test from "node:test";
import assert from "node:assert/strict";
import {
  createGuestOrderTrackingToken,
  hashGuestTrackingToken,
} from "../src/server/orders/guest-token.mjs";

const idempotencyKey = "123e4567-e89b-42d3-a456-426614174000";
const secret = "revant-test-secret-that-is-at-least-32-characters";

test("guest tracking token is deterministic for the same key, quantity and secret", () => {
  const first = createGuestOrderTrackingToken(idempotencyKey, 2, secret);
  const second = createGuestOrderTrackingToken(idempotencyKey, 2, secret);
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
});

test("guest tracking token changes when quantity changes", () => {
  const one = createGuestOrderTrackingToken(idempotencyKey, 1, secret);
  const two = createGuestOrderTrackingToken(idempotencyKey, 2, secret);
  assert.notEqual(one, two);
});

test("guest tracking token normalizes UUID letter case", () => {
  const upper = createGuestOrderTrackingToken(idempotencyKey.toUpperCase(), 2, secret);
  const lower = createGuestOrderTrackingToken(idempotencyKey.toLowerCase(), 2, secret);
  assert.equal(upper, lower);
});

test("guest tracking token rejects invalid idempotency keys", () => {
  assert.throws(() => createGuestOrderTrackingToken("not-a-uuid", 1, secret), /invalid_idempotency_key/);
});

test("guest tracking token accepts only quantities from 1 through 99", () => {
  for (const quantity of [0, -1, 100, 1.5, Number.NaN]) {
    assert.throws(() => createGuestOrderTrackingToken(idempotencyKey, quantity, secret), /invalid_quantity/);
  }
});

test("guest tracking token rejects short secrets", () => {
  assert.throws(() => createGuestOrderTrackingToken(idempotencyKey, 1, "short"), /invalid_tracking_secret/);
});

test("guest tracking token hash is stable and rejects malformed tokens", () => {
  const token = createGuestOrderTrackingToken(idempotencyKey, 3, secret);
  assert.equal(hashGuestTrackingToken(token), hashGuestTrackingToken(token));
  assert.match(hashGuestTrackingToken(token), /^[0-9a-f]{64}$/);
  assert.throws(() => hashGuestTrackingToken("not-a-token"), /invalid_tracking_token/);
});
