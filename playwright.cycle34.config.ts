import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Bounded macro Review journey with synthetic guest data.
  testMatch: ["macro-content.spec.ts"],
  outputDir: "test-results/cycle-34",
});
