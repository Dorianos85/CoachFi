import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const runId = process.env.COACHFI_CI_RUN_ID;
if (typeof runId !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(runId)) throw new Error("ci-run-identity");
export default defineConfig({
  testDir: root + "tests/e2e", testMatch: ["adult-family-paths.spec.ts", "dependency-design-regression.spec.ts"], workers: 1, retries: 0,
  timeout: 60_000, forbidOnly: true, outputDir: root + `.tmp/ci/${runId}/browser-output`,
  reporter: [["json", { outputFile: root + `.tmp/ci/${runId}/browser-report.json` }]],
  use: { baseURL: "http://127.0.0.1:43192", serviceWorkers: "block", trace: "off", video: "off", timezoneId: "Europe/Warsaw" },
  projects: [{ name: "ci-bundled-chromium", use: { ...devices["Desktop Chrome"], browserName: "chromium" } }],
});
