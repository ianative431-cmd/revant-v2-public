import test from "node:test";
import assert from "node:assert/strict";
import { decryptDeliveryCode, encryptDeliveryCode } from "../src/server/delivery/code-crypto.mjs";

const secret = "revant-delivery-code-secret-for-tests-only-2026";

test("delivery code encryption round-trips with authenticated encryption", () => {
  const encrypted = encryptDeliveryCode("048215", secret);
  assert.match(encrypted, /^v1\./);
  assert.equal(decryptDeliveryCode(encrypted, secret), "048215");
});

test("delivery code ciphertext cannot be decrypted with another key", () => {
  const encrypted = encryptDeliveryCode("739104", secret);
  assert.throws(() => decryptDeliveryCode(encrypted, "a-different-secret-key-with-32-chars"));
});

test("tampered delivery code ciphertext is rejected", () => {
  const encrypted = encryptDeliveryCode("123456", secret);
  const parts = encrypted.split(".");
  parts[3] = Buffer.from("999999", "utf8").toString("base64url");
  assert.throws(() => decryptDeliveryCode(parts.join("."), secret));
});

test("delivery code encryption rejects invalid codes and short secrets", () => {
  assert.throws(() => encryptDeliveryCode("1234", secret));
  assert.throws(() => encryptDeliveryCode("123456", "short"));
});
