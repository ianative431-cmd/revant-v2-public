import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAuthenticationTemplatePayload,
  isValidE164,
  isValidOtp,
} from "../supabase/functions/send-sms/helpers.mjs";

test("accepts Niger E.164 phone numbers", () => {
  assert.equal(isValidE164("+22790123456"), true);
});

test("rejects malformed or non-E.164 phone numbers", () => {
  for (const phone of ["22790123456", "+227", "+012345678", "+227 90123456", "abc"]) {
    assert.equal(isValidE164(phone), false);
  }
});

test("accepts numeric Supabase OTPs from 4 to 8 digits", () => {
  for (const otp of ["1234", "123456", "12345678"]) assert.equal(isValidOtp(otp), true);
});

test("rejects malformed OTPs", () => {
  for (const otp of ["123", "123456789", "12 456", "abcdef", ""]) {
    assert.equal(isValidOtp(otp), false);
  }
});

test("builds Meta authentication template with the code in body and copy-code button", () => {
  const payload = buildAuthenticationTemplatePayload({
    phone: "+22790123456",
    otp: "482913",
    templateName: "revant_login_code",
    languageCode: "fr",
  });

  assert.equal(payload.to, "22790123456");
  assert.equal(payload.type, "template");
  assert.equal(payload.template.name, "revant_login_code");
  assert.deepEqual(payload.template.language, { code: "fr" });
  assert.deepEqual(payload.template.components[0].parameters[0], {
    type: "text",
    text: "482913",
  });
  assert.deepEqual(payload.template.components[1], {
    type: "button",
    sub_type: "url",
    index: "0",
    parameters: [{ type: "text", text: "482913" }],
  });
});

test("rejects invalid inputs before building a provider request", () => {
  assert.throws(() => buildAuthenticationTemplatePayload({
    phone: "22790123456",
    otp: "482913",
    templateName: "revant_login_code",
    languageCode: "fr",
  }), /invalid_phone/);

  assert.throws(() => buildAuthenticationTemplatePayload({
    phone: "+22790123456",
    otp: "ABC123",
    templateName: "revant_login_code",
    languageCode: "fr",
  }), /invalid_otp/);
});
