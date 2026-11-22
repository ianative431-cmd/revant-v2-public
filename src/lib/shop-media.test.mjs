import assert from "node:assert/strict";
import test from "node:test";
import { shouldDeleteShopMediaObject } from "./shop-media.mjs";

const resolvePath = (url) => {
  if (url === "logo-old") return "owner/shop/logo-old.png";
  if (url === "banner-old") return "owner/shop/banner-old.png";
  if (url === "logo-new") return "owner/shop/logo-new.png";
  if (url === null) return null;
  return null;
};

test("keeps a replaced object when the other shop media field still references it", () => {
  assert.equal(
    shouldDeleteShopMediaObject(
      "owner/shop/logo-old.png",
      ["logo-new", "logo-old"],
      resolvePath,
    ),
    false,
  );
});

test("allows cleanup when neither current media field references the old object", () => {
  assert.equal(
    shouldDeleteShopMediaObject(
      "owner/shop/logo-old.png",
      ["logo-new", "banner-old"],
      resolvePath,
    ),
    true,
  );
});

test("never requests deletion when no previously validated owned path exists", () => {
  assert.equal(shouldDeleteShopMediaObject(null, ["logo-new"], resolvePath), false);
});
