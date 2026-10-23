import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Five existing survey and reserve daily-challenge journeys with synthetic guest data.
  testMatch: ["challenge-survey.spec.ts"],
  outputDir: "test-results/cycle-30",
});
