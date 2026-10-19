import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import assert from 'node:assert/strict';
import { fingerprintRuntime } from '../cycle-38/runtime-fingerprint.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const at = p => path.resolve(root, p);
const read = p => fs.readFileSync(at(p), 'utf8');
const json = p => JSON.parse(read(p));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const pin = p => ({ path: p, sha256: hash(fs.readFileSync(at(p))) });
const code = e => typeof e?.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(e.code) ? e.code : 'UNCLASSIFIED_ERROR';
const fail = name => Object.assign(new Error(), { code: name });
const toolPath = 'evidence/cycle-71/acquire.mjs';
const releasePath = 'evidence/cycle-71/acquisition-release.json';
const runPath = 'evidence/cycle-71/acquisition-run.json';
const rawChildPath = 'evidence/cycle-71/acquisition-child.json';
const metadataPath = 'evidence/cycle-71/candidate-metadata.json';
const archivePath = 'evidence/cycle-71/artifacts/postcss-selector-parser-7.1.6.tgz';
const intents = { metadata: 'evidence/cycle-71/metadata-attempt.json', tarball: 'evidence/cycle-71/tarball-attempt.json' };
const metadataURL = 'https://registry.npmjs.org/postcss-selector-parser/7.1.6';
const tarballURL = 'https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-7.1.6.tgz';
const expectedLock = '3f981656236872e8db5d21fafbd6edc7b0ecd92c3755abc8caa562cf7e94b703';
const envKeys = ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP'];
const outputPaths = new Set([runPath, rawChildPath, metadataPath, archivePath, ...Object.values(intents)]);
const stageLimits = { metadata: 256 * 1024, tarball: 512 * 1024 };
const requestDeadlineMs = 15000;
const totalRequestBudgetMs = 30000;

