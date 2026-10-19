import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
const dir='evidence/cycle-49/',mode=process.argv[2];assert(['acceptance','typecheck'].includes(mode));
assert(!fs.existsSync(dir+mode+'-run.json'),'Preserve one-shot evidence');
const repo=fs.realpathSync(process.cwd()),require=createRequire(path.join(repo,'package.json'));
const selected=['tests/p0-api-access.test.ts','tests/p0-api-independent-review.test.ts','tests/consent-voice.test.ts'];
const paths=JSON.parse(fs.readFileSync(dir+'before.json','utf8')).inputs.map(x=>x.path);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),pins=()=>paths.map(path=>({path,sha256:hash(path)}));
const before=pins(),runtimeBefore=fingerprintRuntime(repo,'6.1.4'),env={...process.env};
for(const n of Object.keys(env))if(/SUPABASE|CDP_|SOLANA|ANTHROPIC|OPENAI|OPENROUTER|ELEVENLABS|UPSTASH|COACHFI_DEV_DB|NODE_AUTH_TOKEN|NPM_TOKEN/.test(n))env[n]='';
delete env.NODE_OPTIONS;delete env.NODE_PATH;env.NEXT_TELEMETRY_DISABLED='1';
let ambientProbe=null;
if(mode==='typecheck'){
 const ts=require('typescript'),config=ts.readConfigFile(path.join(repo,'tsconfig.json'),ts.sys.readFile);assert(!config.error);
 const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,repo);assert.equal(parsed.errors.length,0);assert.equal(parsed.options.types,undefined);
 const automatic=ts.getAutomaticTypeDirectiveNames(parsed.options,ts.sys).sort();assert(automatic.includes('dom-mediacapture-record'));
 ambientProbe={excluded:'dom-mediacapture-record',automaticBefore:automatic,selected:automatic.filter(n=>n!=='dom-mediacapture-record'),packageSHA256:hash('node_modules/@types/dom-mediacapture-record/package.json'),scope:'Single targeted compiler run with all automatic types except removed SDK global augmentation; not physical runtime pruning or clean install.'};
}
const args=mode==='typecheck'?[require.resolve('typescript/bin/tsc'),'--noEmit','--incremental','false','--types',ambientProbe.selected.join(','),'--listFiles']:[path.join(path.dirname(require.resolve('vitest/package.json')),'vitest.mjs'),'run',...selected,'--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile='+dir+'acceptance-tests.json'];
const startedAt=new Date().toISOString(),r=spawnSync(process.execPath,args,{cwd:repo,env,encoding:'utf8',shell:false,windowsHide:true,maxBuffer:14*1024*1024});
const after=pins(),runtimeAfter=fingerprintRuntime(repo,'6.1.4'),drift=before.filter((p,i)=>p.sha256!==after[i].sha256),runtimeEqual=JSON.stringify(runtimeBefore)===JSON.stringify(runtimeAfter);
if(ambientProbe){
 const listed=(r.stdout??'').split(/\r?\n/).map(l=>l.trim()),normalize=p=>p.replaceAll('\\','/').toLowerCase();
 ambientProbe.excludedCompilerFiles=listed.filter(l=>/[\\/]node_modules[\\/]@types[\\/]dom-mediacapture-record[\\/].*\.d\.ts$/.test(l));
 ambientProbe.projectWitnesses=['lib/data-export.ts','app/providers.tsx'].map(p=>({path:p,listed:listed.some(l=>normalize(l)===normalize(path.join(repo,p)))}));
 ambientProbe.domLibraryListed=listed.some(l=>/[\\/]typescript[\\/]lib[\\/]lib\.dom\.d\.ts$/.test(l));
 ambientProbe.exclusionVerified=ambientProbe.excludedCompilerFiles.length===0&&ambientProbe.domLibraryListed&&ambientProbe.projectWitnesses.every(p=>p.listed);
}
const exitCode=r.status===0&&(!runtimeEqual||drift.length||ambientProbe?.exclusionVerified===false)?1:r.status;
fs.writeFileSync(dir+mode+'-run.json',JSON.stringify({cycle:49,mode,startedAt,completedAt:new Date().toISOString(),childExitCode:r.status,exitCode,command:[process.execPath,...args],selectedTests:mode==='typecheck'?[]:selected,before,after,drift,runtimeBefore,runtimeAfter,runtimeEqual,ambientProbe,stdout:r.stdout??'',stderr:r.stderr??'',error:r.error?.message??null,environment:'Local installed dependency runtime, extraneous removed SDKs may remain. Existing actual route handlers with mocked CDP verifier and fetch trap; synthetic local speech engine. No clean-install, real authentication, provider or browser speech proof.'},null,2)+'\n');
console.log(JSON.stringify({mode,exitCode,inputs:before.length,drift:drift.length,runtimeEqual,error:r.error?.message??null}));process.exitCode=exitCode??1;
