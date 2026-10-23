import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import { getAllStageProgress } from "@/lib/learningProgress";
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));
const SRS = "coachfi-srs", MANUAL = "coachfi-learn-manual";
const card = (id: string, repetitions = 1) => ({ id, repetitions, interval: 6, easeFactor: 2.5, nextReview: "2026-10-15" });
const history = JSON.stringify([card("net-worth"), card("lifestyle-inflation", 0), card("inflation-basics"), { ...card("retired-id", 3), interval: 131, extra: "preserved" }]);
function ram(srs: string | null, manual: string | null, denied?: string) {
  const bytes = new Map<string, string>(); if (srs !== null) bytes.set(SRS, srs); if (manual !== null) bytes.set(MANUAL, manual);
  const original = [...bytes.entries()], writes: string[] = [];
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 1, area: "local", isCurrent: () => true,
    getItem: key => { if (key === denied) throw new Error("Synthetic read denied"); return bytes.get(key) ?? null; },
    setItem: (key, raw) => { writes.push(key); bytes.set(key, raw); return true; },
    removeItem: key => { writes.push(key); bytes.delete(key); return true; }, release: () => undefined,
  };
  return { storage, unchanged: () => { expect([...bytes.entries()]).toEqual(original); expect(writes).toEqual([]); } };
}
beforeEach(() => { vi.stubGlobal("window", {}); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network in C20 baseline"); })); });
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

describe("C20 existing stage-progress baseline observations only", () => {
  it("healthy real helper retains actual counts, manual started and manual completed semantics", () => {
    const state = ram(history, '{"saving-habit":"started","credit-rates":"completed"}');
    expect(getAllStageProgress(state.storage)).toEqual([
      { stageId: "money-mindset", status: "inProgress", progressPct: 33, answeredCount: 1, totalCount: 3 },
      { stageId: "saving-habit", status: "inProgress", progressPct: 5, answeredCount: 0, totalCount: 4 },
      { stageId: "inflation", status: "inProgress", progressPct: 25, answeredCount: 1, totalCount: 4 },
      { stageId: "credit-rates", status: "completed", progressPct: 100, answeredCount: 0, totalCount: 4 },
      { stageId: "emergency-fund", status: "current", progressPct: 0, answeredCount: 0, totalCount: 3 },
      { stageId: "long-term-investing", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 5 },
      { stageId: "retirement", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 2 },
      { stageId: "family-plan", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 3 },
    ]); state.unchanged();
  });
  it("malformed SRS is silently observed as zero answered counts rather than unavailable", () => {
    const state = ram('[{"id":"net-worth","repetitions":1},', null), result = getAllStageProgress(state.storage);
    expect(result.map(stage => stage.answeredCount)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.map(stage => stage.status)).toEqual(["current", "locked", "locked", "locked", "locked", "locked", "locked", "locked"]); state.unchanged();
  });
  it("parseable nonarray SRS propagates an actual TypeError from the real helper", () => {
    const state = ram("{}", null); expect(() => getAllStageProgress(state.storage)).toThrow(TypeError); state.unchanged();
  });
  it("malformed manual state is silently observed as absent overrides", () => {
    const state = ram("[]", '{"saving-habit":"completed",'), result = getAllStageProgress(state.storage);
    expect(result.find(stage => stage.stageId === "saving-habit")).toEqual({ stageId: "saving-habit", status: "locked", progressPct: 0, answeredCount: 0, totalCount: 4 }); state.unchanged();
  });
  it("denied SRS read is silently observed as zero answered counts", () => {
    const state = ram(history, null, SRS), result = getAllStageProgress(state.storage);
    expect(result.map(stage => stage.answeredCount)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]); state.unchanged();
  });
  it("denied manual read loses the completed observation while retaining readable SRS counts", () => {
    const state = ram(history, '{"credit-rates":"completed"}', MANUAL), result = getAllStageProgress(state.storage);
    expect(result.find(stage => stage.stageId === "money-mindset")?.answeredCount).toBe(1);
    expect(result.find(stage => stage.stageId === "credit-rates")).toEqual({ stageId: "credit-rates", status: "current", progressPct: 0, answeredCount: 0, totalCount: 4 }); state.unchanged();
  });
});
