import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error CI policy is a dependency-free JavaScript tool, not application TypeScript.
import { commandSucceeded, evaluateAudit, evaluateBrowser, evaluateBuildJournal, evaluateVitest, expectedBrowserCases, failureCategory, validateReceipt } from "../scripts/ci/policy.mjs";

const success = { status: 0, signal: null, error: null };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const cleanAudit = () => ({ auditReportVersion: 2, vulnerabilities: {}, metadata: {
  vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
} });
const unit = () => ({ success: true, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0,
  testResults: [{ name: "/fixture/tests/example.test.ts", assertionResults: [{ fullName: "example rejects an invalid input", status: "passed" }] }] });

describe("CI admission policy: failures cannot become acceptance", () => {
  it("requires the same run identity as well as successful source-bound prerequisites", () => {
    const binding = { runId: "123-1-quality", expectedSHA: "a".repeat(40), actualSHA: "a".repeat(40), lockSHA256: "b".repeat(64) };
    expect(() => validateReceipt({ status: "PASS", binding }, binding)).not.toThrow();
    for (const key of ["runId", "expectedSHA", "actualSHA", "lockSHA256"] as const)
      expect(() => validateReceipt({ status: "PASS", binding: { ...binding, [key]: "old-value" } }, binding)).toThrow(/ci-prerequisite-stale-run-or-source/);
    expect(() => validateReceipt({ status: "FAIL", binding }, binding)).toThrow(/ci-prerequisite-failed/);
  });
  it("accepts only a complete consistent zero-vulnerability audit", () => {
    expect(evaluateAudit(cleanAudit(), success)).toMatchObject({ accepted: true, counts: { total: 0 } });
    for (const value of [null, {}, [], { auditReportVersion: 2 }, { ...cleanAudit(), error: { code: "REGISTRY_ERROR" } }])
      expect(() => evaluateAudit(value, success)).toThrow();
  });
  it.each(["info", "low", "moderate", "high", "critical"] as const)("keeps %s findings visible and rejects acceptance", severity => {
    const report = cleanAudit() as ReturnType<typeof cleanAudit> & { vulnerabilities: Record<string, unknown> };
    report.metadata.vulnerabilities[severity] = 1; report.metadata.vulnerabilities.total = 1;
    report.vulnerabilities["test-package"] = { name: "test-package", severity, isDirect: false,
      nodes: ["node_modules/test-package"], via: [{ source: 1234, severity, url: "https://github.com/advisories/GHSA-test-test-test" }] };
    const checked = evaluateAudit(report, { ...success, status: 1 });
    expect(checked.accepted).toBe(false); expect(checked.counts[severity]).toBe(1);
    expect(checked.vulnerabilities).toHaveLength(1);
    expect(() => evaluateAudit(report, success)).toThrow(/audit-process-status/);
  });
  it("rejects missing counts, contradictory counts and unknown advisory paths", () => {
    const missing = cleanAudit(); delete (missing.metadata.vulnerabilities as Partial<typeof missing.metadata.vulnerabilities>).high;
    const sum = cleanAudit(); sum.metadata.vulnerabilities.total = 1;
    const unknown = cleanAudit() as ReturnType<typeof cleanAudit> & { vulnerabilities: Record<string, unknown> };
    unknown.metadata.vulnerabilities.high = 1; unknown.metadata.vulnerabilities.total = 1;
    unknown.vulnerabilities.example = { name: "example", severity: "high", isDirect: true,
      nodes: ["node_modules/example"], via: ["missing-package"] };
    for (const value of [missing, sum, unknown]) expect(() => evaluateAudit(value, { ...success, status: 1 })).toThrow();
  });
  it("rejects a nominal clean audit when the process fails or times out", () => {
    for (const result of [{ ...success, status: 1 }, { ...success, signal: "SIGTERM" },
      { ...success, error: { code: "ETIMEDOUT" } }, { ...success, status: null }])
      expect(() => evaluateAudit(cleanAudit(), result)).toThrow(/audit-process-status/);
  });
  it("distinguishes timeout, signal and nonzero exit from successful execution", () => {
    expect(commandSucceeded(success)).toBe(true);
    for (const [result, category] of [[{ ...success, error: { code: "ETIMEDOUT" } }, "timeout"],
      [{ ...success, signal: "SIGKILL" }, "signal"], [{ ...success, status: 1 }, "nonzero-exit"],
      [{ ...success, error: { code: "ENOENT" } }, "process-error"]] as const) {
      expect(commandSucceeded(result)).toBe(false); expect(failureCategory(result)).toBe(category);
    }
  });
  it("accepts exact nonempty unit coverage and reports relative failed test identity", () => {
    expect(evaluateVitest(unit(), ["tests/example.test.ts"], "/fixture").accepted).toBe(true);
    const failed = unit(); failed.success = false; failed.numPassedTests = 0; failed.numFailedTests = 1;
    failed.testResults[0].assertionResults[0].status = "failed";
    expect(evaluateVitest(failed, ["tests/example.test.ts"], "/fixture")).toMatchObject({ accepted: false,
      failures: [{ file: "tests/example.test.ts", name: "example rejects an invalid input", status: "failed" }] });
  });
  it("rejects empty collection, mismatched files, fabricated counts and skipped tests", () => {
    const empty = unit(); empty.testResults[0].assertionResults = []; empty.numTotalTests = 0; empty.numPassedTests = 0;
    const mismatch = unit(); mismatch.testResults[0].name = "/fixture/tests/unexpected.test.ts";
    const forged = unit(); forged.numPassedTests = 12;
    for (const value of [empty, mismatch, forged]) expect(() => evaluateVitest(value, ["tests/example.test.ts"], "/fixture")).toThrow();
    const skipped = unit(); skipped.numPassedTests = 0; skipped.numPendingTests = 1; skipped.testResults[0].assertionResults[0].status = "pending";
    expect(evaluateVitest(skipped, ["tests/example.test.ts"], "/fixture").accepted).toBe(false);
  });
  it("requires initialized build contexts and rejects every observed denial even after a caught error", () => {
    const runId = "a".repeat(32), mainPid = 42;
    const rows = [{ event: "capture-ready", pid: mainPid, runId, threadId: 0 },
      { event: "native-ready", pid: mainPid, runId, threadId: 0 }];
    const bytes = (value: unknown[]) => Buffer.from(value.map(row => JSON.stringify(row)).join("\n") + "\n");
    expect(evaluateBuildJournal(bytes(rows), runId, mainPid).denials).toBe(0);
    expect(() => evaluateBuildJournal(bytes(rows.slice(0, 1)), runId, mainPid)).toThrow();
    expect(() => evaluateBuildJournal(bytes([...rows, { event: "native-denial", pid: mainPid, runId, threadId: 0 }]), runId, mainPid)).toThrow();
    expect(() => evaluateBuildJournal(Buffer.from(""), runId, mainPid)).toThrow();
  });
  it("requires exactly the six reviewed browser identities and one passing attempt per case", () => {
    const report = { errors: [], suites: [{ specs: expectedBrowserCases.map((test: { file: string; name: string }) => ({ file: test.file,
      title: test.name, tests: [{ projectName: "ci-bundled-chromium", results: [{ status: "passed" }] }] })) }] };
    expect(evaluateBrowser(report).accepted).toBe(true);
    const missing = clone(report); missing.suites[0].specs.pop();
    expect(() => evaluateBrowser(missing)).toThrow(/browser-exact-case-count/);
    const unknown = clone(report); unknown.suites[0].specs[0].title = "unexpected case";
    expect(() => evaluateBrowser(unknown)).toThrow(/browser-exact-case-identities/);
    const retried = clone(report); retried.suites[0].specs[0].tests[0].results.push({ status: "passed" });
    expect(() => evaluateBrowser(retried)).toThrow(/browser-project-or-retry/);
    const skipped = clone(report); skipped.suites[0].specs[0].tests[0].results[0].status = "skipped";
    expect(evaluateBrowser(skipped).accepted).toBe(false);
  });
});

