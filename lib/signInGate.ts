import { moneyMindsetLesson } from "@/data/moneyMindsetLesson";
import { stageLessons } from "@/data/stageLessons";
import { getAllStageProgress } from "@/lib/learningProgress";
import { readLessonStepState, saveLessonStep } from "@/lib/lesson-step-save";
import { createAgentTimeController, type AgentTimeStatus } from "@/lib/agent-time-save";
import { assertCurrentPersonalStorage, captureCurrentPersonalStorage, getStorageOwnershipSnapshot,
  subscribeStorageOwnership, type PersonalStorageHandle } from "@/lib/product-storage";

const STEPS_KEY = "coachfi-lesson-steps";
const AGENT_MS_KEY = "coachfi-agent-ms";

export type SignInGateConfig = {
  lessonsFinished: number;
  stepsInAnotherLesson: number;
  agentConversationMs: number;
};

export type SignInProgress = {
  stepsSeen: Record<string, number>;
  completedStageIds: string[];
  agentConversationMs: number;
  stepCounts: Record<string, number>;
};

function envInt(value: string | undefined, fallback: number) {
  if (value == null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

// 0 turns that rule off. Change these in `.env.local` without editing the gate.
export const SIGN_IN_GATE: SignInGateConfig = {
  lessonsFinished: envInt(process.env.NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED, 0),
  stepsInAnotherLesson: envInt(process.env.NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON, 0),
  agentConversationMs: envInt(process.env.NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS, 0),
};

export function lessonStepCounts(): Record<string, number> {
  return {
    "money-mindset": moneyMindsetLesson.en.steps.length,
    ...Object.fromEntries(
      Object.entries(stageLessons).map(([stageId, lesson]) => [stageId, lesson.copy.en.steps.length]),
    ),
  };
}

export function signInRequired(progress: SignInProgress, config: SignInGateConfig): boolean {
  if (config.agentConversationMs > 0 && progress.agentConversationMs >= config.agentConversationMs) {
    return true;
  }

  if (config.lessonsFinished <= 0 || config.stepsInAnotherLesson <= 0) return false;

  const finished = Object.keys(progress.stepCounts).filter((stageId) => {
    const total = progress.stepCounts[stageId] ?? 0;
    const seen = progress.stepsSeen[stageId] ?? 0;
    return progress.completedStageIds.includes(stageId) || (total > 0 && seen >= total);
  });
  if (finished.length < config.lessonsFinished) return false;

  const countedFinished = new Set(finished.slice(0, config.lessonsFinished));
  return Object.keys(progress.stepCounts).some((stageId) => {
    if (countedFinished.has(stageId)) return false;
    return (progress.stepsSeen[stageId] ?? 0) >= config.stepsInAnotherLesson;
  });
}

const listeners = new Set<() => void>();
let signInRequested = false;

export function requestSignIn() {
  signInRequested = true;
  notify();
}

export function dismissSignInRequest() {
  if (!signInRequested) return;
  signInRequested = false;
  notify();
}

export function isSignInRequested() {
  return signInRequested;
}

const agentTime = createAgentTimeController(notifyAgentProgress);
let ticker: ReturnType<typeof setInterval> | null = null;
let pagehideBound = false;
let ownerRevision = getStorageOwnershipSnapshot().revision;
subscribeStorageOwnership(() => {
  const revision = getStorageOwnershipSnapshot().revision;
  if (revision !== ownerRevision) {
    ownerRevision = revision;
    if (ticker !== null) clearInterval(ticker);
    ticker = null; agentTime.reset(); signInRequested = false;
  }
  notify();
});

function notify() {
  listeners.forEach((listener) => listener());
}

function notifyAgentProgress() {
  let failed = false;
  let firstError: unknown;
  for (const listener of listeners) {
    try {
      const value: unknown = listener();
      if (value !== null && (typeof value === "object" || typeof value === "function") &&
        typeof (value as { then?: unknown }).then === "function") {
        if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
        throw new Error("Agent time subscribers must be synchronous");
      }
    } catch (error) {
      if (!failed) { failed = true; firstError = error; }
    }
  }
  if (failed) throw firstError;
}

function readSteps(storage: PersonalStorageHandle): Record<string, number> {
  const state = readLessonStepState(storage, lessonStepCounts());
  return state.status === "ready" ? { ...state.steps } : {};
}

function bindAgentPagehide() {
  if (typeof window === "undefined" || pagehideBound) return;
  pagehideBound = true;
  window.addEventListener("pagehide", () => { agentTime.checkpointSafe(); stopTicker(); });
}

function ensureTicker() {
  if (ticker !== null || !agentTime.isActive()) return;
  ticker = setInterval(() => { agentTime.tickSafe(); stopTicker(); }, 1000);
}

function stopTicker() {
  if (ticker === null || agentTime.isActive()) return;
  clearInterval(ticker);
  ticker = null;
}

export function getAgentConversationMs(storage = captureCurrentPersonalStorage()) {
  const value = agentTime.read(storage);
  stopTicker();
  return value;
}

export function getAgentConversationStatus(storage = captureCurrentPersonalStorage()): AgentTimeStatus {
  const status = agentTime.status(storage);
  stopTicker();
  return status;
}

export function beginAgentConversation(source: string, storage = captureCurrentPersonalStorage()) {
  bindAgentPagehide();
  try { agentTime.begin(source, storage); ensureTicker(); } finally { stopTicker(); }
}

export function endAgentConversation(source: string, storage = captureCurrentPersonalStorage()) {
  try { agentTime.end(source, storage); } finally { stopTicker(); }
}

export function recordLessonStep(stageId: string, step: number, storage = captureCurrentPersonalStorage()) {
  saveLessonStep(stageId, step, storage, lessonStepCounts(), notify);
}

export function currentSignInProgress(storage = captureCurrentPersonalStorage()): SignInProgress {
  return {
    stepsSeen: readSteps(storage),
    completedStageIds: getAllStageProgress(storage)
      .filter((stage) => stage.status === "completed")
      .map((stage) => stage.stageId),
    agentConversationMs: getAgentConversationMs(storage),
    stepCounts: lessonStepCounts(),
  };
}

export function isSignInRequiredNow() {
  if (SIGN_IN_GATE.lessonsFinished === 0 &&
      SIGN_IN_GATE.stepsInAnotherLesson === 0 &&
      SIGN_IN_GATE.agentConversationMs === 0) return false;
  return signInRequired(currentSignInProgress(), SIGN_IN_GATE);
}

export function subscribeSignInProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
