import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
let api: typeof import("@/lib/learning-progress-read");
let shared: typeof import("@/lib/learningProgress");
interface FixtureState { bytes: Map<string, string>; storage: PersonalStorageHandle; invalidate(): void }
let states: FixtureState[];
const card = (id: string, repetitions = 1) => ({
  id, interval: 131, repetitions, easeFactor: 2.5, nextReview: "2028-02-29", extra: "FIXTURE preserve",
});
function fixture(srsRaw: string | null = null, manualRaw: string | null = null): FixtureState {
  const bytes = new Map<string, string>();
  if (srsRaw !== null) bytes.set("coachfi-srs", srsRaw);
  if (manualRaw !== null) bytes.set("coachfi-learn-manual", manualRaw);
  let current = true;
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 20, area: "local",
    isCurrent: vi.fn(() => current),
    getItem: vi.fn(key => bytes.get(key) ?? null),
    setItem: vi.fn(() => { throw new Error("C20 author forbids writes"); }),
    removeItem: vi.fn(() => { throw new Error("C20 author forbids removal"); }),
    release: vi.fn(() => { throw new Error("C20 author forbids owner release"); }),
  };
  const state = { bytes, storage, invalidate: () => { current = false; } };
  states.push(state);
  return state;
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); states = [];
  vi.stubGlobal("window", {});
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C20 author forbids network"); }));
  api = await import("@/lib/learning-progress-read");
  shared = await import("@/lib/learningProgress");
});
afterEach(() => {
  for (const { storage } of states) {
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.release).not.toHaveBeenCalled();
  }
  expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.persist).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("C20 author actual shared progress on a strict captured snapshot", () => {
  it("absent caches remain healthy empty progress with the existing eight stages", () => {
    const state = fixture(), rows = api.readStageProgress(state.storage);
    expect(rows).toHaveLength(8);
    expect(rows[0]).toEqual({ stageId: "money-mindset", status: "current", progressPct: 0, answeredCount: 0, totalCount: 3 });
    expect(rows.find(row => row.stageId === "saving-habit")).toEqual({ stageId: "saving-habit", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 4 });
    expect(rows.every(row => row.answeredCount === 0 && row.progressPct === 0)).toBe(true);
    expect(state.storage.getItem).toHaveBeenNthCalledWith(1, "coachfi-srs");
    expect(state.storage.getItem).toHaveBeenNthCalledWith(2, "coachfi-learn-manual");
    expect(state.storage.getItem).toHaveBeenCalledTimes(2); expect(state.bytes.size).toBe(0);
  });
  it("retains healthy SRS mastery and manual started/completed semantics without counting unknown history", () => {
    const srs = JSON.stringify([card("net-worth", 2), card("lifestyle-inflation", 0), card("unknown-history", 9)]);
    const manual = '{ "saving-habit": "started", "inflation": "completed", "unknown-stage": "completed" }';
    const state = fixture(srs, manual), rows = api.readStageProgress(state.storage);
    expect(rows.find(row => row.stageId === "money-mindset")).toEqual({ stageId: "money-mindset", status: "inProgress", progressPct: 33, answeredCount: 1, totalCount: 3 });
    expect(rows.find(row => row.stageId === "saving-habit")).toEqual({ stageId: "saving-habit", status: "inProgress", progressPct: 5, answeredCount: 0, totalCount: 4 });
    expect(rows.find(row => row.stageId === "inflation")).toEqual({ stageId: "inflation", status: "completed", progressPct: 100, answeredCount: 0, totalCount: 4 });
    expect(rows.find(row => row.stageId === "credit-rates")?.status).toBe("current");
    expect(rows.reduce((sum, row) => sum + row.answeredCount, 0)).toBe(1);
    expect(state.bytes.get("coachfi-srs")).toBe(srs); expect(state.bytes.get("coachfi-learn-manual")).toBe(manual);
    expect(state.storage.getItem).toHaveBeenCalledTimes(2);
  });
  it("actual complete first-stage cards unlock the following stage; valid unknown own manual keys survive", () => {
    const raw = JSON.stringify([card("net-worth"), card("lifestyle-inflation"), card("pay-yourself-first")]);
    const manual = '{"__proto__":"started","constructor":"completed","future-stage":"started"}';
    const state = fixture(raw, manual), rows = api.readStageProgress(state.storage);
    expect(rows[0]).toMatchObject({ status: "completed", answeredCount: 3, totalCount: 3, progressPct: 100 });
    expect(rows[1]).toMatchObject({ stageId: "saving-habit", status: "current", answeredCount: 0, totalCount: 4 });
    expect(state.bytes.get("coachfi-learn-manual")).toBe(manual);
  });
  it("uses the two captured original RAW values, not fresh live rereads during computation", () => {
    const state = fixture(JSON.stringify([card("net-worth")]), '{"saving-habit":"started"}');
    vi.mocked(state.storage.getItem).mockImplementation(key => {
      const value = state.bytes.get(key) ?? null;
      state.bytes.set(key, "FIXTURE changed externally after this read");
      return value;
    });
    const rows = api.readStageProgress(state.storage);
    expect(rows[0]).toMatchObject({ answeredCount: 1, progressPct: 33 });
    expect(rows[1]).toMatchObject({ status: "inProgress", progressPct: 5 });
    expect(state.storage.getItem).toHaveBeenCalledTimes(2);
    expect([...state.bytes.values()]).toEqual(["FIXTURE changed externally after this read", "FIXTURE changed externally after this read"]);
  });
});

