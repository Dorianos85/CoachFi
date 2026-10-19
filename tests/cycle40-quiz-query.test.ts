import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en",
  params: new URLSearchParams(),
  storage: null as unknown as PersonalStorageHandle,
  bytes: new Map<string, string>(),
  reads: [] as string[],
  writes: [] as string[],
  markActive: vi.fn(),
  notifyCloud: vi.fn(),
  persistLearningState: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useSearchParams: () => fixture.params }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.markActive }) }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notifyCloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: fixture.persistLearningState }));

// Adjacent widgets are outside this query-display review. Neither actual page
// component nor its private ChallengeBanner nor React/URLSearchParams is mocked.
vi.mock("@/components/Leaderboard", () => ({ Leaderboard: () => null }));
vi.mock("@/components/QuizCard", () => ({ QuizCard: () => null }));
vi.mock("@/components/SectionHeader", () => ({ SectionHeader: () => null }));
vi.mock("@/components/SocialShare", () => ({ SocialShare: () => null }));
vi.mock("@/components/TokenRewardCard", () => ({ TokenRewardCard: () => null }));

const cases = [
  { label: "encoded percent", query: "from=%25&score=42", name: "%", score: "42" },
  { label: "encoded ampersand and slash", query: "from=A%26B%2FC&score=42", name: "A&B/C", score: "42" },
  { label: "Unicode and emoji", query: "from=%C5%81ucja+%F0%9F%8C%B1&score=42", name: "Łucja 🌱", score: "42" },
  { label: "form plus versus encoded plus", query: "from=Jan+%2B+Ada&score=42", name: "Jan + Ada", score: "42" },
  { label: "literal encoded slash after one decode", query: "from=%252F&score=42", name: "%2F", score: "42" },
  { label: "malformed UTF-8 and percent escape", query: "from=%E0%A4%A&score=42", name: "\uFFFD%A", score: "42" },
  { label: "zero score string remains visible", query: "from=Ada&score=0", name: "Ada", score: "0" },
] as const;

function escapedText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function scoredLine(locale: "pl" | "en", name: string, score: string): string {
  return locale === "pl"
    ? `${name} zdobył(a) ${score} pkt - pobijesz ten wynik?`
    : `${name} scored ${score} pts - can you beat them?`;
}

async function renderActualQuery(query: string) {
  fixture.params = new URLSearchParams(query);
  const get = vi.spyOn(fixture.params, "get");
  const { default: QuizPage } = await import("@/app/quiz/page");
  const wrapper = QuizPage() as ReactElement<{ children?: unknown }>;
  const child = wrapper.props.children;
  if (!isValidElement(child) || typeof child.type !== "function") {
    throw new Error("FIXTURE expected the real QuizPageContent child of QuizPage");
  }
  let html = "", error: { name: string; message: string } | null = null;
  try {
    // Rendering the actual child outside its outer Suspense prevents a thrown
    // URIError from being disguised as a successful fallback-only render.
    html = renderToStaticMarkup(child);
  } catch (caught) {
    error = caught instanceof Error ? { name: caught.name, message: caught.message }
      : { name: "non-Error", message: String(caught) };
  }
  const queryReads = get.mock.calls.map(([key]) => key);
  get.mockRestore();
  return { query, parsedFrom: fixture.params.get("from"), parsedScore: fixture.params.get("score"), queryReads, html, error,
    storageReads: [...fixture.reads], writes: [...fixture.writes], tokenRaw: fixture.bytes.get("coachfi-tokens"),
    activityCalls: fixture.markActive.mock.calls.length, cloudCalls: fixture.notifyCloud.mock.calls.length,
    persistCalls: fixture.persistLearningState.mock.calls.length, fetchCalls: vi.mocked(fetch).mock.calls.length };
}

beforeEach(() => {
  vi.clearAllMocks();
  fixture.locale = "pl";
  fixture.params = new URLSearchParams();
  fixture.bytes.clear();
  fixture.bytes.set("coachfi-tokens", "125");
  fixture.reads.length = 0;
  fixture.writes.length = 0;
  fixture.storage = Object.freeze({
    owner: Object.freeze({ kind: "guest" as const }), revision: 1, area: "local" as const,
    isCurrent: () => true,
    getItem: (key: string) => { fixture.reads.push(key); return fixture.bytes.get(key) ?? null; },
    setItem: (key: string) => { fixture.writes.push("set:" + key); throw new Error("FIXTURE query render must not write"); },
    removeItem: (key: string) => { fixture.writes.push("remove:" + key); throw new Error("FIXTURE query render must not remove"); },
    release: () => { throw new Error("FIXTURE query render must not release storage"); },
  });
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("FIXTURE no network in C40 query rendering"); }));
});

afterEach(() => {
  expect(fixture.reads).toEqual(expect.arrayContaining(["coachfi-tokens", "coachfi-user"]));
  expect(fixture.writes).toEqual([]);
  expect(fixture.bytes).toEqual(new Map([["coachfi-tokens", "125"]]));
  expect(fixture.markActive).not.toHaveBeenCalled();
  expect(fixture.notifyCloud).not.toHaveBeenCalled();
  expect(fixture.persistLearningState).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe.each(["pl", "en"] as const)("C40 actual QuizPage query display %s", locale => {
  it.each(cases)("$label preserves URLSearchParams text without a second decode", async sample => {
    fixture.locale = locale;
    const observation = await renderActualQuery(sample.query);
    console.log("C40_QUERY_DATA_OBSERVATION " + JSON.stringify({ locale, label: sample.label, ...observation }));
    expect(observation.queryReads).toEqual(["from", "score", "challenge", "topic"]);
    expect(observation.parsedFrom).toBe(sample.name);
    expect(observation.parsedScore).toBe(sample.score);
    expect(observation.error, "Already-parsed query text must not make the actual banner render fail").toBeNull();
    expect(observation.html).toContain(escapedText(scoredLine(locale, sample.name, sample.score)));
    expect(observation.html).toContain(locale === "pl" ? "Wyzwanie przyjęte!" : "Challenge accepted!");
  });

  it.each(["from", "score"] as const)("missing or empty %s preserves the existing hidden-banner branch", async absent => {
    fixture.locale = locale;
    const queries = absent === "from" ? ["score=42", "from=&score=42"] : ["from=Ada", "from=Ada&score="];
    for (const query of queries) {
      const observation = await renderActualQuery(query);
      console.log("C40_QUERY_DATA_OBSERVATION " + JSON.stringify({ locale, absent, ...observation }));
      expect(observation.queryReads).toEqual(["from", "score", "challenge", "topic"]);
      expect(observation.error).toBeNull();
      expect(observation.html).not.toContain("Wyzwanie przyjęte!");
      expect(observation.html).not.toContain("Challenge accepted!");
      expect(observation.html).not.toContain("zdobył(a)");
      expect(observation.html).not.toContain("scored");
    }
  });
});
