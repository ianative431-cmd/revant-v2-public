import { createHash, createHmac } from "node:crypto";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createGuestTrackingToken(idempotencyKey, secret) {
  if (typeof idempotencyKey !== "string" || !UUID_V4.test(idempotencyKey)) {
    throw new Error("invalid_idempotency_key");
  }
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("invalid_tracking_secret");
  }
  return createHmac("sha256", secret)
    .update(`revant-guest-order:${idempotencyKey}`)
    .digest("hex");
}

export function hashGuestTrackingToken(token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/i.test(token)) {
    throw new Error("invalid_tracking_token");
  }
  return createHash("sha256").update(token).digest("hex");
}
