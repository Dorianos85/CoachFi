import fs from 'node:fs';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

if(fs.existsSync('evidence/cycle-53/snapshot-inputs.json'))throw new Error('One-shot operation; preserve original evidence');
const repo = fs.realpathSync(process.cwd());
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'coachfi-cycle53-verify-'));
const previous=JSON.parse(fs.readFileSync('evidence/cycle-52/snapshot-inputs.json','utf8'));if(fs.realpathSync(previous.repo)!==repo)throw Error('Previous repo boundary');
const inputs=[...new Set([...previous.inputs.map(p=>p.path),'tests/cycle53-us-match-financial.test.ts','tests/cycle53-us-match-ui.test.ts','tests/e2e/cycle53-us-match.spec.ts','playwright.cycle53.config.ts'])];
const forbidden = /(^|\/)(\.env(?:\.[^/]*)?|\.git|[^/]*(?:browser-profile|chrome-profile|playwright-profile)[^/]*)(\/|$)|\.(?:(?:db|sqlite|sqlite3)(?:-wal|-shm|-journal)?|log|har)$/i;
const sha = absolute => crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
const entries = [];
for (const name of inputs) {
  const source = path.resolve(repo, name), target = path.resolve(snapshot, name);
  const realSource = fs.realpathSync(source);
  if (forbidden.test(name) || !source.startsWith(repo + path.sep) || !target.startsWith(snapshot + path.sep) ||
    fs.lstatSync(source).isSymbolicLink() || !realSource.startsWith(repo + path.sep) ||
    forbidden.test(path.relative(repo, realSource).split(path.sep).join('/'))) throw new Error('Snapshot boundary failure: ' + name);
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target);
  const hash = sha(source); if (hash !== sha(target)) throw new Error('Snapshot mismatch: ' + name);
  entries.push({ path: name, sha256: hash });
}
fs.symlinkSync(path.join(repo, 'node_modules'), path.join(snapshot, 'node_modules'), 'junction');
const manifest = { preparedAt: new Date().toISOString(), repo, snapshot, inputFiles: entries.length, runtime:fingerprintRuntime(repo,'6.1.4'),
  mismatches: [], dependencyRuntime: 'junction to existing installed node_modules; no install',
  excludes: ['env', 'Git', 'browser profiles', 'database contents', 'reports'], inputs: entries };
fs.writeFileSync(path.join(repo, 'evidence/cycle-53/snapshot-inputs.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ snapshot, inputFiles: entries.length, mismatches: 0 }));
