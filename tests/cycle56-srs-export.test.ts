import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle, StorageOwner } from "@/lib/product-storage";

// Actual sanitizer, collector, paired builder, strict Review read and owner leases.
// Only downstream writer effects are replaced; no SRS writer/controller is run.
const writerEffects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: writerEffects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: writerEffects.notify }));

const NOW = "2026-10-18T22:30:00.000Z";
const DAY = "2026-10-19";
const PRIVATE = "TEST_C56_PRIVATE_NOT_SELECTED_DATA";
const KEY = "coachfi-srs";
const card = (id = "inflation-basics", interval = 7, repetitions = 2, easeFactor = 2.5) => ({
  id, interval, repetitions, easeFactor, nextReview: DAY,
});
const neighbor = () => card("emergency-fund", 14, 3, 2.6);
const malformed = [
  { name: "fractional interval", value: card("inflation-basics", 1.5) },
  { name: "fractional repetitions", value: card("inflation-basics", 7, 0.5) },
] as const;
const owners: Array<{ name: string; owner: StorageOwner }> = [
  { name: "guest", owner: { kind: "guest" } },
  { name: "current account", owner: { kind: "account", provider: "cdp", userId: PRIVATE } },
];

let store: typeof import("@/lib/product-storage");
let data: typeof import("@/lib/data-export");
let review: typeof import("@/lib/review-save");
let local: Map<string, string>;
let session: Map<string, string>;
let physicalLocal: ReturnType<typeof physicalStorage>;
let physicalSession: ReturnType<typeof physicalStorage>;
let onRead: ((area: "local" | "session", key: string) => void) | undefined;
let outbound: ReturnType<typeof vi.fn>;
let event: ReturnType<typeof vi.fn>;
let observations: Array<Record<string, unknown>>;

function physicalStorage(values: Map<string, string>, area: "local" | "session") {
  return {
    getItem: vi.fn((key: string) => {
      const value = values.get(key) ?? null;
      onRead?.(area, key);
      return value;
    }),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
}

function snapshotData() {
  return { local: [...local.entries()], session: [...session.entries()] };
}

function snapshot() {
  return { ...snapshotData(), owner: store.getStorageOwnershipSnapshot(), events: event.mock.calls.length };
}

function clearPhysicalCalls() {
  for (const storage of [physicalLocal, physicalSession]) {
    storage.getItem.mockClear();
    storage.setItem.mockClear();
    storage.removeItem.mockClear();
  }
}

function seedOwnerRaw(
  localValues: Record<string, string>,
  sessionValues: Record<string, string> = {},
  owner: StorageOwner = { kind: "guest" },
) {
  const lease = store.beginStorageOwner(owner);
  for (const [values, handle] of [[localValues, lease.storage], [sessionValues, lease.sessionStorage]] as const) {
    for (const [key, raw] of Object.entries(values)) expect(handle.setItem(key, raw)).toBe(true);
  }
  expect(lease.publishReady()).toBe(true);
  clearPhysicalCalls();
  return { local: store.captureCurrentPersonalStorage(), session: store.captureCurrentPersonalStorage("session") };
}

function traced(handle: PersonalStorageHandle) {
  return { ...handle, getItem: vi.fn((key: string) => handle.getItem(key)) };
}

function strictReadWitness(handle: PersonalStorageHandle) {
  try { return { status: "available", cards: review.readReviewCards(handle) } as const; }
  catch (error) { return { status: "unavailable", error: error instanceof Error ? error.message : String(error) } as const; }
}

function seedOtherScopes() {
  local.set(KEY, JSON.stringify([card("saving-habit", 33)]));
  session.set(KEY, JSON.stringify([card("saving-habit", 44)]));
  seedOwnerRaw({ [KEY]: JSON.stringify([card("saving-habit", 55)]) },
    { [KEY]: JSON.stringify([card("saving-habit", 66)]) },
    { kind: "account", provider: "cdp", userId: "TEST_C56_OTHER_ACCOUNT" });
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  writerEffects.persist.mockClear();
  writerEffects.notify.mockClear();
  local = new Map();
  session = new Map();
  onRead = undefined;
  observations = [];
  physicalLocal = physicalStorage(local, "local");
  physicalSession = physicalStorage(session, "session");
  event = vi.fn(() => true);
  vi.stubGlobal("window", { localStorage: physicalLocal, sessionStorage: physicalSession, dispatchEvent: event });
  outbound = vi.fn(() => { throw new Error("No network is authorized in C56 fixtures"); });
  vi.stubGlobal("fetch", outbound);
  store = await import("@/lib/product-storage");
  data = await import("@/lib/data-export");
  review = await import("@/lib/review-save");
});

