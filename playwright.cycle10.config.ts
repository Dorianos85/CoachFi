import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  testMatch: ["crisis-save-failure.spec.ts"],
  outputDir: "test-results/cycle-10",
});
