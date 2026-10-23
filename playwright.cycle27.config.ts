import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Bounded c15 daily-challenge journey with synthetic guest data.
  testMatch: ["challenge-content.spec.ts"],
  outputDir: "test-results/cycle-27",
});
