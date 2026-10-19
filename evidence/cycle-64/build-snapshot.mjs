import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync,execFileSync } from 'node:child_process';
import { checkSnapshotInputs, snapshotInput } from '../cycle-38/snapshot-boundaries.mjs';


const boundaryCapture=JSON.parse(fs.readFileSync('evidence/cycle-64/before.json'));const checkBoundary=()=>{for(const p of [...boundaryCapture.previousSourceTools,...boundaryCapture.preserve,...boundaryCapture.receipts,...boundaryCapture.sdkContractPins])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.path)).digest('hex'),p.sha256,p.path);for(const p of boundaryCapture.deletedSources)assert(!fs.existsSync(p.path),p.path);const git=a=>execFileSync('git',a,{encoding:'utf8',windowsHide:true}).trim();assert.deepEqual({branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),indexEntriesSHA256:crypto.createHash('sha256').update(execFileSync('git',['ls-files','--stage','-z'],{windowsHide:true})).digest('hex')},boundaryCapture.gitBoundary);};checkBoundary();

if(fs.existsSync('evidence/cycle-64/build-result.json'))throw new Error('One-shot operation; preserve original evidence');
if(fs.existsSync('evidence/cycle-64/build-child.json'))throw new Error('Preserve original raw child');
const repo = fs.realpathSync(process.cwd());
const manifest = JSON.parse(fs.readFileSync(snapshotInput(repo, 'evidence/cycle-64/snapshot-inputs.json'), 'utf8'));
if (fs.realpathSync(manifest.repo) !== repo) throw new Error('Build manifest repository mismatch');
const snapshot = fs.realpathSync(manifest.snapshot);
if (!snapshot.startsWith(fs.realpathSync(os.tmpdir()) + path.sep) || !path.basename(snapshot).startsWith('coachfi-cycle64-verify-')) throw new Error('Build snapshot boundary failure');
if (fs.realpathSync(path.join(snapshot, 'node_modules')) !== fs.realpathSync(path.join(repo, 'node_modules'))) throw new Error('Dependency junction boundary failure');
const generated = path.join(snapshot, '.next');
if (fs.existsSync(generated) && !fs.realpathSync(generated).startsWith(snapshot + path.sep)) throw new Error('Generated output boundary failure');
const preflight = checkSnapshotInputs(repo, snapshot, manifest.inputs);
if (preflight.currentMismatches.length || preflight.snapshotMismatches.length) throw new Error('Build preflight fingerprint mismatch');
const taskEnv = { ...process.env };
for (const name of Object.keys(taskEnv)) if (/SUPABASE|CDP_|SOLANA|ANTHROPIC|OPENAI|OPENROUTER|ELEVENLABS|UPSTASH|COACHFI_DEV_DB|NODE_AUTH_TOKEN|NPM_TOKEN/.test(name)) taskEnv[name] = '';
for (const n of ['NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED', 'NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON', 'NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS']) taskEnv[n] = '0';
delete taskEnv.NODE_OPTIONS; delete taskEnv.NODE_PATH; taskEnv.NEXT_TELEMETRY_DISABLED = '1'; taskEnv.NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:43191';
const runtimeBefore=fingerprintRuntime(snapshot,'6.1.4');assert.deepEqual(runtimeBefore,manifest.runtime);assert.deepEqual(fingerprintRuntime(repo,'6.1.4'),manifest.runtime);
const startedAt = new Date().toISOString();
const require = createRequire(path.join(snapshot, 'package.json'));
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'],
  { cwd: snapshot, env: taskEnv, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, shell: false, windowsHide:true });
const childReceiptPath=path.join(repo,'evidence/cycle-64/build-child.json');fs.writeFileSync(childReceiptPath,JSON.stringify({cycle:64,startedAt,completedAt:new Date().toISOString(),snapshot,args:[require.resolve('next/dist/bin/next'),'build'],childExitCode:result.status,stdout:result.stdout??'',stderr:result.stderr??'',error:result.error?.message??null},null,2)+'\n');
checkBoundary();
const postflight = checkSnapshotInputs(repo, snapshot, manifest.inputs, true);
const runtimeAfter=fingerprintRuntime(snapshot,'6.1.4');assert.deepEqual(runtimeAfter,runtimeBefore);assert.deepEqual(fingerprintRuntime(repo,'6.1.4'),runtimeBefore);
const mismatches = postflight.snapshotMismatches;
const report = { status: result.status === 0 && !mismatches.length && !postflight.currentMismatches.length ? 'PASS' : 'FAIL', exitCode: result.status,
  childReceipt:{path:'evidence/cycle-64/build-child.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(childReceiptPath)).digest('hex')},runtimeBefore,runtimeAfter,runtimeEqual:true, startedAt, completedAt: new Date().toISOString(), snapshot, preflight, comparedInputs: postflight.comparedInputs, hashMismatches: mismatches,
  currentMismatches: postflight.currentMismatches,
  environment: 'provider/auth keys blank; telemetry off; existing dependency runtime; no real data',
  stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error?.message ?? null };
fs.writeFileSync(path.join(repo, 'evidence/cycle-64/build-result.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, exitCode: result.status, comparedInputs: postflight.comparedInputs, hashMismatches: mismatches, currentMismatches: postflight.currentMismatches, error: report.error }));
process.exitCode = report.status === 'PASS' ? 0 : 1;
