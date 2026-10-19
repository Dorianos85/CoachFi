import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

// Reuse the isolated localhost server and temporary browser context from P0.
// Keep accepted safety flows and add the new diagnosis scenarios explicitly.
export default defineConfig({
  ...p0,
  testMatch: ["p0-safety.spec.ts", "health-integrity.spec.ts", "health-funnel.spec.ts"],
  outputDir: "test-results/cycle-2",
});
