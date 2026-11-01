import test from "node:test";
import assert from "node:assert/strict";
import { createSecurityHeaders } from "../src/lib/security-headers.mjs";

test("security headers deny framing and enable HTTPS strict transport", () => {
  const [rule] = createSecurityHeaders();
  const headers = Object.fromEntries(
    rule.headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );

  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(headers["strict-transport-security"], "max-age=31536000");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.match(headers["content-security-policy"], /frame-ancestors 'none'/);
});

test("Supabase origin is allowed only for required API and image connections", () => {
  const [rule] = createSecurityHeaders("https://example.supabase.co");
  const headers = Object.fromEntries(
    rule.headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );

  assert.match(headers["content-security-policy"], /connect-src[^;]*https:\/\/example\.supabase\.co/);
  assert.match(headers["content-security-policy"], /img-src[^;]*https:\/\/example\.supabase\.co/);
  assert.doesNotMatch(headers["content-security-policy"], /frame-ancestors 'self'/);
});
