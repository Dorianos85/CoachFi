import { expect, test, type Page } from "@playwright/test";
import { getAllQuestionIds } from "../../lib/allQuestions";
import { getTopicQuestions } from "../../lib/quiz-topic";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

type Locale="pl"|"en";
type Mode="healthy-milestone-mobile"|"malformed-read"|"prewrite-balance-retry"|"partial-client-remount";
type Fault="none"|"token-read-denied"|"token-write-then-throw";
type Snapshot={srs:string|null;tokens:string|null;steps:string|null;streak:string|null};
type Probe={fault:Fault;tokenReads:number;srsReads:number;documentId:string;writes:Array<{key:string;value:string}>;snapshot():Snapshot};
type FixtureWindow=typeof window&{__quizIntegrity:Probe};
const BAD_RAW='{"FIXTURE_bad":"not an SRS array"}',KEYS=["coachfi-srs","coachfi-tokens","coachfi-lesson-steps","coachfi-streak"];
const COPY={pl:{read:"Nie udało się odczytać danych quizu. Nie zmieniono zapisanych danych. Spróbuj ponownie.",retry:"Spróbuj ponownie",uncertain:"Nie udało się potwierdzić pełnego zapisu. Odpowiedź lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Odśwież stronę, aby odczytać dane lokalne."},en:{read:"Quiz data could not be read. Saved data was not changed. Try again.",retry:"Try again",uncertain:"The full save could not be confirmed. Your answer or points may have been partially saved. Do not retry this answer. Reload the page to read your local data."}};
const section=(page:Page)=>page.locator('section[aria-labelledby="quiz-title"]');
test.use({timezoneId:"UTC"});
async function seed(page:Page,locale:Locale,mode:Mode){
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({locale,version,mode,ids,badRaw})=>{
    if(!sessionStorage.getItem("FIXTURE_quiz_integrity_seeded")){
      sessionStorage.setItem("FIXTURE_quiz_integrity_seeded","true");const now=new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1",locale);localStorage.setItem("coachfi-user",JSON.stringify({name:"FIXTURE_QUIZ_INTEGRITY",goal:"education",setupDone:true}));
      localStorage.setItem("coachfi-mode-v1",JSON.stringify({mode:"adult",selectedAt:now,adultConfirmedAt:now,adultAgeRequirement:18}));
      localStorage.setItem("coachfi-consent-v1",JSON.stringify({version,acceptedAt:now,termsAccepted:true,privacyAccepted:true,optional:{aiCoach:false,voice:false,leaderboard:false,blockchain:false}}));
      localStorage.setItem("coachfi-tokens","125");localStorage.setItem("coachfi-lesson-steps",'{"money-mindset":3}');
      localStorage.setItem("coachfi-streak",mode==="healthy-milestone-mobile"?'{"lastActiveDate":"2025-12-31","currentStreak":2,"longestStreak":2}':'{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}');
      localStorage.setItem("coachfi-srs",mode==="malformed-read"?badRaw:JSON.stringify(ids.map(id=>({id,interval:6,repetitions:1,easeFactor:2.5,nextReview:"2026-12-01"}))));
    }
    const nativeGet=Storage.prototype.getItem,nativeSet=Storage.prototype.setItem;
    const probe:Probe={fault:"none",tokenReads:0,srsReads:0,documentId:Math.random().toString(36),writes:[],snapshot:()=>({srs:nativeGet.call(localStorage,"coachfi-srs"),tokens:nativeGet.call(localStorage,"coachfi-tokens"),steps:nativeGet.call(localStorage,"coachfi-lesson-steps"),streak:nativeGet.call(localStorage,"coachfi-streak")})};(window as FixtureWindow).__quizIntegrity=probe;
    Storage.prototype.getItem=function(key:string){if(this===localStorage&&key==="coachfi-srs")probe.srsReads++;if(this===localStorage&&key==="coachfi-tokens"){probe.tokenReads++;if(probe.fault==="token-read-denied")throw new DOMException("FIXTURE token read denied","SecurityError");}return nativeGet.call(this,key);};
    Storage.prototype.setItem=function(key:string,value:string){if(this===localStorage)probe.writes.push({key,value});nativeSet.call(this,key,value);if(this===localStorage&&key==="coachfi-tokens"&&probe.fault==="token-write-then-throw")throw new DOMException("FIXTURE token write saved then threw","QuotaExceededError");};
  },{locale,version:CONSENT_VERSION,mode,ids:getAllQuestionIds("en"),badRaw:BAD_RAW});
}
async function state(page:Page){return page.evaluate(keys=>{const p=(window as FixtureWindow).__quizIntegrity;return{...p.snapshot(),tokenReads:p.tokenReads,srsReads:p.srsReads,documentId:p.documentId,progressWrites:p.writes.filter(w=>keys.includes(w.key))};},KEYS);}
async function checkpoint(page:Page){return page.evaluate(()=>{const p=(window as FixtureWindow).__quizIntegrity,before=p.snapshot();p.writes.length=0;return before;});}
async function setFault(page:Page,fault:Fault){await page.evaluate(value=>{(window as FixtureWindow).__quizIntegrity.fault=value;},fault);}
async function unchanged(page:Page,before:Snapshot){const s=await state(page);expect({srs:s.srs,tokens:s.tokens,steps:s.steps,streak:s.streak}).toEqual(before);expect(s.progressWrites).toEqual([]);}
async function balance(page:Page,locale:Locale,value:number){const card=section(page).getByRole("heading",{name:getLocalizedContent(locale).common.tokens,level:3,exact:true}).locator("xpath=../..");await expect(card.locator("p.text-5xl")).toHaveCount(1);await expect(card.locator("p.text-5xl")).toHaveText(String(value));expect((await state(page)).tokens).toBe(String(value));}
async function question(page:Page,locale:Locale){const q=getTopicQuestions(locale,"mindset")[0];expect(q.id).toBe("net-worth");expect(q.correctAnswer).toBe("B");expect(q.reward).toBe(25);await expect(page.getByTestId("quiz-card").locator("legend")).toHaveText(q.question);for(const a of q.answers)await expect(page.getByTestId('quiz-answer-'+a.id).locator("xpath=..")).toContainText(a.text);await expect(page.getByTestId("quiz-submit")).toBeDisabled();return q;}
async function noPublishedSuccess(page:Page){await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);await expect(page.getByTestId("quiz-next")).toHaveCount(0);await expect(section(page).getByText(/^(Twój wynik to|You scored)/)).toHaveCount(0);}
async function switchLocale(page:Page,from:Locale,to:Locale){await page.locator("header").getByRole("button",{name:(from==="pl"?"Język":"Language")+": "+localeLabels[from],exact:true}).click();await page.getByRole("option",{name:localeLabels[to],exact:true}).click();await expect(page.locator("html")).toHaveAttribute("lang",to);}
function netWorth(raw:string|null){return(JSON.parse(raw!)as Array<{id:string;repetitions:number;nextReview:string}>).find(c=>c.id==="net-worth")!;}

