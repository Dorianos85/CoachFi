import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), account: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.account }));
type CrisisModule = typeof import("@/lib/crisis-action-save");
type CrisisId = CrisisModule["CRISIS_ACTION_IDS"][number];
type WriteFault = "false" | "before_throw" | "after_throw" | "after_false";
const IDS = ["write-close-person", "call-creditor", "book-free-legal", "contact-mops", "sell-unused"] as const;
const MARKER = "coachfi-crisis-actions", TOKENS = "coachfi-tokens";
let crisis: CrisisModule;
let dispatch: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
let onEvent: ((event: Event) => void) | null;
let network: ReturnType<typeof vi.fn<typeof fetch>>;

function fixture(marker: string | null = null, balance: string | null = "125") {
  const bytes = new Map<string, string>([["FIXTURE_UNRELATED", "preserve exact sentinel"]]);
  if (marker !== null) bytes.set(MARKER, marker);
  if (balance !== null) bytes.set(TOKENS, balance);
  let current = true, readHook: ((key: string) => void) | null = null, writeHook: ((key: string) => void) | null = null;
  const faults = new Map<string, WriteFault>();
  const isCurrent = vi.fn(() => current);
  const get = vi.fn((key: string) => { readHook?.(key); return bytes.get(key) ?? null; });
  const set = vi.fn((key: string, value: string) => {
    const fault = faults.get(key);
    if (!current || fault === "false") return false;
    if (fault === "before_throw") throw new Error("FIXTURE_SET_BEFORE");
    bytes.set(key, value); writeHook?.(key);
    if (fault === "after_throw") throw new Error("FIXTURE_SET_AFTER");
    return fault !== "after_false" && current;
  });
  const remove = vi.fn((key: string) => { if (!current) return false; bytes.delete(key); return true; });
  const storage: PersonalStorageHandle = { owner: { kind: "guest" }, revision: 23, area: "local", isCurrent,
    getItem: get, setItem: set, removeItem: remove, release: () => { current = false; } };
  return { bytes, storage, get, set, remove, isCurrent, stop: () => { current = false; },
    onRead: (hook: ((key: string) => void) | null) => { readHook = hook; },
    onWrite: (hook: ((key: string) => void) | null) => { writeHook = hook; },
    failWrite: (key: string, mode: WriteFault) => { faults.set(key, mode); },
    allowWrite: (key: string) => { faults.delete(key); } };
}

function unchanged(state: ReturnType<typeof fixture>, before: Map<string, string>) {
  expect(state.bytes).toEqual(before); expect(state.set).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.account).not.toHaveBeenCalled();
}

