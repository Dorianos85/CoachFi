import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currentSignInProgress, lessonStepCounts, recordLessonStep, subscribeSignInProgress } from "@/lib/signInGate";
import { readLessonStepState, saveLessonStep, LessonStepSaveError } from "@/lib/lesson-step-save";
import type { PersonalStorageHandle } from "@/lib/product-storage";
const KEY = "coachfi-lesson-steps";
const counts = lessonStepCounts();
function fixture() {
  let current = true;
  const bytes = new Map<string, string>();
  vi.stubGlobal("window", { addEventListener: vi.fn(), dispatchEvent: vi.fn() });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 1, area: "local", isCurrent: () => current,
    getItem: vi.fn((key: string) => bytes.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); return true; }),
    removeItem: vi.fn((key: string) => { bytes.delete(key); return true; }), release: vi.fn(() => { current = false; }) };
  return { bytes, storage, invalidate: () => { current = false; } };
}
const cleanup: Array<() => void> = [];
beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { cleanup.splice(0).forEach(f => f()); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function caught(action: () => void, status: "retryable" | "uncertain" | "stopped") {
  let thrown: unknown; try { action(); } catch (error) { thrown = error; }
  expect(thrown).toBeInstanceOf(LessonStepSaveError); expect((thrown as LessonStepSaveError).status).toBe(status);
}
function noWrites(h: ReturnType<typeof fixture>) { expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.storage.removeItem).not.toHaveBeenCalled(); }

describe("B21 strict current-owner lesson-step state", () => {
  it("actual counts contain exactly8 own stages, money-mindset3 and saving4", () => {
    expect(Object.keys(counts)).toHaveLength(8); expect(counts["money-mindset"]).toBe(3); expect(counts["saving-habit"]).toBe(4);
    expect(Object.values(counts).every(v => Number.isSafeInteger(v) && v > 0)).toBe(true);
  });
  it.each([null, "{}", '{"money-mindset":0}', '{"money-mindset":3,"saving-habit":4}', '{ "saving-habit" : 1, "money-mindset" : 0 }'])(
    "valid raw %s is ready, frozen and unchanged", raw => {
      const h = fixture(); if (raw !== null) h.bytes.set(KEY, raw); const state = readLessonStepState(h.storage, counts);
      expect(state).toEqual({ status: "ready", steps: raw === null ? {} : JSON.parse(raw) }); expect(Object.isFrozen(state)).toBe(true);
      if (state.status === "ready") expect(Object.isFrozen(state.steps)).toBe(true); expect(h.bytes.get(KEY) ?? null).toBe(raw); noWrites(h);
    });
  it.each(["", "{", "null", "[]", "[2]", "1", '"text"', '{"unknown-stage":1}', '{"__proto__":1}', '{"constructor":1}',
    '{"toString":1}', '{"money-mindset":-1}', '{"money-mindset":1.5}', '{"money-mindset":4}', '{"saving-habit":"1"}',
    '{"money-mindset":null}', '{"saving-habit":1e309}', '{"saving-habit":9007199254740992}'])(
    "unknown/malformed %s remains unavailable and cannot be overwritten", raw => {
      const h = fixture(); h.bytes.set(KEY, raw); expect(readLessonStepState(h.storage, counts)).toEqual({ status: "unavailable" });
      caught(() => recordLessonStep("saving-habit", 1, h.storage), "retryable"); expect(h.bytes.get(KEY)).toBe(raw); noWrites(h);
    });
  it.each(["stale", "owner-throw", "read-throw", "lost-during-read", "no-browser"])("read boundary %s never writes an empty fallback", mode => {
    const h = fixture(); if (mode === "stale") h.invalidate();
    if (mode === "owner-throw") h.storage.isCurrent = () => { throw new Error("FIXTURE_OWNER"); };
    if (mode === "read-throw") vi.mocked(h.storage.getItem).mockImplementation(() => { throw new Error("FIXTURE_READ"); });
    if (mode === "lost-during-read") vi.mocked(h.storage.getItem).mockImplementation(() => { h.invalidate(); return null; });
    if (mode === "no-browser") vi.stubGlobal("window", undefined);
    expect(readLessonStepState(h.storage, counts)).toEqual({ status: "unavailable" });
    caught(() => recordLessonStep("saving-habit", 1, h.storage), ["stale", "owner-throw", "lost-during-read"].includes(mode) ? "stopped" : "retryable"); noWrites(h);
  });
  it("display currentSignInProgress falls closed for malformed cache without repairing it", () => {
    const h = fixture(); h.bytes.set(KEY, "FIXTURE_UNKNOWN"); expect(currentSignInProgress(h.storage).stepsSeen).toEqual({});
    expect(h.bytes.get(KEY)).toBe("FIXTURE_UNKNOWN"); noWrites(h);
  });
  it.each([{ ...counts, "money-mindset": 4 }, { ...counts, "saving-habit": NaN }, { ...counts, "saving-habit": 1.5 },
    { ...counts, "saving-habit": Infinity }, { ...counts, "saving-habit": 0 }, { ...counts, extra: 1 }])("invalid authority counts %j block read and save", invalid => {
    const h = fixture(), notify = vi.fn(); expect(readLessonStepState(h.storage, invalid)).toEqual({ status: "unavailable" });
    caught(() => saveLessonStep("saving-habit", 1, h.storage, invalid, notify), "retryable"); noWrites(h); expect(notify).not.toHaveBeenCalled();
  });
});

