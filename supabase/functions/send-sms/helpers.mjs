export function isValidE164(value) {
  return typeof value === "string" && /^\+[1-9]\d{7,14}$/.test(value);
}

export function isValidOtp(value) {
  return typeof value === "string" && /^\d{4,8}$/.test(value);
}

export function buildAuthenticationTemplatePayload({
  phone,
  otp,
  templateName,
  languageCode,
}) {
  if (!isValidE164(phone)) throw new TypeError("invalid_phone");
  if (!isValidOtp(otp)) throw new TypeError("invalid_otp");
  if (typeof templateName !== "string" || !/^[a-z0-9_]{1,512}$/.test(templateName)) {
    throw new TypeError("invalid_template_name");
  }
  if (typeof languageCode !== "string" || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(languageCode)) {
    throw new TypeError("invalid_template_language");
  }

  const code = otp;
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone.slice(1),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: code }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: code }],
        },
      ],
    },
  };
}
