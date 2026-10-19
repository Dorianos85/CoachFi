import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { SignInGateConfig } from "@/lib/signInGate";

const effects = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.cloud }));
const off: SignInGateConfig = { lessonsFinished: 0, stepsInAnotherLesson: 0, agentConversationMs: 0 };
const lessonRule: SignInGateConfig = { lessonsFinished: 1, stepsInAnotherLesson: 1, agentConversationMs: 0 };
interface State { bytes: Map<string, string>; initial: [string, string][]; storage: PersonalStorageHandle }
interface Observation {
  label: string; classification: "acceptance oracle" | "diagnostic finding" | "healthy control";
  value?: unknown; error: { name: string; message: string } | null; reads: unknown[][];
  details?: unknown;
}
const observations: Observation[] = [];
let states: State[];
function ram(patch: Record<string, string> = {}, denied: string[] = []): State {
  const bytes = new Map(Object.entries({
    "coachfi-srs": "[]", "coachfi-learn-manual": "{}", "coachfi-lesson-steps": "{}", "coachfi-agent-ms": "0", ...patch,
  }));
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 21, area: "local", isCurrent: vi.fn(() => true),
    getItem: vi.fn(key => { if (denied.includes(key)) throw new Error("FIXTURE denied " + key); return bytes.get(key) ?? null; }),
    setItem: vi.fn(() => { throw new Error("C21 baseline forbids product writes"); }),
    removeItem: vi.fn(() => { throw new Error("C21 baseline forbids removal"); }),
    release: vi.fn(() => { throw new Error("C21 baseline forbids owner release"); }),
  };
  const state = { bytes, initial: [...bytes], storage }; states.push(state); return state;
}
async function load(state: State, config: SignInGateConfig = off) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED", String(config.lessonsFinished));
  vi.stubEnv("NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON", String(config.stepsInAnotherLesson));
  vi.stubEnv("NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS", String(config.agentConversationMs));
  const product = await import("@/lib/product-storage");
  // Only the default handle lookup is captured. Gate, progress, steps and timer readers remain real.
  const capture = vi.spyOn(product, "captureCurrentPersonalStorage").mockReturnValue(state.storage);
  const api = await import("@/lib/signInGate");
  return { api, capture };
}
function observe(label: string, classification: Observation["classification"], state: State, run: () => unknown): Observation {
  let value: unknown, error: Observation["error"] = null;
  try { value = run(); } catch (cause) {
    error = cause instanceof Error ? { name: cause.name, message: cause.message } : { name: "Thrown", message: String(cause) };
  }
  const result = { label, classification, value, error, reads: [...vi.mocked(state.storage.getItem).mock.calls] };
  observations.push(result); return result;
}
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); states = [];
  vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C21 baseline forbids remote calls"); }));
});
afterEach(() => {
  for (const state of states) {
    expect([...state.bytes]).toEqual(state.initial);
    expect(state.storage.setItem).not.toHaveBeenCalled(); expect(state.storage.removeItem).not.toHaveBeenCalled(); expect(state.storage.release).not.toHaveBeenCalled();
  }
  expect(fetch).not.toHaveBeenCalled(); expect(effects.cloud).not.toHaveBeenCalled(); expect(effects.persist).not.toHaveBeenCalled();
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
});
afterAll(() => {
  // Raw launch stdout preserves diagnostic observations even when acceptance assertions fail.
  console.log("C21 SYNTHETIC BASELINE OBSERVATIONS " + JSON.stringify(observations));
});

describe("C21 OFF acceptance oracles: disabled rules are known without progress reads", () => {
  it.each(["{}", "[FIXTURE malformed JSON"])("exact OFF with SRS %j never captures or reads progress", async raw => {
    const state = ram({ "coachfi-srs": raw }), { api, capture } = await load(state);
    expect(api.SIGN_IN_GATE).toEqual(off);
    capture.mockClear(); vi.mocked(state.storage.getItem).mockClear();
    const outcome = observe("OFF opaque SRS " + raw, "acceptance oracle", state, () => api.isSignInRequiredNow());
    outcome.details = { captureCalls: capture.mock.calls.length, rawPreserved: state.bytes.get("coachfi-srs") === raw };
    expect(outcome.error, "Configured OFF must not enter unavailable progress readers").toBeNull();
    expect(outcome.value).toBe(false);
    expect(capture).not.toHaveBeenCalled(); expect(state.storage.getItem).not.toHaveBeenCalled();
  });
  it("OFF explicit request reaches both subscribers without capture or a history-read exception", async () => {
    const state = ram({ "coachfi-srs": "{}" }), { api, capture } = await load(state);
    const first: { required: boolean; requested: boolean }[] = [], later = vi.fn();
    const stopFirst = api.subscribeSignInProgress(() => { first.push({ required: api.isSignInRequiredNow(), requested: api.isSignInRequested() }); });
    const stopLater = api.subscribeSignInProgress(() => { later(api.isSignInRequested()); });
    expect(api.SIGN_IN_GATE).toEqual(off);
    capture.mockClear(); vi.mocked(state.storage.getItem).mockClear();
    try {
      const outcome = observe("OFF request notification", "acceptance oracle", state, () => api.requestSignIn());
      outcome.details = { first: [...first], laterCalls: later.mock.calls, requested: api.isSignInRequested(), captureCalls: capture.mock.calls.length };
      expect(outcome.error, "An irrelevant progress cache must not abort explicit request delivery").toBeNull();
      expect(api.isSignInRequested()).toBe(true); expect(first).toEqual([{ required: false, requested: true }]);
      expect(later).toHaveBeenCalledExactlyOnceWith(true);
      expect(capture).not.toHaveBeenCalled(); expect(state.storage.getItem).not.toHaveBeenCalled();
    } finally { stopFirst(); stopLater(); }
  });
});