describe("B21 bounded monotonic writer, no recovery or rollback claim", () => {
  it.each(Object.entries(counts))("%s accepts its actuallaststep%s through the real public wrapper", (id, total) => {
    const h = fixture(), listener = vi.fn(); cleanup.push(subscribeSignInProgress(listener));
    expect(recordLessonStep(id, total, h.storage)).toBeUndefined(); expect(JSON.parse(h.bytes.get(KEY)!)).toEqual({ [id]: total });
    expect(listener).toHaveBeenCalledOnce();
  });
  it("valid zero counters and other stages survive an explicit new save without normalization", () => {
    const h = fixture(); h.bytes.set(KEY, '{"money-mindset":0,"saving-habit":1}'); recordLessonStep("saving-habit", 2, h.storage);
    expect(h.bytes.get(KEY)).toBe('{"money-mindset":0,"saving-habit":2}');
  });
  it.each([1, 2])("monotonic step%s no-op keeps raw formatting and sends no notification", step => {
    const h = fixture(), listener = vi.fn(), raw = '{ "saving-habit" : 2, "money-mindset" : 0 }'; h.bytes.set(KEY, raw);
    cleanup.push(subscribeSignInProgress(listener)); expect(recordLessonStep("saving-habit", step, h.storage)).toBeUndefined();
    expect(h.bytes.get(KEY)).toBe(raw); expect(listener).not.toHaveBeenCalled(); noWrites(h);
  });
  it.each([NaN, Infinity, -Infinity, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 5, "1", null])("step %j is rejected before read/write/notification", step => {
    const h = fixture(), listener = vi.fn(); cleanup.push(subscribeSignInProgress(listener));
    caught(() => recordLessonStep("saving-habit", step as number, h.storage), "retryable"); expect(h.storage.getItem).not.toHaveBeenCalled(); noWrites(h); expect(listener).not.toHaveBeenCalled();
  });
  it.each(["unknown-stage", "__proto__", "constructor", "toString", "", "saving-habit\n", null])("unknown stage %j cannot create a counter", id => {
    const h = fixture(); caught(() => recordLessonStep(id as string, 1, h.storage), "retryable"); expect(h.storage.getItem).not.toHaveBeenCalled(); noWrites(h);
  });
  it("a read denial before writer preserves existing raw data and can recover with a later explicit call", () => {
    const h = fixture(), raw = '{"money-mindset":2}'; h.bytes.set(KEY, raw);
    vi.mocked(h.storage.getItem).mockImplementationOnce(() => { throw new Error("FIXTURE_READ"); });
    caught(() => recordLessonStep("saving-habit", 1, h.storage), "retryable"); expect(h.bytes.get(KEY)).toBe(raw); noWrites(h);
    recordLessonStep("saving-habit", 1, h.storage); expect(h.bytes.get(KEY)).toBe('{"money-mindset":2,"saving-habit":1}');
  });
  it.each(["false", "throw", "write-then-throw", "lying", "wrong-bytes"])("setter %s is uncertain, never false confirmed success", mode => {
    const h = fixture(), listener = vi.fn(); cleanup.push(subscribeSignInProgress(listener));
    vi.mocked(h.storage.setItem).mockImplementation((key, value) => {
      if (mode === "false") return false; if (mode === "lying") return true;
      if (mode === "wrong-bytes") { h.bytes.set(key, '{"saving-habit":0}'); return true; }
      if (mode === "write-then-throw") h.bytes.set(key, value); throw new Error("FIXTURE_WRITE");
    });
    caught(() => recordLessonStep("saving-habit", 1, h.storage), "uncertain"); expect(listener).not.toHaveBeenCalled(); expect(h.storage.setItem).toHaveBeenCalledOnce();
    expect(h.bytes.get(KEY) ?? null).toBe(mode === "write-then-throw" ? '{"saving-habit":1}' : mode === "wrong-bytes" ? '{"saving-habit":0}' : null);
  });
  it("notify failure reports uncertain after real bytes remain persisted", () => {
    const h = fixture(); cleanup.push(subscribeSignInProgress(() => { throw new Error("FIXTURE_NOTIFY"); }));
    caught(() => recordLessonStep("saving-habit", 1, h.storage), "uncertain"); expect(h.bytes.get(KEY)).toBe('{"saving-habit":1}');
  });
  it.each(["remove", "malform", "advance"])("notification %s changes are preserved but cannot become false outer success", mode => {
    const h = fixture(); const notify = () => { if (mode === "remove") h.bytes.delete(KEY); if (mode === "malform") h.bytes.set(KEY, "FIXTURE_BAD"); if (mode === "advance") h.bytes.set(KEY, '{"saving-habit":2}'); };
    caught(() => saveLessonStep("saving-habit", 1, h.storage, counts, notify), "uncertain");
    expect(h.bytes.get(KEY) ?? null).toBe(mode === "remove" ? null : mode === "malform" ? "FIXTURE_BAD" : '{"saving-habit":2}');
  });
  it.each(["write-readback", "notify-readback"])("%s failure is uncertain after attempted writer", phase => {
    const h = fixture(); let reads = 0; vi.mocked(h.storage.getItem).mockImplementation(key => {
      if (key === KEY && ++reads === (phase === "write-readback" ? 2 : 3)) throw new Error("FIXTURE_AFTER_WRITE_READ"); return h.bytes.get(key) ?? null;
    });
    caught(() => recordLessonStep("saving-habit", 1, h.storage), "uncertain"); expect(h.bytes.get(KEY)).toBe('{"saving-habit":1}');
  });
  it.each(["initial", "read", "write", "notify"])("owner loss during %s stops all later work", phase => {
    const h = fixture(), notify = vi.fn(); if (phase === "initial") h.invalidate();
    if (phase === "read") vi.mocked(h.storage.getItem).mockImplementation(() => { h.invalidate(); return null; });
    if (phase === "write") vi.mocked(h.storage.setItem).mockImplementation((key, value) => { h.bytes.set(key, value); h.invalidate(); return true; });
    if (phase === "notify") notify.mockImplementation(h.invalidate);
    caught(() => saveLessonStep("saving-habit", 1, h.storage, counts, notify), "stopped"); if (phase !== "notify") expect(notify).not.toHaveBeenCalled();
    if (phase === "initial" || phase === "read") noWrites(h);
  });
  it("current proof before and after synchronous notification prevents stale acknowledgement", () => {
    const h = fixture(), notify = vi.fn(h.invalidate); caught(() => saveLessonStep("money-mindset", 1, h.storage, counts, notify), "stopped");
    expect(h.bytes.get(KEY)).toBe('{"money-mindset":1}'); expect(notify).toHaveBeenCalledOnce();
  });
  it("promise read is retryable with observed rejection and zero mutation", async () => {
    const h = fixture(); vi.mocked(h.storage.getItem).mockReturnValue(Promise.reject(new Error("FIXTURE_ASYNC_READ")) as unknown as string);
    caught(() => recordLessonStep("saving-habit", 1, h.storage), "retryable"); await Promise.resolve(); await Promise.resolve(); noWrites(h);
  });
  it("promise authority is stopped with observed rejection", async () => {
    const h = fixture(); h.storage.isCurrent = () => Promise.reject(new Error("FIXTURE_ASYNC_OWNER")) as unknown as boolean;
    caught(() => recordLessonStep("saving-habit", 1, h.storage), "stopped"); await Promise.resolve(); await Promise.resolve(); noWrites(h);
  });
  it("promise setter is uncertain before notification and without await/replay", async () => {
    const h = fixture(), notify = vi.fn(); vi.mocked(h.storage.setItem).mockReturnValue(Promise.reject(new Error("FIXTURE_ASYNC_WRITE")) as unknown as boolean);
    caught(() => saveLessonStep("saving-habit", 1, h.storage, counts, notify), "uncertain"); await Promise.resolve(); await Promise.resolve(); expect(notify).not.toHaveBeenCalled();
  });
  it("promise notify is uncertain after bytes, without awaited success", async () => {
    const h = fixture(); caught(() => saveLessonStep("saving-habit", 1, h.storage, counts, () => Promise.reject(new Error("FIXTURE_ASYNC_NOTIFY"))), "uncertain");
    await Promise.resolve(); await Promise.resolve(); expect(h.bytes.get(KEY)).toBe('{"saving-habit":1}');
  });
  it("arbitrary notification thenable is not executed", () => {
    const h = fixture(), then = vi.fn(); caught(() => saveLessonStep("saving-habit", 1, h.storage, counts, () => ({ then })), "uncertain"); expect(then).not.toHaveBeenCalled();
  });
  it("no rollback: a new explicit call reads a persisted step after a late failure without replaying notification", () => {
    const h = fixture(), badNotify = vi.fn(() => { throw new Error("FIXTURE_LATE"); });
    caught(() => saveLessonStep("saving-habit", 1, h.storage, counts, badNotify), "uncertain"); const newNotify = vi.fn();
    expect(saveLessonStep("saving-habit", 1, h.storage, counts, newNotify)).toBeUndefined(); expect(newNotify).not.toHaveBeenCalled(); expect(h.bytes.get(KEY)).toBe('{"saving-habit":1}');
  });
});
