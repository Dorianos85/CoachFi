import assert from "node:assert/strict";

const severities = ["info", "low", "moderate", "high", "critical"];
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0;
export function commandSucceeded(result) {
  return result.status === 0 && result.signal === null && !result.error;
}
export function failureCategory(result) {
  return result.error ? result.error.code === "ETIMEDOUT" ? "timeout" : "process-error"
    : result.signal ? "signal" : result.status !== 0 ? "nonzero-exit" : null;
}
export function validateReceipt(receipt, binding) {
  assert(object(receipt) && receipt.status === "PASS" && object(receipt.binding), "ci-prerequisite-failed");
  for (const key of ["runId", "expectedSHA", "actualSHA", "lockSHA256"]) {
    assert(typeof binding[key] === "string" && receipt.binding[key] === binding[key], "ci-prerequisite-stale-run-or-source");
  }
}

/** Raw audit evidence is captured by the runner before this strict policy is evaluated. */
export function evaluateAudit(report, result) {
  assert(object(report) && !Object.hasOwn(report, "error") && report.auditReportVersion === 2, "audit-schema");
  assert(object(report.vulnerabilities) && object(report.metadata) && object(report.metadata.vulnerabilities), "audit-schema");
  const counts = report.metadata.vulnerabilities;
  assert.deepEqual(Object.keys(counts).sort(), [...severities, "total"].sort(), "audit-count-schema");
  assert(Object.values(counts).every(count), "audit-count-value");
  assert.equal(severities.reduce((sum, severity) => sum + counts[severity], 0), counts.total, "audit-count-sum");
  const observed = Object.fromEntries(severities.map(severity => [severity, 0]));
  const entries = Object.entries(report.vulnerabilities).map(([name, value]) => {
    assert(/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name), "audit-package-name");
    assert(object(value) && value.name === name && severities.includes(value.severity) && typeof value.isDirect === "boolean", "audit-vulnerability-schema");
    assert(Array.isArray(value.via) && value.via.length > 0 && Array.isArray(value.nodes) && value.nodes.length > 0, "audit-vulnerability-paths");
    assert(value.nodes.every(node => typeof node === "string" && node.startsWith("node_modules/") && !node.includes("..") && !node.includes("\\")), "audit-node-path");
    const advisories = value.via.flatMap(via => {
      if (typeof via === "string") {
        assert(Object.hasOwn(report.vulnerabilities, via), "audit-via-package"); return [];
      }
      assert(object(via) && count(via.source) && severities.includes(via.severity) && typeof via.url === "string", "audit-advisory-schema");
      const url = new URL(via.url);
      assert(url.protocol === "https:" && !url.username && !url.password && via.url.length < 2048, "audit-advisory-url");
      return [{ source: via.source, severity: via.severity, url: url.href }];
    });
    observed[value.severity]++;
    return { name, severity: value.severity, direct: value.isDirect, advisories };
  });
  assert.equal(entries.length, counts.total, "audit-entry-count");
  for (const severity of severities) assert.equal(observed[severity], counts[severity], "audit-severity-count");
  assert(!result.error && result.signal === null && result.status === (counts.total === 0 ? 0 : 1), "audit-process-status");
  return { accepted: counts.total === 0, policy: "zero-vulnerabilities-all-severities-no-exceptions", counts, vulnerabilities: entries };
}

export function evaluateVitest(report, expectedFiles, root) {
  assert(object(report) && Array.isArray(report.testResults), "unit-report-schema");
  assert(expectedFiles.length > 0 && new Set(expectedFiles).size === expectedFiles.length, "unit-expected-coverage");
  const relative = name => {
    assert(typeof name === "string" && name.startsWith(root + "/"), "unit-file-root");
    const file = name.slice(root.length + 1);
    assert(!file.includes("..") && !file.includes("\\"), "unit-file-path"); return file;
  };
  const files = report.testResults.map(file => relative(file.name.replaceAll("\\", "/")));
  assert.deepEqual(files.toSorted(), expectedFiles.toSorted(), "unit-file-coverage");
  assert(count(report.numTotalTests) && report.numTotalTests > 0 && count(report.numPassedTests) && count(report.numFailedTests) && count(report.numPendingTests), "unit-test-counts");
  const cases = report.testResults.flatMap(file => {
    assert(Array.isArray(file.assertionResults) && file.assertionResults.length > 0, "unit-file-empty");
    return file.assertionResults.map(test => {
      assert(["passed", "failed", "pending", "skipped", "todo"].includes(test.status) && typeof test.fullName === "string", "unit-case-schema");
      return { file: relative(file.name.replaceAll("\\", "/")), name: test.fullName.slice(0, 500), status: test.status };
    });
  });
  assert.equal(cases.length, report.numTotalTests, "unit-total-consistency");
  assert.equal(cases.filter(test => test.status === "passed").length, report.numPassedTests, "unit-pass-consistency");
  assert.equal(cases.filter(test => test.status === "failed").length, report.numFailedTests, "unit-fail-consistency");
  const unselected = cases.filter(test => !["passed", "failed"].includes(test.status));
  assert.equal(unselected.length, report.numPendingTests, "unit-skip-consistency");
  return { accepted: report.numFailedTests === 0 && unselected.length === 0 && report.success === true,
    files, total: cases.length, passed: report.numPassedTests, failed: report.numFailedTests, skipped: unselected.length,
    failures: cases.filter(test => test.status !== "passed") };
}

