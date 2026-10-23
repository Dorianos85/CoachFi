import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { QuizLearningSaveController, QuizLearningSaveReward, QuizLearningSaveTicket } from "@/lib/quiz-learning-save";
import { recordAnswer } from "@/lib/srs";
import { addTokens } from "@/lib/tokens";
import { markActiveToday, reachedMilestone } from "@/lib/streak";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
let api: typeof import("@/lib/quiz-learning-save");
const prior = { id: "unknown-history", interval: 131, repetitions: 5, easeFactor: 2.5, nextReview: "2027-02-01", extra: "retain" };
const priorRaw = JSON.stringify([prior]);
function fixture(tokenRaw: string | null = "125", srsRaw = priorRaw) {
  const bytes = new Map<string, string>([["coachfi-srs", srsRaw]]); if (tokenRaw !== null) bytes.set("coachfi-tokens", tokenRaw);
  let current = true;
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 19, area: "local", isCurrent: vi.fn(() => current),
    getItem: vi.fn(key => bytes.get(key) ?? null), setItem: vi.fn((key, value) => { bytes.set(key, value); return true; }),
    removeItem: vi.fn(key => { bytes.delete(key); return true; }), release: vi.fn(() => { current = false; }) };
  const controller = api.createQuizLearningSaveController();
  return { bytes, storage, controller, invalidate: () => { current = false; }, clone: () => ({ ...storage, owner: { kind: "guest" } as const }) };
}
function begin(controller: QuizLearningSaveController, storage: PersonalStorageHandle, locale = "pl", session = 1) {
  return controller.begin(storage, { locale, questionId: "inflation-basics", session });
}
function reward(amount = 25, activity?: (storage: PersonalStorageHandle) => void): QuizLearningSaveReward {
  return { amount, award: vi.fn((value, storage) => addTokens(value, "synthetic question", "quiz", storage)), activity };
}
function save(controller: QuizLearningSaveController, ticket: QuizLearningSaveTicket, storage: PersonalStorageHandle, phases?: QuizLearningSaveReward, correct = true) {
  return controller.run(ticket, storage, traced => { recordAnswer("inflation-basics", correct, traced); }, phases);
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
  effects.cloud.mockReset(); effects.persist.mockReset(); effects.event.mockReset();
  vi.stubGlobal("window", { dispatchEvent: effects.event });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C19 author forbids real network"); }));
  api = await import("@/lib/quiz-learning-save");
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("C19 author reward receipt admitted before publication", () => {
  it("real SRS then real award save once with final balance and retained historical fields", () => {
    const state = fixture(), phases = reward(), ticket = begin(state.controller, state.storage);
    expect(save(state.controller, ticket, state.storage, phases)).toEqual({ status: "saved", balance: 150 });
    expect(phases.award).toHaveBeenCalledWith(25, expect.objectContaining({ owner: { kind: "guest" }, revision: 19 }));
    expect(state.bytes.get("coachfi-tokens")).toBe("150"); expect(JSON.parse(state.bytes.get("coachfi-srs") ?? "[]")).toContainEqual(prior);
    const counts = { reads: vi.mocked(state.storage.getItem).mock.calls.length, writes: vi.mocked(state.storage.setItem).mock.calls.length };
    expect(save(state.controller, ticket, state.storage, phases)).toEqual({ status: "ignored" }); expect(phases.award).toHaveBeenCalledTimes(1);
    expect(state.storage.getItem).toHaveBeenCalledTimes(counts.reads); expect(state.storage.setItem).toHaveBeenCalledTimes(counts.writes);
    expect(state.controller.isOpen(ticket, state.storage)).toBe(false);
  });
  it.each([true, false])("answer correct=%s without reward descriptor does not validate token schema", correct => {
    const state = fixture("malformed-balance"), ticket = begin(state.controller, state.storage);
    expect(save(state.controller, ticket, state.storage, undefined, correct)).toEqual({ status: "saved" });
    expect(state.bytes.get("coachfi-tokens")).toBe("malformed-balance"); expect(state.storage.setItem).toHaveBeenCalledTimes(1);
  });
  it.each(["garbled", "01", "125\n", String(Number.MAX_SAFE_INTEGER)])("preflight balance %s rejects before SRS with token-specific reason", raw => {
    const state = fixture(raw), phases = reward(), ticket = begin(state.controller, state.storage);
    expect(save(state.controller, ticket, state.storage, phases)).toEqual({ status: "retryable", reason: "token-validation" });
    expect(state.bytes.get("coachfi-srs")).toBe(priorRaw); expect(state.bytes.get("coachfi-tokens")).toBe(raw);
    expect(state.storage.setItem).not.toHaveBeenCalled(); expect(phases.award).not.toHaveBeenCalled(); expect(state.controller.issue(state.storage)).toBeNull();
  });
  it.each([-1, NaN, Infinity])("invalid descriptor amount %s cannot mutate SRS", amount => {
    const state = fixture(), phases = reward(amount);
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "retryable", reason: "token-validation" });
    expect(state.bytes.get("coachfi-srs")).toBe(priorRaw); expect(state.storage.setItem).not.toHaveBeenCalled(); expect(phases.award).not.toHaveBeenCalled();
  });
  it("token read denial inside admitted preflight preserves bytes and permits explicit same-ticket retry", () => {
    const state = fixture(), phases = reward(), ticket = begin(state.controller, state.storage); let reads = 0;
    vi.mocked(state.storage.getItem).mockImplementation(key => { if (key === "coachfi-tokens" && ++reads === 2) throw new Error("synthetic preflight denial"); return state.bytes.get(key) ?? null; });
    expect(save(state.controller, ticket, state.storage, phases)).toEqual({ status: "retryable", reason: "token-validation" }); expect(state.storage.setItem).not.toHaveBeenCalled();
    expect(save(state.controller, ticket, state.storage, phases)).toEqual({ status: "saved", balance: 150 }); expect(phases.award).toHaveBeenCalledTimes(1);
  });
  it.each([{ amount: 0.4, expected: 125, raw: null }, { amount: 0.5, expected: 126, raw: "126" }])("existing rounding and absent initial125 are preserved for %o", sample => {
    const state = fixture(null), phases = reward(sample.amount);
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "saved", balance: sample.expected });
    expect(state.bytes.get("coachfi-tokens") ?? null).toBe(sample.raw);
    expect(vi.mocked(state.storage.setItem).mock.calls.filter(([key]) => key === "coachfi-tokens")).toHaveLength(sample.raw === null ? 0 : 1);
  });
  it("strict malformed initial SRS delegates refusal without invoking reward or replacing history", () => {
    const state = fixture("125", "[broken-history"), phases = reward();
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "retryable" });
    expect(state.bytes.get("coachfi-srs")).toBe("[broken-history"); expect(state.storage.setItem).not.toHaveBeenCalled(); expect(phases.award).not.toHaveBeenCalled();
  });
});

