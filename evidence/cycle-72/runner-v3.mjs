import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Module, { createRequire, isBuiltin } from 'node:module';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const at = p => path.resolve(root, p);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const pin = p => ({ path: p, sha256: sha(fs.readFileSync(at(p))) });
const json = p => JSON.parse(fs.readFileSync(at(p), 'utf8'));
const relative = p => path.relative(root, p).replaceAll('\\', '/');
const tool = 'evidence/cycle-72/runner-v3.mjs';
const releasePath = 'evidence/cycle-72/execution-release-v3.json';
const beforePath = 'evidence/cycle-72/before-v2.json';
const planPath = 'evidence/cycle-72/tool-plan-v3.json';
const fixturePath = 'evidence/cycle-72/compatibility-cases.cjs';
const modulesPath = 'evidence/cycle-72/module-pins.json';
const materializationPath = 'evidence/cycle-72/materialization.json';
const securityPath = 'tests/cycle38-selector-security.test.ts';
const packageRoot = 'evidence/cycle-72/quarantine/postcss-selector-parser/';
const baselineRoot = 'node_modules/postcss-selector-parser/';
const resultPath = 'evidence/cycle-72/compatibility-run-v3.json';
const envKeys = ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP'];
const compatibilityIds = ['C72-TW-01', 'C72-TW-02', 'C72-NESTED-01', 'C72-NESTED-02'];
const securityIds = Array.from({ length: 8 }, (_, i) => 'C72-SEC-' + String(i + 1).padStart(2, '0'));
const caseIds = [...compatibilityIds, ...securityIds];
const requireHere = createRequire(at('package.json'));

