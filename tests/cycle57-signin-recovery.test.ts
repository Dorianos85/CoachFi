import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

type Locale = "pl" | "en";
type Social = "google" | "apple" | "x" | "telegram";
type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({
  locale: "pl" as Locale, initialized: true, signedIn: false,
  slot: 0, dirty: false,
  values: new Map<number, unknown>(), deps: new Map<number, readonly unknown[] | undefined>(),
  effects: [] as Effect[], cleanups: new Map<number, () => void>(),
  signInWithOAuth: vi.fn<(provider: Social) => Promise<void>>(),
  signInWithEmail: vi.fn<(input: { email: string }) => Promise<{ flowId: string }>>(),
  verifyEmailOTP: vi.fn<(input: { flowId: string; otp: string }) => Promise<void>>(),
  persist: vi.fn(), notify: vi.fn(),
}));

const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function effect(callback: Effect, dependencies?: readonly unknown[]) {
  const slot = fixture.slot++;
  if (!fixture.deps.has(slot) || !sameDeps(fixture.deps.get(slot), dependencies)) {
    fixture.effects.push(() => {
      fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot);
      const cleanup = callback();
      if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup);
    });
  }
  fixture.deps.set(slot, dependencies);
}

// Persistent C21/C22-style component lifecycle adapter. No React DOM, hydration,
// native disabled-button dispatch, focus trap or popup behavior is simulated.
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = fixture.slot++;
    if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(slot), (value: unknown) => {
      const previous = fixture.values.get(slot), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) fixture.dirty = true;
      fixture.values.set(slot, next);
    }];
  },
  useEffect: effect,
}));
// This entire module is replaced: no actual CDP hook/core import, initialization,
// authentication, provider SDK or real external Promise is executed by fixtures.
vi.mock("@coinbase/cdp-hooks", () => ({
  useIsInitialized: () => ({ isInitialized: fixture.initialized }),
  useIsSignedIn: () => ({ isSignedIn: fixture.signedIn }),
  useSignInWithOAuth: () => ({ signInWithOAuth: fixture.signInWithOAuth }),
  useSignInWithEmail: () => ({ signInWithEmail: fixture.signInWithEmail }),
  useVerifyEmailOTP: () => ({ verifyEmailOTP: fixture.verifyEmailOTP }),
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: fixture.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));

type Props = { children?: unknown; role?: string; id?: string; type?: string;
  className?: string; autoComplete?: string; value?: string; disabled?: boolean;
  onClick?: () => void; onChange?: (event: { target: { value: string } }) => void };
type Node = ReactElement<Props>;
const COPY = {
  pl: { title: "Zaloguj się do Coach FI", body: "Wypełnij formularz logowania.",
    close: "Zamknij", send: "Wyślij kod", sending: "Wysyłanie...", verify: "Zaloguj się", checking: "Sprawdzanie..." },
  en: { title: "Sign in to Coach FI", body: "Complete the sign-in form.",
    close: "Close", send: "Send code", sending: "Sending...", verify: "Sign in", checking: "Checking..." },
} as const;
const SOCIAL_LABELS = ["Google", "Apple", "X", "Telegram"] as const;
const NOW = "2026-10-18T23:10:00.000Z";
const EMAIL = "test-c57@example.invalid";
const FLOW = "TEST_C57_FLOW_NOT_AUTHENTICATION";

let api: typeof import("@/lib/signInGate");
let ownership: typeof import("@/lib/product-storage");
let render: () => ReactElement | null;
let lastTree: ReactElement | null;
let local: Map<string, string>, session: Map<string, string>;
let writes: Array<{ area: string; key: string; value?: string }>;
let reads: Array<{ area: string; key: string }>;
let initialData: ReturnType<typeof snapshotData>;
let initialOwner: ReturnType<typeof ownership.getStorageOwnershipSnapshot>;
let timeline: Array<Record<string, unknown>>;
let outbound: ReturnType<typeof vi.fn>;

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function resetHooks() {
  fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear();
  fixture.values.clear(); fixture.deps.clear(); fixture.effects.length = 0;
  fixture.slot = 0; fixture.dirty = false; lastTree = null;
}
function settle(): ReactElement | null {
  for (let frame = 0; frame < 10; frame++) {
    fixture.slot = 0; fixture.dirty = false;
    lastTree = render();
    fixture.effects.splice(0).forEach(callback => callback());
    if (!fixture.dirty && fixture.effects.length === 0) return lastTree;
  }
  throw Error("TEST_C57 component did not settle within10 frames");
}
async function flushMicrotasks() {
  // Actual UI handlers return void. Advance Promise continuations explicitly;
  // awaiting onClick's undefined return alone is not a completion oracle.
  for (let turn = 0; turn < 6; turn++) { await Promise.resolve(); settle(); }
}
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function snapshotData() { return { local: [...local.entries()], session: [...session.entries()] }; }
function physicalStorage(values: Map<string, string>, area: "local" | "session") {
  return {
    getItem: (key: string) => { reads.push({ area, key }); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => { writes.push({ area, key, value }); values.set(key, value); },
    removeItem: (key: string) => { writes.push({ area, key }); values.delete(key); },
  };
}
function button(label: string): Node | undefined {
  return nodes(lastTree).find(node => typeof node.props.onClick === "function" && text(node) === label);
}
function mustButton(label: string): Node {
  const found = button(label);
  if (!found) throw Error("TEST_C57 missing expected button: " + label);
  return found;
}
function actionButton(): Node {
  const found = nodes(lastTree).find(node => typeof node.props.onClick === "function" && node.props.className?.includes("mt-6 w-full"));
  if (!found) throw Error("TEST_C57 missing current email/OTP action");
  return found;
}
function invoke(node: Node, allowDisabledHandlerProbe = false) {
  if (node.props.disabled && !allowDisabledHandlerProbe) throw Error("TEST_C57 cannot perform a disabled user action");
  const returned = node.props.onClick!();
  expect(returned, "Actual SignInGate onClick wrapper must remain void").toBeUndefined();
  settle();
}
function changeInput(kind: "email" | "otp", value: string) {
  const found = nodes(lastTree).find(node => node.type === "input" &&
    (kind === "email" ? node.props.type === "email" : node.props.autoComplete === "one-time-code"));
  if (!found?.props.onChange) throw Error("TEST_C57 missing " + kind + " input");
  found.props.onChange({ target: { value } }); settle();
}
function presentation() {
  const all = nodes(lastTree), close = button(COPY[fixture.locale].close);
  const action = all.find(node => typeof node.props.onClick === "function" && node.props.className?.includes("mt-6 w-full"));
  return {
    dialogs: all.filter(node => node.props.role === "dialog").length,
    title: text(all.find(node => node.type === "h2" && node.props.id === "sign-in-gate-title")),
    body: text(all.find(node => node.type === "p" && node.props.className?.includes("text-base"))),
    socialButtons: SOCIAL_LABELS.map(label => ({ label, exists: !!button(label), disabled: button(label)?.props.disabled === true })),
    action: action ? { label: text(action), disabled: action.props.disabled === true } : null,
    closeExists: !!close, closeDisabled: close?.props.disabled === true,
    emailInput: all.find(node => node.type === "input" && node.props.type === "email")?.props.value ?? null,
    otpInput: all.find(node => node.type === "input" && node.props.autoComplete === "one-time-code")?.props.value ?? null,
    alerts: all.filter(node => node.props.role === "alert").map(text),
    manualRequested: api.isSignInRequested(), required: api.isSignInRequiredNow(), signedInHook: fixture.signedIn,
  };
}
function observe(phase: string, extra: Record<string, unknown> = {}) {
  const view = presentation();
  timeline.push({ phase, ...view, adapterCalls: {
    oauth: structuredClone(fixture.signInWithOAuth.mock.calls),
    email: structuredClone(fixture.signInWithEmail.mock.calls), otp: structuredClone(fixture.verifyEmailOTP.mock.calls),
  }, ...extra });
  return view;
}
function expectAvailable(view: ReturnType<typeof presentation>) {
  expect(view.dialogs).toBe(1); expect(view.manualRequested).toBe(true);
  expect(view.required).toBe(false); expect(view.signedInHook).toBe(false);
  expect(view.socialButtons).toEqual(SOCIAL_LABELS.map(label => ({ label, exists: true, disabled: false })));
  expect(view.action).toEqual({ label: COPY[fixture.locale].send, disabled: false });
  expect(view.closeExists).toBe(true); expect(view.closeDisabled).toBe(false);
}
async function prepare(locale: Locale) {
  fixture.locale = locale;
  api = await import("@/lib/signInGate");
  render = (await import("@/components/SignInGate")).SignInGate;
  settle();
  expect(api.SIGN_IN_GATE).toEqual({ lessonsFinished: 0, stepsInAnotherLesson: 0, agentConversationMs: 0 });
  expect(presentation().dialogs).toBe(0);
  api.requestSignIn(); settle();
  const opened = observe("manual-open");
  expectAvailable(opened);
  expect(opened.title).toBe(COPY[locale].title); expect(opened.body).toBe(COPY[locale].body);
}

beforeEach(async () => {
  resetHooks(); vi.resetModules(); vi.unstubAllEnvs();
  vi.useFakeTimers(); vi.setSystemTime(new Date(NOW));
  fixture.locale = "pl"; fixture.initialized = true; fixture.signedIn = false;
  fixture.signInWithOAuth.mockReset(); fixture.signInWithEmail.mockReset(); fixture.verifyEmailOTP.mockReset();
  fixture.persist.mockClear(); fixture.notify.mockClear();
  fixture.signInWithOAuth.mockImplementation(() => { throw Error("TEST_C57 unplanned OAuth adapter call"); });
  fixture.signInWithEmail.mockImplementation(() => { throw Error("TEST_C57 unplanned email adapter call"); });
  fixture.verifyEmailOTP.mockImplementation(() => { throw Error("TEST_C57 unplanned OTP adapter call"); });
  timeline = []; writes = []; reads = [];
  local = new Map([["coachfi-user", ' {"name":"TEST_C57_LOCAL","goal":"TEST_C57_GOAL","setupDone":true}\n'],
    ["coachfi-srs", " [] "], ["coachfi-tokens", "125"], ["coachfi-lesson-steps", '{"inflation":2}'],
    ["coachfi-auth", "TEST_C57_SYNTHETIC_UNRELATED_KEEP"]]);
  session = new Map([["coachfi-user", ' {"setupDone":false}\n'], ["coachfi-srs", "[]"],
    ["coachfi-tokens", "9"], ["cdp-session", "TEST_C57_SYNTHETIC_SESSION_KEEP"]]);
  const win = Object.assign(new EventTarget(), { localStorage: physicalStorage(local, "local"), sessionStorage: physicalStorage(session, "session") });
  vi.stubGlobal("window", win);
  outbound = vi.fn(() => { throw Error("TEST_C57 forbids actual network"); }); vi.stubGlobal("fetch", outbound);
  for (const key of ["NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED", "NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON", "NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS"]) vi.stubEnv(key, "0");
  ownership = await import("@/lib/product-storage");
  expect(ownership.beginStorageOwner({ kind: "guest" }).publishReady()).toBe(true);
  initialOwner = ownership.getStorageOwnershipSnapshot(); initialData = snapshotData();
});

afterEach(() => {
  console.info("C57_SIGNIN_RECOVERY_OBSERVATIONS " + JSON.stringify({
    test: expect.getState().currentTestName, locale: fixture.locale, timeline,
    rawBefore: initialData, rawAfter: snapshotData(), writes, reads,
    ownerBefore: initialOwner, ownerAfter: ownership.getStorageOwnershipSnapshot(),
  }));
  try {
    expect(snapshotData()).toEqual(initialData);
    expect(ownership.getStorageOwnershipSnapshot()).toEqual(initialOwner);
    expect(writes).toEqual([]); expect(outbound).not.toHaveBeenCalled();
    expect(fixture.persist).not.toHaveBeenCalled(); expect(fixture.notify).not.toHaveBeenCalled();
  } finally {
    resetHooks(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  }
});

describe.each(["pl", "en"] as const)("C57 actual SignInGate %s manual OFF recovery", locale => {
  it("locks pending actions and rejects post-render duplicate or alternative handlers", async () => {
    await prepare(locale); changeInput("email", EMAIL);
    const pending = deferred<void>(); fixture.signInWithOAuth.mockReturnValueOnce(pending.promise);
    invoke(mustButton("Telegram")); const locked = observe("telegram-pending");
    for (const label of SOCIAL_LABELS) invoke(mustButton(label), true);
    invoke(actionButton(), true); observe("post-render-disabled-handler-probes");
    expect(locked.dialogs).toBe(1); expect(locked.manualRequested).toBe(true); expect(locked.signedInHook).toBe(false);
    expect(locked.socialButtons.every(value => value.exists && value.disabled)).toBe(true);
    expect(locked.action?.disabled).toBe(true); expect(locked.closeDisabled).toBe(false);
    expect(fixture.signInWithOAuth.mock.calls).toEqual([["telegram"]]);
    expect(fixture.signInWithEmail).not.toHaveBeenCalled(); expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
    pending.resolve(undefined); await flushMicrotasks(); observe("pending-case-cleanup-normal-return");
  });

  it("releases normal undefined Telegram cancellation and admits only an explicit retry", async () => {
    await prepare(locale);
    const first = deferred<void>(), retry = deferred<void>();
    fixture.signInWithOAuth.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
    invoke(mustButton("Telegram")); observe("first-telegram-pending");
    first.resolve(undefined); await flushMicrotasks();
    const recovered = observe("cancel-normal-resolved-undefined");
    let retried = false;
    if (button("Telegram")?.props.disabled === false) { invoke(mustButton("Telegram")); retried = true; }
    const next = observe("explicit-retry-attempt", { retried });
    retry.resolve(undefined); await flushMicrotasks(); observe("retry-normal-settlement");
    expectAvailable(recovered); expect(recovered.alerts).toEqual([]);
    expect(retried).toBe(true); expect(next.action?.disabled).toBe(true);
    expect(fixture.signInWithOAuth.mock.calls).toEqual([["telegram"], ["telegram"]]);
    expect(fixture.signInWithEmail).not.toHaveBeenCalled(); expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
    expect(api.isSignInRequested()).toBe(true); expect(fixture.signedIn).toBe(false);
  });

  it("allows the email alternative after Telegram cancellation without claiming sign-in", async () => {
    await prepare(locale); changeInput("email", "  " + EMAIL + "  ");
    const telegram = deferred<void>(), email = deferred<{ flowId: string }>();
    fixture.signInWithOAuth.mockReturnValueOnce(telegram.promise); fixture.signInWithEmail.mockReturnValueOnce(email.promise);
    invoke(mustButton("Telegram")); observe("telegram-before-email-alternative");
    telegram.resolve(undefined); await flushMicrotasks(); const recovered = observe("cancel-before-email-alternative");
    let sent = false;
    if (actionButton().props.disabled === false) { invoke(actionButton()); sent = true; }
    observe("explicit-email-attempt", { sent });
    email.resolve({ flowId: FLOW }); await flushMicrotasks(); const codeView = observe("email-flow-result-no-auth");
    expectAvailable(recovered); expect(sent).toBe(true);
    expect(fixture.signInWithOAuth.mock.calls).toEqual([["telegram"]]);
    expect(fixture.signInWithEmail.mock.calls).toEqual([[{ email: EMAIL }]]);
    expect(codeView.otpInput).toBe(""); expect(codeView.emailInput).toBeNull();
    expect(codeView.action).toEqual({ label: COPY[locale].verify, disabled: false });
    expect(codeView.socialButtons.every(value => !value.exists)).toBe(true);
    expect(codeView.manualRequested).toBe(true); expect(codeView.signedInHook).toBe(false);
    expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
  });

  it("keeps optional close state-only and reopens retryable after a closed pending attempt settles", async () => {
    await prepare(locale);
    const telegram = deferred<void>(); fixture.signInWithOAuth.mockReturnValueOnce(telegram.promise);
    invoke(mustButton("Telegram")); observe("pending-before-manual-close");
    invoke(mustButton(COPY[locale].close)); const closed = observe("manual-close-while-pending");
    telegram.resolve(undefined); await flushMicrotasks(); const stayedClosed = observe("cancel-settled-while-closed");
    api.requestSignIn(); settle(); const reopened = observe("explicit-reopen-after-settlement");
    expect(closed.dialogs).toBe(0); expect(closed.manualRequested).toBe(false);
    expect(stayedClosed.dialogs).toBe(0); expect(stayedClosed.manualRequested).toBe(false);
    expectAvailable(reopened); expect(reopened.alerts).toEqual([]);
    expect(fixture.signInWithOAuth.mock.calls).toEqual([["telegram"]]);
    expect(fixture.signInWithEmail).not.toHaveBeenCalled(); expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
  });

  it("preserves ordinary rejection cleanup and clears its error only on an explicit retry", async () => {
    await prepare(locale);
    const first = deferred<void>(), retry = deferred<void>();
    fixture.signInWithOAuth.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
    invoke(mustButton("Telegram")); first.reject(Error("TEST_C57_PROVIDER_REJECTED")); await flushMicrotasks();
    const rejected = observe("ordinary-rejection");
    invoke(mustButton("Telegram")); const next = observe("explicit-retry-clears-error");
    retry.resolve(undefined); await flushMicrotasks();
    expectAvailable(rejected); expect(rejected.alerts).toEqual(["TEST_C57_PROVIDER_REJECTED"]);
    expect(next.alerts).toEqual([]); expect(next.action?.disabled).toBe(true);
    expect(fixture.signInWithOAuth.mock.calls).toEqual([["telegram"], ["telegram"]]);
    expect(fixture.signInWithEmail).not.toHaveBeenCalled(); expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
  });

  it("retains fulfilled Google Apple and X redirect busy behavior without false success", async () => {
    await prepare(locale);
    for (const [provider, label] of [["google", "Google"], ["apple", "Apple"], ["x", "X"]] as const) {
      // Explicit independent mount per redirect control; still one grouped case.
      resetHooks(); settle();
      const pending = deferred<void>(); fixture.signInWithOAuth.mockReturnValueOnce(pending.promise);
      invoke(mustButton(label)); observe(provider + "-pending");
      pending.resolve(undefined); await flushMicrotasks(); const redirected = observe(provider + "-fulfilled-redirect-contract");
      expect(redirected.dialogs).toBe(1); expect(redirected.manualRequested).toBe(true);
      expect(redirected.signedInHook).toBe(false); expect(redirected.alerts).toEqual([]);
      expect(redirected.socialButtons.every(value => value.exists && value.disabled)).toBe(true);
      expect(redirected.action?.disabled).toBe(true);
    }
    expect(fixture.signInWithOAuth.mock.calls).toEqual([["google"], ["apple"], ["x"]]);
    expect(fixture.signInWithEmail).not.toHaveBeenCalled(); expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
  });

  it("preserves email flow and OTP pending rejection retry and verified-completion dismissal", async () => {
    await prepare(locale); changeInput("email", "  " + EMAIL + "  ");
    const email = deferred<{ flowId: string }>(), badOtp = deferred<void>(), goodOtp = deferred<void>();
    fixture.signInWithEmail.mockReturnValueOnce(email.promise);
    fixture.verifyEmailOTP.mockReturnValueOnce(badOtp.promise).mockReturnValueOnce(goodOtp.promise);
    invoke(actionButton()); const sending = observe("email-send-pending");
    email.resolve({ flowId: FLOW }); await flushMicrotasks(); const flow = observe("email-flow-still-signed-out");
    changeInput("otp", "  123456  "); invoke(actionButton()); const checking = observe("otp-pending");
    badOtp.reject(Error("TEST_C57_OTP_REJECTED")); await flushMicrotasks(); const rejected = observe("otp-rejection");
    invoke(actionButton()); observe("otp-explicit-retry"); goodOtp.resolve(undefined); await flushMicrotasks(); const completed = observe("mock-verified-OTP-completion");
    expect(sending.action).toEqual({ label: COPY[locale].sending, disabled: true });
    expect(flow.otpInput).toBe(""); expect(flow.manualRequested).toBe(true); expect(flow.signedInHook).toBe(false);
    expect(checking.action).toEqual({ label: COPY[locale].checking, disabled: true });
    expect(rejected.action).toEqual({ label: COPY[locale].verify, disabled: false });
    expect(rejected.alerts).toEqual(["TEST_C57_OTP_REJECTED"]); expect(rejected.manualRequested).toBe(true);
    expect(completed.dialogs).toBe(0); expect(completed.manualRequested).toBe(false);
    expect(fixture.signInWithEmail.mock.calls).toEqual([[{ email: EMAIL }]]);
    expect(fixture.verifyEmailOTP.mock.calls).toEqual([[{ flowId: FLOW, otp: "123456" }], [{ flowId: FLOW, otp: "123456" }]]);
    expect(fixture.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("preserves initialization and authoritative signed-in hook visibility gates", async () => {
    fixture.locale = locale; fixture.initialized = false;
    api = await import("@/lib/signInGate"); render = (await import("@/components/SignInGate")).SignInGate;
    settle(); api.requestSignIn(); settle(); const uninitialized = observe("uninitialized-manual-request");
    fixture.initialized = true; settle(); const initialized = observe("initialized-signed-out");
    fixture.signedIn = true; settle(); const signedIn = observe("explicit-authoritative-hook-signed-in");
    fixture.signedIn = false; settle(); const signedOutAgain = observe("hook-signed-out-after-dismissal");
    expect(uninitialized.dialogs).toBe(0); expect(uninitialized.manualRequested).toBe(true);
    expectAvailable(initialized); expect(initialized.title).toBe(COPY[locale].title);
    expect(signedIn.dialogs).toBe(0); expect(signedIn.manualRequested).toBe(false);
    expect(signedOutAgain.dialogs).toBe(0); expect(signedOutAgain.manualRequested).toBe(false);
    expect(fixture.signInWithOAuth).not.toHaveBeenCalled(); expect(fixture.signInWithEmail).not.toHaveBeenCalled();
    expect(fixture.verifyEmailOTP).not.toHaveBeenCalled();
  });
});
