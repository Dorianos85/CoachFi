import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Six existing foundations daily-challenge journeys with synthetic guest data.
  testMatch: ["challenge-foundations.spec.ts"],
  outputDir: "test-results/cycle-28",
});
