import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only Review persistence integrity with synthetic local cards and controlled faults.
  testMatch: ["review-save-integrity.spec.ts"],
  outputDir: "test-results/cycle-18",
});
