import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.notify }));

function fixture(raw: string | null = "100") {
  let bytes = raw, current = true;
  const dispatch = vi.fn();
  vi.stubGlobal("window", { dispatchEvent: dispatch });
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 1, area: "local", isCurrent: () => current,
    getItem: vi.fn(() => bytes),
    setItem: vi.fn((_key: string, value: string) => { bytes = value; return current; }),
    removeItem: vi.fn(() => { bytes = null; return current; }), release: vi.fn(),
  };
  return { storage, dispatch, bytes: () => bytes, invalidate: () => { current = false; },
    physicalWrite: (value: string) => { bytes = value; } };
}
type Fixture = ReturnType<typeof fixture>;
function noDownstream(h: Fixture) {
  expect(h.dispatch).not.toHaveBeenCalled();
  expect(effects.notify).not.toHaveBeenCalled();
  expect(effects.persist).not.toHaveBeenCalled();
}
function noMutation(h: Fixture) {
  expect(h.storage.setItem).not.toHaveBeenCalled();
  expect(h.storage.removeItem).not.toHaveBeenCalled();
  noDownstream(h);
}
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("B17 numeric token acceptance on synthetic storage only", () => {
  it("non-browser explicit current handle cannot write, notify or persist positive amounts", async () => {
    const h = fixture(), tokens = await import("@/lib/tokens"); vi.stubGlobal("window", undefined);
    expect(tokens.getTokenBalance(h.storage)).toBe(100);
    expect(tokens.canAwardTokens(1, h.storage)).toBe(false);
    expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow(tokens.TokenMutationError);
    expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(h.bytes()).toBe("100"); noMutation(h);
  });
  it("non-browser healthy zero is still a no-op and malformed zero still refuses", async () => {
    const h = fixture(), tokens = await import("@/lib/tokens"); vi.stubGlobal("window", undefined);
    expect(tokens.canAwardTokens(0, h.storage)).toBe(true);
    expect(tokens.addTokens(0, undefined, undefined, h.storage)).toBe(100);
    expect(tokens.spendTokens(0, h.storage)).toBe(true); noMutation(h);
    h.physicalWrite("100junk");
    expect(tokens.canAwardTokens(0, h.storage)).toBe(false);
    expect(() => tokens.addTokens(0, undefined, undefined, h.storage)).toThrow(tokens.TokenMutationError);
    expect(tokens.spendTokens(0, h.storage)).toBe(false);
    expect(h.bytes()).toBe("100junk"); noMutation(h);
  });
  it("missing raw returns125 without seeding or preflight mutation", async () => {
    const h = fixture(null), tokens = await import("@/lib/tokens");
    expect(tokens.getTokenBalance(h.storage)).toBe(125);
    expect(tokens.canAwardTokens(1, h.storage)).toBe(true);
    expect(tokens.canAwardTokens(0, h.storage)).toBe(true);
    expect(h.bytes()).toBeNull(); noMutation(h);
  });
  it("first explicit award uses missing125 and retains default reward metadata", async () => {
    const h = fixture(null), tokens = await import("@/lib/tokens");
    expect(tokens.addTokens(1, undefined, undefined, h.storage)).toBe(126);
    expect(h.bytes()).toBe("126");
    expect(effects.notify).toHaveBeenCalledWith("reward", { amount: 1, reason: "Tokens earned", source: "app" });
    expect(effects.persist).toHaveBeenCalledWith("tokens", h.storage);
  });
  it.each([["0", 0], ["1", 1], ["125", 125], ["9007199254740991", Number.MAX_SAFE_INTEGER]] as const)(
    "canonical raw %s stays exact and is safe", async (raw, balance) => {
      const h = fixture(raw), tokens = await import("@/lib/tokens");
      expect(tokens.getTokenBalance(h.storage)).toBe(balance);
      expect(tokens.canAwardTokens(0, h.storage)).toBe(true);
      expect(h.bytes()).toBe(raw); noMutation(h);
    });
  it.each(["", "01", "+1", "-1", "-0", " 1", "1 ", "1\n", "1\r\n", "1e3", "1.0", "NaN", "Infinity",
    "125junk", "9007199254740992", "99999999999999999999999999"])(
    "malformed raw %j reads0 and refuses even zero while preserving exact bytes", async (raw) => {
      const h = fixture(raw), tokens = await import("@/lib/tokens");
      expect(tokens.getTokenBalance(h.storage)).toBe(0);
      for (const amount of [0, 1]) {
        expect(tokens.canAwardTokens(amount, h.storage)).toBe(false);
        expect(() => tokens.addTokens(amount, "FIXTURE_REASON", "FIXTURE_SOURCE", h.storage)).toThrow(tokens.TokenMutationError);
        expect(tokens.spendTokens(amount, h.storage)).toBe(false);
      }
      expect(h.bytes()).toBe(raw); noMutation(h);
    });
  it.each([-10, -0.01, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, "10", "", null, undefined, {}, []].map(input => ({ input })))(
    "invalid runtime amount %j has zero effects", async ({ input }) => {
      const amount = input as unknown as number;
      const h = fixture(), tokens = await import("@/lib/tokens");
      expect(tokens.canAwardTokens(amount, h.storage)).toBe(false);
      expect(() => tokens.addTokens(amount, "FIXTURE_REASON", "FIXTURE_SOURCE", h.storage)).toThrow(tokens.TokenMutationError);
      expect(tokens.spendTokens(amount, h.storage)).toBe(false);
      expect(h.bytes()).toBe("100"); noMutation(h);
    });
  it("does not coerce an object amount", async () => {
    const valueOf = vi.fn(() => 10), amount = { valueOf } as unknown as number;
    const h = fixture(), tokens = await import("@/lib/tokens");
    expect(tokens.canAwardTokens(amount, h.storage)).toBe(false);
    expect(() => tokens.addTokens(amount, undefined, undefined, h.storage)).toThrow(tokens.TokenMutationError);
    expect(tokens.spendTokens(amount, h.storage)).toBe(false);
    expect(valueOf).not.toHaveBeenCalled(); noMutation(h);
  });
  it.each([0, -0, 0.1, 0.49])("valid amount %s rounds to zero without any effects", async (amount) => {
    const h = fixture("125"), tokens = await import("@/lib/tokens");
    expect(tokens.canAwardTokens(amount, h.storage)).toBe(true);
    expect(tokens.addTokens(amount, undefined, undefined, h.storage)).toBe(125);
    expect(tokens.spendTokens(amount, h.storage)).toBe(true);
    expect(h.bytes()).toBe("125"); noMutation(h);
  });
  it.each([[0.5, 1], [1.49, 1], [1.5, 2]] as const)("award%s uses rounded delta%s", async (amount, delta) => {
    const h = fixture("10"), tokens = await import("@/lib/tokens");
    expect(tokens.addTokens(amount, "FIXTURE_REASON", "FIXTURE_SOURCE", h.storage)).toBe(10 + delta);
    expect(h.bytes()).toBe(String(10 + delta));
    expect(h.dispatch).toHaveBeenCalledOnce();
    expect((h.dispatch.mock.calls[0][0] as Event).type).toBe("coachfi-tokens");
    expect(effects.notify).toHaveBeenCalledWith("reward", { amount: delta, reason: "FIXTURE_REASON", source: "FIXTURE_SOURCE" });
    expect(effects.persist).toHaveBeenCalledOnce();
  });
  it.each([[0.5, 1], [1.49, 1], [1.5, 2]] as const)("spend%s uses rounded delta%s", async (amount, delta) => {
    const h = fixture("10"), tokens = await import("@/lib/tokens");
    expect(tokens.spendTokens(amount, h.storage)).toBe(true); expect(h.bytes()).toBe(String(10 - delta));
    expect(h.dispatch).toHaveBeenCalledOnce();
    expect(effects.notify).toHaveBeenCalledWith("reward", { amount: -delta, reason: "Tokens spent", source: "app" });
    expect(effects.persist).toHaveBeenCalledOnce();
  });
  it("award reaches the safe integer ceiling exactly", async () => {
    const h = fixture("9007199254740990"), tokens = await import("@/lib/tokens");
    expect(tokens.canAwardTokens(1, h.storage)).toBe(true);
    expect(tokens.addTokens(1, undefined, undefined, h.storage)).toBe(Number.MAX_SAFE_INTEGER);
    expect(h.bytes()).toBe("9007199254740991");
  });
  it("safe deltaMAX can be awarded to zero without numeric drift", async () => {
    const h = fixture("0"), tokens = await import("@/lib/tokens");
    expect(tokens.canAwardTokens(Number.MAX_SAFE_INTEGER, h.storage)).toBe(true);
    expect(tokens.addTokens(Number.MAX_SAFE_INTEGER, undefined, undefined, h.storage)).toBe(Number.MAX_SAFE_INTEGER);
    expect(h.bytes()).toBe("9007199254740991");
  });
  it("safe maximum spend ends at exact zero", async () => {
    const h = fixture("9007199254740991"), tokens = await import("@/lib/tokens");
    expect(tokens.spendTokens(Number.MAX_SAFE_INTEGER, h.storage)).toBe(true);
    expect(h.bytes()).toBe("0");
    expect(effects.notify).toHaveBeenCalledWith("reward", { amount: -Number.MAX_SAFE_INTEGER, reason: "Tokens spent", source: "app" });
  });
  it("overflow refuses before all side effects", async () => {
    const h = fixture("9007199254740991"), tokens = await import("@/lib/tokens");
    expect(tokens.canAwardTokens(1, h.storage)).toBe(false);
    expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow(tokens.TokenMutationError);
    expect(h.bytes()).toBe("9007199254740991"); noMutation(h);
  });
  it("insufficient rounded amount refuses but fractional spend within rounded balance succeeds", async () => {
    const h = fixture("1"), tokens = await import("@/lib/tokens");
    expect(tokens.spendTokens(1.5, h.storage)).toBe(false); noMutation(h);
    expect(tokens.spendTokens(1.4, h.storage)).toBe(true); expect(h.bytes()).toBe("0");
  });
  it("zero balance allows rounded-zero spend and refuses positive spend", async () => {
    const h = fixture("0"), tokens = await import("@/lib/tokens");
    expect(tokens.spendTokens(0.49, h.storage)).toBe(true);
    expect(tokens.spendTokens(0.5, h.storage)).toBe(false); noMutation(h);
  });
  it("stale handle reads0, refuses preflight/spend and preserves original add authority", async () => {
    const h = fixture(), tokens = await import("@/lib/tokens"); h.invalidate();
    expect(tokens.getTokenBalance(h.storage)).toBe(0);
    for (const amount of [0, 1]) {
      expect(tokens.canAwardTokens(amount, h.storage)).toBe(false);
      expect(tokens.spendTokens(amount, h.storage)).toBe(false);
      expect(() => tokens.addTokens(amount, undefined, undefined, h.storage)).toThrow("Storage session changed");
    }
    expect(h.storage.getItem).not.toHaveBeenCalled(); noMutation(h);
  });
  it.each(["get", "preflight", "add", "spend"] as const)("owner change during read fences %s", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    vi.mocked(h.storage.getItem).mockImplementation(() => { h.invalidate(); return "100"; });
    if (operation === "get") expect(tokens.getTokenBalance(h.storage)).toBe(0);
    if (operation === "preflight") expect(tokens.canAwardTokens(1, h.storage)).toBe(false);
    if (operation === "add") expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow("Storage session changed");
    if (operation === "spend") expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(h.bytes()).toBe("100"); noMutation(h);
  });
  it("blocked read fails closed even for zero without overwriting unknown bytes", async () => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    vi.mocked(h.storage.getItem).mockImplementation(() => { throw Object.assign(new Error("FIXTURE_BLOCKED"), { name: "SecurityError" }); });
    expect(tokens.getTokenBalance(h.storage)).toBe(0);
    for (const amount of [0, 1]) {
      expect(tokens.canAwardTokens(amount, h.storage)).toBe(false);
      expect(() => tokens.addTokens(amount, undefined, undefined, h.storage)).toThrow(tokens.TokenMutationError);
      expect(tokens.spendTokens(amount, h.storage)).toBe(false);
    }
    expect(h.bytes()).toBe("100"); noMutation(h);
  });
  it.each(["add", "spend"] as const)("rejected write prevents downstream effects for %s", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    vi.mocked(h.storage.setItem).mockReturnValue(false);
    if (operation === "add") expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow("Storage session changed");
    else expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(h.bytes()).toBe("100"); noDownstream(h);
  });
  it.each(["add", "spend"] as const)("quota throw cannot report success for %s", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    const quota = Object.assign(new Error("FIXTURE_QUOTA"), { name: "QuotaExceededError" });
    vi.mocked(h.storage.setItem).mockImplementation(() => { throw quota; });
    expect(() => operation === "add" ? tokens.addTokens(1, undefined, undefined, h.storage) : tokens.spendTokens(1, h.storage)).toThrow(quota);
    expect(h.bytes()).toBe("100"); noDownstream(h);
  });
  it.each(["add", "spend"] as const)("reentry after physical write returns no success for %s (no rollback claim)", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    vi.mocked(h.storage.setItem).mockImplementation((_key, value) => { h.physicalWrite(value); h.invalidate(); return false; });
    if (operation === "add") expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow("Storage session changed");
    else expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(h.bytes()).toBe(operation === "add" ? "101" : "99"); noDownstream(h);
  });
  it.each(["add", "spend"] as const)("token event reentry prevents later notification for %s", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    h.dispatch.mockImplementation(() => { h.invalidate(); });
    if (operation === "add") expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow("Storage session changed");
    else expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(h.dispatch).toHaveBeenCalledOnce();
    expect(effects.notify).not.toHaveBeenCalled(); expect(effects.persist).not.toHaveBeenCalled();
  });
  it.each(["add", "spend"] as const)("notification reentry prevents account persist for %s", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    effects.notify.mockImplementationOnce(() => { h.invalidate(); });
    if (operation === "add") expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow("Storage session changed");
    else expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(effects.notify).toHaveBeenCalledOnce(); expect(effects.persist).not.toHaveBeenCalled();
  });
  it.each(["add", "spend"] as const)("persist reentry cannot return success for %s", async (operation) => {
    const h = fixture(), tokens = await import("@/lib/tokens");
    effects.persist.mockImplementationOnce(() => { h.invalidate(); });
    if (operation === "add") expect(() => tokens.addTokens(1, undefined, undefined, h.storage)).toThrow("Storage session changed");
    else expect(tokens.spendTokens(1, h.storage)).toBe(false);
    expect(effects.persist).toHaveBeenCalledOnce();
  });
});
