import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Frame = { slot: number; values: Map<number, unknown> };
const fixture = vi.hoisted(() => ({
  frame: null as unknown as Frame, locale: "pl" as "pl" | "en",
  storage: null as unknown as PersonalStorageHandle, params: new URLSearchParams("topic=mindset"),
  bytes: new Map<string, string>(), reads: [] as string[], writes: [] as string[],
  activity: vi.fn(), cloud: vi.fn(), persist: vi.fn(), updates: vi.fn(),
}));
// Persistent framework dispatcher only. State is changed exclusively by setters
// that the actual parent closes over; no quizDone/URL slot is written by a test.
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const frame = fixture.frame, slot = frame.slot++;
    if (!frame.values.has(slot)) frame.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [frame.values.get(slot), (next: unknown) => {
      fixture.updates(); frame.values.set(slot, typeof next === "function" ? next(frame.values.get(slot)) : next);
    }];
  },
}));
vi.mock("next/navigation", () => ({ useSearchParams: () => fixture.params }));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.activity }) }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: fixture.persist }));

const ORIGIN = "https://fixture-coachfi.invalid";
const NAMES = [
  { label: "lone high surrogate", name: "\uD800", expected: "\uFFFD" },
  { label: "lone low surrogate", name: "\uDC00", expected: "\uFFFD" },
  { label: "embedded lone high surrogate", name: "A\uD800B", expected: "A\uFFFDB" },
  { label: "separated unmatched high and low", name: "\uD800X\uDC00", expected: "\uFFFDX\uFFFD" },
  { label: "healthy Unicode emoji and trim", name: " Łucja 🌱 ", expected: "Łucja 🌱" },
  { label: "literal percent sequence", name: " %2F ", expected: "%2F" },
  { label: "spaces plus ampersand and slash", name: " Ada + B&C/ ", expected: "Ada + B&C/" },
  { label: "empty name keeps Your fallback", name: "", expected: "Your" },
] as const;
type Props = { children?: unknown; onComplete?: (correct: number, total: number) => void;
  url?: string; text?: string; title?: string };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!isValidElement<Props>(value)) return [];
  return [value, ...nodes(value.props.children)];
}
function codeUnits(text: string) { return Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)); }

async function sampleBranch(branch: "server" | "client") {
  fixture.frame = { slot: 0, values: new Map() };
  if (branch === "server") vi.stubGlobal("window", undefined);
  else vi.stubGlobal("window", Object.assign(new EventTarget(), { location: { origin: ORIGIN } }));
  const { default: Page } = await import("@/app/quiz/page");
  const { QuizCard } = await import("@/components/QuizCard");
  const { SocialShare } = await import("@/components/SocialShare");
  const wrapper = Page() as ReactElement<{ children?: unknown }>, child = wrapper.props.children;
  if (!isValidElement(child) || typeof child.type !== "function") throw new Error("FIXTURE expected actual QuizPageContent");
  const content = child.type as () => ReactElement;
  const render = () => { fixture.frame.slot = 0; return content(); };
  let stage = "initial", completed = false, initialShareCount: number | undefined;
  let url: string | undefined, text: string | undefined, title: string | undefined;
  let error: { name: string; message: string } | null = null;
  try {
    const initial = render();
    initialShareCount = nodes(initial).filter(node => node.type === SocialShare).length;
    const cards = nodes(initial).filter(node => node.type === QuizCard);
    const card = cards[0];
    if (cards.length !== 1 || !card || typeof card.props.onComplete !== "function") {
      throw new Error("FIXTURE expected one actual parent-authored QuizCard onComplete callback");
    }
    stage = "completion callback";
    card.props.onComplete(3, 4); // Callback contract only, not actual answers or a scoring-policy test.
    completed = true; stage = "completed render";
    const shares = nodes(render()).filter(node => node.type === SocialShare);
    const share = shares[0];
    if (shares.length !== 1 || !share || typeof share.props.url !== "string") {
      throw new Error("FIXTURE expected actual parent-authored SocialShare url prop");
    }
    ({ url, text, title } = share.props);
  } catch (caught) {
    error = caught instanceof Error ? { name: caught.name, message: caught.message }
      : { name: "non-Error", message: String(caught) };
  }
  return { branch, stage, error, completed, initialShareCount, url, text, title,
    profileRaw: fixture.bytes.get("coachfi-user"), tokens: fixture.bytes.get("coachfi-tokens"),
    reads: [...fixture.reads], writes: [...fixture.writes], activityCalls: fixture.activity.mock.calls.length,
    cloudCalls: fixture.cloud.mock.calls.length, persistCalls: fixture.persist.mock.calls.length,
    fetchCalls: vi.mocked(fetch).mock.calls.length };
}

