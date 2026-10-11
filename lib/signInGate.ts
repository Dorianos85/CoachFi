import { moneyMindsetLesson } from "@/data/moneyMindsetLesson";
import { stageLessons } from "@/data/stageLessons";
import { getAllStageProgress } from "@/lib/learningProgress";

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
  lessonsFinished: envInt(process.env.NEXT_PUBLIC_SIGN_IN_LESSONS_FINISHED, 1),
  stepsInAnotherLesson: envInt(process.env.NEXT_PUBLIC_SIGN_IN_STEPS_IN_ANOTHER_LESSON, 1),
  agentConversationMs: envInt(process.env.NEXT_PUBLIC_SIGN_IN_AGENT_CONVERSATION_MS, 3 * 60 * 1000),
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
const openConversations = new Set<string>();
let storedAgentMs = 0;
let agentLoaded = false;
let activeSince: number | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;
let pagehideBound = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function readSteps(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const steps: Record<string, number> = {};
    for (const [stageId, value] of Object.entries(parsed)) {
      if (typeof value === "number" && value > 0) steps[stageId] = Math.floor(value);
    }
    return steps;
  } catch {
    return {};
  }
}

function loadAgentMs() {
  if (agentLoaded || typeof window === "undefined") return;
  agentLoaded = true;
  const raw = Number(localStorage.getItem(AGENT_MS_KEY));
  storedAgentMs = Number.isFinite(raw) && raw > 0 ? raw : 0;
  if (!pagehideBound) {
    pagehideBound = true;
    window.addEventListener("pagehide", commitRunningAgentTime);
  }
}

function saveAgentMs() {
  if (typeof window === "undefined") return;
  localStorage.setItem(AGENT_MS_KEY, String(storedAgentMs));
}

function commitRunningAgentTime() {
  if (activeSince == null) return;
  storedAgentMs += Date.now() - activeSince;
  activeSince = openConversations.size > 0 ? Date.now() : null;
  saveAgentMs();
}

function ensureTicker() {
  if (ticker != null || openConversations.size === 0) return;
  ticker = setInterval(() => notify(), 1000);
}

function stopTicker() {
  if (ticker == null || openConversations.size > 0) return;
  clearInterval(ticker);
  ticker = null;
}

export function getAgentConversationMs() {
  loadAgentMs();
  const running = activeSince == null ? 0 : Date.now() - activeSince;
  return storedAgentMs + running;
}

export function beginAgentConversation(source: string) {
  loadAgentMs();
  if (openConversations.has(source)) return;
  if (openConversations.size === 0) activeSince = Date.now();
  openConversations.add(source);
  ensureTicker();
  notify();
}

export function endAgentConversation(source: string) {
  loadAgentMs();
  if (!openConversations.delete(source)) return;
  if (openConversations.size === 0) commitRunningAgentTime();
  stopTicker();
  notify();
}

export function recordLessonStep(stageId: string, step: number) {
  if (typeof window === "undefined" || step < 1) return;
  const steps = readSteps();
  if ((steps[stageId] ?? 0) >= step) return;
  steps[stageId] = step;
  localStorage.setItem(STEPS_KEY, JSON.stringify(steps));
  notify();
}

export function currentSignInProgress(): SignInProgress {
  return {
    stepsSeen: readSteps(),
    completedStageIds: getAllStageProgress()
      .filter((stage) => stage.status === "completed")
      .map((stage) => stage.stageId),
    agentConversationMs: getAgentConversationMs(),
    stepCounts: lessonStepCounts(),
  };
}

export function isSignInRequiredNow() {
  return signInRequired(currentSignInProgress(), SIGN_IN_GATE);
}

export function subscribeSignInProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