describe("C19 author award acknowledgement before streak activity", () => {
  it.each([125, 150])("no-op award returning %s cannot be masked by a larger optional bonus", returned => {
    const state = fixture(), activity = vi.fn((storage: PersonalStorageHandle) => { addTokens(35, "synthetic bonus", "streak_bonus", storage); });
    const phases = { amount: 25, award: vi.fn(() => returned), activity };
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(activity).not.toHaveBeenCalled(); expect(state.bytes.get("coachfi-tokens")).toBe("125"); expect(state.controller.issue(state.storage)).toBe("uncertain");
  });
  it.each([{ beforeStreak: 2, bonus: 15, balance: 165 }, { beforeStreak: 6, bonus: 35, balance: 185 }])("actual streak milestone %o follows a confirmed question award", sample => {
    const state = fixture(); state.bytes.set("coachfi-streak", JSON.stringify({ lastActiveDate: "2026-10-14", currentStreak: sample.beforeStreak, longestStreak: sample.beforeStreak }));
    let awardSeenBeforeActivity: string | undefined;
    const activity = vi.fn((storage: PersonalStorageHandle) => {
      awardSeenBeforeActivity = state.bytes.get("coachfi-tokens"); const next = markActiveToday(storage), milestone = reachedMilestone(next.currentStreak);
      if (milestone) addTokens(milestone * 5, "synthetic actual-context milestone", "streak_bonus", storage);
    });
    const phases = reward(25, activity);
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "saved", balance: sample.balance });
    expect(awardSeenBeforeActivity).toBe("150"); expect(state.bytes.get("coachfi-tokens")).toBe(String(125 + 25 + sample.bonus));
    expect(activity).toHaveBeenCalledTimes(1); expect(phases.award).toHaveBeenCalledTimes(1);
  });
  it("raw drift during SRS notification is preserved and award never overwrites it", () => {
    const state = fixture(), phases = reward(); effects.event.mockImplementationOnce(() => { state.bytes.set("coachfi-tokens", "126"); });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.get("coachfi-tokens")).toBe("126"); expect(phases.award).not.toHaveBeenCalled();
  });
  it("wrong returned award receipt remains uncertain even when the actual token write succeeded", () => {
    const state = fixture(), activity = vi.fn(); const phases = { amount: 25, award: (amount: number, storage: PersonalStorageHandle) => addTokens(amount, "synthetic", "quiz", storage) + 1, activity };
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.get("coachfi-tokens")).toBe("150"); expect(activity).not.toHaveBeenCalled();
  });
  it("asynchronous award receipt fails closed without running activity", () => {
    const state = fixture(), activity = vi.fn(), phases = { amount: 25, award: () => Promise.reject(new Error("synthetic async award")) as unknown as number, activity };
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.get("coachfi-tokens")).toBe("125"); expect(activity).not.toHaveBeenCalled();
  });
});

