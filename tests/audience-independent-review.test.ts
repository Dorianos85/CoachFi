import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";

// Independent actual-provider fixture. Only React scheduling is adapted; the
// ownership leases, captured handles and learning-path implementation are real.
type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
type Segment = "adult" | "family";
type Path = { goal: string | null; lessonRead: boolean; answer: string | null; actionPlanned: boolean };
type Actions = {
  paths: Record<Segment, Path>;
  chooseGoal(segment: Segment, goal: string): void;
  markLessonRead(segment: Segment): void;
  answerQuestion(segment: Segment, answer: string): void;
  markActionPlanned(segment: Segment): void;
};
const fixture = vi.hoisted(() => ({
  frames: new Map<string, Slot[]>(), active: "provider", cursor: 0,
  effects: [] as Array<() => void>,
  deferUpdates: false, deferred: [] as Array<() => void>, deferredChanges: [] as boolean[],
}));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const cell = () => {
    const frame = fixture.frames.get(fixture.active)!;
    const index = fixture.cursor++;
    return frame[index] ?? (frame[index] = {});
  };
  const changed = (old: readonly unknown[] | undefined, next: readonly unknown[] | undefined) =>
    !old || !next || old.length !== next.length || next.some((value, index) => !Object.is(value, old[index]));
  const memo = (create: () => unknown, deps: readonly unknown[]) => {
    const slot = cell();
    if (changed(slot.deps, deps)) { slot.value = create(); slot.deps = deps; }
    return slot.value;
  };
  return { ...actual,
    useState: (initial: unknown) => {
      const slot = cell();
      if (!("value" in slot)) slot.value = typeof initial === "function" ? initial() : initial;
      return [slot.value, (next: unknown) => {
        if (fixture.deferUpdates && typeof next === "function") {
          fixture.deferred.push(() => {
            const previous = slot.value, resolved = next(previous);
            fixture.deferredChanges.push(!Object.is(previous, resolved)); slot.value = resolved;
          });
          return;
        }
        slot.value = typeof next === "function" ? next(slot.value) : next;
      }];
    },
    useReducer: (reducer: (state: unknown, action: unknown) => unknown, initial: unknown, initialize?: (value: unknown) => unknown) => {
      const slot = cell();
      if (!("value" in slot)) slot.value = initialize ? initialize(initial) : initial;
      return [slot.value, (action: unknown) => { slot.value = reducer(slot.value, action); }];
    },
    useMemo: memo,
    useCallback: (callback: unknown, deps: readonly unknown[]) => memo(() => callback, deps),
    useRef: (initial: unknown) => {
      const slot = cell();
      if (!("value" in slot)) slot.value = { current: initial };
      return slot.value;
    },
    useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
      const slot = cell();
      if (changed(slot.deps, deps)) {
        slot.deps = deps;
        fixture.effects.push(() => { slot.cleanup?.(); slot.cleanup = effect() || undefined; });
      }
    },
    useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
  };
});

let store: typeof import("@/lib/product-storage");
let provider: typeof import("@/context/LearningPathsContext");
let io: ReturnType<typeof vi.fn>;
let outbound: ReturnType<typeof vi.fn>;
const EMPTY = { goal: null, lessonRead: false, answer: null, actionPlanned: false };

function render(flushEffects = true): Actions {
  if (!fixture.frames.has(fixture.active)) fixture.frames.set(fixture.active, []);
  fixture.cursor = 0;
  const node = provider.LearningPathsProvider({ children: null }) as ReactElement<{ value: Actions }>;
  if (flushEffects) for (const effect of fixture.effects.splice(0)) effect();
  return node.props.value;
}
function current(): Actions { render(); return render(); }
function ready(userId = "SYNTHETIC_OWNER_A") {
  const lease = store.beginStorageOwner({ kind: "account", provider: "supabase", userId });
  lease.publishReady({ localOnly: true });
  return lease;
}
function complete(segment: Segment, goal = segment === "adult" ? "budget" : "needs") {
  let actions = current(); actions.chooseGoal(segment, goal);
  actions = current(); actions.markLessonRead(segment);
  actions = current(); actions.answerQuestion(segment, "b");
  actions = current(); actions.markActionPlanned(segment);
  return current();
}

