import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0, dirty: false,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(), persist: vi.fn(), notify: vi.fn(),
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


vi.mock("@/lib/account-sync", () => ({ persistLearningState: fixture.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));

const ID = "tax-advantaged-wrapper";
const CASES = (["pl", "en"] as const).flatMap(locale => (["B", "A"] as const).map(answer => ({ locale, answer, correct: answer === "B" })));
type Props = { children?: unknown; text?: string; label?: string; disabled?: boolean; "data-testid"?: string; onClick?: () => void };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
function one(tree: unknown, id: string): Node { const found = nodes(tree).filter(node => node.props["data-testid"] === id); expect(found).toHaveLength(1); return found[0]!; }
let bytes: Map<string, string>, session: Map<string, string>;
let trace: Array<{ kind: "read" | "write" | "remove"; area: "local" | "session"; key: string; value?: string }>;
let render: () => ReactElement | null;
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; }
function settle() { for (let turn = 0; turn < 10; turn++) { fixture.slot = 0; fixture.dirty = false; const tree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && !fixture.effects.length) return tree; } throw Error("C54 Review fixture did not settle within ten renders"); }
function cards() { return JSON.parse(bytes.get("coachfi-srs")!) as Array<import("@/lib/srs").SRSCard & { fixtureUnknown: { source: string; retained: boolean } }>; }
const writes = () => trace.filter(item => item.kind !== "read");
function physical(values: Map<string, string>, area: "local" | "session") {
  return { getItem: (key: string) => { trace.push({ kind: "read", area, key }); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => { trace.push({ kind: "write", area, key, value }); values.set(key, value); },
    removeItem: (key: string) => { trace.push({ kind: "remove", area, key }); values.delete(key); } };
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl";
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-lesson-steps", '{"retirement":2}'], ["TEST_C54_UNRELATED", "retained"]]);
  session = new Map([["coachfi-tokens", "321"], ["coachfi-srs", "[]"]]); trace = [];
  const win = new EventTarget() as EventTarget & { localStorage: ReturnType<typeof physical>; sessionStorage: ReturnType<typeof physical> };
  Object.assign(win, { localStorage: physical(bytes, "local"), sessionStorage: physical(session, "session") });
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("No external calls authorized in C54 Review"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const { getAllQuestionIds } = await import("@/lib/allQuestions");
  bytes.set("coachfi-srs", JSON.stringify(getAllQuestionIds("en").map(id => ({ id, interval: 6, nextReview: id === ID ? "2026-01-01" : "2026-12-01",
    repetitions: 1, easeFactor: 2.5, fixtureUnknown: { source: "C54_SYNTHETIC", retained: true } }))));
  render = (await import("@/app/review/page")).default;
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C54 actual Review canonical tax-wrapper content and acknowledged schedules", () => {
  it.each(CASES)("$locale answer $answer preserves real persistence without the metadata token reward", async ({ locale, answer, correct }) => {
    fixture.locale = locale; let tree = settle();
    const { getQuestionById, getAllQuestionIds } = await import("@/lib/allQuestions"), { getDueIds } = await import("@/lib/srs");
    const canonical = getQuestionById(ID, locale)!, english = getQuestionById(ID, "en")!;
    const before = new Map(bytes), beforeSession = new Map(session), otherCardsRaw = JSON.stringify(cards().filter(card => card.id !== ID));
    const shown = { question: text(one(tree, "review-question")), options: ["A", "B", "C", "D"].map(id => text(one(tree, "review-answer-" + id))),
      questionVoice: nodes(tree).find(node => node.props.label === "Przeczytaj pytanie")?.props.text };
    expect(canonical).toMatchObject({ id: ID, correctAnswer: "B", reward: 30 }); expect(getAllQuestionIds(locale)).toHaveLength(82);
    expect(getDueIds(getAllQuestionIds(locale), fixture.storage)).toEqual([ID]);
    expect(shown.question).toBe(canonical.question); expect(shown.options).toEqual(canonical.answers.map(option => option.id + option.text));
    expect(shown.questionVoice).toBe(canonical.question); expect(canonical.question.length).toBeLessThanOrEqual(500);
    expect(one(tree, "review-check").props.disabled).toBe(true); expect(writes()).toEqual([]);
    one(tree, "review-answer-" + answer).props.onClick!(); tree = settle();
    expect(one(tree, "review-check").props.disabled).toBe(false); expect(writes()).toEqual([]);
    one(tree, "review-check").props.onClick!(); tree = settle();
    const date = correct ? "2026-01-07" : "2026-01-02", target = cards().find(card => card.id === ID)!;
    const explanationVoice = nodes(tree).find(node => node.props.label === "Przeczytaj wyjaśnienie")?.props.text;
    const written = writes(), srsWrite = trace.findIndex(item => item.kind === "write" && item.key === "coachfi-srs");
    const confirmedRead = trace.findIndex((item, index) => index > srsWrite && item.kind === "read" && item.key === "coachfi-srs");
    console.log("C54_REVIEW_OBSERVATION " + JSON.stringify({ locale, answer, correct, canonical, shown, explanationVoice, feedback: text(tree),
      target, date, rawOtherCardsBefore: otherCardsRaw, rawOtherCardsAfter: JSON.stringify(cards().filter(card => card.id !== ID)), trace,
      writes: written, srsWrite, confirmedRead, local: [...bytes], session: [...session], activityCalls: fixture.markActive.mock.calls.length,
      cloudCalls: fixture.notify.mock.calls, persistCalls: fixture.persist.mock.calls.map(call => call[0]), metadataReward: 30, directReviewReward: 0,
      limits: "Actual Review/getQuestionById/SRS/Review-save and real product-storage owner handles. C36-derived explicit state/memo/layout/effect emulator; actual React element tree inspected, not ReactDOM/hydration/motion. VoiceButton text props inspected without invoking audio. Language/storage-hook/StreakContext inputs mocked; correct activity callback is observed but no real provider bonus is claimed. Only notify/persist downstream writer bridges mocked; fake UTC clock, separate Map areas, fetch trap." }));
    expect(text(tree)).toContain(correct ? (locale === "pl" ? "✓ Dobrze!" : "✓ Correct!") : (locale === "pl" ? "✗ Jeszcze nie" : "✗ Not quite"));
    expect(text(tree)).toContain(canonical.explanation); expect(explanationVoice).toBe(canonical.explanation); expect(canonical.explanation.length).toBeLessThanOrEqual(500);
    expect(target).toMatchObject({ id: ID, repetitions: correct ? 2 : 0, interval: correct ? 6 : 1, nextReview: date, fixtureUnknown: { source: "C54_SYNTHETIC", retained: true } });
    expect(text(one(tree, "review-saved-date"))).toContain(date); expect(one(tree, "review-answer-" + answer).props.disabled).toBe(true);
    expect(cards()).toHaveLength(82); expect(JSON.stringify(cards().filter(card => card.id !== ID))).toBe(otherCardsRaw);
    expect(written.map(({ kind, area, key }) => ({ kind, area, key }))).toEqual([{ kind: "write", area: "local", key: "coachfi-srs" }]);
    expect(srsWrite).toBeGreaterThanOrEqual(0); expect(confirmedRead).toBeGreaterThan(srsWrite);
    expect([...bytes].filter(([key]) => key !== "coachfi-srs")).toEqual([...before].filter(([key]) => key !== "coachfi-srs"));
    expect(bytes.get("coachfi-tokens")).toBe("125"); expect(bytes.get("coachfi-lesson-steps")).toBe(before.get("coachfi-lesson-steps")); expect(session).toEqual(beforeSession);
    expect(fixture.markActive).toHaveBeenCalledTimes(correct ? 1 : 0); expect(fixture.notify).toHaveBeenCalledExactlyOnceWith("srs");
    expect(fixture.persist).toHaveBeenCalledTimes(1); expect(fixture.persist.mock.calls[0]?.[0]).toBe("srs");
    if (locale === "pl") { expect(shown.question).not.toBe(english.question); expect(explanationVoice).not.toBe(english.explanation); }
  });
});
