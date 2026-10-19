import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Root must verify the C66 controlled built TEMP585pre/584post before baseline; acceptance uses a new build.
  testMatch: ["cycle67-shopping-counts.spec.ts"],
  outputDir: "test-results/cycle-67",
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