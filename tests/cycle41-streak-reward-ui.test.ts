import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { SRSCard } from "@/lib/srs";
import type { StreakData } from "@/lib/streak";

type Effect = () => void | (() => void);
type Frame = {
  name: string; slot: number; dirty: boolean;
  values: Map<number, unknown>;
  memos: Map<number, { deps?: readonly unknown[]; value: unknown }>;
  effectDeps: Map<number, readonly unknown[] | undefined>;
  layout: Effect[]; effects: Effect[]; cleanups: Map<number, () => void>;
};
const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en", storage: null as unknown as PersonalStorageHandle,
  active: null as unknown as Frame, frames: [] as Frame[],
  contexts: new Map<unknown, unknown>(), updates: vi.fn(),
}));
function frame(name: string): Frame {
  return { name, slot: 0, dirty: false, values: new Map(), memos: new Map(),
    effectDeps: new Map(), layout: [], effects: [], cleanups: new Map() };
}
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const owner = fixture.active, index = owner.slot++, previous = owner.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) owner.memos.set(index, { deps, value: factory() });
  return owner.memos.get(index)?.value;
}
function effect(callback: Effect, deps: readonly unknown[] | undefined, layout: boolean) {
  const owner = fixture.active, index = owner.slot++;
  if (!owner.effectDeps.has(index) || !sameDeps(owner.effectDeps.get(index), deps)) {
    (layout ? owner.layout : owner.effects).push(() => {
      owner.cleanups.get(index)?.(); owner.cleanups.delete(index);
      const cleanup = callback(); if (typeof cleanup === "function") owner.cleanups.set(index, cleanup);
    });
  }
  owner.effectDeps.set(index, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useLayoutEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps, true),
  useEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps, false),
  useContext: (context: unknown) => {
    if (!fixture.contexts.has(context)) throw Error("FIXTURE missing actual provider context");
    return fixture.contexts.get(context);
  },
  useState: (initial: unknown) => {
    const owner = fixture.active, index = owner.slot++;
    if (!owner.values.has(index)) owner.values.set(index, typeof initial === "function" ? initial() : initial);
    return [owner.values.get(index), (value: unknown) => {
      fixture.updates(owner.name);
      const previous = owner.values.get(index), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) owner.dirty = true;
      owner.values.set(index, next);
    }];
  },
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
// External effects only. StreakProvider, useStreak, notifications, streak, SRS,
// tokens, storage handles and both save controllers remain actual modules.
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));

type Props = { children?: unknown; value?: unknown; disabled?: boolean; role?: string;
  title?: string; "data-testid"?: string; onClick?: () => void };
