import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { commandSucceeded, evaluateAudit, evaluateBrowser, evaluateBuildJournal, evaluateVitest, failureCategory, validateReceipt } from "./policy.mjs";
import { startGuardedServer } from "./server.mjs";
import { validateDatabaseLock, validateDatabaseResult, migrationFiles } from "../../tools/staging-db/policy.mjs";

const root = fs.realpathSync(fileURLToPath(new URL("../../", import.meta.url)));
assert.equal(fs.realpathSync(process.cwd()), root, "ci-root-mismatch");
const [stage, ...extra] = process.argv.slice(2);
assert(["hygiene", "install", "typecheck", "unit", "database", "build", "browser-install", "ui", "audit"].includes(stage) && extra.length === 0, "ci-stage");
const runIdentity = process.env.COACHFI_CI_RUN_ID;
assert(typeof runIdentity === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(runIdentity), "ci-run-identity");
const directory = path.join(root, ".tmp/ci", runIdentity); fs.mkdirSync(directory, { recursive: true });
const require = createRequire(path.join(root, "package.json"));
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const write = (name, value) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
const normalizedRoot = root.replaceAll("\\", "/");
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
const relative = file => path.relative(root, file).replaceAll("\\", "/");
const safeMessage = error => {
  // Assertion categories only; never publish arbitrary child output or provider/env content.
  const message = typeof error?.message === "string" ? error.message.split("\n")[0] : "ci-stage-error";
  return /^[a-z][a-z0-9-]{0,70}$/.test(message) ? message : "ci-stage-validation-error";
};
let binding = null;
const raw = [];
const report = { stage, status: "FAIL", category: null, reason: null, binding: null, details: {} };
function noEnvFiles() {
  assert(!fs.readdirSync(root).some(name => /^\.env(?:\.|$)/.test(name) && name !== ".env.example"), "ci-env-file-present");
}
function cleanEnvironment() {
  const env = {};
  for (const key of ["PATH", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "OS", "PROCESSOR_ARCHITECTURE", "NUMBER_OF_PROCESSORS", "SYSTEMDRIVE", "LANG"]) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  Object.assign(env, { CI: "true", NODE_ENV: "test", NEXT_TELEMETRY_DISABLED: "1", TZ: "Europe/Warsaw",
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:43192", NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED: "0",
    NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON: "0", NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS: "0",
    COACHFI_CI_EXPECTED_SHA: binding.expectedSHA, COACHFI_CI_RUN_ID: binding.runId, PLAYWRIGHT_BROWSERS_PATH: path.join(directory, "browsers"),
    NPM_CONFIG_REGISTRY: "https://registry.npmjs.org/", NPM_CONFIG_IGNORE_SCRIPTS: "true",
    NPM_CONFIG_AUDIT: "false", NPM_CONFIG_FUND: "false", NPM_CONFIG_CACHE: path.join(directory, "npm-cache"),
    NPM_CONFIG_USERCONFIG: path.join(directory, "empty-user.npmrc"), NPM_CONFIG_GLOBALCONFIG: path.join(directory, "empty-global.npmrc") });
  for (const file of [env.NPM_CONFIG_USERCONFIG, env.NPM_CONFIG_GLOBALCONFIG]) if (!fs.existsSync(file)) fs.writeFileSync(file, "", { flag: "wx" });
  return env;
}
function npmCli() {
  const bin = path.dirname(process.execPath);
  const found = [path.join(bin, "node_modules/npm/bin/npm-cli.js"), path.resolve(bin, "../lib/node_modules/npm/bin/npm-cli.js")].find(file => fs.existsSync(file));
  assert(found, "ci-npm-cli-unavailable"); return found;
}
function run(label, args, env, timeout = 300_000) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, encoding: "utf8", shell: false, windowsHide: true,
    timeout, maxBuffer: 96 * 1024 * 1024 });
  // Preserve raw local evidence before any interpretation. It is never uploaded or echoed.
  write(`${stage}-${label}-raw.json`, { command: ["node", ...args.map(arg => path.isAbsolute(arg) ? relative(arg) : arg)],
    status: result.status, signal: result.signal, error: result.error ? { code: result.error.code ?? null } : null,
    stdout: result.stdout ?? "", stderr: result.stderr ?? "" });
  raw.push({ label, result }); return result;
}
function requireSuccess(result) {
  assert(commandSucceeded(result), "ci-child-failed");
}
function receiptRequired(name) {
  const previous = JSON.parse(fs.readFileSync(path.join(directory, `${name}-summary.json`), "utf8"));
  validateReceipt(previous, binding);
}
function filesEnding(extension) {
  const files = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      assert(!entry.isSymbolicLink(), "ci-test-symlink");
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith(extension)) files.push(relative(full));
    }
  };
  for (const dir of ["lib", "tests"]) visit(path.join(root, dir));
  return files.sort();
}
function boundedDiagnostics(result, kind) {
  const source = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replaceAll(root, "<workspace>").replaceAll(normalizedRoot, "<workspace>");
  if (kind === "typecheck") return source.split(/\r?\n/).flatMap(line => {
    const match = /^([A-Za-z0-9_./-]+)\((\d+),(\d+)\): error (TS\d+):/.exec(line);
    return match ? [{ file: match[1], line: Number(match[2]), column: Number(match[3]), code: match[4] }] : [];
  }).slice(0, 100);
  // Fixed categories help diagnose a red build without copying arbitrary source/secret text.
  const markers = ["Module not found", "Type error", "Failed to compile", "Error: E", "Error occurred prerendering", "AssertionError", "Cannot find module"]
    .filter(marker => source.includes(marker)).map(marker => ({ marker }));
  const files = source.split(/\r?\n/).flatMap(line => {
    const match = /^(?:\.\/)?((?:app|components|context|lib|scripts|styles|tests|types)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|mjs|js|css))(?::\d+)?/.exec(line);
    return match && !match[1].includes("..") ? [{ file: match[1] }] : [];
  }).slice(0, 100);
  return [...markers, ...files];
}
try {
  const expectedSHA = process.env.COACHFI_CI_EXPECTED_SHA;
  assert(typeof expectedSHA === "string" && /^[a-f0-9]{40}$/.test(expectedSHA), "ci-expected-sha-required");
  const actualSHA = git(["rev-parse", "HEAD"]).trim();
  binding = { runId: runIdentity, expectedSHA, actualSHA, lockSHA256: hash(fs.readFileSync(path.join(root, "package-lock.json"))),
    node: process.version, runtime: "Node24 major selected; exact observed patch recorded, not pinned" };
  report.binding = binding;
  assert.equal(actualSHA, expectedSHA, "ci-checkout-sha-mismatch");
  noEnvFiles();
  if (!["hygiene", "audit"].includes(stage)) receiptRequired("hygiene");
  if (!["hygiene", "audit", "install"].includes(stage)) receiptRequired("install");
  const env = cleanEnvironment();
  if (stage === "hygiene") {
    const child = run("metadata", ["scripts/check-repo-hygiene.mjs", "--scan-secrets", "--json"], env);
    const value = JSON.parse(child.stdout);
    assert(value && typeof value.ok === "boolean" && Array.isArray(value.findings), "ci-hygiene-schema");
    report.details = { trackedFiles: value.trackedFiles, scannedTextFiles: value.scannedTextFiles,
      findings: value.findings.map(({ rule, file, line }) => ({ rule, file, line })) };
    assert(value.ok && value.findings.length === 0, "ci-hygiene-findings"); requireSuccess(child);
  } else if (stage === "install") {
    const child = run("npm-ci", [npmCli(), "ci", "--ignore-scripts", "--no-audit", "--no-fund"], env);
    requireSuccess(child);
    const version = run("npm-version", [npmCli(), "--version"], env, 15_000); requireSuccess(version);
    assert(/^\d+\.\d+\.\d+\s*$/.test(version.stdout), "ci-npm-version");
    report.details = { npm: version.stdout.trim(), lifecycleScripts: "disabled", lockSHA256: binding.lockSHA256 };
  } else if (stage === "audit") {
    const version = run("npm-version", [npmCli(), "--version"], env, 15_000); requireSuccess(version);
    assert(/^\d+\.\d+\.\d+\s*$/.test(version.stdout), "ci-npm-version");
    const child = run("npm-audit", [npmCli(), "audit", "--package-lock-only", "--include=dev", "--include=optional", "--include=peer", "--json"], { ...env, NPM_CONFIG_AUDIT: "true" });
    const evidence = JSON.parse(child.stdout); write("audit-evidence.json", evidence);
    if (evidence?.error) report.details.registryErrorCode = /^[A-Z0-9_]{1,40}$/.test(evidence.error.code) ? evidence.error.code : "unclassified-registry-error";
    report.details = { npm: version.stdout.trim(), rawSHA256: hash(child.stdout), ...evaluateAudit(evidence, child) };
    assert(report.details.accepted, "ci-audit-open-vulnerabilities");
  } else if (stage === "typecheck") {
    const child = run("tsc", [require.resolve("typescript/bin/tsc"), "--noEmit", "--incremental", "false"], env);
    report.details = { diagnostics: boundedDiagnostics(child, "typecheck") }; requireSuccess(child);
  } else if (stage === "unit") {
    const expectedFiles = filesEnding(".test.ts");
    const runId = crypto.randomBytes(16).toString("hex");
    const journal = path.join(root, `evidence/cycle-69/guard-focused-${runId}.jsonl`); fs.writeFileSync(journal, "", { flag: "wx" });
    const guardedEnv = { ...env, NODE_OPTIONS: `--require="${path.join(root, "evidence/cycle-69/network-guard.cjs").replaceAll("\\", "/")}"`, COACHFI_C69_GUARD_JOURNAL: journal };
    const child = run("vitest", [path.join(path.dirname(require.resolve("vitest/package.json")), "vitest.mjs"), "run", "--config", "vitest.ci.config.ts", "--maxWorkers=1", "--reporter=json", `--outputFile=${path.join(directory, "unit-report.json")}`], guardedEnv, 480_000);
    const parsed = JSON.parse(fs.readFileSync(path.join(directory, "unit-report.json"), "utf8"));
    report.details = { failedSuites: Array.isArray(parsed?.testResults) ? parsed.testResults.filter(file => file.status === "failed")
      .map(file => file.name?.replaceAll("\\", "/")).filter(file => typeof file === "string" && file.startsWith(normalizedRoot + "/"))
      .map(file => ({ file: file.slice(normalizedRoot.length + 1) })).slice(0, 100) : [] };
    report.details = { ...report.details, ...evaluateVitest(parsed, expectedFiles, normalizedRoot) };
    const { parseJournal } = await import("../../evidence/cycle-69/journal.mjs");
    const checked = parseJournal(fs.readFileSync(journal), { mode: "app", runId, mainPid: child.pid, expectedFiles });
    report.details.guard = { records: checked.records.length, guardedFileEpochs: checked.workerEpochs, nativeDenials: checked.nativeDenials.length, dbDenials: checked.dbDenials.length };
    const nativeFiles = filesEnding(".test.mjs"); assert(nativeFiles.length > 0, "ci-native-tests-empty");
    const native = run("native-tests", ["--test", "--test-reporter=tap", ...nativeFiles], env);
    report.details.nativeFiles = nativeFiles;
    report.details.nativeFailures = (native.stdout ?? "").split(/\r?\n/).filter(line => /^not ok \d+ - /.test(line)).map(line => line.slice(0, 500));
    requireSuccess(native); requireSuccess(child); assert(report.details.accepted, "ci-unit-failed-or-skipped");
  } else if (stage === "database") {
    const childRoot = path.join(root, "tools/staging-db");
    const childLock = fs.readFileSync(path.join(childRoot, "package-lock.json"));
    const childManifest = fs.readFileSync(path.join(childRoot, "package.json"));
    validateDatabaseLock(JSON.parse(childManifest), JSON.parse(childLock));
    const childLockSHA256 = hash(childLock);
    requireSuccess(run("database-install", [npmCli(), "ci", "--prefix", childRoot, "--ignore-scripts", "--no-audit", "--no-fund"], env));
    const audit = run("database-audit", [npmCli(), "audit", "--prefix", childRoot, "--package-lock-only", "--include=dev", "--include=optional", "--include=peer", "--json"], { ...env, NPM_CONFIG_AUDIT: "true" });
    report.details = { childLockSHA256, audit: evaluateAudit(JSON.parse(audit.stdout), audit) };
    assert(report.details.audit.accepted, "ci-database-audit-open-vulnerabilities");
    const child = run("database-check", ["tools/staging-db/check.mjs"], env, 150_000); requireSuccess(child);
    const checked = JSON.parse(child.stdout);
    assert(checked.status === "PASS" && checked.head === binding.actualSHA && checked.guard?.denials === 0, "ci-database-check-failed");
    validateDatabaseResult(checked.details, migrationFiles.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(root, "supabase/migrations", file))) })));
    assert.equal(hash(fs.readFileSync(path.join(childRoot, "package-lock.json"))), childLockSHA256, "ci-database-lock-changed");
    assert(fs.readFileSync(path.join(childRoot, "package.json")).equals(childManifest), "ci-database-manifest-changed");
    report.details = { ...report.details, guard: checked.guard, ...checked.details };
  } else if (stage === "build") {
    const runId = crypto.randomBytes(16).toString("hex");
    const journal = path.join(root, `evidence/cycle-73/guard-build-${runId}.jsonl`); fs.writeFileSync(journal, "", { flag: "wx" });
    const child = run("next", [require.resolve("next/dist/bin/next"), "build"], { ...env, NODE_ENV: "production",
      NODE_OPTIONS: `--require="${path.join(root, "evidence/cycle-73/network-guard.cjs").replaceAll("\\", "/")}"`,
      COACHFI_C73_GUARD_JOURNAL: journal, NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.join(root, "evidence/cycle-73/font-responses.cjs") }, 480_000);
    report.details = { diagnostics: boundedDiagnostics(child, "build"), font: "C73 synthetic offline CSS, no font-fidelity acceptance" };
    report.details.guard = evaluateBuildJournal(fs.readFileSync(journal), runId, child.pid);
    requireSuccess(child);
    const routes = JSON.parse(fs.readFileSync(path.join(root, ".next/server/app-paths-manifest.json"), "utf8"));
    assert(routes && typeof routes === "object" && Object.keys(routes).length > 0, "ci-build-empty-manifest");
    report.details.appPaths = Object.keys(routes).sort();
  } else if (stage === "browser-install") {
    receiptRequired("build");
    requireSuccess(run("chromium", [path.join(path.dirname(require.resolve("@playwright/test/package.json")), "cli.js"), "install", "--with-deps", "chromium"], env));
    report.details = { browser: "Playwright bundled Chromium", source: "standard installed Playwright distribution" };
  } else if (stage === "ui") {
    receiptRequired("build"); receiptRequired("browser-install");
    const server = startGuardedServer({ root, directory, binding, env, next: require.resolve("next/dist/bin/next") });
    let child;
    try {
      await server.ready;
      child = run("playwright", [path.join(path.dirname(require.resolve("@playwright/test/package.json")), "cli.js"), "test", "--config", "scripts/ci/playwright.config.mjs"], env, 360_000);
    } finally { report.details.server = await server.stop(); }
    const parsed = JSON.parse(fs.readFileSync(path.join(directory, "browser-report.json"), "utf8"));
    const checked = evaluateBrowser(parsed);
    report.details = { ...report.details, browser: "Playwright bundled Chromium", ...checked,
      qualification: "Bounded loopback fixture interception and selected flows; no whole-browser/OS network-isolation claim, real fonts/Auth/provider/staging/production acceptance." };
    assert(checked.accepted, "ci-browser-failed-or-skipped"); requireSuccess(child);
  }
  assert.equal(hash(fs.readFileSync(path.join(root, "package-lock.json"))), binding.lockSHA256, "ci-lock-changed");
  assert.equal(git(["rev-parse", "HEAD"]).trim(), binding.actualSHA, "ci-head-changed");
  report.status = "PASS";
} catch (error) {
  report.category = raw.some(row => !commandSucceeded(row.result)) ? "child-failure" : "validation-failure";
  report.reason = safeMessage(error);
  report.details.processes = raw.map(({ label, result }) => ({ label, exitCode: result.status, signal: result.signal, category: failureCategory(result) }));
}
write(`${stage}-summary.json`, report);
// Only this fixed-schema, bounded summary is durable in public CI logs. No raw output/artifact upload.
console.log(JSON.stringify(report, null, 2));
if (process.env.GITHUB_STEP_SUMMARY && /^\//.test(process.env.GITHUB_STEP_SUMMARY)) {
  const title = `### ${stage}: ${report.status}\n`;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, title + "```json\n" + JSON.stringify(report, null, 2) + "\n```\n");
}
process.exitCode = report.status === "PASS" ? 0 : 1;
