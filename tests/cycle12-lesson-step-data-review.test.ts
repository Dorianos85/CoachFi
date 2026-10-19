import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const KEY = "coachfi-lesson-steps";
type SaveModule = typeof import("@/lib/lesson-step-save");
let save: SaveModule, gate: typeof import("@/lib/signInGate");
let counts: Record<string, number>;
let network: ReturnType<typeof vi.fn<typeof fetch>>;
let dispatch: ReturnType<typeof vi.fn>;
type Mode = "false" | "before_throw" | "after_throw" | "after_false";

function fixture(raw: string | null = null) {
  const bytes = new Map<string, string>([["FIXTURE_UNRELATED", "keep exact bytes"]]);
  if (raw !== null) bytes.set(KEY, raw);
  let current = true, readHook: (() => void) | null = null, writeHook: (() => void) | null = null, fault: Mode | null = null;
  const isCurrent = vi.fn(() => current);
  const get = vi.fn((key: string) => { readHook?.(); return bytes.get(key) ?? null; });
  const set = vi.fn((key: string, value: string) => {
    if (!current || fault === "false") return false;
    if (fault === "before_throw") throw new Error("FIXTURE_WRITE_BEFORE");
    bytes.set(key, value); writeHook?.();
    if (fault === "after_throw") throw new Error("FIXTURE_WRITE_AFTER");
    return fault !== "after_false" && current;
  });
  const remove = vi.fn((key: string) => { if (!current) return false; bytes.delete(key); return true; });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 19, area: "local", isCurrent,
    getItem: get, setItem: set, removeItem: remove, release: () => { current = false; } };
  return { bytes, storage, get, set, remove, isCurrent, stop: () => { current = false; },
    onRead: (hook: (() => void) | null) => { readHook = hook; }, onWrite: (hook: (() => void) | null) => { writeHook = hook; },
    fail: (mode: Mode) => { fault = mode; } };
}

function errorStatus(callback: () => void): string | null {
  try { callback(); return null; }
  catch (error) { expect(error).toBeInstanceOf(save.LessonStepSaveError); return (error as InstanceType<SaveModule["LessonStepSaveError"]>).status; }
}
function unchanged(state: ReturnType<typeof fixture>, before: Map<string, string>) {
  expect(state.bytes).toEqual(before); expect(state.set).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); dispatch = vi.fn();
  vi.stubGlobal("window", { dispatchEvent: dispatch, addEventListener: vi.fn(), removeEventListener: vi.fn(), localStorage: {
    getItem: () => { throw new Error("Real unbound storage forbidden in lesson-step review."); },
    setItem: () => { throw new Error("Real unbound storage forbidden in lesson-step review."); },
  } });
  network = vi.fn<typeof fetch>(() => { throw new Error("Real network forbidden in lesson-step review."); }); vi.stubGlobal("fetch", network);
  save = await import("@/lib/lesson-step-save"); gate = await import("@/lib/signInGate"); counts = gate.lessonStepCounts();
});
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C12 independent strict lesson-step read review", () => {
  it.each([
    [null, {}], ["{}", {}], [' { "money-mindset": 0, "saving-habit": 4 }\n', { "money-mindset": 0, "saving-habit": 4 }],
    ['{"money-mindset":3,"saving-habit":1}', { "money-mindset": 3, "saving-habit": 1 }],
  ] as const)("valid cache %s preserves raw and returns frozen semantic data", (raw, expected) => {
    const state = fixture(raw), before = new Map(state.bytes), read = save.readLessonStepState(state.storage, counts);
    expect(read.status).toBe("ready"); expect(Object.isFrozen(read)).toBe(true);
    if (read.status === "ready") { expect(read.steps).toEqual(expected); expect(Object.isFrozen(read.steps)).toBe(true); }
    unchanged(state, before);
  });

  it.each([
    "", "{broken", "null", "[]", "[2]", "true", "0", '"text"',
    '{"future-stage":1}', '{"__proto__":1}', '{"constructor":1}', '{"toString":1}',
    '{"money-mindset":1,"future-field":0}', '{"money-mindset":1,"saving-habit":1.5}',
    '{"money-mindset":-1}', '{"money-mindset":4}', '{"money-mindset":null}',
    '{"money-mindset":"1"}', '{"money-mindset":true}', '{"money-mindset":1e309}', '{"money-mindset":9007199254740992}',
  ])("malformed/unknown cache %s is wholly unavailable, not partially repaired", (raw) => {
    const state = fixture(raw), before = new Map(state.bytes);
    expect(save.readLessonStepState(state.storage, counts).status).toBe("unavailable"); unchanged(state, before);
    expect(errorStatus(() => gate.recordLessonStep("money-mindset", 1, state.storage))).toBe("retryable"); unchanged(state, before);
  });

  it("read-denied raw bytes cannot become empty writable data", () => {
    const state = fixture('{"money-mindset":1}'), before = new Map(state.bytes);
    state.onRead(() => { throw new Error("FIXTURE_READ_DENIED"); });
    expect(save.readLessonStepState(state.storage, counts).status).toBe("unavailable");
    expect(errorStatus(() => gate.recordLessonStep("money-mindset", 2, state.storage))).toBe("retryable"); unchanged(state, before);
  });

  it("unknown current ownership and owner change during get cannot return ready", () => {
    const state = fixture(), before = new Map(state.bytes); state.onRead(state.stop);
    expect(save.readLessonStepState(state.storage, counts).status).toBe("unavailable"); unchanged(state, before);
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_AUTHORITY_UNKNOWN"); });
    expect(save.readLessonStepState(state.storage, counts).status).toBe("unavailable"); unchanged(state, before);
  });

  it("SSR returns unavailable before storage reads", () => {
    const state = fixture(), before = new Map(state.bytes); vi.stubGlobal("window", undefined);
    expect(save.readLessonStepState(state.storage, counts).status).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("invalid count authority is unavailable without reading user bytes", () => {
    const state = fixture(), before = new Map(state.bytes);
    for (const invalid of [{ ...counts, "money-mindset": 4 }, { ...counts, "money-mindset": 0 }, { ...counts, unknown: 1 }, {}]) {
      expect(save.readLessonStepState(state.storage, invalid).status).toBe("unavailable");
      expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, invalid, vi.fn()))).toBe("retryable");
    }
    expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("actual progress projection reads malformed steps conservatively without repair", () => {
    const state = fixture('{"money-mindset":1.5}'), before = new Map(state.bytes);
    expect(gate.currentSignInProgress(state.storage).stepsSeen).toEqual({}); unchanged(state, before);
  });
});

