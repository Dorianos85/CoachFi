import fs from 'node:fs';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

if(fs.existsSync('evidence/cycle-39/snapshot-inputs.json'))throw new Error('One-shot operation; preserve original evidence');
const repo = fs.realpathSync(process.cwd());
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'coachfi-cycle39-verify-'));
const listed = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean);
const configs = new Set(['package.json', 'package-lock.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.mjs',
  'postcss.config.mjs', 'tailwind.config.ts', 'vitest.config.ts', 'playwright.config.ts', 'playwright.p0.config.ts',
  'playwright.cycle2.config.ts', 'playwright.cycle4.config.ts', 'playwright.cycle5.config.ts', 'playwright.cycle6.config.ts', 'playwright.cycle7.config.ts', 'playwright.cycle8.config.ts', 'playwright.cycle9.config.ts', 'playwright.cycle10.config.ts', 'playwright.cycle11.config.ts', 'playwright.cycle12.config.ts', 'playwright.cycle13.config.ts', 'playwright.cycle14.config.ts', 'playwright.cycle15.config.ts', 'playwright.cycle16.config.ts', 'playwright.cycle17.config.ts', 'playwright.cycle18.config.ts', 'playwright.cycle19.config.ts', 'playwright.cycle20.config.ts', 'playwright.cycle24.config.ts', 'playwright.cycle25.config.ts', 'playwright.cycle26.config.ts', 'playwright.cycle27.config.ts', 'playwright.cycle28.config.ts', 'playwright.cycle29.config.ts', 'playwright.cycle30.config.ts', 'playwright.cycle31.config.ts', 'playwright.cycle32.config.ts', 'playwright.cycle33.config.ts', 'playwright.cycle34.config.ts', 'playwright.cycle35.config.ts', 'playwright.cycle36.config.ts', 'playwright.cycle37.config.ts',
  'docs/coachfi/cycle-6/content-metadata.json', 'evidence/cycle-6/review-baseline-non-target.json',
  'docs/coachfi/cycle-11/content-metadata.json', 'docs/coachfi/cycle-15/content-metadata.json',
  'evidence/cycle-15/content-author-before-source.json', 'evidence/cycle-15/content-author-non-target-baseline.json',
  'docs/coachfi/cycle-16/content-metadata.json', 'evidence/cycle-16/content-author-before-source.json',
  'evidence/cycle-16/content-author-non-target-baseline.json',
  'docs/coachfi/cycle-17/content-metadata.json', 'evidence/cycle-17/content-author-before-source.json',
  'evidence/cycle-17/content-author-non-target-baseline.json',
  'evidence/cycle-23/before.json', 'evidence/cycle-23/content-author-inventory.json',
  'evidence/cycle-23/content-author-source-change.json',
  'docs/coachfi/cycle-23/content-metadata.json',
  'docs/coachfi/cycle-24/content-metadata.json', 'evidence/cycle-24/content-author-inventory.json',
  'evidence/cycle-24/content-author-source-change.json',
  'docs/coachfi/cycle-25/content-metadata.json', 'evidence/cycle-25/content-author-inventory.json',
  'evidence/cycle-25/content-author-source-change.json',
  'docs/coachfi/cycle-26/content-metadata.json', 'evidence/cycle-26/content-author-inventory.json',
  'evidence/cycle-26/content-author-source-change.json',
  'docs/coachfi/cycle-27/content-metadata.json', 'evidence/cycle-27/content-author-inventory.json',
  'evidence/cycle-27/content-author-source-change.json',
  'docs/coachfi/cycle-28/content-metadata.json', 'evidence/cycle-28/content-author-inventory.json',
  'evidence/cycle-28/content-author-source-change.json',
  'docs/coachfi/cycle-29/content-metadata.json', 'evidence/cycle-29/content-author-inventory.json',
  'evidence/cycle-29/content-author-source-change.json',
  'docs/coachfi/cycle-30/content-metadata.json', 'evidence/cycle-30/content-author-inventory.json',
  'evidence/cycle-30/content-author-source-change.json',
  'docs/coachfi/cycle-31/content-metadata.json', 'evidence/cycle-31/content-author-inventory.json',
  'evidence/cycle-31/content-author-source-change.json',
  'docs/coachfi/cycle-32/content-metadata.json', 'evidence/cycle-32/content-author-inventory.json',
  'evidence/cycle-32/content-author-source-change.json',
  'docs/coachfi/cycle-33/content-metadata.json', 'evidence/cycle-33/content-author-inventory.json',
  'evidence/cycle-33/content-author-source-change.json',
  'docs/coachfi/cycle-34/content-metadata.json', 'evidence/cycle-34/content-author-inventory.json',
  'evidence/cycle-34/content-author-source-change.json',
  'docs/coachfi/cycle-35/content-metadata.json', 'evidence/cycle-35/content-author-inventory.json',
  'evidence/cycle-35/content-author-source-change.json',
  'docs/coachfi/cycle-36/content-metadata.json', 'evidence/cycle-36/content-author-inventory.json',
  'evidence/cycle-36/content-author-source-change.json',
  'docs/coachfi/cycle-37/content-metadata.json', 'evidence/cycle-37/content-author-inventory.json',
  'evidence/cycle-37/content-author-source-change.json']);
const inputs = listed.filter(name => configs.has(name) || /^(app|components|context|data|lib|scripts|public|tests|styles)\//.test(name) || /^db\/.*\.sql$/.test(name));
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
fs.writeFileSync(path.join(repo, 'evidence/cycle-39/snapshot-inputs.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ snapshot, inputFiles: entries.length, mismatches: 0 }));
