import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Bounded retirement terms Review journey with synthetic guest data.
  testMatch: ["retirement-terms-content.spec.ts"],
  outputDir: "test-results/cycle-36",
});
