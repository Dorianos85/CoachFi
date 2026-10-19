import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Timer/local coach changed; retain only affected old coach/provider and read-aloud scenarios.
  testMatch: ["agent-time-integrity.spec.ts", "p0-safety.spec.ts"],
  grep: /local education remains available with honest duration outcome|optional consent never mounts the disabled voice widget and guest chat remains local|local read-aloud starts only on click/,
  outputDir: "test-results/cycle-13",
});
