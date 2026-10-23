import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

export const browserInstallPolicy = Object.freeze({
  dependencyTimeoutMs: 300_000,
  downloadTimeoutMs: 240_000,
  totalWorkBudgetMs: 540_000,
  terminateGraceMs: 2_000,
  killCloseGraceMs: 5_000,
  outputLimitBytesPerStream: 1_048_576,
  downloadIdleTimeoutMs: 60_000,
  attemptsPerPhase: 1,
});
const phases = [
  { phase: "chromium-dependencies", args: ["install-deps", "chromium"], budgetMs: browserInstallPolicy.dependencyTimeoutMs },
  { phase: "chromium-download", args: ["install", "--only-shell", "chromium"], budgetMs: browserInstallPolicy.downloadTimeoutMs },
];
const knownSignals = new Set(["SIGTERM", "SIGKILL", "SIGINT", "SIGHUP", "SIGABRT", "SIGSEGV"]);
const publicErrorCode = value => ["ETIMEDOUT", "ENOBUFS", "ENOENT", "EACCES", "EPERM", "ESRCH", "ECLEANUP"].includes(value) ? value : "PROCESS_ERROR";
const runtimeDefaults = { spawn, kill: process.kill.bind(process), now: () => performance.now(),
  setTimer: setTimeout, clearTimer: clearTimeout, platform: process.platform, executable: process.execPath };

