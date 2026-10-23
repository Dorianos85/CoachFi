import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Root uses the same source-verified TEMP copy after its single build.
  testMatch: ["cycle52-avatar-preview.spec.ts"],
  outputDir: "test-results/cycle-52",
  workers: 1,
  retries: 0,
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 43191",
    url: "http://127.0.0.1:43191",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
