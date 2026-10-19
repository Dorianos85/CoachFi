import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTrackedPaths, scanPlaintext } from "../scripts/check-repo-hygiene.mjs";

const script = fileURLToPath(new URL("../scripts/check-repo-hygiene.mjs", import.meta.url));

test("metadata blocks profiles, secrets and generated output while retaining evidence and env example", () => {
  const blocked = [".codex-screenshots/chrome-profile/Default/Login Data", ".codex-logs/run.log", "profile/Cookies", ".env", ".env.production", ".mcp.json", "supabase/.temp/linked-project.json", "keys/signing.pem", "../outside.ts"];
  assert.equal(checkTrackedPaths(blocked).length, blocked.length);
  assert.deepEqual(checkTrackedPaths([".env.example", "evidence/ux/page.jpg", "docs/coachfi/REPORT.md", "lib/user.ts"]), []);
});

test("plaintext detection reports rule, path and line only", () => {
  const fakeToken = ["ghp", "_", "a".repeat(36)].join("");
  const result = scanPlaintext("lib/fixture.ts", `const harmless = 1;\nconst value = "${fakeToken}";\n`);
  assert.deepEqual(result, [{ rule: "provider-token", file: "lib/fixture.ts", line: 2 }]);
  assert.equal(JSON.stringify(result).includes(fakeToken), false);
  assert.deepEqual(scanPlaintext(".env.example", 'api_key = "YOUR_API_KEY_HERE"'), []);
  assert.deepEqual(scanPlaintext("lib/binary.ts", `\0${fakeToken}`), []);
});

function fixture(fn) {
  const directory = mkdtempSync(join(tmpdir(), "coachfi-hygiene-fixture-"));
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: directory, stdio: "pipe" });
    fn(directory);
  } finally {
    // Only remove the fresh metadata fixture under the resolved OS temp root.
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith("coachfi-hygiene-fixture-"));
    rmSync(directory, { recursive: true, force: true });
  }
}

test("CLI inspects tracked paths and never opens a forbidden profile path", () => fixture((directory) => {
  mkdirSync(join(directory, ".codex-screenshots", "chrome-profile", "Default"), { recursive: true });
  // An empty synthetic path fixture, never an actual browser database.
  const profile = ".codex-screenshots/chrome-profile/Default/Login Data";
  writeFileSync(join(directory, profile), "");
  execFileSync("git", ["add", "--", profile], { cwd: directory, stdio: "pipe" });
  const command = spawnSync(process.execPath, [script, "--scan-secrets", "--json"], { cwd: directory, encoding: "utf8" });
  assert.equal(command.status, 1);
  const report = JSON.parse(command.stdout);
  assert.equal(report.scannedTextFiles, 0);
  assert.deepEqual(report.findings, [{ rule: "generated-profile-or-trace", file: profile, line: 0 }]);
}));

test("CLI passes clean metadata and ignores an untracked credential file", () => fixture((directory) => {
  writeFileSync(join(directory, ".env.example"), "API_KEY=YOUR_API_KEY_HERE\n");
  writeFileSync(join(directory, ".env.local"), "");
  execFileSync("git", ["add", "--", ".env.example"], { cwd: directory, stdio: "pipe" });
  const command = spawnSync(process.execPath, [script, "--scan-secrets", "--json"], { cwd: directory, encoding: "utf8" });
  assert.equal(command.status, 0);
  assert.equal(JSON.parse(command.stdout).trackedFiles, 1);
}));

test("CLI rejects unknown options without echoing source data", () => {
  const command = spawnSync(process.execPath, [script, "--unknown"], { encoding: "utf8" });
  assert.equal(command.status, 2);
  assert.equal(command.stdout, "");
  assert.match(command.stderr, /^Usage:/);
});
