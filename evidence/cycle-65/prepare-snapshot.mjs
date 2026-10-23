import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';


const boundaryCapture=JSON.parse(fs.readFileSync('evidence/cycle-65/before.json'));const checkBoundary=()=>{for(const p of [...boundaryCapture.previousSourceTools.filter(p=>!boundaryCapture.sources.some(s=>s.path===p.path)),...boundaryCapture.preserve,...boundaryCapture.receipts,...boundaryCapture.sdkContractPins])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.path)).digest('hex'),p.sha256,p.path);for(const p of boundaryCapture.deletedSources)assert(!fs.existsSync(p.path),p.path);const git=a=>execFileSync('git',a,{encoding:'utf8',windowsHide:true}).trim();assert.deepEqual({branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),indexEntriesSHA256:crypto.createHash('sha256').update(execFileSync('git',['ls-files','--stage','-z'],{windowsHide:true})).digest('hex')},boundaryCapture.gitBoundary);};checkBoundary();

if(fs.existsSync('evidence/cycle-65/snapshot-inputs.json'))throw new Error('One-shot operation; preserve original evidence');
const repo = fs.realpathSync(process.cwd());
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'coachfi-cycle65-verify-'));
const previous=JSON.parse(fs.readFileSync('evidence/cycle-65/before.json','utf8'));
const freeze=JSON.parse(fs.readFileSync('evidence/cycle-65/source-freeze.json'));for(const p of [...freeze.fingerprints,...freeze.toolFingerprints,...freeze.previousSourceTools])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.path)).digest('hex'),p.sha256,p.path);
const inputs=[...new Set([...previous.inputs.map(p=>p.path),'tests/cycle65-shopping-price.test.ts','tests/e2e/cycle65-shopping-price.spec.ts','playwright.cycle65.config.ts','lib/shopping-amounts.ts'])];
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
  excludes: ['env', 'Git', 'browser profiles', 'database contents', 'unselected reports; explicitly frozen public C63 validation-plan model inherited within579 inputs'], inputs: entries };
fs.writeFileSync(path.join(repo, 'evidence/cycle-65/snapshot-inputs.json'), JSON.stringify(manifest, null, 2) + '\n');
checkBoundary();console.log(JSON.stringify({ snapshot, inputFiles: entries.length, mismatches: 0 }));
