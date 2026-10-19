import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(), failure: "none" as "none" | "throw" | "write-then-throw",
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const index = fixture.slot++, previous = fixture.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) fixture.memos.set(index, { deps, value: factory() });
  return fixture.memos.get(index)?.value;
}
function effect(effect: Effect, deps?: readonly unknown[]) {
  const index = fixture.slot++;
  if (!fixture.effectDeps.has(index) || !sameDeps(fixture.effectDeps.get(index), deps)) fixture.effects.push(() => {
    fixture.cleanups.get(index)?.(); fixture.cleanups.delete(index);
    const cleanup = effect(); if (typeof cleanup === "function") fixture.cleanups.set(index, cleanup);
  });
  fixture.effectDeps.set(index, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useLayoutEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useState: (initial: unknown) => {
    const index = fixture.slot++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => { fixture.setState(value);
      fixture.values.set(index, typeof value === "function" ? value(fixture.values.get(index)) : value); }];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.markActive }) }));


const TARGET = "emergency-first-milestone";
type Props = { children?: unknown; text?: string; title?: string; readText?: string; label?: string; className?: string; disabled?: boolean; role?: string; onClick?: () => void };
function nodes(node: unknown): Array<ReactElement<Props>> {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Props>; return [element, ...nodes(element.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object" && "props" in node ? text((node as ReactElement<Props>).props.children) : "";
}
const COPY = {pl:{check:"Sprawdź odpowiedź",finish:"Zakończ sesję",correct:"✓ Dobrze!",wrong:"✗ Jeszcze nie",complete:"Sesja zakończona!"},en:{check:"Check answer",finish:"Finish session",correct:"✓ Correct!",wrong:"✗ Not quite",complete:"Session complete!"}};
let bytes: Map<string,string>, writes: Array<{key:string;value:string}>, render: () => ReactElement | null;
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length=0; fixture.slot=0; }
function settle() { let tree=render(); for(let i=0;i<8&&fixture.effects.length;i++){fixture.effects.splice(0).forEach(callback=>callback());tree=render();} expect(fixture.effects).toHaveLength(0); return tree; }
function button(tree: unknown, label: string) { const found=nodes(tree).filter(node=>node.props.onClick&&text(node)===label); expect(found).toHaveLength(1); return found[0]; }
function answer(tree: unknown, id: string) { const found=nodes(tree).filter(node=>node.key===id&&node.props.onClick); expect(found).toHaveLength(1); found[0].props.onClick!(); return settle(); }
function card() { return (JSON.parse(bytes.get("coachfi-srs")!) as Array<import("@/lib/srs").SRSCard>).find(card=>card.id===TARGET)!; }
const observation=(name:string,value:unknown)=>console.log("C18_UI_OBSERVATION "+JSON.stringify({name,value}));
beforeEach(async()=>{
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z")); resetHooks(); fixture.locale="pl"; fixture.failure="none";
  bytes=new Map([["coachfi-tokens","125"],["coachfi-lesson-steps",'{"emergency-fund":3}']]); writes=[];
  const storage={getItem:(key:string)=>bytes.get(key)??null,setItem:(key:string,value:string)=>{writes.push({key,value});if(key==="coachfi-srs"&&fixture.failure==="throw")throw Error("FIXTURE refused SRS writer");bytes.set(key,value);if(key==="coachfi-srs"&&fixture.failure==="write-then-throw")throw Error("FIXTURE SRS writer threw after writing");},removeItem:(key:string)=>{bytes.delete(key);}};
  const win=new EventTarget() as EventTarget & {localStorage:typeof storage;sessionStorage:typeof storage};Object.assign(win,{localStorage:storage,sessionStorage:storage});vi.stubGlobal("window",win);vi.stubGlobal("fetch",vi.fn(()=>{throw Error("No network permitted in C18 fixture");}));
  const store=await import("@/lib/product-storage");store.beginStorageOwner({kind:"guest"}).publishReady();fixture.storage=store.captureCurrentPersonalStorage();
  const {getAllQuestionIds}=await import("@/lib/allQuestions"); const cards=getAllQuestionIds("en").map(id=>({id,interval:6,nextReview:id===TARGET?"2026-01-01":"2026-12-01",repetitions:1,easeFactor:2.5}));bytes.set("coachfi-srs",JSON.stringify(cards));
  const {default:ReviewPage}=await import("@/app/review/page");render=()=>{fixture.slot=0;return ReviewPage();};
});
afterEach(()=>{expect(fetch).not.toHaveBeenCalled();resetHooks();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});

describe("C18 actual ReviewPage before-edit content and SRS contract observations",()=>{
  it("existing B25 target is unique canonical PLEN, globally reviewable and outside three emergency stage IDs",async()=>{
    const {getQuestionById,getAllQuestionIds,allQuestions}=await import("@/lib/allQuestions"),{STAGE_QUESTION_IDS}=await import("@/lib/learningProgress"),{getDueIds}=await import("@/lib/srs");
    expect(allQuestions.filter(q=>q.id===TARGET)).toHaveLength(1);expect(STAGE_QUESTION_IDS["emergency-fund"]).toEqual(["emergency-fund","emergency-fund-characteristics","emergency-fund-start"]);expect(STAGE_QUESTION_IDS["emergency-fund"]).not.toContain(TARGET);
    for(const locale of ["pl","en"] as const){expect(getAllQuestionIds(locale).filter(id=>id===TARGET)).toHaveLength(1);expect(getQuestionById(TARGET,locale)).toMatchObject({id:TARGET,correctAnswer:"B",reward:25});expect(getDueIds(getAllQuestionIds(locale),fixture.storage)).toEqual([TARGET]);}
    expect(getQuestionById(TARGET,"pl")!.question).not.toBe(getQuestionById(TARGET,"en")!.question);
  });
  it.each(["pl","en"] as const)("%s actual correct review renders canonical copy and full voice props, advances SRS without a direct25token award",async locale=>{
    fixture.locale=locale;const {getQuestionById}=await import("@/lib/allQuestions"),q=getQuestionById(TARGET,locale)!;let tree=settle();const beforeCards=JSON.parse(bytes.get("coachfi-srs")!) as Array<import("@/lib/srs").SRSCard>,beforeTokens=bytes.get("coachfi-tokens"),beforeSteps=bytes.get("coachfi-lesson-steps");
    expect(text(tree)).toContain(q.question);for(const option of q.answers)expect(text(tree)).toContain(option.text);expect(nodes(tree).filter(node=>node.key&&["A","B","C","D"].includes(String(node.key))&&node.props.onClick)).toHaveLength(4);
    const questionVoice=nodes(tree).find(node=>node.props.label==="Przeczytaj pytanie");expect(questionVoice?.props.text).toBe(q.question);expect(writes).toHaveLength(0);expect(button(tree,COPY[locale].check).props.disabled).toBe(true);
    tree=answer(tree,"B");const reveal=button(tree,COPY[locale].check);expect(reveal.props.disabled).toBe(false);reveal.props.onClick!();tree=settle();
    expect(text(tree)).toContain(COPY[locale].correct);expect(text(tree)).toContain(q.explanation);expect(nodes(tree).find(node=>node.props.label==="Przeczytaj wyjaśnienie")?.props.text).toBe(q.explanation);
    expect(card()).toMatchObject({id:TARGET,repetitions:2,interval:6,nextReview:"2026-01-07"});expect(bytes.get("coachfi-tokens")).toBe(beforeTokens);expect(bytes.get("coachfi-lesson-steps")).toBe(beforeSteps);expect(fixture.markActive).toHaveBeenCalledTimes(1);
    const afterCards=JSON.parse(bytes.get("coachfi-srs")!) as Array<import("@/lib/srs").SRSCard>;expect(afterCards.filter(c=>c.id!==TARGET)).toEqual(beforeCards.filter(c=>c.id!==TARGET));
    observation("correct-"+locale,{question:q.question,explanation:q.explanation,questionVoice:q.question,explanationVoice:q.explanation,metadataReward:q.reward,tokensBefore:beforeTokens,tokensAfter:bytes.get("coachfi-tokens"),SRS:card(),activityCalls:fixture.markActive.mock.calls.length});
    button(tree,COPY[locale].finish).props.onClick!();tree=settle();expect(nodes(tree).some(node=>node.props.title===COPY[locale].complete)).toBe(true);expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it.each(["pl","en"] as const)("%s actual wrong review shows canonical explanation, resets SRS and does not award25tokens or mark activity",async locale=>{
    fixture.locale=locale;const {getQuestionById}=await import("@/lib/allQuestions"),q=getQuestionById(TARGET,locale)!;let tree=answer(settle(),"A");button(tree,COPY[locale].check).props.onClick!();tree=settle();expect(text(tree)).toContain(COPY[locale].wrong);expect(text(tree)).toContain(q.explanation);expect(nodes(tree).find(node=>node.props.label==="Przeczytaj wyjaśnienie")?.props.text).toBe(q.explanation);
    expect(card()).toMatchObject({id:TARGET,repetitions:0,interval:1,nextReview:"2026-01-02"});expect(bytes.get("coachfi-tokens")).toBe("125");expect(bytes.get("coachfi-lesson-steps")).toBe('{"emergency-fund":3}');expect(fixture.markActive).not.toHaveBeenCalled();
  });
});

describe("C18 pre-edit actual ReviewPage integrity hypothesis probes",()=>{
  it("one eligible reveal is consumed before same-handler repeat and stale post-render repeat",()=>{
    let tree=answer(settle(),"B");const eligible=button(tree,COPY.pl.check);expect(eligible.props.disabled).toBe(false);const reveal=eligible.props.onClick!;
    reveal();const first=bytes.get("coachfi-srs"),firstCard={...card()};reveal();const second=bytes.get("coachfi-srs"),secondCard={...card()};tree=settle();reveal();const third=bytes.get("coachfi-srs"),thirdCard={...card()};tree=settle();button(tree,COPY.pl.finish).props.onClick!();tree=settle();
    observation("duplicate-reveal",{first:firstCard,second:secondCard,third:thirdCard,SRSwriteAttempts:writes.filter(w=>w.key==="coachfi-srs").length,activityCalls:fixture.markActive.mock.calls.length,resultSummary:text(tree),tokens:bytes.get("coachfi-tokens")});
    expect(second,"Second eligible same callback must not save another SRS answer").toBe(first);expect(third,"Old callback after rerender must remain consumed").toBe(first);expect(fixture.markActive).toHaveBeenCalledTimes(1);
  });
  it("eligible old reveal is ignored after PL-to-EN reset of selection and current view",()=>{
    let tree=answer(settle(),"B");const eligible=button(tree,COPY.pl.check);expect(eligible.props.disabled).toBe(false);const oldReveal=eligible.props.onClick!;fixture.locale="en";tree=settle();expect(button(tree,COPY.en.check).props.disabled).toBe(true);const before=new Map(bytes),written=writes.length;fixture.setState.mockClear();oldReveal();tree=settle();
    observation("stale-locale-reveal",{SRS:card(),newWrites:writes.length-written,stateUpdates:fixture.setState.mock.calls.length,activityCalls:fixture.markActive.mock.calls.length,englishViewText:text(tree),tokens:bytes.get("coachfi-tokens")});
    expect(bytes,"Old locale callback must not mutate personal data").toEqual(before);expect(writes).toHaveLength(written);expect(fixture.setState).not.toHaveBeenCalled();expect(fixture.markActive).not.toHaveBeenCalled();
  });
  it.each(["throw","write-then-throw"] as const)("%s SRS writer failure is contained and surfaced as a controlled alert without a false saved result",mode=>{
    let tree=answer(settle(),"B");const reveal=button(tree,COPY.pl.check);expect(reveal.props.disabled).toBe(false);const before=card();fixture.failure=mode;let uncaught:unknown;try{reveal.props.onClick!();}catch(error){uncaught=error;}tree=settle();
    observation("writer-"+mode,{uncaught:uncaught instanceof Error?uncaught.message:String(uncaught),before,SRS:card(),alerts:nodes(tree).filter(node=>node.props.role==="alert").map(text),stillCheckButton:nodes(tree).some(node=>node.props.onClick&&text(node)===COPY.pl.check),activityCalls:fixture.markActive.mock.calls.length,tokens:bytes.get("coachfi-tokens")});
    expect(uncaught,"ReviewPage must contain persistence failures").toBeUndefined();expect(nodes(tree).filter(node=>node.props.role==="alert")).toHaveLength(1);expect(fixture.markActive).not.toHaveBeenCalled();expect(bytes.get("coachfi-tokens")).toBe("125");
  });
});


describe("C18 actual acknowledged review schedule baseline",()=>{
  it("acknowledged next-review label represents the saved date or equivalent actual interval, not a second SM2 calculation",()=>{
    let tree=answer(settle(),"B");button(tree,COPY.pl.check).props.onClick!();tree=settle();
    const saved={...card()},labelNode=nodes(tree).find(node=>node.type==="p"&&text(node).startsWith("Następna powtórka:"));expect(labelNode).toBeDefined();
    const shown=text(labelNode).replace(/\s+/g," ").trim();
    const days=Math.round((Date.parse(saved.nextReview+"T00:00:00.000Z")-Date.parse("2026-01-01T00:00:00.000Z"))/86400000);
    const equivalentInterval=new RegExp("(?:^|\\s)"+days+"\\s+dni(?:$|\\s)").test(shown);
    const acknowledged=shown.includes(saved.nextReview)||equivalentInterval;
    observation("acknowledged-schedule-label",{savedCard:saved,renderedLabel:shown,expectedDate:saved.nextReview,equivalentDays:days,representsAcknowledgedSchedule:acknowledged});
    expect(acknowledged,"Next review must match the already-persisted date or equivalent interval; formatting as a date is allowed").toBe(true);
  });
});


// Independent post-fix acceptance; the ten pre-edit case bodies above are unchanged.
const SAVE_COPY={pl:{read:"Nie udało się odczytać danych powtórek. Nie zmieniono zapisanych danych. Spróbuj ponownie.",retry:"Spróbuj ponownie",retryable:"Odpowiedź nie została zapisana. Sprawdź dostęp do danych i spróbuj ponownie.",uncertain:"Nie udało się potwierdzić zapisu odpowiedzi. Ta sesja jest zablokowana, aby nie powtórzyć zapisu. Odśwież stronę i ponownie odczytaj dane lokalne."},en:{read:"Review data could not be read. Saved data was not changed. Try again.",retry:"Try again",retryable:"The answer was not saved. Check data access and try again.",uncertain:"The answer save could not be confirmed. This session is blocked to avoid repeating the write. Reload the page to read local data again."}};
function identified(tree:unknown,id:string){return nodes(tree).filter(node=>(node.props as Props & {"data-testid"?:string})["data-testid"]===id);}
function oneIdentified(tree:unknown,id:string){const found=identified(tree,id);expect(found).toHaveLength(1);return found[0];}
function noPublishedAnswer(tree:unknown){expect(identified(tree,"review-saved-date")).toHaveLength(0);expect(identified(tree,"review-next")).toHaveLength(0);expect(nodes(tree).some(node=>node.props.title===COPY[fixture.locale as "pl"|"en"].complete)).toBe(false);}
function srsWrites(){return writes.filter(write=>write.key==="coachfi-srs");}

describe("C18 independent actual ReviewPage save acceptance",()=>{
  it.each(["pl","en"] as const)("%s initial malformed bytes remain unchanged through explicit read-only retry",locale=>{
    fixture.locale=locale;const raw='{"unexpected":"not an SRS array"}';bytes.set("coachfi-srs",raw);let tree=settle();
    expect(text(oneIdentified(tree,"review-load-alert"))).toBe(SAVE_COPY[locale].read);expect(identified(tree,"review-card")).toHaveLength(0);expect(writes).toEqual([]);noPublishedAnswer(tree);
    button(tree,SAVE_COPY[locale].retry).props.onClick!();tree=settle();expect(text(oneIdentified(tree,"review-load-alert"))).toBe(SAVE_COPY[locale].read);expect(bytes.get("coachfi-srs")).toBe(raw);expect(writes).toEqual([]);expect(bytes.get("coachfi-tokens")).toBe("125");expect(fixture.markActive).not.toHaveBeenCalled();
  });
  it.each(["pl","en"] as const)("%s denied initial read can be checked again without a write or invented empty deck",locale=>{
    fixture.locale=locale;const original=fixture.storage,raw=bytes.get("coachfi-srs");let denied=true,reads=0;
    fixture.storage=Object.freeze({...original,getItem:(key:string)=>{if(key==="coachfi-srs"){reads++;if(denied)throw Error("FIXTURE initial read denied");}return original.getItem(key);}});let tree=settle();
    expect(reads).toBeGreaterThan(0);expect(text(oneIdentified(tree,"review-load-alert"))).toBe(SAVE_COPY[locale].read);expect(identified(tree,"review-card")).toHaveLength(0);expect(writes).toEqual([]);expect(bytes.get("coachfi-srs")).toBe(raw);
    denied=false;button(tree,SAVE_COPY[locale].retry).props.onClick!();tree=settle();expect(identified(tree,"review-load-alert")).toHaveLength(0);expect(identified(tree,"review-question")).toHaveLength(1);expect(oneIdentified(tree,"review-check").props.disabled).toBe(true);expect(writes).toEqual([]);expect(bytes.get("coachfi-srs")).toBe(raw);noPublishedAnswer(tree);
  });
  it.each(["pl","en"] as const)("%s read failure before writer leaves eligible explicit retry and publishes only the later ACK",locale=>{
    fixture.locale=locale;const original=fixture.storage;let denied=false,reads=0;fixture.storage=Object.freeze({...original,getItem:(key:string)=>{if(key==="coachfi-srs"){reads++;if(denied)throw Error("FIXTURE prewrite read denied");}return original.getItem(key);}});
    let tree=answer(settle(),"B");const eligible=oneIdentified(tree,"review-check");expect(eligible.props.disabled).toBe(false);const oldReveal=eligible.props.onClick!,raw=bytes.get("coachfi-srs"),beforeReads=reads;denied=true;oldReveal();tree=settle();
    expect(reads).toBeGreaterThan(beforeReads);expect(text(oneIdentified(tree,"review-save-alert"))).toBe(SAVE_COPY[locale].retryable);expect(oneIdentified(tree,"review-check").props.disabled).toBe(false);expect(bytes.get("coachfi-srs")).toBe(raw);expect(srsWrites()).toEqual([]);expect(fixture.markActive).not.toHaveBeenCalled();noPublishedAnswer(tree);
    denied=false;oneIdentified(tree,"review-check").props.onClick!();tree=settle();expect(text(oneIdentified(tree,"review-saved-date"))).toContain("2026-01-07");expect(identified(tree,"review-save-alert")).toHaveLength(0);expect(card()).toMatchObject({repetitions:2,interval:6});expect(srsWrites()).toHaveLength(1);expect(fixture.markActive).toHaveBeenCalledTimes(1);const saved=bytes.get("coachfi-srs");oldReveal();tree=settle();expect(bytes.get("coachfi-srs")).toBe(saved);expect(srsWrites()).toHaveLength(1);expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it.each(["pl","en"] as const)("%s partial writer quarantines all actions through locale and same-owner remount without publishing ACK",locale=>{
    fixture.locale=locale;let tree=answer(settle(),"B");const staleAnswer=oneIdentified(tree,"review-answer-A").props.onClick!,eligible=oneIdentified(tree,"review-check");expect(eligible.props.disabled).toBe(false);const reveal=eligible.props.onClick!;fixture.failure="write-then-throw";reveal();tree=settle();
    expect(card()).toMatchObject({repetitions:2,nextReview:"2026-01-07"});expect(text(oneIdentified(tree,"review-save-alert"))).toBe(SAVE_COPY[locale].uncertain);expect(identified(tree,"review-card")).toHaveLength(0);noPublishedAnswer(tree);expect(srsWrites()).toHaveLength(1);expect(fixture.markActive).not.toHaveBeenCalled();const saved=bytes.get("coachfi-srs"),count=writes.length;
    fixture.failure="none";reveal();staleAnswer();tree=settle();fixture.locale=locale==="pl"?"en":"pl";tree=settle();expect(text(oneIdentified(tree,"review-save-alert"))).toBe(SAVE_COPY[fixture.locale as "pl"|"en"].uncertain);expect(identified(tree,"review-check")).toHaveLength(0);expect(identified(tree,"review-next")).toHaveLength(0);expect(writes).toHaveLength(count);expect(bytes.get("coachfi-srs")).toBe(saved);
    resetHooks();tree=settle();expect(text(oneIdentified(tree,"review-save-alert"))).toBe(SAVE_COPY[fixture.locale as "pl"|"en"].uncertain);expect(identified(tree,"review-card")).toHaveLength(0);expect(bytes.get("coachfi-srs")).toBe(saved);expect(writes).toHaveLength(count);expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it.each(["pl","en"] as const)("%s late activity exception leaves a saved SRS card but no acknowledged success or replay",locale=>{
    fixture.locale=locale;fixture.markActive.mockImplementationOnce(()=>{throw Error("FIXTURE activity failed after SRS");});let tree=answer(settle(),"B");const eligible=oneIdentified(tree,"review-check");expect(eligible.props.disabled).toBe(false);const reveal=eligible.props.onClick!;expect(()=>reveal()).not.toThrow();tree=settle();
    expect(card()).toMatchObject({repetitions:2,nextReview:"2026-01-07"});expect(text(oneIdentified(tree,"review-save-alert"))).toBe(SAVE_COPY[locale].uncertain);noPublishedAnswer(tree);expect(fixture.markActive).toHaveBeenCalledTimes(1);expect(srsWrites()).toHaveLength(1);const saved=bytes.get("coachfi-srs");reveal();tree=settle();expect(bytes.get("coachfi-srs")).toBe(saved);expect(srsWrites()).toHaveLength(1);expect(fixture.markActive).toHaveBeenCalledTimes(1);expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it("eligible old-owner handlers are inert while a real new-owner callback remains eligible",async()=>{
    let tree=answer(settle(),"B");const reveal=oneIdentified(tree,"review-check");expect(reveal.props.disabled).toBe(false);const oldReveal=reveal.props.onClick!,oldAnswer=oneIdentified(tree,"review-answer-A").props.onClick!;const {beginStorageOwner,captureCurrentPersonalStorage}=await import("@/lib/product-storage");beginStorageOwner({kind:"guest"}).publishReady();fixture.storage=captureCurrentPersonalStorage();tree=settle();const before=new Map(bytes),written=writes.length;fixture.setState.mockClear();oldReveal();oldAnswer();expect(bytes).toEqual(before);expect(writes).toHaveLength(written);expect(fixture.setState).not.toHaveBeenCalled();expect(fixture.markActive).not.toHaveBeenCalled();
    tree=answer(tree,"B");expect(oneIdentified(tree,"review-check").props.disabled).toBe(false);oneIdentified(tree,"review-check").props.onClick!();tree=settle();expect(text(oneIdentified(tree,"review-saved-date"))).toContain("2026-01-07");expect(srsWrites()).toHaveLength(1);
  });
  it("cleanup retires eligible callbacks and permits only a fresh mounted view to save",()=>{
    let tree=answer(settle(),"B");const eligible=oneIdentified(tree,"review-check");expect(eligible.props.disabled).toBe(false);const oldReveal=eligible.props.onClick!,oldAnswer=oneIdentified(tree,"review-answer-A").props.onClick!;resetHooks();const before=new Map(bytes);fixture.setState.mockClear();oldReveal();oldAnswer();expect(bytes).toEqual(before);expect(writes).toEqual([]);expect(fixture.setState).not.toHaveBeenCalled();tree=answer(settle(),"B");oneIdentified(tree,"review-check").props.onClick!();tree=settle();expect(text(oneIdentified(tree,"review-saved-date"))).toContain("2026-01-07");expect(srsWrites()).toHaveLength(1);
  });
  it("eligible saved Next cannot finish a locale-reset view",()=>{
    let tree=answer(settle(),"B");oneIdentified(tree,"review-check").props.onClick!();tree=settle();const next=oneIdentified(tree,"review-next").props.onClick!;fixture.locale="en";tree=settle();const before=new Map(bytes),written=writes.length;fixture.setState.mockClear();next();expect(fixture.setState).not.toHaveBeenCalled();tree=settle();expect(bytes).toEqual(before);expect(writes).toHaveLength(written);expect(nodes(tree).some(node=>node.props.title===COPY.en.complete)).toBe(false);expect(fixture.markActive).toHaveBeenCalledTimes(1);
  });
  it("duplicate Next and restart callbacks do not duplicate summary or reopen the consumed card",()=>{
    let tree=answer(settle(),"B");oneIdentified(tree,"review-check").props.onClick!();tree=settle();const next=oneIdentified(tree,"review-next").props.onClick!;next();next();tree=settle();expect(text(tree)).toContain("1 / 1");expect(text(tree)).not.toContain("2 / 2");const restart=oneIdentified(tree,"review-restart").props.onClick!,saved=bytes.get("coachfi-srs");fixture.setState.mockClear();restart();restart();expect(fixture.setState).toHaveBeenCalledTimes(1);tree=settle();expect(identified(tree,"review-question")).toHaveLength(0);expect(bytes.get("coachfi-srs")).toBe(saved);expect(srsWrites()).toHaveLength(1);expect(fixture.markActive).toHaveBeenCalledTimes(1);
  });
  it("two due IDs receive distinct ACKs without a stale Next skipping the second question",async()=>{
    const {getQuestionById}=await import("@/lib/allQuestions");const all=JSON.parse(bytes.get("coachfi-srs")!) as Array<import("@/lib/srs").SRSCard>;const second=all.find(c=>c.id!==TARGET)!;second.nextReview="2026-01-01";all.sort((a,b)=>a.id===TARGET?-1:b.id===TARGET?1:0);bytes.set("coachfi-srs",JSON.stringify(all));let tree=answer(settle(),"B");oneIdentified(tree,"review-check").props.onClick!();tree=settle();const firstNext=oneIdentified(tree,"review-next").props.onClick!;firstNext();firstNext();tree=settle();expect(text(oneIdentified(tree,"review-question"))).toBe(getQuestionById(second.id,"pl")!.question);expect(oneIdentified(tree,"review-check").props.disabled).toBe(true);expect(identified(tree,"review-saved-date")).toHaveLength(0);tree=answer(tree,getQuestionById(second.id,"pl")!.correctAnswer);oneIdentified(tree,"review-check").props.onClick!();tree=settle();expect(text(oneIdentified(tree,"review-saved-date"))).toContain("2026-01-07");oneIdentified(tree,"review-next").props.onClick!();tree=settle();expect(text(tree)).toContain("2 / 2");expect(srsWrites()).toHaveLength(2);expect(fixture.markActive).toHaveBeenCalledTimes(2);expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it("reentrant writer callback cannot publish or persist a second answer",()=>{
    const original=fixture.storage;let reenter:(()=>void)|undefined;fixture.storage=Object.freeze({...original,setItem:(key:string,value:string)=>{if(key==="coachfi-srs")reenter?.();return original.setItem(key,value);}});let tree=answer(settle(),"B");const eligible=oneIdentified(tree,"review-check");expect(eligible.props.disabled).toBe(false);reenter=eligible.props.onClick!;eligible.props.onClick!();tree=settle();expect(card()).toMatchObject({repetitions:2,nextReview:"2026-01-07"});expect(srsWrites()).toHaveLength(1);expect(fixture.markActive).toHaveBeenCalledTimes(1);expect(text(oneIdentified(tree,"review-saved-date"))).toContain("2026-01-07");oneIdentified(tree,"review-next").props.onClick!();tree=settle();expect(text(tree)).toContain("1 / 1");
  });
});


describe("C18 stale load-retry admission baseline",()=>{
  it("retained failed-load retry cannot reset a recovered locale-changed view",()=>{
    const original=fixture.storage;let denied=true;fixture.storage=Object.freeze({...original,getItem:(key:string)=>{if(key==="coachfi-srs"&&denied)throw Error("FIXTURE initial load read denied");return original.getItem(key);}});let tree=settle();expect(text(oneIdentified(tree,"review-load-alert"))).toBe(SAVE_COPY.pl.read);const oldRetry=button(tree,SAVE_COPY.pl.retry).props.onClick!;
    denied=false;oldRetry();tree=settle();expect(identified(tree,"review-load-alert")).toHaveLength(0);fixture.locale="en";tree=answer(settle(),"B");expect(oneIdentified(tree,"review-check").props.disabled).toBe(false);const before=new Map(bytes),written=writes.length;fixture.setState.mockClear();oldRetry();const immediateUpdates=fixture.setState.mock.calls.length;tree=settle();
    observation("stale-load-retry",{immediateStateUpdates:immediateUpdates,newWrites:writes.length-written,checkDisabledAfterRetry:oneIdentified(tree,"review-check").props.disabled,locale:fixture.locale});
    expect(immediateUpdates,"Consumed load-retry callback must not reset the recovered view").toBe(0);expect(oneIdentified(tree,"review-check").props.disabled).toBe(false);expect(bytes).toEqual(before);expect(writes).toHaveLength(written);expect(fixture.markActive).not.toHaveBeenCalled();
  });
});
