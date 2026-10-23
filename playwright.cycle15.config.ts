import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Only the new inflation learning and quiz paths; calculator is unchanged.
  testMatch: ["inflation-content.spec.ts"],
  outputDir: "test-results/cycle-15",
});