afterEach(() => {
  // Printed even after a primary assertion fails; synthetic observations do not
  // turn a failing test into a pass or count as additional test cases.
  console.info("C56_SRS_EXPORT_OBSERVATIONS " + JSON.stringify({
    test: expect.getState().currentTestName, observations,
  }));
  try {
    expect(outbound).not.toHaveBeenCalled();
    expect(writerEffects.persist).not.toHaveBeenCalled();
    expect(writerEffects.notify).not.toHaveBeenCalled();
    for (const storage of [physicalLocal, physicalSession]) {
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.removeItem).not.toHaveBeenCalled();
    }
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});

describe("C56 selected SRS sanitizer and actual strict Review witness", () => {
  it.each(malformed)("omits $name rather than exporting or rounding a card rejected by Review", ({ value }) => {
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify([value]) });
    const before = snapshot(), original = structuredClone(value);
    const witness = strictReadWitness(handles.local);
    const clean = data.sanitizeProductValue(KEY, [value]);
    observations.push({ input: value, witness, clean });
    expect(value).toEqual(original);
    expect(snapshot()).toEqual(before);
    expect(witness).toEqual({ status: "unavailable", error: "Review card schema is unavailable" });
    expect(clean).toEqual([]);
  });

  it.each([
    { name: "inclusive lower whole counters and minimum ease", value: card("inflation-basics", 1, 0, 1.3) },
    { name: "inclusive upper whole counters and fractional ease", value: card("inflation-basics", 90, 100000, 2.5) },
  ])("keeps $name without rounding or mutation", ({ value }) => {
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify([value]) });
    const before = snapshot();
    const witness = strictReadWitness(handles.local);
    const clean = data.sanitizeProductValue(KEY, [value]);
    observations.push({ input: value, witness, clean });
    expect(witness).toEqual({ status: "available", cards: [value] });
    expect(clean).toEqual([value]);
    expect(snapshot()).toEqual(before);
  });

  it("preserves export-only lower interval and caps despite wider strict Review admission", () => {
    const values = [card("inflation-basics", 0, 0), card("inflation-basics", 91), card("inflation-basics", 7, 100001)];
    for (const value of values) {
      const handles = seedOwnerRaw({ [KEY]: JSON.stringify([value]) });
      const before = snapshot();
      const witness = strictReadWitness(handles.local);
      const clean = data.sanitizeProductValue(KEY, [value]);
      observations.push({ input: value, witness, clean });
      expect(witness).toEqual({ status: "available", cards: [value] });
      expect(clean).toEqual([]);
      expect(data.collectProductStorage(handles.local)).toEqual({ [KEY]: [] });
      expect(snapshot()).toEqual(before);
    }
  });

  it("keeps JSON numeric whole-value forms without imposing a lexical raw-number policy", () => {
    const raw = '[ { "id":"inflation-basics", "interval":7.0, "repetitions":2e0, "easeFactor":2.5, "nextReview":"2026-10-19" } ]';
    const handles = seedOwnerRaw({ [KEY]: raw });
    const before = snapshot(), witness = strictReadWitness(handles.local);
    const clean = data.collectProductStorage(handles.local);
    observations.push({ raw, witness, clean });
    expect(witness).toEqual({ status: "available", cards: [card()] });
    expect(clean).toEqual({ [KEY]: [card()] });
    expect(snapshot()).toEqual(before);
  });

  it("preserves omission of nonnumeric, nonfinite, unsafe, unknown-ID and invalid-date cards", () => {
    const values: unknown[] = [null, [], {}, { ...card(), id: PRIVATE }, { ...card(), nextReview: "2026-02-30" },
      { ...card(), nextReview: "2026-2-03" }, { ...card(), easeFactor: 1.2 }, { ...card(), easeFactor: Infinity }];
    for (const field of ["interval", "repetitions"] as const) {
      for (const value of [-1, "7", null, undefined, true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        values.push({ ...card(), [field]: value });
      }
    }
    const original = structuredClone(values), before = snapshot();
    const clean = data.sanitizeProductValue(KEY, values);
    observations.push({ inputCount: values.length, clean });
    expect(clean).toEqual([]);
    expect(values).toEqual(original);
    expect(snapshot()).toEqual(before);
  });

  it("retains fractional monetary fields in the existing generic numeric export branch", () => {
    const value = { score: 50.25, createdAt: NOW, answers: {
      monthlyIncome: 4000.5, monthlyExpenses: 3000.75, savings: 999.25, debt: 12.5, cashHeld: 3.75,
      hasEmergencyFund: false, mainFinancialGoal: PRIVATE,
    } };
    const handles = seedOwnerRaw({ "coachfi-health-check": JSON.stringify(value) });
    const before = snapshot(), original = structuredClone(value);
    const clean = data.collectProductStorage(handles.local);
    observations.push({ clean });
    expect(clean).toEqual({ "coachfi-health-check": {
      score: 50.25, createdAt: NOW, currency: "legacy_unspecified", answers: {
        monthlyIncome: 4000.5, monthlyExpenses: 3000.75, savings: 999.25, debt: 12.5, cashHeld: 3.75,
        hasEmergencyFund: false,
      },
    } });
    expect(value).toEqual(original);
    expect(snapshot()).toEqual(before);
  });

  it("preserves the first-1000 export slice and duplicate policy without claiming strict-reader parity", () => {
    const values = [...Array.from({ length: 1000 }, () => card()), neighbor()];
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify(values) });
    const before = snapshot(), original = structuredClone(values);
    const witness = strictReadWitness(handles.local);
    const clean = data.sanitizeProductValue(KEY, values);
    observations.push({ inputCount: values.length, witness, cleanCount: Array.isArray(clean) ? clean.length : null });
    expect(witness).toEqual({ status: "unavailable", error: "Review card schema is unavailable" });
    expect(clean).toEqual(values.slice(0, 1000));
    expect(clean).not.toContainEqual(neighbor());
    expect(values).toEqual(original);
    expect(snapshot()).toEqual(before);
  });
});

