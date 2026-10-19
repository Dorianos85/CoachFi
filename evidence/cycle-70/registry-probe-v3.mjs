import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { fingerprintRuntime } from '../cycle-38/runtime-fingerprint.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const at = p => path.resolve(root, p);
const read = p => fs.readFileSync(at(p), 'utf8');
const json = p => JSON.parse(read(p));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const pin = p => ({ path: p, sha256: hash(fs.readFileSync(at(p))) });
const expectedLock = '3f981656236872e8db5d21fafbd6edc7b0ecd92c3755abc8caa562cf7e94b703';
const target = 'node_modules/cssesc';
const url = 'https://registry.npmjs.org/cssesc/-/cssesc-3.0.0.tgz';
const integrity = 'sha512-/Tb/JcjK111nNScGob5MNtsntNM1aCNUDipB/TkwZFhyDrrE47SOx/18wF2bbjgc3ZzCSKW1T5nt5EbFoAz/Vg==';
const maxBytes = 512 * 1024;
const deadlineMs = 15000;
const envKeys = ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP'];
const code = e => typeof e?.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(e.code) ? e.code : 'UNCLASSIFIED_ERROR';
const releasePath = 'evidence/cycle-70/registry-probe-release-v3.json';
const archivePath = 'evidence/cycle-70/artifacts/cssesc-3.0.0.tgz';
const runPath = 'evidence/cycle-70/registry-probe-run-v3.json';
const rawChildPath = 'evidence/cycle-70/registry-probe-child-v3.json';

function absentLeaf(p) {
  let entry;
  try { entry = fs.lstatSync(at(p)); }
  catch (e) { if (e.code === 'ENOENT') return; throw e; }
  assert.equal(entry, undefined, `Expected absent leaf: ${p}`);
}

function knownDirectory(p) {
  const s = fs.lstatSync(at(p));
  assert(s.isDirectory() && !s.isSymbolicLink(), p);
  const expected = path.resolve(fs.realpathSync.native(root), p);
  assert.equal(fs.realpathSync.native(at(p)).toLowerCase(), expected.toLowerCase(), p);
}

