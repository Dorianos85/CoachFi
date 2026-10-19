import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle, StorageOwner } from "@/lib/product-storage";
import type { ReviewSaveTicket } from "@/lib/review-save";
import { recordAnswer } from "@/lib/srs";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
const prior = { id: "saving-habit", interval: 6, nextReview: "2026-10-10", repetitions: 2, easeFactor: 2.5 };
const valid = JSON.stringify([prior]);
const malformed = '[{"id":"saving-habit","interval":6,"nextReview":"2026-10-10","repetitions":2,"easeFactor":2.5},';
type Writer = (key: string, value: string, commit: () => void) => unknown;
function fixture(raw: string | null = valid, owner: StorageOwner = { kind: "guest" }, revision = 1) {
  const values = new Map<string, string>([["coachfi-tokens", "125"]]);
  if (raw !== null) values.set("coachfi-srs", raw);
  let current = true, reads = 0, sets = 0, removes = 0;
  let reader: ((key: string, value: string | null) => unknown) | undefined;
  let writer: Writer = (_key, _value, commit) => { commit(); return true; };
  const storage: PersonalStorageHandle = {
    owner, revision, area: "local", isCurrent: () => current,
    getItem: key => { reads += 1; const value = values.get(key) ?? null; return (reader ? reader(key, value) : value) as string | null; },
    setItem: (key, value) => { sets += 1; return writer(key, value, () => { values.set(key, value); }) as boolean; },
    removeItem: key => { removes += 1; values.delete(key); return true; },
    release: () => { current = false; },
  };
  return {
    storage, raw: () => values.get("coachfi-srs") ?? null,
    counts: () => ({ reads, sets, removes }), loseOwner: () => { current = false; },
    readWith: (callback: typeof reader) => { reader = callback; }, writeWith: (callback: Writer) => { writer = callback; },
    replace: (value: string | null) => { if (value === null) values.delete("coachfi-srs"); else values.set("coachfi-srs", value); },
    freshHandle: () => Object.freeze({ ...storage }),
  };
}
let api: typeof import("@/lib/review-save");
const context = (locale = "pl", questionId = "inflation-basics", session = 1) => ({ locale, questionId, session });
function realRecord(storage: PersonalStorageHandle) { recordAnswer("inflation-basics", true, storage); }
function harness(state = fixture()) {
  const controller = api.createReviewSaveController(), ticket = controller.begin(state.storage, context()), activity = vi.fn();
  return { state, controller, ticket, activity, run: () => controller.run(ticket, state.storage, realRecord, activity) };
}
function expectQuarantine(h: ReturnType<typeof harness>) {
  const counts = h.state.counts();
  expect(h.controller.issue(h.state.storage)).toBe("uncertain"); expect(h.controller.isOpen(h.ticket, h.state.storage)).toBe(false);
  expect(h.run().status).toBe("uncertain");
  const replacement = api.createReviewSaveController(), fresh = h.state.freshHandle();
  const next = replacement.begin(fresh, context("en", "saving-habit", 2));
  expect(replacement.issue(fresh)).toBe("uncertain"); expect(replacement.run(next, fresh, realRecord, h.activity).status).toBe("uncertain");
  expect(h.state.counts()).toEqual(counts);
}
beforeEach(async () => {
  vi.resetModules(); api = await import("@/lib/review-save");
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
  effects.cloud.mockReset(); effects.persist.mockReset(); effects.event.mockReset();
  vi.stubGlobal("window", { dispatchEvent: effects.event });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C18 data review forbids real network"); }));
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("C18 strict Review reader preserves synthetic history", () => {
  it.each([
    ["null", null, []], ["empty array", " [] ", []], ["existing card", valid, [prior]],
    ["old uncapped interval and unknown fields", JSON.stringify([{ ...prior, id: "retired-question", interval: 393, note: { future: true }, nextReview: "2032-02-29" }]), [{ ...prior, id: "retired-question", interval: 393, note: { future: true }, nextReview: "2032-02-29" }]],
    ["zero counters", JSON.stringify([{ ...prior, interval: 0, repetitions: 0, easeFactor: 1.3 }]), [{ ...prior, interval: 0, repetitions: 0, easeFactor: 1.3 }]],
  ])("accepts %s without writes or byte normalization", (_label, raw, expected) => {
    const state = fixture(raw as string | null); expect(api.readReviewCards(state.storage)).toEqual(expected);
    expect(state.raw()).toBe(raw); expect(state.counts().sets).toBe(0); expect(state.counts().removes).toBe(0);
  });
  const invalidCards = [
    ["truncated JSON", malformed], ["empty string", ""], ["object", "{}"], ["primitive null", "null"], ["number", "2"],
    ["null card", "[null]"], ["array card", "[[]]"], ["partial card", '[{"id":"old"}]'],
    ["duplicate IDs", JSON.stringify([prior, prior])], ["blank ID", JSON.stringify([{ ...prior, id: "  " }])],
    ["prototype field only", '[{"__proto__":{"id":"old","interval":1,"repetitions":0,"easeFactor":2.5,"nextReview":"2026-10-15"}}]'],
    ["fractional interval", JSON.stringify([{ ...prior, interval: 1.5 }])], ["negative interval", JSON.stringify([{ ...prior, interval: -1 }])],
    ["overflow repetition", '[{"id":"old","interval":1,"repetitions":9007199254740992,"easeFactor":2.5,"nextReview":"2026-10-15"}]'],
    ["fractional repetition", JSON.stringify([{ ...prior, repetitions: 0.5 }])], ["ease below minimum", JSON.stringify([{ ...prior, easeFactor: 1.2 }])],
    ["infinite ease", '[{"id":"old","interval":1,"repetitions":0,"easeFactor":1e309,"nextReview":"2026-10-15"}]'],
    ["invalid leap day", JSON.stringify([{ ...prior, nextReview: "2025-02-29" }])], ["noncanonical date", JSON.stringify([{ ...prior, nextReview: "2026-2-09" }])],
    ["mixed good and bad", JSON.stringify([prior, { ...prior, id: "second", interval: null }])],
  ];
  it.each(invalidCards)("rejects %s before any mutation and retains exact bytes", (_label, raw) => {
    const state = fixture(raw), h = harness(state); expect(() => api.readReviewCards(state.storage)).toThrow();
    expect(h.run().status).toBe("retryable"); expect(state.raw()).toBe(raw);
    expect(state.counts().sets).toBe(0); expect(state.counts().removes).toBe(0); expect(h.activity).not.toHaveBeenCalled(); expect(h.controller.issue(state.storage)).toBeNull();
  });
  it("read denial stays retryable and exact bytes survive; same ticket can then save", () => {
    const h = harness(); h.state.readWith(() => { throw new Error("synthetic read denied"); });
    expect(() => api.readReviewCards(h.state.storage)).toThrow(); expect(h.run().status).toBe("retryable");
    expect(h.state.raw()).toBe(valid); expect(h.state.counts().sets).toBe(0);
    h.state.readWith(undefined); expect(h.run().status).toBe("saved"); expect(h.activity).toHaveBeenCalledTimes(1);
  });
  it("a later corrupted SRS read is blocked even though shared getAllCards catches parse errors", () => {
    const h = harness(); let srsReads = 0;
    h.state.readWith((key, raw) => key === "coachfi-srs" && ++srsReads > 1 ? malformed : raw);
    expect(h.run().status).toBe("uncertain"); expect(h.state.raw()).toBe(valid);
    expect(h.state.counts().sets).toBe(0); expect(h.activity).not.toHaveBeenCalled(); expectQuarantine(h);
  });
  it("SSR strict reader refuses and controller returns retryable without reads or writes", () => {
    const h = harness(); vi.stubGlobal("window", undefined); expect(() => api.readReviewCards(h.state.storage)).toThrow();
    expect(h.run().status).toBe("retryable"); expect(h.state.counts()).toEqual({ reads: 0, sets: 0, removes: 0 });
  });
});

describe("C18 actual SRS mutation acknowledgements and RAM quarantine", () => {
  it("saves exactly once per ticket and preserves unknown history fields", () => {
    const extended = { ...prior, id: "archived-id", interval: 131, future: { active: true } }, h = harness(fixture(JSON.stringify([extended])));
    const result = h.run(); expect(result.status).toBe("saved"); expect(Object.isFrozen(result)).toBe(true);
    expect(api.readReviewCards(h.state.storage)).toEqual([extended, { id: "inflation-basics", interval: 1, nextReview: "2026-10-16", repetitions: 1, easeFactor: 2.6 }]);
    expect(h.controller.current(h.ticket, h.state.storage)).toBe(true); expect(h.controller.isOpen(h.ticket, h.state.storage)).toBe(false);
    const counts = h.state.counts(); expect(h.run().status).toBe("ignored"); expect(h.state.counts()).toEqual(counts);
    expect(h.activity).toHaveBeenCalledTimes(1); expect(h.state.counts().sets).toBe(1);
  });
  it.each(["false", "throw", "write-false", "write-throw", "lying-true", "async-true"])("%s writer never claims saved or replays", mode => {
    const h = harness(); h.state.writeWith((_key, _value, commit) => {
      if (mode.startsWith("write-")) commit(); if (mode.endsWith("throw")) throw new Error("synthetic writer failed");
      if (mode === "lying-true") return true; if (mode === "async-true") return Promise.resolve(true); return false;
    });
    expect(h.run().status).toBe("uncertain"); expect(h.state.counts().sets).toBe(1); expect(h.activity).not.toHaveBeenCalled();
    expect(h.state.raw() === valid).toBe(!mode.startsWith("write-")); expectQuarantine(h);
  });
  it("readback failure after actual write quarantines the written history", () => {
    const h = harness(); h.state.readWith((_key, raw) => { if (h.state.counts().sets > 0) throw new Error("confirmation denied"); return raw; });
    expect(h.run().status).toBe("uncertain"); expect(h.state.raw()).not.toBe(valid); expect(h.activity).not.toHaveBeenCalled(); expectQuarantine(h);
  });
  it.each(["cloud", "event", "persist", "activity"])("%s failure after actual SRS write is uncertain and never replayed", effect => {
    const h = harness(), fail = () => { throw new Error("synthetic late failure"); };
    if (effect === "cloud") effects.cloud.mockImplementation(fail); if (effect === "event") effects.event.mockImplementation(fail);
    if (effect === "persist") effects.persist.mockImplementation(fail); if (effect === "activity") h.activity.mockImplementation(fail);
    expect(h.run().status).toBe("uncertain"); expect(h.state.counts().sets).toBe(1); expect(h.state.raw()).not.toBe(valid);
    expect(h.activity).toHaveBeenCalledTimes(effect === "activity" ? 1 : 0); expectQuarantine(h);
  });
  it("activity modifying confirmed SRS is uncertain and does not replay either effect", () => {
    const h = harness(); h.activity.mockImplementation(() => { h.state.replace(valid); });
    expect(h.run().status).toBe("uncertain"); expect(h.state.raw()).toBe(valid); expectQuarantine(h); expect(h.activity).toHaveBeenCalledTimes(1);
  });
  it("invalid SRS payload is rejected before its underlying setter", () => {
    const h = harness(); expect(h.controller.run(h.ticket, h.state.storage, traced => { traced.setItem("coachfi-srs", malformed); }, h.activity).status).toBe("uncertain");
    expect(h.state.counts().sets).toBe(0); expect(h.state.raw()).toBe(valid); expect(h.activity).not.toHaveBeenCalled(); expectQuarantine(h);
  });
  it("empty record callback cannot manufacture saved or invoke activity", () => {
    const h = harness(); expect(h.controller.run(h.ticket, h.state.storage, () => undefined, h.activity).status).toBe("retryable");
    expect(h.state.raw()).toBe(valid); expect(h.state.counts().sets).toBe(0); expect(h.activity).not.toHaveBeenCalled();
  });
});

describe("C18 owner tickets and synchronous reentry fences", () => {
  it("retired or different-view ticket is ignored without storage access", () => {
    const h = harness(); h.controller.retire(h.ticket); const counts = h.state.counts();
    expect(h.run().status).toBe("ignored"); expect(h.state.counts()).toEqual(counts);
    const next = h.controller.begin(h.state.storage, context("en")); expect(h.run().status).toBe("ignored");
    expect(h.controller.run(next, h.state.storage, realRecord, h.activity).status).toBe("saved");
  });
  it("a forged opaque ticket or invalid context cannot start a write", () => {
    const h = harness(); expect(h.controller.run({} as ReviewSaveTicket, h.state.storage, realRecord).status).toBe("ignored");
    const ticket = h.controller.begin(h.state.storage, context("pl", "", 1)); expect(h.controller.run(ticket, h.state.storage, realRecord).status).toBe("ignored"); expect(h.state.counts().sets).toBe(0);
  });
  it("stale owner before start is ignored and cannot read storage", () => {
    const h = harness(); h.state.loseOwner(); expect(h.run().status).toBe("ignored"); expect(h.state.counts()).toEqual({ reads: 0, sets: 0, removes: 0 });
  });
  it("owner loss during read stops before mutation", () => {
    const h = harness(); h.state.readWith((_key, raw) => { h.state.loseOwner(); return raw; });
    expect(h.run().status).toBe("stopped"); expect(h.state.counts().sets).toBe(0); expect(h.state.raw()).toBe(valid); expect(h.activity).not.toHaveBeenCalled();
  });
  it("owner loss after a write stops and quarantines old semantic scope", () => {
    const h = harness(); h.state.writeWith((_key, _value, commit) => { commit(); h.state.loseOwner(); return true; });
    expect(h.run().status).toBe("stopped"); expect(h.activity).not.toHaveBeenCalled();
    const replacement = { ...h.state.storage, isCurrent: () => true }, controller = api.createReviewSaveController(), ticket = controller.begin(replacement, context("en"));
    const counts = h.state.counts(); expect(controller.issue(replacement)).toBe("uncertain");
    expect(controller.run(ticket, replacement, realRecord).status).toBe("uncertain"); expect(h.state.counts()).toEqual(counts);
  });
  it("retirement during actual write is uncertain across same-owner locale restart", () => {
    const h = harness(); h.state.writeWith((_key, _value, commit) => { commit(); h.controller.retire(h.ticket); return true; });
    expect(h.run().status).toBe("uncertain"); expect(h.activity).not.toHaveBeenCalled();
    const controller = api.createReviewSaveController(), ticket = controller.begin(h.state.storage, context("en", "saving-habit", 2));
    expect(controller.run(ticket, h.state.storage, realRecord).status).toBe("uncertain"); expect(h.state.counts().sets).toBe(1);
  });
  it("same-controller reentry during SRS event cannot write twice", () => {
    const h = harness(), nested: string[] = []; effects.event.mockImplementation(() => { nested.push(h.run().status); });
    expect(h.run().status).toBe("saved"); expect(nested).toEqual(["ignored"]); expect(h.state.counts().sets).toBe(1); expect(h.activity).toHaveBeenCalledTimes(1);
  });
  it("new controller with same scope is fenced while actual SRS is in flight", () => {
    const h = harness(), nested: string[] = []; effects.cloud.mockImplementation(() => {
      const controller = api.createReviewSaveController(), fresh = h.state.freshHandle(), ticket = controller.begin(fresh, context("en"));
      expect(controller.isOpen(ticket, fresh)).toBe(false); nested.push(controller.run(ticket, fresh, realRecord).status);
    });
    expect(h.run().status).toBe("saved"); expect(nested).toEqual(["ignored"]); expect(h.state.counts().sets).toBe(1);
  });
  it("begin during callback cannot reset in-flight and old result becomes uncertain", () => {
    const h = harness(); let next: ReviewSaveTicket | undefined; const nested: string[] = [];
    effects.event.mockImplementation(() => { next = h.controller.begin(h.state.storage, context("en")); nested.push(h.controller.run(next, h.state.storage, realRecord).status); });
    expect(h.run().status).toBe("uncertain"); expect(nested).toEqual(["ignored"]); expect(h.activity).not.toHaveBeenCalled();
    if (!next) throw new Error("Expected next view ticket"); expect(h.controller.run(next, h.state.storage, realRecord).status).toBe("uncertain"); expect(h.state.counts().sets).toBe(1);
  });
  it("independent owner revision remains usable after another scope was quarantined", () => {
    const h = harness(); h.state.writeWith(() => false); expect(h.run().status).toBe("uncertain");
    const other = harness(fixture(valid, { kind: "guest" }, 2)); expect(other.run().status).toBe("saved"); expect(other.activity).toHaveBeenCalledTimes(1);
  });
  it("async record callback cannot return false synchronous success or later mutate through retained trace", async () => {
    const h = harness(); let late: PersonalStorageHandle | undefined;
    const record = async (storage: PersonalStorageHandle) => { late = storage; await Promise.resolve(); recordAnswer("inflation-basics", true, storage); };
    expect(h.controller.run(h.ticket, h.state.storage, record, h.activity).status).toBe("retryable");
    await Promise.resolve(); await Promise.resolve(); expect(late).toBeDefined(); expect(h.state.counts().sets).toBe(0); expect(h.state.raw()).toBe(valid); expect(h.activity).not.toHaveBeenCalled();
  });
  it("async activity after actual write is uncertain and observes native rejection", async () => {
    const h = harness(), activity = async () => { throw new Error("synthetic native activity rejection"); };
    expect(h.controller.run(h.ticket, h.state.storage, realRecord, activity).status).toBe("uncertain");
    await Promise.resolve(); expect(h.state.counts().sets).toBe(1); expectQuarantine(h);
  });
  it("async storage reads are rejected before any write or activity", async () => {
    const h = harness(); h.state.readWith(() => Promise.reject(new Error("synthetic native read rejection")));
    expect(h.run().status).toBe("retryable"); await Promise.resolve(); expect(h.state.counts().sets).toBe(0); expect(h.activity).not.toHaveBeenCalled(); expect(h.state.raw()).toBe(valid);
  });
});
