import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQuizSaveController } from "@/lib/quiz-save";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.notify }));
function fixture() {
  let current = true;
  const bytes = new Map<string, string>([["coachfi-srs", "[]"], ["coachfi-tokens", "125"]]);
  const dispatch = vi.fn(); vi.stubGlobal("window", { dispatchEvent: dispatch });
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 1, area: "local", isCurrent: () => current,
    getItem: vi.fn((key: string) => bytes.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); return true; }),
    removeItem: vi.fn((key: string) => { bytes.delete(key); return true; }),
    release: vi.fn(() => { current = false; }),
  };
  return { storage, bytes, dispatch, invalidate: () => { current = false; } };
}
function record(traced: PersonalStorageHandle) {
  if (!traced.setItem("coachfi-srs", "FIXTURE_SRS")) throw new Error("FIXTURE_REFUSED");
}
type Fixture = ReturnType<typeof fixture>;
function noWrites(h: Fixture) {
  expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.storage.removeItem).not.toHaveBeenCalled();
  expect(h.dispatch).not.toHaveBeenCalled(); expect(effects.notify).not.toHaveBeenCalled();
  expect(effects.persist).not.toHaveBeenCalled();
}
beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("B18 frozen local synchronous save controller acceptance", () => {
  it("factory and results are frozen and version/reset fence old tickets", () => {
    const h = fixture(), c = createQuizSaveController(), callback = vi.fn(record);
    expect(Object.isFrozen(c)).toBe(true); expect(c.version()).toBe(0);
    expect(c.reset()).toBe(1); expect(c.reset()).toBe(2); expect(c.version()).toBe(2);
    const result = c.run(0, h.storage, callback);
    expect(result.status).toBe("ignored"); expect(Object.isFrozen(result)).toBe(true);
    expect(callback).not.toHaveBeenCalled(); expect(h.storage.getItem).not.toHaveBeenCalled(); noWrites(h);
  });
  it("commits only after ordered record and reward, then ignores duplicates", () => {
    const h = fixture(), c = createQuizSaveController(), calls: string[] = [];
    const write = vi.fn((traced: PersonalStorageHandle) => {
      expect(traced.owner).toBe(h.storage.owner); expect(traced.revision).toBe(1);
      expect(traced.area).toBe("local"); expect(Object.isFrozen(traced)).toBe(true);
      calls.push("record"); record(traced);
    });
    const reward = vi.fn(() => { calls.push("reward"); h.storage.setItem("coachfi-tokens", "150"); });
    expect(c.run(0, h.storage, write, reward).status).toBe("saved");
    expect(calls).toEqual(["record", "reward"]); expect(h.bytes.get("coachfi-tokens")).toBe("150");
    vi.mocked(h.storage.getItem).mockClear();
    expect(c.run(0, h.storage, write, reward).status).toBe("ignored");
    expect(write).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
    expect(h.storage.getItem).not.toHaveBeenCalled();
  });
  it("wrong answer can save SRS without a reward callback", () => {
    const h = fixture(), c = createQuizSaveController();
    expect(c.run(0, h.storage, record).status).toBe("saved");
    expect(h.bytes.get("coachfi-tokens")).toBe("125");
  });
  it.each(["coachfi-srs", "coachfi-tokens"])("initial %s read denial is retryable with zero callbacks or writes", key => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record), reward = vi.fn();
    vi.mocked(h.storage.getItem).mockImplementation(k => { if (k === key) throw new Error("FIXTURE_READ"); return h.bytes.get(k) ?? null; });
    expect(c.run(0, h.storage, write, reward).status).toBe("retryable");
    expect(write).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); noWrites(h);
    vi.mocked(h.storage.getItem).mockImplementation(k => h.bytes.get(k) ?? null);
    expect(c.run(0, h.storage, write, reward).status).toBe("saved");
    expect(write).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });
  it("only probes SRS/token access, without parsing or repairing their bytes", () => {
    const h = fixture(), c = createQuizSaveController();
    h.bytes.set("coachfi-srs", "FIXTURE_UNKNOWN_BYTES"); h.bytes.set("coachfi-tokens", "125junk");
    expect(c.run(0, h.storage, () => { throw new Error("FIXTURE_BEFORE_WRITE"); }).status).toBe("retryable");
    expect(vi.mocked(h.storage.getItem).mock.calls.map(call => call[0])).toEqual(["coachfi-srs", "coachfi-tokens"]);
    expect(h.bytes.get("coachfi-srs")).toBe("FIXTURE_UNKNOWN_BYTES");
    expect(h.bytes.get("coachfi-tokens")).toBe("125junk"); noWrites(h);
  });
  it("exception before mutation is retryable and does not invoke reward", () => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn();
    expect(c.run(0, h.storage, () => { throw new Error("FIXTURE_PRE_WRITE"); }, reward).status).toBe("retryable");
    expect(reward).not.toHaveBeenCalled(); noWrites(h);
    expect(c.run(0, h.storage, record, reward).status).toBe("saved");
  });
  it("record without traced mutation cannot call an opaque reward or claim saved", () => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn();
    expect(c.run(0, h.storage, () => undefined, reward).status).toBe("retryable");
    expect(reward).not.toHaveBeenCalled(); noWrites(h);
  });
  it("swallowed later read failure with zero mutation attempts remains retryable", () => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn();
    vi.mocked(h.storage.getItem).mockImplementationOnce(() => "[]").mockImplementationOnce(() => "125")
      .mockImplementationOnce(() => { throw new Error("FIXTURE_LATER_READ"); });
    expect(c.run(0, h.storage, traced => { try { traced.getItem("coachfi-srs"); } catch { /* no mutation attempted */ } }, reward).status).toBe("retryable");
    expect(reward).not.toHaveBeenCalled(); noWrites(h);
  });
  it("swallowed later read failure poisons the writer; invocation is uncertain even with no physical write", () => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn();
    vi.mocked(h.storage.getItem).mockImplementationOnce(() => "[]").mockImplementationOnce(() => "125")
      .mockImplementationOnce(() => { throw new Error("FIXTURE_LATER_READ"); });
    const write = vi.fn((traced: PersonalStorageHandle) => {
      try { traced.getItem("coachfi-srs"); } catch { /* swallowed by legacy reader */ }
      try { traced.setItem("coachfi-srs", "FIXTURE_BAD_SEED"); } catch { /* cannot convert fault to saved */ }
    });
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
    expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.bytes.get("coachfi-srs")).toBe("[]");
    expect(reward).not.toHaveBeenCalled();
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain"); expect(write).toHaveBeenCalledOnce();
  });
  it.each(["false", "throw", "write-then-throw", "same-bytes"] as const)(
    "setter mode %s quarantines after its invocation and never retries", mode => {
      const h = fixture(), c = createQuizSaveController(), reward = vi.fn();
      vi.mocked(h.storage.setItem).mockImplementation((key, value) => {
        if (mode === "false") return false;
        if (mode === "write-then-throw") h.bytes.set(key, value);
        if (mode === "same-bytes") { h.bytes.set(key, "[]"); return true; }
        throw new Error("FIXTURE_SET");
      });
      const write = vi.fn((traced: PersonalStorageHandle) => {
        try { traced.setItem("coachfi-srs", "FIXTURE_SRS"); } catch { /* prove sticky fault */ }
        if (mode === "same-bytes") throw new Error("FIXTURE_AFTER_SAME_BYTES");
      });
      expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
      expect(reward).not.toHaveBeenCalled(); expect(h.storage.setItem).toHaveBeenCalledOnce();
      expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
      expect(write).toHaveBeenCalledOnce(); expect(h.storage.setItem).toHaveBeenCalledOnce();
      expect(h.bytes.get("coachfi-srs")).toBe(mode === "write-then-throw" ? "FIXTURE_SRS" : "[]");
    });
  it.each(["false", "throw", "remove-then-throw"] as const)("remove mode%s is also an attempt, not retryable", mode => {
    const h = fixture(), c = createQuizSaveController();
    vi.mocked(h.storage.removeItem).mockImplementation(key => {
      if (mode === "false") return false;
      if (mode === "remove-then-throw") h.bytes.delete(key);
      throw new Error("FIXTURE_REMOVE");
    });
    expect(c.run(0, h.storage, traced => { try { traced.removeItem("coachfi-srs"); } catch { /* sticky */ } }).status).toBe("uncertain");
    expect(h.storage.removeItem).toHaveBeenCalledOnce();
    expect(h.bytes.has("coachfi-srs")).toBe(mode !== "remove-then-throw");
  });
  it("reward refusal after SRS is uncertain and cannot be retried on this ticket", () => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record);
    const reward = vi.fn(() => { throw new Error("FIXTURE_REWARD_REFUSAL"); });
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
    expect(h.bytes.get("coachfi-srs")).toBe("FIXTURE_SRS");
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
    expect(write).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });
  it("same-ticket reentry is ignored while the original attempt commits", () => {
    const h = fixture(), c = createQuizSaveController(), nested = vi.fn(record);
    expect(c.run(0, h.storage, traced => {
      expect(c.run(0, h.storage, nested).status).toBe("ignored"); record(traced);
    }).status).toBe("saved");
    expect(nested).not.toHaveBeenCalled(); expect(h.storage.setItem).toHaveBeenCalledOnce();
  });
  it.each(["record", "reward"] as const)("reset inside%s keeps in-flight until finally and stops the old ticket", phase => {
    const h = fixture(), c = createQuizSaveController(), nested = vi.fn(record);
    const reset = () => { expect(c.reset()).toBe(1); expect(c.run(1, h.storage, nested).status).toBe("ignored"); };
    const write = (traced: PersonalStorageHandle) => { record(traced); if (phase === "record") reset(); };
    const reward = vi.fn(() => { if (phase === "reward") reset(); });
    expect(c.run(0, h.storage, write, reward).status).toBe("stopped");
    if (phase === "record") expect(reward).not.toHaveBeenCalled();
    expect(nested).not.toHaveBeenCalled();
    expect(c.run(0, h.storage, nested).status).toBe("ignored");
    expect(c.run(1, h.storage, nested).status).toBe("saved"); expect(nested).toHaveBeenCalledOnce();
  });
  it("reset explicitly begins a new ticket; it does not acknowledge the old uncertain write", () => {
    const h = fixture(), c = createQuizSaveController();
    expect(c.run(0, h.storage, traced => { record(traced); throw new Error("FIXTURE_LATE"); }).status).toBe("uncertain");
    expect(c.reset()).toBe(1); expect(c.run(0, h.storage, record).status).toBe("ignored");
    expect(c.run(1, h.storage, record).status).toBe("saved");
  });
  it("stale before any action stops with zero reads/callbacks", () => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record); h.invalidate();
    expect(c.run(0, h.storage, write).status).toBe("stopped");
    expect(h.storage.getItem).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); noWrites(h);
  });
  it.each(["coachfi-srs", "coachfi-tokens"])("owner change during%s probe stops before callbacks", key => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record);
    vi.mocked(h.storage.getItem).mockImplementation(k => { if (k === key) h.invalidate(); return h.bytes.get(k) ?? null; });
    expect(c.run(0, h.storage, write).status).toBe("stopped"); expect(write).not.toHaveBeenCalled(); noWrites(h);
  });
  it("unknown owner currency cannot authorize callbacks", () => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record);
    h.storage.isCurrent = () => { throw new Error("FIXTURE_OWNER_UNAVAILABLE"); };
    expect(c.run(0, h.storage, write).status).toBe("stopped"); expect(write).not.toHaveBeenCalled(); noWrites(h);
  });
  it.each(["record", "reward"] as const)("owner lost inside%s returns stopped, not old UI success", phase => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn(() => { h.invalidate(); });
    const write = (traced: PersonalStorageHandle) => { record(traced); if (phase === "record") h.invalidate(); };
    expect(c.run(0, h.storage, write, reward).status).toBe("stopped");
    if (phase === "record") expect(reward).not.toHaveBeenCalled();
    expect(h.bytes.get("coachfi-srs")).toBe("FIXTURE_SRS");
  });
  it("retired trace cannot read/write/remove/release after saved", () => {
    const h = fixture(), c = createQuizSaveController(); let captured: PersonalStorageHandle | undefined;
    expect(c.run(0, h.storage, traced => { captured = traced; record(traced); }).status).toBe("saved");
    const traced = captured!; expect(traced.isCurrent()).toBe(false);
    vi.mocked(h.storage.getItem).mockClear(); vi.mocked(h.storage.setItem).mockClear();
    expect(() => traced.getItem("coachfi-srs")).toThrow("Storage session changed");
    expect(() => traced.setItem("coachfi-srs", "FIXTURE_LATE")).toThrow("Storage session changed");
    expect(() => traced.removeItem("coachfi-srs")).toThrow("Storage session changed");
    expect(() => traced.release()).toThrow("Storage session changed");
    expect(h.storage.getItem).not.toHaveBeenCalled(); expect(h.storage.setItem).not.toHaveBeenCalled();
    expect(h.storage.removeItem).not.toHaveBeenCalled(); expect(h.storage.release).not.toHaveBeenCalled();
  });
  it("no window is retryable without even probe or record calls", () => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record); vi.stubGlobal("window", undefined);
    expect(c.run(0, h.storage, write).status).toBe("retryable");
    expect(write).not.toHaveBeenCalled(); expect(h.storage.getItem).not.toHaveBeenCalled(); noWrites(h);
  });
  it("window lost during probe prevents record callback", () => {
    const h = fixture(), c = createQuizSaveController(), write = vi.fn(record);
    vi.mocked(h.storage.getItem).mockImplementation(k => { if (k === "coachfi-tokens") vi.stubGlobal("window", undefined); return h.bytes.get(k) ?? null; });
    expect(c.run(0, h.storage, write).status).toBe("retryable");
    expect(write).not.toHaveBeenCalled(); noWrites(h);
  });
  it("window lost after SRS makes reward uncertain and prevents callback", () => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn();
    expect(c.run(0, h.storage, traced => { record(traced); vi.stubGlobal("window", undefined); }, reward).status).toBe("uncertain");
    expect(reward).not.toHaveBeenCalled(); expect(h.bytes.get("coachfi-srs")).toBe("FIXTURE_SRS");
  });
  it.each(["before", "after"] as const)("record thenable%s mutation is never saved", phase => {
    const h = fixture(), c = createQuizSaveController(), reward = vi.fn(), then = vi.fn();
    expect(c.run(0, h.storage, traced => { if (phase === "after") record(traced); return { then }; }, reward).status)
      .toBe(phase === "before" ? "retryable" : "uncertain");
    expect(then).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled();
  });
  it("reward thenable after record is uncertain and never awaited/replayed", () => {
    const h = fixture(), c = createQuizSaveController(), then = vi.fn();
    expect(c.run(0, h.storage, record, () => ({ then })).status).toBe("uncertain"); expect(then).not.toHaveBeenCalled();
  });
  it("native rejected promise is observed but cannot become saved", async () => {
    const h = fixture(), c = createQuizSaveController();
    expect(c.run(0, h.storage, record, () => Promise.reject(new Error("FIXTURE_ASYNC_REWARD"))).status).toBe("uncertain");
    await Promise.resolve(); await Promise.resolve();
    expect(h.bytes.get("coachfi-tokens")).toBe("125");
  });
  it("async record cannot use retired trace after await", async () => {
    const h = fixture(), c = createQuizSaveController();
    expect(c.run(0, h.storage, async traced => { await Promise.resolve(); record(traced); }).status).toBe("retryable");
    await Promise.resolve(); await Promise.resolve(); noWrites(h);
  });
  it("actual SRS swallows a later get error but trace prevents seed and quarantines the attempted setter", async () => {
    const h = fixture(), c = createQuizSaveController(), srs = await import("@/lib/srs"), reward = vi.fn();
    vi.mocked(h.storage.getItem).mockImplementationOnce(() => "[]").mockImplementationOnce(() => "125")
      .mockImplementationOnce(() => { throw new Error("FIXTURE_LATER_READ"); });
    expect(c.run(0, h.storage, traced => srs.recordAnswer("FIXTURE_B18", true, traced), reward).status).toBe("uncertain");
    expect(h.bytes.get("coachfi-srs")).toBe("[]"); expect(h.storage.setItem).not.toHaveBeenCalled();
    expect(reward).not.toHaveBeenCalled();
  });
  it("actual SRS after initial token preflight can commit before refusal; controller quarantines without rerun", async () => {
    const h = fixture(), c = createQuizSaveController(), srs = await import("@/lib/srs"), tokens = await import("@/lib/tokens");
    expect(tokens.canAwardTokens(25, h.storage)).toBe(true);
    h.dispatch.mockImplementation((event: Event) => { if (event.type === "coachfi-learning") h.bytes.set("coachfi-tokens", "9007199254740991"); });
    const write = vi.fn((traced: PersonalStorageHandle) => srs.recordAnswer("FIXTURE_B18", true, traced));
    const reward = vi.fn(() => { tokens.addTokens(25, undefined, undefined, h.storage); });
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
    expect(srs.getCardById("FIXTURE_B18", h.storage)?.repetitions).toBe(1);
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain");
    expect(write).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
    expect(h.bytes.get("coachfi-tokens")).toBe("9007199254740991");
  });
  it.each(["event", "persist"] as const)("actual token150 + late%s failure stays uncertain with no double award", async failure => {
    const h = fixture(), c = createQuizSaveController(), srs = await import("@/lib/srs"), tokens = await import("@/lib/tokens");
    if (failure === "event") h.dispatch.mockImplementation((event: Event) => {
      if (event.type === "coachfi-tokens") throw new Error("FIXTURE_LATE_EVENT");
    });
    else effects.persist.mockImplementation((kind: string) => { if (kind === "tokens") throw new Error("FIXTURE_LATE_PERSIST"); });
    const write = vi.fn((traced: PersonalStorageHandle) => srs.recordAnswer("FIXTURE_B18", true, traced));
    const reward = vi.fn(() => { tokens.addTokens(25, undefined, undefined, h.storage); });
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain"); expect(h.bytes.get("coachfi-tokens")).toBe("150");
    expect(c.run(0, h.storage, write, reward).status).toBe("uncertain"); expect(h.bytes.get("coachfi-tokens")).toBe("150");
    expect(write).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
    expect(srs.getCardById("FIXTURE_B18", h.storage)?.repetitions).toBe(1);
  });
  it("actual SRS and token callbacks both return before saved; duplicate keeps exact150/one repetition", async () => {
    const h = fixture(), c = createQuizSaveController(), srs = await import("@/lib/srs"), tokens = await import("@/lib/tokens");
    const write = vi.fn((traced: PersonalStorageHandle) => srs.recordAnswer("FIXTURE_B18", true, traced));
    const reward = vi.fn(() => { tokens.addTokens(25, undefined, undefined, h.storage); });
    expect(c.run(0, h.storage, write, reward).status).toBe("saved");
    expect(c.run(0, h.storage, write, reward).status).toBe("ignored");
    expect(h.bytes.get("coachfi-tokens")).toBe("150"); expect(srs.getCardById("FIXTURE_B18", h.storage)?.repetitions).toBe(1);
    expect(write).toHaveBeenCalledOnce(); expect(reward).toHaveBeenCalledOnce();
  });
});
