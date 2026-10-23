import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Bounded financial-literacy Review journey with synthetic guest data.
  testMatch: ["literacy-content.spec.ts"],
  outputDir: "test-results/cycle-26",
});
