import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Shared topic resolver and banks changed: saving flow and the six affected C6 cases.
  testMatch: ["saving-content.spec.ts", "mindset-content.spec.ts"],
  outputDir: "test-results/cycle-11",
});