/** Installer-only process group; other CI stages keep their original runner. */
export function runBrowserInstallPhase({ phase, args, cwd, env, budgetMs, captureRaw = () => {}, runtime = {} }) {
  const io = { ...runtimeDefaults, ...runtime };
  assert(["linux", "win32"].includes(io.platform), "ci-browser-install-unsupported-platform");
  const definition = phases.find(value => value.phase === phase);
  assert(definition && Number.isSafeInteger(budgetMs) && budgetMs > 0 && budgetMs <= definition.budgetMs, "ci-browser-install-budget");
  const started = io.now();
  return new Promise((resolve, reject) => {
    let child, done = false, failure = null, termSent = false, killSent = false, killError = null;
    let directClosed = false, closeStatus = null, closeSignal = null, groupGone = null, terminating = false;
    let deadline, escalation, cleanup, poll;
    const chunks = { stdout: [], stderr: [] }, bytes = { stdout: 0, stderr: 0 }, retained = { stdout: 0, stderr: 0 };
    const streamErrors = { stdout: false, stderr: false };
    const finish = (status, signal, closed, notStarted = false) => {
      if (done) return;
      done = true;
      for (const timer of [deadline, escalation, cleanup, poll]) if (timer !== undefined) io.clearTimer(timer);
      const elapsedMs = Math.max(0, Math.ceil(io.now() - started));
      // A late successful close cannot relabel an expired deadline as a pass.
      if (!failure && elapsedMs >= budgetMs) failure = { code: "ETIMEDOUT" };
      const result = { pid: child?.pid ?? null, status: Number.isSafeInteger(status) ? status : null,
        signal: signal ?? null, error: failure,
        stdout: Buffer.concat(chunks.stdout).toString("utf8"), stderr: Buffer.concat(chunks.stderr).toString("utf8") };
      const cleaned = closed && (!terminating || io.platform !== "linux" || groupGone === true);
      if (!cleaned && !notStarted) {
        // Do not wait indefinitely for inherited pipes after failed group cleanup.
        child?.stdout?.destroy(); child?.stderr?.destroy(); child?.unref();
      }
      try { captureRaw(result); }
      catch (error) { reject(error); return; }
      const category = !cleaned && !notStarted ? "cleanup-incomplete" : failure ? failure.code === "ETIMEDOUT" ? "timeout"
        : failure.code === "ENOBUFS" ? "output-limit" : "process-error" : signal ? "signal" : status !== 0 ? "nonzero-exit" : null;
      const accepted = cleaned && category === null && result.status === 0 && result.signal === null;
      resolve({ result, receipt: { phase, accepted, budgetMs, elapsedMs, exitCode: result.status,
        signal: signal === null || signal === undefined ? null : knownSignals.has(signal) ? signal : "OTHER_SIGNAL",
        category, errorCode: failure ? publicErrorCode(failure.code) : null,
        closed, groupGone, cleanup: notStarted ? "not-started" : !cleaned ? "incomplete" : killSent ? "kill-closed" : termSent ? "term-closed" : "not-needed",
        terminationScope: io.platform === "linux" ? "process-group" : "single-child",
        termSent, killSent, killError, streamErrors, stdoutBytes: bytes.stdout, stderrBytes: bytes.stderr,
        stdoutTruncated: bytes.stdout > retained.stdout, stderrTruncated: bytes.stderr > retained.stderr } });
    };
    const probeGroup = () => {
      if (groupGone === true || io.platform !== "linux") return;
      if (!Number.isSafeInteger(child?.pid) || child.pid <= 0) { killError = "PROCESS_ERROR"; return; }
      try { io.kill(-child.pid, 0); groupGone = false; }
      catch (error) {
        if (error?.code === "ESRCH") groupGone = true;
        else killError = publicErrorCode(error?.code);
      }
    };
    const maybeFinishTermination = () => {
      if (done) return;
      probeGroup();
      if (directClosed && (io.platform !== "linux" || groupGone === true)) finish(closeStatus, closeSignal, true);
    };
    const signalGroup = signal => {
      // Once the original group is observed gone, never signal that numeric ID again.
      if (io.platform === "linux" && groupGone === true) return;
      if (!Number.isSafeInteger(child?.pid) || child.pid <= 0) { killError = "PROCESS_ERROR"; return; }
      try {
        if (io.platform === "linux") io.kill(-child.pid, signal);
        else if (!child.kill(signal)) throw Object.assign(new Error("ci-browser-child-kill-refused"), { code: "ECLEANUP" });
        if (signal === "SIGTERM") termSent = true;
        else killSent = true;
      } catch (error) { killError = publicErrorCode(error?.code); }
    };
    const terminate = code => {
      if (done || terminating) return;
      terminating = true;
      if (code) failure ??= { code };
      maybeFinishTermination();
      if (done) return;
      signalGroup("SIGTERM");
      maybeFinishTermination();
      if (done) return;
      escalation = io.setTimer(() => {
        if (done) return;
        probeGroup();
        signalGroup("SIGKILL");
        maybeFinishTermination();
        if (done) return;
        cleanup = io.setTimer(() => { probeGroup(); finish(closeStatus, closeSignal, directClosed); }, browserInstallPolicy.killCloseGraceMs);
      }, browserInstallPolicy.terminateGraceMs);
      const check = () => {
        maybeFinishTermination();
        if (!done) poll = io.setTimer(check, 100);
      };
      poll = io.setTimer(check, 100);
    };
    const capture = stream => data => {
      if (done) return;
      const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
      bytes[stream] += chunk.length;
      const space = browserInstallPolicy.outputLimitBytesPerStream - retained[stream];
      if (space > 0) {
        const kept = chunk.subarray(0, space); chunks[stream].push(kept); retained[stream] += kept.length;
      }
      if (bytes[stream] > browserInstallPolicy.outputLimitBytesPerStream) terminate("ENOBUFS");
    };
    try {
      child = io.spawn(io.executable, args, { cwd, env, shell: false, windowsHide: true, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      failure = { code: error?.code ?? "PROCESS_ERROR" }; finish(null, null, false, true); return;
    }
    for (const stream of ["stdout", "stderr"]) {
      child[stream].on("data", capture(stream));
      child[stream].on("error", () => {
        if (done) return;
        streamErrors[stream] = true; terminate("PROCESS_ERROR");
      });
    }
    child.on("error", error => {
      if (done) return;
      if (!child.pid) { failure = { code: error?.code ?? "PROCESS_ERROR" }; finish(null, null, false, true); }
      else terminate(error?.code ?? "PROCESS_ERROR");
    });
    child.once("close", (status, signal) => {
      directClosed = true; closeStatus = status; closeSignal = signal;
      if (!terminating && io.now() - started >= budgetMs) terminate("ETIMEDOUT");
      if (!terminating && (status !== 0 || signal)) terminate(null);
      if (terminating) maybeFinishTermination();
      else finish(status, signal, true);
    });
    deadline = io.setTimer(() => terminate("ETIMEDOUT"), budgetMs);
  });
}

/** One attempt per phase. Raw evidence is captured before acceptance is considered. */
export async function installChromium({ cli, cwd, env, onRaw, onReceipt, onStart = () => {}, runtime = {} }) {
  assert(typeof cli === "string" && cli.endsWith("/cli.js") && typeof cwd === "string" && env &&
    typeof onRaw === "function" && typeof onReceipt === "function", "ci-browser-install-input");
  const io = { ...runtimeDefaults, ...runtime };
  const result = { accepted: false, policy: browserInstallPolicy, phases: [], reason: null };
  if (io.platform !== "linux") { result.reason = "unsupported-platform"; return result; }
  const started = io.now();
  for (const phase of phases) {
    const remaining = Math.floor(browserInstallPolicy.totalWorkBudgetMs - (io.now() - started));
    if (remaining <= 0) { result.reason = "budget-exhausted"; return result; }
    const budgetMs = Math.min(phase.budgetMs, remaining);
    const phaseEnv = phase.phase === "chromium-download"
      ? { ...env, PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: String(browserInstallPolicy.downloadIdleTimeoutMs) } : { ...env };
    const args = [cli, ...phase.args];
    onStart({ phase: phase.phase, budgetMs });
    const completed = await runBrowserInstallPhase({ phase: phase.phase, args, cwd, env: phaseEnv, budgetMs,
      captureRaw: result => onRaw(phase.phase, args, result), runtime: io });
    result.phases.push(completed.receipt); onReceipt(completed.receipt);
    if (!completed.receipt.accepted) { result.reason = completed.receipt.category; return result; }
  }
  result.accepted = true;
  return result;
}
