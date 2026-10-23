import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { browserInstallPolicy as policy, installChromium, runBrowserInstallPhase } from "../scripts/ci/browser-install.mjs";
import { commandSucceeded } from "../scripts/ci/policy.mjs";

const CLI = "/fixture/node_modules/@playwright/test/cli.js";
class Clock {
  now = 0; next = 0; timers = new Map();
  set = (callback, delay) => { const id = ++this.next; this.timers.set(id, { at: this.now + delay, callback }); return id; };
  clear = id => this.timers.delete(id);
  advance(amount) {
    const until = this.now + amount;
    for (;;) {
      const next = [...this.timers].filter(([, value]) => value.at <= until).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      this.now = next[1].at; this.timers.delete(next[0]); next[1].callback();
    }
    this.now = until;
  }
}
function fakeChild(pid) {
  const child = new EventEmitter(); child.pid = pid;
  for (const name of ["stdout", "stderr"]) { child[name] = new EventEmitter(); child[name].destroy = () => { child[name].destroyed = true; }; }
  child.unref = () => { child.unreferenced = true; };
  return child;
}
function fixture(extra = {}) {
  const clock = new Clock(), calls = [], children = [], kills = [], groups = new Set(), raw = [], receipts = [], order = [], starts = [];
  const runtime = { platform: "linux", executable: "/locked/node", now: () => clock.now, setTimer: clock.set, clearTimer: clock.clear,
    spawn: (executable, args, options) => {
      calls.push({ executable, args, options }); const child = fakeChild(400 + calls.length); children.push(child); groups.add(child.pid);
      const ownedPid = child.pid;
      child.on("close", () => { if (!child.keepGroupAlive) groups.delete(ownedPid); });
      return child;
    }, kill: (pid, signal) => {
      if (signal === 0) {
        if (!groups.has(-pid)) throw Object.assign(new Error("controlled group gone"), { code: "ESRCH" });
        return;
      }
      kills.push({ pid, signal });
      if (signal === "SIGKILL" && children.find(child => child.pid === -pid)?.killGroupOnKill) groups.delete(-pid);
    }, ...extra };
  return { clock, calls, children, kills, groups, raw, receipts, order, starts, runtime,
    options: { cli: CLI, cwd: "/fixture", env: { PATH: "/reviewed/bin", PLAYWRIGHT_BROWSERS_PATH: "/fixture/.tmp/browsers" }, runtime,
      onRaw: (phase, args, result) => { order.push("raw:" + phase); raw.push({ phase, args, result }); },
      onReceipt: receipt => { order.push("receipt:" + receipt.phase); receipts.push(receipt); }, onStart: value => starts.push(value) } };
}
const flush = () => Promise.resolve();

test("Chromium uses two locked commands, headless shell, isolated env and fixed finite budgets", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  assert.deepEqual(fx.calls[0].args, [CLI, "install-deps", "chromium"]);
  assert.equal(fx.calls[0].executable, "/locked/node");
  assert.deepEqual(fx.calls[0].options, { cwd: "/fixture", env: fx.options.env, shell: false, windowsHide: true, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  fx.clock.advance(20); fx.children[0].emit("close", 0, null); await flush();
  assert.deepEqual(fx.calls[1].args, [CLI, "install", "--only-shell", "chromium"]);
  assert.deepEqual(fx.calls[1].options.env, { ...fx.options.env, PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: "60000" });
  fx.clock.advance(40); fx.children[1].emit("close", 0, null);
  const result = await pending;
  assert.equal(result.accepted, true); assert.deepEqual(result.phases.map(row => [row.phase, row.accepted, row.budgetMs, row.elapsedMs]),
    [["chromium-dependencies", true, 300000, 20], ["chromium-download", true, 240000, 40]]);
  assert.deepEqual(fx.order, ["raw:chromium-dependencies", "receipt:chromium-dependencies", "raw:chromium-download", "receipt:chromium-download"]);
  assert.deepEqual(fx.starts.map(row => row.budgetMs), [300000, 240000]);
  assert.equal(policy.totalWorkBudgetMs, 540000); assert.equal(policy.attemptsPerPhase, 1);
  assert.equal(fx.calls.length, 2); assert.deepEqual(fx.kills, []); assert.equal(fx.clock.timers.size, 0);
  assert.equal(Object.hasOwn(fx.calls[0].options.env, "GITHUB_TOKEN"), false);
});

test("dependency nonzero failure is captured before its receipt and prevents download", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.children[0].stderr.emit("data", Buffer.from("PRIVATE_CHILD_DETAIL https://private.invalid/token"));
  fx.children[0].emit("close", 7, null);
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.reason, "nonzero-exit"); assert.equal(fx.calls.length, 1);
  assert.deepEqual(fx.order, ["raw:chromium-dependencies", "receipt:chromium-dependencies"]);
  assert.equal(fx.raw[0].result.status, 7); assert.match(fx.raw[0].result.stderr, /PRIVATE_CHILD_DETAIL/);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_CHILD_DETAIL|private.invalid|\/fixture|GITHUB_TOKEN/);
  assert.equal(commandSucceeded(fx.raw[0].result), false); assert.equal(fx.clock.timers.size, 0);
});