describe("C56 actual selected collector", () => {
  it.each(malformed)("omits only $name and rebuilds a valid neighbor from exactly five fields", ({ value }) => {
    const raw = JSON.stringify([{ ...value, private: PRIVATE }, { ...neighbor(), identity: { access_token: PRIVATE }, note: PRIVATE }]);
    const handles = seedOwnerRaw({ [KEY]: raw, "coachfi-tokens": "125",
      "coachfi-user": JSON.stringify({ setupDone: true, name: PRIVATE, goal: PRIVATE }) });
    local.set("coachfi-locale-v1", "pl"); local.set("coachfi-auth", PRIVATE);
    const before = snapshot(), handle = traced(handles.local);
    const witness = strictReadWitness(handles.local);
    const clean = data.collectProductStorage(handle);
    observations.push({ raw, witness, clean });
    expect(handle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(snapshot()).toEqual(before);
    expect(witness).toEqual({ status: "unavailable", error: "Review card schema is unavailable" });
    expect(clean).toEqual({ [KEY]: [neighbor()], "coachfi-tokens": 125,
      "coachfi-user": { setupDone: true }, "coachfi-locale-v1": "pl" });
    expect(JSON.stringify(clean)).not.toMatch(/TEST_C56_|identity|access_token|private|note/);
  });

  it("propagates a denied SRS read without fabricating an empty successful export", () => {
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify([card()]) });
    const before = snapshot(), denied = new Error("TEST_C56_STORAGE_DENIED");
    onRead = (area, key) => { if (area === "local" && key === KEY) throw denied; };
    expect(() => data.collectProductStorage(handles.local)).toThrow(denied);
    expect(() => data.buildOwnedLocalDataExport(handles.local, handles.session)).toThrow(denied);
    expect(snapshot()).toEqual(before);
    observations.push({ deniedReadPropagated: true, bytesAndOwnerUnchanged: true });
  });
});

