import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentTimeSaveError, createAgentTimeController } from "@/lib/agent-time-save";
import type { PersonalStorageHandle } from "@/lib/product-storage";
const KEY = "coachfi-agent-ms";
function fixture(raw: string | null = null) {
  let current = true; const bytes = new Map<string, string>(); if (raw !== null) bytes.set(KEY, raw);
  const handlers = new Map<string, () => void>();
  vi.stubGlobal("window", { addEventListener: vi.fn((event: string, listener: () => void) => handlers.set(event, listener)), dispatchEvent: vi.fn() });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 1, area: "local", isCurrent: vi.fn(() => current),
    getItem: vi.fn((key: string) => bytes.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); return true; }),
    removeItem: vi.fn((key: string) => { bytes.delete(key); return true; }), release: vi.fn(() => { current = false; }) };
  const clock = vi.fn(() => 100), notify = vi.fn(), controller = createAgentTimeController(notify, clock);
  return { storage, bytes, handlers, clock, notify, controller, invalidate: () => { current = false; }, clone: () => ({ ...storage, owner: { kind: "guest" } as const }) };
}
function errorStatus(call: () => void, expected: string, errorClass = AgentTimeSaveError) {
  try { call(); throw new Error("MISSING_ERROR"); } catch (error) { expect(error).toBeInstanceOf(errorClass); expect((error as AgentTimeSaveError).status).toBe(expected); }
}
beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); vi.useFakeTimers(); });
afterEach(() => { vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("B22 author strict timer data admission", () => {
  it.each([null, "0", "7", String(Number.MAX_SAFE_INTEGER)])("preserves valid/absent raw %s without readonly or zero-duration write", (raw) => {
    const h = fixture(raw); h.clock.mockReturnValue(0);
    expect(h.controller.read(h.storage)).toBe(raw === null ? 0 : Number(raw)); expect(h.controller.status(h.storage)).toBe("ready");
    h.controller.begin("SYNTHETIC", h.storage); expect(h.controller.status(h.storage)).toBe("counting"); h.controller.end("SYNTHETIC", h.storage);
    expect(h.bytes.get(KEY) ?? null).toBe(raw); expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.controller.status(h.storage)).toBe("ready");
  });
  it.each(["", " ", "01", "+7", "-1", "7.0", "7.5", "NaN", "Infinity", "1e2", "7junk", "9007199254740992", "{}", "[7]", "null"])("preserves unknown ms raw %s and blocks same-owner fresh handles", (raw) => {
    const h = fixture(raw); expect(h.controller.read(h.storage)).toBe(0); expect(h.controller.status(h.storage)).toBe("unavailable");
    errorStatus(() => h.controller.begin("coach", h.clone()), "retryable"); h.bytes.set(KEY, "7");
    errorStatus(() => h.controller.begin("voice", h.clone()), "retryable"); h.controller.checkpointSafe(); h.controller.tickSafe();
    expect(h.bytes.get(KEY)).toBe("7"); expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.controller.isActive()).toBe(false);
  });
  it.each([false, undefined, 7, Promise.resolve("7")])("rejects nonstring read result %s", (value) => {
    const h = fixture("7"); vi.mocked(h.storage.getItem).mockReturnValue(value as unknown as string);
    errorStatus(() => h.controller.begin("coach", h.storage), "retryable"); expect(h.controller.read(h.storage)).toBe(0); expect(h.bytes.get(KEY)).toBe("7"); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it("initial read denial never creates a loaded falsezero or retry replay", () => {
    const h = fixture("7"); vi.mocked(h.storage.getItem).mockImplementationOnce(() => { throw new Error("FIXTURE_DENIAL"); });
    errorStatus(() => h.controller.begin("coach", h.storage), "retryable"); h.clock.mockReturnValue(150);
    errorStatus(() => h.controller.begin("coach", h.clone()), "retryable"); h.controller.checkpointSafe(); expect(h.controller.read(h.storage)).toBe(0);
    expect(h.bytes.get(KEY)).toBe("7"); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it.each([NaN, Infinity, -1, 0.5])("rejects unsafe initial clock %s before mutation", (now) => {
    const h = fixture("7"); h.clock.mockReturnValue(now); errorStatus(() => h.controller.begin("coach", h.storage), "retryable");
    expect(h.controller.status(h.storage)).toBe("unavailable"); expect(h.bytes.get(KEY)).toBe("7"); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it.each([99, NaN, Infinity, 100.5, -1])("rejects backwards/unsafe elapsed clock %s without overwrite", (now) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(now); errorStatus(() => h.controller.end("coach", h.storage), "retryable");
    expect(h.controller.read(h.storage)).toBe(0); expect(h.bytes.get(KEY)).toBe("7"); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it("does not persist or project unsafe summed duration", () => {
    const h = fixture(String(Number.MAX_SAFE_INTEGER)); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(101);
    expect(h.controller.read(h.storage)).toBe(0); expect(h.controller.status(h.storage)).toBe("unavailable"); errorStatus(() => h.controller.end("coach", h.storage), "retryable"); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it.each(["8", "garbled", null])("preserves external raw drift %s without overwriting it", (changed) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(150);
    if (changed === null) h.bytes.delete(KEY); else h.bytes.set(KEY, changed);
    errorStatus(() => h.controller.end("coach", h.storage), "retryable"); expect(h.bytes.get(KEY) ?? null).toBe(changed); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
});

describe("B22 author confirmed timer writes and quarantine", () => {
  it.each(["false", "throw", "write-then-throw", "write-then-false", "lie", "corrupt", "promise"])("writer %s yields uncertainty with no automatic replay", (mode) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    vi.mocked(h.storage.setItem).mockImplementation((key, value) => {
      if (mode.startsWith("write-then")) h.bytes.set(key, value);
      if (mode === "throw" || mode === "write-then-throw") throw new Error("FIXTURE_WRITER");
      if (mode === "corrupt") h.bytes.set(key, "corrupt");
      if (mode === "promise") return Promise.resolve(true) as unknown as boolean;
      return mode === "lie" || mode === "corrupt";
    });
    errorStatus(() => h.controller.end("coach", h.storage), "uncertain"); expect(h.controller.status(h.storage)).toBe("uncertain"); expect(h.controller.read(h.storage)).toBe(0);
    h.controller.checkpointSafe(); h.controller.tickSafe(); errorStatus(() => h.controller.begin("voice", h.clone()), "uncertain"); expect(h.storage.setItem).toHaveBeenCalledTimes(1);
    expect(h.bytes.get(KEY)).toBe(mode.startsWith("write-then") ? "17" : mode === "corrupt" ? "corrupt" : "7");
  });
  it("readback denial after accepted writer blocks without falsely advancing confirmed RAM", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    vi.mocked(h.storage.setItem).mockImplementation((key, value) => { h.bytes.set(key, value); vi.mocked(h.storage.getItem).mockImplementation(() => { throw new Error("FIXTURE_READBACK"); }); return true; });
    errorStatus(() => h.controller.end("coach", h.storage), "uncertain"); expect(h.bytes.get(KEY)).toBe("17"); expect(h.controller.read(h.storage)).toBe(0); expect(h.controller.status(h.storage)).toBe("uncertain");
  });
  it.each(["throw", "delete", "lower", "promise"])("late notify %s quarantines the attempted write while preserving resulting bytes", (mode) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    h.notify.mockImplementation(() => {
      if (mode === "throw") throw new Error("FIXTURE_NOTIFY");
      if (mode === "delete") h.bytes.delete(KEY); if (mode === "lower") h.bytes.set(KEY, "7");
      if (mode === "promise") return Promise.resolve() as unknown as void;
    });
    errorStatus(() => h.controller.end("coach", h.storage), "uncertain"); expect(h.controller.status(h.storage)).toBe("uncertain"); expect(h.controller.isActive()).toBe(false); expect(h.storage.setItem).toHaveBeenCalledTimes(1);
  });
  it("readonly getter in end notification sees17 once, not27 from double-counting", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    const seen: number[] = []; h.notify.mockImplementation(() => { seen.push(h.controller.read(h.storage)); });
    h.controller.end("coach", h.storage); expect(seen).toEqual([17]); expect(h.controller.read(h.storage)).toBe(17); expect(h.controller.status(h.storage)).toBe("ready"); expect(h.bytes.get(KEY)).toBe("17");
  });
  it("notify read fault upgrades a late attempted write to uncertainty", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    h.notify.mockImplementationOnce(() => { vi.mocked(h.storage.getItem).mockImplementation(() => { throw new Error("FIXTURE_NOTIFY_READ"); }); expect(h.controller.read(h.storage)).toBe(0); });
    errorStatus(() => h.controller.end("coach", h.storage), "uncertain"); expect(h.controller.status(h.storage)).toBe("uncertain"); expect(h.bytes.get(KEY)).toBe("17");
  });
  it("reentrant begin/end/checkpoint cannot replay a mutation", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    h.notify.mockImplementation(() => { h.controller.begin("voice", h.storage); h.controller.end("coach", h.storage); h.controller.checkpointSafe(); });
    h.controller.end("coach", h.storage); expect(h.bytes.get(KEY)).toBe("17"); expect(h.storage.setItem).toHaveBeenCalledTimes(1); expect(h.controller.isActive()).toBe(false);
  });
  it("unsafe callback fault status notification is caught in background", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110); h.notify.mockImplementation(() => { throw new Error("FIXTURE_SUBSCRIBER"); });
    vi.mocked(h.storage.setItem).mockReturnValue(false); expect(() => h.controller.checkpointSafe()).not.toThrow(); expect(h.controller.status(h.storage)).toBe("uncertain"); expect(h.notify.mock.calls.length).toBeGreaterThan(1);
    expect(() => h.controller.tickSafe()).not.toThrow(); expect(h.storage.setItem).toHaveBeenCalledTimes(1);
  });
});

describe("B22 author source union and owner fences", () => {
  it.each(["", " ", "x".repeat(257), null, 7])("invalid source %s preserves an already-running timer", (source) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    errorStatus(() => h.controller.begin(source as unknown as string, h.storage), "retryable");
    expect(h.controller.status(h.storage)).toBe("counting"); expect(h.controller.read(h.storage)).toBe(17);
    h.controller.end("coach", h.storage); expect(h.bytes.get(KEY)).toBe("17");
  });
  it("64-source capacity refusal preserves existing sources and duplicate identity", () => {
    const h = fixture("7"); for (let i = 0; i < 64; i++) h.controller.begin("source-" + i, h.storage);
    errorStatus(() => h.controller.begin("source-64", h.storage), "retryable"); h.controller.begin("source-0", h.storage);
    h.clock.mockReturnValue(110); for (let i = 0; i < 64; i++) h.controller.end("source-" + i, h.storage);
    expect(h.bytes.get(KEY)).toBe("17"); expect(h.storage.setItem).toHaveBeenCalledTimes(1);
  });
  it("overlapping coach/voice and duplicate begin count union once", () => {
    const h = fixture("7"); h.clock.mockReturnValue(0); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(5); h.controller.begin("voice", h.storage); h.controller.begin("coach", h.storage);
    h.clock.mockReturnValue(10); h.controller.end("coach", h.storage); expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.controller.read(h.storage)).toBe(17);
    h.clock.mockReturnValue(20); h.controller.end("voice", h.storage); expect(h.bytes.get(KEY)).toBe("27"); expect(h.storage.setItem).toHaveBeenCalledTimes(1); h.controller.end("voice", h.storage); expect(h.bytes.get(KEY)).toBe("27");
  });
  it("pagehide checkpoints advance base once, while interval never writes", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110); h.controller.tickSafe(); expect(h.storage.setItem).not.toHaveBeenCalled();
    h.controller.checkpointSafe(); h.controller.checkpointSafe(); expect(h.bytes.get(KEY)).toBe("17"); expect(h.storage.setItem).toHaveBeenCalledTimes(1);
    h.clock.mockReturnValue(120); h.controller.end("coach", h.storage); expect(h.bytes.get(KEY)).toBe("27"); expect(h.storage.setItem).toHaveBeenCalledTimes(2);
  });
  it.each(["read", "clock", "set", "notify"])("owner loss during %s returns stopped and prevents further writes", (where) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    if (where === "read") vi.mocked(h.storage.getItem).mockImplementation(() => { h.invalidate(); return "7"; });
    if (where === "clock") h.clock.mockImplementation(() => { h.invalidate(); return 110; });
    if (where === "set") vi.mocked(h.storage.setItem).mockImplementation((key, value) => { h.bytes.set(key, value); h.invalidate(); return true; });
    if (where === "notify") h.notify.mockImplementation(() => { h.invalidate(); });
    errorStatus(() => h.controller.end("coach", h.storage), "stopped"); expect(() => h.controller.end("coach", h.storage)).toThrow("Storage session changed"); h.controller.checkpointSafe();
    expect(h.storage.setItem).toHaveBeenCalledTimes(where === "set" || where === "notify" ? 1 : 0);
  });
  it.each(["duplicate-begin", "unknown-end"])("clock owner loss before %s no-op must stop and throw", (kind) => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockImplementationOnce(() => { h.invalidate(); return 110; });
    errorStatus(() => kind === "duplicate-begin" ? h.controller.begin("coach", h.storage) : h.controller.end("voice", h.storage), "stopped");
    expect(h.controller.isActive()).toBe(false); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it("reset inside notify stops old operation without contaminating a new owner", () => {
    const h = fixture("7"), other = fixture("3"); // separate revision models next owner generation
    Object.defineProperty(other.storage, "revision", { value: 2 }); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110);
    h.notify.mockImplementationOnce(() => { h.controller.reset(); h.controller.begin("voice", other.storage); });
    errorStatus(() => h.controller.end("coach", h.storage), "stopped"); expect(h.controller.status(other.storage)).toBe("counting"); expect(h.controller.read(other.storage)).toBe(3); expect(h.bytes.get(KEY)).toBe("17");
  });
  it("blocked old handle cannot poison a current different owner", () => {
    const h = fixture("bad"), other = fixture("3"); Object.defineProperty(other.storage, "revision", { value: 2 });
    expect(h.controller.status(h.storage)).toBe("unavailable"); h.invalidate(); h.controller.reset(); h.controller.begin("voice", other.storage);
    expect(h.controller.read(h.storage)).toBe(0); expect(h.controller.status(other.storage)).toBe("counting"); expect(h.controller.read(other.storage)).toBe(3);
  });
  it("read-only clock callback reset cannot return stale positive duration", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockImplementationOnce(() => { h.controller.reset(); return 110; });
    expect(h.controller.read(h.storage)).toBe(0); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it("same owner remount is still quarantined; explicit owner reset is the only RAM restart", () => {
    const h = fixture("7"); h.controller.begin("coach", h.storage); h.clock.mockReturnValue(110); vi.mocked(h.storage.setItem).mockReturnValue(false);
    errorStatus(() => h.controller.end("coach", h.storage), "uncertain"); errorStatus(() => h.controller.begin("coach", h.clone()), "uncertain");
    h.controller.reset(); expect(h.controller.read(h.storage)).toBe(7); expect(h.controller.status(h.storage)).toBe("ready");
  });
});

