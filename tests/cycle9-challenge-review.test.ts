import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), account: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.account }));

type DailyModule = typeof import("@/lib/challenge-save");
type WriteMode = "false" | "before_throw" | "after_throw" | "after_false";
const MARKER = "coachfi-challenge", TOKENS = "coachfi-tokens", STREAK = "coachfi-streak";
const TODAY_BYTES = '{"date":"2026-10-14"}';
const OLD_BYTES = ' { "date" : "2026-10-13" }\n';
const INPUT = Object.freeze({ questionId: "c19", selectedAnswer: "B", correctAnswer: "B", reward: 50 });
let daily: DailyModule;
let dispatch: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
let onEvent: ((event: Event) => void) | null;
let network: ReturnType<typeof vi.fn<typeof fetch>>;

function fixture(marker: string | null = null, balance: string | null = "125") {
  const bytes = new Map<string, string>([["FIXTURE_UNRELATED", "preserved"]]);
  if (marker !== null) bytes.set(MARKER, marker);
  if (balance !== null) bytes.set(TOKENS, balance);
  let current = true;
  let readHook: ((key: string) => void) | null = null;
  let writeHook: ((key: string) => void) | null = null;
  const faults = new Map<string, WriteMode>();
  const isCurrent = vi.fn(() => current);
  const get = vi.fn((key: string) => { readHook?.(key); return bytes.get(key) ?? null; });
  const set = vi.fn((key: string, value: string) => {
    const fault = faults.get(key);
    if (!current || fault === "false") return false;
    if (fault === "before_throw") throw new Error("FIXTURE_WRITE_BEFORE");
    bytes.set(key, value); writeHook?.(key);
    if (fault === "after_throw") throw new Error("FIXTURE_WRITE_AFTER");
    return fault !== "after_false" && current;
  });
  const remove = vi.fn((key: string) => { if (!current) return false; bytes.delete(key); return true; });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 7, area: "local", isCurrent,
    getItem: get, setItem: set, removeItem: remove, release: () => { current = false; } };
  return { bytes, storage, get, set, remove, isCurrent, stop: () => { current = false; },
    onRead: (hook: ((key: string) => void) | null) => { readHook = hook; },
    onWrite: (hook: ((key: string) => void) | null) => { writeHook = hook; },
    failWrite: (key: string, mode: WriteMode) => { faults.set(key, mode); },
    allowWrite: (key: string) => { faults.delete(key); } };
}

function noMutation(state: ReturnType<typeof fixture>, before: Map<string, string>) {
  expect(state.bytes).toEqual(before); expect(state.set).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
}

