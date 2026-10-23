import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const fixture = vi.hoisted(() => ({
  storage: null as unknown as PersonalStorageHandle,
  effects: [] as Array<() => void | (() => void)>, setState: vi.fn(), cloud: vi.fn(),
}));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => [initial, fixture.setState],
  useEffect: (effect: () => void | (() => void)) => { fixture.effects.push(effect); },
  useMemo: (create: () => unknown) => create(),
}));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.cloud }));

const answers = { monthlyIncome: 1234, monthlyExpenses: 1000, savings: 3000, debt: 0,
  cashHeld: 0, hasEmergencyFund: true, understandsInflation: true,
  hasRetirementPlan: false, investsAlready: false, mainFinancialGoal: "FIXTURE_GOAL" };
const optional = { aiCoach: false, voice: true, leaderboard: false, blockchain: false };
interface ConsentActions {
  acceptRequired(value: typeof optional, expected?: PersonalStorageHandle): void;
  updateOptional(value: typeof optional, expected?: PersonalStorageHandle): void;
}

describe("independent actual personal helper and consent callback review", () => {
  let local: Map<string, string>, events: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); fixture.effects.length = 0;
    local = new Map(); events = vi.fn(() => true);
    const storage = { getItem: (key: string) => local.get(key) ?? null,
      setItem: (key: string, value: string) => { local.set(key, value); },
      removeItem: (key: string) => { local.delete(key); } };
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: events,
      addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  async function open(uid: string) {
    const store = await import("@/lib/product-storage");
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: uid }).publishReady({ localOnly: true });
    fixture.storage = store.captureCurrentPersonalStorage(); return fixture.storage;
  }

  it("actual A personal reads disappear during B pending and cannot inherit opt-in or diagnosis", async () => {
    const a = await open("FIXTURE_A");
    const user = await import("@/lib/user"), health = await import("@/lib/healthCheck"), consent = await import("@/lib/consent");
    user.saveUser({ name: "FIXTURE_A_NAME", goal: "FIXTURE_A_GOAL", setupDone: true }, a);
    consent.writeStoredConsent(consent.createConsentRecord(optional), a); health.saveHealthCheck(answers, a);
    const store = await import("@/lib/product-storage");
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
    expect(user.getUser().name).toBe(""); expect(health.getHealthCheck()).toBeNull(); expect(consent.readStoredConsent()).toBeNull();
    b.publishReady({ localOnly: true });
    expect(user.getUser().name).toBe(""); expect(health.getHealthCheck()).toBeNull();
    expect(consent.hasConsentFor(consent.readStoredConsent(), ["voice"])).toBe(false);
    const restoredA = await open("FIXTURE_A");
    expect(user.getUser(restoredA).name).toBe("FIXTURE_A_NAME");
    expect(health.getHealthCheck(restoredA)?.answers.monthlyIncome).toBe(1234);
  });

  it("stale captured profile/diagnosis/consent writers throw without changing B or reporting cloud work", async () => {
    const a = await open("FIXTURE_A");
    const user = await import("@/lib/user"), health = await import("@/lib/healthCheck"), consent = await import("@/lib/consent");
    const b = await open("FIXTURE_B"); consent.writeStoredConsent(consent.createConsentRecord(), b);
    user.saveUser({ name: "FIXTURE_B_NAME", goal: "", setupDone: true }, b);
    const bHealth = health.saveHealthCheck({ ...answers, monthlyIncome: 4321 }, b);
    fixture.cloud.mockClear(); events.mockClear(); const before = [...local];
    expect(() => user.saveUser({ name: "FIXTURE_A_STALE", goal: "", setupDone: true }, a)).toThrow("scope changed");
    expect(() => health.saveHealthCheck(answers, a)).toThrow("scope changed");
    expect(() => consent.writeStoredConsent(consent.createConsentRecord(optional), a)).toThrow("scope changed");
    expect([...local]).toEqual(before); expect(fixture.cloud).not.toHaveBeenCalled(); expect(events).not.toHaveBeenCalled();
    expect(health.getHealthCheck(b)?.answers.monthlyIncome).toBe(bHealth.answers.monthlyIncome);
  });

  it("actual ConsentProvider old callbacks cannot accept B even when explicitly passed its new handle", async () => {
    const a = await open("FIXTURE_A");
    const { ConsentProvider } = await import("@/context/ConsentContext");
    const old = (ConsentProvider({ children: null }) as ReactElement<{ value: ConsentActions }>).props.value;
    const b = await open("FIXTURE_B"); fixture.setState.mockClear(); fixture.cloud.mockClear();
    expect(() => old.acceptRequired(optional)).toThrow("scope changed");
    expect(() => old.updateOptional(optional, b)).toThrow("scope changed");
    expect(a.isCurrent()).toBe(false);
    expect(b.getItem("coachfi-consent-v1")).toBeNull();
    expect(fixture.setState).not.toHaveBeenCalled(); expect(fixture.cloud).not.toHaveBeenCalled();
  });

  it("actual optional-update callback rechecks withdrawn required terms instead of accepting them again", async () => {
    const a = await open("FIXTURE_A"), consent = await import("@/lib/consent");
    consent.writeStoredConsent(consent.createConsentRecord(), a);
    const { ConsentProvider } = await import("@/context/ConsentContext");
    const actions = (ConsentProvider({ children: null }) as ReactElement<{ value: ConsentActions }>).props.value;
    consent.clearStoredConsent(a); fixture.cloud.mockClear(); fixture.setState.mockClear();
    actions.updateOptional(optional);
    expect(consent.readStoredConsent(a)).toBeNull(); expect(fixture.cloud).not.toHaveBeenCalled();
    expect(fixture.setState).not.toHaveBeenCalled();
  });

  it("health event reentry does not return a saved A result after the owner changed to B", async () => {
    const a = await open("FIXTURE_A"), consent = await import("@/lib/consent");
    const health = await import("@/lib/healthCheck"), store = await import("@/lib/product-storage");
    consent.writeStoredConsent(consent.createConsentRecord(), a);
    events.mockImplementation((event) => {
      if (event.type === "coachfi-health-check") store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
      return true;
    });
    expect(() => health.saveHealthCheck(answers, a)).toThrow("scope changed");
    expect(health.getHealthCheck()).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
});
