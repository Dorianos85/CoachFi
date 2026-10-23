import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCrisisActionSaveController, readCrisisActions, CRISIS_ACTION_IDS, CRISIS_ACTION_REWARD, type CrisisActionId } from "@/lib/crisis-action-save";
import * as tokens from "@/lib/tokens";
import type { PersonalStorageHandle } from "@/lib/product-storage";
const effects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.notify }));
const [first, second, third] = CRISIS_ACTION_IDS;
function fixture() {
  let current = true;
  const bytes = new Map<string, string>([["coachfi-tokens", "125"]]);
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
function noEffects(h: ReturnType<typeof fixture>) {
  expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.storage.removeItem).not.toHaveBeenCalled();
  expect(h.dispatch).not.toHaveBeenCalled(); expect(effects.notify).not.toHaveBeenCalled(); expect(effects.persist).not.toHaveBeenCalled();
}
beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("B20 strict readonly crisis action cache", () => {
  it("frozen current IDs and reward match existing five action records", () => {
    expect(CRISIS_ACTION_IDS).toEqual(["write-close-person", "call-creditor", "book-free-legal", "contact-mops", "sell-unused"]);
    expect(CRISIS_ACTION_REWARD).toBe(15); expect(Object.isFrozen(CRISIS_ACTION_IDS)).toBe(true);
  });
  it.each([null, "[]", JSON.stringify([second, first]), JSON.stringify(CRISIS_ACTION_IDS)])("valid %s stays unchanged and preserves order", raw => {
    const h = fixture(); if (raw !== null) h.bytes.set("coachfi-crisis-actions", raw);
    const state = readCrisisActions(h.storage); expect(state).toEqual({ status: "ready", completed: raw === null ? [] : JSON.parse(raw) });
    expect(Object.isFrozen(state)).toBe(true); if (state.status === "ready") expect(Object.isFrozen(state.completed)).toBe(true);
    expect(h.bytes.get("coachfi-crisis-actions") ?? null).toBe(raw); noEffects(h);
  });
  it.each(["", "{", "null", "{}", '"write-close-person"', '[null]', '[1]', '["unknown"]', '["__proto__"]', '["constructor"]',
    JSON.stringify([first, first]), JSON.stringify([...CRISIS_ACTION_IDS, first]), JSON.stringify([first + "\n"]), '[[]]', '[{}]'])("malformed %s is unavailable and preserved", raw => {
    const h = fixture(); h.bytes.set("coachfi-crisis-actions", raw); expect(readCrisisActions(h.storage)).toEqual({ status: "unavailable" });
    expect(h.bytes.get("coachfi-crisis-actions")).toBe(raw); noEffects(h);
  });
  it.each(["stale", "owner-throw", "read-throw", "lost-during-read", "no-browser"])("unavailable %s never seeds an empty replacement", mode => {
    const h = fixture();
    if (mode === "stale") h.invalidate(); if (mode === "owner-throw") h.storage.isCurrent = () => { throw new Error("FIXTURE_OWNER"); };
    if (mode === "read-throw") vi.mocked(h.storage.getItem).mockImplementation(() => { throw new Error("FIXTURE_READ"); });
    if (mode === "lost-during-read") vi.mocked(h.storage.getItem).mockImplementation(() => { h.invalidate(); return null; });
    if (mode === "no-browser") vi.stubGlobal("window", undefined);
    expect(readCrisisActions(h.storage)).toEqual({ status: "unavailable" }); noEffects(h);
  });
  it("read-only rejected promise access is unavailable without unhandled rejection", async () => {
    const h = fixture(); vi.mocked(h.storage.getItem).mockReturnValue(Promise.reject(new Error("FIXTURE_ASYNC")) as unknown as string);
    expect(readCrisisActions(h.storage)).toEqual({ status: "unavailable" }); await Promise.resolve(); await Promise.resolve(); noEffects(h);
  });
});