describe("C20 author strict cache reads preserve unavailable bytes", () => {
  it.each(["", "null", "[]", '"started"', '{"money-mindset":"inProgress"}', '{"unknown-stage":true}'])
    ("rejects manual raw %j without fallback or repair", raw => {
      const state = fixture("[]", raw);
      expect(() => api.readStageProgress(state.storage)).toThrow();
      expect(state.bytes.get("coachfi-learn-manual")).toBe(raw); expect(state.bytes.get("coachfi-srs")).toBe("[]");
    });
  it.each(["[malformed", "{}", JSON.stringify([card("duplicate"), card("duplicate")])])
    ("reuses strict Review rejection for SRS %j", raw => {
      const state = fixture(raw, "{}");
      expect(() => api.readStageProgress(state.storage)).toThrow();
      expect(state.bytes.get("coachfi-srs")).toBe(raw); expect(state.bytes.get("coachfi-learn-manual")).toBe("{}");
    });
  it.each(["coachfi-srs", "coachfi-learn-manual"])("read denial for %s never becomes empty progress", key => {
    const state = fixture(JSON.stringify([card("net-worth")]), '{"saving-habit":"started"}'), before = [...state.bytes];
    vi.mocked(state.storage.getItem).mockImplementation(name => { if (name === key) throw new Error("FIXTURE denied"); return state.bytes.get(name) ?? null; });
    expect(() => api.readStageProgress(state.storage)).toThrow(); expect([...state.bytes]).toEqual(before);
  });
  it("rejects a non-string non-null synchronous value instead of coercing it", () => {
    const state = fixture(); vi.mocked(state.storage.getItem).mockReturnValue(undefined as unknown as string);
    expect(() => api.readStageProgress(state.storage)).toThrow();
  });
  it.each(["coachfi-srs", "coachfi-learn-manual"])("observes native rejecting Promise from %s without awaiting", async key => {
    const state = fixture("[]", "{}");
    vi.mocked(state.storage.getItem).mockImplementation(name => name === key ? Promise.reject(new Error("FIXTURE async read")) as unknown as string : state.bytes.get(name) ?? null);
    expect(() => api.readStageProgress(state.storage)).toThrow(); await Promise.resolve();
    expect(state.bytes.get("coachfi-srs")).toBe("[]"); expect(state.bytes.get("coachfi-learn-manual")).toBe("{}");
  });
  it("rejects an arbitrary thenable without running its then method", () => {
    const state = fixture(), then = vi.fn(() => { throw new Error("must not run"); });
    vi.mocked(state.storage.getItem).mockReturnValue({ then } as unknown as string);
    expect(() => api.readStageProgress(state.storage)).toThrow(); expect(then).not.toHaveBeenCalled();
  });
});

describe("C20 author current-owner and delegated read-only boundaries", () => {
  it("SSR rejects before calling either current or storage", () => {
    const state = fixture(); vi.stubGlobal("window", undefined);
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed");
    expect(state.storage.isCurrent).not.toHaveBeenCalled(); expect(state.storage.getItem).not.toHaveBeenCalled();
  });
  it("an initially stale handle rejects before reads", () => {
    const state = fixture(); state.invalidate();
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); expect(state.storage.getItem).not.toHaveBeenCalled();
  });
  it("native rejecting Promise from isCurrent is observed and cannot authorize a read", async () => {
    const state = fixture(); vi.mocked(state.storage.isCurrent).mockImplementation(() => Promise.reject(new Error("FIXTURE async owner")) as unknown as boolean);
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); await Promise.resolve();
    expect(state.storage.getItem).not.toHaveBeenCalled();
  });
  it.each(["coachfi-srs", "coachfi-learn-manual"])("owner loss inside %s read cannot publish rows", key => {
    const state = fixture("[]", "{}"); vi.mocked(state.storage.getItem).mockImplementation(name => {
      const raw = state.bytes.get(name) ?? null; if (name === key) state.invalidate(); return raw;
    });
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed");
  });
  it("a transient fault caught by actual shared getAllCards remains sticky for the outer result", () => {
    const state = fixture(JSON.stringify([card("net-worth")]), "{}"), compute = shared.getAllStageProgress;
    // Contract fault injection only; the actual shared computation and its catch still execute.
    const probe = vi.spyOn(shared, "getAllStageProgress").mockImplementation(snapshot => {
      let checks = 0; vi.mocked(state.storage.isCurrent).mockImplementation(() => ++checks !== 2);
      return compute(snapshot);
    });
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed");
    expect(probe).toHaveBeenCalledTimes(1); expect(state.storage.getItem).toHaveBeenCalledTimes(2);
  });
  it("owner loss after actual shared computation is rejected before returning its rows", () => {
    const state = fixture("[]", "{}"), compute = shared.getAllStageProgress;
    vi.spyOn(shared, "getAllStageProgress").mockImplementation(snapshot => { const rows = compute(snapshot); state.invalidate(); return rows; });
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed");
  });
  it.each(["setItem", "removeItem", "release", "unknown-read"] as const)("snapshot forbids %s without reaching live storage", operation => {
    const state = fixture("[]", "{}"), compute = shared.getAllStageProgress;
    vi.spyOn(shared, "getAllStageProgress").mockImplementation(snapshot => {
      expect(Object.isFrozen(snapshot)).toBe(true);
      try {
        if (operation === "setItem") snapshot!.setItem("coachfi-srs", "[]");
        else if (operation === "removeItem") snapshot!.removeItem("coachfi-srs");
        else if (operation === "release") snapshot!.release();
        else snapshot!.getItem("coachfi-tokens");
      } catch { /* A consumer catch cannot make the failed snapshot healthy again. */ }
      return compute(snapshot);
    });
    expect(() => api.readStageProgress(state.storage)).toThrow(); expect(state.storage.getItem).toHaveBeenCalledTimes(2);
  });
});