describe("CI server guard negative fixture", () => {
  it("synthesizes only literal listen DNS and durably rejects external DNS, native connect and fetch", () => {
    const runId = randomBytes(16).toString("hex");
    const journal = fileURLToPath(new URL(`../evidence/cycle-73/guard-build-${runId}.jsonl`, import.meta.url));
    writeFileSync(journal, "", { flag: "wx" });
    const preload = fileURLToPath(new URL("../scripts/ci/serve-preload.cjs", import.meta.url));
    const source = `
      const assert = require('node:assert/strict');
      const dns = require('node:dns');
      const net = require('node:net');
      (async () => {
        const address = await new Promise((resolve, reject) => dns.lookup('127.0.0.1', (error, address, family) => error ? reject(error) : resolve({address, family})));
        assert.deepEqual(address, {address:'127.0.0.1',family:4});
        const all = await new Promise((resolve, reject) => dns.lookup('127.0.0.1', {all:true}, (error, addresses) => error ? reject(error) : resolve(addresses)));
        assert.deepEqual(all, [{address:'127.0.0.1',family:4}]);
        assert.throws(() => dns.lookup('example.invalid', () => {}), /C73 real network is disabled/);
        assert.throws(() => net.connect(443, 'example.invalid'), /C73 real network is disabled/);
        await assert.rejects(fetch('https://example.invalid/'), /C73 real network is disabled/);
        process.stdout.write('CI_SERVE_GUARD_PROBE_PASS\\n');
      })().catch(() => { process.exitCode = 1; });`;
    const child = spawnSync(process.execPath, ["--require", preload, "-e", source], {
      cwd: fileURLToPath(new URL("../", import.meta.url)), encoding: "utf8", shell: false, windowsHide: true,
      timeout: 10_000, maxBuffer: 128 * 1024, env: { NODE_ENV: "test", COACHFI_C73_GUARD_JOURNAL: journal },
    });
    expect(child.error).toBeUndefined(); expect(child.status).toBe(0); expect(child.signal).toBeNull();
    expect(child.stdout).toContain("CI_SERVE_GUARD_PROBE_PASS");
    const rows = readFileSync(journal, "utf8").trim().split("\n").map(line => JSON.parse(line));
    expect(rows.filter(row => row.event === "native-denial").map(row => row.kind)).toEqual(["dns.lookup", "net.connect", "fetch"]);
    expect(rows.every(row => row.runId === runId && row.pid === child.pid)).toBe(true);
  });
});