describe("B20 bounded marker-before-reward controller", () => {
  it("frozen API isOpen is pure and stale ticket ignores before reads", () => {
    const h = fixture(), c = createCrisisActionSaveController(); expect(Object.isFrozen(c)).toBe(true); expect(c.isOpen(0)).toBe(true);
    expect(c.isOpen(0, first)).toBe(true); expect(c.isOpen(0, "__proto__" as CrisisActionId)).toBe(false); expect(c.reset()).toBe(1);
    expect(c.isOpen(0)).toBe(false); expect(c.run(0, h.storage, first)).toEqual({ status: "ignored" }); expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it("real helpers marker then reward save140; terminal first keeps other actions open", () => {
    const h = fixture(), c = createCrisisActionSaveController(); const result = c.run(0, h.storage, first);
    expect(result).toEqual({ status: "saved", completed: [first], balance: 140 }); expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.completed)).toBe(true);
    expect(vi.mocked(h.storage.setItem).mock.calls).toEqual([["coachfi-crisis-actions", JSON.stringify([first])], ["coachfi-tokens", "140"]]);
    expect(c.isOpen(0, first)).toBe(false); expect(c.isOpen(0, second)).toBe(true); expect(c.isOpen(0)).toBe(true);
    h.bytes.delete("coachfi-crisis-actions"); vi.mocked(h.storage.getItem).mockClear();
    expect(c.run(0, h.storage, first)).toEqual({ status: "ignored" }); expect(h.storage.getItem).not.toHaveBeenCalled(); expect(h.bytes.get("coachfi-tokens")).toBe("140");
  });
  it("all five actions can save sequentially once, with fresh preserved records and balance200", () => {
    const h = fixture(), c = createCrisisActionSaveController(); const completed: CrisisActionId[] = [];
    for (const id of CRISIS_ACTION_IDS) {
      completed.push(id); expect(c.run(0, h.storage, id)).toEqual({ status: "saved", completed: [...completed], balance: 125 + completed.length * 15 });
      expect(c.isOpen(0, id)).toBe(false);
    }
    expect(h.bytes.get("coachfi-tokens")).toBe("200"); expect(h.bytes.get("coachfi-crisis-actions")).toBe(JSON.stringify(CRISIS_ACTION_IDS));
  });
  it("fresh external action records between saves are retained instead of stale Set overwrite", () => {
    const h = fixture(), c = createCrisisActionSaveController(); expect(c.run(0, h.storage, first).status).toBe("saved");
    h.bytes.set("coachfi-crisis-actions", JSON.stringify([third, first]));
    expect(c.run(0, h.storage, second)).toEqual({ status: "saved", completed: [third, first, second], balance: 155 });
  });
  it("already-done records never claim historical reward or read token bytes", () => {
    const h = fixture(), c = createCrisisActionSaveController(); h.bytes.set("coachfi-crisis-actions", JSON.stringify([first])); h.bytes.set("coachfi-tokens", "BAD");
    expect(c.run(0, h.storage, first)).toEqual({ status: "already-done", completed: [first] });
    expect(vi.mocked(h.storage.getItem).mock.calls).toEqual([["coachfi-crisis-actions"]]); expect(c.isOpen(0, first)).toBe(false); expect(c.isOpen(0, second)).toBe(true); noEffects(h);
  });
  it.each(["", "unknown", "__proto__", "constructor", "toString", first + "\n", null, 0, {}])("unknown action %j is pre-read retryable", id => {
    const h = fixture(), c = createCrisisActionSaveController(); expect(c.run(0, h.storage, id as CrisisActionId)).toEqual({ status: "retryable" });
    expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it.each(["125junk", " 125", "0125", "125\n", "-1", "9007199254740992", "9007199254740991"])("bad/overflow balance %s refuses before marker", raw => {
    const h = fixture(), c = createCrisisActionSaveController(); h.bytes.set("coachfi-tokens", raw);
    expect(c.run(0, h.storage, first)).toEqual({ status: "retryable" }); expect(h.bytes.get("coachfi-tokens")).toBe(raw); expect(h.bytes.has("coachfi-crisis-actions")).toBe(false); noEffects(h);
  });
  it.each(["coachfi-crisis-actions", "coachfi-tokens"])("initial %s read denial is retryable and may recover without writes", key => {
    const h = fixture(), c = createCrisisActionSaveController();
    vi.mocked(h.storage.getItem).mockImplementation(k => { if (k === key) throw new Error("FIXTURE_READ"); return h.bytes.get(k) ?? null; });
    expect(c.run(0, h.storage, first)).toEqual({ status: "retryable" }); noEffects(h); expect(c.isOpen(0, first)).toBe(true);
    vi.mocked(h.storage.getItem).mockImplementation(k => h.bytes.get(k) ?? null); expect(c.run(0, h.storage, first).status).toBe("saved");
  });
  it.each(["coachfi-crisis-actions", "coachfi-tokens"].flatMap(key => ["false", "throw", "write-then-throw"].map(mode => ({ key, mode }))))(
    "$key $mode globally quarantines all actions without replay", ({ key, mode }) => {
      const h = fixture(), c = createCrisisActionSaveController();
      vi.mocked(h.storage.setItem).mockImplementation((k, value) => { if (k !== key) { h.bytes.set(k, value); return true; } if (mode === "false") return false; if (mode === "write-then-throw") h.bytes.set(k, value); throw new Error("FIXTURE_WRITE"); });
      expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); const count = vi.mocked(h.storage.setItem).mock.calls.length, bytes = new Map(h.bytes);
      for (const id of CRISIS_ACTION_IDS) { expect(c.isOpen(0, id)).toBe(false); expect(c.run(0, h.storage, id)).toEqual({ status: "uncertain" }); }
      expect(h.storage.setItem).toHaveBeenCalledTimes(count); expect(h.bytes).toEqual(bytes);
      expect(h.bytes.get("coachfi-tokens")).toBe(key === "coachfi-tokens" && mode === "write-then-throw" ? "140" : "125");
      expect(h.bytes.get("coachfi-crisis-actions") ?? null).toBe(key === "coachfi-tokens" || mode === "write-then-throw" ? JSON.stringify([first]) : null);
    });
  it.each(["marker", "tokens"])("lying %s writer cannot publish saved", kind => {
    const h = fixture(), c = createCrisisActionSaveController(), key = kind === "marker" ? "coachfi-crisis-actions" : "coachfi-tokens";
    vi.mocked(h.storage.setItem).mockImplementation((k, value) => { if (k !== key) h.bytes.set(k, value); return true; });
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); expect(h.bytes.get("coachfi-tokens")).toBe("125");
    if (kind === "marker") expect(effects.notify).not.toHaveBeenCalled();
  });
  it.each(["event", "notify", "persist"])("late %s failure keeps partial bytes and globally blocks", phase => {
    const h = fixture(), c = createCrisisActionSaveController(), fail = () => { throw new Error("FIXTURE_LATE"); };
    if (phase === "event") h.dispatch.mockImplementation(fail); if (phase === "notify") effects.notify.mockImplementation(fail); if (phase === "persist") effects.persist.mockImplementation(fail);
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); expect(h.bytes.get("coachfi-tokens")).toBe("140"); expect(h.bytes.get("coachfi-crisis-actions")).toBe(JSON.stringify([first]));
    expect(c.run(0, h.storage, second)).toEqual({ status: "uncertain" });
  });
  it.each(["delete-marker", "malform-marker", "delete-tokens", "malform-tokens", "change-tokens"])("event %s cannot create false saved", mutation => {
    const h = fixture(), c = createCrisisActionSaveController();
    h.dispatch.mockImplementation(() => {
      if (mutation === "delete-marker") h.bytes.delete("coachfi-crisis-actions"); if (mutation === "malform-marker") h.bytes.set("coachfi-crisis-actions", "BAD");
      if (mutation === "delete-tokens") h.bytes.delete("coachfi-tokens"); if (mutation === "malform-tokens") h.bytes.set("coachfi-tokens", "140junk"); if (mutation === "change-tokens") h.bytes.set("coachfi-tokens", "155");
    });
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); const bytes = new Map(h.bytes); expect(c.run(0, h.storage, second)).toEqual({ status: "uncertain" }); expect(h.bytes).toEqual(bytes);
  });
  it("same-ticket reentry for another action cannot overlap save", () => {
    const h = fixture(), c = createCrisisActionSaveController(), nested = vi.fn();
    h.dispatch.mockImplementation(() => { expect(c.isOpen(0, second)).toBe(false); nested(c.run(0, h.storage, second)); });
    expect(c.run(0, h.storage, first).status).toBe("saved"); expect(nested).toHaveBeenCalledWith({ status: "ignored" }); expect(h.bytes.get("coachfi-tokens")).toBe("140");
  });
  it("reset during event keeps in-flight until finally and stops old ticket", () => {
    const h = fixture(), c = createCrisisActionSaveController(), nested = vi.fn();
    h.dispatch.mockImplementation(() => { expect(c.reset()).toBe(1); expect(c.isOpen(1, second)).toBe(false); nested(c.run(1, h.storage, second)); });
    expect(c.run(0, h.storage, first)).toEqual({ status: "stopped" }); expect(nested).toHaveBeenCalledWith({ status: "ignored" }); expect(c.isOpen(1, second)).toBe(true); expect(c.run(0, h.storage, second)).toEqual({ status: "ignored" });
  });
  it.each(["initial", "read", "marker-write", "token-write", "event"])("owner loss %s suppresses stale result and later actions", phase => {
    const h = fixture(), c = createCrisisActionSaveController(); if (phase === "initial") h.invalidate();
    if (phase === "read") vi.mocked(h.storage.getItem).mockImplementation(key => { h.invalidate(); return h.bytes.get(key) ?? null; });
    if (phase === "marker-write" || phase === "token-write") vi.mocked(h.storage.setItem).mockImplementation((key, value) => { h.bytes.set(key, value); if (key === (phase === "marker-write" ? "coachfi-crisis-actions" : "coachfi-tokens")) h.invalidate(); return true; });
    if (phase === "event") h.dispatch.mockImplementation(h.invalidate);
    expect(c.run(0, h.storage, first)).toEqual({ status: "stopped" }); if (phase === "initial" || phase === "read") noEffects(h);
    if (phase === "marker-write") expect(h.bytes.get("coachfi-tokens")).toBe("125"); expect(c.run(0, h.storage, second)).toEqual({ status: "stopped" });
  });
  it("unprovable owner is stopped before reads", () => {
    const h = fixture(), c = createCrisisActionSaveController(); h.storage.isCurrent = () => { throw new Error("FIXTURE_OWNER"); };
    expect(c.run(0, h.storage, first)).toEqual({ status: "stopped" }); expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it("non-browser boundary retryable without reads", () => {
    const h = fixture(), c = createCrisisActionSaveController(); vi.stubGlobal("window", undefined);
    expect(c.run(0, h.storage, first)).toEqual({ status: "retryable" }); expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it("retained synchronous helper trace is retired after run", () => {
    const h = fixture(), c = createCrisisActionSaveController(); let trace: PersonalStorageHandle | undefined; const actual = tokens.addTokens;
    vi.spyOn(tokens, "addTokens").mockImplementation((amount, reason, source, storage) => { trace = storage; return actual(amount, reason, source, storage); });
    expect(c.run(0, h.storage, first).status).toBe("saved"); expect(trace!.isCurrent()).toBe(false);
    expect(() => trace!.setItem("coachfi-tokens", "155")).toThrow("Storage session changed"); expect(() => trace!.getItem("coachfi-tokens")).toThrow("Storage session changed"); expect(h.bytes.get("coachfi-tokens")).toBe("140");
  });
  it("async reward promise after marker is uncertain without awaited success", async () => {
    const h = fixture(), c = createCrisisActionSaveController(); vi.spyOn(tokens, "addTokens").mockReturnValue(Promise.reject(new Error("FIXTURE_ASYNC")) as unknown as number);
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); await Promise.resolve(); await Promise.resolve(); expect(h.bytes.get("coachfi-tokens")).toBe("125"); expect(h.bytes.get("coachfi-crisis-actions")).toBe(JSON.stringify([first]));
  });
  it("async current promise is stopped and rejection observed", async () => {
    const h = fixture(), c = createCrisisActionSaveController(); h.storage.isCurrent = () => Promise.reject(new Error("FIXTURE_ASYNC_CURRENT")) as unknown as boolean;
    expect(c.run(0, h.storage, first)).toEqual({ status: "stopped" }); await Promise.resolve(); await Promise.resolve(); noEffects(h);
  });
  it("promise setter is uncertain before reward without calling arbitrary then", () => {
    const h = fixture(), c = createCrisisActionSaveController(), then = vi.fn(); vi.mocked(h.storage.setItem).mockReturnValue({ then } as unknown as boolean);
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); expect(then).not.toHaveBeenCalled(); expect(h.storage.setItem).toHaveBeenCalledOnce(); expect(effects.notify).not.toHaveBeenCalled();
  });
  it.each(["false", "throw", "remove-then-throw"])("traced remove %s also globally quarantines", mode => {
    const h = fixture(), c = createCrisisActionSaveController(); vi.mocked(h.storage.removeItem).mockImplementation(key => { if (mode === "false") return false; if (mode === "remove-then-throw") h.bytes.delete(key); throw new Error("FIXTURE_REMOVE"); });
    vi.spyOn(tokens, "addTokens").mockImplementation((_amount, _reason, _source, storage) => { try { storage!.removeItem("coachfi-crisis-actions"); } catch { /* sticky fault */ } return 140; });
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); expect(c.run(0, h.storage, second)).toEqual({ status: "uncertain" }); expect(h.storage.removeItem).toHaveBeenCalledOnce();
  });
  it("remount limitation persisted marker prevents replay but cannot recover its missing reward", () => {
    const h = fixture(), c = createCrisisActionSaveController(); vi.mocked(h.storage.setItem).mockImplementation((key, value) => { if (key === "coachfi-tokens") return false; h.bytes.set(key, value); return true; });
    expect(c.run(0, h.storage, first)).toEqual({ status: "uncertain" }); expect(h.bytes.get("coachfi-tokens")).toBe("125");
    const remounted = createCrisisActionSaveController(); expect(remounted.run(0, h.storage, first)).toEqual({ status: "already-done", completed: [first] }); expect(h.bytes.get("coachfi-tokens")).toBe("125");
  });
});
