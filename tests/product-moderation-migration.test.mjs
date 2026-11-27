import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261127110218_secure_shop_product_moderation.sql", import.meta.url),
  "utf8",
);

test("seller API roles cannot approve pending products directly", () => {
  assert.match(migration, /old\.status = 'active' and new\.status = 'archived'/i);
  assert.match(migration, /old\.status = 'archived' and new\.status = 'active'/i);
  assert.match(migration, /raise exception 'product_status_forbidden'/i);
});

test("new products cannot be inserted in rejected, draft, or archived states by sellers", () => {
  assert.match(migration, /new\.status not in \('active'::public\.product_status, 'pending'::public\.product_status\)/i);
});

test("admin product moderation requires products.manage and a pending product", () => {
  assert.match(migration, /current_user_has_permission\('products\.manage'\)/i);
  assert.match(migration, /v_old_status <> 'pending'/i);
  assert.match(migration, /p_next_status = 'active' and v_shop_status <> 'active'/i);
  assert.match(migration, /p_next_status is null or p_next_status not in/i);
});

test("admin product decisions require a reason on rejection and write audit records", () => {
  assert.match(migration, /rejection_reason_required/i);
  assert.match(migration, /insert into public\.admin_actions/i);
  assert.match(migration, /insert into public\.audit_logs/i);
});

test("shop moderation is permission-gated, requires submission, and records each decision", () => {
  assert.match(migration, /current_user_has_permission\('shops\.manage'\)/i);
  assert.match(migration, /v_old_status not in \('pending', 'suspended'\)/i);
  assert.match(migration, /v_old_status <> 'active'/i);
  assert.match(migration, /approve_shop/i);
  assert.match(migration, /suspend_shop/i);
  assert.match(migration, /reactivate_shop/i);
});