beforeEach(() => {
  vi.clearAllMocks(); fixture.locale = "pl"; fixture.frame = { slot: 0, values: new Map() };
  fixture.params = new URLSearchParams("topic=mindset"); fixture.bytes.clear(); fixture.bytes.set("coachfi-tokens", "125");
  fixture.reads.length = 0; fixture.writes.length = 0;
  fixture.storage = Object.freeze({ owner: Object.freeze({ kind: "guest" as const }), revision: 44, area: "local" as const,
    isCurrent: () => true,
    getItem: (key: string) => { fixture.reads.push(key); return fixture.bytes.get(key) ?? null; },
    setItem: (key: string) => { fixture.writes.push("set:" + key); throw new Error("FIXTURE derived share URL must not write"); },
    removeItem: (key: string) => { fixture.writes.push("remove:" + key); throw new Error("FIXTURE derived share URL must not remove"); },
    release: () => { throw new Error("FIXTURE derived share URL must not release storage"); },
  });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("FIXTURE no network in C44 URL encoding review"); }));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled(); expect(fixture.writes).toEqual([]);
  expect(fixture.activity).not.toHaveBeenCalled(); expect(fixture.cloud).not.toHaveBeenCalled(); expect(fixture.persist).not.toHaveBeenCalled();
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe.each(["pl", "en"] as const)("C44 actual QuizPageContent derived share URL %s", locale => {
  it.each(NAMES)("$label reaches the completion callback and preserves decoded query semantics", async item => {
    fixture.locale = locale;
    const raw = JSON.stringify({ name: item.name, goal: "education", setupDone: true, fixtureUnknown: { kept: true } });
    fixture.bytes.set("coachfi-user", raw); const before = new Map(fixture.bytes);
    const samples: Awaited<ReturnType<typeof sampleBranch>>[] = [];
    // Collect both independent environments before assertions. A baseline server
    // URIError must not hide the corresponding client-path observation.
    for (const branch of ["server", "client"] as const) {
      const sample = await sampleBranch(branch); samples.push(sample);
      console.log("C44_ENCODING_DATA_OBSERVATION " + JSON.stringify({ locale, label: item.label,
        inputCodeUnits: codeUnits(item.name), expectedDecodedName: item.expected, ...sample }));
    }
    for (const sample of samples) {
      expect(sample.error, "Name-to-query serialization must not make the actual parent throw").toBeNull();
      expect(sample.initialShareCount).toBe(0); expect(sample.completed).toBe(true);
      if (typeof sample.url !== "string") throw new Error("FIXTURE expected a revealed actual share URL");
      expect(sample.url.startsWith(sample.branch === "server" ? "/quiz?" : ORIGIN + "/quiz?")).toBe(true);
      const parsed = new URL(sample.url, ORIGIN);
      expect(parsed.pathname).toBe("/quiz"); expect(parsed.origin).toBe(ORIGIN);
      expect([...parsed.searchParams.keys()]).toEqual(["from", "score"]);
      expect(parsed.searchParams.get("from")).toBe(item.expected); // Independent literal USVString expectation.
      expect(parsed.searchParams.get("score")).toBe("75");
      expect(sample.profileRaw).toBe(raw); expect(sample.tokens).toBe("125");
      expect(sample.writes).toEqual([]); expect(sample.activityCalls).toBe(0); expect(sample.cloudCalls).toBe(0);
      expect(sample.persistCalls).toBe(0); expect(sample.fetchCalls).toBe(0);
    }
    expect(fixture.bytes).toEqual(before);
  });
});
