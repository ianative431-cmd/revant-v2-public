import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheet = readFileSync(new URL("../src/app/revant-editorial.css", import.meta.url), "utf8");

function palette(selector) {
  const start = stylesheet.indexOf(selector);
  assert.notEqual(start, -1, `Missing palette selector: ${selector}`);
  const open = stylesheet.indexOf("{", start);
  const close = stylesheet.indexOf("}", open);
  const declarations = stylesheet.slice(open + 1, close);
  return Object.fromEntries(
    [...declarations.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})/gi)].map(([, key, value]) => [key, value]),
  );
}

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [r, g, b] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("light palette orange text meets WCAG AA on the ivory canvas", () => {
  const colors = palette(':root[data-site-palette="terracotta"]');
  assert.ok(contrastRatio(colors["brand-accent-text"], colors["brand-bg"]) >= 4.5);
});

test("light palette foreground remains readable on vivid tangerine actions", () => {
  const colors = palette(':root[data-site-palette="terracotta"]');
  assert.ok(contrastRatio(colors["brand-accent-contrast"], colors["brand-accent"]) >= 4.5);
});

test("dark palette orange text meets WCAG AA on the forest canvas", () => {
  const colors = palette(':root[data-site-palette="slate-lilac"]');
  assert.ok(contrastRatio(colors["brand-accent-text"], colors["brand-bg"]) >= 4.5);
});

test("dark palette foreground remains readable on vivid orange actions", () => {
  const colors = palette(':root[data-site-palette="slate-lilac"]');
  assert.ok(contrastRatio(colors["brand-accent-contrast"], colors["brand-accent"]) >= 4.5);
});
