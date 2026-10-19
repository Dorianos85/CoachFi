import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const KEY = "coachfi-agent-ms";
type TimeModule = typeof import("@/lib/agent-time-save");
let time: TimeModule, gate: typeof import("@/lib/signInGate");
let clock: number, network: ReturnType<typeof vi.fn<typeof fetch>>;
let pagehide: (() => void)[];
type Mode = "false" | "before_throw" | "after_throw" | "after_false" | "lying_true";

function fixture(raw: string | null = "7", revision = 31) {
  const bytes = new Map<string, string>([["FIXTURE_UNRELATED", "preserve exact bytes"]]);
  if (raw !== null) bytes.set(KEY, raw);
  let current = true, readHook: (() => void) | null = null, writeHook: (() => void) | null = null, mode: Mode | null = null;
  const isCurrent = vi.fn(() => current);
  const get = vi.fn((key: string) => { readHook?.(); return bytes.get(key) ?? null; });
  const set = vi.fn((key: string, value: string) => {
    if (mode === "false") return false;
    if (mode === "before_throw") throw new Error("FIXTURE_WRITE_BEFORE");
    if (mode === "lying_true") return true;
    bytes.set(key, value); writeHook?.();
    if (mode === "after_throw") throw new Error("FIXTURE_WRITE_AFTER");
    return mode !== "after_false";
  });
  const remove = vi.fn(() => { throw new Error("Agent-time removal forbidden in review."); });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision, area: "local", isCurrent,
    getItem: get, setItem: set, removeItem: remove, release: () => { current = false; } };
  return { bytes, storage, get, set, remove, isCurrent, stop: () => { current = false; },
    fresh: () => ({ ...storage, owner: { kind: "guest" } as const }),
    fail: (value: Mode | null) => { mode = value; }, onRead: (value: (() => void) | null) => { readHook = value; },
    onWrite: (value: (() => void) | null) => { writeHook = value; } };
}
function statusOf(operation: () => void) {
  try { operation(); return null; }
  catch (error) { expect(error).toBeInstanceOf(time.AgentTimeSaveError); return (error as InstanceType<TimeModule["AgentTimeSaveError"]>).status; }
}
function controller(notify = vi.fn()) { return { timer: time.createAgentTimeController(notify, () => clock), notify }; }
function noMutation(state: ReturnType<typeof fixture>, before: Map<string, string>) {
  expect(state.bytes).toEqual(before); expect(state.set).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
}
beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] }); clock = 1000; pagehide = [];
  vi.spyOn(Date, "now").mockImplementation(() => clock);
  vi.stubGlobal("window", { addEventListener: vi.fn((name: string, fn: () => void) => { if (name === "pagehide") pagehide.push(fn); }),
    removeEventListener: vi.fn(), dispatchEvent: vi.fn(), localStorage: {
      getItem: () => { throw new Error("Real unbound storage forbidden in agent-time review."); },
      setItem: () => { throw new Error("Real unbound storage forbidden in agent-time review."); },
    } });
  network = vi.fn<typeof fetch>(() => { throw new Error("Real network forbidden in agent-time review."); }); vi.stubGlobal("fetch", network);
  time = await import("@/lib/agent-time-save"); gate = await import("@/lib/signInGate");
});
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C13 independent canonical duration admission", () => {
  it.each([[null, 0], ["0", 0], ["7", 7], [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER]] as const)(
    "valid raw %s is read-only confirmed time %s", (raw, expected) => {
      const state = fixture(raw), before = new Map(state.bytes), { timer } = controller();
      expect(timer.read(state.storage)).toBe(expected); expect(timer.status(state.storage)).toBe("ready"); noMutation(state, before);
    });
  it.each(["", " ", " 7", "7 ", "7\n", "00", "07", "+7", "-0", "-1", "1.5", "1e3", "NaN", "Infinity", "null", "[]", "[7]", '{"ms":7,"future":0}', "9007199254740992"])(
    "unknown raw %s is preserved and cannot start a writable timer", (raw) => {
      const state = fixture(raw), before = new Map(state.bytes), { timer, notify } = controller();
      expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("unavailable");
      expect(statusOf(() => timer.begin("coach", state.storage))).toBe("retryable"); expect(timer.isActive()).toBe(false);
      noMutation(state, before);
    });
  it("denied initial read cannot latch an empty loaded cache and overwrite 7 later", () => {
    const state = fixture(), before = new Map(state.bytes), { timer } = controller();
    state.onRead(() => { throw new Error("FIXTURE_READ_DENIED"); });
    expect(statusOf(() => timer.begin("coach", state.storage))).toBe("retryable");
    state.onRead(null); expect(statusOf(() => timer.begin("coach", state.fresh()))).toBe("retryable");
    expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("unavailable"); noMutation(state, before);
  });
  it("actual wrapper exposes unavailable separately from its conservative numeric 0", () => {
    const state = fixture("FIXTURE_MALFORMED"), before = new Map(state.bytes);
    expect(gate.getAgentConversationMs(state.storage)).toBe(0); expect(gate.getAgentConversationStatus(state.storage)).toBe("unavailable");
    expect(statusOf(() => gate.beginAgentConversation("coach", state.storage))).toBe("retryable"); noMutation(state, before);
  });
});

