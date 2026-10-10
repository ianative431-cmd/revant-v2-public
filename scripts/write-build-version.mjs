import { mkdir, writeFile } from "node:fs/promises";

const version = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "build-" + Date.now();
const directory = new URL("../src/generated/", import.meta.url);
const target = new URL("../src/generated/build-version.ts", import.meta.url);

await mkdir(directory, { recursive: true });
const source =
  "// Generated at build time. Do not edit by hand.\n" +
  "export const BUILD_VERSION = " + JSON.stringify(version) + ";\n";
await writeFile(target, source, "utf8");
console.log("Revant build version: " + version);
