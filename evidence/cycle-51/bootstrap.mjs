import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
const dir='evidence/cycle-51/';assert(!fs.existsSync(dir+'before.json'),'Preserve one-shot evidence');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const previous=JSON.parse(fs.readFileSync('evidence/cycle-50/source-freeze.json','utf8'));
const tuples=[...previous.fingerprints,...previous.toolFingerprints,...previous.previousSourceTools];for(const p of tuples)assert.equal(hash(p.path),p.sha256,p.path);
const previousSourceTools=[...new Map(tuples.map(p=>[p.path,p])).values()];
const inputs=JSON.parse(fs.readFileSync('evidence/cycle-50/snapshot-inputs.json','utf8')).inputs;for(const p of inputs)assert.equal(hash(p.path),p.sha256,p.path);
const receipts=[];for(let n=39;n<=50;n++){const p=`evidence/cycle-${n}/final-${n>=46?'local':'stage'}.json`;receipts.push({path:p,sha256:hash(p)});}
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim(),gitBoundary={branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),indexEntriesSHA256:crypto.createHash('sha256').update(execFileSync('git',['ls-files','--stage','-z'])).digest('hex')};
const preserve=['lib/data-export.ts','lib/tokens.ts','lib/streak.ts','context/StreakContext.tsx','components/DataSafetyPanel.tsx','lib/product-storage.ts','lib/consent.ts','lib/healthCheck.ts','lib/financial-score.ts','package.json','package-lock.json'].map(path=>({path,sha256:hash(path)}));
fs.writeFileSync(dir+'before.json',JSON.stringify({cycle:51,at:new Date().toISOString(),status:'BEFORE_PRODUCT_CHANGE',gitBoundary,inputs,previousSourceToolTuples:tuples,previousSourceTools,receipts,source:{path:'lib/avatar.ts',sha256:hash('lib/avatar.ts'),fullBefore:fs.readFileSync('lib/avatar.ts','utf8')},preserve,runtime:fingerprintRuntime(process.cwd(),'6.1.4')},null,2)+'\n');
console.log(JSON.stringify({inputs:inputs.length,tuples:tuples.length,unique:previousSourceTools.length,receipts:receipts.length,gitBoundary}));
