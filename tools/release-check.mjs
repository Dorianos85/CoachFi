import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = process.cwd();
assert(fs.existsSync(path.join(root, "package-lock.json")));
const [mode, label, ...targets] = process.argv.slice(2);
assert(["tests", "typecheck"].includes(mode));
assert(/^[a-z0-9-]+$/.test(label));
const caseMarker = targets.indexOf("--cases");
const exactCases = caseMarker === -1 ? [] : targets.splice(caseMarker + 1);
if (caseMarker !== -1) targets.splice(caseMarker, 1);
assert(exactCases.every(name => typeof name === "string" && name.length > 0 && name.length < 1000));
assert(new Set(exactCases).size === exactCases.length);
assert(caseMarker === -1 || (mode === "tests" && targets.length > 0 && exactCases.length > 0));
assert(targets.every(t => /^(tests|lib)\/[A-Za-z0-9_./-]+\.test\.ts$/.test(t) && !t.includes("..")));
const evidence = path.resolve(root, "../../evidence/release-pr19-2026-10-19");
const output = path.join(evidence, label + "-tests.json");
const receipt = path.join(evidence, label + "-run.json");
const rawOutput = path.join(evidence, label + "-child.json");
for (const file of [receipt, rawOutput, ...(mode === "tests" ? [output] : [])]) {
  assert(!fs.existsSync(file), "Preserve previous run: " + file);
}
const req = createRequire(path.join(root, "package.json"));
const sha = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const sourceFiles = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", "app", "components", "context", "data", "lib", "styles", "types", "tests", "tools", "scripts", "package.json", "package-lock.json", "tsconfig.json", "vitest.config.ts", "vitest.cycle69.config.ts", "next.config.mjs", "tailwind.config.ts", "postcss.config.mjs"], { cwd: root }).toString().split("\0").filter(Boolean);
const pinPaths = [...new Set([...sourceFiles, ...targets, "evidence/cycle-69/network-guard.cjs", "evidence/cycle-69/worker-guard.ts", "evidence/cycle-69/journal.mjs", "node_modules/.package-lock.json", "node_modules/vitest/vitest.mjs", "node_modules/typescript/lib/_tsc.js", "node_modules/postcss-selector-parser/package.json"])].sort();
const inputPins = pinPaths.map(file => ({ file, sha256: sha(path.join(root, file)) }));
const expectedFiles = (targets.length ? targets : sourceFiles.filter(file => /^(lib|tests)\/.+\.test\.ts$/.test(file))).toSorted();
const env = {};
for (const name of ["PATH", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "OS", "PROCESSOR_ARCHITECTURE", "NUMBER_OF_PROCESSORS", "SYSTEMDRIVE", "TZ"]) {
  if (process.env[name] !== undefined) env[name] = process.env[name];
}
const runId = crypto.randomBytes(16).toString("hex");
const journal = path.join(root, "evidence/cycle-69", "guard-" + (mode === "tests" ? "focused" : "typecheck") + "-" + runId + ".jsonl");
fs.writeFileSync(journal, "", { flag: "wx" });
Object.assign(env, {
  NODE_ENV: "test", CI: "1", NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: "--require=" + path.join(root, "evidence/cycle-69/network-guard.cjs").replaceAll("\\", "/"),
  COACHFI_C69_GUARD_JOURNAL: journal,
});
const args = mode === "tests"
  ? [path.join(path.dirname(req.resolve("vitest/package.json")), "vitest.mjs"), "run", "--config", "vitest.cycle69.config.ts", "--maxWorkers=1", "--reporter=json", "--reporter=verbose", "--outputFile=" + output, ...targets, ...(exactCases.length ? ["--testNamePattern", "^(?:" + exactCases.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")$"] : [])]
  : [req.resolve("typescript/bin/tsc"), "--noEmit", "--incremental", "false"];
const startedAt = new Date().toISOString();
const result = spawnSync(process.execPath, args, { cwd: root, env, shell: false, windowsHide: true, encoding: "utf8", timeout: 600000, maxBuffer: 96 * 1024 * 1024 });
fs.writeFileSync(rawOutput, JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), pid: result.pid, args, status: result.status, signal: result.signal, error: result.error?.message ?? null, stdout: result.stdout, stderr: result.stderr }, null, 2), { flag: "wx" });
let journalResult = null, journalError = null, counts = null;
try {
  const parsed = mode === "tests" ? JSON.parse(fs.readFileSync(output)) : null;
  const files = parsed ? parsed.testResults.map(f => path.relative(root, f.name).replaceAll("\\", "/")).sort() : [];
  if (parsed) counts = { files: files.length, total: parsed.numTotalTests, passed: parsed.numPassedTests, failed: parsed.numFailedTests, skipped: parsed.numPendingTests };
  if (parsed) assert.deepEqual(files, expectedFiles, "Exact selected test-file coverage");
  if (parsed && exactCases.length) {
    const cases = parsed.testResults.flatMap(file => file.assertionResults);
    assert.deepEqual(cases.filter(test => test.status === "passed").map(test => test.fullName).sort(), exactCases.toSorted(), "Exact requested passing cases");
    assert(cases.every(test => exactCases.includes(test.fullName) ? test.status === "passed" : test.status === "skipped"), "Only named cases executed; other cases explicitly unselected");
    counts.unselected = cases.length - exactCases.length;
  }
  const { parseJournal } = await import(pathToFileURL(path.join(root, "evidence/cycle-69/journal.mjs")).href);
  const checked = parseJournal(fs.readFileSync(journal), { mode: mode === "tests" ? "app" : "typecheck", runId, mainPid: result.pid, expectedFiles: files });
  journalResult = { records: checked.records.length, epochs: checked.workerEpochs, nativeDenials: checked.nativeDenials.length, dbDenials: checked.dbDenials.length };
} catch (e) { journalError = String(e); }
const inputDrift = inputPins.filter(pin => !fs.existsSync(path.join(root, pin.file)) || sha(path.join(root, pin.file)) !== pin.sha256);
const status = result.status === 0 && !result.error && !journalError && inputDrift.length === 0 && (!counts || (counts.failed === 0 && (exactCases.length ? counts.passed === exactCases.length && counts.skipped === counts.unselected : counts.skipped === 0) && counts.total > 0)) ? "PASS" : "FAIL";
const summary = { at: new Date().toISOString(), label, mode, status, counts, exactCases, exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, inputPins, inputDrift, journal: { path: journal, result: journalResult, error: journalError }, qualification: "Fresh npm-ci runtime, install scripts disabled; local isolated tests only, all app workers deny native network and developer DB; no .env files loaded. Does not prove staging/Auth/RLS/provider/production readiness." };
fs.writeFileSync(receipt, JSON.stringify(summary, null, 2), { flag: "wx" });
console.log(JSON.stringify({ ...summary, inputPins: inputPins.length }, null, 2));
process.exitCode = status === "PASS" ? 0 : 1;