describe("C12 independent owner-bound lesson-step mutation review", () => {
  it("real wrapper preserves zero/other valid stages and notifies after a confirmed monotonic increase", () => {
    const state = fixture('{"saving-habit":4,"money-mindset":0}'), notice = vi.fn(); const unsubscribe = gate.subscribeSignInProgress(notice);
    try {
      expect(gate.recordLessonStep("money-mindset", 1, state.storage)).toBeUndefined();
      expect(JSON.parse(state.bytes.get(KEY)!)).toEqual({ "saving-habit": 4, "money-mindset": 1 }); expect(notice).toHaveBeenCalledOnce();
      expect(state.bytes.get("FIXTURE_UNRELATED")).toBe("keep exact bytes");
      const before = new Map(state.bytes); gate.recordLessonStep("money-mindset", 1, state.storage);
      expect(state.bytes).toEqual(before); expect(state.set).toHaveBeenCalledOnce(); expect(notice).toHaveBeenCalledOnce();
      gate.recordLessonStep("money-mindset", 3, state.storage); expect(JSON.parse(state.bytes.get(KEY)!)["money-mindset"]).toBe(3);
      const final = new Map(state.bytes); gate.recordLessonStep("money-mindset", 2, state.storage); expect(state.bytes).toEqual(final);
      expect(state.set).toHaveBeenCalledTimes(2); expect(notice).toHaveBeenCalledTimes(2);
    } finally { unsubscribe(); }
  });

  it("same or earlier healthy step no-op preserves raw whitespace and fires no notice", () => {
    const state = fixture(' { "money-mindset": 3 }\n'), before = new Map(state.bytes), notify = vi.fn();
    save.saveLessonStep("money-mindset", 2, state.storage, counts, notify); unchanged(state, before); expect(notify).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, 4])(
    "invalid mindset step %s cannot write or notify", (step) => {
      const state = fixture(), before = new Map(state.bytes), notify = vi.fn();
      expect(errorStatus(() => save.saveLessonStep("money-mindset", step, state.storage, counts, notify))).toBe("retryable");
      expect(notify).not.toHaveBeenCalled(); unchanged(state, before);
    });

  it.each(["__proto__", "constructor", "toString", "future-stage", "", "money-mindset "])("unknown stage %s is rejected before read/write", (id) => {
    const state = fixture(), before = new Map(state.bytes), notify = vi.fn();
    expect(errorStatus(() => save.saveLessonStep(id, 1, state.storage, counts, notify))).toBe("retryable");
    expect(state.get).not.toHaveBeenCalled(); expect(notify).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("one denied preflight read is retryable; later explicit healthy call preserves all stages", () => {
    const state = fixture('{"saving-habit":2}'), before = new Map(state.bytes), notify = vi.fn();
    state.onRead(() => { throw new Error("FIXTURE_READ_ONCE"); });
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("retryable"); unchanged(state, before);
    state.onRead(null); save.saveLessonStep("money-mindset", 1, state.storage, counts, notify);
    expect(JSON.parse(state.bytes.get(KEY)!)).toEqual({ "saving-habit": 2, "money-mindset": 1 }); expect(notify).toHaveBeenCalledOnce();
  });

  it.each(["false", "before_throw", "after_throw", "after_false"] as const)("writer %s is uncertain after a mutation method attempt", (mode) => {
    const state = fixture(), notify = vi.fn(); state.fail(mode);
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("uncertain");
    expect(state.bytes.has(KEY)).toBe(mode === "after_throw" || mode === "after_false"); expect(state.set).toHaveBeenCalledOnce();
    expect(notify).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  });

  it("lying setter true cannot publish success or call notification", () => {
    const state = fixture(), notify = vi.fn(); state.set.mockImplementation(() => true);
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("uncertain");
    expect(state.bytes.has(KEY)).toBe(false); expect(notify).not.toHaveBeenCalled(); expect(state.set).toHaveBeenCalledOnce();
  });

  it("readback denial after write is uncertain, leaves bytes untouched and does not notify", () => {
    const state = fixture(), notify = vi.fn(); let written = false; state.onWrite(() => { written = true; });
    state.onRead(() => { if (written) throw new Error("FIXTURE_READBACK_DENIED"); });
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("uncertain");
    expect(state.bytes.get(KEY)).toBe('{"money-mindset":1}'); expect(notify).not.toHaveBeenCalled(); expect(state.set).toHaveBeenCalledOnce();
  });

  it("post-write notification exception and later changed-cache events are uncertain, not rollback", () => {
    const state = fixture(), notify = vi.fn(() => { throw new Error("FIXTURE_NOTIFY_AFTER_WRITE"); });
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("uncertain");
    expect(state.bytes.get(KEY)).toBe('{"money-mindset":1}'); expect(notify).toHaveBeenCalledOnce(); expect(state.set).toHaveBeenCalledOnce();
    const other = fixture(), alter = vi.fn(() => { other.bytes.set(KEY, '{"money-mindset":2}'); });
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, other.storage, counts, alter))).toBe("uncertain");
    expect(other.bytes.get(KEY)).toBe('{"money-mindset":2}'); expect(other.set).toHaveBeenCalledOnce();
  });

  it.each(["read", "write", "notify"] as const)("owner lost during %s stops captured operation", (where) => {
    const state = fixture(), notify = vi.fn(() => { if (where === "notify") state.stop(); });
    if (where === "read") state.onRead(state.stop); if (where === "write") state.onWrite(state.stop);
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("stopped");
    expect(state.set).toHaveBeenCalledTimes(where === "read" ? 0 : 1);
    expect(notify).toHaveBeenCalledTimes(where === "notify" ? 1 : 0); if (where !== "read") expect(state.bytes.get(KEY)).toBe('{"money-mindset":1}');
  });

  it("stale/unknown current authority stops before any reads or side effects", () => {
    const state = fixture(), before = new Map(state.bytes), notify = vi.fn(); state.stop();
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("stopped");
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_UNKNOWN_AUTHORITY"); });
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("stopped");
    expect(state.get).not.toHaveBeenCalled(); expect(notify).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("SSR save is retryable with no actual writes", () => {
    const state = fixture(), before = new Map(state.bytes), notify = vi.fn(); vi.stubGlobal("window", undefined);
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("retryable");
    expect(notify).not.toHaveBeenCalled(); expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("notify Promise cannot become synchronous success after the step write", () => {
    const state = fixture(), notify = vi.fn(() => Promise.resolve());
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("uncertain");
    expect(state.bytes.get(KEY)).toBe('{"money-mindset":1}'); expect(notify).toHaveBeenCalledOnce();
  });

  it("async writer and async current authority do not pass as truthy successful operations", () => {
    const state = fixture(), notify = vi.fn(), delegate = state.set.getMockImplementation()!;
    state.set.mockImplementation((key, value) => Promise.resolve(delegate(key, value)) as unknown as boolean);
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, state.storage, counts, notify))).toBe("uncertain");
    expect(notify).not.toHaveBeenCalled(); const other = fixture(), before = new Map(other.bytes);
    other.isCurrent.mockImplementation(() => Promise.resolve(true) as unknown as boolean);
    expect(errorStatus(() => save.saveLessonStep("money-mindset", 1, other.storage, counts, notify))).toBe("stopped");
    expect(other.get).not.toHaveBeenCalled(); unchanged(other, before);
  });

  it("real sign-in notification reentry advances data but outer call is uncertain, never a confirmed first-step save", () => {
    const state = fixture(); let entered = false;
    const unsubscribe = gate.subscribeSignInProgress(() => {
      if (!entered) { entered = true; gate.recordLessonStep("money-mindset", 2, state.storage); }
    });
    try {
      expect(errorStatus(() => gate.recordLessonStep("money-mindset", 1, state.storage))).toBe("uncertain");
      expect(state.bytes.get(KEY)).toBe('{"money-mindset":2}'); expect(state.set).toHaveBeenCalledTimes(2);
    } finally { unsubscribe(); }
  });
});
