import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type StreakValue = ReturnType<typeof import("@/context/StreakContext")["useStreak"]>;
type Locale = "pl" | "en";
const fixture = vi.hoisted(() => ({
  locale: "pl" as Locale,
  streakStatus: "available" as StreakValue["streakStatus"],
  count: 0,
  markActive: vi.fn(),
}));

// Only the two context inputs are mocked. ReactDOMServer, framer-motion,
// StreakBadge, locale selection and milestone helpers are the actual modules.
// This fixture does not exercise StreakProvider, storage or notifications.
vi.mock("@/context/StreakContext", () => ({
  useStreak: (): StreakValue => ({
    streak: { lastActiveDate: "2026-01-01", currentStreak: fixture.count, longestStreak: fixture.count },
    streakStatus: fixture.streakStatus,
    markActive: fixture.markActive,
  }),
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));

const CASES = [
  { mode: "available66", status: "available", count: 66 },
  { mode: "available3", status: "available", count: 3 },
  { mode: "available0", status: "available", count: 0 },
  { mode: "available67", status: "available", count: 67 },
  { mode: "loading66", status: "loading", count: 66 },
  { mode: "unavailable66", status: "unavailable", count: 66 },
] as const;
const COPY = {
  pl: {
    milestone66: "Kamień milowy: 66 dni! Doceniaj swoją regularność. 🏆",
    title3: "Kamień milowy: 3 dni! 🏆",
    title0: "0-dniowa seria • Następny cel: 3 dni",
    title67: "67-dniowa seria 🔥 W formie! • Następny cel: 100 dni",
    loading: "Sprawdzanie serii nauki…", unavailable: "Seria nauki jest niedostępna",
    label: (count: number) => `${count} dni serii`, day: "dni",
  },
  en: {
    milestone66: "Milestone: 66 days! Celebrate your consistency. 🏆",
    title3: "Milestone: 3 days! 🏆",
    title0: "0-day streak • Next milestone: 3 days",
    title67: "67-day streak 🔥 On fire! • Next milestone: 100 days",
    loading: "Checking learning streak…", unavailable: "Learning streak unavailable",
    label: (count: number) => `${count} day streak`, day: "days",
  },
};

function attributeValues(html: string, attribute: "title" | "aria-label") {
  return [...html.matchAll(new RegExp(`\\b${attribute}="([^"]*)"`, "g"))].map(match => match[1]);
}
beforeEach(() => { vi.clearAllMocks(); fixture.locale = "pl"; fixture.streakStatus = "available"; fixture.count = 0; });
afterEach(() => { expect(fixture.markActive).not.toHaveBeenCalled(); });

describe.each(["pl", "en"] as const)("C46 actual StreakBadge SSR milestone copy %s", locale => {
  it.each(CASES)("$mode preserves the count or explicit read status in both views", async item => {
    fixture.locale = locale; fixture.streakStatus = item.status; fixture.count = item.count;
    const { StreakBadge } = await import("@/components/StreakBadge");
    const copy = COPY[locale];
    const expectedLabel = item.status === "available" ? copy.label(item.count) : copy[item.status];
    const expectedTitle = item.status !== "available" ? copy[item.status]
      : item.count === 66 ? copy.milestone66
        : item.count === 3 ? copy.title3 : item.count === 0 ? copy.title0 : copy.title67;
    const samples = [false, true].map(compact => {
      const html = renderToStaticMarkup(createElement(StreakBadge, { compact }));
      return { compact, html, titles: attributeValues(html, "title"), labels: attributeValues(html, "aria-label") };
    });
    console.log("C46_UI_SSR_OBSERVATION " + JSON.stringify({ locale, mode: item.mode, count: item.count,
      status: item.status, expectedLabel, expectedTitle, samples,
      limits: "Two compact/full samples within one case. Actual ReactDOMServer and real framer-motion; typed useStreak and locale inputs mocked. No actual Provider, storage, hydration, delivered notification, native tooltip visual or production claim." }));
    for (const sample of samples) {
      expect(sample.labels).toEqual([expectedLabel]);
      if (item.status === "available") {
        expect(sample.html).toMatch(new RegExp(`>${item.count}(?:<span|</span>)`));
        expect(sample.html).not.toContain('role="status"');
        if (!sample.compact) expect(sample.html).toContain(`>${copy.day}</span>`);
      } else {
        expect(sample.html).toContain('role="status"');
        expect(sample.html).not.toMatch(/aria-label="\d+ (?:dni serii|day streak)"/);
        expect(sample.html).toContain(sample.compact ? ">—</span>" : `>${expectedLabel}</span>`);
        expect(sample.html).not.toMatch(/🏆|🔥|⚡/);
      }
      // The old product should fail only the two 66-day cases. Soft assertions
      // retain both compact/full title differences after the hard status/count checks.
      if (item.status === "available" && item.count === 66) expect.soft(sample.titles).toEqual([expectedTitle]);
      else expect(sample.titles).toEqual([expectedTitle]);
    }
  });
});
