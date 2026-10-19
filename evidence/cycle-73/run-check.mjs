import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync, execFileSync } from 'node:child_process';
import { fingerprintRuntime } from '../cycle-38/runtime-fingerprint.mjs';
import { snapshotInput, checkSnapshotInputs } from '../cycle-38/snapshot-boundaries.mjs';
import { parseJournal } from '../cycle-69/journal.mjs';

const dir = 'evidence/cycle-73/', mode = process.argv[2];
assert.equal(process.argv.length, 3);
assert(['security', 'typecheck', 'build'].includes(mode));
const read = p => JSON.parse(fs.readFileSync(p));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pin = p => ({ path: p, sha256: sha(p) });
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const resultPath = dir + mode + '-run.json', childPath = dir + mode + '-child.json';
for (const p of [resultPath, childPath, dir + mode + '-tests.json']) assert(!fs.existsSync(p), 'Preserve one-shot evidence');
const repo = fs.realpathSync('.'), require = createRequire(path.join(repo, 'package.json'));
const freeze = read(dir + 'source-freeze-v2.json'), release = read(dir + 'execution-release.json');
assert.equal(release.status, 'INDEPENDENT_SOURCE_AND_INSTALLED_RUNTIME_GO');
const releasePin = pin(dir + 'execution-release.json');
function boundary() {
  for (const p of [...release.pins, releasePin, ...freeze.currentSourceTools, ...freeze.inputs,
    ...freeze.preserve, ...freeze.receipts, ...freeze.sdkContractPins, ...freeze.consumerRuntimePins,
    ...freeze.moduleClosureAfter]) assert.equal(sha(p.path), p.sha256, p.path);
  assert.equal(sha('node_modules/.package-lock.json'), freeze.hiddenLock.sha256);
  for (const p of freeze.deletedSources) assert(!fs.existsSync(p.path));
  assert.deepEqual(fingerprintRuntime(repo, '7.1.6'), freeze.runtime);
  const git = { branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8', windowsHide: true }).trim(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
    indexEntriesSHA256: crypto.createHash('sha256').update(execFileSync('git', ['ls-files', '--stage', '-z'], { windowsHide: true })).digest('hex') };
  assert.deepEqual(git, freeze.gitBoundary);
}
boundary();
const before = freeze.inputs.map(p => pin(p.path));
const envNames = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS', 'SYSTEMDRIVE', 'TZ']);
const env = {};
for (const name of envNames) { const value = process.env[name]; if (value !== undefined) env[name] = value; }
const runId = crypto.randomBytes(16).toString('hex'), journalPath = dir + 'guard-' + mode + '-' + runId + '.jsonl';
fs.writeFileSync(journalPath, '', { flag: 'wx' });
Object.assign(env, { NEXT_TELEMETRY_DISABLED: '1', CI: '1', NODE_ENV: mode === 'build' ? 'production' : 'test',
  NODE_OPTIONS: '--require=' + path.resolve(dir + 'network-guard.cjs').replaceAll('\\', '/'),
  COACHFI_C73_GUARD_JOURNAL: path.resolve(journalPath) });