describe("C21 healthy controls and non-OFF diagnostic observations, not product acceptance", () => {
  it("healthy pure signInRequired preserves explicit lesson, time, partial and OFF configurations", async () => {
    const state = ram(), { api, capture } = await load(state);
    const progress = { stepsSeen: { "money-mindset": 3, "saving-habit": 1 }, completedStageIds: [], agentConversationMs: 5000, stepCounts: api.lessonStepCounts() };
    const outcome = observe("healthy explicit pure configs", "healthy control", state, () => ({
      lesson: api.signInRequired(progress, lessonRule),
      time: api.signInRequired(progress, { ...off, agentConversationMs: 5000 }),
      partial: api.signInRequired(progress, { ...off, lessonsFinished: 1 }),
      off: api.signInRequired(progress, off),
    }));
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual({ lesson: true, time: true, partial: false, off: false });
    expect(capture).not.toHaveBeenCalled(); expect(state.storage.getItem).not.toHaveBeenCalled();
  });
  it("healthy actual currentSignInProgress and ON rules retain timer below/equal and lesson pair below/fulfilled", async () => {
    const controls = [
      { label: "timer below", config: { ...off, agentConversationMs: 5000 }, ms: "4999", anotherSteps: 0, required: false },
      { label: "timer equal", config: { ...off, agentConversationMs: 5000 }, ms: "5000", anotherSteps: 0, required: true },
      { label: "lesson pair below", config: lessonRule, ms: "0", anotherSteps: 0, required: false },
      { label: "lesson pair fulfilled", config: lessonRule, ms: "0", anotherSteps: 1, required: true },
    ];
    for (const control of controls) {
      const state = ram({ "coachfi-learn-manual": '{"money-mindset":"completed"}', "coachfi-lesson-steps": JSON.stringify({ "money-mindset": 3, "saving-habit": control.anotherSteps }), "coachfi-agent-ms": control.ms });
      const { api } = await load(state, control.config);
      expect(api.SIGN_IN_GATE).toEqual(control.config);
      const outcome = observe("healthy actual " + control.label, "healthy control", state, () => ({ progress: api.currentSignInProgress(state.storage), required: api.isSignInRequiredNow() }));
      expect(outcome.error).toBeNull(); expect(outcome.value).toEqual({ progress: {
        stepsSeen: { "money-mindset": 3, "saving-habit": control.anotherSteps }, completedStageIds: ["money-mindset"], agentConversationMs: Number(control.ms), stepCounts: api.lessonStepCounts(),
      }, required: control.required });
    }
  });
  it("DIAGNOSTIC FINDING: partial non-OFF configuration still enters the legacy non-array SRS reader", async () => {
    const state = ram({ "coachfi-srs": "{}" }), { api, capture } = await load(state, { ...off, lessonsFinished: 1 });
    const outcome = observe("partial rule legacy SRS TypeError", "diagnostic finding", state, () => api.isSignInRequiredNow());
    expect(outcome.error?.name).toBe("TypeError"); expect(capture).toHaveBeenCalledTimes(1);
    expect(state.storage.getItem).toHaveBeenCalledWith("coachfi-srs");
  });
  it("DIAGNOSTIC FINDING: malformed SRS under enabled rules is projected as no completed stages", async () => {
    const state = ram({ "coachfi-srs": "[FIXTURE malformed JSON" }), { api } = await load(state, lessonRule);
    const outcome = observe("enabled malformed SRS fallback", "diagnostic finding", state, () => api.currentSignInProgress(state.storage));
    expect(outcome.error).toBeNull(); expect(outcome.value).toMatchObject({ completedStageIds: [] });
  });
  it.each(["invalid", "denied"] as const)("DIAGNOSTIC FINDING: %s manual cache under enabled rules becomes no overrides", async mode => {
    const state = ram({ "coachfi-learn-manual": mode === "invalid" ? '["completed"]' : '{"money-mindset":"completed"}' }, mode === "denied" ? ["coachfi-learn-manual"] : []);
    const { api } = await load(state, lessonRule);
    const outcome = observe("enabled manual " + mode, "diagnostic finding", state, () => api.currentSignInProgress(state.storage));
    expect(outcome.error).toBeNull(); expect(outcome.value).toMatchObject({ completedStageIds: [] });
  });
  it.each(["invalid", "denied"] as const)("DIAGNOSTIC FINDING: %s step cache under enabled rules is projected as empty steps", async mode => {
    const state = ram({ "coachfi-lesson-steps": mode === "invalid" ? '{"money-mindset":1.5}' : '{"money-mindset":3}' }, mode === "denied" ? ["coachfi-lesson-steps"] : []);
    const { api } = await load(state, lessonRule);
    const outcome = observe("enabled steps " + mode, "diagnostic finding", state, () => api.currentSignInProgress(state.storage));
    expect(outcome.error).toBeNull(); expect(outcome.value).toMatchObject({ stepsSeen: {} });
  });
  it("DIAGNOSTIC FINDING: unavailable agent time is numeric zero in progress while its real status is unavailable", async () => {
    const state = ram({ "coachfi-agent-ms": "FIXTURE invalid ms" }), { api } = await load(state, { ...off, agentConversationMs: 5000 });
    const outcome = observe("enabled timer unavailable projection", "diagnostic finding", state, () => ({ progress: api.currentSignInProgress(state.storage), status: api.getAgentConversationStatus(state.storage) }));
    expect(outcome.error).toBeNull(); expect(outcome.value).toMatchObject({ progress: { agentConversationMs: 0 }, status: "unavailable" });
  });
});
