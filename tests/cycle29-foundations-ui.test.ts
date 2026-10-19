import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0, dirty: false,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(),
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
      const previous = fixture.values.get(index), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(index, next); }];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.markActive }) }));


vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));

const CASES = [
  { id: "c7", index: 6, iso: "2026-01-06T12:00:00.000Z", today: "2026-01-06", correct: "C" },
  { id: "c8", index: 7, iso: "2026-01-07T12:00:00.000Z", today: "2026-01-07", correct: "B" },
  { id: "c9", index: 8, iso: "2026-01-08T12:00:00.000Z", today: "2026-01-08", correct: "C" },
  { id: "c10", index: 9, iso: "2026-01-09T12:00:00.000Z", today: "2026-01-09", correct: "C" },
  { id: "c11", index: 10, iso: "2026-01-10T12:00:00.000Z", today: "2026-01-10", correct: "B" },
  { id: "c12", index: 11, iso: "2026-01-11T12:00:00.000Z", today: "2026-01-11", correct: "C" },
  { id: "c13", index: 12, iso: "2026-01-12T12:00:00.000Z", today: "2026-01-12", correct: "B" },
  { id: "c14", index: 13, iso: "2026-01-13T12:00:00.000Z", today: "2026-01-13", correct: "B" },
] as const;
const ROWS = CASES.flatMap(entry => (["pl", "en"] as const).map(locale => ({ ...entry, locale })));
let fixedTime: string = CASES[0].iso;
function setDay(iso: string) { fixedTime = iso; vi.setSystemTime(new Date(iso)); }
type Props = { children?: unknown; text?: string; disabled?: boolean; role?: string; "data-testid"?: string; onClick?: () => void };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
function one(tree: unknown, id: string) { const found = nodes(tree).filter(n => n.props["data-testid"] === id); expect(found).toHaveLength(1); return found[0]!; }
function answer(tree: unknown, id: string) { const found = nodes(one(tree, "daily-challenge-question")).filter(n => n.key === id && n.props.onClick); expect(found).toHaveLength(1); return found[0]!; }
async function submit(tree: unknown) { const { translations } = await import("@/lib/i18n"); const found = nodes(tree).filter(n => n.props.onClick && text(n) === translations[fixture.locale].challenge.answerButton); expect(found).toHaveLength(1); return found[0]!; }
function questionState(tree: unknown) { const card = one(tree, "daily-challenge-question"), voice = nodes(card).find(n => typeof n.props.text === "string")?.props.text; return { question: text(nodes(card).find(n => n.type === "p")), options: ["A", "B", "C", "D"].map(id => text(answer(tree, id))), voice }; }
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, render: () => ReactElement;
const HISTORY = '[{"id":"poland-compound-gap","interval":6,"nextReview":"2026-02-01","repetitions":1,"easeFactor":2.5}]';
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; }
function settle() { for (let turn = 0; turn < 10; turn++) { fixture.slot = 0; fixture.dirty = false; const tree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && !fixture.effects.length) return tree; } throw Error("FIXTURE did not settle within10renders"); }
function observed(name: string, extra: Record<string, unknown>) { console.log("C29_UI_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, fixedTime: fixedTime, tokens: bytes.get("coachfi-tokens"), marker: bytes.get("coachfi-challenge") ?? null, SRS: bytes.get("coachfi-srs"), steps: bytes.get("coachfi-lesson-steps"), writes: [...writes], activityCalls: fixture.markActive.mock.calls.length, ...extra })); }
async function app() { const { default: ChallengePage } = await import("@/app/challenge/page"); render = ChallengePage; }
function noUnrelatedMutation() { expect(bytes.get("coachfi-srs")).toBe(HISTORY); expect(bytes.get("coachfi-lesson-steps")).toBe('{"retirement":2}'); }
function differentPL(shown: ReturnType<typeof questionState>, pl: import("@/lib/allQuestions").UnifiedQuestion, en: import("@/lib/allQuestions").UnifiedQuestion) { if (fixture.locale === "pl") { expect.soft(shown.question).not.toBe(en.question); expect.soft(pl.explanation).not.toBe(en.explanation); } }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl"; fixedTime = CASES[0].iso; vi.useFakeTimers(); vi.setSystemTime(new Date(fixedTime));
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-srs", HISTORY], ["coachfi-lesson-steps", '{"retirement":2}']]); writes = [];
  const native = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); }, removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); } };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native }; Object.assign(win, { localStorage: native, sessionStorage: native }); vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no external calls"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C29 eight existing daily foundations real rotation and PLEN canonical consumers", () => {
  it("real UTC dates select existing c7-c14 once in bank82 with existing PL copies and unchanged stage/default pools", async () => {
    const { getDailyQuestion, challengeQuestions } = await import("@/data/challengeQuestions"), { getAllQuestionIds, getQuestionById } = await import("@/lib/allQuestions"), { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress"), { getTopicQuestions } = await import("@/lib/quiz-topic"); const before = new Map(bytes), inventory = [];
    expect(challengeQuestions).toHaveLength(20);
    for (const entry of CASES) { setDay(entry.iso); const daily = getDailyQuestion(); expect(daily).toBe(challengeQuestions[entry.index]); expect(daily).toMatchObject({ id: entry.id, correctAnswer: entry.correct, reward: 50 }); expect(Object.values(STAGE_QUESTION_IDS).flat()).not.toContain(entry.id);
      for (const locale of ["pl", "en"] as const) { expect(getAllQuestionIds(locale)).toHaveLength(82); expect(getAllQuestionIds(locale).filter(id => id === entry.id)).toHaveLength(1); expect(getQuestionById(entry.id, locale)).toMatchObject({ id: entry.id, correctAnswer: entry.correct, reward: 50 }); expect(getTopicQuestions(locale).map(q => q.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]); }
      const pl = getQuestionById(entry.id, "pl")!, en = getQuestionById(entry.id, "en")!; expect(pl.question).not.toBe(en.question); expect(pl.explanation).not.toBe(en.explanation); inventory.push({ ...entry, daily, canonicalPL: pl, canonicalEN: en });
    }
    expect(bytes).toEqual(before); expect(writes).toEqual([]); observed("bank-eight-real-rotations", { inventory, bank: 82, challenges: 20, PLAlreadyPresent: true });
  });
  it.each(ROWS)("$id $locale actual wrong A shows canonical rationale and full voice without reward or completion mutation", async entry => {
    setDay(entry.iso); fixture.locale = entry.locale; await app(); let tree = settle(); const { getQuestionById } = await import("@/lib/allQuestions"), { getDailyQuestion, challengeQuestions } = await import("@/data/challengeQuestions"), { translations } = await import("@/lib/i18n"), daily = getDailyQuestion(), canonical = getQuestionById(entry.id, entry.locale)!, english = getQuestionById(entry.id, "en")!, shown = questionState(tree), before = new Map(bytes);
    expect(daily).toBe(challengeQuestions[entry.index]); expect(daily).toMatchObject({ id: entry.id, correctAnswer: entry.correct, reward: 50 }); expect(shown.question).toBe(canonical.question); expect(shown.options).toEqual(canonical.answers.map(a => a.id + a.text)); expect(shown.voice).toBe([canonical.question, ...canonical.answers.map(a => a.id + ". " + a.text)].join(". ")); expect(shown.voice!.length).toBeLessThanOrEqual(500); expect((await submit(tree)).props.disabled).toBe(true); expect(writes).toEqual([]);
    answer(tree, "A").props.onClick!(); tree = settle(); expect((await submit(tree)).props.disabled).toBe(false); (await submit(tree)).props.onClick!(); tree = settle(); const feedbackVoice = nodes(tree).find(n => n.props.text === translations[entry.locale].challenge.wrongBanner + ". " + canonical.explanation)?.props.text;
    expect(text(tree)).toContain(translations[entry.locale].challenge.wrongBanner); expect(text(tree)).toContain(canonical.explanation); expect(feedbackVoice).toBe(translations[entry.locale].challenge.wrongBanner + ". " + canonical.explanation); expect(feedbackVoice!.length).toBeLessThanOrEqual(500); expect(nodes(tree).filter(n => n.props["data-testid"] === "daily-challenge-earned")).toHaveLength(0); expect(text(tree)).not.toContain(translations[entry.locale].challenge.completedTitle); expect(bytes).toEqual(before); expect(writes).toEqual([]); noUnrelatedMutation(); expect(fixture.markActive).not.toHaveBeenCalled(); for (const id of ["A", "B", "C", "D"]) expect(answer(tree, id).props.disabled).toBe(true);
    observed("wrong-" + entry.id + "-" + entry.locale, { entry, dailyId: daily.id, canonical, ...shown, feedbackVoice, renderedFeedback: text(tree) }); differentPL(shown, canonical, english);
  });
  it.each(ROWS)("$id $locale actual correct key confirms175 and its UTC date; fresh mount reads completion without replayed50", async entry => {
    setDay(entry.iso); fixture.locale = entry.locale; await app(); let tree = settle(); const { getQuestionById } = await import("@/lib/allQuestions"), { getDailyQuestion, challengeQuestions } = await import("@/data/challengeQuestions"), { translations } = await import("@/lib/i18n"), daily = getDailyQuestion(), canonical = getQuestionById(entry.id, entry.locale)!, english = getQuestionById(entry.id, "en")!, shown = questionState(tree);
    expect(daily).toBe(challengeQuestions[entry.index]); expect(daily).toMatchObject({ id: entry.id, correctAnswer: entry.correct, reward: 50 }); expect(shown.question).toBe(canonical.question); expect(shown.options).toEqual(canonical.answers.map(a => a.id + a.text)); expect(shown.voice).toBe([canonical.question, ...canonical.answers.map(a => a.id + ". " + a.text)].join(". ")); expect(shown.voice!.length).toBeLessThanOrEqual(500); expect(writes).toEqual([]);
    answer(tree, entry.correct).props.onClick!(); tree = settle(); const captured = (await submit(tree)).props.onClick!; captured(); tree = settle(); expect(text(tree)).toContain(translations[entry.locale].challenge.completedTitle); expect(text(one(tree, "daily-challenge-earned"))).toContain("+50"); expect(bytes.get("coachfi-tokens")).toBe("175"); expect(JSON.parse(bytes.get("coachfi-challenge")!)).toEqual({ date: entry.today }); expect(writes.map(w => w.key)).toEqual(["coachfi-tokens", "coachfi-challenge"]); expect(fixture.markActive).toHaveBeenCalledTimes(1); expect(nodes(tree).filter(n => n.props["data-testid"] === "daily-challenge-question")).toHaveLength(0); noUnrelatedMutation();
    const saved = new Map(bytes), count = writes.length; captured(); expect(writes).toHaveLength(count); resetHooks(); tree = settle(); expect(text(tree)).toContain(translations[entry.locale].challenge.completedTitle); expect(nodes(tree).filter(n => n.props["data-testid"] === "daily-challenge-earned")).toHaveLength(0); expect(bytes).toEqual(saved); expect(writes).toHaveLength(count); expect(fixture.markActive).toHaveBeenCalledTimes(1);
    observed("correct-" + entry.id + "-" + entry.locale, { entry, dailyId: daily.id, canonical, ...shown, persistedDate: entry.today, freshViewEarnedCard: false }); differentPL(shown, canonical, english);
  });
});
