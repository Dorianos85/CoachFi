import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const forbidden = /(^|\/)(\.env(?:\.[^/]*)?|\.git|[^/]*(?:browser-profile|chrome-profile|playwright-profile)[^/]*)(\/|$)|\.(?:(?:db|sqlite|sqlite3)(?:-wal|-shm|-journal)?|log|har)$/i;
export function snapshotInput(root, name) {
  if (typeof name !== 'string' || !name || path.isAbsolute(name) || name.includes('\\') || name.includes(':') ||
    name.includes('\0') || name.split('/').some(part => !part || part === '.' || part === '..') || forbidden.test(name)) {
    throw new Error('Invalid snapshot input path');
  }
  const file = path.resolve(root, name), real = fs.realpathSync(file), stat = fs.lstatSync(file);
  if (!file.startsWith(root + path.sep) || !real.startsWith(root + path.sep) || stat.isSymbolicLink() || !stat.isFile() ||
    forbidden.test(path.relative(root, real).split(path.sep).join('/'))) throw new Error('Snapshot input boundary failure');
  return file;
}
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** Validate every manifest path before reading contents or starting a compiler. */
export function checkSnapshotInputs(repo, snapshot, inputs, skipGenerated = false) {
  if (!Array.isArray(inputs) || !inputs.length) throw new Error('Missing snapshot inputs');
  const seen = new Set(), selected = [];
  for (const input of inputs) {
    if (!input || typeof input.path !== 'string' || typeof input.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.sha256) || seen.has(input.path)) {
      throw new Error('Invalid or duplicate snapshot fingerprint');
    }
    seen.add(input.path);
    const source = snapshotInput(repo, input.path), copied = snapshotInput(snapshot, input.path);
    if (!(skipGenerated && input.path === 'next-env.d.ts')) selected.push({ ...input, source, copied });
  }
  const currentMismatches = [], snapshotMismatches = [];
  for (const input of selected) {
    if (sha(input.source) !== input.sha256) currentMismatches.push(input.path);
    if (sha(input.copied) !== input.sha256) snapshotMismatches.push(input.path);
  }
  return { comparedInputs: selected.length, currentMismatches, snapshotMismatches };
}
