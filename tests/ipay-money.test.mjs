import test from "node:test";
import assert from "node:assert/strict";
import {
  IpayMoneyError,
  createIpayMobilePayment,
  createIpayHostedPaymentLink,
  getIpayMobilePaymentStatus,
  getIpayHostedPaymentStatus,
  getIpayMoneyConfig,
  normalizeIpayPaymentStatus,
  verifyIpayWebhookSecret,
} from "../src/server/integrations/ipay-money.mjs";

const sandboxEnv = {
  IPAY_MONEY_ENABLED: "true",
  IPAY_MONEY_ENVIRONMENT: "sandbox",
  IPAY_MONEY_SECRET_KEY_SANDBOX: "sk_sandbox_test_key_not_real",
};

const config = { environment: "sandbox", secretKey: "sk_sandbox_test_key_not_real" };

test("iMoney remains disabled unless the server-side feature flag is explicitly true", () => {
  assert.throws(
    () => getIpayMoneyConfig({ IPAY_MONEY_ENVIRONMENT: "sandbox", IPAY_MONEY_SECRET_KEY_SANDBOX: "sk_test" }),
    (error) => error instanceof IpayMoneyError && error.code === "provider_disabled"
  );
});

test("direct mobile payment sends the official Niger XOF payload and headers", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ status: "initiated", reference: "ipay-test-ref" }) };
  };

  const result = await createIpayMobilePayment({
    amount: 1000,
    country: "NE",
    currency: "XOF",
    msisdn: "40410000000",
    transactionId: "RVT-TEST-001",
    customerName: "Client Sandbox",
  }, { config, fetchImpl });

  assert.equal(result.status, "initiated");
  assert.equal(request.url, "https://i-pay.money/api/v1/payments");
  assert.equal(request.options.headers["Ipay-Payment-Type"], "mobile");
  assert.equal(request.options.headers["Ipay-Target-Environment"], "sandbox");
  assert.equal(request.options.headers.Authorization, "Bearer sk_sandbox_test_key_not_real");
  assert.deepEqual(JSON.parse(request.options.body), {
    amount: 1000,
    country: "NE",
    currency: "XOF",
    msisdn: "40410000000",
    transaction_id: "RVT-TEST-001",
    customer_name: "Client Sandbox",
  });
});

test("sandbox rejects amounts below the documented 50 XOF minimum before network access", async () => {
  let called = false;
  await assert.rejects(
    () => createIpayMobilePayment({
      amount: 49,
      msisdn: "40410000000",
      transactionId: "RVT-TEST-002",
      customerName: "Client Sandbox",
    }, { config, fetchImpl: async () => { called = true; } }),
    (error) => error instanceof IpayMoneyError && error.code === "invalid_amount"
  );
  assert.equal(called, false);
});

test("hosted checkout uses external_payment and requires HTTPS return URLs", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ status: "initiated", reference: "a".repeat(40), page_url: "https://pay.i-pay.money/secure" }) };
  };

  const result = await createIpayHostedPaymentLink({
    amount: 500,
    title: "Commande Revant RVT-001",
    description: "Paiement de commande",
    successUrl: "https://revant.example/paiement/succes",
    failureUrl: "https://revant.example/paiement/echec",
  }, { config, fetchImpl });

  assert.equal(result.page_url, "https://pay.i-pay.money/secure");
  assert.equal(request.url, "https://i-pay.money/api/v1/external_payments");
  assert.equal(request.options.headers["Ipay-Payment-Type"], "external_payment");
  await assert.rejects(
    () => createIpayHostedPaymentLink({
      amount: 500,
      title: "Commande",
      description: "Paiement",
      successUrl: "http://revant.example/success",
      failureUrl: "https://revant.example/failure",
    }, { config, fetchImpl }),
    (error) => error instanceof IpayMoneyError && error.code === "invalid_request"
  );
});

test("mobile status lookup uses authenticated mobile headers", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ status: "succeeded", reference: "ipay-test-ref" }) };
  };

  const result = await getIpayMobilePaymentStatus("ipay-test-ref", { config, fetchImpl });
  assert.equal(result.status, "succeeded");
  assert.equal(request.url, "https://i-pay.money/api/v1/payments/ipay-test-ref");
  assert.equal(request.options.headers["Ipay-Payment-Type"], "mobile");
});

test("hosted status lookup is public but rejects short references", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ status: "succeeded" }) };
  };

  const reference = "a".repeat(40);
  await getIpayHostedPaymentStatus(reference, { fetchImpl });
  assert.equal(request.url, `https://i-pay.money/api/v1/external_payments/${reference}`);
  assert.equal("Authorization" in request.options.headers, false);
  await assert.rejects(
    () => getIpayHostedPaymentStatus("short", { fetchImpl }),
    (error) => error instanceof IpayMoneyError && error.code === "invalid_reference"
  );
});

test("webhook verification compares the static Secret-Hash, not an HMAC payload signature", () => {
  const secret = "revant-ipay-webhook-secret-test";
  assert.equal(verifyIpayWebhookSecret(secret, secret), true);
  assert.equal(verifyIpayWebhookSecret("wrong-secret", secret), false);
  assert.equal(verifyIpayWebhookSecret(null, secret), false);
  assert.equal(verifyIpayWebhookSecret(secret, ""), false);
});


test("live mobile checkout enforces the documented 25 XOF minimum", async () => {
  const liveConfig = { environment: "live", secretKey: "sk_live_test_key_not_real" };
  let called = false;
  await assert.rejects(
    () => createIpayMobilePayment({
      amount: 24,
      msisdn: "40410000000",
      transactionId: "RVT-TEST-LIVE-001",
      customerName: "Client Test",
    }, { config: liveConfig, fetchImpl: async () => { called = true; } }),
    (error) => error instanceof IpayMoneyError && error.code === "invalid_amount"
  );
  assert.equal(called, false);
});

test("provider statuses map only to known internal payment states", () => {
  assert.equal(normalizeIpayPaymentStatus("initiated"), "pending");
  assert.equal(normalizeIpayPaymentStatus("pending"), "pending");
  assert.equal(normalizeIpayPaymentStatus("succeeded"), "paid");
  assert.equal(normalizeIpayPaymentStatus("failed"), "failed");
  assert.equal(normalizeIpayPaymentStatus("refunded"), "refunded");
  assert.equal(normalizeIpayPaymentStatus("cancelled"), "cancelled");
  assert.throws(() => normalizeIpayPaymentStatus("processing"), IpayMoneyError);
});