describe("B22 actual signInGate background integration", () => {
  it("actual interval validates but never writes; pagehide confirms one span and end the next", async () => {
    const h = fixture("7"), gate = await import("@/lib/signInGate"), clock = vi.spyOn(Date, "now").mockReturnValue(100);
    gate.beginAgentConversation("SYNTHETIC", h.storage); clock.mockReturnValue(110); vi.advanceTimersByTime(1000); expect(h.storage.setItem).not.toHaveBeenCalled();
    h.handlers.get("pagehide")!(); expect(h.bytes.get(KEY)).toBe("17"); expect(gate.getAgentConversationStatus(h.storage)).toBe("counting");
    clock.mockReturnValue(120); gate.endAgentConversation("SYNTHETIC", h.storage); expect(h.bytes.get(KEY)).toBe("27"); expect(vi.getTimerCount()).toBe(0);
  });
  it("actual pagehide refusal is caught, warning status notified, and ticker stops", async () => {
    const h = fixture("7"), gate = await import("@/lib/signInGate"), clock = vi.spyOn(Date, "now").mockReturnValue(100); const statuses: string[] = [];
    gate.subscribeSignInProgress(() => { statuses.push(gate.getAgentConversationStatus(h.storage)); }); gate.beginAgentConversation("coach", h.storage);
    vi.mocked(h.storage.setItem).mockReturnValue(false); clock.mockReturnValue(110); expect(() => h.handlers.get("pagehide")!()).not.toThrow();
    expect(statuses).toContain("uncertain"); expect(gate.getAgentConversationMs(h.storage)).toBe(0); expect(h.bytes.get(KEY)).toBe("7"); expect(vi.getTimerCount()).toBe(0); expect(h.storage.setItem).toHaveBeenCalledTimes(1);
  });
  it("actual interval drift and throwing subscriber do not escape or write", async () => {
    const h = fixture("7"), gate = await import("@/lib/signInGate"); vi.spyOn(Date, "now").mockReturnValue(100);
    gate.beginAgentConversation("coach", h.storage); gate.subscribeSignInProgress(() => { throw new Error("FIXTURE_SUBSCRIBER"); }); h.bytes.set(KEY, "drift");
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow(); expect(gate.getAgentConversationStatus(h.storage)).toBe("unavailable"); expect(vi.getTimerCount()).toBe(0); expect(h.storage.setItem).not.toHaveBeenCalled();
  });
  it("actual async progress listener is observed and makes attempted end uncertain", async () => {
    const h = fixture("7"), gate = await import("@/lib/signInGate"), clock = vi.spyOn(Date, "now").mockReturnValue(100);
    gate.beginAgentConversation("coach", h.storage); gate.subscribeSignInProgress(() => Promise.reject(new Error("FIXTURE_ASYNC_SUBSCRIBER")));
    const { AgentTimeSaveError: RuntimeError } = await import("@/lib/agent-time-save");
    clock.mockReturnValue(110); errorStatus(() => gate.endAgentConversation("coach", h.storage), "uncertain", RuntimeError);
    await Promise.resolve(); expect(gate.getAgentConversationStatus(h.storage)).toBe("uncertain"); expect(h.bytes.get(KEY)).toBe("17"); expect(h.storage.setItem).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });

});
