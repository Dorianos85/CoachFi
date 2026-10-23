import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only the changed daily-challenge flow; other green browser paths stay frozen.
  testMatch: ["challenge-save-failure.spec.ts"],
  outputDir: "test-results/cycle-9",
});
