import { defineConfig } from "@playwright/test";
import cycle5 from "./playwright.cycle5.config";

export default defineConfig({ ...cycle5,
  testMatch: [...(cycle5.testMatch as string[]), "mindset-content.spec.ts"],
  outputDir: "test-results/cycle-6",
});