test("download failure after successful dependencies cannot admit an install receipt", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.children[0].emit("close", 0, null); await flush(); fx.children[1].emit("close", 1, null);
  const result = await pending;
  assert.equal(result.accepted, false); assert.deepEqual(result.phases.map(row => row.accepted), [true, false]);
  assert.equal(result.phases[1].exitCode, 1); assert.equal(fx.calls.length, 2);
});

test("deadline followed by a clean TERM close remains timeout and never starts download", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.clock.advance(300000);
  assert.deepEqual(fx.kills, [{ pid: -401, signal: "SIGTERM" }]);
  fx.children[0].emit("close", 0, null);
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "timeout");
  assert.equal(result.phases[0].cleanup, "term-closed"); assert.equal(result.phases[0].closed, true);
  assert.equal(fx.raw[0].result.error.code, "ETIMEDOUT"); assert.equal(commandSucceeded(fx.raw[0].result), false);
  fx.clock.advance(10000); assert.equal(fx.calls.length, 1); assert.equal(fx.kills.length, 1); assert.equal(fx.clock.timers.size, 0);
});

test("unresponsive TERM escalates only the owned Linux group and requires actual close", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.clock.advance(300000 + 2000);
  assert.deepEqual(fx.kills, [{ pid: -401, signal: "SIGTERM" }, { pid: -401, signal: "SIGKILL" }]);
  fx.children[0].emit("close", null, "SIGKILL");
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "timeout");
  assert.equal(result.phases[0].cleanup, "kill-closed"); assert.equal(result.phases[0].terminationScope, "process-group");
  assert.equal(fx.calls.length, 1); assert.equal(fx.clock.timers.size, 0);
});

test("missing close after KILL is bounded cleanup failure with no next phase", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.clock.advance(300000 + 2000 + 5000);
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "cleanup-incomplete");
  assert.equal(result.phases[0].closed, false); assert.equal(result.phases[0].cleanup, "incomplete");
  assert.equal(result.phases[0].elapsedMs, 307000); assert.equal(fx.calls.length, 1);
  assert.equal(fx.children[0].stdout.destroyed, true); assert.equal(fx.children[0].stderr.destroyed, true);
  assert.equal(fx.children[0].unreferenced, true); assert.equal(fx.clock.timers.size, 0);
});

test("direct leader close cannot cancel escalation while an owned descendant group survives", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.children[0].keepGroupAlive = true; fx.children[0].killGroupOnKill = true;
  fx.clock.advance(300000); fx.children[0].emit("close", 0, null);
  assert.equal(fx.raw.length, 0); assert.equal(fx.receipts.length, 0); assert.equal(fx.calls.length, 1);
  fx.clock.advance(2000); const result = await pending;
  assert.deepEqual(fx.kills, [{ pid: -401, signal: "SIGTERM" }, { pid: -401, signal: "SIGKILL" }]);
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "timeout");
  assert.equal(result.phases[0].exitCode, 0); assert.equal(result.phases[0].closed, true);
  assert.equal(result.phases[0].groupGone, true); assert.equal(result.phases[0].cleanup, "kill-closed");
  assert.equal(fx.calls.length, 1); assert.equal(fx.clock.timers.size, 0);
});

