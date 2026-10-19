import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync, execFileSync } from 'node:child_process';
import { fingerprintRuntime } from '../cycle-38/runtime-fingerprint.mjs';

const dir = 'evidence/cycle-68/', mode = process.argv[2];
assert(['boundary', 'baseline', 'acceptance', 'inventory', 'typecheck'].includes(mode));
assert.equal(process.argv.length, 3);
const recordMode = mode === 'boundary' ? 'boundary-retest' : mode === 'baseline' ? 'baseline-retest' : mode;
for (const suffix of ['-run.json', '-child.json', '-tests.json']) assert(!fs.existsSync(dir + recordMode + suffix), 'Preserve one-shot evidence');
const repo = fs.realpathSync(process.cwd()), require = createRequire(path.join(repo, 'package.json'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sha = file => hash(fs.readFileSync(file));
const read = file => JSON.parse(fs.readFileSync(file));
const beforeCapture = read(dir + 'before.json'), proposal = read(dir + 'adapter-proposal.json');
const release = read(dir + 'execution-release-v2.json'), inventory = read(dir + 'suite-inventory.json');
const releaseSHA256 = sha(dir + 'execution-release-v2.json');
const appliedRelease = !['boundary', 'baseline'].includes(mode) ? read(dir + 'acceptance-release.json') : null;
const appliedReleaseSHA256 = appliedRelease ? sha(dir + 'acceptance-release.json') : null;
const checkReleasePins = () => {
  assert.equal(sha(dir + 'execution-release-v2.json'), releaseSHA256);
  for (const p of release.pins) assert.equal(sha(p.path), p.sha256, p.path);
  if (appliedRelease) {
    assert.equal(sha(dir + 'acceptance-release.json'), appliedReleaseSHA256);
    for (const p of appliedRelease.pins) assert.equal(sha(p.path), p.sha256, p.path);
  }
};
checkReleasePins();
assert.equal(release.status, 'INDEPENDENT_DURABLE_JOURNAL_TOOLS_GO_RETEST_RELEASED');
const targets = proposal.files.map(p => p.path);
assert.equal(targets.length, 3);
if (!['boundary', 'baseline'].includes(mode)) {
  assert.equal(appliedRelease.status, 'ACTUAL_BASELINE_AND_EXACT_APPLIED_FIXTURES_PEER_GO');
}
const sourceRegistry = [...beforeCapture.inputs.map(p => p.path), 'vitest.cycle68.config.ts', 'vitest.cycle68-v2.config.ts', 'evidence/cycle-68/worker-guard.ts', 'evidence/cycle-68/worker-guard-v2.ts'];
assert.equal(sourceRegistry.length, 592); assert.equal(new Set(sourceRegistry).size, 592);
const allToolPaths = ['evidence/cycle-68/run-check.mjs', 'evidence/cycle-68/network-guard.cjs', 'evidence/cycle-68/worker-guard.ts', 'vitest.cycle68.config.ts', 'evidence/cycle-68/run-check-v2.mjs', 'evidence/cycle-68/network-guard-v2.cjs', 'evidence/cycle-68/worker-guard-v2.ts', 'vitest.cycle68-v2.config.ts'];
for (const tool of allToolPaths) assert.equal(release.pins.filter(p => p.path === tool).length, 1, 'Release pins every old/new tool exactly once');
const inputs = [...new Set([...sourceRegistry, ...allToolPaths])];
assert.equal(inputs.length, 596);
const pins = () => inputs.map(path => ({ path, sha256: sha(path) }));
const boundary = () => {
  const changed = !['boundary', 'baseline'].includes(mode);
  for (const p of [...beforeCapture.previousSourceTools, ...beforeCapture.preserve, ...beforeCapture.receipts, ...beforeCapture.sdkContractPins, ...beforeCapture.historicalRaw, ...beforeCapture.acceptedC67FrozenReviews, beforeCapture.acceptedC67Closure]) {
    const qualified = changed && proposal.files.find(f => f.path === p.path);
    assert.equal(sha(p.path), qualified ? qualified.afterSHA : p.sha256, p.path);
  }
  for (const p of beforeCapture.inputs) {
    const qualified = changed && proposal.files.find(f => f.path === p.path);
    assert.equal(sha(p.path), qualified ? qualified.afterSHA : p.sha256, p.path);
  }
  for (const p of beforeCapture.deletedSources) assert(!fs.existsSync(p.path), p.path);
  assert.deepEqual(fingerprintRuntime(repo, '6.1.4'), beforeCapture.runtime);
  const git = args => execFileSync('git', args, { encoding: 'utf8', windowsHide: true }).trim();
  assert.deepEqual({ branch: git(['branch', '--show-current']), head: git(['rev-parse', 'HEAD']), indexEntriesSHA256: hash(execFileSync('git', ['ls-files', '--stage', '-z'], { windowsHide: true })) }, beforeCapture.gitBoundary);
};
boundary();
const before = pins(), sourceRegistryBefore = sourceRegistry.map(path => ({ path, sha256: sha(path) })), runtimeBefore = fingerprintRuntime(repo, '6.1.4');
const allowedOSNames = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS', 'SYSTEMDRIVE', 'TZ']);
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => allowedOSNames.has(name.toUpperCase())));
const guard = path.resolve(dir + 'network-guard-v2.cjs').replaceAll('\\', '/');
assert(!guard.includes(' '));
// Preload captures native exit/append before Vitest; transports activate only in probe or worker setup.
env.NODE_OPTIONS = '--require=' + guard;
env.NEXT_TELEMETRY_DISABLED = '1';
env.NODE_ENV = 'test';
env.CI = '1';
const suffixes = [
  'defaults and existing purchase calculation retain their controls with PLN cents',
  'default249 keeps the existing supported purchase and count controls',
  'refuses unsupported price without leaving stale decision metrics amount or voice',
  'preserves return sell rounding and receipt state through invalid-price recovery',
  'preserves default3 price249 and existing purchase controls',
  'refuses negative nonfinite malformed and nonzero-underflow days without stale purchase results',
];
const historical = beforeCapture.historicalRaw.slice(0, 3).map(p => read(p.path));
const historicalTitles = historical.flatMap(r => r.testResults.flatMap(t => t.assertionResults.map(a => a.fullName)));
assert.equal(historicalTitles.length, 38);
const selectedTitles = historicalTitles.filter(t => suffixes.some(s => t.endsWith(' ' + s)));
assert.equal(selectedTitles.length, 12);
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const baselinePattern = '^(?:' + selectedTitles.map(escapeRegExp).join('|') + ')$';
const probe = "(async()=>{const a=require('node:assert/strict');for(const f of [()=>require('node:net').connect(),()=>require('node:tls').connect(),()=>require('node:http').request(),()=>require('node:https').request(),()=>require('node:dns').lookup()])a.throws(f,e=>e.code==='C68_REAL_NETWORK_DISABLED');await a.rejects(fetch('https://synthetic.invalid'),e=>e.code==='C68_REAL_NETWORK_DISABLED');console.log('C68_BOUNDARY_PROBE '+JSON.stringify({syncBlocked:5,asyncBlocked:1,realRequests:0}));})().catch(()=>{process.exitCode=1});";
const args = mode === 'boundary' ? ['-e', probe] : mode === 'typecheck' ? [require.resolve('typescript/bin/tsc'), '--noEmit', '--incremental', 'false'] : [path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), 'run', ...(['baseline', 'acceptance'].includes(mode) ? targets : []), '--config', 'vitest.cycle68-v2.config.ts', ...(mode === 'baseline' ? ['-t', baselinePattern] : []), '--maxWorkers=1', '--reporter=verbose', '--reporter=json', '--outputFile=' + dir + recordMode + '-tests.json'];
const runId = crypto.randomBytes(16).toString('hex');
const journalRelativePath = dir + 'guard-' + recordMode + '-' + runId + '.jsonl';
const journalPath = path.resolve(journalRelativePath);
assert.equal(path.dirname(journalPath), fs.realpathSync(path.resolve(dir)));
fs.writeFileSync(journalPath, '', { flag: 'wx' });
env.COACHFI_C68_GUARD_JOURNAL = journalPath;
const startedAt = new Date().toISOString();
const result = spawnSync(process.execPath, args, { cwd: repo, env, encoding: 'utf8', shell: false, windowsHide: true, maxBuffer: 128 * 1024 * 1024 });
const completedAt = new Date().toISOString(), childPath = dir + recordMode + '-child.json';
fs.writeFileSync(childPath, JSON.stringify({ cycle: 68, mode, startedAt, completedAt, args, pid: result.pid, childExitCode: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error?.message ?? null }, null, 2) + '\n', { flag: 'wx' });
checkReleasePins();
let selection = null, validationError = null, journals = [], ready = [], workerBoundaries = [], dbExitJournals = [];
let blockedNetworkAttempts = [], blockedDevDbAttempts = 0, missingCompletionJournals = [];
let missingNativeExitPids = [], missingDbExitFiles = [];
let durableJournal = null, durableRecords = [], durableWorkerReady = [], durableNativeReady = [], durableCaptureReady = [], durableNativeDenials = [], durableDbDenials = [];
const nativeKinds = new Set(['net.Socket.connect', 'net.connect', 'tls.connect', 'http.request', 'http.get', 'https.request', 'https.get', ...['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'reverse'].flatMap(name => ['dns.' + name, 'dns.promises.' + name]), 'dgram.send', 'fetch']);
const dbKinds = new Set(['dev-db.getDevDb', 'dev-db.devDbPath']);
try {
  durableJournal = { path: journalRelativePath, sha256: null, runId, records: null };
  const bytes = fs.readFileSync(journalPath), text = bytes.toString('utf8');
  durableJournal.sha256 = hash(bytes);
  assert(Buffer.from(text, 'utf8').equals(bytes), 'Journal must be valid UTF8');
  assert(!text.length || text.endsWith('\n'), 'Complete journal lines require final newline');
  const lines = text ? text.slice(0, -1).split('\n') : [];
  durableRecords = lines.map(line => { assert(line.length > 0, 'No empty interior journal lines'); return JSON.parse(line); });
  for (const row of durableRecords) {
    assert(row && typeof row === 'object' && !Array.isArray(row));
    assert(Number.isSafeInteger(row.pid) && row.pid > 0);
    assert.equal(row.runId, runId, 'Journal run ID mismatch');
    const schemas = { 'capture-ready': ['event', 'pid', 'runId'], 'native-ready': ['event', 'pid', 'runId'], 'worker-ready': ['devDbDeny', 'event', 'file', 'pid', 'runId'], 'native-denial': ['event', 'kind', 'pid', 'runId'], 'db-denial': ['event', 'kind', 'pid', 'runId'] };
    assert(Object.hasOwn(schemas, row.event), 'Unknown journal event');
    assert.deepEqual(Object.keys(row).sort(), schemas[row.event].toSorted(), 'Unknown journal fields');
    if (row.event === 'worker-ready') { assert.equal(row.devDbDeny, true); assert.equal(typeof row.file, 'string'); assert(inventory.files.some(p => p.path === row.file), 'Unknown ready test file'); }
    if (row.event === 'native-denial') assert(nativeKinds.has(row.kind), 'Unknown native transport kind');
    if (row.event === 'db-denial') assert(dbKinds.has(row.kind), 'Unknown DB transport kind');
  }
  durableCaptureReady = durableRecords.filter(r => r.event === 'capture-ready');
  durableWorkerReady = durableRecords.filter(r => r.event === 'worker-ready');
  durableNativeReady = durableRecords.filter(r => r.event === 'native-ready');
  durableNativeDenials = durableRecords.filter(r => r.event === 'native-denial');
  durableDbDenials = durableRecords.filter(r => r.event === 'db-denial');
  assert.equal(new Set(durableCaptureReady.map(r => r.pid)).size, durableCaptureReady.length, 'Duplicate capture-ready PID');
  assert(durableCaptureReady.some(r => r.pid === result.pid), 'Child main capture-only preload is durable');
  for (const row of durableRecords.filter(r => r.event !== 'capture-ready')) assert(durableCaptureReady.some(c => c.pid === row.pid), 'Captured native journal primitives for each event PID');
  if (mode !== 'boundary') assert(!durableNativeReady.some(r => r.pid === result.pid), 'Child infrastructure main is capture-only, not transport-trapped');
  assert.equal(new Set(durableNativeReady.map(r => r.pid)).size, durableNativeReady.length, 'Duplicate native-ready PID');
  assert.equal(new Set(durableWorkerReady.map(r => r.pid + ':' + r.file)).size, durableWorkerReady.length, 'Duplicate worker-ready file/PID');
  for (const row of [...durableWorkerReady, ...durableNativeDenials, ...durableDbDenials]) assert(durableNativeReady.some(n => n.pid === row.pid), 'Ready native guard for every event PID');
  durableJournal = { path: journalRelativePath, sha256: hash(bytes), runId, records: durableRecords };
  journals = [...(result.stdout ?? '').matchAll(/C68_REAL_NETWORK_GUARD (\{[^\r\n]*\})/g)].map(m => JSON.parse(m[1]));
  ready = [...(result.stdout ?? '').matchAll(/C68_WORKER_GUARD_READY (\{[^\r\n]*\})/g)].map(m => JSON.parse(m[1]));
  workerBoundaries = [...(result.stdout ?? '').matchAll(/C68_WORKER_BOUNDARY (\{[^\r\n]*\})/g)].map(m => JSON.parse(m[1]));
  dbExitJournals = [...(result.stdout ?? '').matchAll(/C68_WORKER_DB_EXIT (\{[^\r\n]*\})/g)].map(m => JSON.parse(m[1]));
  // Per-file slices and cumulative process-exit journals overlap. Count the longer
  // observed history per PID, not both, and retain both original journal tables.
  const nativeByPid = new Map();
  for (const row of workerBoundaries) nativeByPid.set(row.pid, [...(nativeByPid.get(row.pid) ?? []), ...row.blockedNativeNetwork]);
  for (const row of journals) if ((nativeByPid.get(row.pid)?.length ?? 0) <= row.attempts.length) nativeByPid.set(row.pid, row.attempts);
  blockedNetworkAttempts = [...nativeByPid.values()].flat();
  const dbByFileAndPid = new Map();
  for (const row of [...workerBoundaries, ...dbExitJournals]) {
    const key = row.pid + ':' + row.file;
    dbByFileAndPid.set(key, Math.max(dbByFileAndPid.get(key) ?? 0, row.blockedDevDb));
  }
  blockedDevDbAttempts = [...dbByFileAndPid.values()].reduce((n, value) => n + value, 0);
  missingCompletionJournals = ready.filter(r => !workerBoundaries.some(b => b.pid === r.pid && b.file === r.file)).map(r => r.file);
  missingNativeExitPids = [...new Set(ready.map(r => r.pid))].filter(pid => !journals.some(j => j.phase === 'exit' && j.pid === pid));
  missingDbExitFiles = ready.filter(r => !dbExitJournals.some(j => j.pid === r.pid && j.file === r.file)).map(r => ({ file: r.file, pid: r.pid }));
  if (mode === 'boundary') {
    assert.deepEqual(durableCaptureReady.map(r => r.pid), [result.pid]);
    assert.equal(durableRecords.length, 8, 'Probe capture/native ready plus six denials');
    assert.deepEqual(durableNativeReady.map(r => r.pid), [result.pid], 'Probe durable native-ready');
    assert.equal(durableWorkerReady.length, 0); assert.equal(durableDbDenials.length, 0);
    assert.deepEqual(durableNativeDenials.map(r => ({ pid: r.pid, kind: r.kind })), ['net.connect', 'tls.connect', 'http.request', 'https.request', 'dns.lookup', 'fetch'].map(kind => ({ pid: result.pid, kind })), 'Exactly six durable blocked probe attempts');
    assert.equal(result.status, 0);
    assert((result.stdout ?? '').includes('C68_BOUNDARY_PROBE {"syncBlocked":5,"asyncBlocked":1,"realRequests":0}'));
    for (const row of journals.filter(j => j.phase === 'exit')) assert.deepEqual(row.attempts, ['net.connect', 'tls.connect', 'http.request', 'https.request', 'dns.lookup', 'fetch']);
  } else {
    const boundaryProof = read(dir + 'boundary-retest-run.json');
    assert.equal(boundaryProof.exitCode, 0);
    if (mode !== 'typecheck') {
      const raw = read(dir + recordMode + '-tests.json'), tests = raw.testResults.flatMap(t => t.assertionResults);
      const fileRows = raw.testResults.map(t => ({ file: path.relative(repo, t.name).replaceAll('\\', '/'), status: t.status, assertions: t.assertionResults.map(a => ({ title: a.fullName, status: a.status })) }));
      assert.deepEqual(durableWorkerReady.map(r => r.file).sort(), fileRows.map(r => r.file).sort(), 'Every collected file has durable setup before imports');
      for (const r of ready) assert(durableWorkerReady.some(d => d.file === r.file && d.pid === r.pid && d.runId === r.runId && r.devDbDeny === true), 'Every observed READY matches durable file/PID/runId');
      assert.deepEqual([...new Set(durableNativeReady.map(r => r.pid))].sort((a, b) => a - b), [...new Set(durableWorkerReady.map(r => r.pid))].sort((a, b) => a - b), 'Only exact worker PID set has installed application transport traps');
      selection = { total: raw.numTotalTests, passed: raw.numPassedTests, failed: raw.numFailedTests, pending: raw.numPendingTests, listed: tests.length, files: fileRows, actualSelected: tests.filter(a => a.status !== 'skipped' && a.status !== 'pending').length, skippedTitles: tests.filter(a => a.status === 'skipped' || a.status === 'pending').map(a => a.fullName), failedCases: tests.filter(a => a.status === 'failed').map(a => ({ title: a.fullName, failureMessages: a.failureMessages })), coverageComplete: null };
      assert.equal(selection.total, tests.length);
      if (mode === 'inventory') {
        assert.deepEqual(fileRows.map(t => t.file).sort(), inventory.files.map(p => p.path).sort());
        selection.coverageComplete = true;
      } else {
        assert.deepEqual(fileRows.map(t => t.file).sort(), targets.toSorted());
        assert.deepEqual(tests.map(a => a.fullName).sort(), historicalTitles.toSorted());
        for (const t of raw.testResults) {
          const old = historical.flatMap(r => r.testResults).find(o => path.basename(o.name) === path.basename(t.name));
          assert(old);
          assert.deepEqual(t.assertionResults.map(a => a.fullName), old.assertionResults.map(a => a.fullName));
        }
        assert.equal(selection.total, 38);
        if (mode === 'baseline') {
          assert.equal(selection.actualSelected, 12);
          assert.equal(selection.pending, 26);
          assert.deepEqual(tests.filter(a => a.status !== 'skipped').map(a => a.fullName).sort(), selectedTitles.toSorted());
          assert.equal(selection.skippedTitles.length, 26);
        } else {
          assert.equal(selection.passed, 38); assert.equal(selection.failed, 0); assert.equal(selection.pending, 0);
          assert.equal(selection.skippedTitles.length, 0); assert(tests.every(a => a.status === 'passed'));
        }
      }
    }
    if (mode === 'typecheck') {
      assert.equal(durableNativeReady.length, 0); assert.equal(durableWorkerReady.length, 0);
      assert.equal(durableNativeDenials.length, 0); assert.equal(durableDbDenials.length, 0);
      assert.equal(blockedNetworkAttempts.length, 0); assert.equal(blockedDevDbAttempts, 0);
    }
    if (['baseline', 'acceptance', 'inventory'].includes(mode)) {
      assert.equal(durableNativeDenials.length, 0, 'No durable native denial, including caught or late attempts');
      assert.equal(durableDbDenials.length, 0, 'No durable developer database denial, including caught or late attempts');
      assert.equal(blockedNetworkAttempts.length, 0, 'No recorded native network attempts, including late process-exit journals');
      assert.equal(blockedDevDbAttempts, 0, 'No recorded developer database attempts, including late process-exit journals');
      if (mode !== 'inventory') assert.deepEqual(durableWorkerReady.map(r => r.file).sort(), targets.toSorted());
      // afterAll/exit stdout is retained as auxiliary diagnostics; durable ready/denial rows are authoritative.
    }
  }
} catch (error) { validationError = String(error); }
boundary();
const after = pins(), sourceRegistryAfter = sourceRegistry.map(path => ({ path, sha256: sha(path) })), runtimeAfter = fingerprintRuntime(repo, '6.1.4');
const drift = before.filter((p, i) => p.sha256 !== after[i].sha256), runtimeEqual = JSON.stringify(runtimeBefore) === JSON.stringify(runtimeAfter);
const exitCode = validationError || drift.length || !runtimeEqual ? 1 : result.status ?? 1;
const record = { cycle: 68, mode, recordMode, durableJournal, durableWorkerReady, durableNativeReady, durableCaptureReady, durableNativeDenials, durableDbDenials, sourceRegistryBefore, sourceRegistryAfter, allToolPaths, startedAt, completedAt, childReceipt: { path: childPath, sha256: sha(childPath) }, childExitCode: result.status, exitCode, selectedTests: mode === 'inventory' ? inventory.files.map(p => p.path) : ['baseline', 'acceptance'].includes(mode) ? targets : [], baselineSelectedTitles: mode === 'baseline' ? selectedTitles : null, selection, validationError, guardJournals: journals, workerReady: ready, workerBoundaries, dbExitJournals, blockedNetworkAttempts, blockedDevDbAttempts, missingCompletionJournals, missingNativeExitPids, missingDbExitFiles, before, after, drift, runtimeBefore, runtimeAfter, runtimeEqual, environment: 'Same normal Node include/aliases/JSX with envDir:false; provider/credential env omitted by minimal OS allowlist, reviewed worker setup blocks native network and mocks developer database access with a throwing deny trap. Runner main imports only audited Vite/config/infrastructure, no application modules. C38 eight parser/assert children use explicit env:{} and are separately audited exceptions. Existing installed runtime, synthetic fixtures/mocks; no browser/build/provider/Auth/RLS/staging/production or cleaninstall acceptance.', qualification: mode === 'inventory' ? 'One fresh full normal-include local inventory. Raw failures are retained, not force-fixed or green-rerun here; coverage and outcomes are separate.' : 'Representation adapters only; boundary probe is infrastructure evidence, not app cases. Baseline deliberately selects12/38, remaining26 are explicit unselected, not accepted cases.' };
fs.writeFileSync(dir + recordMode + '-run.json', JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ mode, exitCode, childExitCode: result.status, inputs: before.length, drift: drift.length, runtimeEqual, validationError, selected: selection && { total: selection.total, passed: selection.passed, failed: selection.failed, pending: selection.pending, files: selection.files.length, coverageComplete: selection.coverageComplete }, guardProcesses: new Set(journals.map(j => j.pid)).size, blockedAttempts: record.blockedNetworkAttempts.length }));
process.exitCode = exitCode;
