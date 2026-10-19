import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const repo=fs.realpathSync(process.cwd()),require=createRequire(path.join(repo,'package.json'));
const allowed=['tests/cycle6-mindset-author.test.ts','tests/cycle6-quiz-review.test.ts','tests/cycle11-saving-author.test.ts','tests/cycle15-inflation-author.test.ts','tests/cycle16-credit-author.test.ts','tests/cycle17-emergency-author.test.ts'];
const selection=JSON.parse(fs.readFileSync(path.join(repo,'evidence/cycle-37/legacy-selection.json'),'utf8'));
if((!Number.isSafeInteger(selection.expectedTotal)||selection.expectedTotal<1||selection.expectedTotal>150)||!Array.isArray(selection.selections)||selection.selections.length!==6||new Set(selection.selections.map(s=>s.path)).size!==6||selection.selections.some(s=>!allowed.includes(s.path)||!Number.isSafeInteger(s.expected)||s.expected<1||typeof s.pattern!=='string'||!s.pattern||s.pattern.length>4000)||selection.selections.reduce((n,s)=>n+s.expected,0)!==selection.expectedTotal)throw Error('Unexpected legacy selection');
for(const s of selection.selections)new RegExp(s.pattern);
const files=['data/challengeQuestions.ts','data/stageLessons.ts','data/quizQuestions.ts','lib/allQuestions.ts','lib/quiz-topic.ts','tests/cycle37-legacy-preservation.ts','evidence/cycle-37/legacy-selection.json','evidence/cycle-37/content-author-inventory.json','evidence/cycle-37/content-author-source-change.json',...allowed];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex');
const before=files.map(p=>({path:p,sha256:sha(p)})),env={...process.env};
for(const n of Object.keys(env))if(/SUPABASE|CDP_|SOLANA|ANTHROPIC|OPENAI|OPENROUTER|ELEVENLABS|UPSTASH|COACHFI_DEV_DB/.test(n))env[n]='';env.NEXT_TELEMETRY_DISABLED='1';
const reports=[];let failed=false;const startedAt=new Date().toISOString();
for(const [index,choice] of selection.selections.entries()){
const output='evidence/cycle-37/legacy-'+index+'-tests.json';
const args=[path.join(path.dirname(require.resolve('vitest/package.json')),'vitest.mjs'),'run',choice.path,'--testNamePattern='+choice.pattern,'--maxWorkers=2','--reporter=verbose','--reporter=json','--outputFile='+output];
const result=spawnSync(process.execPath,args,{cwd:repo,env,shell:false,encoding:'utf8',maxBuffer:10*1024*1024});
const raw=fs.existsSync(path.join(repo,output))?JSON.parse(fs.readFileSync(path.join(repo,output),'utf8')):null;
const drift=before.filter(p=>sha(p.path)!==p.sha256);
const ok=result.status===0&&raw?.numPassedTests===choice.expected&&raw?.numFailedTests===0&&!drift.length;
reports.push({path:choice.path,pattern:choice.pattern,expected:choice.expected,passed:raw?.numPassedTests??0,failed:raw?.numFailedTests??null,unselected:raw?.numPendingTests??null,childExitCode:result.status,status:ok?'PASS':'FAIL',raw:output,drift,stdout:result.stdout??'',stderr:result.stderr??'',error:result.error?.message??null});
if(!ok){failed=true;break;}
}
const report={status:failed?'FAIL':'PASS',startedAt,completedAt:new Date().toISOString(),expectedTotal:selection.expectedTotal,passed:reports.reduce((n,r)=>n+r.passed,0),before,after:files.map(p=>({path:p,sha256:sha(p)})),environment:'Local synthetic preservation only, provider env blank; six per-file targeted runs; no aggregate regressions',reports};
fs.writeFileSync(path.join(repo,'evidence/cycle-37/legacy-run.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,passed:report.passed,files:reports.length}));process.exitCode=failed?1:0;