export function evaluateBuildJournal(bytes, runId, mainPid) {
  const source = bytes.toString("utf8");
  assert(Buffer.from(source).equals(bytes) && source.length > 0 && source.endsWith("\n"), "build-journal-bytes");
  const rows = source.slice(0, -1).split("\n").map(line => JSON.parse(line));
  const pending = new Set(); let contexts = 0;
  assert(rows[0]?.pid === mainPid && rows[0]?.event === "capture-ready", "build-main-capture");
  for (const row of rows) {
    assert(object(row) && row.runId === runId && Number.isSafeInteger(row.pid) && row.pid > 0 && count(row.threadId), "build-journal-identity");
    assert.deepEqual(Object.keys(row).sort(), ["event", "pid", "runId", "threadId"], "build-journal-fields");
    assert(["capture-ready", "native-ready"].includes(row.event), "build-denial-or-unknown-event");
    const key = `${row.pid}:${row.threadId}`;
    if (row.event === "capture-ready") { assert(!pending.has(key), "build-duplicate-capture"); pending.add(key); }
    else { assert(pending.delete(key), "build-unpaired-native-ready"); contexts++; }
  }
  assert(pending.size === 0 && contexts > 0, "build-incomplete-journal");
  return { records: rows.length, initializedContexts: contexts, denials: 0 };
}

export const expectedBrowserCases = [
  { file: "adult-family-paths.spec.ts", name: "pl: real mobile routes keep two RAM paths isolated and preserve privacy boundaries" },
  { file: "adult-family-paths.spec.ts", name: "en: real mobile routes keep two RAM paths isolated and preserve privacy boundaries" },
  { file: "adult-family-paths.spec.ts", name: "pl: direct family entry requires explicit adult-led privacy readiness" },
  { file: "adult-family-paths.spec.ts", name: "en: direct family entry requires explicit adult-led privacy readiness" },
  { file: "dependency-design-regression.spec.ts", name: "375: preserves Coachfi design after dependency changes" },
  { file: "dependency-design-regression.spec.ts", name: "1280: preserves Coachfi design after dependency changes" },
];
function browserFailureDiagnostic(result, file, rootDir) {
  const error = object(result.error) ? result.error : Array.isArray(result.errors) && object(result.errors[0]) ? result.errors[0] : {};
  const matchers = ["toBe", "toEqual", "toStrictEqual", "toContain", "toHaveLength", "toHaveText", "toContainText",
    "toBeVisible", "toBeEnabled", "toBeDisabled", "toBeFocused", "toHaveURL", "toBeNull", "toHaveAttribute", "toHaveCSS", "toHaveCount", "toMatchObject",
    "toBeGreaterThanOrEqual", "toBeLessThanOrEqual"];
  const matcher = object(error.matcherResult) && matchers.includes(error.matcherResult.name) ? error.matcherResult.name : null;
  const category = result.status === "timedOut" || error.name === "TimeoutError" ? "timeout"
    : result.status === "interrupted" ? "interrupted" : result.status === "skipped" ? "skipped" : matcher ? "assertion" : "test-error";
  const publicFile = `tests/e2e/${file}`;
  const paths = [file, publicFile];
  if (typeof rootDir === "string" && rootDir.length <= 4096) {
    const base = rootDir.replaceAll("\\", "/").replace(/\/$/, "");
    if (base.endsWith("/tests/e2e") && !base.split("/").includes("..")) paths.push(`${base}/${file}`);
  }
  const location = (value, source) => {
    if (!expectedBrowserCases.some(test => test.file === file) || !object(value) || typeof value.file !== "string" ||
        value.file.length > 4096 || !paths.includes(value.file.replaceAll("\\", "/")) ||
        ![value.line, value.column].every(number => Number.isSafeInteger(number) && number > 0 && number <= 999999)) return null;
    return { file: publicFile, line: value.line, column: value.column, source };
  };
  let found = location(error.location, "error-location");
  // Only coordinates from exact allowlisted frames survive. Never publish arbitrary error text.
  if (!found && typeof error.stack === "string" && error.stack.length <= 32768) {
    for (const frame of error.stack.split(/\r?\n/, 25)) {
      const match = /^\s+at (?:[^()\r\n]{1,160} \()?([^()\r\n]{1,4096}):([1-9]\d{0,5}):([1-9]\d{0,5})\)?$/.exec(frame);
      if (match) found = location({ file: match[1], line: Number(match[2]), column: Number(match[3]) }, "allowlisted-stack");
      if (found) break;
    }
  }
  return { category, location: found, matcher };
}
export function evaluateBrowser(report) {
  assert(object(report) && Array.isArray(report.suites) && Array.isArray(report.errors) && report.errors.length === 0, "browser-report-schema-or-global-error");
  const specs = [];
  const visit = suites => { for (const suite of suites) { assert(object(suite), "browser-suite-schema"); specs.push(...(suite.specs ?? [])); visit(suite.suites ?? []); } };
  visit(report.suites);
  assert(specs.length === expectedBrowserCases.length, "browser-exact-case-count");
  const cases = specs.map(spec => {
    assert(typeof spec.file === "string" && typeof spec.title === "string" && Array.isArray(spec.tests) && spec.tests.length === 1, "browser-spec-schema");
    const test = spec.tests[0];
    assert(test.projectName === "ci-bundled-chromium" && Array.isArray(test.results) && test.results.length === 1, "browser-project-or-retry");
    const result = test.results[0];
    const value = { file: spec.file, name: spec.title, status: result.status };
    return result.status === "passed" ? value : { ...value, diagnostic: browserFailureDiagnostic(result, spec.file, report.config?.rootDir) };
  });
  const identity = ({ file, name }) => `${file}::${name}`;
  assert.deepEqual(cases.map(identity).sort(), expectedBrowserCases.map(identity).sort(), "browser-exact-case-identities");
  return { accepted: cases.every(test => test.status === "passed"), cases };
}
