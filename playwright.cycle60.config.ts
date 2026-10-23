import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Root verifies the unchanged C59 built TEMP before baseline; acceptance uses a new controlled build.
  testMatch: ["cycle60-income-planner.spec.ts"],
  outputDir: "test-results/cycle-60",
  workers: 1,
  retries: 0,
  use: { ...p0.use, trace: "off" },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 43191",
    url: "http://127.0.0.1:43191",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