type Node = ReactElement<Props>;
type StreakValue = { streak: StreakData; markActive: () => void };
const TARGET = "insurance-purpose";
const NOW = "2026-01-01T12:00:00.000Z";
const HEALTHY_YESTERDAY = { lastActiveDate: "2025-12-31", currentStreak: 2, longestStreak: 2 };
const HEALTHY_TODAY = { lastActiveDate: "2026-01-01", currentStreak: 3, longestStreak: 3 };
const UNCERTAIN = {
  pl: "Nie udało się potwierdzić zapisu odpowiedzi. Ta sesja jest zablokowana, aby nie powtórzyć zapisu. Odśwież stronę i ponownie odczytaj dane lokalne.",
  en: "The answer save could not be confirmed. This session is blocked to avoid repeating the write. Reload the page to read local data again.",
};
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>;
let streakReads: number, faultArmed: boolean, faultConsumed: number, completedLearningRefresh: boolean, learningDepth: number;
let trace: Array<Record<string, unknown>>;
let provider: (props: { children: null }) => ReactElement, review: () => ReactElement | null;
let supplied: StreakValue;
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node; return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function found(tree: unknown, id: string) { return nodes(tree).filter(node => node.props["data-testid"] === id); }
function one(tree: unknown, id: string) { const matches = found(tree, id); expect(matches).toHaveLength(1); return matches[0]!; }
function resetHooks() {
  for (const owner of fixture.frames) owner.cleanups.forEach(cleanup => cleanup());
  fixture.contexts.clear(); fixture.frames = [frame("StreakProvider"), frame("ReviewPage")];
}
function settle() {
  for (let turn = 0; turn < 12; turn++) {
    for (const owner of fixture.frames) { owner.slot = 0; owner.dirty = false; }
    fixture.active = fixture.frames[0]!;
    const element = provider({ children: null }) as Node;
    // React19 Context.Provider is the context object itself. Feed precisely the
    // value returned by the actual provider, never a fabricated markActive ACK.
    fixture.contexts.set(element.type, element.props.value);
    supplied = element.props.value as StreakValue;
    fixture.active = fixture.frames[1]!;
    const tree = review();
    for (const owner of fixture.frames) owner.layout.splice(0).forEach(callback => callback());
    for (const owner of fixture.frames) owner.effects.splice(0).forEach(callback => callback());
    if (!fixture.frames.some(owner => owner.dirty || owner.layout.length || owner.effects.length)) return tree;
  }
  throw Error("FIXTURE provider/review did not settle within12renders");
}
function cards() { return JSON.parse(bytes.get("coachfi-srs")!) as SRSCard[]; }
function targetCard() { return cards().find(card => card.id === TARGET)!; }
function writesFor(key: string) { return writes.filter(write => write.key === key); }
function observation(mode: string, tree: unknown, extra: Record<string, unknown> = {}) {
  console.log("C41_UI_OBSERVATION " + JSON.stringify({ mode, locale: fixture.locale, target: TARGET,
    storageCurrent: fixture.storage.isCurrent(), streakReads, faultArmed, faultConsumed, completedLearningRefresh, trace: [...trace],
    rawStreak: bytes.get("coachfi-streak"),
    tokens: bytes.get("coachfi-tokens"), targetCard: targetCard(), providerStreak: supplied.streak,
    writes: [...writes], alerts: nodes(tree).filter(node => node.props.role === "alert").map(text),
    savedDate: found(tree, "review-saved-date").map(text), nextControls: found(tree, "review-next").length,
    reviewCard: found(tree, "review-card").length, ...extra }));
}
async function eligible(expectedStreak: StreakData = HEALTHY_YESTERDAY) {
  const { getQuestionById } = await import("@/lib/allQuestions");
  let tree = settle(); const q = getQuestionById(TARGET, fixture.locale)!;
  expect(q.correctAnswer).toBe("B");
  expect(text(one(tree, "review-question"))).toBe(q.question);
  expect(supplied.streak).toEqual(expectedStreak); expect(streakReads).toBeGreaterThan(0);
  expect(writes).toEqual([]);
  one(tree, "review-answer-" + q.correctAnswer).props.onClick!(); tree = settle();
  const check = one(tree, "review-check"); expect(check.props.disabled).toBe(false);
  return check.props.onClick!;
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl";
  vi.useFakeTimers(); vi.setSystemTime(new Date(NOW));
  vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-lesson-steps", '{"retirement":2}'],
    ["coachfi-streak", JSON.stringify(HEALTHY_YESTERDAY)]]);
  writes = []; streakReads = 0; faultArmed = false; faultConsumed = 0;
  completedLearningRefresh = false; learningDepth = 0; trace = [];
  const native = {
    getItem: (key: string) => {
      if (key === "coachfi-streak") {
        streakReads++;
        // Actual SRS dispatch runs the real provider refresh first. Deny only
        // its first subsequent read, once, without mocking activity or receipt.
        const deny = faultArmed && completedLearningRefresh && learningDepth === 0 && faultConsumed === 0;
        trace.push({ kind: "streak-read", ordinal: streakReads, withinLearning: learningDepth > 0, denied: deny });
        if (deny) { faultConsumed++; throw Error("FIXTURE single streak read denied after actual learning refresh"); }
      }
      return bytes.get(key) ?? null;
    },
    setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); },
    removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); },
  };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native };
  // No Notification API or permissions. Actual notification helpers safely do
  // nothing; this fixture neither requests permission nor invokes external SDKs.
  const nativeDispatch = win.dispatchEvent.bind(win);
  Object.assign(win, { localStorage: native, sessionStorage: native,
    dispatchEvent: (event: Event) => {
      trace.push({ kind: "event-start", event: event.type });
      if (event.type === "coachfi-learning") learningDepth++;
      try { return nativeDispatch(event); }
      finally {
        if (event.type === "coachfi-learning") { learningDepth--; completedLearningRefresh = true; }
        trace.push({ kind: "event-end", event: event.type });
      }
    },
  }); vi.stubGlobal("window", win);
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no provider/cloud/network"); }));
  const storage = await import("@/lib/product-storage");
  storage.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = storage.captureCurrentPersonalStorage();
  const { getAllQuestionIds } = await import("@/lib/allQuestions");
  bytes.set("coachfi-srs", JSON.stringify([...getAllQuestionIds("en"), "C41_UNKNOWN_HISTORY"].map(id => ({
    id, interval: 6, repetitions: 1, easeFactor: 2.5, nextReview: id === TARGET ? "2026-01-01" : "2026-12-01",
    fixtureUnknown: { synthetic: "C41", retained: true },
  }))));
  provider = (await import("@/context/StreakContext")).StreakProvider;
  review = (await import("@/app/review/page")).default;
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers();
  vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
});