beforeEach(async () => {
  vi.resetModules(); fixture.frames.clear(); fixture.effects.length = 0; fixture.active = "provider"; fixture.cursor = 0;
  fixture.deferUpdates = false; fixture.deferred.length = 0; fixture.deferredChanges.length = 0;
  io = vi.fn(() => { throw new Error("This RAM-only fixture forbids physical product storage IO."); });
  const physical = { getItem: io, setItem: io, removeItem: io, clear: io };
  vi.stubGlobal("window", Object.assign(new EventTarget(), { localStorage: physical, sessionStorage: physical }));
  outbound = vi.fn(() => { throw new Error("No network is authorized in this fixture."); });
  vi.stubGlobal("fetch", outbound);
  store = await import("@/lib/product-storage");
  ready();
  provider = await import("@/context/LearningPathsContext");
});
afterEach(() => {
  for (const frame of fixture.frames.values()) for (const slot of frame) slot.cleanup?.();
  expect(io).not.toHaveBeenCalled(); expect(outbound).not.toHaveBeenCalled();
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("independent adult/family RAM path and ownership review", () => {
  it("starts with separate empty adult and family records without reading storage", () => {
    const actions = current();
    expect(actions.paths).toEqual({ adult: EMPTY, family: EMPTY });
    expect(actions.paths.adult).not.toBe(actions.paths.family);
  });

  for (const segment of ["adult", "family"] as const) {
    it(`${segment}: refuses lesson, quiz and action before their required steps`, () => {
      let actions = current();
      actions.markLessonRead(segment); actions.answerQuestion(segment, "b"); actions.markActionPlanned(segment);
      expect(current().paths[segment]).toEqual(EMPTY);
      actions = current(); actions.chooseGoal(segment, segment === "adult" ? "reserve" : "shared-goal");
      actions = current(); actions.answerQuestion(segment, "b"); actions.markActionPlanned(segment);
      expect(current().paths[segment]).toMatchObject({ lessonRead: false, answer: null, actionPlanned: false });
      actions = current(); actions.markLessonRead(segment); actions = current(); actions.markActionPlanned(segment);
      expect(current().paths[segment]).toMatchObject({ lessonRead: true, answer: null, actionPlanned: false });
    });

    it(`${segment}: a wrong quiz answer never permits an action, correction b does`, () => {
      let actions = complete(segment);
      expect(actions.paths[segment].actionPlanned).toBe(true);
      for (const wrong of ["a", "c"]) {
        actions.answerQuestion(segment, wrong); actions = current(); actions.markActionPlanned(segment); actions = current();
        expect(actions.paths[segment]).toMatchObject({ lessonRead: true, answer: wrong, actionPlanned: false });
      }
      actions.answerQuestion(segment, "b"); actions = current(); actions.markActionPlanned(segment);
      expect(current().paths[segment]).toMatchObject({ answer: "b", actionPlanned: true });
    });
  }

  it("completes each path independently and changes a goal without inheriting downstream progress", () => {
    let actions = complete("adult");
    expect(actions.paths.family).toEqual(EMPTY);
    actions = complete("family");
    expect(actions.paths.adult).toEqual({ goal: "budget", lessonRead: true, answer: "b", actionPlanned: true });
    actions.chooseGoal("family", "shared-goal"); actions = current();
    expect(actions.paths.family).toEqual({ ...EMPTY, goal: "shared-goal" });
    expect(actions.paths.adult.actionPlanned).toBe(true);
    actions.chooseGoal("adult", "reserve");
    expect(current().paths.adult).toEqual({ ...EMPTY, goal: "reserve" });
  });

  it("keeps a completed path when reselecting its existing goal", () => {
    const actions = complete("adult"); actions.chooseGoal("adult", "budget");
    expect(current().paths.adult).toEqual({ goal: "budget", lessonRead: true, answer: "b", actionPlanned: true });
  });

  it("rejects malformed, foreign and prototype-shaped segment/goal/answer values", () => {
    let actions = current();
    const malformed = [null, undefined, "", "__proto__", "constructor", [], {}, 0, true];
    for (const value of malformed) {
      actions.chooseGoal("adult", value as string); actions.chooseGoal("family", value as string);
      actions.chooseGoal(value as Segment, "budget"); actions.markLessonRead(value as Segment);
      actions.answerQuestion(value as Segment, "b"); actions.markActionPlanned(value as Segment);
    }
    actions.chooseGoal("adult", "needs"); actions.chooseGoal("family", "reserve");
    expect(current().paths).toEqual({ adult: EMPTY, family: EMPTY });
    actions = complete("adult");
    for (const value of malformed.concat(["d", "B", "<script>", "shared-goal"])) actions.answerQuestion("adult", value as string);
    expect(current().paths.adult).toEqual({ goal: "budget", lessonRead: true, answer: "b", actionPlanned: true });
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
  });

  it("invalidates A callbacks synchronously when B becomes pending, before rendering B", () => {
    const staleA = complete("adult");
    const leaseB = store.beginStorageOwner({ kind: "account", provider: "supabase", userId: "SYNTHETIC_OWNER_B" });
    staleA.chooseGoal("family", "needs"); staleA.markLessonRead("family");
    staleA.answerQuestion("family", "b"); staleA.markActionPlanned("family");
    expect(render(false).paths).toEqual({ adult: EMPTY, family: EMPTY });
    leaseB.publishReady({ localOnly: true });
    expect(current().paths).toEqual({ adult: EMPTY, family: EMPTY });
    staleA.chooseGoal("adult", "reserve"); staleA.answerQuestion("adult", "a");
    expect(current().paths).toEqual({ adult: EMPTY, family: EMPTY });
  });

  it("does not carry B progress back to A or let old B callbacks change A", () => {
    complete("adult"); ready("SYNTHETIC_OWNER_B");
    const staleB = complete("family"); ready("SYNTHETIC_OWNER_A");
    expect(render(false).paths).toEqual({ adult: EMPTY, family: EMPTY });
    staleB.chooseGoal("adult", "reserve"); staleB.markActionPlanned("family");
    expect(current().paths).toEqual({ adult: EMPTY, family: EMPTY });
  });

  it("resets RAM for a fresh lease of the same owner and rejects callbacks from its prior revision", () => {
    const stale = complete("family"); ready();
    expect(render(false).paths).toEqual({ adult: EMPTY, family: EMPTY });
    stale.chooseGoal("family", "shared-goal"); stale.markLessonRead("family");
    expect(current().paths).toEqual({ adult: EMPTY, family: EMPTY });
  });

  it("rejects an updater queued under A when the owner changes before React applies it", () => {
    const actions = complete("adult");
    fixture.deferUpdates = true; actions.answerQuestion("adult", "a");
    expect(fixture.deferred).toHaveLength(1);
    // Do not render/reset the provider before flushing: the updater still sees
    // A's previous state and must recheck the captured handle itself.
    ready("SYNTHETIC_OWNER_B"); fixture.deferUpdates = false;
    for (const update of fixture.deferred.splice(0)) update();
    expect(fixture.deferredChanges).toEqual([false]);
    expect(render(false).paths).toEqual({ adult: EMPTY, family: EMPTY });
  });

  it("keeps RAM-only sessions outside persisted keys and nests their provider in the owner boundary", () => {
    const source = readFileSync(new URL("../app/providers.tsx", import.meta.url), "utf8");
    const boundary = source.indexOf("<ProductScopeBoundary>");
    const providerStart = source.indexOf("<LearningPathsProvider>", boundary);
    const providerEnd = source.indexOf("</LearningPathsProvider>", providerStart);
    const boundaryEnd = source.indexOf("</ProductScopeBoundary>", boundary);
    expect(boundary).toBeGreaterThan(-1); expect(providerStart).toBeGreaterThan(boundary);
    expect(providerEnd).toBeGreaterThan(providerStart); expect(boundaryEnd).toBeGreaterThan(providerEnd);
    expect(store.PERSONAL_STORAGE_KEYS).not.toContain("coachfi-learning-paths");
    expect(store.PERSONAL_STORAGE_KEYS).not.toContain("coachfi-child-profile");
  });
});
