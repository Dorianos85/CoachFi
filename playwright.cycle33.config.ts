import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Bounded investing Review journey with synthetic guest data.
  testMatch: ["investing-basics-content.spec.ts"],
  outputDir: "test-results/cycle-33",
});
