import { defineConfig } from "@playwright/test";
import cycle7 from "./playwright.cycle7.config";

export default defineConfig({ ...cycle7,
  // QuizCard/Page changed: eight affected cases and four save-failure cases.
  testMatch: ["mindset-content.spec.ts", "token-integrity.spec.ts", "quiz-save-failure.spec.ts"],
  outputDir: "test-results/cycle-8",
});
