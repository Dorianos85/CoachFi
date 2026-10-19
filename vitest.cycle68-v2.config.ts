import base from "./vitest.config";
import { defineConfig } from "vitest/config";

// Normal include/aliases/JSX runtime; no project .env reads and no real worker I/O.
export default defineConfig({ ...base, envDir: false, cacheDir: "node_modules/.vite-coachfi-c68-v2",
  test: { ...base.test, cache: false, setupFiles: ["./evidence/cycle-68/worker-guard-v2.ts"] },
});