test("leader close with a surviving group and unsuccessful cleanup remains incomplete", async () => {
  const fx = fixture(), pending = installChromium(fx.options); fx.children[0].keepGroupAlive = true;
  fx.clock.advance(300000); fx.children[0].emit("close", 0, null); fx.clock.advance(7000);
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].closed, true);
  assert.equal(result.phases[0].groupGone, false); assert.equal(result.phases[0].category, "cleanup-incomplete");
  assert.equal(result.phases[0].cleanup, "incomplete"); assert.equal(fx.calls.length, 1);
});

test("a group observed gone is never signaled again even if its numeric ID reappears", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.clock.advance(300000); fx.groups.delete(401); fx.clock.advance(100); fx.groups.add(401);
  fx.clock.advance(1900); fx.children[0].keepGroupAlive = true; fx.children[0].emit("close", null, "SIGTERM");
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].groupGone, true);
  assert.deepEqual(fx.kills, [{ pid: -401, signal: "SIGTERM" }]); assert.equal(fx.groups.has(401), true);
});

test("stream error is handled, bounded and private, including a later error after close", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  assert.doesNotThrow(() => fx.children[0].stderr.emit("error", new Error("PRIVATE_STREAM_ERROR")));
  fx.children[0].emit("close", 0, null); const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "process-error");
  assert.deepEqual(result.phases[0].streamErrors, { stdout: false, stderr: true });
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_STREAM_ERROR/); assert.equal(fx.calls.length, 1);
  assert.doesNotThrow(() => fx.children[0].stdout.emit("error", new Error("PRIVATE_LATE_STREAM_ERROR")));
});

test("stream error during timeout cleanup retains the original timeout and does not restart cleanup", async () => {
  const fx = fixture(), pending = installChromium(fx.options); fx.clock.advance(300000);
  assert.doesNotThrow(() => fx.children[0].stdout.emit("error", new Error("PRIVATE_CLEANUP_STREAM_ERROR")));
  fx.children[0].emit("close", null, "SIGTERM"); const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "timeout");
  assert.equal(result.phases[0].streamErrors.stdout, true); assert.equal(fx.kills.length, 1);
  assert.equal(result.phases[0].elapsedMs, 300000); assert.equal(fx.clock.timers.size, 0);
});

test("group kill errors never become success and expose only a bounded error category", async () => {
  const fx = fixture({ kill: () => { throw Object.assign(new Error("PRIVATE_KILL_ERROR"), { code: "EPERM" }); } });
  const pending = installChromium(fx.options); fx.clock.advance(307000); const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].killError, "EPERM");
  assert.equal(result.phases[0].closed, false); assert.equal(fx.calls.length, 1);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_KILL_ERROR/);
});

test("synchronous spawn failure has a private result and no child or retry", async () => {
  let attempts = 0;
  const fx = fixture({ spawn: () => { attempts++; throw Object.assign(new Error("PRIVATE_SPAWN_ERROR"), { code: "EACCES" }); } });
  const result = await installChromium(fx.options);
  assert.equal(result.accepted, false); assert.equal(attempts, 1); assert.equal(fx.raw.length, 1);
  assert.equal(result.phases[0].category, "process-error"); assert.equal(result.phases[0].cleanup, "not-started");
  assert.equal(fx.raw[0].result.error.code, "EACCES"); assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SPAWN_ERROR/);
  assert.equal(fx.clock.timers.size, 0);
});

test("asynchronous failed spawn and a later close create only one failed receipt", async () => {
  const fx = fixture(), pending = installChromium(fx.options); fx.children[0].pid = undefined;
  fx.children[0].emit("error", Object.assign(new Error("PRIVATE_ASYNC_SPAWN"), { code: "ENOENT" }));
  fx.children[0].emit("close", -2, null); const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].cleanup, "not-started");
  assert.equal(fx.raw.length, 1); assert.equal(fx.calls.length, 1); assert.equal(fx.clock.timers.size, 0);
});