describe("C19 author partial rewards quarantine in the existing owner scope", () => {
  it.each(["false", "throw", "write-then-throw", "lie", "promise"])("actual addTokens writer %s cannot replay after locale or remount", mode => {
    const state = fixture(), phases = reward();
    vi.mocked(state.storage.setItem).mockImplementation((key, value) => {
      if (key !== "coachfi-tokens") { state.bytes.set(key, value); return true; }
      if (mode === "write-then-throw") state.bytes.set(key, value);
      if (mode === "throw" || mode === "write-then-throw") throw new Error("synthetic token writer");
      if (mode === "promise") return Promise.resolve(true) as unknown as boolean;
      return mode === "lie";
    });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    const raw = state.bytes.get("coachfi-tokens"), counts = vi.mocked(state.storage.setItem).mock.calls.length, clone = state.clone(), remount = api.createQuizLearningSaveController();
    expect(save(remount, begin(remount, clone, "en", 2), clone, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.get("coachfi-tokens")).toBe(raw); expect(state.storage.setItem).toHaveBeenCalledTimes(counts); expect(phases.award).toHaveBeenCalledTimes(1);
  });
  it.each(["throw", "promise", "lower", "malformed"])("activity %s cannot publish a saved balance after question award", mode => {
    const state = fixture(), phases = reward(25, () => {
      if (mode === "throw") throw new Error("synthetic activity failure");
      if (mode === "promise") return Promise.reject(new Error("synthetic async activity")) as unknown as void;
      state.bytes.set("coachfi-tokens", mode === "lower" ? "149" : "malformed");
    });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.controller.issue(state.storage)).toBe("uncertain"); expect(phases.award).toHaveBeenCalledTimes(1);
  });
  it("deleted low balance cannot become fabricated initial125 and mask the missing final award", () => {
    const state = fixture("0"), phases = reward(25, () => { state.bytes.delete("coachfi-tokens"); });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.has("coachfi-tokens")).toBe(false);
  });
  it("final SRS acknowledgement loss suppresses the already-confirmed token receipt result", () => {
    const state = fixture(), phases = reward(25, () => { state.bytes.delete("coachfi-srs"); });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.get("coachfi-tokens")).toBe("150"); expect(state.bytes.has("coachfi-srs")).toBe(false);
  });
  it("view change in token event fences remaining award work and blocks new-context reentry", () => {
    const state = fixture(), activity = vi.fn(), phases = reward(25, activity); let nested = "";
    effects.event.mockImplementation((event: Event) => {
      if (event.type !== "coachfi-tokens") return;
      const next = begin(state.controller, state.storage, "en", 2); nested = save(state.controller, next, state.storage, phases).status;
    });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "uncertain" });
    expect(state.bytes.get("coachfi-tokens")).toBe("150"); expect(nested).toBe("ignored"); expect(activity).not.toHaveBeenCalled(); expect(state.controller.issue(state.clone())).toBe("uncertain");
  });
  it("owner loss in token preflight has priority over token-validation reason", () => {
    const state = fixture(), phases = reward(); let tokenReads = 0;
    vi.mocked(state.storage.getItem).mockImplementation(key => { if (key === "coachfi-tokens" && ++tokenReads === 2) state.invalidate(); return state.bytes.get(key) ?? null; });
    expect(save(state.controller, begin(state.controller, state.storage), state.storage, phases)).toEqual({ status: "stopped" });
    expect(state.storage.setItem).not.toHaveBeenCalled(); expect(phases.award).not.toHaveBeenCalled(); expect(state.bytes.get("coachfi-srs")).toBe(priorRaw);
  });
});
