import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { QuizLearningSaveReward, QuizLearningSaveTicket } from "@/lib/quiz-learning-save";
import { recordAnswer } from "@/lib/srs";
import { addTokens, getTokenBalance } from "@/lib/tokens";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
const SRS = "coachfi-srs", TOKENS = "coachfi-tokens";
const history = { id: "old-question-no-longer-in-bank", interval: 131, repetitions: 4, easeFactor: 2.8, nextReview: "2032-02-29", future: { kept: true } };
const prior = JSON.stringify([history]);
function ram(tokens: string | null = "125", srs: string | null = prior, revision = 1) {
  const values = new Map<string, string>();
  if (tokens !== null) values.set(TOKENS, tokens);
  if (srs !== null) values.set(SRS, srs);
  let current = true;
  const reads: string[] = [], writes: string[] = [];
  let readHook: ((key: string, raw: string | null, ordinal: number) => unknown) | undefined;
  let writeHook: ((key: string, value: string, commit: () => void) => unknown) | undefined;
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision, area: "local", isCurrent: () => current,
    getItem: key => { reads.push(key); const raw = values.get(key) ?? null; return (readHook ? readHook(key, raw, reads.filter(item => item === key).length) : raw) as string | null; },
    setItem: (key, value) => { writes.push(key); const commit = () => { values.set(key, value); }; if (writeHook) return writeHook(key, value, commit) as boolean; commit(); return true; },
    removeItem: key => { writes.push(key); values.delete(key); return true; },
    release: () => { current = false; },
  };
  return {
    storage, reads, writes, raw: (key = TOKENS) => values.get(key) ?? null,
    replace: (key: string, raw: string | null) => { if (raw === null) values.delete(key); else values.set(key, raw); },
    readWith: (callback: typeof readHook) => { readHook = callback; }, writeWith: (callback: typeof writeHook) => { writeHook = callback; },
    loseOwner: () => { current = false; }, fresh: () => Object.freeze({ ...storage }),
  };
}
let api: typeof import("@/lib/quiz-learning-save"), review: typeof import("@/lib/review-save");
const context = (locale = "pl", questionId = "inflation-basics", session = 1) => ({ locale, questionId, session });
const record = (trace: PersonalStorageHandle) => { recordAnswer("inflation-basics", true, trace); };
function harness(state = ram(), amount = 25) {
  const controller = api.createQuizLearningSaveController(), ticket = controller.begin(state.storage, context());
  const award = vi.fn((value: number, trace: PersonalStorageHandle) => addTokens(value, "Independent C19", "quiz", trace));
  const activity = vi.fn((_trace: PersonalStorageHandle) => undefined);
  const reward: QuizLearningSaveReward = { amount, award, activity };
  return { state, controller, ticket, award, activity, reward, run: () => controller.run(ticket, state.storage, record, reward) };
}
function expectQuarantined(h: ReturnType<typeof harness>) {
  const reads = h.state.reads.length, writes = h.state.writes.length;
  const fresh = h.state.fresh(), other = api.createQuizLearningSaveController(), ticket = other.begin(fresh, context("en", "saving-habit", 2));
  expect(other.issue(fresh)).toBe("uncertain"); expect(other.run(ticket, fresh, record, h.reward)).toEqual({ status: "uncertain" });
  expect(review.createReviewSaveController().issue(fresh)).toBe("uncertain");
  expect(h.state.reads).toHaveLength(reads); expect(h.state.writes).toHaveLength(writes);
}
beforeEach(async () => {
  vi.resetModules(); api = await import("@/lib/quiz-learning-save"); review = await import("@/lib/review-save");
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
  effects.cloud.mockReset(); effects.persist.mockReset(); effects.event.mockReset();
  vi.stubGlobal("window", { dispatchEvent: effects.event });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No provider or real network in C19 data review"); }));
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("C19 independent real SRS and token receipt", () => {
  it("confirms exact base reward before activity and saves unknown historical131 fields once", () => {
    const h = harness(), order: string[] = [];
    h.state.writeWith((key, _value, commit) => { order.push(key); commit(); return true; });
    h.activity.mockImplementation(() => { expect(h.state.raw()).toBe("150"); expect(h.state.writes).toEqual([SRS, TOKENS]); order.push("activity"); });
    const result = h.run(); expect(result).toEqual({ status: "saved", balance: 150 }); expect(Object.isFrozen(result)).toBe(true);
    expect(order).toEqual([SRS, TOKENS, "activity"]); expect(review.readReviewCards(h.state.storage)).toEqual([history, { id: "inflation-basics", interval: 1, repetitions: 1, easeFactor: 2.6, nextReview: "2026-10-16" }]);
    const reads = h.state.reads.length; expect(h.run()).toEqual({ status: "ignored" }); expect(h.state.reads).toHaveLength(reads);
    expect(h.award).toHaveBeenCalledTimes(1); expect(h.activity).toHaveBeenCalledTimes(1);
  });
  it.each([{ amount: 0, tokens: null, expected: 125, raw: null }, { amount: 0.499999, tokens: "0", expected: 0, raw: "0" }, { amount: 0.5, tokens: "0", expected: 1, raw: "1" }, { amount: 1.5, tokens: "8", expected: 10, raw: "10" }, { amount: 5, tokens: "9007199254740986", expected: Number(BigInt("9007199254740991")), raw: "9007199254740991" }])("independent rounding/boundary %o preserves raw and exact arithmetic", sample => {
    const h = harness(ram(sample.tokens), sample.amount); expect(h.run()).toEqual({ status: "saved", balance: sample.expected });
    expect(h.state.raw()).toBe(sample.raw); expect(h.state.writes.filter(key => key === TOKENS)).toHaveLength(Math.round(sample.amount) === 0 ? 0 : 1);
  });
  it("zero reward with initially absent balance can receive a later confirmed activity bonus", () => {
    const h = harness(ram(null), 0);
    h.activity.mockImplementation(trace => { expect(h.state.raw()).toBeNull(); addTokens(35, "synthetic bonus", "activity", trace); });
    expect(h.run()).toEqual({ status: "saved", balance: 160 }); expect(h.state.writes).toEqual([SRS, TOKENS]);
  });
  it("wrong answer without reward descriptor saves its real SRS schedule despite malformed token schema", () => {
    const h = harness(ram("bad balance"));
    expect(h.controller.run(h.ticket, h.state.storage, trace => { recordAnswer("inflation-basics", false, trace); })).toEqual({ status: "saved" });
    expect(h.state.raw()).toBe("bad balance"); expect(h.state.writes).toEqual([SRS]); expect(h.award).not.toHaveBeenCalled(); expect(h.activity).not.toHaveBeenCalled();
    const saved = review.readReviewCards(h.state.storage).find(card => card.id === "inflation-basics");
    expect(saved).toEqual({ id: "inflation-basics", interval: 1, repetitions: 0, easeFactor: 2.3, nextReview: "2026-10-16" });
  });
  it("legacy one-argument callback shape still needs actual canonical award receipt", () => {
    const h = harness(), legacy = vi.fn((amount: number) => { addTokens(amount, "legacy", "quiz", h.state.storage); });
    const award = (amount: number, trace: PersonalStorageHandle) => { legacy(amount); return getTokenBalance(trace); };
    expect(h.controller.run(h.ticket, h.state.storage, record, { amount: 25, award })).toEqual({ status: "saved", balance: 150 });
    expect(legacy.mock.calls).toEqual([[25]]); expect(h.state.writes).toEqual([SRS, TOKENS]);
  });
  it("legacy no-op callback cannot manufacture a confirmed reward from tolerant getTokenBalance", () => {
    const h = harness(), legacy = vi.fn((_amount: number) => undefined);
    const award = (amount: number, trace: PersonalStorageHandle) => { legacy(amount); return getTokenBalance(trace); };
    expect(h.controller.run(h.ticket, h.state.storage, record, { amount: 25, award })).toEqual({ status: "uncertain" });
    expect(legacy.mock.calls).toEqual([[25]]); expect(h.state.raw()).toBe("125"); expectQuarantined(h);
  });
});

describe("C19 admission protects history before token validation", () => {
  it.each(["", "00", "-0", "1.0", "1e2", "125\n", " 125", "9007199254740992"])("token raw %o is rejected without any write or record callback", raw => {
    const h = harness(ram(raw)), callback = vi.fn(record);
    expect(h.controller.run(h.ticket, h.state.storage, callback, h.reward)).toEqual({ status: "retryable", reason: "token-validation" });
    expect(callback).not.toHaveBeenCalled(); expect(h.state.raw(SRS)).toBe(prior); expect(h.state.raw()).toBe(raw); expect(h.state.writes).toEqual([]); expect(h.award).not.toHaveBeenCalled(); expect(h.activity).not.toHaveBeenCalled();
  });
  it.each([-0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER])("amount %o cannot exceed numeric/token bounds before SRS", amount => {
    const h = harness(ram(), amount); expect(h.run()).toEqual({ status: "retryable", reason: "token-validation" }); expect(h.state.writes).toEqual([]); expect(h.state.raw(SRS)).toBe(prior);
  });
  it("admitted preflight read failure is retryable and the same ticket can recover without quarantine", () => {
    const h = harness(); h.state.readWith((key, raw, ordinal) => { if (key === TOKENS && ordinal === 2) throw new Error("preflight denial"); return raw; });
    expect(h.run()).toEqual({ status: "retryable", reason: "token-validation" }); expect(h.state.writes).toEqual([]); expect(h.controller.issue(h.state.storage)).toBeNull();
    h.state.readWith(undefined); expect(h.run()).toEqual({ status: "saved", balance: 150 });
  });
  it.each(['[{"id":"old"},', '{}', JSON.stringify([{ ...history, interval: 0.5 }])])("shared strict SRS rejects %o before token callback instead of clearing history", raw => {
    const h = harness(ram("125", raw)); expect(h.run()).toEqual({ status: "retryable" }); expect(h.state.raw(SRS)).toBe(raw); expect(h.state.writes).toEqual([]); expect(h.award).not.toHaveBeenCalled();
  });
  it("later corrupted SRS read never becomes an empty replacement even with healthy reward preflight", () => {
    const h = harness(); h.state.readWith((key, raw, ordinal) => key === SRS && ordinal === 2 ? "{" : raw);
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.raw(SRS)).toBe(prior); expect(h.state.writes).toEqual([]); expect(h.award).not.toHaveBeenCalled(); expectQuarantined(h);
  });
  it("token drift during real SRS event is preserved and award never starts", () => {
    const h = harness(); effects.event.mockImplementation((event: Event) => { if (event.type === "coachfi-learning") h.state.replace(TOKENS, "126"); });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.raw()).toBe("126"); expect(h.state.writes).toEqual([SRS]); expect(h.award).not.toHaveBeenCalled(); expect(h.activity).not.toHaveBeenCalled(); expectQuarantined(h);
  });
  it("reward descriptor getters are captured once and mutation cannot alter the confirmed amount", () => {
    const h = harness(); let accesses = 0;
    const reward = { get amount() { accesses += 1; return accesses === 1 ? 25 : 999; }, award: h.award, activity: h.activity };
    expect(h.controller.run(h.ticket, h.state.storage, record, reward)).toEqual({ status: "saved", balance: 150 });
    expect(accesses).toBe(1); expect(h.award.mock.calls[0]?.[0]).toBe(25);
  });
});