describe("CI workflow trust boundary", () => {
  it("uses PR head revision, pinned official actions and no privileged event or credential persistence", () => {
    const source = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
    expect(source).toMatch(/pull_request:\s*\n/); expect(source).toContain("github.event.pull_request.head.sha || github.sha");
    expect(source).toMatch(/permissions:\s*\n\s+contents: read/);
    const uses = [...source.matchAll(/uses: ([^\s]+)/g)].map(match => match[1]);
    expect(uses).toHaveLength(4);
    expect(uses.every(value => /^(actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1|actions\/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1)$/.test(value))).toBe(true);
    expect((source.match(/persist-credentials: false/g) ?? [])).toHaveLength(2);
    expect(source).not.toMatch(/pull_request_target|workflow_run|secrets\.|id-token:|contents: write|continue-on-error|upload-artifact|vercel|deploy|npm publish/);
    expect(source).toContain("cancel-in-progress: true"); expect(source).toMatch(/timeout-minutes: 20/);
    expect(source).toContain("${{ github.run_id }}-${{ github.run_attempt }}-quality");
  });
  it("keeps full unit include and blocks app stages unless install and hygiene succeeded", () => {
    const config = readFileSync(new URL("../vitest.ci.config.ts", import.meta.url), "utf8");
    expect(config).toContain('import base from "./vitest.config"'); expect(config).toContain("...base.test");
    expect(config).toContain("envDir: false"); expect(config).not.toMatch(/exclude:|testNamePattern|\.skip/);
    const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
    expect((workflow.match(/steps\.hygiene\.outcome == 'success' && steps\.install\.outcome == 'success'/g) ?? []).length).toBeGreaterThanOrEqual(5);
    const runner = readFileSync(new URL("../scripts/ci/run.mjs", import.meta.url), "utf8");
    expect(runner).toContain('"ci", "--ignore-scripts", "--no-audit", "--no-fund"');
    expect(runner).toContain('"--include=dev", "--include=optional", "--include=peer"');
    expect(runner).not.toMatch(/--omit|--audit-level|legacy-peer-deps|--force|process\.env\.[A-Z_]*(?:API_KEY|AUTH_TOKEN)/);
    expect(runner).toContain('receiptRequired("hygiene")'); expect(runner).toContain('receiptRequired("install")');
  });
});
