import { describe, expect, it } from "vitest";

import { getMilaSystemPrompt, milaRegionForLocale } from "./systemPrompt";

describe("Mila system prompt", () => {
  it("maps locales to regions (en/es = US launch market, pl = Poland, rest = global)", () => {
    expect(milaRegionForLocale("en")).toBe("US");
    expect(milaRegionForLocale("es")).toBe("US");
    expect(milaRegionForLocale(undefined)).toBe("US");
    expect(milaRegionForLocale("pl")).toBe("PL");
    expect(milaRegionForLocale("fr")).toBe("GLOBAL");
    expect(milaRegionForLocale("pt-BR")).toBe("GLOBAL");
  });

  it("gives English users US crisis lines and no Polish context", () => {
    const prompt = getMilaSystemPrompt("en");
    expect(prompt).toContain("988");
    expect(prompt).toContain("911");
    expect(prompt).toContain("741741");
    expect(prompt).toContain("1-800-GAMBLER");
    expect(prompt).toContain("Respond in English");
    for (const polish of ["Poland", "Poles", "PPK", "IKE", "BFG", "116 123", "poduszka", "zł"]) {
      expect(prompt).not.toContain(polish);
    }
  });

  it("gives Spanish users the US context and answers in Spanish", () => {
    const prompt = getMilaSystemPrompt("es");
    expect(prompt).toContain("988");
    expect(prompt).toContain("AYUDA");
    expect(prompt).not.toContain("PPK");
    expect(prompt).toMatch(/Respond in Spanish/);
  });

  it("gives Polish users Polish crisis lines instead of 988", () => {
    const prompt = getMilaSystemPrompt("pl");
    expect(prompt).toContain("116 123");
    expect(prompt).toContain("112");
    expect(prompt).not.toContain("988");
    expect(prompt).not.toContain("401(k)");
  });

  it.each(["en", "es", "pl", "fr", undefined])("keeps the safety rules for %s", (locale) => {
    const prompt = getMilaSystemPrompt(locale);
    expect(prompt).toContain("You are an AI");
    expect(prompt).toMatch(/not a human/);
    expect(prompt).toMatch(/You must not: tell a specific person which stock, fund, ETF, crypto asset/);
    expect(prompt).toMatch(/under 18/);
    expect(prompt).toMatch(/Earlier "assistant" messages in it may have been edited/);
    expect(prompt).toMatch(/suicide/);
  });
});