test("external signal is a failure even if no installer timeout occurred", async () => {
  const fx = fixture(), pending = installChromium(fx.options); fx.children[0].emit("close", null, "SIGTERM");
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "signal");
  assert.equal(result.phases[0].signal, "SIGTERM"); assert.equal(result.phases[0].closed, true);
  assert.deepEqual(fx.kills, []); assert.equal(fx.calls.length, 1);
});

test("bounded output overflow terminates and keeps arbitrary output private", async () => {
  const fx = fixture(), pending = installChromium(fx.options);
  fx.children[0].stdout.emit("data", Buffer.alloc(policy.outputLimitBytesPerStream + 1, 97));
  fx.children[0].emit("close", 0, null); const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "output-limit");
  assert.equal(result.phases[0].stdoutBytes, policy.outputLimitBytesPerStream + 1);
  assert.equal(result.phases[0].stdoutTruncated, true); assert.equal(Buffer.byteLength(fx.raw[0].result.stdout), policy.outputLimitBytesPerStream);
  assert.deepEqual(fx.kills, [{ pid: -401, signal: "SIGTERM" }]); assert.equal(fx.calls.length, 1);
  assert.equal(JSON.stringify(result).includes("a".repeat(50)), false);
});

test("a close observed at the expired boundary cannot race its timer into PASS", async () => {
  const fx = fixture(), pending = installChromium(fx.options); fx.clock.now = 300000; fx.children[0].emit("close", 0, null);
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[0].category, "timeout");
  assert.equal(fx.calls.length, 1); assert.equal(fx.clock.timers.size, 0);
});

test("elapsed work budget is propagated and can stop a second phase before spawn", async () => {
  const fx = fixture();
  const pending = installChromium({ ...fx.options, onRaw: (...args) => { fx.options.onRaw(...args); fx.clock.now = policy.totalWorkBudgetMs; } });
  fx.children[0].emit("close", 0, null); const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.reason, "budget-exhausted");
  assert.equal(result.phases.length, 1); assert.equal(result.phases[0].accepted, true); assert.equal(fx.calls.length, 1);
});

test("download receives only the remaining monotonic work budget", async () => {
  const fx = fixture(); let phaseCount = 0;
  const pending = installChromium({ ...fx.options, onRaw: (...args) => {
    fx.options.onRaw(...args); if (++phaseCount === 1) fx.clock.now = 400000;
  } });
  fx.children[0].emit("close", 0, null); await flush();
  assert.equal(fx.starts[1].budgetMs, 140000);
  fx.clock.advance(140000); fx.children[1].emit("close", null, "SIGTERM");
  const result = await pending;
  assert.equal(result.accepted, false); assert.equal(result.phases[1].budgetMs, 140000);
  assert.equal(result.phases[1].category, "timeout"); assert.equal(fx.calls.length, 2);
});

test("unknown phases and invalid or excessive per-phase budgets refuse before spawning", () => {
  const fx = fixture();
  for (const budgetMs of [0, -1, NaN, Infinity, 240001]) assert.throws(() => runBrowserInstallPhase({
    phase: "chromium-download", args: [CLI], cwd: "/fixture", env: {}, budgetMs, runtime: fx.runtime,
  }), /ci-browser-install-budget/);
  assert.throws(() => runBrowserInstallPhase({ phase: "unknown", args: [CLI], cwd: "/fixture", env: {}, budgetMs: 10, runtime: fx.runtime }), /ci-browser-install-budget/);
  assert.equal(fx.calls.length, 0);
});

test("a receipt persistence failure cannot be converted into installer acceptance", async () => {
  const fx = fixture();
  const pending = installChromium({ ...fx.options, onRaw: () => { throw new Error("PRIVATE_EVIDENCE_FAILURE"); } });
  fx.children[0].emit("close", 0, null);
  await assert.rejects(pending, /PRIVATE_EVIDENCE_FAILURE/); assert.equal(fx.receipts.length, 0); assert.equal(fx.calls.length, 1);
});

test("unsupported installer platform is a non-acceptance with zero attempts", async () => {
  const fx = fixture({ platform: "win32" }), result = await installChromium(fx.options);
  assert.equal(result.accepted, false); assert.equal(result.reason, "unsupported-platform"); assert.deepEqual(result.phases, []);
  assert.equal(fx.calls.length, 0); assert.equal(fx.raw.length, 0);
});

