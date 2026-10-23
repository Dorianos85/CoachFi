import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fingerprintRuntime} from '../cycle-38/runtime-fingerprint.mjs';
const dir='evidence/cycle-46/', docs='docs/coachfi/cycle-46/';
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''), json=p=>JSON.parse(read(p));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(dir,{recursive:true}); fs.mkdirSync(docs,{recursive:true});
assert(!fs.existsSync(dir+'before.json'),'One-shot capture');
const previous=json('evidence/cycle-45/source-freeze.json');
const tuples=[...previous.fingerprints,...previous.toolFingerprints,...previous.previousSourceTools], unique=new Map();
for(const pin of tuples){assert.equal(hash(pin.path),pin.sha256,pin.path);if(unique.has(pin.path))assert.deepEqual(unique.get(pin.path),pin);unique.set(pin.path,pin);}
assert.equal(tuples.length,112);assert.equal(unique.size,110);
const inputs=json('evidence/cycle-45/snapshot-inputs.json').inputs;
assert.equal(inputs.length,541);for(const p of inputs)assert.equal(hash(p.path),p.sha256,p.path);
const runtime=fingerprintRuntime(process.cwd(),'6.1.4');assert.deepEqual(runtime,previous.runtime);
const receipt='evidence/cycle-45/final-stage.json';assert.equal(hash(receipt),'ee81dc6aad9482f674e0abf1c3c5d2d7fd10e76799533079da32f489148e660c');
const preserve=['lib/streak.ts','context/StreakContext.tsx','app/quiz/page.tsx','lib/user.ts','components/AppNavigation.tsx','components/QuizCard.tsx','components/SocialShare.tsx','lib/notifications.ts','lib/product-scope.ts','lib/product-storage.ts','lib/tokens.ts','package.json','package-lock.json'];
write(dir+'before.json',{cycle:46,at:new Date().toISOString(),status:'BEFORE_PRODUCT_CHANGE',runtime,inputs,previousSourceToolTuples:tuples,previousSourceTools:[...unique.values()],source:{path:'components/StreakBadge.tsx',sha256:hash('components/StreakBadge.tsx'),fullBefore:read('components/StreakBadge.tsx')},preserve:preserve.map(path=>({path,sha256:hash(path)})),previousReceipt:{path:receipt,sha256:hash(receipt)}});
const receipts=[...json('evidence/cycle-45/prior-receipts.json').receipts,{path:receipt,sha256:hash(receipt)}];
for(const p of receipts)assert.equal(hash(p.path),p.sha256);write(dir+'prior-receipts.json',{cycle:46,receipts});
write(dir+'registry-before.json',{registries:['docs/coachfi/backlog.json','../../docs/coachfi/backlog.json'].map(path=>({path,tasks:json(path).tasks}))});
for(const name of ['prepare-snapshot.mjs','build-snapshot.mjs','browser-check.mjs']){
  let s=read('evidence/cycle-45/'+name).replaceAll('cycle-45','cycle-46').replaceAll('cycle45','cycle46').replaceAll('cycle:45','cycle:46');
  if(name==='prepare-snapshot.mjs'){
    s=s.replace("'playwright.cycle46.config.ts',","'playwright.cycle45.config.ts', 'playwright.cycle46.config.ts',");
    s=s.replace(".split('\\0').filter(Boolean);", ".split('\\0').filter(Boolean);\nfor(const p of ['tests/cycle46-streak-milestone-ui.test.ts','tests/e2e/cycle46-streak-milestone.spec.ts','playwright.cycle46.config.ts'])if(!listed.includes(p))listed.push(p);");
  }
  assert(!fs.existsSync(dir+name));fs.writeFileSync(dir+name,s);
}
fs.writeFileSync(docs+'workplan.md',`# C46 — komunikat kamienia milowego PL/EN

Zakres: wyłącznie dwa string literals w aktywnym StreakBadge. Zamiast obietnicy automatycznego nawyku po 66 dniach komunikat docenia regularność. Root autor; c46_evidence niezależna recenzja naukowa/źródła, c46_ui autor fixtures oraz niezależny reviewer produktu/narzędzi/wyników; root peer fixtures. Root+2, rozłączne pliki. Najpierw źródła i baseline, potem poprawka i niezależny retest.

12 SSR cases (PL/EN × available66/3/0/67/loading66/unavailable66), actual ReactDOMServer + real framer-motion, dwa jawne mocki hooków. Compact/full to próbki wewnątrz case. 4 Chrome cases PL/EN ×66/3 na tym samym built TEMP, actual shell/provider/badge/QuizCard/Space/reload; dane wyłącznie syntetyczne, 6 kluczy bez set/remove,125tokenów/API0/pageErrors0. StandaloneTS i jeden build. Nie powtarzamy C45 zielonych reader/provider regresji: ich źródła są literalnie zachowane. Nie deklarujemy SSR jako testu actualProvider ani DOMtitle jako wizualnego testu natywnego tooltipa.

Snapshot 541 poprzednich wejść +3 fixtures/config, oczekiwane544/543 po pominięciu generowanego next-env. 112 wcześniejszych tuple/110 ścieżek:109 literalnych,1 jawnie kwalifikowany Badge. Preserve13, dependency runtime37files/2consumers unchanged. Freeze przed checks, zachowanie starych receipts. Uproszczony ledger dla dwóch komunikatów: brak git add/commit/push/deploy; istniejący index zachowany. Przyjęcie wyłącznie LOCAL_UNSTAGED po niezależnych recenzjach rzeczywistych wyników, bez automatycznej promocji metadanych z QA.

C45 triage zależności pozostaje odroczona (major/bundled), bez nowego audit/install/closure. B06 siedem modułów/51 poprawek pytań bez zmiany, B10 częściowo otwarte. Inne locale i pozostałe claimy poza akceptacją. Milestone66/bonus5/writers/statusguards literalnie zachowane. Bez nowych danych, rynków, AI/cloudwrites/płatnych wywołań/produkcji/realnych sesji. Brak staging nie daje PASS; produkcja NO-GO.
`);
console.log(JSON.stringify({cycle:46,inputs:inputs.length,priorTuples:tuples.length,priorUnique:unique.size,receipts:receipts.length}));
