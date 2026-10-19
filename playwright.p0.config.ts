import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "p0-safety.spec.ts",
  timeout: 90_000,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results/p0",
  use: { baseURL: "http://127.0.0.1:43191", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: {
    ...devices["Desktop Chrome"],
    channel: process.env.COACHFI_P0_BROWSER_CHANNEL,
  } }],
  webServer: {
    command: "node scripts/start-p0-test-server.mjs",
    url: "http://127.0.0.1:43191",
    reuseExistingServer: process.env.COACHFI_P0_REUSE_SERVER === "1",
    timeout: 120_000,
  },
});
