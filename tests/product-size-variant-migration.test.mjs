import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/20261123062000_order_item_variants.sql", import.meta.url), "utf8");

test("order lines store a nullable immutable variant label for legacy compatibility", () => {
  assert.match(migration, /add column if not exists variant_label text/i);
  assert.match(migration, /variant_label is null or \(length\(btrim\(variant_label\)\) between 1 and 50\)/i);
});

test("guest checkout requires a valid available clothing size and stores it on the order line", () => {
  assert.match(migration, /raise exception 'variant_required'/i);
  assert.match(migration, /product_variant_unavailable_or_insufficient_stock/i);
  assert.match(migration, /variant_label is distinct from v_variant_label/i);
  assert.match(migration, /order_id, product_id, shop_id, product_name, variant_label/i);
});

test("legacy guest RPC signatures fail closed for clothing products that require a size", () => {
  assert.match(migration, /create or replace function public\.create_guest_order\([\s\S]*?p_quantity integer[\s\S]*?return private\.create_guest_order_impl\([\s\S]*?p_quantity, null/i);
});

test("seller confirmation decrements aggregate and selected-size stock atomically", () => {
  assert.match(migration, /size_stock = jsonb_set\([\s\S]*?v_variant_stock - v_item\.quantity/i);
  assert.match(migration, /stock_quantity = stock_quantity - v_item\.quantity/i);
  assert.match(migration, /perform private\.apply_order_item_stock\(p_order_id, false\)/i);
});

test("authorized cancellation restores aggregate and selected-size stock", () => {
  assert.match(migration, /size_stock = jsonb_set\([\s\S]*?v_variant_stock \+ v_item\.quantity/i);
  assert.match(migration, /perform private\.apply_order_item_stock\(p_order_id, true\)/i);
  assert.match(migration, /payment_action_required/i);
});


test("variant snapshots cannot be rewritten after order creation", () => {
  assert.match(migration, /order_items_variant_label_immutable/i);
  assert.match(migration, /raise exception 'order_variant_immutable'/i);
});

test("cancellation can restore a size key removed after the order was confirmed", () => {
  assert.match(migration, /if p_restore and jsonb_typeof\(v_size_stock\) = 'object'[\s\S]*?not \(v_size_stock \? v_item\.variant_label\)/i);
  assert.match(migration, /to_jsonb\(v_variant_stock \+ v_item\.quantity\),\s*true/i);
});


test("variant stock failures have a dedicated database error code", () => {
  assert.match(migration, /product_variant_unavailable_or_insufficient_stock/i);
});