describe("C19 exact question reward cannot be masked by bonus or late callbacks", () => {
  it.each([125, 150])("no-op award returning %o refuses before a larger bonus could mask missing25", returned => {
    const h = harness(); h.award.mockImplementation(() => returned); h.activity.mockImplementation(trace => { addTokens(70, "masking bonus", "activity", trace); });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.raw()).toBe("125"); expect(h.state.writes).toEqual([SRS]); expect(h.activity).not.toHaveBeenCalled(); expectQuarantined(h);
  });
  it.each([15, 35, 70])("actual additional bonus %o runs only after exact question award receipt", bonus => {
    const h = harness(); h.activity.mockImplementation(trace => { expect(h.state.raw()).toBe("150"); addTokens(bonus, "bonus", "activity", trace); });
    expect(h.run()).toEqual({ status: "saved", balance: 150 + bonus }); expect(h.state.raw()).toBe(String(150 + bonus)); expect(h.state.writes).toEqual([SRS, TOKENS, TOKENS]);
  });
  it.each(["false", "throw", "write-false", "write-throw", "lying-true"])("token setter %s cannot claim saved or replay across remount", mode => {
    const h = harness(); h.state.writeWith((key, _value, commit) => {
      if (key !== TOKENS) { commit(); return true; }
      if (mode.startsWith("write-")) commit(); if (mode.endsWith("throw")) throw new Error("token writer failed"); if (mode === "lying-true") return true; return false;
    });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.activity).not.toHaveBeenCalled(); expect(h.state.writes).toEqual([SRS, TOKENS]); expectQuarantined(h);
  });
  it("successful token write followed by acknowledgement read denial is quarantined before activity", () => {
    const h = harness(); h.state.readWith((key, raw) => { if (key === TOKENS && h.state.writes.includes(TOKENS)) throw new Error("receipt read denied"); return raw; });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.raw()).toBe("150"); expect(h.activity).not.toHaveBeenCalled(); expectQuarantined(h);
  });
  it("zero reward must preserve missing raw rather than normalize it to the default125", () => {
    const h = harness(ram(null), 0); h.award.mockImplementation((_amount, trace) => { trace.setItem(TOKENS, "125"); return 125; });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.activity).not.toHaveBeenCalled(); expect(h.state.raw()).toBe("125"); expectQuarantined(h);
  });
  it.each(["lower", "noncanonical", "delete", "throw", "promise"])("activity %s cannot publish a final balance after valid question award", mode => {
    const h = harness(); const activity = (trace: PersonalStorageHandle): unknown => {
      if (mode === "throw") throw new Error("activity failed"); if (mode === "promise") return Promise.reject(new Error("async activity failed"));
      if (mode === "delete") trace.removeItem(TOKENS); else trace.setItem(TOKENS, mode === "lower" ? "149" : "150\n");
    };
    expect(h.controller.run(h.ticket, h.state.storage, record, { amount: 25, award: h.award, activity })).toEqual({ status: "uncertain" }); expectQuarantined(h);
  });
  it("SRS altered after activity suppresses otherwise healthy reward receipt", () => {
    const h = harness(); h.activity.mockImplementation(() => { h.state.replace(SRS, prior); });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.raw()).toBe("150"); expect(h.state.raw(SRS)).toBe(prior); expectQuarantined(h);
  });
  it("throw in actual token event leaves partial tokens but no activity and no replay", () => {
    const h = harness(); effects.event.mockImplementation((event: Event) => { if (event.type === "coachfi-tokens") throw new Error("late token event"); });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.raw()).toBe("150"); expect(h.activity).not.toHaveBeenCalled(); expectQuarantined(h);
  });
});

