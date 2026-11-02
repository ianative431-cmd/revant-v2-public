type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Return operational counters only. WhatsApp webhook bodies may contain
 * phone numbers, message text, media references and other personal data;
 * none of those values belong in the general audit log.
 */
export function summarizeWhatsAppWebhook(payload: unknown): {
  event: "webhook_received";
  object: "whatsapp_business_account" | "unknown";
  entry_count: number;
  change_count: number;
  message_count: number;
  status_count: number;
} {
  const root = isRecord(payload) ? payload : {};
  const entries = Array.isArray(root.entry) ? root.entry : [];
  let changeCount = 0;
  let messageCount = 0;
  let statusCount = 0;

  for (const entry of entries) {
    if (!isRecord(entry) || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isRecord(change) || !isRecord(change.value)) continue;
      changeCount += 1;
      if (Array.isArray(change.value.messages)) {
        messageCount += change.value.messages.length;
      }
      if (Array.isArray(change.value.statuses)) {
        statusCount += change.value.statuses.length;
      }
    }
  }

  return {
    event: "webhook_received",
    object: root.object === "whatsapp_business_account"
      ? "whatsapp_business_account"
      : "unknown",
    entry_count: entries.length,
    change_count: changeCount,
    message_count: messageCount,
    status_count: statusCount,
  };
}