function absent(p) {
  try { fs.lstatSync(at(p)); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
  throw new Error('C72_OUTPUT_EXISTS');
}
function topology() {
  for (const p of ['evidence', 'evidence/cycle-72']) {
    const s = fs.lstatSync(at(p)); assert(s.isDirectory() && !s.isSymbolicLink());
    assert.equal(fs.realpathSync.native(at(p)).toLowerCase(), path.resolve(fs.realpathSync.native(root), p).toLowerCase());
  }
}
function writeNew(p, value) { topology(); absent(p); fs.writeFileSync(at(p), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); }
function authorization(child = false, expectedSHA = null) {
  const bytes = fs.readFileSync(at(releasePath)), release = JSON.parse(bytes);
  assert.equal(release.status, 'GO_C72_FIXED_COMPATIBILITY_BASELINE_AND_CANDIDATE_NO_INSTALL');
  if (expectedSHA) assert.equal(sha(bytes), expectedSHA);
  const required = { tool, before: beforePath, plan: planPath, fixture: fixturePath, modules: modulesPath, materialization: materializationPath };
  for (const [k, p] of Object.entries(required)) assert.equal(release[k].path, p);
  assert(Array.isArray(release.pins) && release.pins.length > 0);
  const pins = [...Object.keys(required).map(k => release[k]), ...release.pins];
  assert(pins.some(x => x.path === 'evidence/cycle-72/node-runtime-flags.json'));
  assert(pins.some(x => x.path === 'evidence/cycle-72/node-permission-probe.json'));
  for (const row of pins) {
    assert(typeof row.path === 'string' && /^[a-f0-9]{64}$/.test(row.sha256));
    if (!child || row.path.startsWith('evidence/cycle-72/')) assert.equal(pin(row.path).sha256, row.sha256, row.path);
  }
  assert.equal(pin(modulesPath).sha256, 'ea01faa4fafdb86f302b31c4b07670a2b2bc6ec5bf79aa4ea7884a86934e3cf5');
  assert.equal(pin('evidence/cycle-72/node-runtime-flags.json').sha256, 'fcc08fa30df3de147ce7b7d13207f9fa2bb5a3f21782934af064b633a42b1203');
  assert.equal(pin('evidence/cycle-72/node-permission-probe.json').sha256, '8cd58ea3d8889b698443b7302a435f672f12356f17df7cbfafa4b8ed62e813c6');
  const node = json('evidence/cycle-72/node-runtime-flags.json').node;
  assert.deepEqual(release.node, node); assert.equal(process.version, node.version);
  assert.equal(process.execPath.toLowerCase(), node.path.toLowerCase());
  if (!child) assert.equal(sha(fs.readFileSync(process.execPath)), node.sha256);
  assert.deepEqual(release.caseIds, caseIds); assert.deepEqual(release.compatibilityIds, compatibilityIds); assert.deepEqual(release.securityIds, securityIds);
  assert.deepEqual(Object.keys(release.consumerParents).sort(), [...release.compatibilityIds].sort());
  for (const prefixes of Object.values(release.consumerParents)) assert(Array.isArray(prefixes) && prefixes.length > 0 && prefixes.every(x => ['node_modules/tailwindcss/', 'node_modules/postcss-nested/'].includes(x)));
  return { release, pins, sha256: sha(bytes) };
}
function candidateFiles() {
  const record = json(materializationPath);
  assert.equal(record.status, 'PASS_VERIFIED_FIXED37_MATERIALIZED_NO_PACKAGE_EXECUTION');
  assert.equal(record.quarantine, packageRoot.slice(0, -1));
  assert.equal(record.files.length, 37); assert.equal(new Set(record.files.map(x => x.path)).size, 37);
  for (const row of record.files) {
    assert(row.path.startsWith(packageRoot) && !row.path.slice(packageRoot.length).split('/').some(x => !x || x === '..' || x === '.'));
    const s = fs.lstatSync(at(row.path)); assert(s.isFile() && !s.isSymbolicLink());
    assert.equal(fs.realpathSync.native(at(row.path)).toLowerCase(), at(row.path).toLowerCase());
    assert.equal(s.size, row.bytes); assert.equal(pin(row.path).sha256, row.sha256);
  }
  return record.files;
}
function boundary(before, auth) {
  const rows = ['sourcePins', 'inputPins', 'preserve', 'receipts', 'sdkContractPins', 'closurePins', 'metadataPins', 'consumerRuntimePins'].flatMap(k => before[k]);
  rows.push(...before.runtime.files.map(x => ({ path: baselineRoot + x.path, sha256: x.sha256 })));
  for (const c of before.runtime.consumers) rows.push({ path: 'node_modules/' + c.name + '/package.json', sha256: c.packageSHA256 }, { path: 'node_modules/' + c.parserEntry, sha256: c.entrySHA256 });
  for (const row of [...rows, ...auth.pins, ...json(modulesPath).files]) assert.equal(pin(row.path).sha256, row.sha256, row.path);
  assert.equal(pin('package-lock.json').sha256, before.runtime.lockSHA256);
  for (const row of before.deletedSources) assert.equal(fs.existsSync(at(row.path)), false);
  const git = { branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    indexEntriesSHA256: sha(execFileSync('git', ['ls-files', '--stage', '-z'], { cwd: root })) };
  assert.deepEqual(git, before.gitBoundary);
  candidateFiles(); assert.equal(pin(releasePath).sha256, auth.sha256);
  return { sourcePaths: before.sourcePins.length, inputs: before.inputPins.length, moduleFiles: json(modulesPath).files.length,
    candidateFiles: 37, drift: 0, git };
}

async function child(variant, id, releaseSHA) {
  assert(['baseline', 'candidate'].includes(variant));
  const allowedEnv = new Set(envKeys.map(k => k.toLowerCase()));
  const removableEnv = new Set(['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'SYSTEMDRIVE', 'USERDOMAIN', 'USERNAME', 'USERPROFILE'].map(k => k.toLowerCase()));
  const removedEnvironmentKeysOnly = Object.keys(process.env).filter(k => !allowedEnv.has(k.toLowerCase()));
  assert(removedEnvironmentKeysOnly.every(k => removableEnv.has(k.toLowerCase())));
  for (const k of removedEnvironmentKeysOnly) delete process.env[k];
  assert.deepEqual(Object.keys(process.env).map(k => k.toLowerCase()).sort(), [...allowedEnv].sort());
  assert.equal(process.permission.has('fs.write', at('evidence/cycle-72')), false);
  assert.equal(process.permission.has('child'), false); assert.equal(process.permission.has('worker'), false);
  assert.equal(process.features.require_module, false);
  const auth = authorization(true, releaseSHA); assert(auth.release.caseIds.includes(id));
  const encode = JSON.stringify.bind(JSON), nativeWrite = fs.writeSync.bind(fs), nativeExit = process.exit.bind(process);
  let sequence = 0;
  const emit = (type, data) => {
    try { nativeWrite(1, encode({ cycle: 'C72', type, variant, id, pid: process.pid, sequence: ++sequence, ...data }) + '\n'); }
    catch { nativeExit(87); }
  };
  const deny = kind => { emit('denial', { kind }); throw Object.assign(new Error('C72_DENIED'), { code: 'C72_DENIED' }); };
  for (const [name, keys] of Object.entries({ 'node:http': ['request', 'get'], 'node:https': ['request', 'get'],
    'node:http2': ['connect'], 'node:net': ['connect', 'createConnection', 'createServer'], 'node:tls': ['connect', 'createServer'],
    'node:dgram': ['createSocket'], 'node:dns': ['lookup', 'resolve', 'resolve4', 'resolve6', 'reverse'],
    'node:child_process': ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'] })) {
    const api = requireHere(name); for (const key of keys) if (typeof api[key] === 'function') api[key] = () => deny(name.slice(5));
    if (name === 'node:dns') for (const key of Object.keys(api.promises)) if (/^(?:lookup|resolve|reverse)/.test(key) && typeof api.promises[key] === 'function') api.promises[key] = () => deny('dns');
  }
  globalThis.fetch = () => deny('fetch'); globalThis.WebSocket = class { constructor() { deny('websocket'); } };
  if (typeof globalThis.EventSource === 'function') globalThis.EventSource = class { constructor() { deny('eventsource'); } };
  const net = requireHere('node:net'), dgram = requireHere('node:dgram'), dns = requireHere('node:dns');
  net.Socket.prototype.connect = () => deny('net-socket'); dgram.Socket.prototype.send = () => deny('dgram-send');
  net.Server.prototype.listen = () => deny('net-listen');
  for (const name of ['connect', 'bind']) dgram.Socket.prototype[name] = () => deny('dgram-' + name);
  for (const api of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
    for (const name of new Set([...Object.getOwnPropertyNames(api), 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCaa', 'resolveCname', 'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt', 'reverse'])) if (/^(?:lookup|resolve|reverse)/.test(name) && typeof api[name] === 'function') api[name] = () => deny('dns');
  }
  Module.syncBuiltinESMExports();
  const moduleRows = [...json(modulesPath).files, ...candidateFiles(), auth.release.fixture];
  const modules = new Map(moduleRows.map(x => [at(x.path).toLowerCase(), x]));
  const trace = [], loaded = new Map(), nativeResolve = Module._resolveFilename, nativeLoad = Module._load;
  const selectedRoot = variant === 'candidate' ? packageRoot : baselineRoot;
  const dependencies = { cssesc: at('node_modules/cssesc/cssesc.js'), 'util-deprecate': at('node_modules/util-deprecate/node.js') };
  Module._resolveFilename = function(request, parent, isMain, options) {
    if (isBuiltin(request)) {
      const name = request.replace(/^node:/, '');
      if (['worker_threads', 'inspector', 'inspector/promises'].includes(name)) return deny('module-escape');
      return nativeResolve.call(this, request, parent, isMain, options);
    }
    let resolved;
    if (request === 'postcss-selector-parser') resolved = at(selectedRoot + 'dist/index.js');
    else if (request === 'postcss-selector-parser/dist/util/unesc' || request === 'postcss-selector-parser/dist/util/unesc.js') resolved = at(selectedRoot + 'dist/util/unesc.js');
    else if (parent?.filename?.toLowerCase().startsWith(at(packageRoot).toLowerCase() + path.sep) && !request.startsWith('.') && !path.isAbsolute(request)) {
      if (!Object.hasOwn(dependencies, request)) return deny('candidate-dependency');
      resolved = dependencies[request];
    } else {
      try { resolved = nativeResolve.call(this, request, parent, isMain, options); }
      catch (e) {
        if (e?.code === 'MODULE_NOT_FOUND' && request === 'fsevents' && parent?.filename?.toLowerCase().startsWith(at('node_modules/chokidar').toLowerCase() + path.sep)) {
          emit('optional-missing', { request: 'fsevents', parent: relative(parent.filename), code: 'MODULE_NOT_FOUND' }); throw e;
        }
        return deny('unresolved-module');
      }
    }
    if (!['.js', '.cjs', '.json'].includes(path.extname(resolved)) || !modules.has(resolved.toLowerCase())) return deny('unpinned-module');
    if (variant === 'candidate' && resolved.toLowerCase().startsWith(at(baselineRoot).toLowerCase() + path.sep)) return deny('baseline-fallback');
    const row = modules.get(resolved.toLowerCase()); assert.equal(pin(row.path).sha256, row.sha256);
    trace.push({ request, parent: parent?.filename ? relative(parent.filename) : null, resolved: relative(resolved), sha256: row.sha256 });
    return resolved;
  };
  Module._load = function(request, parent, isMain) {
    const resolved = Module._resolveFilename(request, parent, isMain);
    const result = nativeLoad.call(this, request, parent, isMain);
    if (!isBuiltin(resolved)) loaded.set(relative(resolved), pin(relative(resolved)).sha256);
    return result;
  };
  emit('ready', { environmentKeysOnly: Object.keys(process.env), removedEnvironmentKeysOnly,
    permissions: { write: false, child: false, worker: false, addons: false }, automaticRequireESM: process.features.require_module, memoryMiB: 128 });
  const fixture = requireHere(at(fixturePath));
  assert.deepEqual(fixture.caseIds, auth.release.caseIds);
  assert.deepEqual(fixture.compatibilityIds, auth.release.compatibilityIds); assert.deepEqual(fixture.securityIds, auth.release.securityIds);
  const parser = requireHere('postcss-selector-parser');
  const parserPackage = requireHere(at(selectedRoot + 'package.json'));
  assert.equal(parserPackage.name, 'postcss-selector-parser'); assert.equal(parserPackage.version, variant === 'candidate' ? '7.1.6' : '6.1.4');
  const identity = { version: parserPackage.version, main: pin(selectedRoot + 'dist/index.js'),
    deep: pin(selectedRoot + 'dist/util/unesc.js'), package: pin(selectedRoot + 'package.json') };
  let observation, observationError = null;
  const fixtureRequire = Object.assign(request => requireHere(request), { resolve: request => {
    if (request === './' + securityPath) {
      assert.equal(pin(securityPath).sha256, '724912489b2c68cdf18f0239e618514a105680b685b46ccebc746e2bff90b43a');
      return at(securityPath);
    }
    return requireHere.resolve(request);
  } });
  try { observation = await fixture.observeCase(id, { parser, require: fixtureRequire }); }
  catch (e) { observationError = { name: e?.name || 'Error', code: /^[A-Z0-9_]{1,80}$/.test(e?.code || '') ? e.code : null }; }
  emit('observation', { identity, observation: observation ?? null, observationError, resolver: trace, loaded: [...loaded].map(([p, h]) => ({ path: p, sha256: h })) });
  let assertion = 'PASS', assertionError = null;
  try { assert.equal(observationError, null); await fixture.assertCase(id, observation); }
  catch (e) { assertion = 'FAIL'; assertionError = { name: e?.name || 'Error', message: String(e?.message || '').slice(0, 2048) }; }
  emit('assertion', { assertion, assertionError });
  if (assertion !== 'PASS') process.exitCode = 1;
}

function parent() {
  topology(); absent(resultPath); absent('evidence/cycle-72/raw-v3');
  const auth = authorization(), before = json(beforePath), pre = boundary(before, auth);
  fs.mkdirSync(at('evidence/cycle-72/raw-v3'));
  const records = [];
  let loopError = null, activeAttempt = null, interruptedRaw = null;
  try {
  const env = {}; for (const k of envKeys) { assert.equal(typeof process.env[k], 'string'); env[k] = process.env[k]; }
  cases: for (const variant of ['baseline', 'candidate']) for (const id of auth.release.caseIds) {
    activeAttempt = { variant, id, phase: 'pre-child-authorization', rawPath: null };
    for (const row of auth.pins) assert.equal(pin(row.path).sha256, row.sha256);
    assert.equal(pin(releasePath).sha256, auth.sha256);
    const childRawPath = `evidence/cycle-72/raw-v3/${variant}-${id}.json`;
    activeAttempt.rawPath = childRawPath; activeAttempt.phase = 'spawn';
    const startedAt = new Date().toISOString();
    const args = ['--permission', '--no-addons', '--no-experimental-require-module', '--max-old-space-size=128',
      '--allow-fs-read=' + at('node_modules'), '--allow-fs-read=' + at('evidence/cycle-72'), '--allow-fs-read=' + at('package.json'),
      '--allow-fs-read=' + at(securityPath),
      fileURLToPath(import.meta.url), '--child', variant, id, auth.sha256];
    const r = spawnSync(process.execPath, args, { cwd: root, env, encoding: 'utf8', windowsHide: true, timeout: 4000, maxBuffer: 1024 * 1024 });
    interruptedRaw = { cycle: 'C72', variant, id, startedAt, completedAt: new Date().toISOString(),
      exitCode: r.status, signal: r.signal, errorCode: r.error?.code || null, stdout: r.stdout, stderr: r.stderr };
    activeAttempt.phase = 'persist-raw';
    writeNew(childRawPath, interruptedRaw);
    interruptedRaw = null; activeAttempt.phase = 'validate-raw';
    const record = { variant, id, raw: pin(childRawPath), status: 'FAIL', observation: null, validationError: null };
    try {
      const rows = r.stdout.trim().split('\n').map(x => JSON.parse(x));
      const main = rows.filter(x => x.type !== 'optional-missing');
      assert.equal(main.length, 3); assert.deepEqual(main.map(x => x.type), ['ready', 'observation', 'assertion']);
      for (const [index, row] of rows.entries()) {
        assert.equal(row.cycle, 'C72'); assert.equal(row.variant, variant); assert.equal(row.id, id);
        assert.equal(row.pid, rows[0].pid); assert.equal(row.sequence, index + 1);
        if (row.type === 'optional-missing') { assert.equal(row.request, 'fsevents'); assert.equal(row.code, 'MODULE_NOT_FOUND'); assert(row.parent.startsWith('node_modules/chokidar/')); }
      }
      record.observation = main[1]; record.optionalMissing = rows.filter(x => x.type === 'optional-missing');
      assert.equal(r.error, undefined); assert.equal(r.status, 0);
      assert.equal(main[1].observationError, null); assert.equal(main[2].assertion, 'PASS');
      assert.equal(main[1].identity.version, variant === 'candidate' ? '7.1.6' : '6.1.4');
      const selected = variant === 'candidate' ? packageRoot : baselineRoot;
      for (const [field, suffix] of Object.entries({ main: 'dist/index.js', deep: 'dist/util/unesc.js', package: 'package.json' })) {
        assert.equal(main[1].identity[field].path, selected + suffix);
        assert.equal(main[1].identity[field].sha256, pin(selected + suffix).sha256);
      }
      assert(main[1].resolver.some(x => x.request === 'postcss-selector-parser' && x.resolved === selected + 'dist/index.js'));
      if (auth.release.compatibilityIds.includes(id)) for (const prefix of auth.release.consumerParents[id]) {
        assert(main[1].resolver.some(x => x.request === 'postcss-selector-parser' && x.parent?.startsWith(prefix) && x.resolved === selected + 'dist/index.js'));
      }
      if (id === 'C72-TW-01') assert(main[1].resolver.some(x => x.request === 'postcss-selector-parser/dist/util/unesc' && x.parent?.startsWith('node_modules/tailwindcss/') && x.resolved === selected + 'dist/util/unesc.js'));
      for (const row of main[1].loaded) assert.equal(pin(row.path).sha256, row.sha256);
      record.status = 'PASS';
    } catch (e) { record.validationError = e?.name || 'Error'; }
    records.push(record);
    if (!record.observation) {
      loopError = { ...activeAttempt, phase: 'missing-validated-observation', errorClass: record.validationError,
        errorCode: 'C72_NO_VALIDATED_OBSERVATION' };
      break cases;
    }
    if (r.error || (r.stdout || '').split('\n').some(x => { try { return JSON.parse(x).type === 'denial'; } catch { return false; } })) break cases;
  }
  } catch (e) {
    loopError = { ...activeAttempt, errorClass: e?.name || 'Error',
      errorCode: /^[A-Z0-9_]{1,80}$/.test(e?.code || '') ? e.code : null };
  }
  let after = null, boundaryError = null;
  try { after = boundary(before, auth); } catch (e) { boundaryError = e?.name || 'Error'; }
  const pass = records.filter(x => x.status === 'PASS').length;
  const status = pass === 24 && !boundaryError && !loopError ? 'PASS_FIXED12_CASES_BOTH_VARIANTS_NO_INSTALL' : 'FAIL_BOUNDED_COMPATIBILITY';
  writeNew(resultPath, { cycle: 'C72', status, releaseSHA256: auth.sha256, before: pre, after, boundaryError, loopError, interruptedRaw,
    instances: records.length, passed: pass, failed: records.length - pass, distinctCases: new Set(records.map(x => x.id)).size,
    plannedDistinctCases: 12, plannedInstances: 24,
    cases: records, qualification: 'Existing pinned runtime in permission-constrained children, not a clean install, production sandbox, advisory closure or manifest override.' });
  process.stdout.write(JSON.stringify({ status, result: pin(resultPath), instances: records.length, passed: pass, boundaryError }) + '\n');
  if (status.startsWith('FAIL')) process.exitCode = 1;
}
if (process.argv.length === 6 && process.argv[2] === '--child' && /^[a-f0-9]{64}$/.test(process.argv[5])) {
  await child(process.argv[3], process.argv[4], process.argv[5]);
} else if (process.argv.length === 2) parent();
else throw new Error('C72 accepts only fixed parent/internal child mode');
