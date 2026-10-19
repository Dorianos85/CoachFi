import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { StageProgress } from "@/lib/learningProgress";
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));
const SRS = "coachfi-srs", MANUAL = "coachfi-learn-manual";
const card = (id: string, repetitions = 1) => ({ id, repetitions, interval: 6, easeFactor: 2.5, nextReview: "2026-10-15" });
const historical = { ...card("unknown-retired-id", 3), interval: 131, nextReview: "2032-02-29", extra: { kept: true } };
const healthySRS = JSON.stringify([card("net-worth"), card("lifestyle-inflation", 0), card("inflation-basics"), historical]);
const healthyManual = '{"saving-habit":"started","credit-rates":"completed"}';
const expected: StageProgress[] = [
  { stageId: "money-mindset", status: "inProgress", progressPct: 33, answeredCount: 1, totalCount: 3 },
  { stageId: "saving-habit", status: "inProgress", progressPct: 5, answeredCount: 0, totalCount: 4 },
  { stageId: "inflation", status: "inProgress", progressPct: 25, answeredCount: 1, totalCount: 4 },
  { stageId: "credit-rates", status: "completed", progressPct: 100, answeredCount: 0, totalCount: 4 },
  { stageId: "emergency-fund", status: "current", progressPct: 0, answeredCount: 0, totalCount: 3 },
  { stageId: "long-term-investing", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 5 },
  { stageId: "retirement", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 2 },
  { stageId: "family-plan", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 3 },
];
function ram(srs: string | null = healthySRS, manual: string | null = healthyManual) {
  const bytes = new Map<string, string>(); if (srs !== null) bytes.set(SRS, srs); if (manual !== null) bytes.set(MANUAL, manual);
  const before = [...bytes.entries()], reads: string[] = [], mutations: string[] = [];
  let current = true, currentHook: (() => unknown) | undefined;
  let readHook: ((key: string, value: string | null) => unknown) | undefined;
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 1, area: "local",
    isCurrent: () => (currentHook ? currentHook() : current) as boolean,
    getItem: key => { reads.push(key); const value = bytes.get(key) ?? null; return (readHook ? readHook(key, value) : value) as string | null; },
    setItem: (key, raw) => { mutations.push("set:" + key); bytes.set(key, raw); return true; },
    removeItem: key => { mutations.push("remove:" + key); bytes.delete(key); return true; },
    release: () => { mutations.push("release"); current = false; },
  };
  return {
    storage, reads, mutations, raw: (key: string) => bytes.get(key) ?? null,
    setCurrent: (value: boolean) => { current = value; }, replyCurrent: (callback: typeof currentHook) => { currentHook = callback; },
    readWith: (callback: typeof readHook) => { readHook = callback; }, replaceExternally: (key: string, raw: string) => { bytes.set(key, raw); },
    unchanged: () => { expect([...bytes.entries()]).toEqual(before); expect(mutations).toEqual([]); },
  };
}
let api: typeof import("@/lib/learning-progress-read"), shared: typeof import("@/lib/learningProgress");
beforeEach(async () => {
  vi.resetModules(); shared = await import("@/lib/learningProgress"); api = await import("@/lib/learning-progress-read");
  vi.stubGlobal("window", {}); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network in C20 data review"); }));
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("C20 independent actual progress semantics and snapshot", () => {
  it("returns independently calculated eight stages with unknown historical131 fields and exact raw preserved", () => {
    const state = ram(); expect(api.readStageProgress(state.storage)).toEqual(expected);
    expect(state.reads).toEqual([SRS, MANUAL]); state.unchanged();
  });
  it.each([null, "{}", "  { }\n"])("valid empty manual %o retains true absent progress rather than unavailable", manual => {
    const state = ram(null, manual), result = api.readStageProgress(state.storage);
    expect(result.map(stage => stage.answeredCount)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.map(stage => stage.status)).toEqual(["current", "locked", "locked", "locked", "locked", "locked", "locked", "locked"]);
    expect(result.map(stage => stage.totalCount)).toEqual([3, 4, 4, 4, 3, 5, 2, 3]); state.unchanged();
  });
  it("keeps manual5percent and manual completion distinct from answer counts", () => {
    const state = ram("[]", '{"credit-rates":"started","retirement":"completed"}'), result = api.readStageProgress(state.storage);
    expect(result.find(stage => stage.stageId === "credit-rates")).toEqual({ stageId: "credit-rates", status: "inProgress", progressPct: 5, answeredCount: 0, totalCount: 4 });
    expect(result.find(stage => stage.stageId === "emergency-fund")?.status).toBe("current");
    expect(result.find(stage => stage.stageId === "retirement")).toEqual({ stageId: "retirement", status: "completed", progressPct: 100, answeredCount: 0, totalCount: 2 });
    expect(result.find(stage => stage.stageId === "family-plan")?.status).toBe("current"); state.unchanged();
  });
  it("preserves original rounding67percent and four-of-five completion threshold", () => {
    const ids = ["net-worth", "lifestyle-inflation", "compound-interest", "diversification", "index-fund", "etf-definition"];
    const state = ram(JSON.stringify(ids.map(id => card(id))), null), result = api.readStageProgress(state.storage);
    expect(result.find(stage => stage.stageId === "money-mindset")).toEqual({ stageId: "money-mindset", status: "inProgress", progressPct: 67, answeredCount: 2, totalCount: 3 });
    expect(result.find(stage => stage.stageId === "long-term-investing")).toEqual({ stageId: "long-term-investing", status: "completed", progressPct: 100, answeredCount: 4, totalCount: 5 }); state.unchanged();
  });
  it("unknown manual keys including shadowed method names are legal own string values", () => {
    const manual = ' \n{ "future-stage": "completed", "hasOwnProperty": "started", "__proto__": "started", "toString": "completed" }\t';
    const state = ram(JSON.stringify([historical]), manual), result = api.readStageProgress(state.storage);
    expect(result).toHaveLength(8); expect(result.every(stage => stage.answeredCount === 0)).toBe(true);
    expect(state.raw(MANUAL)).toBe(manual); expect(result[0]?.status).toBe("current"); state.unchanged();
  });
  it("computes from captured raw exactly once even when live caches change externally during capture", () => {
    const state = ram(); state.readWith((key, raw) => {
      if (key === MANUAL) { state.replaceExternally(SRS, "{}"); state.replaceExternally(MANUAL, "{late-external-change"); }
      return raw;
    });
    expect(api.readStageProgress(state.storage)).toEqual(expected); expect(state.reads).toEqual([SRS, MANUAL]);
    expect(state.raw(SRS)).toBe("{}"); expect(state.raw(MANUAL)).toBe("{late-external-change"); expect(state.mutations).toEqual([]);
  });
});

describe("C20 strict manual and reused SRS boundaries never fabricate progress", () => {
  it.each(["", "null", "[]", "true", "25", '"started"', '{"saving-habit":"completed",', '{"saving-habit":"done"}', '{"saving-habit":true}', '{"saving-habit":null}', '{"saving-habit":{"status":"started"}}', '{"future":"completed "}', '{"__proto__":{"polluted":true}}'])("manual raw %o refuses rather than becoming an empty override", manual => {
    const state = ram(healthySRS, manual); expect(() => api.readStageProgress(state.storage)).toThrow(); state.unchanged();
  });
  it.each(["null", "{}", '[{"id":"net-worth"},', '[{"id":"net-worth"}]', JSON.stringify([card("net-worth"), card("net-worth")])])("SRS raw %o reuses strict schema and refuses instead of zero/crash output", srs => {
    const state = ram(srs, healthyManual); expect(() => api.readStageProgress(state.storage)).toThrow(); state.unchanged();
  });
  it.each([SRS, MANUAL])("denied %s live read throws without result or raw mutation", denied => {
    const state = ram(); state.readWith((key, raw) => { if (key === denied) throw new Error("Synthetic denial"); return raw; });
    expect(() => api.readStageProgress(state.storage)).toThrow(); state.unchanged();
  });
  it.each([SRS, MANUAL])("native async %s read is observed and refused without unhandled success", async asynchronousKey => {
    const state = ram(); state.readWith((key, raw) => key === asynchronousKey ? Promise.reject(new Error("Synthetic rejected read")) : raw);
    expect(() => api.readStageProgress(state.storage)).toThrow(); await Promise.resolve(); state.unchanged();
  });
  it.each([SRS, MANUAL])("non-string %s read cannot enter permissive shared JSON coercion", invalidKey => {
    const state = ram(); state.readWith((key, raw) => key === invalidKey ? { toString: () => "{}" } : raw);
    expect(() => api.readStageProgress(state.storage)).toThrow(); state.unchanged();
  });
});

describe("C20 current ownership and read-only snapshot contract probes", () => {
  it("SSR refuses before any actual read", () => {
    const state = ram(); vi.stubGlobal("window", undefined); expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); expect(state.reads).toEqual([]); state.unchanged();
  });
  it("already stale owner refuses before any actual read", () => {
    const state = ram(); state.setCurrent(false); expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); expect(state.reads).toEqual([]); state.unchanged();
  });
  it.each([SRS, MANUAL])("owner loss during %s capture cannot return an apparently valid snapshot", lostAt => {
    const state = ram(); state.readWith((key, raw) => { if (key === lostAt) state.setCurrent(false); return raw; });
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); state.unchanged();
  });
  it("throwing ownership check does not authorize data access", () => {
    const state = ram(); state.replyCurrent(() => { throw new Error("Current unavailable"); });
    expect(() => api.readStageProgress(state.storage)).toThrow(); expect(state.reads).toEqual([]); state.unchanged();
  });
  it("native Promise ownership answer is observed but never considered true", async () => {
    const state = ram(); state.replyCurrent(() => Promise.reject(new Error("Async owner denied")));
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); await Promise.resolve(); expect(state.reads).toEqual([]); state.unchanged();
  });
  it.each(["set", "remove", "release", "other-key"])("mocked computation swallowing snapshot %s denial still cannot fabricate success", operation => {
    const state = ram();
    vi.spyOn(shared, "getAllStageProgress").mockImplementation(snapshot => {
      if (!snapshot) throw new Error("Expected supplied captured snapshot");
      expect(Object.isFrozen(snapshot)).toBe(true);
      try {
        if (operation === "set") snapshot.setItem(MANUAL, "{}");
        else if (operation === "remove") snapshot.removeItem(SRS);
        else if (operation === "release") snapshot.release();
        else snapshot.getItem("coachfi-tokens");
      } catch { /* Deliberately swallow like a permissive consumer. The reader must remember it. */ }
      return expected;
    });
    expect(() => api.readStageProgress(state.storage)).toThrow(); expect(state.reads).toEqual([SRS, MANUAL]); state.unchanged();
  });
  it("transient owner loss caught by actual shared fallback remains sticky after owner recovers", () => {
    const state = ram(), actual = shared.getAllStageProgress;
    vi.spyOn(shared, "getAllStageProgress").mockImplementation(snapshot => {
      if (!snapshot) throw new Error("Expected supplied captured snapshot");
      return actual({ ...snapshot, getItem: key => {
        if (key !== SRS) return snapshot.getItem(key);
        state.setCurrent(false); try { return snapshot.getItem(key); } finally { state.setCurrent(true); }
      } });
    });
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); expect(state.storage.isCurrent()).toBe(true); state.unchanged();
  });
  it("owner loss after actual computation is checked before its stage array escapes", () => {
    const state = ram(), actual = shared.getAllStageProgress;
    vi.spyOn(shared, "getAllStageProgress").mockImplementation(snapshot => {
      if (!snapshot) throw new Error("Expected supplied captured snapshot");
      const result = actual(snapshot); state.setCurrent(false); return result;
    });
    expect(() => api.readStageProgress(state.storage)).toThrow("Storage session changed"); state.unchanged();
  });
});
