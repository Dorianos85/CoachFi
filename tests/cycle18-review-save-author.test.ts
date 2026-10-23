import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordAnswer } from "@/lib/srs";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { ReviewSaveController, ReviewSaveTicket } from "@/lib/review-save";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
let api: typeof import("@/lib/review-save");
const prior = { id: "saving-habit", interval: 131, nextReview: "2027-02-01", repetitions: 5, easeFactor: 2.5 };
const rawPrior = JSON.stringify([prior]);
function fixture(raw: string | null = rawPrior, revision = 18) {
  let current = true;
  const bytes = new Map<string, string>([["coachfi-tokens", "125"]]);
  if (raw !== null) bytes.set("coachfi-srs", raw);
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision, area: "local", isCurrent: vi.fn(() => current),
    getItem: vi.fn(key => bytes.get(key) ?? null),
    setItem: vi.fn((key, value) => { bytes.set(key, value); return true; }),
    removeItem: vi.fn(key => { bytes.delete(key); return true; }), release: vi.fn(() => { current = false; }),
  };
  return { bytes, storage, invalidate: () => { current = false; }, clone: () => ({ ...storage, owner: { kind: "guest" } as const }) };
}
function begin(controller: ReviewSaveController, storage: PersonalStorageHandle, locale = "pl", questionId = "inflation-basics", session = 1) {
  return controller.begin(storage, { locale, questionId, session });
}
function save(controller: ReviewSaveController, ticket: ReviewSaveTicket, storage: PersonalStorageHandle, correct = true, activity?: () => void) {
  return controller.run(ticket, storage, traced => { recordAnswer("inflation-basics", correct, traced); }, activity);
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
  effects.cloud.mockReset(); effects.persist.mockReset(); effects.event.mockReset();
  vi.stubGlobal("window", { dispatchEvent: effects.event });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C18 author forbids real network"); }));
  api = await import("@/lib/review-save");
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("C18 author strict readonly Review history", () => {
  it.each([null, "[]", rawPrior])("reads absent/valid raw %s without a write or repair", raw => {
    const state = fixture(raw); expect(api.readReviewCards(state.storage)).toEqual(raw === null ? [] : JSON.parse(raw));
    expect(state.bytes.get("coachfi-srs") ?? null).toBe(raw); expect(state.storage.setItem).not.toHaveBeenCalled();
  });
  it.each(["", " ", "[", "null", "{}", "[[]]", '[{"id":"x"}]'])("rejects unknown history %s, preserving raw", raw => {
    const state = fixture(raw), controller = api.createReviewSaveController(), ticket = begin(controller, state.storage);
    expect(() => api.readReviewCards(state.storage)).toThrow(); expect(save(controller, ticket, state.storage).status).toBe("retryable");
    expect(state.bytes.get("coachfi-srs")).toBe(raw); expect(state.storage.setItem).not.toHaveBeenCalled(); expect(controller.issue(state.storage)).toBeNull();
  });
  it.each([
    { id: " " }, { interval: -1 }, { interval: 1.5 }, { interval: Number.MAX_SAFE_INTEGER + 1 },
    { repetitions: -1 }, { repetitions: 0.5 }, { repetitions: Number.MAX_SAFE_INTEGER + 1 },
    { easeFactor: 1.29 }, { easeFactor: null }, { nextReview: "2026-02-30" }, { nextReview: "2026-2-01" },
  ])("rejects parseable invalid card %o without fallback overwrite", fields => {
    const raw = JSON.stringify([{ ...prior, ...fields }]), state = fixture(raw), controller = api.createReviewSaveController();
    expect(() => api.readReviewCards(state.storage)).toThrow(); expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("retryable");
    expect(state.bytes.get("coachfi-srs")).toBe(raw); expect(state.storage.setItem).not.toHaveBeenCalled();
  });
  it("rejects duplicate IDs, preserving both records and their exact bytes", () => {
    const raw = JSON.stringify([prior, { ...prior, interval: 393 }]), state = fixture(raw);
    expect(() => api.readReviewCards(state.storage)).toThrow(); expect(state.bytes.get("coachfi-srs")).toBe(raw); expect(state.storage.setItem).not.toHaveBeenCalled();
  });
  it("preserves unknown IDs and extra fields through a real recordAnswer update", () => {
    const unknown = { ...prior, id: "future-unknown", interval: 393, futureField: { retained: true } }, state = fixture(JSON.stringify([unknown]));
    expect(api.readReviewCards(state.storage)).toEqual([unknown]); const controller = api.createReviewSaveController();
    expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("saved");
    expect(JSON.parse(state.bytes.get("coachfi-srs") ?? "[]")).toContainEqual(unknown); expect(state.bytes.get("coachfi-tokens")).toBe("125");
  });
  it("never reads storage during SSR or through an unavailable owner", () => {
    const state = fixture(); vi.stubGlobal("window", undefined); expect(() => api.readReviewCards(state.storage)).toThrow();
    const controller = api.createReviewSaveController(); expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("retryable");
    expect(state.storage.getItem).not.toHaveBeenCalled(); expect(state.storage.setItem).not.toHaveBeenCalled();
    vi.stubGlobal("window", { dispatchEvent: effects.event }); state.invalidate(); expect(() => api.readReviewCards(state.storage)).toThrow(); expect(state.storage.getItem).not.toHaveBeenCalled();
  });
});

describe("C18 author ticket admission and explicit prewrite retry", () => {
  it.each([true, false])("commits a real correct=%s answer once, without direct question tokens", correct => {
    const state = fixture(), controller = api.createReviewSaveController(), ticket = begin(controller, state.storage), activity = vi.fn();
    expect(save(controller, ticket, state.storage, correct, correct ? activity : undefined).status).toBe("saved");
    expect(controller.current(ticket, state.storage)).toBe(true); expect(controller.isOpen(ticket, state.storage)).toBe(false);
    const raw = state.bytes.get("coachfi-srs"), writes = vi.mocked(state.storage.setItem).mock.calls.length;
    expect(save(controller, ticket, state.storage, correct, activity).status).toBe("ignored"); expect(state.bytes.get("coachfi-srs")).toBe(raw);
    expect(state.storage.setItem).toHaveBeenCalledTimes(writes); expect(activity).toHaveBeenCalledTimes(correct ? 1 : 0); expect(state.bytes.get("coachfi-tokens")).toBe("125");
    controller.retire(ticket); expect(controller.current(ticket, state.storage)).toBe(false);
  });
  it("read denial is retryable only before mutations and same ticket can be explicitly retried", () => {
    const state = fixture(), controller = api.createReviewSaveController(), ticket = begin(controller, state.storage);
    vi.mocked(state.storage.getItem).mockImplementationOnce(() => { throw new Error("synthetic read denial"); });
    expect(save(controller, ticket, state.storage).status).toBe("retryable"); expect(controller.isOpen(ticket, state.storage)).toBe(true); expect(state.storage.setItem).not.toHaveBeenCalled();
    expect(save(controller, ticket, state.storage).status).toBe("saved");
  });
  it("malformed second SRS read cannot escape through getAllCards catch and overwrite", () => {
    const state = fixture(), controller = api.createReviewSaveController(); let srsReads = 0;
    vi.mocked(state.storage.getItem).mockImplementation(key => {
      if (key === "coachfi-srs" && ++srsReads === 2) { state.bytes.set(key, "[malformed-after-preflight"); }
      return state.bytes.get(key) ?? null;
    });
    expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("uncertain");
    expect(state.storage.setItem).not.toHaveBeenCalled(); expect(state.bytes.get("coachfi-srs")).toBe("[malformed-after-preflight"); expect(controller.issue(state.storage)).toBe("uncertain");
  });
  it("retired locale/session/question callbacks are inert, without storage access", () => {
    const state = fixture(), controller = api.createReviewSaveController(), old = begin(controller, state.storage);
    const fresh = begin(controller, state.storage, "en", "saving-habit", 2), calls = vi.mocked(state.storage.getItem).mock.calls.length;
    controller.retire(old); expect(controller.current(fresh, state.storage)).toBe(true); expect(save(controller, old, state.storage).status).toBe("ignored");
    expect(state.storage.getItem).toHaveBeenCalledTimes(calls); expect(state.storage.setItem).not.toHaveBeenCalled();
  });
  it("retirement before any write suppresses result but does not poison the next context", () => {
    const state = fixture(), controller = api.createReviewSaveController(), old = begin(controller, state.storage);
    const result = controller.run(old, state.storage, () => { controller.retire(old); });
    expect(result.status).toBe("ignored"); expect(controller.issue(state.storage)).toBeNull(); expect(state.storage.setItem).not.toHaveBeenCalled();
    expect(save(controller, begin(controller, state.storage, "en"), state.storage).status).toBe("saved");
  });
  it("invalid context and forged tickets cannot authorize a writer", () => {
    const state = fixture(), controller = api.createReviewSaveController(), ticket = controller.begin(state.storage, { locale: "pl", questionId: "x", session: NaN });
    expect(save(controller, ticket, state.storage).status).toBe("ignored"); expect(controller.isOpen(ticket, state.storage)).toBe(false);
    expect(save(controller, {} as ReviewSaveTicket, state.storage).status).toBe("ignored"); expect(state.storage.getItem).not.toHaveBeenCalled();
  });
});

describe("C18 author uncertain write quarantine and synchronous boundaries", () => {
  it.each(["false", "throw", "write-then-false", "write-then-throw", "lie", "corrupt", "promise"])("writer %s never permits replay across locale/handle/controller", mode => {
    const state = fixture(), controller = api.createReviewSaveController(), activity = vi.fn();
    vi.mocked(state.storage.setItem).mockImplementation((key, value) => {
      if (mode.startsWith("write-then")) state.bytes.set(key, value);
      if (mode === "corrupt") state.bytes.set(key, "[corrupted");
      if (mode === "throw" || mode === "write-then-throw") throw new Error("synthetic writer denial");
      if (mode === "promise") return Promise.resolve(true) as unknown as boolean;
      return mode === "lie" || mode === "corrupt";
    });
    expect(save(controller, begin(controller, state.storage), state.storage, true, activity).status).toBe("uncertain"); expect(activity).not.toHaveBeenCalled();
    const raw = state.bytes.get("coachfi-srs"), clone = state.clone(), remount = api.createReviewSaveController();
    controller.retire(); expect(save(controller, begin(controller, clone, "en", "saving-habit", 2), clone).status).toBe("uncertain");
    expect(save(remount, begin(remount, clone, "en"), clone).status).toBe("uncertain"); expect(remount.isOpen(begin(remount, clone), clone)).toBe(false);
    expect(state.bytes.get("coachfi-srs")).toBe(raw); expect(state.storage.setItem).toHaveBeenCalledTimes(1);
  });
  it.each(["event", "persist", "activity", "async-activity"])("late %s failure is uncertain after real SRS write", where => {
    const state = fixture(), controller = api.createReviewSaveController(), activity = vi.fn(() => {
      if (where === "activity") throw new Error("synthetic activity failure");
      if (where === "async-activity") return Promise.reject(new Error("synthetic async activity")) as unknown as void;
    });
    if (where === "event") effects.event.mockImplementation(() => { throw new Error("synthetic event failure"); });
    if (where === "persist") effects.persist.mockImplementation(() => { throw new Error("synthetic persistence failure"); });
    expect(save(controller, begin(controller, state.storage), state.storage, true, activity).status).toBe("uncertain");
    expect(state.storage.setItem).toHaveBeenCalledTimes(1); expect(controller.issue(state.storage)).toBe("uncertain"); expect(state.bytes.get("coachfi-srs")).not.toBe(rawPrior);
  });
  it("activity corruption after immediate ACK cannot publish saved", () => {
    const state = fixture(), controller = api.createReviewSaveController();
    expect(save(controller, begin(controller, state.storage), state.storage, true, () => { state.bytes.delete("coachfi-srs"); }).status).toBe("uncertain");
    expect(state.bytes.has("coachfi-srs")).toBe(false); expect(controller.issue(state.storage)).toBe("uncertain");
  });
  it("new context during learning event cannot reset delegate or replay in-flight writes", () => {
    const state = fixture(), controller = api.createReviewSaveController(); let nested = "", remounted = "";
    effects.event.mockImplementationOnce(() => {
      const next = begin(controller, state.storage, "en", "saving-habit", 2);
      nested = save(controller, next, state.storage).status;
      const other = api.createReviewSaveController(), clone = state.clone(); remounted = save(other, begin(other, clone), clone).status;
    });
    expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("uncertain");
    expect(nested).toBe("ignored"); expect(remounted).toBe("ignored"); expect(state.storage.setItem).toHaveBeenCalledTimes(1); expect(controller.issue(state.clone())).toBe("uncertain");
  });
  it("same-ticket activity reentry is ignored and the outer answer saves once", () => {
    const state = fixture(), controller = api.createReviewSaveController(), ticket = begin(controller, state.storage); let nested = "";
    const activity = vi.fn(() => { nested = save(controller, ticket, state.storage).status; });
    expect(save(controller, ticket, state.storage, true, activity).status).toBe("saved"); expect(nested).toBe("ignored"); expect(activity).toHaveBeenCalledTimes(1); expect(state.storage.setItem).toHaveBeenCalledTimes(1);
  });
  it("owner loss after mutation stops old publication and does not block a distinct revision", () => {
    const state = fixture(), controller = api.createReviewSaveController();
    effects.event.mockImplementationOnce(() => { state.invalidate(); });
    expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("stopped"); expect(controller.issue(state.storage)).toBe("uncertain");
    const next = fixture(rawPrior, 19); expect(controller.issue(next.storage)).toBeNull(); expect(save(controller, begin(controller, next.storage), next.storage).status).toBe("saved");
  });
  it("retained traced handles cannot write or remove after run has returned", () => {
    const state = fixture(), controller = api.createReviewSaveController(); let retained: PersonalStorageHandle | undefined;
    expect(controller.run(begin(controller, state.storage), state.storage, traced => { retained = traced; recordAnswer("inflation-basics", true, traced); }).status).toBe("saved");
    if (!retained) throw new Error("Missing retained synthetic trace"); const raw = state.bytes.get("coachfi-srs");
    expect(retained.isCurrent()).toBe(false); expect(() => retained?.setItem("coachfi-srs", "[]")).toThrow(); expect(() => retained?.removeItem("coachfi-srs")).toThrow();
    expect(state.bytes.get("coachfi-srs")).toBe(raw); expect(state.storage.setItem).toHaveBeenCalledTimes(1); expect(state.storage.removeItem).not.toHaveBeenCalled();
  });
  it("nonstring asynchronous preflight read is refused without mutation", () => {
    const state = fixture(), controller = api.createReviewSaveController(); vi.mocked(state.storage.getItem).mockReturnValueOnce(Promise.reject(new Error("synthetic async read")) as unknown as string);
    expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("retryable"); expect(state.storage.setItem).not.toHaveBeenCalled(); expect(state.bytes.get("coachfi-srs")).toBe(rawPrior);
  });
  it("bounded quarantine never evicts an earlier uncertain owner to make space", () => {
    for (let revision = 0; revision < 65; revision++) {
      const state = fixture(rawPrior, revision), controller = api.createReviewSaveController(); vi.mocked(state.storage.setItem).mockReturnValue(false);
      expect(save(controller, begin(controller, state.storage), state.storage).status).toBe("uncertain");
    }
    const first = fixture(rawPrior, 0), fresh = fixture(rawPrior, 1000), controller = api.createReviewSaveController();
    expect(controller.issue(first.storage)).toBe("uncertain"); expect(controller.issue(fresh.storage)).toBe("uncertain");
    expect(save(controller, begin(controller, fresh.storage), fresh.storage).status).toBe("uncertain"); expect(fresh.storage.setItem).not.toHaveBeenCalled();
  });
});
