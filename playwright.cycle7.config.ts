import { defineConfig } from "@playwright/test";
import cycle6 from "./playwright.cycle6.config";

export default defineConfig({ ...cycle6,
  // QuizCard/tokens changed: six affected C6 scenarios plus two new error/retry cases.
  testMatch: ["mindset-content.spec.ts", "token-integrity.spec.ts"],
  outputDir: "test-results/cycle-7",
});
