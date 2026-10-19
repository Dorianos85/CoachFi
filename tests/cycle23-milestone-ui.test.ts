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

// Desired copy is frozen from independently reviewable C23 draft metadata,
// not derived from the current product. It intentionally fails before content edits.
const EXPECTED = {
  "pl": {
    "id": "emergency-first-milestone",
    "question": "Po zabezpieczeniu podstawowych potrzeb i wymaganych minimalnych spłat zostaje 20 zł nadwyżki. Który mały pierwszy krok jest dobrowolną opcją w tym przykładzie?",
    "answers": [
      {
        "id": "A",
        "text": "Obowiązkowo odłożyć miesiąc kosztów naraz"
      },
      {
        "id": "B",
        "text": "Wybrać np. 5 zł; przy braku nadwyżki zrobić pauzę"
      },
      {
        "id": "C",
        "text": "Pożyczyć 100 zł na założenie rezerwy"
      },
      {
        "id": "D",
        "text": "Przelać cały dochód przed opłaceniem rachunków"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Mały osiągalny cel jest dobrowolny i korzysta z dostępnej nadwyżki. +25 lokalnych punktów.",
    "retryMessage": "Przykładowy budżet: 1 200 zł wpływu − 1 080 zł potrzeb − 100 zł wymaganych minimalnych spłat = 20 zł nadwyżki, bez innych kosztów lub opłat. Dobrowolne 5 zł zostawia 15 zł; przelew nie jest wymagany. Cel dopasuj do sytuacji, bez obowiązkowego miesiąca na start. Przy braku nadwyżki zrób pauzę; nie pożyczaj na oszczędzanie.",
    "category": "Fundusz awaryjny"
  },
  "en": {
    "id": "emergency-first-milestone",
    "question": "After covering essentials and all required minimum repayments, PLN 20 remains. Which small first step is an optional choice in this example?",
    "answers": [
      {
        "id": "A",
        "text": "Save a full month of costs at once as a requirement"
      },
      {
        "id": "B",
        "text": "Choose e.g. PLN 5; pause if there is no surplus"
      },
      {
        "id": "C",
        "text": "Borrow PLN 100 to start a reserve"
      },
      {
        "id": "D",
        "text": "Transfer all income before paying bills"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "A small achievable goal is optional and uses available surplus. +25 local points.",
    "retryMessage": "Example budget: PLN 1,200 income − PLN 1,080 essentials − PLN 100 required minimums = PLN 20 surplus, with no other costs or fees. An optional PLN 5 leaves PLN 15; no transfer is required. Adapt the goal to circumstances without requiring a full month at the start. Without surplus, pause; do not borrow to save.",
    "category": "Emergency Fund"
  }
} as const;
const TARGET = "emergency-first-milestone";
const PLAIN_IDS = ["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"];
type Props = { children?: unknown; text?: string; label?: string; title?: string; disabled?: boolean; "data-testid"?: string; onClick?: () => void };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
function one(tree: unknown, id: string): Node { const found = nodes(tree).filter(n => n.props["data-testid"] === id); expect(found).toHaveLength(1); return found[0]!; }
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, render: () => ReactElement | null;
function resetHooks() { fixture.cleanups.forEach(f => f()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; }
function settle() { for (let turn = 0; turn < 10; turn++) { fixture.slot = 0; fixture.dirty = false; const tree = render(); fixture.effects.splice(0).forEach(f => f()); if (!fixture.dirty && !fixture.effects.length) return tree; } throw Error("FIXTURE did not settle in10 renders"); }
function cards() { return JSON.parse(bytes.get("coachfi-srs")!) as import("@/lib/srs").SRSCard[]; }
const targetCard = () => cards().find(c => c.id === TARGET)!;
function observed(name: string, extra: Record<string, unknown>) { console.log("C23_UI_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, writes: [...writes], rawTokens: bytes.get("coachfi-tokens"), SRS: targetCard(), activityCalls: fixture.markActive.mock.calls.length, ...extra })); }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl"; vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-lesson-steps", '{"emergency-fund":3}']]); writes = [];
  const native = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); }, removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); } };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native }; Object.assign(win, { localStorage: native, sessionStorage: native }); vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no external calls"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const { getAllQuestionIds } = await import("@/lib/allQuestions"); bytes.set("coachfi-srs", JSON.stringify(getAllQuestionIds("en").map(id => ({ id, interval: 6, nextReview: id === TARGET ? "2026-01-01" : "2026-12-01", repetitions: 1, easeFactor: 2.5 }))));
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C23 actual milestone consumers and desired PLEN content baseline", () => {
  it("existing B25 canonical ID stays unique, reviewable and outside every staged/default quiz pool", async () => {
    const { getAllQuestionIds, getQuestionById } = await import("@/lib/allQuestions"), { getDueIds } = await import("@/lib/srs"), { getTopicQuestions } = await import("@/lib/quiz-topic"), { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress");
    const before = new Map(bytes); expect(Object.values(STAGE_QUESTION_IDS).flat()).not.toContain(TARGET);
    for (const locale of ["pl", "en"] as const) {
      expect(getAllQuestionIds(locale)).toHaveLength(82); expect(getAllQuestionIds(locale).filter(id => id === TARGET)).toHaveLength(1); expect(getQuestionById(TARGET, locale)).toMatchObject({ id: TARGET, correctAnswer: "B", reward: 25 }); expect(getDueIds(getAllQuestionIds(locale), fixture.storage)).toEqual([TARGET]);
      expect(getTopicQuestions(locale).map(q => q.id)).toEqual(PLAIN_IDS);
      for (const topic of ["mindset", "saving", "inflation", "credit", "emergency", "investing", "retirement", "family"]) expect(getTopicQuestions(locale, topic).map(q => q.id)).not.toContain(TARGET);
    }
    expect(getQuestionById(TARGET, "pl")!.question).not.toBe(getQuestionById(TARGET, "en")!.question); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    observed("routing-and-bank", { canonicalPL: getQuestionById(TARGET, "pl"), canonicalEN: getQuestionById(TARGET, "en"), globalBank: 82, directReviewReward: 0 });
  });
  it.each(["pl", "en"] as const)("%s correct B review shows desired small-goal copy and persists only the acknowledged schedule", async locale => {
    fixture.locale = locale; const { default: ReviewPage } = await import("@/app/review/page"); render = ReviewPage; let tree = settle();
    const before = new Map(bytes), oldOther = cards().filter(c => c.id !== TARGET), question = text(one(tree, "review-question")), options = ["A", "B", "C", "D"].map(id => text(one(tree, "review-answer-" + id))), questionVoice = nodes(tree).find(n => n.props.label === "Przeczytaj pytanie")?.props.text;
    expect(writes).toEqual([]); expect(one(tree, "review-check").props.disabled).toBe(true); one(tree, "review-answer-B").props.onClick!(); tree = settle(); expect(one(tree, "review-check").props.disabled).toBe(false); one(tree, "review-check").props.onClick!(); tree = settle();
    const explanationVoice = nodes(tree).find(n => n.props.label === "Przeczytaj wyjaśnienie")?.props.text;
    observed("correct-" + locale, { question, options, questionVoice, explanationVoice, feedback: text(tree), metadataReward: 25 });
    expect(text(tree)).toContain(locale === "pl" ? "✓ Dobrze!" : "✓ Correct!"); expect(targetCard()).toMatchObject({ id: TARGET, repetitions: 2, interval: 6, nextReview: "2026-01-07" }); expect(text(one(tree, "review-saved-date"))).toContain("2026-01-07"); expect(cards().filter(c => c.id !== TARGET)).toEqual(oldOther); expect(writes.map(w => w.key)).toEqual(["coachfi-srs"]); expect(bytes.get("coachfi-tokens")).toBe(before.get("coachfi-tokens")); expect(bytes.get("coachfi-lesson-steps")).toBe(before.get("coachfi-lesson-steps")); expect(fixture.markActive).toHaveBeenCalledTimes(1);
    expect.soft(question).toBe(EXPECTED[locale].question); expect.soft(options).toEqual(EXPECTED[locale].answers.map(a => a.id + a.text)); expect.soft(questionVoice).toBe(EXPECTED[locale].question); expect.soft(text(tree)).toContain(EXPECTED[locale].retryMessage); expect.soft(explanationVoice).toBe(EXPECTED[locale].retryMessage);
  });
  it.each(["pl", "en"] as const)("%s wrong A review exposes desired rationale without point award or activity credit", async locale => {
    fixture.locale = locale; const { default: ReviewPage } = await import("@/app/review/page"); render = ReviewPage; let tree = settle(); const before = new Map(bytes), oldOther = cards().filter(c => c.id !== TARGET), question = text(one(tree, "review-question")), options = ["A", "B", "C", "D"].map(id => text(one(tree, "review-answer-" + id)));
    one(tree, "review-answer-A").props.onClick!(); tree = settle(); expect(one(tree, "review-check").props.disabled).toBe(false); one(tree, "review-check").props.onClick!(); tree = settle(); const explanationVoice = nodes(tree).find(n => n.props.label === "Przeczytaj wyjaśnienie")?.props.text;
    observed("wrong-" + locale, { question, options, explanationVoice, feedback: text(tree), metadataReward: 25 });
    expect(text(tree)).toContain(locale === "pl" ? "✗ Jeszcze nie" : "✗ Not quite"); expect(targetCard()).toMatchObject({ id: TARGET, repetitions: 0, interval: 1, nextReview: "2026-01-02" }); expect(cards().filter(c => c.id !== TARGET)).toEqual(oldOther); expect(writes.map(w => w.key)).toEqual(["coachfi-srs"]); expect(bytes.get("coachfi-tokens")).toBe(before.get("coachfi-tokens")); expect(bytes.get("coachfi-lesson-steps")).toBe(before.get("coachfi-lesson-steps")); expect(fixture.markActive).not.toHaveBeenCalled();
    expect.soft(question).toBe(EXPECTED[locale].question); expect.soft(options).toEqual(EXPECTED[locale].answers.map(a => a.id + a.text)); expect.soft(text(tree)).toContain(EXPECTED[locale].retryMessage); expect.soft(explanationVoice).toBe(EXPECTED[locale].retryMessage);
  });
  it.each(["pl", "en"] as const)("%s actual QuizCard start-ID cannot inject milestone outside its real four-question pool", async locale => {
    fixture.locale = locale; vi.spyOn(Math, "random").mockReturnValue(0.5); const { QuizCard } = await import("@/components/QuizCard"), { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById } = await import("@/lib/allQuestions"); const reward = vi.fn(), before = new Map(bytes); render = () => QuizCard({ startQuestionId: TARGET, onReward: reward }); const tree = settle(), shown = nodes(tree).find(n => n.type === "legend"), pool = getTopicQuestions(locale);
    observed("quiz-real-pool-" + locale, { shown: text(shown), pool: pool.map(q => q.id), targetQuestion: getQuestionById(TARGET, locale)!.question });
    expect(pool.map(q => q.id)).toEqual(PLAIN_IDS); expect(pool.some(q => q.question === text(shown))).toBe(true); expect(text(shown)).not.toBe(getQuestionById(TARGET, locale)!.question); expect(nodes(tree).filter(n => n.type === "input")).toHaveLength(4); expect(reward).not.toHaveBeenCalled(); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
});
