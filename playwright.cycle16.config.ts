import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only the new credit learning and quiz paths; previous modules remain separately bounded.
  testMatch: ["credit-content.spec.ts"],
  outputDir: "test-results/cycle-16",
});
