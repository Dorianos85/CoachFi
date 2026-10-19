'use strict';
// Infrastructure only: journals contain transport kinds, never target URLs or request data.
const key = Symbol.for('coachfi.c68.real-network-guard');
function install() {
  let state = globalThis[key];
  if (!state) {
    state = { attempts: [] };
    Object.defineProperty(globalThis, key, { value: state });
    process.once('exit', () => process.stdout.write('C68_REAL_NETWORK_GUARD ' + JSON.stringify({ phase: 'exit', pid: process.pid, attempts: [...state.attempts] }) + '\n'));
  }
  const error = kind => { state.attempts.push(kind); const e = new Error('C68 real network is disabled: ' + kind); e.code = 'C68_REAL_NETWORK_DISABLED'; return e; };
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
  process.stdout.write('C68_REAL_NETWORK_GUARD ' + JSON.stringify({ phase: 'loaded', pid: process.pid, attempts: [...state.attempts] }) + '\n');
  return state;
}
module.exports = install;
install();
