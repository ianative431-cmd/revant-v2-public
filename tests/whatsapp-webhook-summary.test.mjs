import test from "node:test";
import assert from "node:assert/strict";
import { summarizeWhatsAppWebhook } from "../src/server/integrations/whatsapp-webhook-summary.mjs";

test("summarizes WhatsApp webhook counters without retaining personal data", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "sensitive-business-id",
      changes: [{
        field: "messages",
        value: {
          contacts: [{ wa_id: "22790000000", profile: { name: "Private Name" } }],
          messages: [{ id: "private-message-id", from: "22790000000", text: { body: "private message" } }],
          statuses: [{ id: "private-status-id", status: "delivered", recipient_id: "22790000000" }],
        },
      }],
    }],
  };

  const summary = summarizeWhatsAppWebhook(payload);
  assert.deepEqual(summary, {
    event: "webhook_received",
    object: "whatsapp_business_account",
    entry_count: 1,
    change_count: 1,
    message_count: 1,
    status_count: 1,
  });
  const serialized = JSON.stringify(summary);
  for (const sensitive of ["22790000000", "Private Name", "private message", "private-message-id", "sensitive-business-id"]) {
    assert.equal(serialized.includes(sensitive), false);
  }
});

test("handles malformed or unknown payload shapes safely", () => {
  assert.deepEqual(summarizeWhatsAppWebhook(null), {
    event: "webhook_received",
    object: "unknown",
    entry_count: 0,
    change_count: 0,
    message_count: 0,
    status_count: 0,
  });
  assert.equal(summarizeWhatsAppWebhook({ entry: "not-an-array" }).entry_count, 0);
});
