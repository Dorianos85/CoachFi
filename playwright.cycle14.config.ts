import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only the inflation calculator changed. Keep eight new PL/EN paths bounded.
  testMatch: ["inflation-calculator-integrity.spec.ts"],
  outputDir: "test-results/cycle-14",
});
