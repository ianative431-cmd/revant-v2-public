import { timingSafeEqual } from "node:crypto";

const API_BASE = "https://i-pay.money/api/v1";
const ENVIRONMENTS = new Set(["sandbox", "live"]);

export class IpayMoneyError extends Error {
  constructor(message, status = 500, code = "ipay_error") {
    super(message);
    this.name = "IpayMoneyError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireText(value, field, maxLength = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new IpayMoneyError(`Invalid ${field}.`, 400, "invalid_request");
  }
  return value.trim();
}

function requireHttpsUrl(value, field) {
  const text = requireText(value, field, 2048);
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new IpayMoneyError(`Invalid ${field}.`, 400, "invalid_request");
  }
  if (parsed.protocol !== "https:") {
    throw new IpayMoneyError(`${field} must use HTTPS.`, 400, "invalid_request");
  }
  return parsed.toString();
}

/**
 * The provider is deliberately disabled unless explicitly enabled on the
 * server. Production must additionally check payment_providers.enabled in DB.
 */
export function getIpayMoneyConfig(env = process.env) {
  if (env.IPAY_MONEY_ENABLED !== "true") {
    throw new IpayMoneyError("iMoney payments are disabled.", 503, "provider_disabled");
  }

  const environment = env.IPAY_MONEY_ENVIRONMENT;
  if (!ENVIRONMENTS.has(environment)) {
    throw new IpayMoneyError("Invalid iMoney environment.", 503, "provider_not_configured");
  }

  const secretKey = environment === "sandbox"
    ? env.IPAY_MONEY_SECRET_KEY_SANDBOX
    : env.IPAY_MONEY_SECRET_KEY_LIVE;

  if (typeof secretKey !== "string" || secretKey.length < 16) {
    throw new IpayMoneyError("iMoney secret key is not configured.", 503, "provider_not_configured");
  }

  return Object.freeze({ environment, secretKey });
}

function buildHeaders(config, paymentType) {
  return {
    Authorization: `Bearer ${config.secretKey}`,
    "Content-Type": "application/json",
    "Ipay-Target-Environment": config.environment,
    "Ipay-Payment-Type": paymentType,
  };
}

async function requestJson(url, options, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(url, {
      ...options,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new IpayMoneyError(
      "Unable to reach iMoney. Check the payment status before retrying.",
      503,
      "provider_unreachable"
    );
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = isRecord(body) && typeof body.message === "string"
      ? body.message.slice(0, 240)
      : `iMoney returned HTTP ${response.status}.`;
    throw new IpayMoneyError(message, response.status, "provider_rejected");
  }

  if (!isRecord(body)) {
    throw new IpayMoneyError("Invalid response from iMoney.", 502, "provider_invalid_response");
  }

  return body;
}

function validateAmount(amount, minimum) {
  if (!Number.isSafeInteger(amount) || amount < minimum) {
    throw new IpayMoneyError(`Amount must be an integer of at least ${minimum} XOF.`, 400, "invalid_amount");
  }
}

/**
 * Creates a direct mobile-money collection request. The returned status is
 * only the provider's creation response; callers must fetch final status or
 * process a verified webhook before marking an order paid.
 */
export async function createIpayMobilePayment(input, options = {}) {
  const config = options.config ?? getIpayMoneyConfig(options.env);
  const minimum = config.environment === "sandbox" ? 50 : 25;
  validateAmount(input?.amount, minimum);

  const country = requireText(input?.country ?? "NE", "country", 2);
  const currency = requireText(input?.currency ?? "XOF", "currency", 3);
  if (country !== "NE" || currency !== "XOF") {
    throw new IpayMoneyError("Revant iMoney mobile checkout currently accepts NE/XOF only.", 400, "unsupported_market");
  }

  const msisdn = requireText(input?.msisdn, "msisdn", 20);
  if (!/^[0-9+() .-]{8,20}$/.test(msisdn)) {
    throw new IpayMoneyError("Invalid mobile number format.", 400, "invalid_msisdn");
  }

  const payload = {
    amount: input.amount,
    country,
    currency,
    msisdn,
    transaction_id: requireText(input?.transactionId, "transaction_id", 120),
    customer_name: requireText(input?.customerName, "customer_name", 120),
  };

  return requestJson(`${API_BASE}/payments`, {
    method: "POST",
    headers: buildHeaders(config, "mobile"),
    body: JSON.stringify(payload),
  }, options.fetchImpl);
}

/**
 * Creates a hosted checkout link for card and other channels configured on
 * the merchant account. iMoney's v1 hosted links expire after 30 minutes.
 */
export async function createIpayHostedPaymentLink(input, options = {}) {
  const config = options.config ?? getIpayMoneyConfig(options.env);
  validateAmount(input?.amount, 50);

  const payload = {
    title: requireText(input?.title, "title", 120),
    description: requireText(input?.description, "description", 500),
    amount: input.amount,
    on_success_redirection_url: requireHttpsUrl(input?.successUrl, "successUrl"),
    on_failed_redirection_url: requireHttpsUrl(input?.failureUrl, "failureUrl"),
  };

  const result = await requestJson(`${API_BASE}/external_payments`, {
    method: "POST",
    headers: buildHeaders(config, "external_payment"),
    body: JSON.stringify(payload),
  }, options.fetchImpl);

  if (typeof result.page_url !== "string" || !result.page_url.startsWith("https://")) {
    throw new IpayMoneyError("iMoney did not return a secure checkout URL.", 502, "provider_invalid_response");
  }

  return result;
}

/** Authenticated status lookup for a direct mobile-money transaction. */
export async function getIpayMobilePaymentStatus(reference, options = {}) {
  const config = options.config ?? getIpayMoneyConfig(options.env);
  const safeReference = requireText(reference, "reference", 160);
  return requestJson(`${API_BASE}/payments/${encodeURIComponent(safeReference)}`, {
    method: "GET",
    headers: buildHeaders(config, "mobile"),
  }, options.fetchImpl);
}

/**
 * Public provider lookup for hosted links. A reference is a bearer secret:
 * keep it private, random and out of logs/client-visible URLs.
 */
export async function getIpayHostedPaymentStatus(reference, options = {}) {
  const safeReference = requireText(reference, "reference", 160);
  if (safeReference.length < 32) {
    throw new IpayMoneyError("Hosted payment reference is too short.", 400, "invalid_reference");
  }
  return requestJson(`${API_BASE}/external_payments/${encodeURIComponent(safeReference)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  }, options.fetchImpl);
}

/**
 * iMoney sends the configured static Secret-Hash header. This is NOT HMAC.
 * Compare the shared secret in constant time and never log either value.
 */
export function verifyIpayWebhookSecret(receivedHeader, expectedSecret) {
  if (typeof receivedHeader !== "string" || typeof expectedSecret !== "string") return false;
  if (receivedHeader.length === 0 || expectedSecret.length === 0) return false;

  const received = Buffer.from(receivedHeader, "utf8");
  const expected = Buffer.from(expectedSecret, "utf8");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

export function normalizeIpayPaymentStatus(status) {
  switch (status) {
    case "initiated":
    case "pending":
      return "pending";
    case "succeeded":
      return "paid";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    case "cancelled":
      return "cancelled";
    default:
      throw new IpayMoneyError("Unknown iMoney payment status.", 502, "provider_unknown_status");
  }
}
