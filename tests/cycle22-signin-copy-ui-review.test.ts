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

type Props = { children?: unknown; role?: string; id?: string; className?: string; type?: string; value?: string; onChange?: (event: { target: { value: string } }) => void; onClick?: () => void; disabled?: boolean };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
const MANUAL_COPY = {
  pl: { title: "Zaloguj się do Coach FI", body: "Wypełnij formularz logowania." },
  en: { title: "Sign in to Coach FI", body: "Complete the sign-in form." },
};
const ORIGINAL_COPY = {
  pl: { title: "Zaloguj się, żeby iść dalej", body: "Tu kończy się Coach FI bez konta. Zaloguj się, żeby kontynuować.", close: "Zamknij" },
  en: { title: "Sign in to continue", body: "This is as far as Coach FI goes without an account. Sign in to keep going.", close: "Close" },
  ja: { title: "続けるにはログイン", body: "アカウントなしで使える範囲はここまでです。ログインして続けてください。", close: "閉じる" },
  es: { title: "Inicia sesión para continuar", body: "Hasta aquí llega Coach FI sin una cuenta. Inicia sesión para seguir.", close: "Cerrar" },
};
const dialog = (tree: unknown) => nodes(tree).filter(node => node.props.role === "dialog");
const closeButton = (tree: unknown) => nodes(tree).find(node => node.type === "button" && text(node) === ORIGINAL_COPY[fixture.locale as keyof typeof ORIGINAL_COPY].close);
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, reads: string[], deniedSRS: boolean;
let api: typeof import("@/lib/signInGate"), render: () => ReactElement | null, lastTree: ReactElement | null;
function resetHooks() { fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear(); fixture.values.clear(); fixture.deps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; lastTree = null; }
function settle() { for (let i = 0; i < 10; i++) { fixture.slot = 0; fixture.dirty = false; lastTree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && !fixture.effects.length) return lastTree; } throw Error("FIXTURE gate did not settle in10 renders"); }
function attempt(action: () => unknown) { let uncaught: string | null = null; try { action(); } catch (error) { uncaught = error instanceof Error ? error.message : String(error); } return uncaught; }
async function prepareGate(enabled = false) {
  vi.stubEnv("NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED", enabled ? "1" : ""); vi.stubEnv("NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON", enabled ? "1" : ""); vi.stubEnv("NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS", "");
  api = await import("@/lib/signInGate"); render = (await import("@/components/SignInGate")).SignInGate;
}
function observed(name: string, extra: Record<string, unknown> = {}) { console.log("C22_UI_BASELINE_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, config: api.SIGN_IN_GATE, manualRequested: api.isSignInRequested(), dialogs: dialog(lastTree).length, closeVisible: !!closeButton(lastTree), text: text(lastTree), rawSRS: bytes.get("coachfi-srs"), rawSteps: bytes.get("coachfi-lesson-steps"), nativeBytes: Object.fromEntries(bytes), reads: [...reads], writes: [...writes], providerCalls: { email: fixture.signInWithEmail.mock.calls.length, oauth: fixture.signInWithOAuth.mock.calls.length, otp: fixture.verifyEmailOTP.mock.calls.length }, ...extra })); }
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


function presentation(tree: unknown) {
  const all = nodes(tree);
  return { title: text(all.find(node => node.type === "h2" && node.props.id === "sign-in-gate-title")), body: text(all.find(node => node.type === "p" && node.props.className?.includes("text-base"))),
    dialogs: dialog(tree).length, close: !!closeButton(tree), emailInputs: all.filter(node => node.type === "input" && node.props.type === "email").length,
    emailDraft: all.find(node => node.type === "input" && node.props.type === "email")?.props.value };
}
function expectCopy(actual: { title: string; body: string }, expected: { title: string; body: string }) {
  // Both exact fields remain independent desired-behavior oracles even before
  // implementation; soft assertions retain both observed mismatches in raw JSON.
  expect.soft(actual.title).toBe(expected.title);
  expect.soft(actual.body).toBe(expected.body);
}
async function seedProvenRequired() {
  const { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress");
  bytes.set("coachfi-srs", JSON.stringify(STAGE_QUESTION_IDS["money-mindset"].map(id => ({ id, repetitions: 1, interval: 6, easeFactor: 2.5, nextReview: "2026-12-01" }))));
  bytes.set("coachfi-lesson-steps", '{"saving-habit":1}');
}

describe("C22 actual SignInGate manual reason copy and preserved controls", () => {
  it.each(["pl", "en"] as const)("%s explicit OFF manual dialog has neutral exact copy and remains dismissible without writes", async locale => {
    fixture.locale = locale; await prepareGate(); settle(); expect(dialog(lastTree)).toHaveLength(0);
    const before = new Map(bytes); api.requestSignIn(); settle(); const opened = presentation(lastTree), requested = api.isSignInRequested(), close = closeManuallyIfPresent();
    observed("manual-off-" + locale, { opened, requested, ...close });
    expect(requested).toBe(true); expect(opened.dialogs).toBe(1); expect(opened.emailInputs).toBe(1); expect(opened.close).toBe(true);
    expect(close).toEqual({ closeInvoked: true, closeError: null }); expect(dialog(lastTree)).toHaveLength(0); expect(api.isSignInRequested()).toBe(false); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    expectCopy(opened, MANUAL_COPY[locale]);
  });
  it.each(["pl", "en"] as const)("%s proven healthy ON required dialog keeps original exact copy and cannot be dismissed", async locale => {
    fixture.locale = locale; await prepareGate(true); await seedProvenRequired(); const before = new Map(bytes); settle(); const required = presentation(lastTree);
    api.dismissSignInRequest(); settle(); observed("required-on-" + locale, { required, requiredAfterDismiss: api.isSignInRequiredNow() });
    expect(api.isSignInRequiredNow()).toBe(true); expect(required.dialogs).toBe(1); expect(required.close).toBe(false); expect(required.emailInputs).toBe(1); expect(dialog(lastTree)).toHaveLength(1); expect(closeButton(lastTree)).toBeUndefined(); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    expectCopy(required, ORIGINAL_COPY[locale]);
  });
  it.each([["pl", "en"], ["en", "pl"]] as const)("manual locale %s to %s changes exact copy while preserving open request and own draft", async (from, to) => {
    fixture.locale = from; await prepareGate(); settle(); api.requestSignIn(); settle(); const before = new Map(bytes);
    const input = nodes(lastTree).find(node => node.type === "input" && node.props.type === "email"); expect(input).toBeDefined(); input!.props.onChange!({ target: { value: "FIXTURE unsent draft" } }); settle(); const first = presentation(lastTree);
    fixture.locale = to; settle(); const second = presentation(lastTree), requestedAfterLocale = api.isSignInRequested(), close = closeManuallyIfPresent();
    observed("manual-locale-" + from + "-" + to, { first, second, requestedAfterLocale, ...close });
    expect(first.dialogs).toBe(1); expect(second.dialogs).toBe(1); expect(first.close).toBe(true); expect(second.close).toBe(true); expect(requestedAfterLocale).toBe(true); expect(second.emailInputs).toBe(1); expect(first.emailDraft).toBe("FIXTURE unsent draft"); expect(second.emailDraft).toBe(first.emailDraft);
    expect(close).toEqual({ closeInvoked: true, closeError: null }); expect(dialog(lastTree)).toHaveLength(0); expect(api.isSignInRequested()).toBe(false); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    expectCopy(first, MANUAL_COPY[from]); expectCopy(second, MANUAL_COPY[to]);
  });
  it.each(["ja", "es"] as const)("%s optional manual dialog keeps its original localized copy instead of new English fallback", async locale => {
    fixture.locale = locale; await prepareGate(); settle(); const before = new Map(bytes); api.requestSignIn(); settle(); const opened = presentation(lastTree), close = closeManuallyIfPresent();
    observed("manual-other-locale-" + locale, { opened, ...close });
    expect(opened.dialogs).toBe(1); expect(opened.close).toBe(true); expect(opened.emailInputs).toBe(1); expect(opened.title).not.toBe(MANUAL_COPY.en.title); expect(opened.body).not.toBe(MANUAL_COPY.en.body); expect(close).toEqual({ closeInvoked: true, closeError: null }); expect(dialog(lastTree)).toHaveLength(0); expect(api.isSignInRequested()).toBe(false); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    expectCopy(opened, ORIGINAL_COPY[locale]);
  });
  it.each(["pl", "en"] as const)("%s known ON below healthy thresholds uses manual copy when optional rather than selecting by configuration", async locale => {
    fixture.locale = locale; await prepareGate(true); settle(); expect(api.isSignInRequiredNow()).toBe(false); expect(dialog(lastTree)).toHaveLength(0);
    const before = new Map(bytes); api.requestSignIn(); settle(); const opened = presentation(lastTree), close = closeManuallyIfPresent();
    observed("manual-on-below-" + locale, { opened, requiredKnownFalse: api.isSignInRequiredNow() === false, ...close });
    expect(opened.dialogs).toBe(1); expect(opened.close).toBe(true); expect(close).toEqual({ closeInvoked: true, closeError: null }); expect(dialog(lastTree)).toHaveLength(0); expect(api.isSignInRequested()).toBe(false); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    expectCopy(opened, MANUAL_COPY[locale]);
  });
});
