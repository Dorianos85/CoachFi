import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // The root runner uses the same source-verified TEMP copy already built once.
  testMatch: ["cycle40-quiz-query.spec.ts"],
  outputDir: "test-results/cycle-40",
  workers: 1,
  retries: 0,
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 43191",
    url: "http://127.0.0.1:43191",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