function absentLeaf(p) {
  let entry;
  try { entry = fs.lstatSync(at(p)); }
  catch (e) { if (e.code === 'ENOENT') return; throw e; }
  assert.equal(entry, undefined, 'Expected absent task output: ' + p);
}
function knownDirectory(p) {
  const s = fs.lstatSync(at(p));
  assert(s.isDirectory() && !s.isSymbolicLink(), p);
  assert.equal(fs.realpathSync.native(at(p)).toLowerCase(), path.resolve(fs.realpathSync.native(root), p).toLowerCase(), p);
}
function taskTopology() {
  knownDirectory('evidence'); knownDirectory('evidence/cycle-71');
  try { fs.lstatSync(at('evidence/cycle-71/artifacts')); knownDirectory('evidence/cycle-71/artifacts'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
}
function writeNewTaskFile(p, body) {
  taskTopology(); assert(outputPaths.has(p)); absentLeaf(p);
  fs.writeFileSync(at(p), body, { flag: 'wx' });
}
function authorization() {
  const text = read(releasePath), release = JSON.parse(text);
  assert.equal(release.status, 'GO_ONE_FIXED_CANDIDATE_METADATA_AND_CONDITIONAL_TARBALL_C71');
  const required = { tool: toolPath, before: 'evidence/cycle-71/before.json', plan: 'evidence/cycle-71/acquisition-plan-v2.json' };
  for (const [key, p] of Object.entries(required)) assert.equal(release[key].path, p);
  assert(Array.isArray(release.pins) && release.pins.length > 0);
  const pins = [...Object.keys(required).map(key => release[key]), ...release.pins];
  for (const x of pins) {
    assert.equal(typeof x.path, 'string'); assert(/^[a-f0-9]{64}$/.test(x.sha256));
    assert.equal(pin(x.path).sha256, x.sha256, x.path);
  }
  return { release, releasePin: { path: releasePath, sha256: hash(text) }, pins };
}
function checkCurrentState() {
  assert.equal(pin('package-lock.json').sha256, expectedLock);
  assert.equal(json('node_modules/postcss-selector-parser/package.json').version, '6.1.4');
  const tailwind = json('node_modules/tailwindcss/package.json'), nested = json('node_modules/postcss-nested/package.json');
  assert.equal(tailwind.version, '3.4.19'); assert.equal(tailwind.dependencies['postcss-selector-parser'], '^6.1.2');
  assert.equal(nested.version, '6.2.0'); assert.equal(nested.dependencies['postcss-selector-parser'], '^6.1.1');
}
function boundary(b) {
  const pins = [...b.sourcePins, ...b.inputPins, ...b.preserve, ...b.receipts, ...b.sdkContractPins, ...b.closurePins, ...b.metadataPins];
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
function cleanChildEnvironment() {
  const allowed = new Set(envKeys.map(k => k.toLowerCase()));
  const removable = new Set(['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'SYSTEMDRIVE', 'USERDOMAIN', 'USERNAME', 'USERPROFILE'].map(k => k.toLowerCase()));
  const removedEnvironmentKeysOnly = Object.keys(process.env).filter(k => !allowed.has(k.toLowerCase()));
  assert.equal(process.platform, 'win32');
  assert(removedEnvironmentKeysOnly.every(k => removable.has(k.toLowerCase())));
  for (const key of removedEnvironmentKeysOnly) delete process.env[key];
  assert.deepEqual(Object.keys(process.env).map(k => k.toLowerCase()).sort(), [...allowed].sort());
  return { removedEnvironmentKeysOnly, environmentKeysOnly: Object.keys(process.env) };
}
function officialURL(value, expected) {
  if (typeof value !== 'string') throw fail('C71_METADATA_URL');
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.hostname !== 'registry.npmjs.org' || (u.port && u.port !== '443') ||
      u.username || u.password || u.search || u.hash || value !== expected) throw fail('C71_METADATA_URL');
  return value;
}
function canonicalIntegrity(value) {
  if (typeof value !== 'string') throw fail('C71_METADATA_INTEGRITY');
  const match = /^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw fail('C71_METADATA_INTEGRITY');
  const bytes = Buffer.from(match[1], 'base64');
  if (bytes.length !== 64 || bytes.toString('base64') !== match[1]) throw fail('C71_METADATA_INTEGRITY');
  return value;
}
function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function safePath(value, exportsTarget = false) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_./*+-]{1,256}$/.test(value) ||
      value.startsWith('/') || value.split('/').some(x => x === '..' || x === '') ||
      (exportsTarget && !value.startsWith('./'))) throw fail('C71_METADATA_PATH');
  return value;
}
function safeMap(value, keyLimit, countLimit) {
  if (!plain(value) || Object.keys(value).length > countLimit) throw fail('C71_METADATA_MAP');
  const out = Object.create(null);
  for (const [key, entry] of Object.entries(value)) {
    if (key.length > keyLimit || !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(key) ||
        typeof entry !== 'string' || !/^[0-9A-Za-z.*+<>=~^| -]{1,128}$/.test(entry)) throw fail('C71_METADATA_MAP');
    out[key] = entry;
  }
  return out;
}
function safeExports(value, depth = 0, budget = { nodes: 0 }) {
  if (++budget.nodes > 256 || depth > 8) throw fail('C71_METADATA_EXPORTS');
  if (value === null) return null;
  if (typeof value === 'string') return safePath(value, true);
  if (Array.isArray(value)) {
    if (value.length > 32) throw fail('C71_METADATA_EXPORTS');
    return value.map(x => safeExports(x, depth + 1, budget));
  }
  if (!plain(value) || Object.keys(value).length > 64) throw fail('C71_METADATA_EXPORTS');
  const out = Object.create(null);
  for (const [key, entry] of Object.entries(value)) {
    if (!/^[A-Za-z0-9_.*\/-]{1,128}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) throw fail('C71_METADATA_EXPORTS');
    out[key] = safeExports(entry, depth + 1, budget);
  }
  return out;
}
function sanitizeMetadata(body) {
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)); }
  catch { throw fail('C71_METADATA_UTF8_JSON'); }
  if (!plain(value) || value.name !== 'postcss-selector-parser' || value.version !== '7.1.6' || !plain(value.dist)) throw fail('C71_METADATA_IDENTITY');
  const out = { name: value.name, version: value.version };
  for (const key of ['main', 'types']) if (Object.hasOwn(value, key)) out[key] = safePath(value[key]);
  if (Object.hasOwn(value, 'type')) {
    if (!['module', 'commonjs'].includes(value.type)) throw fail('C71_METADATA_TYPE');
    out.type = value.type;
  }
  if (Object.hasOwn(value, 'exports')) out.exports = safeExports(value.exports);
  if (Object.hasOwn(value, 'engines')) out.engines = safeMap(value.engines, 64, 16);
  if (Object.hasOwn(value, 'dependencies')) out.dependencies = safeMap(value.dependencies, 128, 64);
  out.dist = { tarball: officialURL(value.dist.tarball, tarballURL), integrity: canonicalIntegrity(value.dist.integrity) };
  if (Object.hasOwn(value.dist, 'shasum')) {
    if (typeof value.dist.shasum !== 'string' || !/^[a-f0-9]{40}$/.test(value.dist.shasum)) throw fail('C71_METADATA_SHASUM');
    out.dist.shasum = value.dist.shasum;
  }
  for (const key of ['unpackedSize', 'fileCount', 'size']) if (Object.hasOwn(value.dist, key)) {
    if (!Number.isSafeInteger(value.dist[key]) || value.dist[key] < 0) throw fail('C71_METADATA_SIZE');
    out.dist[key] = value.dist[key];
  }
  return out;
}
async function requestOnce(stage, fixedURL, capturedRelease, budgetEnd, envObservation, expectedIntegrity = null) {
  officialURL(fixedURL, stage === 'metadata' ? metadataURL : tarballURL);
  const auth = authorization(); assert.deepEqual(auth.releasePin, capturedRelease);
  const remainingMs = budgetEnd - Date.now();
  if (remainingMs <= 0) throw fail('C71_TOTAL_DEADLINE');
  const deadlineMs = Math.min(requestDeadlineMs, remainingMs), maxBytes = stageLimits[stage];
  writeNewTaskFile(intents[stage], JSON.stringify({ cycle: 'C71', at: new Date().toISOString(),
    status: 'DURABLE_INTENT_BEFORE_ONE_HTTPS_GET_NO_RETRY', stage, url: fixedURL, expectedIntegrity,
    maxBytes, deadlineMs, totalRequestBudgetMs, release: capturedRelease, tool: pin(toolPath), ...envObservation,
  }, null, 2) + '\n');
  const result = { stage, url: fixedURL, attempt: pin(intents[stage]), httpStatus: null, bytesReceived: 0,
    rawBodySHA256: null, rawBodyHashedBytes: 0, rawBodyComplete: false, errorCode: null, deadlineMs, maxBytes, expectedIntegrity,
    redirectsFollowed: 0, retries: 0, credentials: false, startedAt: new Date().toISOString() };
  const body = await new Promise(resolve => {
    let settled = false, timer, responseRef;
    const chunks = [], digest = crypto.createHash('sha256');
    const finish = (error, complete = false) => {
      if (settled) return;
      settled = true; clearTimeout(timer); result.rawBodySHA256 = digest.digest('hex'); result.rawBodyComplete = complete;
      if (error) result.errorCode = code(error);
      resolve(complete && result.httpStatus === 200 ? Buffer.concat(chunks) : null);
    };
    const request = https.get(fixedURL, { agent: false, rejectUnauthorized: true, method: 'GET',
      headers: { Accept: stage === 'metadata' ? 'application/json' : 'application/octet-stream', 'User-Agent': 'Coachfi-C71-Local-Candidate-Provenance' },
    }, response => {
      responseRef = response; result.httpStatus = response.statusCode;
      response.on('data', chunk => {
        if (settled) return;
        result.bytesReceived += chunk.length;
        if (result.bytesReceived > maxBytes) {
          const error = fail('C71_BODY_LIMIT'); request.destroy(error); response.destroy(error); finish(error);
        } else { digest.update(chunk); result.rawBodyHashedBytes += chunk.length; if (response.statusCode === 200) chunks.push(chunk); }
      });
      response.on('error', error => finish(error));
      response.on('aborted', () => finish(fail('C71_RESPONSE_ABORTED')));
      response.on('end', () => finish(null, true));
    });
    request.on('error', error => finish(error));
    timer = setTimeout(() => { const error = fail('C71_DEADLINE'); request.destroy(error); responseRef?.destroy(error); finish(error); }, deadlineMs);
  });
  result.completedAt = new Date().toISOString();
  return { result, body };
}
async function child(expectedReleaseSHA256) {
  const envObservation = cleanChildEnvironment();
  checkCurrentState();
  const auth = authorization(); assert.equal(auth.releasePin.sha256, expectedReleaseSHA256);
  taskTopology(); for (const p of outputPaths) absentLeaf(p);
  const startedAt = new Date().toISOString(), budgetEnd = Date.now() + totalRequestBudgetMs;
  const observation = { cycle: 'C71', startedAt, release: auth.releasePin, ...envObservation, requests: [],
    metadata: null, archive: null, errorCode: null, redirectsFollowed: 0, retries: 0, credentials: false,
    metadataBodyRetained: false, responseHeadersRetained: false, installedOrExtractedPackages: 0 };
  try {
    const first = await requestOnce('metadata', metadataURL, auth.releasePin, budgetEnd, envObservation);
    observation.requests.push(first.result);
    if (first.result.httpStatus === 200 && first.body && !first.result.errorCode) {
      let projection;
      try { projection = sanitizeMetadata(first.body); } catch (e) { observation.errorCode = code(e); }
      if (projection) {
        writeNewTaskFile(metadataPath, JSON.stringify({ cycle: 'C71', source: metadataURL, observedAt: new Date().toISOString(),
          rawBodySHA256: first.result.rawBodySHA256, rawBodyBytes: first.result.bytesReceived, projection }, null, 2) + '\n');
        observation.metadata = { ...pin(metadataPath), name: projection.name, version: projection.version, integrity: projection.dist.integrity };
        const second = await requestOnce('tarball', projection.dist.tarball, auth.releasePin, budgetEnd, envObservation, projection.dist.integrity);
        observation.requests.push(second.result);
        if (second.result.httpStatus === 200 && second.body && !second.result.errorCode) {
          const actual = 'sha512-' + crypto.createHash('sha512').update(second.body).digest('base64');
          second.result.actualIntegrity = actual;
          if (actual !== projection.dist.integrity) observation.errorCode = 'C71_INTEGRITY_MISMATCH';
          else if (projection.dist.shasum && crypto.createHash('sha1').update(second.body).digest('hex') !== projection.dist.shasum) observation.errorCode = 'C71_SHASUM_MISMATCH';
          else {
            taskTopology(); if (!fs.existsSync(at('evidence/cycle-71/artifacts'))) fs.mkdirSync(at('evidence/cycle-71/artifacts'));
            writeNewTaskFile(archivePath, second.body);
            observation.archive = { ...pin(archivePath), bytes: second.body.length, integrity: actual };
          }
        }
      }
    }
  } catch (e) { observation.errorCode = code(e); }
  observation.completedAt = new Date().toISOString(); observation.requestBudgetMs = totalRequestBudgetMs;
  process.stdout.write(JSON.stringify(observation) + '\n');
}
function parent() {
  checkCurrentState(); taskTopology(); for (const p of outputPaths) absentLeaf(p);
  const auth = authorization(), b = json(auth.release.before.path), before = boundary(b);
  const env = {};
  for (const key of envKeys) { assert.equal(typeof process.env[key], 'string'); env[key] = process.env[key]; }
  const startedAt = new Date().toISOString();
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child', auth.releasePin.sha256],
    { cwd: root, env, encoding: 'utf8', windowsHide: true, timeout: 45000, maxBuffer: 1024 * 1024 });
  // Raw child is durable before any JSON interpretation or mutable post-boundary check.
  writeNewTaskFile(rawChildPath, JSON.stringify({ cycle: 'C71', startedAt, completedAt: new Date().toISOString(),
    exitCode: r.status, signal: r.signal, errorCode: r.error ? code(r.error) : null, stdout: r.stdout, stderr: r.stderr }, null, 2) + '\n');
  const childReceipt = pin(rawChildPath);
  let observation = null, observationError = null, after = null, boundaryError = null;
  try {
    assert.equal(r.error, undefined); assert.equal(r.status, 0); observation = JSON.parse(r.stdout);
    assert.equal(observation.cycle, 'C71'); assert.deepEqual(observation.release, auth.releasePin);
    assert.equal(observation.redirectsFollowed, 0); assert.equal(observation.retries, 0); assert.equal(observation.credentials, false);
    assert.equal(observation.metadataBodyRetained, false); assert.equal(observation.responseHeadersRetained, false);
    assert.equal(observation.installedOrExtractedPackages, 0);
    assert(Array.isArray(observation.environmentKeysOnly));
    assert.deepEqual(observation.environmentKeysOnly.map(k => k.toLowerCase()).sort(), envKeys.map(k => k.toLowerCase()).sort());
    assert(Array.isArray(observation.requests) && observation.requests.length >= 1 && observation.requests.length <= 2);
    for (const [index, request] of observation.requests.entries()) {
      const stage = index === 0 ? 'metadata' : 'tarball';
      assert.equal(request.stage, stage); assert.equal(request.url, stage === 'metadata' ? metadataURL : tarballURL);
      assert.equal(request.attempt.path, intents[stage]); assert.equal(pin(intents[stage]).sha256, request.attempt.sha256);
      assert.equal(request.maxBytes, stageLimits[stage]); assert.equal(request.redirectsFollowed, 0); assert.equal(request.retries, 0); assert.equal(request.credentials, false);
      assert(/^[a-f0-9]{64}$/.test(request.rawBodySHA256));
      assert(Number.isSafeInteger(request.bytesReceived) && request.bytesReceived >= 0);
      assert(Number.isSafeInteger(request.rawBodyHashedBytes) && request.rawBodyHashedBytes >= 0 && request.rawBodyHashedBytes <= request.bytesReceived && request.rawBodyHashedBytes <= request.maxBytes);
      assert.equal(typeof request.rawBodyComplete, 'boolean');
      if (request.rawBodyComplete) { assert.equal(request.rawBodyHashedBytes, request.bytesReceived); assert.equal(request.errorCode, null); }
    }
    assert.equal(observation.requests[0].expectedIntegrity, null);
    let savedMetadata = null;
    if (observation.metadata) {
      const first = observation.requests[0];
      assert.equal(first.httpStatus, 200); assert.equal(first.rawBodyComplete, true); assert.equal(first.errorCode, null);
      assert.equal(observation.metadata.path, metadataPath); assert.equal(pin(metadataPath).sha256, observation.metadata.sha256);
      savedMetadata = json(metadataPath);
      assert.deepEqual(Object.keys(savedMetadata).sort(), ['cycle', 'source', 'observedAt', 'rawBodySHA256', 'rawBodyBytes', 'projection'].sort());
      assert.equal(savedMetadata.cycle, 'C71'); assert.equal(savedMetadata.source, first.url); assert.equal(savedMetadata.source, metadataURL);
      assert.equal(typeof savedMetadata.observedAt, 'string');
      assert.equal(savedMetadata.rawBodySHA256, first.rawBodySHA256);
      assert.equal(savedMetadata.rawBodyBytes, first.bytesReceived); assert.equal(savedMetadata.rawBodyBytes, first.rawBodyHashedBytes);
      assert.equal(JSON.stringify(sanitizeMetadata(Buffer.from(JSON.stringify(savedMetadata.projection), 'utf8'))), JSON.stringify(savedMetadata.projection));
      assert.equal(savedMetadata.projection.name, 'postcss-selector-parser'); assert.equal(savedMetadata.projection.version, '7.1.6');
      assert.equal(observation.metadata.name, savedMetadata.projection.name); assert.equal(observation.metadata.version, savedMetadata.projection.version);
      officialURL(savedMetadata.projection.dist.tarball, tarballURL); canonicalIntegrity(savedMetadata.projection.dist.integrity);
      assert.equal(savedMetadata.projection.dist.integrity, observation.metadata.integrity);
    } else { assert.equal(observation.requests.length, 1); absentLeaf(metadataPath); absentLeaf(intents.tarball); absentLeaf(archivePath); }
    if (observation.requests.length === 2) {
      assert(savedMetadata); assert.equal(observation.requests[1].expectedIntegrity, savedMetadata.projection.dist.integrity);
    } else absentLeaf(intents.tarball);
    if (observation.archive) {
      assert(savedMetadata); assert.equal(observation.requests.length, 2);
      const second = observation.requests[1];
      assert.equal(second.httpStatus, 200); assert.equal(second.rawBodyComplete, true); assert.equal(second.errorCode, null);
      assert.equal(observation.archive.path, archivePath);
      const archive = fs.readFileSync(at(archivePath));
      assert.equal(archive.length, observation.archive.bytes);
      assert.equal(archive.length, second.bytesReceived); assert.equal(archive.length, second.rawBodyHashedBytes);
      assert.equal(hash(archive), observation.archive.sha256); assert.equal(hash(archive), second.rawBodySHA256);
      const actualIntegrity = 'sha512-' + crypto.createHash('sha512').update(archive).digest('base64');
      assert.equal(actualIntegrity, savedMetadata.projection.dist.integrity);
      assert.equal(actualIntegrity, observation.archive.integrity); assert.equal(actualIntegrity, observation.metadata.integrity);
      assert.equal(actualIntegrity, second.actualIntegrity);
      if (savedMetadata.projection.dist.shasum) assert.equal(crypto.createHash('sha1').update(archive).digest('hex'), savedMetadata.projection.dist.shasum);
      assert.equal(observation.errorCode, null);
    } else absentLeaf(archivePath);
  } catch (e) { observationError = code(e); }
  try {
    after = boundary(b); taskTopology(); assert.equal(pin(releasePath).sha256, auth.releasePin.sha256);
    for (const x of auth.pins) assert.equal(pin(x.path).sha256, x.sha256, x.path);
  } catch (e) { boundaryError = code(e); }
  const status = observationError || boundaryError ? 'FAIL_OBSERVATION_OR_BOUNDARY'
    : observation.archive ? 'CANDIDATE_METADATA_AND_ARCHIVE_VERIFIED_NO_INSTALL'
    : 'CANDIDATE_PROVENANCE_RESOURCE_OBSERVATION_INCOMPLETE_NO_RETRY';
  writeNewTaskFile(runPath, JSON.stringify({ cycle: 'C71', startedAt, completedAt: new Date().toISOString(), status,
    release: auth.releasePin, checkedReleasePins: auth.pins, before, after, boundaryError, childReceipt, observation, observationError,
    environmentKeysOnly: Object.keys(env), requestsMaximum: 2, applicationTests: 0, installedOrExtractedPackages: 0,
    qualification: 'Fixed7.1.6 provenance only; no package execution/override/consumer compatibility/clean install/advisory or production acceptance.' }, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ status, receipt: pin(runPath), observationError, boundaryError,
    requestCount: observation?.requests?.length, metadataVerified: !!observation?.metadata, archiveVerified: !!observation?.archive }) + '\n');
  if (observationError || boundaryError) process.exitCode = 1;
}
if (process.argv.length === 4 && process.argv[2] === '--child' && /^[a-f0-9]{64}$/.test(process.argv[3])) {
  try { await child(process.argv[3]); }
  catch (e) { process.stdout.write(JSON.stringify({ cycle: 'C71', phase: 'PREEXEC_OR_CHILD_FAILURE', errorCode: code(e) }) + '\n'); process.exitCode = 1; }
} else if (process.argv.length === 2) parent();
else throw new Error('C71 accepts only fixed parent or internal child mode');