test.beforeEach(async({context})=>{await context.route("**/*",route=>{const u=new URL(route.request().url());return["127.0.0.1","localhost"].includes(u.hostname)&&!u.pathname.startsWith("/api/")?route.continue():route.abort();});});
for(const locale of["pl","en"]as const)for(const mode of["healthy-milestone-mobile","malformed-read","prewrite-balance-retry","partial-client-remount"]as const){
  test(locale+" "+mode+": quiz confirms SRS and real reward before feedback",async({page,context})=>{
    const apiCalls:string[]=[],pageErrors:string[]=[];context.on("request",request=>{if(new URL(request.url()).pathname.startsWith("/api/"))apiCalls.push(request.url());});page.on("pageerror",error=>pageErrors.push(error.message));
    await page.setViewportSize(mode==="healthy-milestone-mobile"?{width:375,height:812}:{width:1280,height:800});await seed(page,locale,mode);await page.goto("/quiz?topic=mindset");
    if(mode==="malformed-read"){
      await expect(page.getByTestId("quiz-load-alert")).toHaveText(COPY[locale].read);expect((await state(page)).srsReads).toBeGreaterThan(0);expect((await state(page)).progressWrites).toEqual([]);const before=await checkpoint(page);expect(before.srs).toBe(BAD_RAW);await expect(page.getByTestId("quiz-card")).toHaveCount(0);await noPublishedSuccess(page);
      await page.getByTestId("quiz-read-retry").click();await expect(page.getByTestId("quiz-load-alert")).toHaveText(COPY[locale].read);await unchanged(page,before);const other=locale==="pl"?"en":"pl";await switchLocale(page,locale,other);await expect(page.getByTestId("quiz-load-alert")).toHaveText(COPY[other].read);await unchanged(page,before);
      await page.reload();await expect(page.getByTestId("quiz-load-alert")).toHaveText(COPY[other].read);expect((await state(page)).srsReads).toBeGreaterThan(0);await unchanged(page,before);await noPublishedSuccess(page);
    }else{
      const q=await question(page,locale);await balance(page,locale,125);expect((await state(page)).progressWrites).toEqual([]);const before=await checkpoint(page); // Real guest/shell/card initialization confirmed before action-write window.
      if(mode==="healthy-milestone-mobile"){
        const radio=page.getByTestId("quiz-answer-B");await radio.focus();await expect(radio).toBeFocused();await page.keyboard.press("Space");await expect(radio).toBeChecked();await expect(page.getByTestId("quiz-submit")).toBeEnabled();
        await page.getByTestId("quiz-card").locator("form").evaluate(form=>{form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));});
        await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveText(q.successMessage);await balance(page,locale,165);const saved=await state(page);expect(netWorth(saved.srs)).toMatchObject({repetitions:2,nextReview:"2026-01-07"});expect(JSON.parse(saved.streak!)).toMatchObject({lastActiveDate:"2026-01-01",currentStreak:3});expect(saved.progressWrites.map(w=>w.key)).toEqual(["coachfi-srs","coachfi-tokens","coachfi-streak","coachfi-tokens"]);expect(saved.progressWrites.filter(w=>w.key==="coachfi-tokens").map(w=>w.value)).toEqual(["150","165"]);expect(saved.steps).toBe(before.steps);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);await page.getByTestId("quiz-next").focus();await expect(page.getByTestId("quiz-next")).toBeFocused();await page.keyboard.press("Enter");await expect(page.getByTestId("quiz-card").locator("legend")).toHaveText(getTopicQuestions(locale,"mindset")[1].question);await balance(page,locale,165);expect((await state(page)).progressWrites).toHaveLength(4);
      }else if(mode==="prewrite-balance-retry"){
        await page.getByTestId("quiz-answer-B").check();await setFault(page,"token-read-denied");const reads=(await state(page)).tokenReads;await page.getByTestId("quiz-submit").click();await expect(page.getByTestId("quiz-card").getByRole("alert")).toHaveCount(1);await expect(page.getByTestId("quiz-balance-unavailable")).toBeVisible();expect((await state(page)).tokenReads).toBeGreaterThan(reads);await balance(page,locale,125);await expect(page.getByTestId("quiz-submit")).toBeEnabled();await noPublishedSuccess(page);await unchanged(page,before);
        await setFault(page,"none");await page.getByTestId("quiz-submit").click();await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveText(q.successMessage);await expect(page.getByTestId("quiz-balance-unavailable")).toHaveCount(0);await balance(page,locale,150);const saved=await state(page);expect(netWorth(saved.srs)).toMatchObject({repetitions:2,nextReview:"2026-01-07"});expect(saved.streak).toBe(before.streak);expect(saved.progressWrites.map(w=>w.key)).toEqual(["coachfi-srs","coachfi-tokens"]);
      }else{
        await page.getByTestId("quiz-answer-B").check();await setFault(page,"token-write-then-throw");await page.getByTestId("quiz-submit").click();await expect(page.getByTestId("quiz-save-alert")).toContainText(COPY[locale].uncertain);await noPublishedSuccess(page);await balance(page,locale,150);const partial=await state(page);expect(netWorth(partial.srs)).toMatchObject({repetitions:2,nextReview:"2026-01-07"});expect(partial.progressWrites.map(w=>w.key)).toEqual(["coachfi-srs","coachfi-tokens"]);expect(partial.streak).toBe(before.streak);const partialSnapshot=await checkpoint(page);await setFault(page,"none");const other=locale==="pl"?"en":"pl";await switchLocale(page,locale,other);await expect(page.getByTestId("quiz-save-alert")).toContainText(COPY[other].uncertain);await expect(page.getByTestId("quiz-submit")).toBeDisabled();expect(await page.getByTestId("quiz-card").locator('input[type="radio"]').evaluateAll(inputs=>inputs.every(input=>(input as HTMLInputElement).disabled))).toBe(true);await noPublishedSuccess(page);await unchanged(page,partialSnapshot);
        const documentId=(await state(page)).documentId;await page.locator('header a[href="/"]').click();await expect(page).toHaveURL(/\/$/);const quizDetails=page.locator("aside details").filter({has:page.locator('a[href="/quiz"]')});await expect(quizDetails).toHaveCount(1);if(await quizDetails.getAttribute("open")===null)await quizDetails.locator("summary").click();await quizDetails.locator('a[href="/quiz"]').click();await expect(page).toHaveURL(/\/quiz$/);expect((await state(page)).documentId).toBe(documentId);
        await expect(page.getByTestId("quiz-save-alert")).toContainText(COPY[other].uncertain);await expect(page.getByTestId("quiz-submit")).toBeDisabled();expect(await page.getByTestId("quiz-card").locator('input[type="radio"]').evaluateAll(inputs=>inputs.every(input=>(input as HTMLInputElement).disabled))).toBe(true);await noPublishedSuccess(page);await unchanged(page,partialSnapshot);
        // Actual NextLink navigation retains this document/module RAM. No no-replay claim across full reload, tabs or new documents.
      }
    }
    expect(apiCalls).toEqual([]);expect(pageErrors).toEqual([]);
  });
}
