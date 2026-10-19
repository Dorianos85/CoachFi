import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync, execFileSync } from 'node:child_process';
import { fingerprintRuntime } from '../cycle-38/runtime-fingerprint.mjs';
import { parseJournal } from './journal.mjs';

const dir = 'evidence/cycle-69/', mode = process.argv[2];
assert.equal(process.argv.length, 3);
assert(['probe', 'focused', 'inventory', 'typecheck'].includes(mode));
for (const suffix of ['-run.json', '-child.json', '-tests.json']) assert(!fs.existsSync(dir + mode + suffix), 'One-shot evidence');
const repo = fs.realpathSync(process.cwd()), require = createRequire(path.join(repo, 'package.json'));
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const sha = p => hash(fs.readFileSync(p));
const read = p => JSON.parse(fs.readFileSync(p));
const freeze = read(dir + 'source-freeze.json'), manifest = read(dir + 'input-manifest.json');
const release = read(dir + 'execution-release.json'), releaseSHA = sha(dir + 'execution-release.json');
assert.equal(release.status, 'INDEPENDENT_APPLIED_SOURCE_AND_TOOLS_GO');
let probeEvidence = null;
const boundary = () => {
  assert.equal(sha(dir + 'execution-release.json'), releaseSHA);
  for (const p of release.pins) assert.equal(sha(p.path), p.sha256, p.path);
  if (probeEvidence) for (const p of probeEvidence) assert.equal(sha(p.path), p.sha256, p.path);
  for (const p of [...freeze.fingerprints, ...freeze.toolFingerprints, ...freeze.previousSourceTools,
    ...freeze.preserve, ...freeze.receipts, ...freeze.sdkContractPins, ...manifest.inputs]) assert.equal(sha(p.path), p.sha256, p.path);
  for (const p of freeze.deletedSources) assert(!fs.existsSync(p.path));
  assert.deepEqual(fingerprintRuntime(repo, '6.1.4'), freeze.runtime);
  const git = args => execFileSync('git', args, { encoding: 'utf8', windowsHide: true }).trim();
  assert.deepEqual({ branch: git(['branch', '--show-current']), head: git(['rev-parse', 'HEAD']),
    indexEntriesSHA256: hash(execFileSync('git', ['ls-files', '--stage', '-z'], { windowsHide: true })) }, freeze.gitBoundary);
};
boundary();
if (mode !== 'probe') {
  const probe = read(dir + 'probe-run.json');
  assert.equal(probe.exitCode, 0);
  assert.equal(probe.validationError, null);
  assert.deepEqual(probe.before, manifest.inputs);
  assert.deepEqual(probe.after, manifest.inputs);
  assert.deepEqual(probe.runtimeAfter, freeze.runtime);
  assert.equal(probe.childExitCode, 0);
  assert.equal(sha(probe.childReceipt.path), probe.childReceipt.sha256);
  assert.equal(sha(probe.journal.path), probe.journal.sha256);
  const child = read(probe.childReceipt.path);
  assert.equal(child.childExitCode, 0);
  assert((child.stdout ?? '').includes('C69_PROBE_OK'));
  parseJournal(fs.readFileSync(probe.journal.path), { mode: 'probe', runId: probe.journal.runId, mainPid: child.pid, expectedFiles: [] });
  probeEvidence = [dir + 'probe-run.json', probe.childReceipt.path, probe.journal.path].map(p => ({ path: p, sha256: sha(p) }));
}
const pins = () => manifest.inputs.map(p => ({ path: p.path, sha256: sha(p.path) }));
const before = pins(), runtimeBefore = fingerprintRuntime(repo, '6.1.4');
const inventory = read(dir + 'suite-inventory.json');
const expectedFiles = ['probe', 'typecheck'].includes(mode) ? [] : mode === 'focused' ? release.focusedFiles : inventory.files.map(p => p.path);
assert.equal(new Set(expectedFiles).size, expectedFiles.length);
for (const f of expectedFiles) assert(inventory.files.some(p => p.path === f));
const osNames = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS', 'SYSTEMDRIVE', 'TZ']);
const env = Object.fromEntries(Object.entries(process.env).filter(([n]) => osNames.has(n.toUpperCase())));
const guard = path.resolve(dir + 'network-guard.cjs').replaceAll('\\', '/');
assert(!guard.includes(' '));
Object.assign(env, { NODE_OPTIONS: '--require=' + guard, NODE_ENV: 'test', CI: '1', NEXT_TELEMETRY_DISABLED: '1' });
const runId = crypto.randomBytes(16).toString('hex');
const journalPath = dir + 'guard-' + mode + '-' + runId + '.jsonl';
fs.writeFileSync(journalPath, '', { flag: 'wx' });
env.COACHFI_C69_GUARD_JOURNAL = path.resolve(journalPath);
const probeCode = "(async()=>{const a=require('node:assert/strict');for(const f of [()=>require('node:net').connect(),()=>require('node:tls').connect(),()=>require('node:http').request(),()=>require('node:https').request(),()=>require('node:dns').lookup()])a.throws(f,e=>e.code==='C69_REAL_NETWORK_DISABLED');await a.rejects(fetch('https://synthetic.invalid'),e=>e.code==='C69_REAL_NETWORK_DISABLED');console.log('C69_PROBE_OK');})().catch(()=>{process.exitCode=1});";
const args = mode === 'probe' ? ['-e', probeCode] : mode === 'typecheck' ? [require.resolve('typescript/bin/tsc'), '--noEmit', '--incremental', 'false'] :
  [path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), 'run', ...(mode === 'focused' ? expectedFiles : []),
    '--config', 'vitest.cycle69.config.ts', '--maxWorkers=1', '--reporter=verbose', '--reporter=json', '--outputFile=' + dir + mode + '-tests.json'];