assert(!env.NODE_OPTIONS.includes(' '));
let cwd = repo, snapshot = null, snapshotInputs = null, preflight = null;
if (mode === 'build') {
  snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'coachfi-cycle73-verify-'));
  assert(fs.realpathSync(snapshot).startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
  for (const p of freeze.inputs) {
    const source = snapshotInput(repo, p.path), destination = path.resolve(snapshot, p.path);
    assert(destination.startsWith(snapshot + path.sep));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  }
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(snapshot, 'node_modules'), 'junction');
  assert.equal(fs.realpathSync(path.join(snapshot, 'node_modules')), fs.realpathSync(path.join(repo, 'node_modules')));
  snapshotInputs = freeze.inputs;
  preflight = checkSnapshotInputs(repo, snapshot, snapshotInputs);
  assert.deepEqual(preflight.currentMismatches, []); assert.deepEqual(preflight.snapshotMismatches, []);
  assert.deepEqual(fingerprintRuntime(snapshot, '7.1.6'), freeze.runtime);
  Object.assign(env, { NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:43191', NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED: '0',
    NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON: '0', NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS: '0',
    NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.resolve(dir + 'font-responses.cjs') });
  cwd = snapshot;
}
const args = mode === 'security' ? [path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), 'run',
  'tests/cycle38-selector-security.test.ts', 'tests/cycle38-selector-compatibility.test.ts', '--config', 'vitest.cycle73.config.ts', '--maxWorkers=1', '--reporter=verbose', '--reporter=json', '--outputFile=' + dir + 'security-tests.json'] :
  mode === 'typecheck' ? [require.resolve('typescript/bin/tsc'), '--noEmit', '--incremental', 'false'] : [require.resolve('next/dist/bin/next'), 'build'];
const startedAt = new Date().toISOString();
const child = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', shell: false, windowsHide: true,
  timeout: mode === 'build' ? 600000 : 180000, maxBuffer: 64 * 1024 * 1024 });
write(childPath, { cycle: 'C73', mode, startedAt, completedAt: new Date().toISOString(), args, cwd,
  pid: child.pid, childExitCode: child.status, signal: child.signal, stdout: child.stdout ?? '', stderr: child.stderr ?? '', error: child.error?.message ?? null });
