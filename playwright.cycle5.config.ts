import { defineConfig } from "@playwright/test";
import cycle4 from "./playwright.cycle4.config";

export default defineConfig({ ...cycle4, outputDir: "test-results/cycle-5" });