describe("C56 actual paired current-owner builder", () => {
  const ownedMalformed = owners.flatMap(owner => malformed.flatMap(item =>
    (["local", "session"] as const).map(area => ({ ...owner, ...item, area }))));

  it.each(ownedMalformed)("omits $name for $owner.kind in $area with no fallback or raw repair", ({ owner, value, area }) => {
    seedOtherScopes();
    local.set("coachfi-locale-v1", "pl"); session.set("coachfi-locale-v1", "en");
    local.set("coachfi-auth", PRIVATE); session.set("cdp-session", PRIVATE);
    session.set("unknown-product-key", PRIVATE);
    const mixed = [{ ...value, secret: PRIVATE }, { ...neighbor(), identity: { access_token: PRIVATE } }];
    const localCards = area === "local" ? mixed : [{ ...card(), secret: PRIVATE }];
    const sessionCards = area === "session" ? mixed : [{ ...card(), secret: PRIVATE }];
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify(localCards), "coachfi-tokens": "125",
      "coachfi-user": JSON.stringify({ setupDone: true, name: PRIVATE, goal: PRIVATE }),
      "coachfi-lesson-steps": JSON.stringify({ inflation: 2, identity: PRIVATE }),
    }, { [KEY]: JSON.stringify(sessionCards), "coachfi-tokens": "9",
      "coachfi-user": JSON.stringify({ setupDone: false, refresh_token: PRIVATE }),
    }, owner);
    const before = snapshot(), witness = strictReadWitness(handles[area]);
    const localHandle = traced(handles.local), sessionHandle = traced(handles.session);
    const payload = data.buildOwnedLocalDataExport(localHandle, sessionHandle);
    observations.push({ ownerKind: owner.kind, area, malformed: value, witness, payload });
    expect(localHandle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(sessionHandle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(snapshot()).toEqual(before);
    expect(witness).toEqual({ status: "unavailable", error: "Review card schema is unavailable" });
    expect(JSON.stringify(payload)).not.toMatch(/TEST_C56_|coachfi-owned|userId|access_token|refresh_token|secret|identity/);
    expect(payload).toEqual({
      version: 2, ownerKind: owner.kind, exportedAt: NOW,
      scope: "selected_current_owner_local_product_data", devicePreferencesIncluded: ["locale"],
      omitted: ["authentication_and_sessions", "unknown_keys_and_fields", "free_text_profile_and_goals"],
      localStorage: { [KEY]: area === "local" ? [neighbor()] : [card()], "coachfi-tokens": 125,
        "coachfi-user": { setupDone: true }, "coachfi-lesson-steps": { inflation: 2 }, "coachfi-locale-v1": "pl" },
      sessionStorage: { [KEY]: area === "session" ? [neighbor()] : [card()], "coachfi-tokens": 9,
        "coachfi-user": { setupDone: false }, "coachfi-locale-v1": "en" },
    });
  });

  it.each(owners)("keeps valid whole boundaries and fractional ease in both $name areas", ({ owner }) => {
    seedOtherScopes();
    const lower = card("inflation-basics", 1, 0, 1.3), upper = card("emergency-fund", 90, 100000, 2.5);
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify([lower, upper]) }, { [KEY]: JSON.stringify([upper, lower]) }, owner);
    const before = snapshot(), payload = data.buildOwnedLocalDataExport(handles.local, handles.session);
    observations.push({ ownerKind: owner.kind, payload });
    expect(strictReadWitness(handles.local)).toEqual({ status: "available", cards: [lower, upper] });
    expect(strictReadWitness(handles.session)).toEqual({ status: "available", cards: [upper, lower] });
    expect(payload.ownerKind).toBe(owner.kind);
    expect(payload.localStorage).toEqual({ [KEY]: [lower, upper] });
    expect(payload.sessionStorage).toEqual({ [KEY]: [upper, lower] });
    expect(snapshot()).toEqual(before);
  });

  it("rejects pending, mixed, stale and reversed-area handles before physical collection", () => {
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "TEST_C56_A" });
    const pendingLocal = store.captureCurrentPersonalStorage(), pendingSession = store.captureCurrentPersonalStorage("session");
    expect(() => data.buildOwnedLocalDataExport(pendingLocal, pendingSession)).toThrow("Storage owner changed");
    const first = seedOwnerRaw({ [KEY]: JSON.stringify([card()]) }, {},
      { kind: "account", provider: "cdp", userId: "TEST_C56_A" });
    const second = seedOwnerRaw({ [KEY]: JSON.stringify([neighbor()]) }, {},
      { kind: "account", provider: "cdp", userId: "TEST_C56_B" });
    const before = snapshot();
    expect(() => data.buildOwnedLocalDataExport(first.local, second.session)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(first.local, first.session)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(second.session, second.local)).toThrow("Storage owner changed");
    expect(physicalLocal.getItem).not.toHaveBeenCalled();
    expect(physicalSession.getItem).not.toHaveBeenCalled();
    expect(snapshot()).toEqual(before);
    observations.push({ pendingMixedStaleAndReversedRejected: true, physicalReads: 0 });
  });

  it("rejects owner retirement during SRS collection without returning a partial export", () => {
    const handles = seedOwnerRaw({ [KEY]: JSON.stringify([card()]) }, { [KEY]: JSON.stringify([neighbor()]) },
      { kind: "account", provider: "cdp", userId: "TEST_C56_A" });
    const before = snapshotData();
    let changed = false;
    onRead = (area, key) => {
      if (area === "local" && key.endsWith(":" + KEY)) {
        onRead = undefined; changed = true;
        store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "TEST_C56_B" }).publishReady();
      }
    };
    expect(() => data.buildOwnedLocalDataExport(handles.local, handles.session)).toThrow("Storage owner changed");
    expect(changed).toBe(true);
    expect(handles.local.isCurrent()).toBe(false);
    expect(store.getStorageOwnershipSnapshot().owner).toEqual({ kind: "account", provider: "cdp", userId: "TEST_C56_B" });
    expect(snapshotData()).toEqual(before);
    observations.push({ ownerRetiredDuringRead: changed, bytesUnchanged: true });
  });
});
