export function summarizeWhatsAppWebhook(payload: unknown): {
  event: "webhook_received";
  object: "whatsapp_business_account" | "unknown";
  entry_count: number;
  change_count: number;
  message_count: number;
  status_count: number;
};