describe("C13 independent union-time and honest RAM", () => {
  it("actual wrapper maintains 7+50=57 compatibility with one last-end write", () => {
    const state = fixture(), notice = vi.fn(), unsubscribe = gate.subscribeSignInProgress(notice);
    try {
      gate.beginAgentConversation("coach", state.storage); expect(gate.getAgentConversationStatus(state.storage)).toBe("counting");
      clock = 1050; expect(gate.getAgentConversationMs(state.storage)).toBe(57); expect(state.set).not.toHaveBeenCalled();
      gate.endAgentConversation("coach", state.storage); expect(state.bytes.get(KEY)).toBe("57"); expect(state.set).toHaveBeenCalledOnce();
      expect(gate.getAgentConversationStatus(state.storage)).toBe("ready"); expect(gate.getAgentConversationMs(state.storage)).toBe(57);
      expect(notice).toHaveBeenCalled(); expect(state.bytes.get("FIXTURE_UNRELATED")).toBe("preserve exact bytes");
    } finally { unsubscribe(); }
  });
  it("overlap coach/voice counts [1000,1050] once; duplicate sources do not reset that interval", () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage);
    clock = 1010; timer.begin("voice", state.storage); clock = 1015; timer.begin("coach", state.storage);
    clock = 1020; timer.end("coach", state.storage); expect(state.set).not.toHaveBeenCalled(); expect(timer.read(state.storage)).toBe(27);
    clock = 1040; timer.end("coach", state.storage); expect(state.set).not.toHaveBeenCalled();
    clock = 1050; timer.end("voice", state.storage); expect(state.bytes.get(KEY)).toBe("57"); expect(timer.read(state.storage)).toBe(57);
    expect(state.set).toHaveBeenCalledOnce(); expect(timer.isActive()).toBe(false);
  });
  it("zero timestamp is valid and duplicate end cannot mutate the completed total", () => {
    clock = 0; const state = fixture(), { timer, notify } = controller(); timer.begin("coach", state.storage); clock = 50;
    timer.end("coach", state.storage); const before = new Map(state.bytes), notices = notify.mock.calls.length;
    clock = 90; timer.end("coach", state.storage); expect(state.bytes).toEqual(before); expect(state.set).toHaveBeenCalledOnce();
    expect(notify.mock.calls.length).toBe(notices); expect(timer.read(state.storage)).toBe(57);
  });
  it("zero elapsed last end preserves null bytes without initializing a new field", () => {
    const state = fixture(null), before = new Map(state.bytes), { timer } = controller(); timer.begin("coach", state.storage);
    timer.end("coach", state.storage); noMutation(state, before); expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("ready");
  });
  it("pagehide checkpoints split 50 into 25+25 without double counting", () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); clock = 1025; timer.checkpointSafe();
    expect(state.bytes.get(KEY)).toBe("32"); expect(timer.isActive()).toBe(true);
    clock = 1050; timer.end("coach", state.storage); expect(state.bytes.get(KEY)).toBe("57"); expect(state.set).toHaveBeenCalledTimes(2);
  });
  it.each([Number.NaN, Infinity, -Infinity, -1, 1000.5, Number.MAX_SAFE_INTEGER + 1, 950])(
    "invalid/backwards clock %s cannot persist or project unsafe time", (now) => {
      const state = fixture(), before = new Map(state.bytes), { timer } = controller(); timer.begin("coach", state.storage); clock = now;
      expect(statusOf(() => timer.end("coach", state.storage))).toBe("retryable"); expect(timer.read(state.storage)).toBe(0);
      expect(timer.status(state.storage)).toBe("unavailable"); expect(timer.isActive()).toBe(false); noMutation(state, before);
    });
  it("sum overflow is unavailable before any mutation attempt and does not floor/clamp", () => {
    const state = fixture(String(Number.MAX_SAFE_INTEGER)), before = new Map(state.bytes), { timer } = controller();
    timer.begin("coach", state.storage); clock = 1050; expect(statusOf(() => timer.end("coach", state.storage))).toBe("retryable");
    expect(timer.read(state.storage)).toBe(0); noMutation(state, before);
  });
  it("external raw drift is preserved rather than overwritten from cached RAM", () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); state.bytes.set(KEY, "19"); clock = 1050;
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("retryable"); expect(state.bytes.get(KEY)).toBe("19");
    expect(state.set).not.toHaveBeenCalled(); expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("unavailable");
  });
});

