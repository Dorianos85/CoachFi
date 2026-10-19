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

// Adjacent widgets are outside this profile-render SSR review. The actual page,
// getUser/getDisplayName and React/URLSearchParams are not mocked.
vi.mock("@/components/Leaderboard", () => ({ Leaderboard: () => null }));
vi.mock("@/components/QuizCard", () => ({ QuizCard: () => null }));
vi.mock("@/components/SectionHeader", () => ({ SectionHeader: () => null }));
vi.mock("@/components/SocialShare", () => ({ SocialShare: () => null }));
vi.mock("@/components/TokenRewardCard", () => ({ TokenRewardCard: () => null }));

const CASES = [
  { mode: "null-name", name: null },
  { mode: "object-trim-spoof", name: { trim: "spoof" } },
  { mode: "healthy-unicode-name", name: " Łucja 🌱 " },
] as const;
function profileRaw(name: unknown) { return JSON.stringify({ name, goal: "education", setupDone: true, fixtureC43: { retained: true } }); }
async function renderActualPage() {
  const { default: QuizPage } = await import("@/app/quiz/page");
  const wrapper = QuizPage() as ReactElement<{ children?: unknown }>, child = wrapper.props.children;
  if (!isValidElement(child) || typeof child.type !== "function") throw Error("FIXTURE expected actual QuizPageContent child");
  let html = "", error: { name: string; message: string } | null = null;
  try { html = renderToStaticMarkup(child); }
  catch (caught) { error = caught instanceof Error ? { name: caught.name, message: caught.message } : { name: "non-Error", message: String(caught) }; }
  return { html, error, storageReads: [...fixture.reads], writes: [...fixture.writes],
    profileRaw: fixture.bytes.get("coachfi-user"), tokens: fixture.bytes.get("coachfi-tokens"),
    activityCalls: fixture.markActive.mock.calls.length, cloudCalls: fixture.notifyCloud.mock.calls.length,
    persistCalls: fixture.persistLearningState.mock.calls.length, fetchCalls: vi.mocked(fetch).mock.calls.length };
}
beforeEach(() => {
  vi.clearAllMocks(); fixture.locale = "pl"; fixture.params = new URLSearchParams();
  fixture.bytes.clear(); fixture.bytes.set("coachfi-tokens", "125"); fixture.reads.length = 0; fixture.writes.length = 0;
  fixture.storage = Object.freeze({ owner: Object.freeze({ kind: "guest" as const }), revision: 1, area: "local" as const,
    isCurrent: () => true, getItem: (key: string) => { fixture.reads.push(key); return fixture.bytes.get(key) ?? null; },
    setItem: (key: string) => { fixture.writes.push("set:" + key); throw Error("FIXTURE SSR render must not write"); },
    removeItem: (key: string) => { fixture.writes.push("remove:" + key); throw Error("FIXTURE SSR render must not remove"); },
    release: () => { throw Error("FIXTURE SSR render must not release storage"); },
  });
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no network in C43 profile rendering"); }));
});
afterEach(() => {
  expect(fixture.reads).toEqual(expect.arrayContaining(["coachfi-user", "coachfi-tokens"]));
  expect(fixture.writes).toEqual([]); expect(fixture.markActive).not.toHaveBeenCalled();
  expect(fixture.notifyCloud).not.toHaveBeenCalled(); expect(fixture.persistLearningState).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals();
});
describe.each(["pl", "en"] as const)("C43 actual QuizPageContent with real profile display helper %s", locale => {
  it.each(CASES)("$mode renders the active parent without changing profile or points", async item => {
    fixture.locale = locale; const expectedProfileRaw = profileRaw(item.name);
    fixture.bytes.set("coachfi-user", expectedProfileRaw); const before = new Map(fixture.bytes);
    const observation = await renderActualPage();
    console.log("C43_UI_SSR_OBSERVATION " + JSON.stringify({ mode: item.mode, locale, expectedProfileRaw, ...observation,
      limits: "Actual parent/getUser/getDisplayName, neighbour widgets mocked. No name is visibly rendered before quiz completion; direct trim contract is reviewed separately." }));
    expect(observation.error, "Profile name must not crash the actual active quiz parent render").toBeNull();
    expect(observation.html).toContain('<section aria-labelledby="quiz-title">');
    expect(observation.profileRaw).toBe(expectedProfileRaw); expect(observation.tokens).toBe("125");
    expect(fixture.bytes).toEqual(before); expect(observation.writes).toEqual([]);
  });
});