describe("C41 actual Review plus real StreakProvider one-time milestone admission", () => {
  it.each(["pl", "en"] as const)("%s a single denied activity read after real learning refresh cannot replay an already-counted milestone", async locale => {
    fixture.locale = locale; bytes.set("coachfi-streak", JSON.stringify(HEALTHY_TODAY));
    const reveal = await eligible(HEALTHY_TODAY);
    const raw = bytes.get("coachfi-streak"), unrelated = cards().filter(card => card.id !== TARGET);
    const traceBefore = trace.length, readsBefore = streakReads;
    // Healthy mount and selection already finished. The SRS learning-event
    // refresh itself must still run and read healthy data before this fault.
    completedLearningRefresh = false; faultArmed = true; let uncaught: unknown;
    try { reveal(); } catch (error) { uncaught = error; }
    let tree = settle(); const saved = bytes.get("coachfi-srs"), written = writes.length;
    reveal(); tree = settle(); observation("single-denied-after-learning", tree, {
      uncaught: uncaught instanceof Error ? uncaught.message : String(uncaught), readsBefore, traceBefore,
    });
    expect(uncaught).toBeUndefined(); expect(faultConsumed).toBe(1);
    const relevant = trace.slice(traceBefore), start = relevant.findIndex(e => e.kind === "event-start" && e.event === "coachfi-learning"),
      end = relevant.findIndex(e => e.kind === "event-end" && e.event === "coachfi-learning"),
      denial = relevant.findIndex(e => e.kind === "streak-read" && e.denied === true);
    expect(start).toBeGreaterThanOrEqual(0); expect(end).toBeGreaterThan(start); expect(denial).toBeGreaterThan(end);
    expect(relevant.slice(start + 1, end).some(e => e.kind === "streak-read" && e.withinLearning === true && e.denied === false)).toBe(true);
    expect(relevant.filter(e => e.denied === true)).toHaveLength(1);
    expect(bytes.get("coachfi-streak")).toBe(raw); expect(writesFor("coachfi-streak")).toEqual([]);
    expect(bytes.get("coachfi-tokens")).toBe("125"); expect(writesFor("coachfi-tokens")).toEqual([]);
    expect(targetCard()).toMatchObject({ repetitions: 2, interval: 6, nextReview: "2026-01-07" });
    expect(writesFor("coachfi-srs")).toHaveLength(1); expect(bytes.get("coachfi-srs")).toBe(saved); expect(writes).toHaveLength(written);
    expect(cards().filter(card => card.id !== TARGET)).toEqual(unrelated);
    expect(text(one(tree, "review-save-alert"))).toBe(UNCERTAIN[locale]);
    expect(found(tree, "review-saved-date")).toHaveLength(0); expect(found(tree, "review-next")).toHaveLength(0);
    expect(found(tree, "review-card")).toHaveLength(0); expect(bytes.get("coachfi-lesson-steps")).toBe('{"retirement":2}');
  });

  it.each(["pl", "en"] as const)("%s healthy yesterday two advances to three and grants the actual existing fifteen-point milestone once", async locale => {
    fixture.locale = locale; const reveal = await eligible();
    const unrelated = cards().filter(card => card.id !== TARGET); reveal();
    let tree = settle(); const saved = bytes.get("coachfi-srs"), written = writes.length;
    reveal(); tree = settle(); observation("healthy-milestone", tree);
    expect(faultConsumed).toBe(0);
    expect(JSON.parse(bytes.get("coachfi-streak")!)).toEqual(HEALTHY_TODAY); expect(supplied.streak).toEqual(HEALTHY_TODAY);
    expect(writesFor("coachfi-streak")).toHaveLength(1);
    expect(bytes.get("coachfi-tokens")).toBe("140"); expect(writesFor("coachfi-tokens")).toHaveLength(1);
    expect(targetCard()).toMatchObject({ repetitions: 2, interval: 6, nextReview: "2026-01-07" });
    expect(writesFor("coachfi-srs")).toHaveLength(1); expect(bytes.get("coachfi-srs")).toBe(saved); expect(writes).toHaveLength(written);
    expect(cards().filter(card => card.id !== TARGET)).toEqual(unrelated);
    expect(text(one(tree, "review-saved-date"))).toContain("2026-01-07"); expect(found(tree, "review-next")).toHaveLength(1);
    expect(found(tree, "review-save-alert")).toHaveLength(0); expect(bytes.get("coachfi-lesson-steps")).toBe('{"retirement":2}');
  });

  it.each(["pl", "en"] as const)("%s healthy already-today three acknowledges review without another streak write or token bonus", async locale => {
    fixture.locale = locale; bytes.set("coachfi-streak", JSON.stringify(HEALTHY_TODAY));
    const reveal = await eligible(HEALTHY_TODAY);
    const raw = bytes.get("coachfi-streak"), unrelated = cards().filter(card => card.id !== TARGET); reveal();
    let tree = settle(); const saved = bytes.get("coachfi-srs"), written = writes.length;
    reveal(); tree = settle(); observation("healthy-already-today", tree);
    expect(faultConsumed).toBe(0); expect(bytes.get("coachfi-streak")).toBe(raw); expect(supplied.streak).toEqual(HEALTHY_TODAY);
    expect(writesFor("coachfi-streak")).toEqual([]); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(writesFor("coachfi-tokens")).toEqual([]);
    expect(targetCard()).toMatchObject({ repetitions: 2, interval: 6, nextReview: "2026-01-07" });
    expect(writesFor("coachfi-srs")).toHaveLength(1); expect(bytes.get("coachfi-srs")).toBe(saved); expect(writes).toHaveLength(written);
    expect(cards().filter(card => card.id !== TARGET)).toEqual(unrelated);
    expect(text(one(tree, "review-saved-date"))).toContain("2026-01-07"); expect(found(tree, "review-next")).toHaveLength(1);
    expect(found(tree, "review-save-alert")).toHaveLength(0); expect(bytes.get("coachfi-lesson-steps")).toBe('{"retirement":2}');
  });
});
