import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const polishCopyFiles = [
  "lib/i18n/pl.ts",
  "lib/i18n/index.ts",
  "lib/localizedContent.ts",
  "lib/voiceDemoScripts.ts",
  "app/avatar/page.tsx",
  "app/coach/page.tsx",
  "app/privacy/page.tsx",
];

const invalidAdjectiveForms = [
  "Mi\u0142a",
  "Mi\u0142y",
  "Mi\u0142\u0105",
  "Mi\u0142\u0119",
];

describe("Mila Polish brand grammar", () => {
  it.each(polishCopyFiles)("uses Mila as a proper name in %s", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");

    for (const invalidForm of invalidAdjectiveForms) {
      expect(source).not.toContain(invalidForm);
    }
  });

  it("localizes the global voice call to action", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/MilaVoiceAgent.tsx"),
      "utf8",
    );

    expect(source).toContain("{t.voiceAgent.fab}");
    expect(source).not.toContain("Talk to your coach");
  });
});
