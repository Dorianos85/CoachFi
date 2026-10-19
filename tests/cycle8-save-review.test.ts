import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), account: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.account }));
type SaveModule = typeof import("@/lib/quiz-save");
let save: SaveModule;
let dispatch: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
let onEvent: null | ((event: Event) => void);
let network: ReturnType<typeof vi.fn<typeof fetch>>;
const SRS = "coachfi-srs", TOKENS = "coachfi-tokens";
const WRITTEN = '[{"id":"FIXTURE_Q","repetitions":1}]';

function fixture() {
  const bytes = new Map([[SRS, "[]"], [TOKENS, "125"]]);
  let current = true;
  let readFault: null | ((key: string) => void) = null;
  let setFault: "false" | "before_throw" | "after_throw" | null = null;
  let removeFault: "false" | "throw" | null = null;
  let afterRead: null | (() => void) = null;
  let afterWrite: null | (() => void) = null;
  const isCurrent = vi.fn(() => current);
  const get = vi.fn((key: string) => {
    readFault?.(key); const raw = bytes.get(key) ?? null; afterRead?.(); return raw;
  });
  const set = vi.fn((key: string, value: string) => {
    if (!current || setFault === "false") return false;
    if (setFault === "before_throw") throw new Error("FIXTURE_SET_BEFORE");
    bytes.set(key, value); afterWrite?.();
    if (setFault === "after_throw") throw new Error("FIXTURE_SET_AFTER");
    return current;
  });
  const remove = vi.fn((key: string) => {
    if (!current || removeFault === "false") return false;
    if (removeFault === "throw") throw new Error("FIXTURE_REMOVE");
    bytes.delete(key); return current;
  });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 1, area: "local", isCurrent,
    getItem: get, setItem: set, removeItem: remove, release: () => { current = false; } };
  return { bytes, storage, get, set, remove, isCurrent,
    stop: () => { current = false; }, onRead: (callback: () => void) => { afterRead = callback; },
    onWrite: (callback: () => void) => { afterWrite = callback; },
    denyRead: (callback: (key: string) => void) => { readFault = callback; },
    allowRead: () => { readFault = null; },
    denySet: (kind: NonNullable<typeof setFault>) => { setFault = kind; },
    denyRemove: (kind: NonNullable<typeof removeFault>) => { removeFault = kind; } };
}
function untouched(state: ReturnType<typeof fixture>) {
  expect(state.set).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
}
function attemptWrite(storage: PersonalStorageHandle) { storage.setItem(SRS, WRITTEN); }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); onEvent = null;
  dispatch = vi.fn((event) => { onEvent?.(event); return true; });
  vi.stubGlobal("window", { dispatchEvent: dispatch, localStorage: {
    getItem: () => { throw new Error("Unbound real storage forbidden."); },
    setItem: () => { throw new Error("Unbound real storage forbidden."); },
  } });
  network = vi.fn<typeof fetch>(() => { throw new Error("Real network forbidden in independent save review."); });
  vi.stubGlobal("fetch", network);
  // Run only after the source freeze signal; cross-provider persistence is mocked.
  save = await import("@/lib/quiz-save");
});
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("B18 independent synchronous save controller/data review", () => {
  it("frozen controller starts epoch0 and reset advances the ticket", () => {
    const controller = save.createQuizSaveController(); expect(Object.isFrozen(controller)).toBe(true);
    expect(controller.version()).toBe(0); expect(controller.reset()).toBe(1); expect(controller.version()).toBe(1);
    expect(controller.reset()).toBe(2);
  });

  it("strict SRS/token reads precede record; whole sync success commits once and onComplete stays external", () => {
    const state = fixture(), controller = save.createQuizSaveController(), completed = vi.fn();
    const record = vi.fn((traced: PersonalStorageHandle) => {
      expect(state.get.mock.calls.slice(0, 2).map(([key]) => key)).toEqual([SRS, TOKENS]);
      expect(traced).not.toBe(state.storage); expect(traced.owner).toEqual(state.storage.owner);
      attemptWrite(traced);
    });
    const reward = vi.fn(() => { expect(state.bytes.get(SRS)).toBe(WRITTEN); state.storage.setItem(TOKENS, "150"); });
    const ticket = controller.version(); const result = controller.run(ticket, state.storage, record, reward);
    expect(result.status).toBe("saved"); expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
    expect(completed).not.toHaveBeenCalled(); if (result.status === "saved") completed();
    const before = new Map(state.bytes); const getCount = state.get.mock.calls.length;
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("ignored");
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(getCount);
    expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce(); expect(completed).toHaveBeenCalledOnce();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("a read-denial exception before callbacks is retryable and permits one later successful attempt", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(attemptWrite), reward = vi.fn();
    state.denyRead(() => { throw new Error("FIXTURE_READ_DENIED"); }); const ticket = controller.version();
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("retryable");
    expect(record).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); untouched(state);
    state.allowRead(); expect(controller.run(ticket, state.storage, record, reward).status).toBe("saved");
    expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce(); expect(state.set).toHaveBeenCalledOnce();
  });

  it("record exception before any mutation is retryable, never an award or false saved", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn();
    const record = vi.fn(() => { throw new Error("FIXTURE_RECORD_READ_STAGE"); });
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("retryable");
    expect(record).toHaveBeenCalledOnce(); expect(reward).not.toHaveBeenCalled(); untouched(state);
  });

  it("record without a mutation attempt cannot run an untraced reward or claim saved", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn();
    const result = controller.run(controller.version(), state.storage, vi.fn(), reward);
    expect(result.status).not.toBe("saved"); expect(reward).not.toHaveBeenCalled(); untouched(state);
  });

  it("stale owner stops before reads, callbacks or writes", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(), reward = vi.fn(); state.stop();
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("stopped");
    expect(state.get).not.toHaveBeenCalled(); expect(record).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); untouched(state);
  });

  it("unknown current authority stops without pretending safe retry or invoking actions", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(), reward = vi.fn();
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_AUTHORITY_UNKNOWN"); });
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("stopped");
    expect(record).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); expect(state.get).not.toHaveBeenCalled(); untouched(state);
  });

  it("without window a current operation is retryable with zero callbacks or mutations", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(), reward = vi.fn();
    vi.stubGlobal("window", undefined);
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("retryable");
    expect(record).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); untouched(state);
  });

  it.each(["false", "before_throw", "after_throw"] as const)("setter %s is uncertain and quarantined even if bytes look unchanged", (kind) => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn(); state.denySet(kind);
    const record = vi.fn((traced: PersonalStorageHandle) => {
      if (!traced.setItem(SRS, WRITTEN)) throw new Error("FIXTURE_SET_REFUSED");
    });
    const ticket = controller.version(); expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(state.set).toHaveBeenCalledOnce(); expect(reward).not.toHaveBeenCalled();
    expect(state.bytes.get(SRS)).toBe(kind === "after_throw" ? WRITTEN : "[]");
    const before = new Map(state.bytes); const reads = state.get.mock.calls.length;
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(record).toHaveBeenCalledOnce(); expect(state.set).toHaveBeenCalledOnce(); expect(state.get).toHaveBeenCalledTimes(reads);
    expect(state.bytes).toEqual(before); expect(reward).not.toHaveBeenCalled();
  });

  it.each(["false", "before_throw"] as const)("swallowing setter %s cannot produce saved or a reward", (kind) => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn(); state.denySet(kind);
    const record = (traced: PersonalStorageHandle) => { try { traced.setItem(SRS, WRITTEN); } catch { /* deliberate caller mistake */ } };
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("uncertain");
    expect(state.bytes.get(SRS)).toBe("[]"); expect(state.set).toHaveBeenCalledOnce(); expect(reward).not.toHaveBeenCalled();
  });

  it.each(["false", "throw"] as const)("remove %s is an attempted mutation and must quarantine", (kind) => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn(); state.denyRemove(kind);
    const record = (traced: PersonalStorageHandle) => { try { traced.removeItem(SRS); } catch { /* deliberately swallowed */ } };
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("uncertain");
    expect(state.remove).toHaveBeenCalledOnce(); expect(state.bytes.get(SRS)).toBe("[]"); expect(reward).not.toHaveBeenCalled();
  });

  it("successful remove is traced as a mutation, not as a failure inferred from inequality", () => {
    const state = fixture(), controller = save.createQuizSaveController();
    expect(controller.run(controller.version(), state.storage, (traced) => { traced.removeItem(SRS); }).status).toBe("saved");
    expect(state.bytes.has(SRS)).toBe(false); expect(state.remove).toHaveBeenCalledOnce();
  });

  it("a swallowed post-write read fault is sticky and blocks reward/saved", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn();
    state.denyRead((key) => { if (key === "FIXTURE_POISON_READ") throw new Error("FIXTURE_READ_AFTER_WRITE"); });
    const record = (traced: PersonalStorageHandle) => {
      attemptWrite(traced); try { traced.getItem("FIXTURE_POISON_READ"); } catch { /* deliberate caller mistake */ }
    };
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("uncertain");
    expect(state.bytes.get(SRS)).toBe(WRITTEN); expect(reward).not.toHaveBeenCalled();
  });

  it("owner invalidation during strict read stops before record/reward", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(), reward = vi.fn(); state.onRead(state.stop);
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("stopped");
    expect(record).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); untouched(state);
  });

  it("old tickets after reset are ignored before reading even a poisoned handle", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(), reward = vi.fn();
    const old = controller.version(); controller.reset(); state.isCurrent.mockImplementation(() => { throw new Error("Old handle forbidden"); });
    expect(controller.run(old, state.storage, record, reward).status).toBe("ignored");
    expect(state.isCurrent).not.toHaveBeenCalled(); expect(state.get).not.toHaveBeenCalled(); untouched(state);
  });

  it("reset within record keeps the global in-flight lock until finally and cannot commit the new epoch from the old run", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn(), nestedRecord = vi.fn(attemptWrite);
    const old = controller.version(); let nextTicket = -1;
    const record = (traced: PersonalStorageHandle) => {
      nextTicket = controller.reset();
      expect(controller.run(nextTicket, state.storage, nestedRecord, reward).status).toBe("ignored");
      try { traced.setItem(SRS, WRITTEN); } catch { /* old trace is fenced */ }
    };
    expect(controller.run(old, state.storage, record, reward).status).toBe("stopped");
    expect(nestedRecord).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); untouched(state);
    expect(controller.run(nextTicket, state.storage, nestedRecord, reward).status).toBe("saved");
    expect(nestedRecord).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });

  it("same-ticket reentry is ignored without unlocking or duplicating the outer operation", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn(), nestedRecord = vi.fn(attemptWrite);
    const ticket = controller.version();
    const record = (traced: PersonalStorageHandle) => {
      expect(controller.run(ticket, state.storage, nestedRecord, reward).status).toBe("ignored"); attemptWrite(traced);
    };
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("saved");
    expect(nestedRecord).not.toHaveBeenCalled(); expect(state.set).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });

  it("owner transition after record write stops the captured reward without claiming rollback", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn();
    const record = (traced: PersonalStorageHandle) => { attemptWrite(traced); state.stop(); };
    expect(controller.run(controller.version(), state.storage, record, reward).status).toBe("stopped");
    expect(state.bytes.get(SRS)).toBe(WRITTEN); expect(reward).not.toHaveBeenCalled();
  });

  it("a retained trace is inactive after run and cannot read/write/remove on a later callback", () => {
    const state = fixture(), controller = save.createQuizSaveController(); let retained: PersonalStorageHandle | undefined;
    expect(controller.run(controller.version(), state.storage, (traced) => { retained = traced; attemptWrite(traced); }).status).toBe("saved");
    const before = new Map(state.bytes), reads = state.get.mock.calls.length, writes = state.set.mock.calls.length;
    expect(retained!.isCurrent()).toBe(false);
    let lateRead: string | null = null; try { lateRead = retained!.getItem(SRS); } catch { /* refusal is permitted */ }
    expect(lateRead).toBeNull();
    try { retained!.setItem(SRS, "FIXTURE_LATE"); } catch { /* refusal is permitted */ }
    try { retained!.removeItem(SRS); } catch { /* refusal is permitted */ }
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(state.set).toHaveBeenCalledTimes(writes);
    expect(state.remove).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it("actual recordAnswer then token post-write event failure is uncertain and cannot double-award on retry", async () => {
    const { recordAnswer } = await import("@/lib/srs"); const { addTokens } = await import("@/lib/tokens");
    const state = fixture(), controller = save.createQuizSaveController();
    onEvent = (event) => { if (event.type === "coachfi-tokens") throw new Error("FIXTURE_TOKEN_EVENT_AFTER_WRITE"); };
    const record = vi.fn((traced: PersonalStorageHandle) => { recordAnswer("FIXTURE_Q", true, traced); });
    const reward = vi.fn(() => { addTokens(25, "FIXTURE_Q", "app", state.storage); });
    const ticket = controller.version(); expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(JSON.parse(state.bytes.get(SRS)!)).toEqual([expect.objectContaining({ id: "FIXTURE_Q", repetitions: 1 })]);
    expect(state.bytes.get(TOKENS)).toBe("150"); expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
    expect(effects.cloud.mock.calls).toEqual([["srs"]]); expect(effects.account.mock.calls).toEqual([["srs", expect.anything()]]);
    const before = new Map(state.bytes), events = dispatch.mock.calls.length;
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(state.bytes).toEqual(before); expect(dispatch).toHaveBeenCalledTimes(events);
    expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });

  it("actual SRS mutation followed by reward read denial is uncertain even with unchanged token bytes", async () => {
    const { recordAnswer } = await import("@/lib/srs"); const { addTokens } = await import("@/lib/tokens");
    const state = fixture(), controller = save.createQuizSaveController(); let tokenReads = 0;
    state.denyRead((key) => { if (key === TOKENS && ++tokenReads > 1) throw new Error("FIXTURE_LATE_TOKEN_READ"); });
    const record = vi.fn((traced: PersonalStorageHandle) => { recordAnswer("FIXTURE_Q", true, traced); });
    const reward = vi.fn(() => { addTokens(25, "FIXTURE_Q", "app", state.storage); });
    const ticket = controller.version(); expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(state.bytes.get(SRS)).not.toBe("[]"); expect(state.bytes.get(TOKENS)).toBe("125");
    const before = new Map(state.bytes); expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(state.bytes).toEqual(before); expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });

  it("actual incorrect recordAnswer without reward can save once and rejects duplicate execution", async () => {
    const { recordAnswer } = await import("@/lib/srs"); const state = fixture(), controller = save.createQuizSaveController();
    const record = vi.fn((traced: PersonalStorageHandle) => { recordAnswer("FIXTURE_WRONG", false, traced); });
    const ticket = controller.version(); expect(controller.run(ticket, state.storage, record).status).toBe("saved");
    expect(JSON.parse(state.bytes.get(SRS)!)).toEqual([expect.objectContaining({ id: "FIXTURE_WRONG", repetitions: 0 })]);
    expect(state.bytes.get(TOKENS)).toBe("125"); expect(controller.run(ticket, state.storage, record).status).toBe("ignored");
    expect(record).toHaveBeenCalledOnce();
  });

  it("caller onComplete failure after saved does not reopen the record/reward transaction", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(attemptWrite), reward = vi.fn();
    const ticket = controller.version(); expect(controller.run(ticket, state.storage, record, reward).status).toBe("saved");
    const completed = vi.fn(() => { throw new Error("FIXTURE_EXTERNAL_COMPLETION"); }); expect(completed).toThrow();
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("ignored");
    expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });

  it("Promise returned before a write is never saved and its later traced callback is fenced", async () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn(); let retained: PersonalStorageHandle | undefined;
    let resolve!: () => void; const deferred = new Promise<void>((done) => { resolve = done; });
    const record = (traced: PersonalStorageHandle) => {
      retained = traced; return deferred.then(() => { try { traced.setItem(SRS, "FIXTURE_ASYNC_LATE"); } catch { /* inactive trace */ } });
    };
    const result = controller.run(controller.version(), state.storage, record, reward);
    expect(result.status).not.toBe("saved"); expect(reward).not.toHaveBeenCalled(); expect(retained!.isCurrent()).toBe(false);
    resolve(); await deferred; await Promise.resolve(); expect(state.bytes.get(SRS)).toBe("[]"); untouched(state);
  });

  it("thenable returned after a record mutation is uncertain and does not start reward", () => {
    const state = fixture(), controller = save.createQuizSaveController(), reward = vi.fn();
    const then = vi.fn();
    const record = (traced: PersonalStorageHandle) => { attemptWrite(traced); return { then }; };
    const ticket = controller.version(); expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(then).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled();
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain"); expect(state.set).toHaveBeenCalledOnce();
  });

  it("an async reward result after SRS cannot be called synchronous saved or replayed", () => {
    const state = fixture(), controller = save.createQuizSaveController(), record = vi.fn(attemptWrite);
    const reward = vi.fn(() => Promise.resolve()); const ticket = controller.version();
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(controller.run(ticket, state.storage, record, reward).status).toBe("uncertain");
    expect(record).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });
});