let validationError = null, selection = null, journal = null, postflight = null, routes = null;
try {
  assert.equal(child.error, undefined); assert.equal(child.signal, null); assert.equal(child.status, 0);
  if (mode === 'build') {
    const bytes = fs.readFileSync(journalPath), text = bytes.toString('utf8');
    assert(Buffer.from(text, 'utf8').equals(bytes)); assert(text.length > 0 && text.endsWith('\n'));
    const records = text.slice(0, -1).split('\n').map(s => JSON.parse(s)), open = new Map(), epochs = [];
    records.forEach((row, index) => {
      assert.deepEqual(Object.keys(row).sort(), ['event', 'pid', 'runId', 'threadId']);
      assert.equal(row.runId, runId); assert(Number.isSafeInteger(row.pid) && row.pid > 0);
      assert(Number.isSafeInteger(row.threadId) && row.threadId >= 0);
      assert(['capture-ready', 'native-ready'].includes(row.event), 'No missing/caught network denial');
      const key = row.pid + ':' + row.threadId;
      if (row.event === 'capture-ready') { assert(!open.has(key), 'No overlapping context capture'); open.set(key, { index, pid: row.pid, threadId: row.threadId }); }
      else { const start = open.get(key); assert(start, 'Native readiness follows its own context capture'); epochs.push({ ...start, nativeRow: index }); open.delete(key); }
    });
    assert.equal(open.size, 0, 'Every capture context reaches native readiness');
    assert(epochs.length > 0); assert(epochs.some(e => e.pid === child.pid && e.threadId === 0));
    journal = { records: records.length, nativeReady: epochs.length, epochs, pending: 0, denials: 0 };
    const manifest = read(path.join(snapshot, '.next/server/app-paths-manifest.json'));
    routes = { appPathCount: Object.keys(manifest).length, appPaths: Object.keys(manifest).sort() };
  } else {
    journal = parseJournal(fs.readFileSync(journalPath), { mode: mode === 'security' ? 'app' : 'typecheck', runId, mainPid: child.pid,
      expectedFiles: mode === 'security' ? ['tests/cycle38-selector-security.test.ts', 'tests/cycle38-selector-compatibility.test.ts'] : [] });
    if (mode === 'security') {
      const report = read(dir + 'security-tests.json'), assertions = report.testResults.flatMap(f => f.assertionResults);
      assert.deepEqual(report.testResults.map(f => path.relative(repo, f.name).replaceAll('\\', '/')).sort(),
        ['tests/cycle38-selector-compatibility.test.ts', 'tests/cycle38-selector-security.test.ts']);
      assert.equal(report.numTotalTests, 21); assert.equal(report.numPassedTests, 21);
      assert.equal(report.testResults.find(f => f.name.endsWith('cycle38-selector-security.test.ts')).assertionResults.length, 8);
      assert.equal(report.testResults.find(f => f.name.endsWith('cycle38-selector-compatibility.test.ts')).assertionResults.length, 13);
      assert.equal(report.numFailedTests, 0); assert.equal(report.numPendingTests, 0); assert(assertions.every(x => x.status === 'passed'));
      const observations = [...(child.stdout ?? '').matchAll(/C38_SELECTOR_SECURITY_OBSERVATION (\{[^\r\n]*\})/g)].map(x => JSON.parse(x[1]));
      assert.equal(observations.length, 8);
      for (const obs of observations) { assert.equal(obs.childStatus, 0); assert.equal(obs.signal, null); assert.equal(obs.processError, null);
        const value = JSON.parse(obs.stdout); assert.equal(value.ok, true); assert.equal(value.version, '7.1.6'); }
      assert.equal(new Set(observations.map(x => x.name)).size, 8);
      const expectedNames = [...fs.readFileSync('tests/cycle38-selector-security.test.ts', 'utf8').matchAll(/isolatedOracle\("([^"]+)"/g)].map(x => x[1]);
      assert.deepEqual(observations.map(x => x.name).sort(), expectedNames.sort());
      selection = { total: 21, passed: 21, failed: 0, skipped: 0, securityControls: 8, consumerCompatibilityControls: 13, titles: assertions.map(x => x.fullName), observations };
    }
  }
} catch (e) { validationError = String(e); }
let snapshotPostError = null;
if (mode === 'build') try {
  postflight = checkSnapshotInputs(repo, snapshot, snapshotInputs, true);
  assert.deepEqual(postflight.currentMismatches, []); assert.deepEqual(postflight.snapshotMismatches, []);
  assert.deepEqual(fingerprintRuntime(snapshot, '7.1.6'), freeze.runtime);
} catch (e) { snapshotPostError = String(e); }
let journalPin;
try { journalPin = pin(journalPath); } catch (e) { journalPin = { path: journalPath, sha256: null }; validationError = [validationError, String(e)].filter(Boolean).join('\n'); }
let boundaryError = null;
try { boundary(); } catch (e) { boundaryError = String(e); }
const after = freeze.inputs.map(p => { try { return pin(p.path); } catch { return { path: p.path, sha256: null }; } });
const drift = before.filter((p, i) => p.sha256 !== after[i].sha256);
const status = child.status === 0 && !validationError && !snapshotPostError && !boundaryError && !drift.length ? 'PASS' : 'FAIL';
write(resultPath, { cycle: 'C73', mode, status, startedAt, completedAt: new Date().toISOString(), child: pin(childPath), childExitCode: child.status,
  validationError, snapshotPostError, boundaryError, before, after, drift, runtime: freeze.runtime, journal: { ...journalPin, runId, admission: journal }, selection,
  snapshot, preflight, postflight, routes, qualification: mode === 'build' ? 'Actual Next build and CSS consumers with explicit two-font local() mock; outbound native network denied. Not native Google-font, fresh-install, staging or production acceptance.' :
    'Original C38 eight security plus13 actual project-CSS compatibility unchanged controls on actual installed7.1.6 or no-emit TypeScript. C38 inner children intentionally use env:{} and pinned pure parser only; worker guards cover Vitest worker. Not broad app, provider, staging or production acceptance.' });
console.log(JSON.stringify({ mode, status, childExitCode: child.status, validationError, boundaryError, inputs: before.length, drift: drift.length, routes: routes?.appPathCount }));
process.exitCode = status === 'PASS' ? 0 : 1;
