import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only the new emergency learning and quiz paths; previous modules remain separately bounded.
  testMatch: ["emergency-content.spec.ts"],
  outputDir: "test-results/cycle-17",
});
