import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({
  locale: "pl" as import("@/lib/i18n").Locale,
  initialized: true, signedIn: false, slot: 0, dirty: false,
  values: new Map<number, unknown>(), deps: new Map<number, readonly unknown[] | undefined>(),
  effects: [] as Effect[], cleanups: new Map<number, () => void>(),
  setState: vi.fn(),
  signInWithEmail: vi.fn(() => { throw Error("FIXTURE forbids email provider invocation"); }),
  signInWithOAuth: vi.fn(() => { throw Error("FIXTURE forbids OAuth provider invocation"); }),
  verifyEmailOTP: vi.fn(() => { throw Error("FIXTURE forbids OTP provider invocation"); }),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
function effect(callback: Effect, deps?: readonly unknown[]) {
  const slot = fixture.slot++;
  if (!fixture.deps.has(slot) || !sameDeps(fixture.deps.get(slot), deps)) fixture.effects.push(() => { fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot); const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup); });
  fixture.deps.set(slot, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => { const slot = fixture.slot++; if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial); return [fixture.values.get(slot), (value: unknown) => { const previous = fixture.values.get(slot), next = typeof value === "function" ? value(previous) : value; fixture.setState(next); if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(slot, next); }]; },
  useEffect: effect,
}));
// Module replacement prevents SDK import/initialization; these are explicit local
// CDP hook outputs, never authenticated accounts or a remote provider simulation.
vi.mock("@coinbase/cdp-hooks", () => ({
  useIsInitialized: () => ({ isInitialized: fixture.initialized }),
  useIsSignedIn: () => ({ isSignedIn: fixture.signedIn }),
  useSignInWithEmail: () => ({ signInWithEmail: fixture.signInWithEmail }),
  useSignInWithOAuth: () => ({ signInWithOAuth: fixture.signInWithOAuth }),
  useVerifyEmailOTP: () => ({ verifyEmailOTP: fixture.verifyEmailOTP }),
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));

type Props = { children?: unknown; role?: string; onClick?: () => void; disabled?: boolean };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
const COPY = { pl: { title: "Zaloguj się, żeby iść dalej", close: "Zamknij" }, en: { title: "Sign in to continue", close: "Close" } };
const MANUAL_TITLE = { pl: "Zaloguj się do Coach FI", en: "Sign in to Coach FI" } as const;
const dialog = (tree: unknown) => nodes(tree).filter(node => node.props.role === "dialog");
const closeButton = (tree: unknown) => nodes(tree).find(node => node.type === "button" && text(node) === COPY[fixture.locale as "pl" | "en"].close);
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, reads: string[], deniedSRS: boolean;
let api: typeof import("@/lib/signInGate"), render: () => ReactElement | null, lastTree: ReactElement | null;
function resetHooks() { fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear(); fixture.values.clear(); fixture.deps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; lastTree = null; }
function settle() { for (let i = 0; i < 10; i++) { fixture.slot = 0; fixture.dirty = false; lastTree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && !fixture.effects.length) return lastTree; } throw Error("FIXTURE gate did not settle in10 renders"); }
function attempt(action: () => unknown) { let uncaught: string | null = null; try { action(); } catch (error) { uncaught = error instanceof Error ? error.message : String(error); } return uncaught; }
async function prepareGate(enabled = false) {
  vi.stubEnv("NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED", enabled ? "1" : ""); vi.stubEnv("NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON", enabled ? "1" : ""); vi.stubEnv("NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS", "");
  api = await import("@/lib/signInGate"); render = (await import("@/components/SignInGate")).SignInGate;
}
function observed(name: string, extra: Record<string, unknown> = {}) { console.log("C21_UI_BASELINE_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, config: api.SIGN_IN_GATE, manualRequested: api.isSignInRequested(), dialogs: dialog(lastTree).length, closeVisible: !!closeButton(lastTree), text: text(lastTree), rawSRS: bytes.get("coachfi-srs"), rawSteps: bytes.get("coachfi-lesson-steps"), reads: [...reads], writes: [...writes], providerCalls: { email: fixture.signInWithEmail.mock.calls.length, oauth: fixture.signInWithOAuth.mock.calls.length, otp: fixture.verifyEmailOTP.mock.calls.length }, ...extra })); }
function closeManuallyIfPresent() { const close = closeButton(lastTree); let closeError: string | null = null; if (close) closeError = attempt(() => { close.props.onClick!(); settle(); }); return { closeInvoked: !!close, closeError }; }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.unstubAllEnvs(); resetHooks(); fixture.locale = "pl"; fixture.initialized = true; fixture.signedIn = false; deniedSRS = false; reads = []; writes = []; bytes = new Map([["coachfi-srs", "[]"], ["coachfi-learn-manual", "{}"], ["coachfi-tokens", "125"]]);
  const native = { getItem: (key: string) => { reads.push(key); if (deniedSRS && key === "coachfi-srs") throw Error("FIXTURE SRS read denied"); return bytes.get(key) ?? null; }, setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); }, removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); } };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native }; Object.assign(win, { localStorage: native, sessionStorage: native }); vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE forbids network"); }));
  const { beginStorageOwner, getStorageOwnershipSnapshot } = await import("@/lib/product-storage"); beginStorageOwner({ kind: "guest" }).publishReady(); expect(getStorageOwnershipSnapshot().status).toBe("ready");
  // A real ready guest revision matches the mounted ProductScopeBoundary branch.
  // No unavailable-owner bypass or remote CDP/config values are used.
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); expect(fixture.signInWithEmail).not.toHaveBeenCalled(); expect(fixture.signInWithOAuth).not.toHaveBeenCalled(); expect(fixture.verifyEmailOTP).not.toHaveBeenCalled(); resetHooks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C21 actual SignInGate exact OFF and healthy controls baseline", () => {
  it("empty synthetic env gives exact OFF config and healthy gate stays closed without mutations", async () => {
    await prepareGate(); const before = new Map(bytes); const uncaught = attempt(settle); observed("healthy-off", { uncaught });
    expect(api.SIGN_IN_GATE).toEqual({ lessonsFinished: 0, stepsInAnotherLesson: 0, agentConversationMs: 0 }); expect(uncaught).toBeNull(); expect(dialog(lastTree)).toHaveLength(0); expect(api.isSignInRequested()).toBe(false); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s healthy OFF manual request opens localized form and close returns to closed state", async locale => {
    fixture.locale = locale; await prepareGate(); settle(); expect(dialog(lastTree)).toHaveLength(0); const before = new Map(bytes), requestError = attempt(() => { api.requestSignIn(); settle(); }); const opened = dialog(lastTree).length, title = text(lastTree), close = closeManuallyIfPresent(); observed("healthy-manual-" + locale, { requestError, opened, titleBeforeClose: title, ...close });
    expect(requestError).toBeNull(); expect(opened).toBe(1); expect(title).toContain(MANUAL_TITLE[locale]); expect(close.closeInvoked).toBe(true); expect(close.closeError).toBeNull(); expect(api.isSignInRequested()).toBe(false); expect(dialog(lastTree)).toHaveLength(0); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s explicit enabled healthy thresholds preserve required dialog and absence of optional close", async locale => {
    fixture.locale = locale; await prepareGate(true); const { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress"); bytes.set("coachfi-srs", JSON.stringify(STAGE_QUESTION_IDS["money-mindset"].map(id => ({ id, repetitions: 1, interval: 6, easeFactor: 2.5, nextReview: "2026-12-01" })))); bytes.set("coachfi-lesson-steps", '{"saving-habit":1}'); const before = new Map(bytes), uncaught = attempt(settle); observed("healthy-required-" + locale, { uncaught });
    expect(api.SIGN_IN_GATE).toEqual({ lessonsFinished: 1, stepsInAnotherLesson: 1, agentConversationMs: 0 }); expect(uncaught).toBeNull(); expect(api.isSignInRequiredNow()).toBe(true); expect(dialog(lastTree)).toHaveLength(1); expect(text(lastTree)).toContain(COPY[locale].title); expect(closeButton(lastTree)).toBeUndefined(); api.dismissSignInRequest(); settle(); expect(dialog(lastTree)).toHaveLength(1); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s exact OFF corrupted initial SRS must not throw or lose an already explicit manual request", async locale => {
    fixture.locale = locale; await prepareGate(); const raw = '{"FIXTURE_future":"not-an-array"}'; bytes.set("coachfi-srs", raw); const before = new Map(bytes); api.requestSignIn(); const mountError = attempt(settle), requestedAfterMount = api.isSignInRequested(), opened = dialog(lastTree).length, title = text(lastTree), close = closeManuallyIfPresent(); observed("off-corrupt-initial-" + locale, { mountError, requestedAfterMount, opened, titleBeforeClose: title, ...close });
    expect(api.SIGN_IN_GATE).toEqual({ lessonsFinished: 0, stepsInAnotherLesson: 0, agentConversationMs: 0 }); expect(mountError, "Exact OFF must not evaluate unavailable progress before manual opening").toBeNull(); expect(requestedAfterMount).toBe(true); expect(opened).toBe(1); expect(title).toContain(MANUAL_TITLE[locale]); expect(close.closeInvoked).toBe(true); expect(close.closeError).toBeNull(); expect(api.isSignInRequested()).toBe(false); expect(dialog(lastTree)).toHaveLength(0); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s exact OFF late corrupt SRS cannot throw from manual notify or prevent opening and closing", async locale => {
    fixture.locale = locale; await prepareGate(); settle(); expect(dialog(lastTree)).toHaveLength(0); const raw = '{"FIXTURE_late":"not-an-array"}'; bytes.set("coachfi-srs", raw); const before = new Map(bytes), requestError = attempt(() => api.requestSignIn()), requestedAfterNotify = api.isSignInRequested(), renderError = attempt(settle), opened = dialog(lastTree).length, title = text(lastTree), close = closeManuallyIfPresent(); observed("off-corrupt-late-" + locale, { requestError, requestedAfterNotify, renderError, opened, titleBeforeClose: title, ...close });
    expect(requestError, "Exact OFF manual request must not propagate progress-read exception").toBeNull(); expect(renderError).toBeNull(); expect(requestedAfterNotify).toBe(true); expect(opened).toBe(1); expect(title).toContain(MANUAL_TITLE[locale]); expect(close.closeInvoked).toBe(true); expect(close.closeError).toBeNull(); expect(api.isSignInRequested()).toBe(false); expect(dialog(lastTree)).toHaveLength(0); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
});

describe("C21 enabled unknown progress diagnostic observations only, no policy acceptance", () => {
  it.each(["malformed", "denied"] as const)("records %s legacy read projection after a healthy required calibration without prescribing unknown required", async mode => {
    await prepareGate(true); const { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress"); bytes.set("coachfi-srs", JSON.stringify(STAGE_QUESTION_IDS["money-mindset"].map(id => ({ id, repetitions: 1, interval: 6, easeFactor: 2.5, nextReview: "2026-12-01" })))); bytes.set("coachfi-lesson-steps", '{"saving-habit":1}'); settle(); expect(dialog(lastTree)).toHaveLength(1); expect(closeButton(lastTree)).toBeUndefined();
    if (mode === "malformed") bytes.set("coachfi-srs", "{FIXTURE_bad_json"); else deniedSRS = true; const before = new Map(bytes), readCount = reads.filter(key => key === "coachfi-srs").length, requestError = attempt(() => api.requestSignIn()), renderError = attempt(settle); observed("diagnostic-enabled-" + mode, { classification: "DIAGNOSTIC_ONLY_LEGACY_UNKNOWN_NOT_ACCEPTED_POLICY", requestError, renderError, priorHealthyRequired: true, closeAfterUnavailableObserved: !!closeButton(lastTree) });
    expect(reads.filter(key => key === "coachfi-srs").length).toBeGreaterThan(readCount); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    // No assertion assigns required=true or false to unavailable enabled progress.
    // These preserved observations do not enter the fixed OFF acceptance scope.
  });
});