function globallyQuarantined(controller: ReturnType<CrisisModule["createCrisisActionSaveController"]>,
  state: ReturnType<typeof fixture>, ticket: number) {
  const before = new Map(state.bytes), reads = state.get.mock.calls.length, writes = state.set.mock.calls.length;
  const events = dispatch.mock.calls.length, cloud = effects.cloud.mock.calls.length, account = effects.account.mock.calls.length;
  for (const id of IDS) {
    expect(controller.isOpen(ticket, id)).toBe(false);
    expect(controller.run(ticket, state.storage, id).status).toBe("uncertain");
  }
  expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(state.set).toHaveBeenCalledTimes(writes);
  expect(state.remove).not.toHaveBeenCalled(); expect(dispatch).toHaveBeenCalledTimes(events);
  expect(effects.cloud).toHaveBeenCalledTimes(cloud); expect(effects.account).toHaveBeenCalledTimes(account);
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); effects.cloud.mockReset(); effects.account.mockReset(); onEvent = null;
  dispatch = vi.fn((event) => { onEvent?.(event); return true; });
  vi.stubGlobal("window", { dispatchEvent: dispatch, localStorage: {
    getItem: () => { throw new Error("Real unbound storage forbidden in crisis review."); },
    setItem: () => { throw new Error("Real unbound storage forbidden in crisis review."); },
    removeItem: () => { throw new Error("Real unbound storage forbidden in crisis review."); },
  } });
  network = vi.fn<typeof fetch>(() => { throw new Error("Real network forbidden in crisis review."); });
  vi.stubGlobal("fetch", network); crisis = await import("@/lib/crisis-action-save");
});
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("B20 independent existing-cache and contract review", () => {
  it("exports exactly five existing IDs and the fixed15 reward", () => {
    expect(crisis.CRISIS_ACTION_IDS).toEqual(IDS); expect(Object.isFrozen(crisis.CRISIS_ACTION_IDS)).toBe(true);
    expect(crisis.CRISIS_ACTION_REWARD).toBe(15);
  });

  it.each([
    [null, []], ["[]", []], [' [ "sell-unused", "call-creditor" ]\n', ["sell-unused", "call-creditor"]],
    [JSON.stringify(IDS), [...IDS]],
  ] as const)("valid cache %s returns ready and preserves raw bytes/order", (raw, completed) => {
    const state = fixture(raw), before = new Map(state.bytes), result = crisis.readCrisisActions(state.storage);
    expect(result.status).toBe("ready"); expect(Object.isFrozen(result)).toBe(true);
    if (result.status === "ready") { expect(result.completed).toEqual(completed); expect(Object.isFrozen(result.completed)).toBe(true); }
    unchanged(state, before);
  });

  it.each([
    "", "null", "{}", "{broken", '"write-close-person"', "true", "15", '[null]', '[15]',
    '["unknown-action"]', '["write-close-person","write-close-person"]', '["call-creditor", "future-v2"]',
    '{"completed":["call-creditor"],"version":2}', '[{"id":"call-creditor","future":true}]',
    '["call-creditor "]', '["call-creditor\\n"]',
  ])("unknown/malformed cache %s is unavailable without normalization or overwrite", (raw) => {
    const state = fixture(raw), before = new Map(state.bytes);
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable"); unchanged(state, before);
  });

  it("cache read failure is unavailable without falling back to empty state", () => {
    const state = fixture('["sell-unused"]'), before = new Map(state.bytes);
    state.onRead(() => { throw new Error("FIXTURE_CACHE_READ"); });
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable"); unchanged(state, before);
  });

  it("stale and unknown current authority cannot read or expose action state", () => {
    const state = fixture(), before = new Map(state.bytes); state.stop();
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled();
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_UNKNOWN_CURRENT"); });
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("owner lost during cache get cannot report ready", () => {
    const state = fixture('["sell-unused"]'), before = new Map(state.bytes); state.onRead(state.stop);
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable"); unchanged(state, before);
  });

  it("SSR has unavailable state and zero storage calls", () => {
    const state = fixture(), before = new Map(state.bytes); vi.stubGlobal("window", undefined);
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable"); expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });
});

describe("B20 independent action write/failure review", () => {
  it("actual marker then real token mutation confirm success and allow other distinct actions", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    expect(Object.isFrozen(controller)).toBe(true); expect(ticket).toBe(0); expect(controller.isOpen(ticket, IDS[0])).toBe(true);
    expect(state.get).not.toHaveBeenCalled(); expect(state.isCurrent).not.toHaveBeenCalled();
    const first = controller.run(ticket, state.storage, IDS[0]); expect(first.status).toBe("saved"); expect(Object.isFrozen(first)).toBe(true);
    if (first.status === "saved") { expect(first.completed).toEqual([IDS[0]]); expect(first.balance).toBe(140); expect(Object.isFrozen(first.completed)).toBe(true); }
    expect(state.set.mock.calls).toEqual([[MARKER, JSON.stringify([IDS[0]])], [TOKENS, "140"]]);
    expect(state.bytes.get("FIXTURE_UNRELATED")).toBe("preserve exact sentinel");
    expect(controller.isOpen(ticket, IDS[0])).toBe(false); expect(controller.isOpen(ticket, IDS[1])).toBe(true);
    const before = new Map(state.bytes), reads = state.get.mock.calls.length;
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("ignored");
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads);
    const second = controller.run(ticket, state.storage, IDS[1]); expect(second.status).toBe("saved");
    if (second.status === "saved") { expect(second.completed).toEqual([IDS[0], IDS[1]]); expect(second.balance).toBe(155); }
    expect(state.bytes.get(TOKENS)).toBe("155"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0], IDS[1]]);
    expect(state.set).toHaveBeenCalledTimes(4); expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it("all five distinct actions award exactly75; repeated handlers add no points", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    for (const id of IDS) expect(controller.run(ticket, state.storage, id).status).toBe("saved");
    expect(state.bytes.get(TOKENS)).toBe("200"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual(IDS);
    const before = new Map(state.bytes), reads = state.get.mock.calls.length;
    for (const id of IDS) expect(controller.run(ticket, state.storage, id).status).toBe("ignored");
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(state.set).toHaveBeenCalledTimes(10);
  });

  it("already persisted action consumes only its own admission, no normalization or reward", () => {
    const raw = ' [ "sell-unused" ]\n', state = fixture(raw), before = new Map(state.bytes);
    const controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    expect(controller.run(ticket, state.storage, IDS[4]).status).toBe("already-done"); unchanged(state, before);
    expect(controller.isOpen(ticket, IDS[4])).toBe(false); expect(controller.isOpen(ticket, IDS[0])).toBe(true);
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("saved"); expect(state.bytes.get(TOKENS)).toBe("140");
    expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[4], IDS[0]]);
  });

  it("missing token balance uses existing125 default without touching unrelated data", () => {
    const state = fixture(null, null), controller = crisis.createCrisisActionSaveController();
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("saved");
    expect(state.bytes.get(TOKENS)).toBe("140"); expect(state.bytes.get("FIXTURE_UNRELATED")).toBe("preserve exact sentinel");
  });

  it.each(["future-action", "", "call-creditor ", "call-creditor\n", "__proto__"])(
    "unknown action %s rejects before any marker/reward effects and permits healthy action later", (id) => {
      const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
      // Runtime malformed values intentionally cross the public typed boundary.
      expect(controller.run(ticket, state.storage, id as unknown as CrisisId).status).toBe("retryable"); unchanged(state, before);
      expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("saved");
    });

  it.each(["0125", "125\n", "", "-1", "+125", "1e3", "125.0", " 125", "9007199254740992"])(
    "malformed balance %s rejects before marker mutation with exact bytes preserved", (raw) => {
      const state = fixture(null, raw), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
      expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("retryable"); unchanged(state, before);
    });

  it("overflow by one rejects before marker while exact upper boundary accepts15", () => {
    const bad = fixture(null, String(Number.MAX_SAFE_INTEGER - 14)), before = new Map(bad.bytes);
    const first = crisis.createCrisisActionSaveController();
    expect(first.run(first.version(), bad.storage, IDS[0]).status).toBe("retryable"); unchanged(bad, before);
    const good = fixture(null, String(Number.MAX_SAFE_INTEGER - 15)), second = crisis.createCrisisActionSaveController();
    expect(second.run(second.version(), good.storage, IDS[0]).status).toBe("saved");
    expect(good.bytes.get(TOKENS)).toBe(String(Number.MAX_SAFE_INTEGER));
  });

  it.each([MARKER, TOKENS])("preflight read denial for %s permits controlled retry without attempted writes", (key) => {
    const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    state.onRead((readKey) => { if (readKey === key) throw new Error("FIXTURE_PREFLIGHT_READ"); });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("retryable"); unchanged(state, before); state.onRead(null);
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("saved"); expect(state.bytes.get(TOKENS)).toBe("140");
  });

  it.each(['["future-action"]', '["call-creditor","call-creditor"]', '{"completed":[],"future":true}', "{broken"])(
    "malformed action cache %s cannot be reset by submission or awarded", (raw) => {
      const state = fixture(raw), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
      expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("retryable"); unchanged(state, before);
    });

  it.each([MARKER, TOKENS])("captured owner lost while reading %s stops all mutation", (key) => {
    const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
    state.onRead((readKey) => { if (key === readKey) state.stop(); });
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("stopped"); unchanged(state, before);
  });

  it("stale ticket refuses a poisoned handle before authority reads", () => {
    const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController(), old = controller.version();
    expect(controller.reset()).toBe(old + 1); state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_STALE_POISON"); });
    expect(controller.run(old, state.storage, IDS[0]).status).toBe("ignored"); expect(controller.isOpen(old, IDS[0])).toBe(false);
    expect(state.isCurrent).not.toHaveBeenCalled(); expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("unknown current authority stops without safe-retry or actions", () => {
    const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
    state.isCurrent.mockImplementation(() => { throw new Error("FIXTURE_UNKNOWN_CURRENT"); });
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("stopped");
    expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("SSR command cannot mutate even missing cache/balance", () => {
    const state = fixture(null, null), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
    vi.stubGlobal("window", undefined);
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("retryable"); unchanged(state, before);
  });

  it.each(["false", "before_throw", "after_throw", "after_false"] as const)(
    "marker setter %s causes global uncertainty and never starts token reward", (mode) => {
      const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version(); state.failWrite(MARKER, mode);
      expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
      expect(state.bytes.get(TOKENS)).toBe("125"); expect(state.bytes.has(MARKER)).toBe(mode === "after_throw" || mode === "after_false");
      expect(state.set).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled(); globallyQuarantined(controller, state, ticket);
    });

  it.each(["false", "before_throw", "after_throw", "after_false"] as const)(
    "token setter %s after marker causes global uncertainty without replaying any action", (mode) => {
      const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version(); state.failWrite(TOKENS, mode);
      expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
      expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
      expect(state.bytes.get(TOKENS)).toBe(mode === "after_throw" || mode === "after_false" ? "140" : "125");
      expect(state.set).toHaveBeenCalledTimes(2); globallyQuarantined(controller, state, ticket);
    });

  it("uncertain later action globally closes even an earlier successfully committed action", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("saved"); state.failWrite(MARKER, "false");
    expect(controller.run(ticket, state.storage, IDS[1]).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("140"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
    globallyQuarantined(controller, state, ticket);
  });

  it.each([MARKER, TOKENS])("lying %s setter true without actual bytes cannot produce saved", (key) => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    const delegate = state.set.getMockImplementation()!; state.set.mockImplementation((writeKey, value) => writeKey === key ? true : delegate(writeKey, value));
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    if (key === MARKER) expect(state.bytes.has(MARKER)).toBe(false); else expect(state.bytes.get(TOKENS)).toBe("125");
    globallyQuarantined(controller, state, ticket);
  });

  it.each([MARKER, TOKENS])("confirmation read failure for %s after its write causes uncertainty with no data repair", (key) => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version(); let hasWritten = false;
    state.onWrite((writeKey) => { if (writeKey === key) hasWritten = true; });
    state.onRead((readKey) => { if (hasWritten && readKey === key) throw new Error("FIXTURE_CONFIRMATION_READ"); });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]); globallyQuarantined(controller, state, ticket);
  });

  it.each(["event", "cloud", "account"] as const)("post-token %s failure cannot claim saved or let other actions run", (where) => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    if (where === "event") onEvent = () => { throw new Error("FIXTURE_TOKEN_EVENT"); };
    else effects[where].mockImplementation(() => { throw new Error("FIXTURE_TOKEN_EFFECT"); });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("140"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
    globallyQuarantined(controller, state, ticket);
  });

  it("synchronous token event deleting marker is detected, without repairing or replaying", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    onEvent = () => { state.bytes.delete(MARKER); };
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("140"); expect(state.bytes.has(MARKER)).toBe(false); globallyQuarantined(controller, state, ticket);
  });

  it("synchronous event adding another unconfirmed action to marker cannot publish a fully confirmed completion list", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    const changed = JSON.stringify([IDS[0], IDS[1]]); onEvent = () => { state.bytes.set(MARKER, changed); };
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    expect(state.bytes.get(MARKER)).toBe(changed); expect(state.bytes.get(TOKENS)).toBe("140"); globallyQuarantined(controller, state, ticket);
  });

  it("synchronous token event destroying awarded balance is detected, without repairing or replaying", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    onEvent = () => { state.bytes.set(TOKENS, "125"); };
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("125"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
    globallyQuarantined(controller, state, ticket);
  });

  it("same-epoch reentry while marker setter is running cannot execute another action", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    state.onWrite((key) => { if (key === MARKER) {
      expect(controller.isOpen(ticket, IDS[1])).toBe(false); expect(controller.run(ticket, state.storage, IDS[1]).status).toBe("ignored");
    } });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("saved"); expect(state.set).toHaveBeenCalledTimes(2);
    expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]); expect(state.bytes.get(TOKENS)).toBe("140");
  });

  it("reset from marker write does not release active lock and old run cannot award in new epoch", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version(); let next = -1;
    state.onWrite((key) => { if (key === MARKER) { next = controller.reset(); expect(controller.run(next, state.storage, IDS[1]).status).toBe("ignored"); } });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("stopped"); expect(controller.version()).toBe(next);
    expect(state.bytes.get(TOKENS)).toBe("125"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
    expect(state.set).toHaveBeenCalledOnce(); const before = new Map(state.bytes);
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("ignored"); expect(state.bytes).toEqual(before);
  });

  it.each([MARKER, TOKENS])("owner lost after %s setter stops captured operation and retains partial bytes", (key) => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(); state.onWrite((writeKey) => { if (key === writeKey) state.stop(); });
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("stopped");
    expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]); expect(state.bytes.get(TOKENS)).toBe(key === TOKENS ? "140" : "125");
    expect(dispatch).not.toHaveBeenCalled(); expect(state.set).toHaveBeenCalledTimes(key === TOKENS ? 2 : 1);
  });

  it("Promise returned by marker writer after physical mutation is uncertain, not a synchronous success", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    const delegate = state.set.getMockImplementation()!;
    state.set.mockImplementation((key, value) => { const result = delegate(key, value); return key === MARKER ? Promise.resolve(result) as unknown as boolean : result; });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain");
    expect(state.bytes.get(TOKENS)).toBe("125"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
    globallyQuarantined(controller, state, ticket);
  });

  it("Promise returned by cache read is unavailable/retryable before mutations", () => {
    const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
    state.get.mockImplementation((key) => key === MARKER ? Promise.resolve("[]") as unknown as string : state.bytes.get(key) ?? null);
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable");
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("retryable"); unchanged(state, before);
  });

  it("Promise current authority cannot be mistaken for truthy ownership", () => {
    const state = fixture(), before = new Map(state.bytes), controller = crisis.createCrisisActionSaveController();
    state.isCurrent.mockImplementation(() => Promise.resolve(true) as unknown as boolean);
    expect(crisis.readCrisisActions(state.storage).status).toBe("unavailable");
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("stopped");
    expect(state.get).not.toHaveBeenCalled(); unchanged(state, before);
  });

  it("marker writer returns rejecting native Promise after mutation without async false-success or replay", async () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(), ticket = controller.version();
    const delegate = state.set.getMockImplementation()!;
    state.set.mockImplementation((key, value) => {
      const result = delegate(key, value);
      return key === MARKER ? Promise.reject(new Error("FIXTURE_ASYNC_REJECT")) as unknown as boolean : result;
    });
    expect(controller.run(ticket, state.storage, IDS[0]).status).toBe("uncertain"); await Promise.resolve();
    expect(state.bytes.get(TOKENS)).toBe("125"); expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
    globallyQuarantined(controller, state, ticket);
  });

  it("retained trace from actual token persistence is inactive after run and cannot replay later", () => {
    const state = fixture(), controller = crisis.createCrisisActionSaveController(); let retained: PersonalStorageHandle | undefined;
    effects.account.mockImplementation((_kind: string, traced: PersonalStorageHandle) => { retained = traced; });
    expect(controller.run(controller.version(), state.storage, IDS[0]).status).toBe("saved");
    expect(retained).toBeDefined(); expect(retained).not.toBe(state.storage); expect(retained!.isCurrent()).toBe(false);
    expect(retained!.owner).toEqual(state.storage.owner); expect(retained!.revision).toBe(23); expect(retained!.area).toBe("local");
    const before = new Map(state.bytes), reads = state.get.mock.calls.length, writes = state.set.mock.calls.length;
    let raw: string | null = null; try { raw = retained!.getItem(MARKER); } catch { /* refusal is permitted */ }
    expect(raw).toBeNull();
    try { retained!.setItem(TOKENS, "155"); } catch { /* inactive trace */ }
    try { retained!.removeItem(MARKER); } catch { /* inactive trace */ }
    expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledTimes(reads); expect(state.set).toHaveBeenCalledTimes(writes); expect(state.remove).not.toHaveBeenCalled();
  });

  it("new controller cannot recover missing reward once action marker persisted: limitation remains explicit", () => {
    const state = fixture(), first = crisis.createCrisisActionSaveController(); state.failWrite(TOKENS, "false");
    expect(first.run(first.version(), state.storage, IDS[0]).status).toBe("uncertain"); expect(state.bytes.get(TOKENS)).toBe("125");
    state.allowWrite(TOKENS); const recreated = crisis.createCrisisActionSaveController();
    expect(recreated.run(recreated.version(), state.storage, IDS[0]).status).toBe("already-done"); expect(state.bytes.get(TOKENS)).toBe("125");
    expect(JSON.parse(state.bytes.get(MARKER)!)).toEqual([IDS[0]]);
  });
});
