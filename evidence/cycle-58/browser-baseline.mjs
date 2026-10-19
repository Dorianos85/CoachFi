import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import net from 'node:net';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
import {checkSnapshotInputs,snapshotInput} from '../cycle-38/snapshot-boundaries.mjs';import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
const repo=fs.realpathSync(process.cwd()),dir='evidence/cycle-58/',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const name of ['browser-baseline-run.json','browser-baseline-child.json','browser-baseline-tests.json'])assert(!fs.existsSync(dir+name),'Preserve original '+name);
const before=JSON.parse(fs.readFileSync(dir+'before.json'));
for(const p of [...before.previousSourceTools,...before.preserve,...before.receipts,...before.sdkContractPins,...before.sources])assert.equal(hash(p.path),p.sha256,p.path);
const manifest=JSON.parse(fs.readFileSync(snapshotInput(repo,'evidence/cycle-57/snapshot-inputs.json'))),build=JSON.parse(fs.readFileSync(snapshotInput(repo,'evidence/cycle-57/build-result.json'))),snapshot=fs.realpathSync(manifest.snapshot);
assert.equal(build.status,'PASS');assert.equal(build.exitCode,0);assert.equal(build.snapshot,snapshot);assert.equal(fs.realpathSync(manifest.repo),repo);
assert(snapshot.startsWith(fs.realpathSync(os.tmpdir())+path.sep));assert(path.basename(snapshot).startsWith('coachfi-cycle57-verify-'));
assert.equal(fs.realpathSync(path.join(snapshot,'node_modules')),fs.realpathSync(path.join(repo,'node_modules')));
assert(fs.realpathSync(path.join(snapshot,'.next')).startsWith(snapshot+path.sep));
const preflight=checkSnapshotInputs(repo,snapshot,manifest.inputs,true);assert.equal(preflight.comparedInputs,564);assert.deepEqual(preflight.currentMismatches,[]);assert.deepEqual(preflight.snapshotMismatches,[]);
const runtimeBefore=fingerprintRuntime(snapshot,'6.1.4');assert.deepEqual(runtimeBefore,manifest.runtime);assert.deepEqual(runtimeBefore,build.runtimeAfter);assert.deepEqual(fingerprintRuntime(repo,'6.1.4'),runtimeBefore);
const fixturePins=[];
for(const name of ['tests/e2e/cycle58-consent-dialog.spec.ts','playwright.cycle58.config.ts']){
  const source=snapshotInput(repo,name),target=path.resolve(snapshot,name);assert(target.startsWith(snapshot+path.sep));assert(!fs.existsSync(target),'New fixture destination must not exist');
  assert(fs.realpathSync(path.dirname(target)).startsWith(snapshot+path.sep)||fs.realpathSync(path.dirname(target))===snapshot);
  fixturePins.push({path:name,sha256:hash(source)});fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);assert.equal(hash(snapshotInput(snapshot,name)),hash(source));
}
async function portFree(){return await new Promise(resolve=>{const server=net.createServer();server.once('error',()=>resolve(false));server.listen(43191,'127.0.0.1',()=>server.close(()=>resolve(true)));});}
const portFreeBefore=await portFree();assert(portFreeBefore,'Refuse unrelated local server');
const env={...process.env};for(const n of Object.keys(env))if(/SUPABASE|CDP_|SOLANA|ANTHROPIC|OPENAI|OPENROUTER|ELEVENLABS|UPSTASH|COACHFI_DEV_DB|NODE_AUTH_TOKEN|NPM_TOKEN/.test(n))env[n]='';
for(const n of ['NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED','NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON','NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS'])env[n]='0';
delete env.NODE_OPTIONS;delete env.NODE_PATH;env.NEXT_TELEMETRY_DISABLED='1';env.COACHFI_P0_BROWSER_CHANNEL='chrome';env.COACHFI_P0_REUSE_SERVER='0';env.NEXT_PUBLIC_APP_URL='http://127.0.0.1:43191';env.PLAYWRIGHT_JSON_OUTPUT_FILE=path.join(repo,dir+'browser-baseline-tests.json');
const require=createRequire(path.join(snapshot,'package.json')),args=[require.resolve('@playwright/test/cli'),'test','--config=playwright.cycle58.config.ts','--reporter=json','--output='+path.join(snapshot,'test-results/cycle-58-baseline')],startedAt=new Date().toISOString();
const r=spawnSync(process.execPath,args,{cwd:snapshot,env,shell:false,encoding:'utf8',windowsHide:true,maxBuffer:30*1024*1024});
const childPath=dir+'browser-baseline-child.json';fs.writeFileSync(childPath,JSON.stringify({cycle:58,startedAt,completedAt:new Date().toISOString(),childExitCode:r.status,args,stdout:r.stdout??'',stderr:r.stderr??'',error:r.error?.message??null},null,2)+'\n',{flag:'wx'});
const postflight=checkSnapshotInputs(repo,snapshot,manifest.inputs,true),runtimeAfter=fingerprintRuntime(snapshot,'6.1.4');
const fixtureMismatches=fixturePins.filter(p=>hash(snapshotInput(repo,p.path))!==p.sha256||hash(snapshotInput(snapshot,p.path))!==p.sha256).map(p=>p.path);
const runtimeEqual=JSON.stringify(runtimeBefore)===JSON.stringify(runtimeAfter)&&JSON.stringify(fingerprintRuntime(repo,'6.1.4'))===JSON.stringify(runtimeBefore);
const cleanupStarted=Date.now(),cleanupProbes=[];let portFreeAfter=false;
do{portFreeAfter=await portFree();cleanupProbes.push({at:new Date().toISOString(),elapsedMs:Date.now()-cleanupStarted,free:portFreeAfter});if(portFreeAfter||Date.now()-cleanupStarted>=5000)break;await new Promise(resolve=>setTimeout(resolve,250));}while(Date.now()-cleanupStarted<5000);
const flatten=suites=>suites.flatMap(s=>[...(s.specs??[]),...flatten(s.suites??[])]);let counts=null,selectionError=null;
try{const raw=JSON.parse(fs.readFileSync(dir+'browser-baseline-tests.json')),specs=flatten(raw.suites??[]);counts={specs:specs.length,stats:raw.stats,titles:specs.map(s=>s.title),results:specs.map(s=>s.tests.map(t=>t.results.map(r=>({status:r.status,retry:r.retry}))))};assert.equal(specs.length,4);assert(specs.every(s=>s.tests.length===1&&s.tests[0].results.length===1&&s.tests[0].results[0].retry===0));}catch(e){selectionError=String(e);}
const boundariesOk=!postflight.currentMismatches.length&&!postflight.snapshotMismatches.length&&!fixtureMismatches.length&&runtimeEqual&&portFreeAfter&&!selectionError;
const result={cycle:58,status:boundariesOk&&r.status===0&&!r.error?'PASS':'FAIL',baselineOnly:true,applicationSourceChanged:false,reusedBuild:{manifest:'evidence/cycle-57/snapshot-inputs.json',build:'evidence/cycle-57/build-result.json',snapshot},childReceipt:{path:childPath,sha256:hash(childPath)},fixturePins,startedAt,completedAt:new Date().toISOString(),childExitCode:r.status,error:r.error?.message??null,preflight,postflight,fixtureMismatches,runtimeBefore,runtimeAfter,runtimeEqual,portFreeBefore,portFreeAfter,cleanupProbes,counts,selectionError,boundariesOk,environment:'Installed Chrome, fresh ephemeral synthetic contexts; reused verified C57 Nextstart TEMP; providerblank,external/APIblocked; no user profiles or real data'};
fs.writeFileSync(dir+'browser-baseline-run.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,childExitCode:r.status,boundariesOk,counts,portFreeAfter}));process.exitCode=result.status==='PASS'?0:1;
