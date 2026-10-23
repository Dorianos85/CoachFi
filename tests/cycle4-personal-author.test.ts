import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { ReactElement } from "react";
import type { SyncEntity } from "@/lib/sync/syncQueue";

type SyntheticCloudPusher = (entity: SyncEntity, payload?: unknown) => void;

const ui = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)>, storage: null as unknown as PersonalStorageHandle }));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()],
  useEffect: (effect: () => void | (() => void)) => { ui.effects.push(effect); },
  useCallback: (callback: unknown) => callback,
}));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: ui.storage }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ consent: null }) }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: "pl" }) }));

const answers = { monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000, debt: 0, cashHeld: 0,
  hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true,
  mainFinancialGoal: "FIXTURE_LONG_GOAL" };
const profile = { name: "FIXTURE_A_NAME", goal: "FIXTURE_A_GOAL", setupDone: true };

describe("personal ownership author regressions (synthetic only)", () => {
  let local: Map<string, string>;
  let events: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
  let set: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
  let cloud: ReturnType<typeof vi.fn<SyntheticCloudPusher>>;
  beforeEach(() => {
    vi.resetModules(); ui.effects.length = 0; local = new Map();
    set = vi.fn((key: string, value: string) => { local.set(key, value); });
    events = vi.fn(() => true); cloud = vi.fn<SyntheticCloudPusher>();
    const storage = { getItem: (key: string) => local.get(key) ?? null, setItem: set,
      removeItem: (key: string) => { local.delete(key); } };
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: events,
      addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  async function account(uid: string, provider: "cdp" | "supabase" = "cdp") {
    const ownership = await import("@/lib/product-storage");
    const lease = ownership.beginStorageOwner({ kind: "account", provider, userId: uid });
    lease.publishReady({ localOnly: true });
    return ownership.captureCurrentPersonalStorage();
  }
  async function helpers() {
    const [user, avatar, health, consent, queue] = await Promise.all([
      import("@/lib/user"), import("@/lib/avatar"), import("@/lib/healthCheck"), import("@/lib/consent"), import("@/lib/sync/syncQueue"),
    ]);
    queue.registerCloudPusher(cloud);
    return { user, avatar, health, consent };
  }

  it("account writes and guest reads preserve original legacy bytes including malformed records", async () => {
    const h = await helpers();
    const guest = new Map([
      ["coachfi-user", ' { "name":"FIXTURE_GUEST", "goal":"local", "setupDone":true }\n'],
      ["coachfi-health-check", "broken legacy bytes"], ["coachfi-tokens", "00321"],
      ["coachfi-consent-v1", ' {"version":"old"}\n'], ["coachfi-avatar", ' {"gender":"male","style":"builder"}\n'],
    ]);
    for (const [key, value] of guest) local.set(key, value);
    const A = await account("FIXTURE_A");
    h.user.saveUser(profile, A); h.avatar.saveAvatar({ gender: "female", style: "warrior" }, A);
    h.consent.writeStoredConsent(h.consent.createConsentRecord({ voice: true }), A); h.health.saveHealthCheck(answers, A);
    const B = await account("FIXTURE_B");
    expect(h.user.getUser(B)).toEqual({ name: "", goal: "", setupDone: false });
    expect(h.health.getHealthCheck(B)).toBeNull(); expect(h.consent.readStoredConsent(B)).toBeNull();
    const ownership = await import("@/lib/product-storage"); ownership.beginStorageOwner({ kind: "guest" }).publishReady();
    expect(h.user.getUser().name).toBe("FIXTURE_GUEST"); expect(h.health.getHealthCheck()).toBeNull();
    for (const [key, value] of guest) expect(local.get(key)).toBe(value);
  });

  it("restoring the same account retrieves its local-only health without cloud upload", async () => {
    const h = await helpers(); const A = await account("FIXTURE_A");
    h.consent.writeStoredConsent(h.consent.createConsentRecord(), A); cloud.mockClear();
    const saved = h.health.saveHealthCheck(answers, A); expect(cloud).not.toHaveBeenCalled();
    await account("FIXTURE_B"); const restoredA = await account("FIXTURE_A");
    expect(h.health.getHealthCheck(restoredA)).toEqual(saved);
    expect(saved.score).toBe(98); expect(saved.currency).toBe("PLN"); expect(saved.schemaVersion).toBe(2);
    expect(cloud).not.toHaveBeenCalled();
  });

  it("provider is part of ownership even for identical user IDs", async () => {
    const h = await helpers(); const cdp = await account("FIXTURE_SAME", "cdp"); h.user.saveUser(profile, cdp);
    const supabase = await account("FIXTURE_SAME", "supabase"); expect(h.user.getUser(supabase).name).toBe("");
    h.user.saveUser({ ...profile, name: "FIXTURE_SUPABASE" }, supabase);
    const cdpAgain = await account("FIXTURE_SAME", "cdp"); expect(h.user.getUser(cdpAgain).name).toBe(profile.name);
  });

  it("pending public handles read no previous person data and authorize no writes", async () => {
    const h = await helpers(); const A = await account("FIXTURE_A"); h.user.saveUser(profile, A);
    const ownership = await import("@/lib/product-storage"); ownership.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
    const pending = ownership.captureCurrentPersonalStorage(); set.mockClear(); events.mockClear(); cloud.mockClear();
    expect(h.user.getUser(pending).name).toBe(""); expect(h.avatar.getAvatar(pending)).toEqual(h.avatar.DEFAULT_AVATAR);
    expect(h.health.getHealthCheck(pending)).toBeNull(); expect(h.consent.readStoredConsent(pending)).toBeNull();
    expect(() => h.user.saveUser(profile, pending)).toThrow();
    expect(() => h.avatar.saveAvatar({ gender: "male", style: "builder" }, pending)).toThrow();
    expect(() => h.health.saveHealthCheck(answers, pending)).toThrow();
    expect(() => h.consent.writeStoredConsent(h.consent.createConsentRecord(), pending)).toThrow();
    expect(set).not.toHaveBeenCalled(); expect(events).not.toHaveBeenCalled(); expect(cloud).not.toHaveBeenCalled();
  });

  it.each(["profile", "clearName", "avatar", "health", "consent", "clearConsent"] as const)("stale %s setter changes neither new account nor guest and emits no event/push", async (operation) => {
    const h = await helpers(); const A = await account("FIXTURE_A"); const B = await account("FIXTURE_B");
    h.user.saveUser({ ...profile, name: "FIXTURE_B_NAME" }, B);
    local.set("coachfi-user", "FIXTURE_GUEST_BYTES"); const before = new Map(local);
    set.mockClear(); events.mockClear(); cloud.mockClear();
    const action = {
      profile: () => h.user.saveUser(profile, A), clearName: () => h.user.clearUserName(A),
      avatar: () => h.avatar.saveAvatar({ gender: "male", style: "builder" }, A),
      health: () => h.health.saveHealthCheck(answers, A),
      consent: () => h.consent.writeStoredConsent(h.consent.createConsentRecord({ aiCoach: true }), A),
      clearConsent: () => h.consent.clearStoredConsent(A),
    }[operation];
    expect(action).toThrow(); expect(local).toEqual(before);
    expect(set).not.toHaveBeenCalled(); expect(events).not.toHaveBeenCalled(); expect(cloud).not.toHaveBeenCalled();
  });

  it("B cannot save diagnosis by inheriting A or raw guest consent", async () => {
    const h = await helpers(); local.set("coachfi-consent-v1", JSON.stringify(h.consent.createConsentRecord({ voice: true })));
    const A = await account("FIXTURE_A"); h.consent.writeStoredConsent(h.consent.createConsentRecord({ voice: true }), A);
    const B = await account("FIXTURE_B");
    expect(() => h.health.saveHealthCheck(answers, B)).toThrow("Required terms");
    expect(h.consent.hasConsentFor(h.consent.readStoredConsent(B), ["voice"])).toBe(false);
  });

  it("scoped required withdrawal hides health but preserves its original local record and guest consent", async () => {
    const h = await helpers(); local.set("coachfi-consent-v1", "FIXTURE_GUEST_CONSENT_BYTES");
    const A = await account("FIXTURE_A"); h.consent.writeStoredConsent(h.consent.createConsentRecord(), A);
    h.health.saveHealthCheck(answers, A); const healthBytes = A.getItem("coachfi-health-check");
    h.consent.clearStoredConsent(A);
    expect(h.health.getHealthCheck(A)).toBeNull(); expect(A.getItem("coachfi-health-check")).toBe(healthBytes);
    expect(local.get("coachfi-consent-v1")).toBe("FIXTURE_GUEST_CONSENT_BYTES");
    expect(() => h.health.saveHealthCheck(answers, A)).toThrow("Required terms");
  });

  it.each(["profile", "avatar", "health", "consent"] as const)("%s quota failure is propagated without false event/cloud success", async (operation) => {
    const h = await helpers(); const A = await account("FIXTURE_A"); h.consent.writeStoredConsent(h.consent.createConsentRecord(), A);
    const before = new Map(local); cloud.mockClear(); events.mockClear();
    set.mockImplementation(() => { throw new DOMException("FIXTURE_QUOTA", "QuotaExceededError"); });
    const action = {
      profile: () => h.user.saveUser(profile, A), avatar: () => h.avatar.saveAvatar({ gender: "male", style: "builder" }, A),
      health: () => h.health.saveHealthCheck(answers, A), consent: () => h.consent.writeStoredConsent(h.consent.createConsentRecord(), A),
    }[operation];
    expect(action).toThrow("FIXTURE_QUOTA"); expect(local).toEqual(before);
    expect(events).not.toHaveBeenCalled(); expect(cloud).not.toHaveBeenCalled();
  });

  it("consent event reentry changes owner before cloud notify and prevents transfer to B", async () => {
    const h = await helpers(); const A = await account("FIXTURE_A"); const ownership = await import("@/lib/product-storage");
    cloud.mockClear(); events.mockImplementation((event) => {
      if (event.type === h.consent.CONSENT_CHANGED_EVENT) ownership.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
      return true;
    });
    expect(() => h.consent.writeStoredConsent(h.consent.createConsentRecord({ voice: true }), A)).toThrow();
    expect(h.consent.readStoredConsent()).toBeNull(); expect(cloud).not.toHaveBeenCalled();
  });

  it("an owner change inside physical write never announces/pushes the old profile as B", async () => {
    const h = await helpers(); const A = await account("FIXTURE_A"); const ownership = await import("@/lib/product-storage");
    set.mockImplementation((key, value) => {
      local.set(key, value); ownership.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
    });
    events.mockClear(); cloud.mockClear();
    expect(() => h.user.saveUser(profile, A)).toThrow();
    expect(events.mock.calls.some(([event]) => event.type === "coachfi-user")).toBe(false);
    expect(cloud).not.toHaveBeenCalled(); expect(h.user.getUser().name).toBe("");
  });

  it("a stopped owner notification timer cannot reveal their old streak", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-14T12:00:00.000Z"));
    const notification = vi.fn(); vi.stubGlobal("Notification", Object.assign(notification, { permission: "granted" }));
    Object.assign(window, { Notification: notification });
    const A = await account("FIXTURE_A"); const reminders = await import("@/lib/notifications");
    reminders.scheduleStreakReminder(11, A); await account("FIXTURE_B");
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(notification).not.toHaveBeenCalled();
  });

  it("old owner cleanup cancels only old timers, preserving B's current reminder", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-14T12:00:00.000Z"));
    const notification = vi.fn(); vi.stubGlobal("Notification", Object.assign(notification, { permission: "granted" }));
    Object.assign(window, { Notification: notification });
    const A = await account("FIXTURE_A"); const reminders = await import("@/lib/notifications"); reminders.scheduleStreakReminder(11, A);
    const B = await account("FIXTURE_B"); reminders.scheduleStreakReminder(7, B); reminders.cancelScheduledNotifications(A);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(notification).toHaveBeenCalledOnce(); expect(notification.mock.calls[0][0]).toContain("7-day");
    expect(notification.mock.calls[0][0]).not.toContain("11-day");
  });

  it("explicit notification cancellation and stale direct notification calls remain silent", async () => {
    vi.useFakeTimers(); const notification = vi.fn(); vi.stubGlobal("Notification", Object.assign(notification, { permission: "granted" }));
    Object.assign(window, { Notification: notification });
    const A = await account("FIXTURE_A"); const reminders = await import("@/lib/notifications");
    reminders.scheduleQuizReminder(A); reminders.cancelScheduledNotifications(A);
    await account("FIXTURE_B"); reminders.sendNotification("FIXTURE_A_TEXT", "FIXTURE_A_BODY", undefined, A);
    await vi.advanceTimersByTimeAsync(31_000); expect(notification).not.toHaveBeenCalled();
  });

  it("actual local VoiceProvider callback cancels synchronously on owner change and rejects old read-aloud", async () => {
    const bus = new EventTarget();
    events.mockImplementation((event) => bus.dispatchEvent(event));
    const speak = vi.fn(); const cancel = vi.fn();
    Object.assign(window, { addEventListener: bus.addEventListener.bind(bus), removeEventListener: bus.removeEventListener.bind(bus),
      speechSynthesis: { cancel, speak, getVoices: () => [{ localService: true, lang: "pl-PL", name: "FIXTURE_LOCAL_VOICE" }] } });
    vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
    ui.storage = await account("FIXTURE_A");
    const { VoiceProvider } = await import("@/context/VoiceContext");
    const tree = VoiceProvider({ children: null }) as ReactElement<{ value: {
      speak: (text: string, options: { userInitiated: boolean }) => Promise<void>;
    } }>;
    const cleanups = ui.effects.map((effect) => effect()); cancel.mockClear();
    await tree.props.value.speak("FIXTURE_A_TEXT", { userInitiated: true }); expect(speak).toHaveBeenCalledOnce();
    cancel.mockClear(); await account("FIXTURE_B"); expect(cancel).toHaveBeenCalled();
    await tree.props.value.speak("FIXTURE_OLD_A_TEXT", { userInitiated: true }); expect(speak).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled(); cleanups.forEach((cleanup) => cleanup?.());
  });
});