const startedAt = new Date().toISOString();
const result = spawnSync(process.execPath, args, { cwd: repo, env, encoding: 'utf8', shell: false, windowsHide: true, maxBuffer: 128 * 1024 * 1024 });
const completedAt = new Date().toISOString(), childPath = dir + mode + '-child.json';
fs.writeFileSync(childPath, JSON.stringify({ cycle: 69, mode, startedAt, completedAt, args, pid: result.pid,
  childExitCode: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error?.message ?? null }, null, 2) + '\n', { flag: 'wx' });
let journal = null, selection = null, validationError = null;
try {
  assert.equal(result.error, undefined, 'Child launched');
  journal = parseJournal(fs.readFileSync(journalPath), { mode: mode === 'probe' ? 'probe' : mode === 'typecheck' ? 'typecheck' : 'app',
    runId, mainPid: result.pid, expectedFiles });
  if (mode === 'probe') assert((result.stdout ?? '').includes('C69_PROBE_OK'));
  if (!['probe', 'typecheck'].includes(mode)) {
    const raw = read(dir + mode + '-tests.json');
    const files = raw.testResults.map(t => ({ file: path.relative(repo, t.name).replaceAll('\\', '/'), status: t.status,
      cases: t.assertionResults.map((a, index) => ({ index, title: a.fullName, status: a.status })) }));
    assert.deepEqual(files.map(f => f.file).sort(), expectedFiles.toSorted(), 'Exact collected file coverage');
    assert.equal(new Set(files.map(f => f.file)).size, expectedFiles.length);
    const ready = [...(result.stdout ?? '').matchAll(/C69_WORKER_GUARD_READY (\{[^\r\n]*\})/g)].map(m => JSON.parse(m[1]));
    assert.deepEqual(ready, journal.epochs.map(e => ({ file: e.file, pid: e.pid, runId, devDbDeny: true })), 'Stdout agrees with durable ordered epochs');
    const boundaries = [...(result.stdout ?? '').matchAll(/C69_WORKER_BOUNDARY (\{[^\r\n]*\})/g)].map(m => JSON.parse(m[1]));
    for (const b of boundaries) { assert.equal(b.runId, runId); assert.deepEqual(b.blockedNativeNetwork, []); assert.equal(b.blockedDevDb, 0); }
    const cases = files.flatMap(f => f.cases);
    selection = { files, total: cases.length, passed: cases.filter(c => c.status === 'passed').length,
      failed: cases.filter(c => c.status === 'failed').length, skipped: cases.filter(c => ['pending', 'skipped'].includes(c.status)).length,
      failedCases: raw.testResults.flatMap(f => f.assertionResults.filter(c => c.status === 'failed').map(c => ({ file: path.relative(repo, f.name).replaceAll('\\', '/'), title: c.fullName, failureMessages: c.failureMessages }))) };
    assert.equal(raw.numTotalTests, selection.total); assert.equal(raw.numPassedTests, selection.passed);
    assert.equal(raw.numFailedTests, selection.failed); assert.equal(raw.numPendingTests, selection.skipped);
    assert(cases.every(c => ['passed', 'failed', 'pending', 'skipped'].includes(c.status)));
    assert(files.every(f => f.status !== 'failed' || f.cases.some(c => c.status === 'failed')), 'No hidden collection-only failure');
    const baseline = read(dir + 'before.json').baselineFiles;
    for (const old of baseline) {
      const now = files.find(f => f.file === old.file);
      assert(now, 'All seven historical affected files covered');
      assert.deepEqual(now.cases.map(c => c.title), old.assertions.map(c => c.title), 'Every historical title/order retained');
    }
    assert.equal(selection.skipped, 0, 'No exclusions or skipped cases');
    assert.equal(result.status, selection.failed ? 1 : 0, 'Child exit agrees with case outcomes');
  }
} catch (error) { validationError = String(error); }
// Immutable release data and complete source/runtime boundary are checked after every child too.
let postBoundaryError = null, runtimeAfter = null;
try { boundary(); } catch (error) { postBoundaryError = String(error); }
const after = manifest.inputs.map(p => {
  try { return { path: p.path, sha256: sha(p.path) }; }
  catch (error) { return { path: p.path, sha256: null, error: String(error) }; }
});
try { runtimeAfter = fingerprintRuntime(repo, '6.1.4'); }
catch (error) { postBoundaryError = [postBoundaryError, String(error)].filter(Boolean).join('\n'); }
const drift = before.filter((p, i) => p.sha256 !== after[i].sha256), runtimeEqual = JSON.stringify(runtimeBefore) === JSON.stringify(runtimeAfter);
let journalSHA256 = null;
try { journalSHA256 = sha(journalPath); }
catch (error) { validationError = [validationError, String(error)].filter(Boolean).join('\n'); }
const exitCode = validationError || postBoundaryError || drift.length || !runtimeEqual ? 1 : result.status ?? 1;
const record = { cycle: 69, mode, startedAt, completedAt, childReceipt: { path: childPath, sha256: sha(childPath) }, childExitCode: result.status,
  exitCode, validationError, journal: { path: journalPath, sha256: journalSHA256, runId, admission: journal }, selection,
  before, after, drift, runtimeBefore, runtimeAfter, runtimeEqual, postBoundaryError, probeEvidence, environment: 'Explicit12OSenvallowlist; no project.env/credentials, capture-only main, reviewed native/devDB deny workers; C38 eight env:{} pure parser children separately source-audited.',
  qualification: 'Local installedruntime synthetic fixtures/emulatedReact. No browser/build/provider/Auth/RLS/staging/production/cleaninstall/CVE acceptance. Historical C68 actualFAIL baseline retained.' };
fs.writeFileSync(dir + mode + '-run.json', JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ mode, exitCode, childExitCode: result.status, validationError, inputs: before.length, drift: drift.length, runtimeEqual,
  journalRows: journal?.records.length, workerEpochs: journal?.workerEpochs, selection: selection && { files: selection.files.length, total: selection.total, passed: selection.passed, failed: selection.failed, skipped: selection.skipped } }));
process.exitCode = exitCode;
