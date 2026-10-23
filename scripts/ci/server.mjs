import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { evaluateBuildJournal } from "./policy.mjs";

export function startGuardedServer({ root, directory, binding, env, next }) {
  const runId = crypto.randomBytes(16).toString("hex");
  const journal = path.join(root, `evidence/cycle-73/guard-build-${runId}.jsonl`);
  fs.writeFileSync(journal, "", { flag: "wx" });
  const child = spawn(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", "43192"], {
    cwd: root, env: { ...env, NODE_ENV: "production", COACHFI_C73_GUARD_JOURNAL: journal,
      NODE_OPTIONS: `--require="${path.join(root, "scripts/ci/serve-preload.cjs").replaceAll("\\", "/")}"` },
    shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "", stderr = "", processError = null, outputLimit = false;
  let resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const timeout = setTimeout(() => rejectReady(new Error("ci-server-start-timeout")), 60_000);
  const collect = (area, bytes) => {
    if (stdout.length + stderr.length + bytes.length > 8 * 1024 * 1024) {
      outputLimit = true; rejectReady(new Error("ci-server-output-limit")); return;
    }
    if (area === "stdout") { stdout += bytes.toString(); if (/Ready in\s/.test(stdout)) resolveReady(); }
    else stderr += bytes.toString();
  };
  child.stdout.on("data", bytes => collect("stdout", bytes)); child.stderr.on("data", bytes => collect("stderr", bytes));
  child.on("error", error => { processError = error.code ?? "spawn-error"; rejectReady(new Error("ci-server-process-error")); });
  const closed = new Promise(resolve => child.once("close", (status, signal) => {
    clearTimeout(timeout); rejectReady(new Error("ci-server-exited-before-ready")); resolve({ status, signal });
  }));
  return {
    ready: ready.finally(() => clearTimeout(timeout)),
    async stop() {
      child.kill("SIGTERM");
      let forced = false;
      const timer = setTimeout(() => { forced = true; child.kill("SIGKILL"); }, 10_000);
      const result = await closed; clearTimeout(timer);
      const write = (name, value) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
      write("ui-server-raw.json", { pid: child.pid, ...result, processError, forced, stdout, stderr });
      // Even a failed browser run must close and inspect server-native activity.
      const summary = { status: "FAIL", binding, process: { ...result, processError, forced }, guard: null };
      try {
        assert(!processError && !forced && !outputLimit, "ci-server-process-error");
        assert(result.status === 0 || result.signal === "SIGTERM", "ci-server-abnormal-exit");
        summary.guard = evaluateBuildJournal(fs.readFileSync(journal), runId, child.pid);
        summary.status = "PASS";
      } finally { write("ui-server-summary.json", summary); }
      return summary;
    },
  };
}