test("CI keeps job20/step10, source-bound build/install gates and the exact UI suite", () => {
  const workflowLF = fs.readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const runner = fs.readFileSync(new URL("../scripts/ci/run.mjs", import.meta.url), "utf8");
  const config = fs.readFileSync(new URL("../scripts/ci/playwright.config.mjs", import.meta.url), "utf8");
  for (const workflow of [workflowLF, workflowLF.replace(/\n/g, "\r\n")]) {
    assert.match(workflow, /quality:[ \t]*\r?\n[ \t]+runs-on: ubuntu-24\.04[ \t]*\r?\n[ \t]+timeout-minutes: 20/);
    assert.match(workflow, /id: browser[ \t]*\r?\n[ \t]+timeout-minutes: 10/);
    assert.match(workflow, /steps\.browser\.outcome == 'success'/);
  }
  assert.match(runner, /assert\(installed\.accepted, "ci-browser-install-failed"\)/);
  assert.match(runner, /receiptRequired\("build"\); receiptRequired\("browser-install"\)/);
  assert.match(config, /browserName: "chromium"/); assert.match(config, /retries: 0/);
  assert.doesNotMatch(config, /channel:|executablePath:|headless: false/);
});

const actualEnv = Object.fromEntries(["PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE"].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
test("actual owned Node child nonzero exit has a real close and private stderr", { timeout: 10000 }, async () => {
  const completed = await runBrowserInstallPhase({ phase: "chromium-download", cwd: process.cwd(), env: actualEnv, budgetMs: 5000,
    args: ["-e", "process.stdout.write('CONTROLLED_READY');process.stderr.write('PRIVATE_ACTUAL_CHILD_DETAIL');process.exitCode=7;"] });
  assert.equal(completed.receipt.accepted, false); assert.equal(completed.receipt.exitCode, 7); assert.equal(completed.receipt.closed, true);
  assert.equal(completed.receipt.category, "nonzero-exit"); assert.equal(completed.result.stdout, "CONTROLLED_READY");
  assert.equal(completed.result.stderr, "PRIVATE_ACTUAL_CHILD_DETAIL"); assert.doesNotMatch(JSON.stringify(completed.receipt), /PRIVATE_ACTUAL_CHILD_DETAIL/);
});

test("actual owned Node timeout closes with platform cleanup; Linux includes an unresponsive descendant", { timeout: 15000 }, async () => {
  assert.ok(["linux", "win32"].includes(process.platform), "Actual child platform is unsupported; no simulated acceptance");
  const linuxDescendant = "const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',\"process.on('SIGTERM',()=>{});process.stdout.write('DESCENDANT_READY');setInterval(()=>{},1000);\"],{stdio:['ignore','pipe','ignore']});child.stdout.once('data',()=>process.stdout.write('CONTROLLED_READY'));process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);";
  const singleChild = "process.on('SIGTERM',()=>{});process.stdout.write('CONTROLLED_READY');setInterval(()=>{},1000);";
  const completed = await runBrowserInstallPhase({ phase: "chromium-download", cwd: process.cwd(), env: actualEnv, budgetMs: 2500,
    args: ["-e", process.platform === "linux" ? linuxDescendant : singleChild] });
  assert.equal(completed.receipt.accepted, false); assert.equal(completed.receipt.category, "timeout");
  assert.equal(completed.result.stdout, "CONTROLLED_READY"); assert.equal(completed.receipt.closed, true); assert.equal(completed.result.error.code, "ETIMEDOUT");
  assert.equal(completed.receipt.termSent, true); assert.equal(completed.receipt.killError, null);
  if (process.platform === "linux") {
    assert.equal(completed.receipt.terminationScope, "process-group"); assert.equal(completed.receipt.killSent, true);
    assert.equal(completed.receipt.cleanup, "kill-closed"); assert.equal(completed.receipt.groupGone, true);
    assert.equal(completed.receipt.exitCode, 0); assert.equal(completed.receipt.signal, null);
  } else {
    assert.equal(completed.receipt.terminationScope, "single-child"); assert.equal(completed.receipt.cleanup, "term-closed");
    assert.equal(completed.receipt.killSent, false);
  }
});
