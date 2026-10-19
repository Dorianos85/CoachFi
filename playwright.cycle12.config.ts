import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Lesson writer changed for both pages: new failure cases plus affected saving/mindset flows.
  testMatch: ["lesson-step-integrity.spec.ts", "saving-content.spec.ts", "mindset-content.spec.ts"],
  outputDir: "test-results/cycle-12",
});
