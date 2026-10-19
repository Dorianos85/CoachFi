import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only quiz persistence integrity with synthetic local data and controlled faults.
  testMatch: ["quiz-save-integrity.spec.ts"],
  outputDir: "test-results/cycle-19",
});