describe("C19 shared ownership, admission and asynchronous failure", () => {
  it("owner loss in admitted token preflight has priority over validation reason", () => {
    const h = harness(); h.state.readWith((key, raw, ordinal) => { if (key === TOKENS && ordinal === 2) h.state.loseOwner(); return raw; });
    expect(h.run()).toEqual({ status: "stopped" }); expect(h.state.writes).toEqual([]); expect(h.award).not.toHaveBeenCalled();
  });
  it("owner loss after actual token write stops and old semantic scope stays quarantined", () => {
    const h = harness(); h.state.writeWith((key, _value, commit) => { commit(); if (key === TOKENS) h.state.loseOwner(); return true; });
    expect(h.run()).toEqual({ status: "stopped" }); expect(h.activity).not.toHaveBeenCalled();
    const replacement = { ...h.state.storage, isCurrent: () => true }, controller = api.createQuizLearningSaveController(), ticket = controller.begin(replacement, context("en"));
    expect(controller.issue(replacement)).toBe("uncertain"); expect(controller.run(ticket, replacement, record, h.reward)).toEqual({ status: "uncertain" }); expect(h.state.writes).toEqual([SRS, TOKENS]);
  });
  it("retiring a ticket during reward event quarantines locale replacement without invoking activity", () => {
    const h = harness(); let next: QuizLearningSaveTicket | undefined;
    effects.event.mockImplementation((event: Event) => { if (event.type === "coachfi-tokens") next = h.controller.begin(h.state.storage, context("en")); });
    expect(h.run()).toEqual({ status: "uncertain" }); expect(h.activity).not.toHaveBeenCalled();
    if (!next) throw new Error("Expected changed locale ticket"); expect(h.controller.run(next, h.state.storage, record, h.reward)).toEqual({ status: "uncertain" }); expect(h.state.writes).toEqual([SRS, TOKENS]);
  });
  it("existing Review controller and fresh quiz handle cannot enter the same in-flight scope", () => {
    const h = harness(), nested: string[] = [];
    effects.event.mockImplementation((event: Event) => {
      if (event.type !== "coachfi-learning") return;
      const other = review.createReviewSaveController(), fresh = h.state.fresh(), ticket = other.begin(fresh, context("en"));
      nested.push(other.run(ticket, fresh, record).status);
      const quiz = api.createQuizLearningSaveController(), quizTicket = quiz.begin(fresh, context("en")); nested.push(quiz.run(quizTicket, fresh, record, h.reward).status);
    });
    expect(h.run()).toEqual({ status: "saved", balance: 150 }); expect(nested).toEqual(["ignored", "ignored"]); expect(h.award).toHaveBeenCalledTimes(1);
  });
  it("quarantine from existing Review controller also blocks a new quiz controller with no private reset", () => {
    const h = harness(); h.state.writeWith(() => false); const old = review.createReviewSaveController(), ticket = old.begin(h.state.storage, context());
    expect(old.run(ticket, h.state.storage, record).status).toBe("uncertain");
    const reads = h.state.reads.length, writes = h.state.writes.length; expect(h.run()).toEqual({ status: "uncertain" }); expect(h.state.reads).toHaveLength(reads); expect(h.state.writes).toHaveLength(writes);
  });
  it("different owner revision is not blocked by the prior scope quarantine", () => {
    const h = harness(); h.award.mockImplementation(() => 125); expect(h.run()).toEqual({ status: "uncertain" });
    const other = harness(ram("125", prior, 2)); expect(other.run()).toEqual({ status: "saved", balance: 150 });
  });
  it("opaque forged or retired ticket cannot start preflight or record", () => {
    const h = harness(); expect(h.controller.run({} as QuizLearningSaveTicket, h.state.storage, record, h.reward)).toEqual({ status: "ignored" });
    h.controller.retire(h.ticket); expect(h.run()).toEqual({ status: "ignored" }); expect(h.state.reads).toEqual([]); expect(h.state.writes).toEqual([]);
  });
  it("native async award is observed without receipt success or later traced write", async () => {
    const h = harness(); const award = async (_amount: number, trace: PersonalStorageHandle) => { await Promise.resolve(); return addTokens(25, "late", "quiz", trace); };
    expect(h.controller.run(h.ticket, h.state.storage, record, { amount: 25, award: award as unknown as QuizLearningSaveReward["award"], activity: h.activity })).toEqual({ status: "uncertain" });
    await Promise.resolve(); await Promise.resolve(); expect(h.state.writes).toEqual([SRS]); expect(h.state.raw()).toBe("125"); expect(h.activity).not.toHaveBeenCalled(); expectQuarantined(h);
  });
  it("arbitrary thenable award is never executed or accepted as receipt", () => {
    const h = harness(), then = vi.fn(); const award = () => ({ then });
    expect(h.controller.run(h.ticket, h.state.storage, record, { amount: 25, award: award as unknown as QuizLearningSaveReward["award"], activity: h.activity })).toEqual({ status: "uncertain" });
    expect(then).not.toHaveBeenCalled(); expect(h.activity).not.toHaveBeenCalled(); expectQuarantined(h);
  });
  it("SSR refuses before record, award or data mutation", () => {
    const h = harness(); vi.stubGlobal("window", undefined); expect(h.run()).toEqual({ status: "retryable" }); expect(h.state.reads).toEqual([]); expect(h.state.writes).toEqual([]); expect(h.award).not.toHaveBeenCalled();
  });
});