function taskTopology() {
  knownDirectory('evidence');
  knownDirectory('evidence/cycle-70');
  try { fs.lstatSync(at('evidence/cycle-70/artifacts')); knownDirectory('evidence/cycle-70/artifacts'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
}

function writeNewTaskFile(p, body) {
  taskTopology();
  assert(p.startsWith('evidence/cycle-70/') && !p.includes('..'));
  absentLeaf(p);
  fs.writeFileSync(at(p), body, { flag: 'wx' });
}

function authorization() {
  const text = read(releasePath), release = JSON.parse(text);
  assert.equal(release.status, 'GO_ONE_BOUNDED_PUBLIC_CURRENT_LOCK_GET');
  const required = {
    tool: 'evidence/cycle-70/registry-probe-v3.mjs', before: 'evidence/cycle-70/before.json',
    design: 'evidence/cycle-70/registry-probe-design-v3.json',
    oracle: 'evidence/cycle-70/lock-oracle.json', artifactPlan: 'evidence/cycle-70/artifact-plan.json',
  };
  for (const [key, p] of Object.entries(required)) assert.equal(release[key].path, p);
  const pins = [...Object.keys(required).map(key => release[key]), ...release.pins];
  for (const x of pins) assert.equal(pin(x.path).sha256, x.sha256, x.path);
  return { release, releasePin: { path: releasePath, sha256: hash(text) }, pins };
}

function checkLock() {
  assert.equal(pin('package-lock.json').sha256, expectedLock);
  const p = json('package-lock.json').packages[target];
  assert.equal(p.version, '3.0.0');
  assert.equal(p.resolved, url);
  assert.equal(p.integrity, integrity);
}

function boundary(b) {
  const pins = [...b.sourcePins, ...b.inputPins, ...b.preserve, ...b.receipts,
    ...b.sdkContractPins, ...b.closurePins, ...b.metadataPins];
  for (const x of pins) assert.equal(pin(x.path).sha256, x.sha256, x.path);
  for (const x of b.deletedSources) assert.equal(fs.existsSync(at(x.path)), false, x.path);
  const git = {
    branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    indexEntriesSHA256: hash(execFileSync('git', ['ls-files', '--stage', '-z'], { cwd: root })),
  };
  assert.deepEqual(git, b.gitBoundary);
  assert.deepEqual(fingerprintRuntime(root, b.runtime.parserVersion), b.runtime);
  return { sourcePaths: b.sourcePins.length, inputs: b.inputPins.length, preserve: b.preserve.length,
    receipts: b.receipts.length, sdk: b.sdkContractPins.length, drift: 0, runtimeEqual: true, git };
}

async function child(expectedReleaseSHA256) {
  checkLock();
  const allowed = new Set(envKeys.map(k => k.toLowerCase()));
  const removableOSKeys = new Set(['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'SYSTEMDRIVE', 'USERDOMAIN', 'USERNAME', 'USERPROFILE'].map(k => k.toLowerCase()));
  const removedEnvironmentKeysOnly = Object.keys(process.env).filter(k => !allowed.has(k.toLowerCase()));
  assert.equal(process.platform, 'win32');
  assert(removedEnvironmentKeysOnly.every(k => removableOSKeys.has(k.toLowerCase())));
  for (const key of removedEnvironmentKeysOnly) delete process.env[key];
  assert(Object.keys(process.env).every(k => allowed.has(k.toLowerCase())));
  const auth = authorization();
  assert.equal(auth.releasePin.sha256, expectedReleaseSHA256);
  taskTopology(); absentLeaf(runPath); absentLeaf(rawChildPath); absentLeaf(archivePath);
  const attemptPath = 'evidence/cycle-70/registry-probe-attempt-v3.json';
  writeNewTaskFile(attemptPath, JSON.stringify({ cycle: 'C70', at: new Date().toISOString(),
    status: 'DURABLE_INTENT_BEFORE_SINGLE_HTTPS_GET_NO_AUTOMATIC_RETRY', attemptsAuthorized: 1,
    target, url, integrity, release: auth.releasePin,
    tool: pin('evidence/cycle-70/registry-probe-v3.mjs'), removedEnvironmentKeysOnly, environmentKeysOnly: Object.keys(process.env),
  }, null, 2) + '\n');
  const start = Date.now();
  const result = { startedAt: new Date(start).toISOString(), attempts: 1, target, url,
    expectedIntegrity: integrity, maxBytes, deadlineMs, redirectsFollowed: 0, retries: 0,
    credentials: false, removedEnvironmentKeysOnly, environmentKeysOnly: Object.keys(process.env), release: auth.releasePin, attempt: pin(attemptPath), bytesReceived: 0, httpStatus: null, errorCode: null, archive: null };
  await new Promise(resolve => {
    let settled = false;
    const chunks = [];
    let timer;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) result.errorCode = code(error);
      resolve();
    };
    const request = https.get(url, {
      agent: false, rejectUnauthorized: true, method: 'GET',
      headers: { Accept: 'application/octet-stream', 'User-Agent': 'Coachfi-C70-Local-Artifact-Availability' },
    }, response => {
      result.httpStatus = response.statusCode;
      response.on('data', chunk => {
        if (settled) return;
        result.bytesReceived += chunk.length;
        if (result.bytesReceived > maxBytes) {
          const error = Object.assign(new Error(), { code: 'C70_BODY_LIMIT' });
          request.destroy(error); response.destroy(error); finish(error);
        } else if (response.statusCode === 200) chunks.push(chunk);
      });
      response.on('error', finish);
      response.on('aborted', () => finish(Object.assign(new Error(), { code: 'C70_RESPONSE_ABORTED' })));
      response.on('end', () => {
        if (settled) return;
        if (response.statusCode === 200) {
          const body = Buffer.concat(chunks);
          const actual = `sha512-${crypto.createHash('sha512').update(body).digest('base64')}`;
          result.actualIntegrity = actual;
          if (actual !== integrity) return finish(Object.assign(new Error(), { code: 'C70_INTEGRITY_MISMATCH' }));
          try {
            taskTopology(); absentLeaf(archivePath);
            if (!fs.existsSync(at('evidence/cycle-70/artifacts'))) fs.mkdirSync(at('evidence/cycle-70/artifacts'));
            writeNewTaskFile(archivePath, body);
            result.archive = { ...pin(archivePath), bytes: body.length, integrity: actual };
          } catch (e) { return finish(e); }
        }
        finish();
      });
    });
    request.on('error', finish);
    timer = setTimeout(() => request.destroy(Object.assign(new Error(), { code: 'C70_DEADLINE' })), deadlineMs);
  });
  result.completedAt = new Date().toISOString();
  result.durationMs = Date.now() - start;
  process.stdout.write(JSON.stringify(result) + '\n');
}

function parent() {
  checkLock();
  taskTopology(); absentLeaf(runPath); absentLeaf(rawChildPath); absentLeaf(archivePath);
  absentLeaf('evidence/cycle-70/registry-probe-attempt-v3.json');
  const auth = authorization(), { release } = auth;
  const b = json(release.before.path);
  const before = boundary(b);
  const env = Object.fromEntries(envKeys.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
  const startedAt = new Date().toISOString();
  const childResult = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child', auth.releasePin.sha256], {
    cwd: root, env, encoding: 'utf8', windowsHide: true, timeout: 25000, maxBuffer: 1024 * 1024,
  });
  // Preserve the raw child before interpreting JSON or checking later mutable boundaries.
  writeNewTaskFile(rawChildPath, JSON.stringify({ cycle: 'C70', startedAt, completedAt: new Date().toISOString(),
    exitCode: childResult.status, signal: childResult.signal, errorCode: childResult.error ? code(childResult.error) : null,
    stdout: childResult.stdout, stderr: childResult.stderr }, null, 2) + '\n');
  const childReceipt = pin(rawChildPath);
  let observation = null, observationError = null, after = null, boundaryError = null;
  try {
    assert.equal(childResult.error, undefined);
    assert.equal(childResult.status, 0);
    observation = JSON.parse(childResult.stdout);
    assert.equal(observation.attempts, 1);
    assert.equal(observation.url, url);
    assert.equal(observation.expectedIntegrity, integrity);
    assert.equal(observation.redirectsFollowed, 0);
    assert.equal(observation.retries, 0);
    assert.equal(observation.credentials, false);
    assert.deepEqual(observation.release, auth.releasePin);
    assert.equal(observation.attempt.path, 'evidence/cycle-70/registry-probe-attempt-v3.json');
    assert.equal(pin(observation.attempt.path).sha256, observation.attempt.sha256);
    if (observation.archive) {
      assert.equal(observation.archive.path, 'evidence/cycle-70/artifacts/cssesc-3.0.0.tgz');
      assert.equal(pin(observation.archive.path).sha256, observation.archive.sha256);
      assert.equal(observation.archive.integrity, integrity);
    }
  } catch (e) { observationError = code(e); }
  try {
    after = boundary(b); taskTopology();
    assert.equal(pin(releasePath).sha256, auth.releasePin.sha256);
    for (const x of auth.pins) assert.equal(pin(x.path).sha256, x.sha256, x.path);
  }
  catch (e) { boundaryError = code(e); }
  const status = observationError || boundaryError ? 'FAIL_OBSERVATION_OR_BOUNDARY'
    : observation.archive ? 'ONE_CURRENT_LOCK_ARCHIVE_VERIFIED_COMPLETE_SET_STILL_UNESTABLISHED'
    : 'RESOURCE_GATE_DEFER_NO_ARCHIVE_FROM_ONE_OFFICIAL_GET';
  const result = { cycle: 'C70', startedAt, completedAt: new Date().toISOString(), status,
    release: auth.releasePin, checkedReleasePins: auth.pins, before, after, boundaryError, childReceipt,
    environmentKeysOnly: Object.keys(env),
    observation, observationError, applicationTests: 0, installedOrExtractedPackages: 0,
    qualification: 'One unauthenticated public current-lock artifact observation; not npm/global registry availability, full archive coverage, candidate7.1.6, clean install, advisory or production PASS.' };
  writeNewTaskFile(runPath, JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ status, receipt: pin(runPath), observationError, boundaryError,
    httpStatus: observation?.httpStatus, networkErrorCode: observation?.errorCode, bytesReceived: observation?.bytesReceived }) + '\n');
  if (observationError || boundaryError) process.exitCode = 1;
}

if (process.argv.length === 4 && process.argv[2] === '--child' && /^[a-f0-9]{64}$/.test(process.argv[3])) await child(process.argv[3]);
else if (process.argv.length === 2) parent();
else throw new Error('C70 accepts only the fixed parent or internal child mode');