describe("C13 independent writer quarantine", () => {
  it.each(["false", "before_throw", "after_throw", "after_false", "lying_true"] as const)(
    "writer %s cannot advance confirmed RAM or replay through a fresh same-owner handle", (mode) => {
      const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); clock = 1050; state.fail(mode);
      expect(statusOf(() => timer.end("coach", state.storage))).toBe("uncertain"); expect(timer.status(state.storage)).toBe("uncertain");
      expect(timer.read(state.storage)).toBe(0); expect(timer.isActive()).toBe(false);
      const before = new Map(state.bytes), calls = state.set.mock.calls.length, reads = state.get.mock.calls.length;
      state.fail(null); expect(statusOf(() => timer.begin("coach", state.fresh()))).toBe("uncertain");
      expect(statusOf(() => timer.end("coach", state.fresh()))).toBe("uncertain"); timer.checkpointSafe(); timer.tickSafe();
      expect(state.bytes).toEqual(before); expect(state.set.mock.calls.length).toBe(calls); expect(state.get.mock.calls.length).toBe(reads);
      expect(state.bytes.get(KEY)).toBe(mode === "after_throw" || mode === "after_false" ? "57" : "7"); expect(state.remove).not.toHaveBeenCalled();
    });
  it("post-write readback denial quarantines without rollback or false numeric 57", () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); clock = 1050;
    state.onWrite(() => state.onRead(() => { throw new Error("FIXTURE_READBACK_DENIED"); }));
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("uncertain"); expect(state.bytes.get(KEY)).toBe("57");
    expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("uncertain"); expect(state.set).toHaveBeenCalledOnce();
  });
  it("notify throws after persistence: stored57 stays but success/RAM/replay remain blocked", () => {
    const state = fixture(); let fail = false; const { timer } = controller(vi.fn(() => { if (fail) throw new Error("FIXTURE_NOTIFY"); }));
    timer.begin("coach", state.storage); fail = true; clock = 1050;
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("uncertain"); expect(state.bytes.get(KEY)).toBe("57");
    expect(timer.read(state.storage)).toBe(0); expect(statusOf(() => timer.begin("voice", state.storage))).toBe("uncertain"); expect(state.set).toHaveBeenCalledOnce();
  });
  it("notify changes persisted bytes: final confirmation rejects a lying success", () => {
    const state = fixture(); let change = false; const { timer } = controller(vi.fn(() => { if (change) state.bytes.set(KEY, "19"); }));
    timer.begin("coach", state.storage); change = true; clock = 1050;
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("uncertain"); expect(state.bytes.get(KEY)).toBe("19"); expect(timer.read(state.storage)).toBe(0);
  });
  it("owner loss during read cannot bind a ready timer", () => {
    const state = fixture(), before = new Map(state.bytes), { timer } = controller(); state.onRead(state.stop);
    expect(statusOf(() => timer.begin("coach", state.storage))).toBe("stopped"); expect(timer.status(state.storage)).toBe("stopped"); noMutation(state, before);
  });
  it("owner loss during setter reports stopped, preserving partial old-owner bytes", () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); clock = 1050; state.onWrite(state.stop);
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("stopped"); expect(state.bytes.get(KEY)).toBe("57"); expect(timer.read(state.storage)).toBe(0);
    expect(timer.isActive()).toBe(false); expect(state.set).toHaveBeenCalledOnce();
  });
  it("owner loss during notify cannot report ready after a persisted end", () => {
    const state = fixture(); let change = false; const { timer } = controller(vi.fn(() => { if (change) state.stop(); }));
    timer.begin("coach", state.storage); change = true; clock = 1050;
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("stopped"); expect(state.bytes.get(KEY)).toBe("57"); expect(timer.read(state.storage)).toBe(0);
  });
  it("new owned revision starts from its own cache and cannot inherit old elapsed time", () => {
    const old = fixture(), next = fixture("19", 32), { timer } = controller(); timer.begin("coach", old.storage); clock = 1050; old.stop();
    expect(statusOf(() => timer.end("coach", old.storage))).toBe("stopped"); timer.reset(); expect(timer.read(next.storage)).toBe(19);
    timer.begin("voice", next.storage); clock = 1075; timer.end("voice", next.storage); expect(next.bytes.get(KEY)).toBe("44"); expect(old.bytes.get(KEY)).toBe("7");
  });
});

