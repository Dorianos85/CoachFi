import base from "./vitest.config";
import { defineConfig } from "vitest/config";

// Preserve the complete normal test include. No .env loading, retries or exclusions.
export default defineConfig({ ...base, envDir: false, cacheDir: "node_modules/.vite-coachfi-ci",
  test: { ...base.test, cache: false, maxWorkers: 1, retry: 0,
    setupFiles: ["./evidence/cycle-69/worker-guard.ts"] },
});
