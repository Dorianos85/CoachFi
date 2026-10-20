import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Root starts the separately built, font-mocked TEMP server. Never start a dev
// server or download a browser from this config; Chrome uses a fresh test profile.
const evidence = fileURLToPath(new URL("../../evidence/adult-family-2026-10-20/", import.meta.url));
const label = process.env.COACHFI_AUDIENCE_RUN_LABEL ?? "initial";
if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(label)) throw new Error("Invalid local browser run label");
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "adult-family-paths.spec.ts",
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: `${evidence}/browser-${label}-results.json` }]],
  outputDir: `${evidence}/browser-${label}`,
  use: {
    baseURL: process.env.COACHFI_AUDIENCE_BASE_URL ?? "http://127.0.0.1:43191",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    video: "off",
    timezoneId: "Europe/Warsaw",
  },
  projects: [{ name: "chrome-local", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