function noReplay(controller: ReturnType<DailyModule["createChallengeSaveController"]>,
  state: ReturnType<typeof fixture>, ticket: number, activity: () => void) {
  const before = new Map(state.bytes), reads = state.get.mock.calls.length, writes = state.set.mock.calls.length;
  const events = dispatch.mock.calls.length, cloud = effects.cloud.mock.calls.length, account = effects.account.mock.calls.length;
  expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
  expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(state.set).toHaveBeenCalledTimes(writes);
  expect(dispatch).toHaveBeenCalledTimes(events); expect(effects.cloud).toHaveBeenCalledTimes(cloud);
  expect(effects.account).toHaveBeenCalledTimes(account); expect(state.remove).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); effects.cloud.mockReset(); effects.account.mockReset();
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-14T12:00:00Z"));
  onEvent = null; dispatch = vi.fn((event) => { onEvent?.(event); return true; });
  vi.stubGlobal("window", { dispatchEvent: dispatch, localStorage: {
    getItem: () => { throw new Error("Unbound real storage forbidden in daily review."); },
    setItem: () => { throw new Error("Unbound real storage forbidden in daily review."); },
    removeItem: () => { throw new Error("Unbound real storage forbidden in daily review."); },
  } });
  network = vi.fn<typeof fetch>(() => { throw new Error("Real network forbidden in daily review."); });
  vi.stubGlobal("fetch", network);
  daily = await import("@/lib/challenge-save");
});
afterEach(() => {
  expect(network).not.toHaveBeenCalled(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("B19 independent strict daily marker review", () => {
  it.each([
    [null, "available"], [OLD_BYTES, "available"], [TODAY_BYTES, "completed"],
    ['{"date":"2024-02-29"}', "available"], ['{"date":"2026-10-15"}', "unavailable"],
    ["", "unavailable"], ["null", "unavailable"], ["[]", "unavailable"],
    ['[ {"date":"2026-10-14"} ]', "unavailable"], ["{}", "unavailable"],
    ['{"date":20261014}', "unavailable"], ['{"date":"2026-2-03"}', "unavailable"],
    ['{"date":"2026-02-29"}', "unavailable"], ['{"date":"2026-04-31"}', "unavailable"],
    ['{"date":"2026-10-14\\n"}', "unavailable"], ['{"date":"2026-10-14T00:00:00Z"}', "unavailable"],
    ['{"date":"2026-10-13","futureField":"keep"}', "unavailable"],
    ['{"date":"2026-10-14","__proto__":{"future":true}}', "unavailable"], ["{broken", "unavailable"],
  ] as const)("classifies marker %s as %s and leaves exact bytes untouched", (raw, expected) => {
    const state = fixture(raw), before = new Map(state.bytes);
    expect(daily.readDailyChallengeState(state.storage)).toBe(expected); noMutation(state, before);
  });

  it("a marker read exception is unavailable, with no repair or global-store fallback", () => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes);
    state.onRead(() => { throw new Error("FIXTURE_MARKER_READ"); });
    expect(daily.readDailyChallengeState(state.storage)).toBe("unavailable"); noMutation(state, before);
  });

  it("stale or unknown ownership is unavailable before reads", () => {
    const state = fixture(), before = new Map(state.bytes); state.stop();
    expect(daily.readDailyChallengeState(state.storage)).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled();
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_AUTHORITY"); });
    expect(daily.readDailyChallengeState(state.storage)).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled();
    noMutation(state, before);
  });

  it("ownership lost inside marker get cannot publish an available/completed state", () => {
    const state = fixture(TODAY_BYTES), before = new Map(state.bytes); state.onRead(state.stop);
    expect(daily.readDailyChallengeState(state.storage)).toBe("unavailable"); noMutation(state, before);
  });

  it("without browser state is unavailable with no reads or writes", () => {
    const state = fixture(), before = new Map(state.bytes); vi.stubGlobal("window", undefined);
    expect(daily.readDailyChallengeState(state.storage)).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled();
    noMutation(state, before);
  });
});

describe("B19 independent daily operation and failure review", () => {
  it("one success uses real token/marker helpers, exact reward delta and synchronous activity before acceptance", () => {
    const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), ticket = controller.version();
    expect(Object.isFrozen(controller)).toBe(true); expect(ticket).toBe(0);
    const activity = vi.fn(() => { expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES); });
    const result = controller.run(ticket, state.storage, INPUT, activity);
    expect(result.status).toBe("saved"); expect(result.earned).toBe(50); expect(Object.isFrozen(result)).toBe(true);
    expect(state.set.mock.calls).toEqual([[TOKENS, "175"], [MARKER, TODAY_BYTES]]);
    expect(state.bytes.get("FIXTURE_UNRELATED")).toBe("preserved"); expect(activity).toHaveBeenCalledOnce();
    expect(dispatch.mock.calls.map(([event]) => event.type)).toEqual(["coachfi-tokens"]);
    const before = new Map(state.bytes), reads = state.get.mock.calls.length;
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("ignored");
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(activity).toHaveBeenCalledOnce();
    expect(state.set).toHaveBeenCalledTimes(2);
  });

  it("missing balance uses existing starter125 exactly once without unrelated data loss", () => {
    const state = fixture(null, null), controller = daily.createChallengeSaveController();
    expect(controller.run(controller.version(), state.storage, INPUT).status).toBe("saved");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES);
    expect(state.bytes.get("FIXTURE_UNRELATED")).toBe("preserved");
  });

  it("reported reward persistence success without changed token bytes cannot claim saved or replay", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version(), activity = vi.fn();
    const delegate = state.set.getMockImplementation()!;
    state.set.mockImplementation((key, value) => key === TOKENS ? true : delegate(key, value));
    const result = controller.run(ticket, state.storage, INPUT, activity);
    expect(result.status).toBe("uncertain"); expect(result.earned).toBeUndefined(); expect(state.bytes.get(TOKENS)).toBe("125");
    noReplay(controller, state, ticket, activity);
  });

  it("reward bytes removed by a synchronous activity continuation cannot publish confirmed earned points", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
    const activity = vi.fn(() => { state.bytes.delete(TOKENS); });
    const result = controller.run(ticket, state.storage, INPUT, activity);
    expect(result.status).toBe("uncertain"); expect(result.earned).toBeUndefined(); expect(state.bytes.has(TOKENS)).toBe(false);
    expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES); noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
  });

  it.each(["174", "", "0175", "NaN", "9007199254740992"])(
    "reward bytes changed to %s by activity are preserved but cannot confirm claimed points", (raw) => {
      const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
      const activity = vi.fn(() => { state.bytes.set(TOKENS, raw); });
      const result = controller.run(ticket, state.storage, INPUT, activity);
      expect(result.status).toBe("uncertain"); expect(result.earned).toBeUndefined(); expect(state.bytes.get(TOKENS)).toBe(raw);
      expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES); noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
    });

  it("actual streak milestone and token bonus after challenge preserve larger balance but report only the challenge reward", async () => {
    const { markActiveToday, reachedMilestone } = await import("@/lib/streak");
    const { addTokens } = await import("@/lib/tokens");
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
    state.bytes.set(STREAK, JSON.stringify({ lastActiveDate: "2026-10-13", currentStreak: 2, longestStreak: 2 }));
    const activity = vi.fn(() => {
      const streak = markActiveToday(state.storage); expect(reachedMilestone(streak.currentStreak)).toBe(3);
      addTokens(15, "Milestone 3", "streak", state.storage);
    });
    const result = controller.run(ticket, state.storage, INPUT, activity);
    expect(result.status).toBe("saved"); expect(result.earned).toBe(50); expect(state.bytes.get(TOKENS)).toBe("190");
    expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES); expect(JSON.parse(state.bytes.get(STREAK)!)).toEqual({
      lastActiveDate: "2026-10-14", currentStreak: 3, longestStreak: 3,
    });
    const before = new Map(state.bytes); expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("ignored");
    expect(state.bytes).toEqual(before); expect(activity).toHaveBeenCalledOnce();
  });

  it.each([
    { questionId: "" }, { selectedAnswer: "Z" }, { correctAnswer: "B " },
    { reward: -1 }, { reward: 0.5 }, { reward: Number.NaN }, { reward: Infinity }, { reward: Number.MAX_SAFE_INTEGER + 1 },
  ])("invalid command %j remains retryable and cannot mutate or invoke activity", (patch) => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes), controller = daily.createChallengeSaveController();
    const activity = vi.fn(), ticket = controller.version();
    expect(controller.run(ticket, state.storage, { ...INPUT, ...patch }, activity).status).toBe("retryable");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("saved"); expect(activity).toHaveBeenCalledOnce();
  });

  it.each([
    { selectedAnswer: "B\n" }, { correctAnswer: "B\n" }, { selectedAnswer: "B\n", correctAnswer: "B\n" },
  ])("newline answer identifier %j must reject before wrong/saved terminal feedback or mutation", (patch) => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    expect(controller.run(controller.version(), state.storage, { ...INPUT, ...patch }, activity).status).toBe("retryable");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it.each(["", "0125", "125\n", "+125", " 125", "1e2", "125.0", "-1", "9007199254740992"])(
    "malformed balance %s is preserved without any write", (balance) => {
      const state = fixture(OLD_BYTES, balance), before = new Map(state.bytes), controller = daily.createChallengeSaveController();
      const activity = vi.fn(); expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("retryable");
      expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
    });

  it("valid balance overflowing by one rejects before either token or marker write", () => {
    const state = fixture(OLD_BYTES, String(Number.MAX_SAFE_INTEGER - 49)), before = new Map(state.bytes);
    const controller = daily.createChallengeSaveController(), activity = vi.fn();
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("retryable");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it("exact safe-integer upper boundary is accepted without rounding or unsafe addition", () => {
    const state = fixture(null, String(Number.MAX_SAFE_INTEGER - 50)), controller = daily.createChallengeSaveController();
    expect(controller.run(controller.version(), state.storage, INPUT).status).toBe("saved");
    expect(state.bytes.get(TOKENS)).toBe(String(Number.MAX_SAFE_INTEGER)); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES);
  });

  it("zero reward marks completion and activity, does not rewrite balance or emit a token event", () => {
    const state = fixture(null, "0"), controller = daily.createChallengeSaveController(), activity = vi.fn();
    const result = controller.run(controller.version(), state.storage, { ...INPUT, reward: 0 }, activity);
    expect(result.status).toBe("saved"); expect(result.earned).toBe(0); expect(state.bytes.get(TOKENS)).toBe("0");
    expect(state.set.mock.calls).toEqual([[MARKER, TODAY_BYTES]]); expect(dispatch).not.toHaveBeenCalled(); expect(activity).toHaveBeenCalledOnce();
  });

  it("zero reward with missing balance does not initialize token bytes just to confirm completion", () => {
    const state = fixture(null, null), controller = daily.createChallengeSaveController();
    const result = controller.run(controller.version(), state.storage, { ...INPUT, reward: 0 });
    expect(result.status).toBe("saved"); expect(result.earned).toBe(0); expect(state.bytes.has(TOKENS)).toBe(false);
    expect(state.set.mock.calls).toEqual([[MARKER, TODAY_BYTES]]); expect(dispatch).not.toHaveBeenCalled();
  });

  it("wrong answer returns wrong with zero reward, marker, activity or cloud effects", () => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    const result = controller.run(controller.version(), state.storage, { ...INPUT, selectedAnswer: "A" }, activity);
    expect(result.status).toBe("wrong"); expect(result.earned).toBeUndefined(); expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it("existing completion suppresses reward and all effects without rewriting marker bytes", () => {
    const raw = ' { "date" : "2026-10-14" } ', state = fixture(raw), before = new Map(state.bytes);
    const controller = daily.createChallengeSaveController(), activity = vi.fn();
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("completed");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it.each(['{"date":"2026-10-13","version":2}', '{"date":"2026-10-15"}', "{broken"])(
    "unavailable marker %s blocks command and preserves exact bytes", (raw) => {
      const state = fixture(raw), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
      expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("retryable");
      expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
    });

  it.each([MARKER, TOKENS])("read denial for %s before writes permits one later controlled success", (key) => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    state.onRead((readKey) => { if (readKey === key) throw new Error("FIXTURE_READ_BEFORE_WRITE"); }); const ticket = controller.version();
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("retryable");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before); state.onRead(null);
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("saved"); expect(activity).toHaveBeenCalledOnce();
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.set).toHaveBeenCalledTimes(2);
  });

  it("actual token helper second-read failure after pure eligibility is still before mutation and retryable", () => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    let reads = 0; state.onRead((key) => { if (key === TOKENS && ++reads === 2) throw new Error("FIXTURE_SECOND_TOKEN_READ"); });
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("retryable");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it.each([TOKENS, MARKER])("final confirmation read denial for %s is uncertain after both writes, with no replay", (key) => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
    let afterActivity = false; const activity = vi.fn(() => { afterActivity = true; });
    state.onRead((readKey) => {
      if (afterActivity && readKey === key) throw new Error("FIXTURE_CONFIRMATION_READ");
    });
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES);
    noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
  });

  it.each([TOKENS, MARKER])("owner lost inside %s read stops without mutating", (key) => {
    const state = fixture(OLD_BYTES), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    state.onRead((readKey) => { if (readKey === key) state.stop(); });
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("stopped");
    expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it("stale ticket admission precedes authority reads even for a poisonous handle", () => {
    const state = fixture(), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), ticket = controller.version();
    expect(controller.reset()).toBe(ticket + 1); state.isCurrent.mockImplementation(() => { throw new Error("STALE_MUST_NOT_READ"); });
    expect(controller.run(ticket, state.storage, INPUT, vi.fn()).status).toBe("ignored");
    expect(state.isCurrent).not.toHaveBeenCalled(); expect(state.get).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it("unknown authority stops before reads, writes or callback", () => {
    const state = fixture(), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_AUTHORITY_UNKNOWN"); });
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("stopped");
    expect(state.get).not.toHaveBeenCalled(); expect(activity).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it("without window a current command is retryable before callbacks or reads", () => {
    const state = fixture(), before = new Map(state.bytes), controller = daily.createChallengeSaveController(), activity = vi.fn();
    vi.stubGlobal("window", undefined);
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("retryable");
    expect(activity).not.toHaveBeenCalled(); expect(state.get).not.toHaveBeenCalled(); noMutation(state, before);
  });

  it.each(["false", "before_throw", "after_throw", "after_false"] as const)(
    "token setter %s is uncertain and cannot reward again even when failed bytes are unchanged", (mode) => {
      const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), activity = vi.fn(), ticket = controller.version();
      state.failWrite(TOKENS, mode); expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
      expect(state.bytes.get(TOKENS)).toBe(mode === "after_throw" || mode === "after_false" ? "175" : "125");
      expect(state.bytes.get(MARKER)).toBe(OLD_BYTES); expect(activity).not.toHaveBeenCalled();
      expect(state.set).toHaveBeenCalledOnce(); noReplay(controller, state, ticket, activity); expect(activity).not.toHaveBeenCalled();
    });

  it.each(["false", "before_throw", "after_throw", "after_false"] as const)(
    "marker setter %s after reward is uncertain and cannot replay the saved reward", (mode) => {
      const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), activity = vi.fn(), ticket = controller.version();
      state.failWrite(MARKER, mode); expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
      expect(state.bytes.get(TOKENS)).toBe("175");
      expect(state.bytes.get(MARKER)).toBe(mode === "after_throw" || mode === "after_false" ? TODAY_BYTES : OLD_BYTES);
      expect(activity).not.toHaveBeenCalled(); expect(state.set).toHaveBeenCalledTimes(2);
      noReplay(controller, state, ticket, activity); expect(activity).not.toHaveBeenCalled();
    });

  it("post-token event failure is uncertain, leaves earned bytes visible and prevents missing marker replay", () => {
    const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), activity = vi.fn(), ticket = controller.version();
    onEvent = () => { throw new Error("FIXTURE_TOKEN_EVENT_AFTER_WRITE"); };
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(OLD_BYTES); expect(activity).not.toHaveBeenCalled();
    expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled(); noReplay(controller, state, ticket, activity);
  });

  it.each(["cloud", "account"] as const)("post-token %s notification failure is uncertain and does not claim completion", (where) => {
    const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), activity = vi.fn(), ticket = controller.version();
    effects[where].mockImplementation(() => { throw new Error("FIXTURE_POST_TOKEN_EFFECT"); });
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(OLD_BYTES); expect(activity).not.toHaveBeenCalled();
    noReplay(controller, state, ticket, activity);
  });

  it.each(["false", "before_throw", "after_throw"] as const)("actual streak setter %s after marker yields uncertain and no replay", async (mode) => {
    const { markActiveToday } = await import("@/lib/streak");
    const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), ticket = controller.version();
    state.failWrite(STREAK, mode); const activity = vi.fn(() => { markActiveToday(state.storage); });
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES); expect(activity).toHaveBeenCalledOnce();
    expect(state.bytes.has(STREAK)).toBe(mode === "after_throw"); noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
  });

  it("activity exception after reward/marker leaves both writes and quarantines, without false success", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
    const activity = vi.fn(() => { throw new Error("FIXTURE_ACTIVITY_AFTER_WRITES"); });
    const result = controller.run(ticket, state.storage, INPUT, activity); expect(result.status).toBe("uncertain"); expect(result.earned).toBeUndefined();
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES);
    noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
  });

  it("same-ticket reentry from token event is ignored and outer operation commits once", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version(), activity = vi.fn(), nested = vi.fn();
    onEvent = () => { expect(controller.run(ticket, state.storage, INPUT, nested).status).toBe("ignored"); };
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("saved");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.set).toHaveBeenCalledTimes(2);
    expect(activity).toHaveBeenCalledOnce(); expect(nested).not.toHaveBeenCalled(); expect(dispatch).toHaveBeenCalledOnce();
  });

  it("isOpen is a pure command admission guard across retryable, blocked, committed, in-flight and reset", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
    expect(controller.isOpen(ticket)).toBe(true); expect(state.get).not.toHaveBeenCalled(); expect(state.isCurrent).not.toHaveBeenCalled();
    expect(controller.run(ticket, state.storage, { ...INPUT, reward: -1 }).status).toBe("retryable"); expect(controller.isOpen(ticket)).toBe(true);
    const activity = vi.fn(() => { expect(controller.isOpen(ticket)).toBe(false); });
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("saved"); expect(controller.isOpen(ticket)).toBe(false);
    const next = controller.reset(); expect(controller.isOpen(ticket)).toBe(false); expect(controller.isOpen(next)).toBe(true);
    expect(controller.run(next, state.storage, INPUT).status).toBe("completed"); expect(controller.isOpen(next)).toBe(false);
    const blocked = daily.createChallengeSaveController(), partial = fixture(); partial.failWrite(TOKENS, "false");
    expect(blocked.run(blocked.version(), partial.storage, INPUT).status).toBe("uncertain"); expect(blocked.isOpen(blocked.version())).toBe(false);
    const wrong = daily.createChallengeSaveController(), other = fixture();
    expect(wrong.run(wrong.version(), other.storage, { ...INPUT, selectedAnswer: "A" }).status).toBe("wrong");
    expect(wrong.isOpen(wrong.version())).toBe(false);
  });

  it("reset inside token event preserves in-flight lock and fences the stale marker", () => {
    const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), ticket = controller.version(), activity = vi.fn(), nested = vi.fn();
    let next = -1; onEvent = () => { next = controller.reset(); expect(controller.run(next, state.storage, INPUT, nested).status).toBe("ignored"); };
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("stopped");
    expect(controller.version()).toBe(next); expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(OLD_BYTES);
    expect(state.set).toHaveBeenCalledOnce(); expect(activity).not.toHaveBeenCalled(); expect(nested).not.toHaveBeenCalled();
    const before = new Map(state.bytes); expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("ignored"); expect(state.bytes).toEqual(before);
  });

  it("owner transition after token setter leaves partial bytes but stops marker and activity", () => {
    const state = fixture(OLD_BYTES), controller = daily.createChallengeSaveController(), activity = vi.fn();
    state.onWrite((key) => { if (key === TOKENS) state.stop(); });
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("stopped");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(OLD_BYTES); expect(activity).not.toHaveBeenCalled();
    expect(state.set).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
  });

  it("owner transition within activity cannot claim saved even though marker and reward remain", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), activity = vi.fn(state.stop);
    expect(controller.run(controller.version(), state.storage, INPUT, activity).status).toBe("stopped");
    expect(state.bytes.get(TOKENS)).toBe("175"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES); expect(activity).toHaveBeenCalledOnce();
  });

  it("Promise-returning activity after writes is uncertain, never synchronous saved or retried", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version();
    const activity = vi.fn(() => Promise.resolve());
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
    noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
  });

  it("unknown thenable from activity is rejected without executing its then hook", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(), ticket = controller.version(), then = vi.fn();
    const activity = vi.fn(() => ({ then }));
    expect(controller.run(ticket, state.storage, INPUT, activity).status).toBe("uncertain");
    expect(then).not.toHaveBeenCalled(); noReplay(controller, state, ticket, activity); expect(activity).toHaveBeenCalledOnce();
  });

  it("trace passed to existing persistence helper becomes inactive after run and cannot mutate on later continuation", () => {
    const state = fixture(), controller = daily.createChallengeSaveController(); let retained: PersonalStorageHandle | undefined;
    effects.account.mockImplementation((_section: string, traced: PersonalStorageHandle) => { retained = traced; });
    expect(controller.run(controller.version(), state.storage, INPUT).status).toBe("saved");
    expect(retained).toBeDefined(); expect(retained).not.toBe(state.storage);
    expect(retained!.owner).toEqual(state.storage.owner); expect(retained!.revision).toBe(7);
    expect(retained!.area).toBe("local"); expect(retained!.isCurrent()).toBe(false);
    const before = new Map(state.bytes), reads = state.get.mock.calls.length, writes = state.set.mock.calls.length;
    let late: string | null = null; try { late = retained!.getItem(TOKENS); } catch { /* refusal is accepted */ }
    expect(late).toBeNull();
    try { retained!.setItem(TOKENS, "225"); } catch { /* inactive trace is fenced */ }
    try { retained!.removeItem(MARKER); } catch { /* inactive trace is fenced */ }
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(state.set).toHaveBeenCalledTimes(writes);
    expect(state.remove).not.toHaveBeenCalled();
  });

  it("new controller observes a successful marker without awarding again; this is not durable recovery of a failed marker", () => {
    const state = fixture(), first = daily.createChallengeSaveController(), activity = vi.fn();
    expect(first.run(first.version(), state.storage, INPUT, activity).status).toBe("saved");
    const before = new Map(state.bytes), second = daily.createChallengeSaveController(), other = vi.fn();
    expect(second.run(second.version(), state.storage, INPUT, other).status).toBe("completed");
    expect(state.bytes).toEqual(before); expect(state.set).toHaveBeenCalledTimes(2); expect(activity).toHaveBeenCalledOnce(); expect(other).not.toHaveBeenCalled();
  });

  it("documented limit: discarding RAM controller after failed marker can award again; this does not prove exactly-once after reload", () => {
    const state = fixture(), first = daily.createChallengeSaveController(); state.failWrite(MARKER, "false");
    expect(first.run(first.version(), state.storage, INPUT).status).toBe("uncertain"); expect(state.bytes.get(TOKENS)).toBe("175");
    state.allowWrite(MARKER); const recreated = daily.createChallengeSaveController();
    expect(recreated.run(recreated.version(), state.storage, INPUT).status).toBe("saved");
    expect(state.bytes.get(TOKENS)).toBe("225"); expect(state.bytes.get(MARKER)).toBe(TODAY_BYTES);
  });
});
