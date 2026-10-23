import { defineConfig } from "@playwright/test";
import p0 from "./playwright.p0.config";

export default defineConfig({ ...p0,
  // Root validates the unchanged, already built C57 TEMP before the native baseline.
  testMatch: ["cycle58-consent-dialog.spec.ts"],
  outputDir: "test-results/cycle-58",
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