describe("C13 independent synchronous and background contracts", () => {
  it("subscriber delivery finding: a first failing listener must not suppress a later uncertain-status observer", () => {
    const state = fixture(), observed: string[] = []; let fail = false;
    const removeFirst = gate.subscribeSignInProgress(() => { if (fail) throw new Error("FIXTURE_FIRST_SUBSCRIBER"); });
    const removeSecond = gate.subscribeSignInProgress(() => { observed.push(gate.getAgentConversationStatus(state.storage)); });
    try {
      gate.beginAgentConversation("coach", state.storage); expect(observed).toContain("counting");
      fail = true; clock = 1050; state.fail("false"); expect(pagehide).toHaveLength(1);
      expect(() => pagehide[0]()).not.toThrow(); expect(observed).toContain("uncertain");
      const count = state.set.mock.calls.length; state.fail(null); expect(() => pagehide[0]()).not.toThrow();
      expect(state.set.mock.calls.length).toBe(count); expect(state.bytes.get(KEY)).toBe("7");
    } finally { removeSecond(); removeFirst(); }
  });
  it("subscriber delivery async: first rejected Promise cannot suppress later warning or give a successful durable acknowledgement", async () => {
    const state = fixture(), observed: string[] = []; let fail = false;
    const removeFirst = gate.subscribeSignInProgress(() => {
      if (fail) return Promise.reject(new Error("FIXTURE_FIRST_ASYNC_SUBSCRIBER"));
    });
    const removeSecond = gate.subscribeSignInProgress(() => { observed.push(gate.getAgentConversationStatus(state.storage)); });
    try {
      gate.beginAgentConversation("coach", state.storage); fail = true; clock = 1050;
      expect(statusOf(() => gate.endAgentConversation("coach", state.storage))).toBe("uncertain"); await Promise.resolve();
      expect(observed).toContain("uncertain"); expect(state.bytes.get(KEY)).toBe("57");
      expect(gate.getAgentConversationMs(state.storage)).toBe(0); expect(gate.getAgentConversationStatus(state.storage)).toBe("uncertain");
      expect(statusOf(() => gate.beginAgentConversation("voice", state.fresh()))).toBe("uncertain"); expect(state.set).toHaveBeenCalledOnce();
    } finally { removeSecond(); removeFirst(); }
  });
  it("additional independent: reentrant mutations during acknowledgement cannot nest or replay writes", () => {
    const state = fixture(); let final = false, nested = false;
    const pending: Array<[number, string]> = [];
    let timer: ReturnType<TimeModule["createAgentTimeController"]>;
    timer = time.createAgentTimeController(vi.fn(() => {
      if (final && !nested) {
        nested = true; timer.begin("voice", state.storage); timer.end("coach", state.storage); timer.checkpointSafe();
        pending.push([timer.read(state.storage), timer.status(state.storage)]);
      }
    }), () => clock);
    timer.begin("coach", state.storage); final = true; clock = 1050; timer.end("coach", state.storage);
    expect(pending).toEqual([[57, "ready"]]); expect(state.set).toHaveBeenCalledOnce();
    expect(state.bytes.get(KEY)).toBe("57"); expect(timer.isActive()).toBe(false); expect(timer.status(state.storage)).toBe("ready");
  });
  it("additional independent: actual async subscriber prevents false acknowledgement after persisted end", async () => {
    const state = fixture(); let asynchronous = false;
    const unsubscribe = gate.subscribeSignInProgress(() => {
      if (asynchronous) return Promise.reject(new Error("FIXTURE_ASYNC_ACTUAL_SUBSCRIBER"));
    });
    try {
      gate.beginAgentConversation("coach", state.storage); asynchronous = true; clock = 1050;
      expect(statusOf(() => gate.endAgentConversation("coach", state.storage))).toBe("uncertain"); await Promise.resolve();
      expect(state.bytes.get(KEY)).toBe("57"); expect(gate.getAgentConversationMs(state.storage)).toBe(0);
      expect(gate.getAgentConversationStatus(state.storage)).toBe("uncertain");
      expect(statusOf(() => gate.beginAgentConversation("voice", state.fresh()))).toBe("uncertain"); expect(state.set).toHaveBeenCalledOnce();
    } finally { unsubscribe(); }
  });
  it("additional independent: reset/new owner during notify cannot let an old epoch block or advance the new timer", () => {
    const old = fixture(), next = fixture("19", 32); let final = false, changed = false;
    let timer: ReturnType<TimeModule["createAgentTimeController"]>;
    timer = time.createAgentTimeController(vi.fn(() => {
      if (final && !changed) {
        changed = true; old.stop(); timer.reset(); timer.begin("voice", next.storage);
      }
    }), () => clock);
    timer.begin("coach", old.storage); final = true; clock = 1050;
    expect(statusOf(() => timer.end("coach", old.storage))).toBe("stopped"); expect(old.bytes.get(KEY)).toBe("57");
    expect(timer.status(next.storage)).toBe("counting"); expect(timer.read(next.storage)).toBe(19);
    clock = 1075; timer.end("voice", next.storage); expect(next.bytes.get(KEY)).toBe("44"); expect(old.set).toHaveBeenCalledOnce();
  });
  it.each(["duplicate begin", "unknown end"] as const)("additional independent: clock owner loss before %s no-op still reports stopped", (operation) => {
    const state = fixture(), before = new Map(state.bytes); let lose = false;
    const timer = time.createAgentTimeController(vi.fn(), () => { if (lose) state.stop(); return clock; });
    timer.begin("coach", state.storage); lose = true; clock = 1050;
    expect(statusOf(() => operation === "duplicate begin" ? timer.begin("coach", state.storage) : timer.end("unknown", state.storage))).toBe("stopped");
    expect(timer.read(state.storage)).toBe(0); expect(timer.isActive()).toBe(false); noMutation(state, before);
  });
  it("additional independent: source capacity and invalid caller input refuse without corrupting healthy union time", () => {
    const state = fixture(), { timer } = controller();
    for (let index = 0; index < 64; index++) timer.begin(`source-${index}`, state.storage);
    expect(statusOf(() => timer.begin("65th-source", state.storage))).toBe("retryable");
    for (const source of ["", "   ", "x".repeat(257)]) expect(statusOf(() => timer.begin(source, state.storage))).toBe("retryable");
    clock = 1050; expect(timer.read(state.storage)).toBe(57); expect(timer.status(state.storage)).toBe("counting");
    for (let index = 0; index < 64; index++) timer.end(`source-${index}`, state.storage);
    expect(state.bytes.get(KEY)).toBe("57"); expect(state.set).toHaveBeenCalledOnce(); expect(timer.isActive()).toBe(false);
  });
  it("additional independent: async clock is rejected before mutation and its native rejection is observed", async () => {
    const state = fixture(), before = new Map(state.bytes);
    const timer = time.createAgentTimeController(vi.fn(), () => Promise.reject(new Error("FIXTURE_ASYNC_CLOCK")) as unknown as number);
    expect(statusOf(() => timer.begin("coach", state.storage))).toBe("retryable"); await Promise.resolve(); noMutation(state, before);
    expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("unavailable");
  });
  it("Promise setter is not synchronous successful persistence", async () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); clock = 1050;
    state.set.mockImplementation(() => Promise.reject(new Error("FIXTURE_ASYNC_WRITE")) as unknown as boolean);
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("uncertain"); await Promise.resolve();
    expect(timer.read(state.storage)).toBe(0); expect(state.bytes.get(KEY)).toBe("7");
  });
  it("Promise current authority cannot become truthy current ownership", async () => {
    const state = fixture(), before = new Map(state.bytes), { timer } = controller();
    state.isCurrent.mockImplementation(() => Promise.reject(new Error("FIXTURE_ASYNC_CURRENT")) as unknown as boolean);
    expect(statusOf(() => timer.begin("coach", state.storage))).toBe("stopped"); await Promise.resolve(); noMutation(state, before);
  });
  it("Promise notify after persistence cannot give sync success", async () => {
    const state = fixture(); let fail = false; const { timer } = controller(vi.fn(() => {
      if (fail) return Promise.reject(new Error("FIXTURE_ASYNC_NOTIFY"));
    }));
    timer.begin("coach", state.storage); fail = true; clock = 1050;
    expect(statusOf(() => timer.end("coach", state.storage))).toBe("uncertain"); await Promise.resolve();
    expect(timer.read(state.storage)).toBe(0); expect(state.bytes.get(KEY)).toBe("57");
  });
  it("SSR does not start time or access storage", () => {
    const state = fixture(), before = new Map(state.bytes), { timer } = controller(); vi.stubGlobal("window", undefined);
    expect(timer.read(state.storage)).toBe(0); expect(timer.status(state.storage)).toBe("unavailable");
    expect(statusOf(() => timer.begin("coach", state.storage))).toBe("retryable"); expect(state.get).not.toHaveBeenCalled(); noMutation(state, before);
  });
  it("safe checkpoint catches declined writer and subsequent background invocations do not replay", () => {
    const state = fixture(), { timer } = controller(); timer.begin("coach", state.storage); clock = 1050; state.fail("false");
    expect(() => timer.checkpointSafe()).not.toThrow(); expect(timer.status(state.storage)).toBe("uncertain");
    state.fail(null); expect(() => timer.tickSafe()).not.toThrow(); expect(() => timer.checkpointSafe()).not.toThrow();
    expect(state.bytes.get(KEY)).toBe("7"); expect(state.set).toHaveBeenCalledOnce(); expect(timer.isActive()).toBe(false);
  });
  it("safe ticker handles a notification exception and never writes time", () => {
    const state = fixture(), before = new Map(state.bytes); let fail = false;
    const { timer } = controller(vi.fn(() => { if (fail) throw new Error("FIXTURE_INTERVAL_NOTIFY"); }));
    timer.begin("coach", state.storage); fail = true; clock = 1050; expect(() => timer.tickSafe()).not.toThrow();
    expect(timer.read(state.storage)).toBe(57); expect(timer.isActive()).toBe(true); noMutation(state, before);
  });
  it("actual pagehide wrapper contains a persistence failure and preserves bytes without replay", () => {
    const state = fixture(); gate.beginAgentConversation("coach", state.storage); expect(pagehide).toHaveLength(1);
    clock = 1050; state.fail("false"); expect(() => pagehide[0]()).not.toThrow();
    expect(gate.getAgentConversationStatus(state.storage)).toBe("uncertain"); expect(gate.getAgentConversationMs(state.storage)).toBe(0);
    state.fail(null); expect(() => pagehide[0]()).not.toThrow(); expect(state.set).toHaveBeenCalledOnce(); expect(state.bytes.get(KEY)).toBe("7");
  });
  it("actual interval wrapper contains callback exception without attempting persistence", () => {
    const state = fixture(), before = new Map(state.bytes); let fail = false;
    const unsubscribe = gate.subscribeSignInProgress(() => { if (fail) throw new Error("FIXTURE_TICK"); });
    try {
      gate.beginAgentConversation("coach", state.storage); fail = true; clock = 1050;
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow(); expect(gate.getAgentConversationMs(state.storage)).toBe(57); noMutation(state, before);
    } finally { unsubscribe(); }
  });
});
