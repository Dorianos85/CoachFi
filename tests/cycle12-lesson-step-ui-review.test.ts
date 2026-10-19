import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(), stage: "saving-habit", failLessonWrite: false, denyLessonRead: false,
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

vi.mock("next/navigation", () => ({ useParams: () => ({ stage: fixture.stage }), notFound: () => { throw Error("FIXTURE route not found"); } }));
type Props = { children?: unknown; text?: string; locale?: string; name?: string; value?: string; checked?: boolean; href?: string; role?: string; disabled?: boolean;
  "aria-live"?: string; onChange?: () => void; onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
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
const IDS = ["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"];
const KEYS = ["C", "B", "B", "C"], REWARDS = [25, 25, 20, 30], BALANCES = [150, 175, 195, 225];
let bytes: Map<string, string>, writes: Array<{ key: string; value: string }>, render: () => ReactElement;
let reward = vi.fn<(amount: number) => void>(), complete = vi.fn<(correct: number, total: number) => void>();
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length = 0; fixture.slot = 0; }
function settle() { let tree = render(); for (let i = 0; i < 8 && fixture.effects.length; i++) { fixture.effects.splice(0).forEach(callback => callback()); tree = render(); } expect(fixture.effects).toHaveLength(0); return tree; }
function action(tree: unknown, label: string) { const node = nodes(tree).find(node => node.props.onClick && text(node) === label); expect(node).toBeDefined(); node!.props.onClick!(); return settle(); }
function submitHandler(tree: unknown) { const form = nodes(tree).find(node => node.props.onSubmit); expect(form).toBeDefined(); return form!.props.onSubmit!; }
function submit(tree: unknown, value: string) { const radio = nodes(tree).find(node => node.props.value === value && node.props.onChange); expect(radio).toBeDefined(); radio!.props.onChange!(); tree = settle(); submitHandler(tree)({ preventDefault() {} }); return settle(); }
const feedback = (tree: unknown) => text(nodes(tree).find(node => node.props["aria-live"] === "polite"));
async function useLesson() {
  resetHooks(); const { default: StageLessonPage } = await import("@/app/learn/[stage]/page");
  const body = StageLessonPage() as ReactElement<{ stage: string }>; expect(typeof body.type).toBe("function");
  render = () => { fixture.slot = 0; return (body.type as (props: { stage: string }) => ReactElement)(body.props); };
}
async function useQuiz() { resetHooks(); const { QuizCard } = await import("@/components/QuizCard"); render = () => { fixture.slot = 0; return QuizCard({ topic: "saving", onReward: reward, onComplete: complete }); }; }
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z")); resetHooks(); fixture.locale = "pl"; fixture.stage = "saving-habit"; fixture.failLessonWrite = false; fixture.denyLessonRead = false;
  bytes = new Map([["coachfi-tokens", "125"]]); writes = [];
  const storage = { getItem: (key: string) => { if(key === "coachfi-lesson-steps" && fixture.denyLessonRead) throw Error("FIXTURE lesson read unavailable"); return bytes.get(key) ?? null; }, setItem: (key: string, value: string) => { writes.push({ key, value }); if(key === "coachfi-lesson-steps" && fixture.failLessonWrite) { fixture.failLessonWrite=false; throw Error("FIXTURE refused lesson writer"); } bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  const windowStub = new EventTarget() as EventTarget & { localStorage: typeof storage; sessionStorage: typeof storage };
  Object.assign(windowStub, { localStorage: storage, sessionStorage: storage }); vi.stubGlobal("window", windowStub); vi.stubGlobal("fetch", vi.fn(() => { throw Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const captured = fixture.storage, { addTokens } = await import("@/lib/tokens"); reward = vi.fn(amount => { addTokens(amount, "FIXTURE saving quiz", "FIXTURE reviewer", captured); }); complete = vi.fn(); await useQuiz();
});
afterEach(() => { resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });


type LessonKind = "generic" | "mindset";
async function usePage(kind: LessonKind) {
  if(kind === "generic") return useLesson();
  resetHooks(); const { default: MoneyMindsetLessonPage }=await import("@/app/learn/money-mindset/page");
  render=()=>{fixture.slot=0;return MoneyMindsetLessonPage();};
}
async function lessonCopy(kind: LessonKind) {
  if(kind === "generic") return (await import("@/data/stageLessons")).stageLessons["saving-habit"].copy[fixture.locale]!;
  return (await import("@/data/moneyMindsetLesson")).moneyMindsetLesson[fixture.locale]!;
}
describe("independent B21 actual mindset boundaries",()=>{
 it("captured mindset Next cannot update a newly selected owner",async()=>{
  await usePage("mindset");let tree=settle();const copy=await lessonCopy("mindset"),captured=nodes(tree).find(node=>node.props.onClick&&text(node)===copy.next)!.props.onClick!;
  const store=await import("@/lib/product-storage"),b=store.beginStorageOwner({kind:"account",provider:"cdp",userId:"FIXTURE_B21_B"});b.publishReady({localOnly:true});fixture.storage=store.captureCurrentPersonalStorage();tree=settle();
  const before=new Map(bytes),count=writes.length;fixture.setState.mockClear();captured();settle();expect(bytes).toEqual(before);expect(writes).toHaveLength(count);expect(fixture.setState).not.toHaveBeenCalled();
 });
 it("captured mindset Next invoked twice advances exactly one step",async()=>{
  await usePage("mindset");let tree=settle();const copy=await lessonCopy("mindset"),captured=nodes(tree).find(node=>node.props.onClick&&text(node)===copy.next)!.props.onClick!;
  captured();captured();tree=settle();expect(text(nodes(tree).find(node=>node.type==="h2"))).toBe(copy.steps[1].title);expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["money-mindset"]).toBe(2);
 });
 it("mindset lesson writer refusal is contained and blocks Next",async()=>{
  await usePage("mindset");fixture.failLessonWrite=true;let tree:ReactElement|undefined;expect(()=>{tree=settle();}).not.toThrow();const copy=await lessonCopy("mindset");
  expect(nodes(tree).filter(node=>node.props.role==="alert")).toHaveLength(1);const next=nodes(tree).find(node=>node.props.onClick&&text(node)===copy.next);expect(next).toBeDefined();expect(next!.props.disabled).toBe(true);expect(fixture.storage.getItem("coachfi-lesson-steps")).toBeNull();
 });
});

const VIEW_CASES = (["pl","en"] as const).flatMap(locale=>(["generic","mindset"] as const).map(kind=>({locale,kind})));
const STEP_KEY="coachfi-lesson-steps";
const FAILURE_COPY={pl:"Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne.",en:"The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again."};
function pageStage(kind:LessonKind){return kind==="generic"?"saving-habit":"money-mindset";}
function alertMessage(tree:unknown){return text(nodes(tree).find(node=>node.props.role==="alert"));}
function nextNode(tree:unknown,label:string){const next=nodes(tree).find(node=>node.props.onClick&&text(node)===label);expect(next).toBeDefined();return next!;}
describe("independent B21 both lesson views strict cache and persistence",()=>{
 it.each(VIEW_CASES.flatMap(view=>["{broken",'{"future-course":1}'].map(raw=>({...view,raw}))))("$locale $kind preserves malformed cache $raw without a writer",async({locale,kind,raw})=>{
  fixture.locale=locale;bytes.set(STEP_KEY,raw);await usePage(kind);const tree=settle(),copy=await lessonCopy(kind);expect(alertMessage(tree)).toBe(FAILURE_COPY[locale]);expect(nextNode(tree,copy.next).props.disabled).toBe(true);
  const before=new Map(bytes);nextNode(tree,copy.next).props.onClick!();expect(bytes).toEqual(before);expect(bytes.get(STEP_KEY)).toBe(raw);expect(writes).toHaveLength(0);expect(bytes.get("coachfi-tokens")).toBe("125");
 });
 it.each(VIEW_CASES)("$locale $kind denied read cannot be guessed as empty or write after locale change",async({locale,kind})=>{
  fixture.locale=locale;bytes.set(STEP_KEY,'{"money-mindset":2,"saving-habit":3}');fixture.denyLessonRead=true;await usePage(kind);let tree=settle(),copy=await lessonCopy(kind);expect(alertMessage(tree)).toBe(FAILURE_COPY[locale]);expect(nextNode(tree,copy.next).props.disabled).toBe(true);
  const before=new Map(bytes);fixture.denyLessonRead=false;fixture.locale=locale==="pl"?"en":"pl";tree=settle();copy=await lessonCopy(kind);expect(alertMessage(tree)).toBe(FAILURE_COPY[fixture.locale as "pl"|"en"]);nextNode(tree,copy.next).props.onClick!();expect(bytes).toEqual(before);expect(writes).toHaveLength(0);
 });
 it.each(VIEW_CASES)("$locale $kind attempted writer refusal stays blocked without resetting stored counters",async({locale,kind})=>{
  fixture.locale=locale;await usePage(kind);fixture.failLessonWrite=true;let tree=settle();const copy=await lessonCopy(kind);expect(alertMessage(tree)).toBe(FAILURE_COPY[locale]);expect(nextNode(tree,copy.next).props.disabled).toBe(true);expect(bytes.has(STEP_KEY)).toBe(false);expect(writes.filter(write=>write.key===STEP_KEY)).toHaveLength(1);
  const before=new Map(bytes),count=writes.length;nextNode(tree,copy.next).props.onClick!();tree=settle();expect(bytes).toEqual(before);expect(writes).toHaveLength(count);expect(alertMessage(tree)).toBe(FAILURE_COPY[locale]);
 });
 it.each(VIEW_CASES)("$locale $kind valid preexisting counters never decrease and preserve other lesson",async({locale,kind})=>{
  fixture.locale=locale;const raw='{"money-mindset":2,"saving-habit":3}';bytes.set(STEP_KEY,raw);await usePage(kind);let tree=settle();const copy=await lessonCopy(kind);expect(nodes(tree).filter(node=>node.props.role==="alert")).toHaveLength(0);expect(bytes.get(STEP_KEY)).toBe(raw);expect(writes).toHaveLength(0);
  for(let i=0;i<copy.steps.length-1;i++)tree=action(tree,copy.next);const values=JSON.parse(bytes.get(STEP_KEY)!);expect(values[pageStage(kind)]).toBe(copy.steps.length);expect(values[kind==="generic"?"money-mindset":"saving-habit"]).toBe(kind==="generic"?2:3);expect(writes.filter(write=>write.key===STEP_KEY)).toHaveLength(1);
  expect(nodes(tree).some(node=>node.props.href===(kind==="generic"?"/quiz?topic=saving":"/quiz?topic=mindset"))).toBe(true);expect(bytes.get("coachfi-tokens")).toBe("125");expect(fetch).not.toHaveBeenCalled();
 });
 it.each(VIEW_CASES)("$locale $kind last-step failure removes quiz link while preserving prior valid count",async({locale,kind})=>{
  fixture.locale=locale;await usePage(kind);let tree=settle();const copy=await lessonCopy(kind);for(let i=0;i<copy.steps.length-2;i++)tree=action(tree,copy.next);
  fixture.failLessonWrite=true;tree=action(tree,copy.next);expect(alertMessage(tree)).toBe(FAILURE_COPY[locale]);expect(JSON.parse(bytes.get(STEP_KEY)!)[pageStage(kind)]).toBe(copy.steps.length-1);expect(nodes(tree).some(node=>node.props.href===(kind==="generic"?"/quiz?topic=saving":"/quiz?topic=mindset"))).toBe(false);
  expect(nodes(tree).some(node=>text(node)===copy.quiz&&node.props.disabled===true)).toBe(true);expect(bytes.get("coachfi-tokens")).toBe("125");
 });
 it.each(["pl","en"] as const)("%s mindset writer quarantine is retained after switching language",async locale=>{
  fixture.locale=locale;await usePage("mindset");fixture.failLessonWrite=true;let tree=settle();const captured=nextNode(tree,(await lessonCopy("mindset")).next).props.onClick!;const before=new Map(bytes),count=writes.length;fixture.locale=locale==="pl"?"en":"pl";tree=settle();expect(alertMessage(tree)).toBe(FAILURE_COPY[fixture.locale as "pl"|"en"]);captured();expect(bytes).toEqual(before);expect(writes).toHaveLength(count);
 });
 it("mindset cleanup invalidates old Next without data or state mutation",async()=>{
  await usePage("mindset");const tree=settle(),captured=nextNode(tree,(await lessonCopy("mindset")).next).props.onClick!;fixture.cleanups.forEach(callback=>callback());fixture.cleanups.clear();const before=new Map(bytes),count=writes.length;fixture.setState.mockClear();captured();expect(bytes).toEqual(before);expect(writes).toHaveLength(count);expect(fixture.setState).not.toHaveBeenCalled();
 });
 it("mindset progress notification reentry cannot advance during persistence",async()=>{
  await usePage("mindset");const copy=await lessonCopy("mindset"),original=render;let last:ReactElement|undefined;render=()=>{last=original();return last;};let tree=settle();const {subscribeSignInProgress}=await import("@/lib/signInGate");let calls=0;const unsubscribe=subscribeSignInProgress(()=>{calls++;unsubscribe();nextNode(last,copy.next).props.onClick!();});tree=action(tree,copy.next);expect(calls).toBe(1);expect(text(nodes(tree).find(node=>node.type==="h2"))).toBe(copy.steps[1].title);expect(JSON.parse(bytes.get(STEP_KEY)!)["money-mindset"]).toBe(2);
 });
 it("captured mindset quiz link prevents navigation after owner replacement",async()=>{
  await usePage("mindset");const copy=await lessonCopy("mindset");let tree=settle();for(let i=0;i<copy.steps.length-1;i++)tree=action(tree,copy.next);const link=nodes(tree).find(node=>node.props.href==="/quiz?topic=mindset");expect(link).toBeDefined();
  const store=await import("@/lib/product-storage"),b=store.beginStorageOwner({kind:"account",provider:"cdp",userId:"FIXTURE_B21_B"});b.publishReady({localOnly:true});const before=new Map(bytes),count=writes.length;const preventDefault=vi.fn();(link!.props.onClick as unknown as (event:{preventDefault():void})=>void)({preventDefault});expect(preventDefault).toHaveBeenCalledOnce();expect(bytes).toEqual(before);expect(writes).toHaveLength(count);
 });
});
