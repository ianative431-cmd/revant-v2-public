import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const APP_SCHEME = "ne.revant.marketplace";
const androidRoot = resolve(process.cwd(), "android");
const stringsPath = resolve(androidRoot, "app/src/main/res/values/strings.xml");
const manifestPath = resolve(androidRoot, "app/src/main/AndroidManifest.xml");

let strings = await readFile(stringsPath, "utf8");
const stringPattern = /<string\s+name=["']custom_url_scheme["']>[^<]*<\/string>/;
const stringEntry = `    <string name="custom_url_scheme">${APP_SCHEME}</string>`;

if (stringPattern.test(strings)) {
  strings = strings.replace(stringPattern, stringEntry);
} else {
  strings = strings.replace(/<\/resources>/, `  ${stringEntry}\n</resources>`);
  if (!strings.includes(stringEntry)) {
    throw new Error("Could not register custom_url_scheme in strings.xml");
  }
}
await writeFile(stringsPath, strings);

let manifest = await readFile(manifestPath, "utf8");
const schemeFilterPresent = manifest.includes('android:scheme="@string/custom_url_scheme"');

if (!schemeFilterPresent) {
  const activityTags = [...manifest.matchAll(/<activity\b[^>]*>/g)];
  const activity = activityTags.find((match) => /MainActivity|BridgeActivity/.test(match[0])) ?? activityTags[0];
  if (!activity) throw new Error("Main Android activity not found in AndroidManifest.xml");

  const closingTagIndex = manifest.indexOf("</activity>", activity.index + activity[0].length);
  if (closingTagIndex < 0) throw new Error("Main Android activity closing tag not found");

  const intentFilter = `      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="@string/custom_url_scheme" android:host="auth" android:path="/callback" />
      </intent-filter>
`;
  manifest = manifest.slice(0, closingTagIndex) + intentFilter + manifest.slice(closingTagIndex);
}
await writeFile(manifestPath, manifest);

if (!strings.includes(`<string name="custom_url_scheme">${APP_SCHEME}</string>`)) {
  throw new Error("Deep-link scheme verification failed in strings.xml");
}
if (!manifest.includes('android:scheme="@string/custom_url_scheme"')) {
  throw new Error("Deep-link intent filter verification failed in AndroidManifest.xml");
}

process.stdout.write("Revant OAuth deep link registered: " + APP_SCHEME + "://auth/callback\n");
