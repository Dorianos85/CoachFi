import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// One build only. No install, application test run, server, retry, or cleanup.
const root = fs.realpathSync(process.cwd());
assert.equal(root, fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")));
assert.equal(path.basename(root), "CoachFi-pr19");
const [label, ...extra] = process.argv.slice(2);
assert(/^[a-z0-9][a-z0-9-]{0,60}$/.test(label) && extra.length === 0);
const evidence = fs.realpathSync(path.resolve(root, "../../evidence/release-pr19-2026-10-19"));
const output = name => path.join(evidence, label + "-build-" + name);
const files = { raw: output("child.json"), result: output("run.json"), inputs: output("inputs.json"), runtime: output("runtime-before.json") };
const control = output("control");
for (const p of [...Object.values(files), control]) assert(!fs.existsSync(p), "Preserve prior evidence: " + p);
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
const relative = (from, p) => path.relative(from, p).replaceAll("\\", "/");
const inside = (base, p) => p.startsWith(base + path.sep);
const osNames = ["PATH", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "OS", "PROCESSOR_ARCHITECTURE", "NUMBER_OF_PROCESSORS", "SYSTEMDRIVE", "TZ"];
const baseEnv = {};
for (const name of osNames) if (process.env[name] !== undefined) baseEnv[name] = process.env[name];
const git = args => execFileSync("git", args, { cwd: root, env: baseEnv, windowsHide: true });
const gitState = () => ({ branch: git(["branch", "--show-current"]).toString().trim(), head: git(["rev-parse", "HEAD"]).toString().trim(), indexEntriesSHA256: crypto.createHash("sha256").update(git(["ls-files", "--stage", "-z"])).digest("hex") });
const forbidden = /(^|\/)(?:\.git|\.env[^/]*|node_modules|\.next|[^/]*(?:browser-profile|chrome-profile|playwright-profile)[^/]*)(?:\/|$)|\.(?:sqlite3?|db|har|log)$/i;
const safeSource = name => {
  assert(typeof name === "string" && !path.isAbsolute(name) && !name.includes("\\") && !name.includes(":") && !name.includes("\0"));
  assert(name.split("/").every(s => s && s !== "." && s !== "..") && !forbidden.test(name), "Forbidden snapshot input: " + name);
  const p = path.resolve(root, name), stat = fs.lstatSync(p), real = fs.realpathSync(p);
  assert(stat.isFile() && !stat.isSymbolicLink() && inside(root, real));
  return p;
};
const roots = ["app", "components", "context", "data", "lib", "styles", "types", "tests", "tools", "scripts", "public", "evidence"];
function inventory() {
  const listed = git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).toString().split("\0").filter(Boolean);
  return [...new Set(listed)].filter(name => {
    if (forbidden.test(name)) return false;
    const first = name.split("/")[0];
    if (!name.includes("/")) return /\.(?:ts|tsx|mjs|cjs|js|json)$/.test(name);
    if (!roots.includes(first)) return false;
    // Historical journals, npm configuration, raw Python, and prose are not compiler inputs.
    return first !== "evidence" || /\.(?:ts|tsx|mjs|cjs|js|json)$/.test(name);
  }).sort().map(name => ({ path: name, sha256: sha(safeSource(name)) }));
}
function runtimeInventory(modules) {
  const rows = [];
  function visit(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, e.name), stat = fs.lstatSync(p), name = relative(modules, p);
      if (stat.isSymbolicLink()) {
        const target = fs.realpathSync(p); assert(inside(modules, target), "Runtime link escapes its own runtime");
        rows.push({ path: name, link: relative(modules, target) });
      } else if (stat.isDirectory()) visit(p);
      else { assert(stat.isFile()); rows.push({ path: name, sha256: sha(p) }); }
    }
  }
  visit(modules); return rows;
}
function buildJournal(p, runId, pid) {
  const bytes = fs.readFileSync(p), text = bytes.toString("utf8");
  assert(Buffer.from(text, "utf8").equals(bytes) && text.length > 0 && text.endsWith("\n"));
  const records = text.slice(0, -1).split("\n").map(line => JSON.parse(line)), open = new Map(), epochs = [];
  for (const [index, row] of records.entries()) {
    assert.deepEqual(Object.keys(row).sort(), ["event", "pid", "runId", "threadId"]);
    assert.equal(row.runId, runId); assert(Number.isSafeInteger(row.pid) && row.pid > 0);
    assert(Number.isSafeInteger(row.threadId) && row.threadId >= 0);
    assert(["capture-ready", "native-ready"].includes(row.event), "Any denial or unknown event fails, including caught/late denial");
    const key = row.pid + ":" + row.threadId;
    if (row.event === "capture-ready") { assert(!open.has(key)); open.set(key, { captureRow: index, pid: row.pid, threadId: row.threadId }); }
    else { const first = open.get(key); assert(first, "Native readiness must follow own context capture"); epochs.push({ ...first, nativeRow: index }); open.delete(key); }
  }
  assert.equal(open.size, 0); assert(epochs.length > 0 && epochs.some(row => row.pid === pid && row.threadId === 0));
  return { path: p, sha256: sha(p), records: records.length, completeContexts: epochs.length, pending: 0, denials: 0, epochs };
}
let snapshot = null, inputPins = null, runtimeBefore = null, modules = null, gitBefore = null, fixedPins = null;
let raw = null, journalPath = null, runId = null, preflight = null, manifest = null, journal = null;
const errors = [], postflight = {};
const startedAt = new Date().toISOString();
try {
  const cleanPath = path.join(evidence, "clean-install.json"), clean = JSON.parse(fs.readFileSync(cleanPath, "utf8"));
  assert.equal(clean.observedExitCode, 0); assert.equal(clean.lockSHA256, sha(path.join(root, "package-lock.json")));
  const guard = "evidence/cycle-73/network-guard.cjs", font = "evidence/cycle-73/font-responses.cjs";
  assert.equal(sha(safeSource(guard)), "f63fb3230696cec0d909d5f366283ba6824b7e11e79c0d03e8432a5cc44115d6");
  assert.equal(sha(safeSource(font)), "b535e414f54b8ca6af688bc6baf0b9c9b5158bfb59e9eb32938874ac992cc0d4");
  gitBefore = gitState();
  inputPins = inventory();
  for (const required of ["package.json", "package-lock.json", "next-env.d.ts", "next.config.mjs", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", guard, font, "tools/release-build.mjs"]) assert(inputPins.some(p => p.path === required));
  write(files.inputs, { at: startedAt, root, git: gitBefore, inputs: inputPins, exclusion: "No .env/.git/runtime/profile/database/journal or private OS inputs; evidence copies only code/JSON compiler fixtures." });
  modules = fs.realpathSync(path.join(root, "node_modules"));
  assert.equal(modules, path.join(root, "node_modules")); assert(!fs.lstatSync(modules).isSymbolicLink());
  runtimeBefore = runtimeInventory(modules); write(files.runtime, { root: modules, files: runtimeBefore, sha256: digest(runtimeBefore), qualification: "Observed installed bytes of the recorded clean npm-ci; lifecycle scripts disabled by installer, not inferred from this build." });
  fixedPins = [cleanPath, process.execPath].map(p => ({ path: p, sha256: sha(p) }));
  fs.mkdirSync(control); assert.equal(fs.realpathSync(control), control);
  const guardCopy = path.join(control, "network-guard.cjs"), fontCopy = path.join(control, "font-responses.cjs");
  fs.copyFileSync(safeSource(guard), guardCopy, fs.constants.COPYFILE_EXCL);
  fs.copyFileSync(safeSource(font), fontCopy, fs.constants.COPYFILE_EXCL);
  fixedPins.push({ path: guardCopy, sha256: sha(guardCopy) }, { path: fontCopy, sha256: sha(fontCopy) });
  runId = crypto.randomBytes(16).toString("hex"); journalPath = path.join(control, "guard-build-" + runId + ".jsonl"); fs.writeFileSync(journalPath, "", { flag: "wx" });
  snapshot = fs.mkdtempSync(path.join(os.tmpdir(), "coachfi-pr19-build-"));
  assert(inside(fs.realpathSync(os.tmpdir()), fs.realpathSync(snapshot)));
  for (const pin of inputPins) {
    const destination = path.resolve(snapshot, pin.path); assert(inside(snapshot, destination));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(safeSource(pin.path), destination, fs.constants.COPYFILE_EXCL); assert.equal(sha(destination), pin.sha256);
  }
  fs.symlinkSync(modules, path.join(snapshot, "node_modules"), "junction");
  assert.equal(fs.realpathSync(path.join(snapshot, "node_modules")), modules);
  const req = createRequire(path.join(snapshot, "package.json")), next = fs.realpathSync(req.resolve("next/dist/bin/next"));
  assert(inside(modules, next));
  assert.equal(JSON.parse(fs.readFileSync(path.join(modules, "next/package.json"), "utf8")).version, clean.versions.next);
  const env = { ...baseEnv, NODE_ENV: "production", CI: "1", NEXT_TELEMETRY_DISABLED: "1",
    NODE_OPTIONS: '--require="' + guardCopy.replaceAll("\\", "/") + '"', COACHFI_C73_GUARD_JOURNAL: journalPath,
    NEXT_FONT_GOOGLE_MOCKED_RESPONSES: fontCopy, NEXT_PUBLIC_APP_URL: "http://127.0.0.1:43191",
    NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED: "0", NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON: "0", NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS: "0" };
  assert.deepEqual(inventory(), inputPins); assert.deepEqual(gitState(), gitBefore);
  preflight = { inputs: inputPins.length, runtimeFiles: runtimeBefore.length, runtimeSHA256: digest(runtimeBefore), next, environmentNames: Object.keys(env).sort(), guard: fixedPins.at(-2), font: fixedPins.at(-1) };
  const args = [next, "build"];
  const child = spawnSync(process.execPath, args, { cwd: snapshot, env, encoding: "utf8", shell: false, windowsHide: true, timeout: 600000, maxBuffer: 96 * 1024 * 1024 });
  raw = { startedAt, finishedAt: new Date().toISOString(), pid: child.pid, args, cwd: snapshot, status: child.status, signal: child.signal, error: child.error?.message ?? null, stdout: child.stdout ?? "", stderr: child.stderr ?? "" };
  // The complete child result is durable BEFORE journal/manifest/postboundary interpretation.
  write(files.raw, raw);
  try { journal = buildJournal(journalPath, runId, child.pid); } catch (e) { errors.push({ phase: "journal", error: String(e), path: journalPath, sha256: fs.existsSync(journalPath) ? sha(journalPath) : null }); }
  try {
    const manifestPath = path.join(snapshot, ".next/server/app-paths-manifest.json"), parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert(parsed && typeof parsed === "object" && !Array.isArray(parsed));
    const entries = Object.entries(parsed); assert(entries.length > 0 && entries.every(([k, v]) => k.startsWith("/") && typeof v === "string"));
    manifest = { path: manifestPath, sha256: sha(manifestPath), appPathCount: entries.length, appPaths: entries.map(([k]) => k).sort() };
  } catch (e) { errors.push({ phase: "manifest", error: String(e) }); }
  if (child.status !== 0 || child.error || child.signal) errors.push({ phase: "child", error: child.error?.message ?? "Nonzero exit/signal", status: child.status, signal: child.signal });
} catch (e) { errors.push({ phase: raw ? "after-child" : "preflight", error: String(e) }); }
// Postflight runs independently of child status or parser failures.
if (inputPins) {
  try {
    assert.deepEqual(inventory(), inputPins, "Main source/input membership or bytes changed");
    const drift = [], generated = [];
    for (const pin of inputPins) {
      const p = path.join(snapshot, pin.path);
      const actual = fs.existsSync(p) ? sha(p) : null;
      if (pin.path === "next-env.d.ts") generated.push({ path: pin.path, before: pin.sha256, after: actual, qualification: "Next-generated TEMP file only; main copy must remain literal" });
      else if (actual !== pin.sha256) drift.push({ ...pin, actual });
    }
    assert.deepEqual(drift, []); postflight.inputs = { main: inputPins.length, snapshotCompared: inputPins.length - generated.length, drift, generated };
  } catch (e) { errors.push({ phase: "postflight-inputs", error: String(e) }); }
}
if (runtimeBefore) {
  try { const after = runtimeInventory(modules); assert.deepEqual(after, runtimeBefore, "Installed runtime changed"); postflight.runtime = { files: after.length, sha256: digest(after), drift: 0 }; }
  catch (e) { errors.push({ phase: "postflight-runtime", error: String(e) }); }
}
if (gitBefore) { try { assert.deepEqual(gitState(), gitBefore); postflight.git = gitBefore; } catch (e) { errors.push({ phase: "postflight-git", error: String(e) }); } }
if (fixedPins) { try { for (const pin of fixedPins) assert.equal(sha(pin.path), pin.sha256); postflight.fixedPins = fixedPins; } catch (e) { errors.push({ phase: "postflight-fixed-pins", error: String(e) }); } }
const status = raw && errors.length === 0 && journal && manifest ? "PASS" : "FAIL";
const summary = { at: new Date().toISOString(), label, status, startedAt, snapshot, cleanInstall: path.join(evidence, "clean-install.json"), inputManifest: { path: files.inputs, sha256: fs.existsSync(files.inputs) ? sha(files.inputs) : null }, runtimeManifest: { path: files.runtime, sha256: fs.existsSync(files.runtime) ? sha(files.runtime) : null }, rawChild: raw ? { path: files.raw, sha256: sha(files.raw), status: raw.status } : null, preflight, journal, manifest, postflight, errors,
  qualification: "One actual Next production build in a TEMP source snapshot with current clean npm-ci dependencies. Two Google font responses are literal C73 synthetic local Arial CSS; no font download, font fidelity, browser, provider, Auth, staging or production readiness acceptance. No application tests or clean install rerun. All native network denied in captured build contexts; no inherited provider credentials or .env files. Main source/runtime/Git unchanged only when postflight passes. TEMP and all failed raw evidence retained." };
write(files.result, summary);
console.log(JSON.stringify({ status, label, snapshot, result: files.result, errors, manifest, journal: journal && { records: journal.records, completeContexts: journal.completeContexts, pending: journal.pending, denials: journal.denials } }, null, 2));
process.exitCode = status === "PASS" ? 0 : 1;
