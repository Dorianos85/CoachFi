import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({
  cloud: vi.fn(), account: vi.fn(),
  afterCloud: null as null | (() => void),
}));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.account }));

type Tokens = typeof import("@/lib/tokens");
const KEY = "coachfi-tokens";
const MAX = 9007199254740991;
let tokens: Tokens;
let dispatch: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
let afterEvent: null | (() => void);
let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;
let unboundRead: ReturnType<typeof vi.fn<(key: string) => string | null>>;
let unboundWrite: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;

function fixture(raw: string | null, options: { stale?: boolean; readError?: Error; writeError?: Error } = {}) {
  const bytes = new Map<string, string>(raw === null ? [] : [[KEY, raw]]);
  let current = !options.stale;
  let afterRead: null | (() => void) = null;
  let afterWrite: null | (() => void) = null;
  const get = vi.fn((key: string) => {
    if (options.readError) throw options.readError;
    const value = bytes.get(key) ?? null;
    afterRead?.(); // May deliberately return a stale value to test the helper's post-read fence.
    return value;
  });
  const set = vi.fn((key: string, value: string) => {
    if (!current) return false;
    if (options.writeError) throw options.writeError;
    bytes.set(key, value); afterWrite?.(); return current;
  });
  const remove = vi.fn((key: string) => { if (!current) return false; bytes.delete(key); return true; });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 1, area: "local",
    isCurrent: () => current, getItem: get, setItem: set, removeItem: remove, release: () => { current = false; } };
  return { bytes, storage, get, set, remove,
    stop: () => { current = false; },
    onRead: (callback: () => void) => { afterRead = callback; },
    onWrite: (callback: () => void) => { afterWrite = callback; } };
}
function noEffects(state: ReturnType<typeof fixture>) {
  expect(state.set).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); effects.afterCloud = null; afterEvent = null;
  effects.cloud.mockImplementation(() => { effects.afterCloud?.(); });
  dispatch = vi.fn(() => { afterEvent?.(); return true; });
  unboundRead = vi.fn(() => { throw new Error("Unbound storage must not be accessed in this review."); });
  unboundWrite = vi.fn(() => { throw new Error("Unbound storage must not be accessed in this review."); });
  vi.stubGlobal("window", { dispatchEvent: dispatch, localStorage: { getItem: unboundRead, setItem: unboundWrite } });
  fetchSpy = vi.fn<typeof fetch>(() => { throw new Error("Real network is forbidden in independent token review."); });
  vi.stubGlobal("fetch", fetchSpy);
  // Executed only after the author's freeze signal. No real auth/session import.
  tokens = await import("@/lib/tokens");
});
afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled(); expect(unboundRead).not.toHaveBeenCalled(); expect(unboundWrite).not.toHaveBeenCalled();
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("B17 independent token numeric/data review (synthetic handles and effect spies)", () => {
  it("missing raw returns 125, zero does not initialize it, and a first reward25 stores150", () => {
    const state = fixture(null);
    expect(tokens.getTokenBalance(state.storage)).toBe(125);
    expect(tokens.canAwardTokens(0, state.storage)).toBe(true);
    expect(tokens.addTokens(0, "FIXTURE_ZERO", "app", state.storage)).toBe(125);
    expect(tokens.spendTokens(0, state.storage)).toBe(true);
    expect(state.bytes.has(KEY)).toBe(false); noEffects(state);
    expect(tokens.addTokens(25, "FIXTURE_FIRST_REWARD", "app", state.storage)).toBe(150);
    expect(state.bytes.get(KEY)).toBe("150"); expect(state.set).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledOnce();
    expect(effects.cloud).toHaveBeenCalledExactlyOnceWith("reward", { amount: 25, reason: "FIXTURE_FIRST_REWARD", source: "app" });
    expect(effects.account).toHaveBeenCalledExactlyOnceWith("tokens", state.storage);
  });

  it.each(["0", "1", "25", "125", "9007199254740990", "9007199254740991"])(
    "canonical safe raw %s is read without write or acknowledgement", (raw) => {
      const state = fixture(raw); expect(tokens.getTokenBalance(state.storage)).toBe(Number(raw));
      expect(tokens.canAwardTokens(0, state.storage)).toBe(true);
      expect(state.bytes.get(KEY)).toBe(raw); noEffects(state);
    });

  it.each(["25garbage", " 25", "25 ", "25\n", "25\r\n", "25\r", "25\t", "25\u2028", "25\u2029", "2.5", "", "-1", "NaN", "Infinity", "01", "00", "+25", "-0",
    "1e3", "0x19", "1_000", "9007199254740992", "999999999999999999999999999999"])(
    "malformed raw %j is retained exactly and rejects positive and zero operations", (raw) => {
      const state = fixture(raw); expect(tokens.getTokenBalance(state.storage)).toBe(0);
      for (const amount of [0, 0.49, 1]) {
        expect(tokens.canAwardTokens(amount, state.storage)).toBe(false);
        expect(() => tokens.addTokens(amount, "FIXTURE_BAD_CACHE", "app", state.storage)).toThrow(tokens.TokenMutationError);
        expect(tokens.spendTokens(amount, state.storage)).toBe(false);
      }
      expect(state.bytes.get(KEY)).toBe(raw); noEffects(state);
    });

  const invalidAmounts: Array<[string, unknown]> = [
    ["negative integer", -10], ["negative fraction", -0.01], ["NaN", NaN], ["positive Infinity", Infinity],
    ["negative Infinity", -Infinity], ["numeric string", "5"], ["empty string", ""], ["null", null],
    ["undefined", undefined], ["boolean", true], ["boxed number", new Number(5)], ["array", [5]],
    ["plain object", {}], ["BigInt", BigInt("5")], ["Symbol", Symbol("FIXTURE_AMOUNT")],
    ["unsafe rounded delta", 9007199254740992], ["finite huge number", Number.MAX_VALUE],
  ];
  it.each(invalidAmounts)("rejects %s without coercion, changing bytes or producing effects", (_label, input) => {
    const state = fixture("25"); const amount = input as number;
    expect(tokens.canAwardTokens(amount, state.storage)).toBe(false);
    expect(() => tokens.addTokens(amount, "FIXTURE_INVALID_AMOUNT", "app", state.storage)).toThrow(tokens.TokenMutationError);
    expect(tokens.spendTokens(amount, state.storage)).toBe(false);
    expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it("poisoned object amount never invokes valueOf/toString or any mutation effect", () => {
    const coercion = vi.fn(() => { throw new Error("Amount coercion forbidden"); });
    const amount = { valueOf: coercion, toString: coercion } as unknown as number;
    const state = fixture("25");
    expect(tokens.canAwardTokens(amount, state.storage)).toBe(false);
    expect(() => tokens.addTokens(amount, "FIXTURE_POISON", "app", state.storage)).toThrow(tokens.TokenMutationError);
    expect(tokens.spendTokens(amount, state.storage)).toBe(false);
    expect(coercion).not.toHaveBeenCalled(); expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it("negative spend cannot mint points", () => {
    const state = fixture("25"); expect(tokens.spendTokens(-10, state.storage)).toBe(false);
    expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it.each([0, -0, 0.1, 0.49])("valid rounded-zero amount %s is a complete no-op", (amount) => {
    const state = fixture("25"); expect(tokens.canAwardTokens(amount, state.storage)).toBe(true);
    expect(tokens.addTokens(amount, "FIXTURE_ZERO", "app", state.storage)).toBe(25);
    expect(tokens.spendTokens(amount, state.storage)).toBe(true);
    expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it("independent fixed rounding fixtures and BigInt addition oracle agree for all safe/overflow boundaries", () => {
    const amounts: Array<[number, bigint]> = [[0.49, BigInt("0")], [0.5, BigInt("1")], [0.51, BigInt("1")], [1.49, BigInt("1")], [1.5, BigInt("2")],
      [2.5, BigInt("3")], [25.4, BigInt("25")], [25.5, BigInt("26")], [MAX, BigInt("9007199254740991")]];
    const balances = [BigInt("0"), BigInt("1"), BigInt("25"), BigInt("125"), BigInt("9007199254740989"), BigInt("9007199254740990"), BigInt("9007199254740991")];
    for (const balance of balances) for (const [amount, delta] of amounts) {
      vi.clearAllMocks(); const state = fixture(String(balance)); const next = balance + delta;
      const allowed = next <= BigInt("9007199254740991");
      expect(tokens.canAwardTokens(amount, state.storage)).toBe(allowed); noEffects(state);
      if (!allowed) {
        expect(() => tokens.addTokens(amount, "FIXTURE_ORACLE", "app", state.storage)).toThrow(tokens.TokenMutationError);
        expect(state.bytes.get(KEY)).toBe(String(balance)); noEffects(state);
      } else {
        expect(tokens.addTokens(amount, "FIXTURE_ORACLE", "app", state.storage)).toBe(Number(next));
        expect(state.bytes.get(KEY)).toBe(String(next));
        if (delta === BigInt("0")) noEffects(state);
        else {
          expect(state.set).toHaveBeenCalledOnce(); expect(state.remove).not.toHaveBeenCalled();
          expect(dispatch).toHaveBeenCalledOnce(); expect(dispatch.mock.calls[0][0].type).toBe("coachfi-tokens");
          expect(effects.cloud).toHaveBeenCalledExactlyOnceWith("reward", { amount: Number(delta), reason: "FIXTURE_ORACLE", source: "app" });
          expect(effects.account).toHaveBeenCalledExactlyOnceWith("tokens", state.storage);
        }
      }
    }
  });

  it("independent fixed rounding and BigInt subtraction oracle agree; insufficient spend has no effects", () => {
    const amounts: Array<[number, bigint]> = [[0.49, BigInt("0")], [0.5, BigInt("1")], [1.5, BigInt("2")], [2.5, BigInt("3")], [25.5, BigInt("26")], [MAX, BigInt("9007199254740991")]];
    const balances = [BigInt("0"), BigInt("1"), BigInt("25"), BigInt("125"), BigInt("9007199254740991")];
    for (const balance of balances) for (const [amount, delta] of amounts) {
      vi.clearAllMocks(); const state = fixture(String(balance)); const next = balance - delta;
      expect(tokens.spendTokens(amount, state.storage)).toBe(next >= BigInt("0"));
      if (next < BigInt("0") || delta === BigInt("0")) {
        expect(state.bytes.get(KEY)).toBe(String(balance)); noEffects(state);
      } else {
        expect(state.bytes.get(KEY)).toBe(String(next)); expect(state.set).toHaveBeenCalledOnce();
        expect(dispatch).toHaveBeenCalledOnce(); expect(effects.cloud).toHaveBeenCalledExactlyOnceWith("reward", {
          amount: -Number(delta), reason: "Tokens spent", source: "app",
        });
        expect(effects.account).toHaveBeenCalledExactlyOnceWith("tokens", state.storage);
      }
    }
  });

  it("MAX overflow is rejected before writing even though the raw balance remains valid", () => {
    const state = fixture(String(MAX)); expect(tokens.getTokenBalance(state.storage)).toBe(MAX);
    expect(tokens.canAwardTokens(1, state.storage)).toBe(false);
    expect(() => tokens.addTokens(1, "FIXTURE_OVERFLOW", "app", state.storage)).toThrow(tokens.TokenMutationError);
    expect(state.bytes.get(KEY)).toBe(String(MAX)); noEffects(state);
  });

  it("stale handle returns0 and rejects positive/zero operations without even reading old bytes", () => {
    const state = fixture("25", { stale: true }); expect(tokens.getTokenBalance(state.storage)).toBe(0);
    for (const amount of [0, 1]) {
      expect(tokens.canAwardTokens(amount, state.storage)).toBe(false);
      expect(() => tokens.addTokens(amount, "FIXTURE_STALE", "app", state.storage)).toThrow("Storage session changed");
      expect(tokens.spendTokens(amount, state.storage)).toBe(false);
    }
    expect(state.get).not.toHaveBeenCalled(); expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it("blocked reads are fail-closed for get/preflight/add/spend, including zero", () => {
    const state = fixture("25", { readError: new Error("FIXTURE_READ_BLOCKED") });
    expect(tokens.getTokenBalance(state.storage)).toBe(0);
    for (const amount of [0, 1]) {
      expect(tokens.canAwardTokens(amount, state.storage)).toBe(false);
      expect(() => tokens.addTokens(amount, "FIXTURE_BLOCKED", "app", state.storage)).toThrow(tokens.TokenMutationError);
      expect(tokens.spendTokens(amount, state.storage)).toBe(false);
    }
    expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it.each(["get", "preflight", "add", "spend"] as const)("%s discards a value whose read invalidated the captured handle", (action) => {
    const state = fixture("25"); state.onRead(state.stop);
    if (action === "get") expect(tokens.getTokenBalance(state.storage)).toBe(0);
    else if (action === "preflight") expect(tokens.canAwardTokens(1, state.storage)).toBe(false);
    else if (action === "add") expect(() => tokens.addTokens(1, "FIXTURE_REENTRY", "app", state.storage)).toThrow();
    else expect(tokens.spendTokens(1, state.storage)).toBe(false);
    expect(state.bytes.get(KEY)).toBe("25"); noEffects(state);
  });

  it.each(["add", "spend"] as const)("%s quota propagates without success event or account/cloud notification", (action) => {
    const quota = new Error("FIXTURE_QUOTA"); const state = fixture("25", { writeError: quota });
    const run = () => action === "add" ? tokens.addTokens(1, "FIXTURE_QUOTA", "app", state.storage) : tokens.spendTokens(1, state.storage);
    expect(run).toThrow(quota); expect(state.bytes.get(KEY)).toBe("25"); expect(state.set).toHaveBeenCalledOnce();
    expect(dispatch).not.toHaveBeenCalled(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
  });

  it.each(["add", "spend"] as const)("%s post-write invalidation blocks every later effect without pretending rollback", (action) => {
    const state = fixture("25"); state.onWrite(state.stop);
    const run = () => action === "add" ? tokens.addTokens(1, "FIXTURE_WRITE_REENTRY", "app", state.storage) : tokens.spendTokens(1, state.storage);
    if (action === "add") expect(run).toThrow(); else expect(run()).toBe(false);
    expect(state.bytes.get(KEY)).toBe(action === "add" ? "26" : "24");
    expect(state.set).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
    expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
  });

  it.each(["add", "spend"] as const)("%s event reentry allows only the already dispatched event, never cloud/account", (action) => {
    const state = fixture("25"); afterEvent = state.stop;
    const run = () => action === "add" ? tokens.addTokens(1, "FIXTURE_EVENT_REENTRY", "app", state.storage) : tokens.spendTokens(1, state.storage);
    if (action === "add") expect(run).toThrow(); else expect(run()).toBe(false);
    expect(state.bytes.get(KEY)).toBe(action === "add" ? "26" : "24");
    expect(dispatch).toHaveBeenCalledOnce(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
  });

  it.each(["add", "spend"] as const)("%s cloud-bridge reentry prevents the later account callback", (action) => {
    const state = fixture("25"); effects.afterCloud = state.stop;
    const run = () => action === "add" ? tokens.addTokens(1, "FIXTURE_CLOUD_REENTRY", "app", state.storage) : tokens.spendTokens(1, state.storage);
    if (action === "add") expect(run).toThrow(); else expect(run()).toBe(false);
    expect(state.bytes.get(KEY)).toBe(action === "add" ? "26" : "24");
    expect(dispatch).toHaveBeenCalledOnce(); expect(effects.cloud).toHaveBeenCalledOnce(); expect(effects.account).not.toHaveBeenCalled();
  });

  it.each([[null, 125], ["25", 25]] as const)("without a browser raw %j rejects positive mutations while healthy zero stays pure", (raw, balance) => {
    vi.stubGlobal("window", undefined);
    const state = fixture(raw); const original = new Map(state.bytes);
    expect(tokens.getTokenBalance(state.storage)).toBe(balance);
    for (const amount of [0.5, 1, 25]) {
      expect(tokens.canAwardTokens(amount, state.storage)).toBe(false);
      expect(() => tokens.addTokens(amount, "FIXTURE_NO_BROWSER", "app", state.storage)).toThrow(tokens.TokenMutationError);
      expect(tokens.spendTokens(amount, state.storage)).toBe(false);
    }
    for (const amount of [0, -0, 0.49]) {
      expect(tokens.canAwardTokens(amount, state.storage)).toBe(true);
      expect(tokens.addTokens(amount, "FIXTURE_NO_BROWSER_ZERO", "app", state.storage)).toBe(balance);
      expect(tokens.spendTokens(amount, state.storage)).toBe(true);
    }
    expect(state.bytes).toEqual(original); noEffects(state);
  });

  it("without a browser malformed zero remains fail-closed rather than becoming a healthy no-op", () => {
    vi.stubGlobal("window", undefined);
    const state = fixture("25garbage"); expect(tokens.getTokenBalance(state.storage)).toBe(0);
    expect(tokens.canAwardTokens(0, state.storage)).toBe(false);
    expect(() => tokens.addTokens(0, "FIXTURE_NO_BROWSER_BAD", "app", state.storage)).toThrow(tokens.TokenMutationError);
    expect(tokens.spendTokens(0, state.storage)).toBe(false);
    expect(state.bytes.get(KEY)).toBe("25garbage"); noEffects(state);
  });
});
