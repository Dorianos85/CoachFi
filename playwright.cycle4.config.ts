import { defineConfig } from "@playwright/test";
import cycle2 from "./playwright.cycle2.config";

export default defineConfig({ ...cycle2,
  testMatch: [...(cycle2.testMatch as string[]), "storage-provenance.spec.ts"],
  outputDir: "test-results/cycle-4",
});
