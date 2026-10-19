'use strict';
// Capture only during preloading: no native transports are patched in Vitest/TypeScript infrastructure main.
const fs = require('node:fs'), path = require('node:path');
const append = fs.appendFileSync.bind(fs), fatal = process.exit.bind(process);
const failJournal = () => { fatal(87); throw new Error('C69 durable journal unavailable'); };
let journalPath, runId, journalMode;
try {
  const root = fs.realpathSync(path.resolve(process.cwd(), 'evidence/cycle-69'));
  const supplied = process.env.COACHFI_C69_GUARD_JOURNAL;
  if (typeof supplied !== 'string') failJournal();
  journalPath = path.resolve(supplied);
  const match = /^guard-(probe|focused|inventory|typecheck)-([a-f0-9]{32})\.jsonl$/.exec(path.basename(journalPath));
  if (!match || path.dirname(journalPath) !== root || fs.realpathSync(journalPath) !== journalPath || !fs.statSync(journalPath).isFile()) failJournal();
  journalMode = match[1]; runId = match[2];
} catch { failJournal(); }
const record = event => { try { append(journalPath, JSON.stringify({ ...event, pid: process.pid, runId }) + '\n', { encoding: 'utf8' }); } catch { failJournal(); } };
record({ event: 'capture-ready' });
const key = Symbol.for('coachfi.c69.real-network-guard.v2');
function install() {
  let state = globalThis[key];
  if (!state) {
    state = { attempts: [], record, runId, ready: false };
    Object.defineProperty(globalThis, key, { value: state });
    process.once('exit', () => process.stdout.write('C69_REAL_NETWORK_GUARD ' + JSON.stringify({ phase: 'exit', pid: process.pid, runId, attempts: [...state.attempts] }) + '\n'));
  }
  const error = kind => { state.record({ event: 'native-denial', kind }); state.attempts.push(kind); const e = new Error('C69 real network is disabled: ' + kind); e.code = 'C69_REAL_NETWORK_DISABLED'; return e; };
  const block = kind => function () { throw error(kind); };
  const net = require('node:net'), tls = require('node:tls'), http = require('node:http'), https = require('node:https'), dns = require('node:dns'), dgram = require('node:dgram');
  net.Socket.prototype.connect = block('net.Socket.connect');
  net.connect = net.createConnection = block('net.connect');
  tls.connect = block('tls.connect');
  http.request = block('http.request'); http.get = block('http.get');
  https.request = block('https.request'); https.get = block('https.get');
  for (const name of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'reverse']) if (typeof dns[name] === 'function') dns[name] = block('dns.' + name);
  for (const name of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'reverse']) if (typeof dns.promises[name] === 'function') dns.promises[name] = async function () { throw error('dns.promises.' + name); };
  dgram.Socket.prototype.send = block('dgram.send');
  globalThis.fetch = async function () { throw error('fetch'); };
  require('node:module').syncBuiltinESMExports();
  if (!state.ready) { state.record({ event: 'native-ready' }); state.ready = true; }
  process.stdout.write('C69_REAL_NETWORK_GUARD ' + JSON.stringify({ phase: 'loaded', pid: process.pid, runId, attempts: [...state.attempts] }) + '\n');
  return state;
}
module.exports = install;
if (journalMode === 'probe') install();
