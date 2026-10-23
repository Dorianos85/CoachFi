import base from "./vitest.config";
import { defineConfig } from "vitest/config";

// Same normal configuration; only the selected installed-parser file is run.
export default defineConfig({ ...base, envDir: false, cacheDir: "node_modules/.vite-coachfi-c73",
  test: { ...base.test, cache: false, setupFiles: ["./evidence/cycle-73/worker-guard.ts"] },
});
