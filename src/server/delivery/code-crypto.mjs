import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function deriveKey(secret) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("DELIVERY_CODE_ENCRYPTION_KEY must contain at least 32 characters.");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptDeliveryCode(code, secret) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    throw new Error("Delivery code must contain exactly six digits.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptDeliveryCode(payload, secret) {
  if (typeof payload !== "string") throw new Error("Invalid encrypted delivery code.");
  const [version, ivText, tagText, ciphertextText, extra] = payload.split(".");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText || extra !== undefined) {
    throw new Error("Unsupported encrypted delivery code format.");
  }
  const iv = Buffer.from(ivText, "base64url");
  const tag = Buffer.from(tagText, "base64url");
  const ciphertext = Buffer.from(ciphertextText, "base64url");
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length !== 6) {
    throw new Error("Invalid encrypted delivery code payload.");
  }
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  if (!/^\d{6}$/.test(plaintext)) throw new Error("Invalid delivery code plaintext.");
  return plaintext;
}
