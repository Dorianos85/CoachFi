import { describe, expect, it } from "vitest";

import { CRISIS_COPY, crisisRegionForLocale, getCrisisRegionData } from "./crisisCopy";
import type { Locale } from "./i18n";

const POLISH_ONLY = ["112", "116 123", "116123", "800 70 2222", "MOPS", "ZUS", "PESEL", "OIK", "Warsaw", "Vinted", "Allegro"];

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function allText(locale: Locale) {
  return JSON.stringify(CRISIS_COPY[locale]) + JSON.stringify(getCrisisRegionData(locale));
}

describe("crisis page resources", () => {
  it("treats English and Spanish as the US region and Polish as Poland", () => {
    expect(crisisRegionForLocale("en")).toBe("US");
    expect(crisisRegionForLocale("es")).toBe("US");
    expect(crisisRegionForLocale("pl")).toBe("PL");
  });

  it.each(["en", "es"] as const)("shows US crisis lines in %s", (locale) => {
    const region = getCrisisRegionData(locale);
    const hrefs = [...region.safetyLinks, ...region.emotionalContacts].map((link) => link.href);
    expect(hrefs).toContain("tel:911");
    expect(hrefs).toContain("tel:988");
    expect(hrefs).toContain("tel:211");
    expect(hrefs).toContain("tel:+18004262537"); // 1-800-GAMBLER
    expect(hrefs.some((href) => href.startsWith("sms:741741"))).toBe(true);
    expect(region.resources.map((resource) => resource.id)).toContain("nfcc");
    expect(region.resources.find((resource) => resource.id === "nfcc")?.phone).toBe("1-800-388-2227");
  });

  it.each(["en", "es"] as const)("has no Polish numbers, institutions or PESEL templates in %s", (locale) => {
    const text = allText(locale);
    for (const polish of POLISH_ONLY) {
      expect(text).not.toContain(polish);
    }
    expect(getCrisisRegionData(locale).templateIds).not.toContain("mops");
  });

  it.each(["en", "es"] as const)("gives no token rewards for SOS steps in %s", (locale) => {
    expect(getCrisisRegionData(locale).actionRewards).toBe(false);
    expect(CRISIS_COPY[locale]?.firstDay.reward).not.toContain("{reward}");
    expect(strings(CRISIS_COPY[locale]).join("\n")).not.toMatch(/token/i);
  });

  it("matches every US contact and resource with copy", () => {
    for (const locale of ["en", "es"] as const) {
      const copy = CRISIS_COPY[locale]!;
      const region = getCrisisRegionData(locale);
      expect(copy.emotional.contacts).toHaveLength(region.emotionalContacts.length);
      expect(copy.resale.platforms).toHaveLength(region.resalePlatforms.length);
      for (const resource of region.resources) expect(copy.resources.items[resource.id]).toBeDefined();
      for (const id of region.templateIds) expect(copy.templates.titles[id]).toBeDefined();
      expect(copy.templates.loanText).toBeDefined();
      expect(copy.templates.bankText).toBeDefined();
    }
  });

  it("keeps the Polish resources for Polish users", () => {
    const region = getCrisisRegionData("pl");
    expect(region.safetyLinks.map((link) => link.href)).toEqual(["tel:112", "tel:116123", "https://116sos.pl/"]);
    expect(region.templateIds).toContain("mops");
    for (const resource of region.resources) expect(CRISIS_COPY.pl?.resources.items[resource.id]).toBeDefined();
  });
});
