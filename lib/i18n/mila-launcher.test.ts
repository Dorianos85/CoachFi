import { describe, expect, it } from "vitest";

import { localeAgentLanguage, translations, type Locale } from "./index";

const captions: Record<Locale, string> = {
  en: "Start conversation",
  pl: "Rozpocznij rozmowę",
  es: "Iniciar conversación",
  fr: "Commencer la conversation",
  zh: "开始对话",
  ja: "会話を始める",
  hi: "बातचीत शुरू करें",
  "pt-BR": "Iniciar conversa",
  tr: "Konuşmayı başlat",
};

describe("Mila conversation launcher localization", () => {
  for (const [locale, caption] of Object.entries(captions)) {
    it(`uses the localized conversation caption and distinguishes text chat in ${locale}`, () => {
      const copy = translations[locale as Locale].voiceAgent;
      expect(copy.fab).toBe(caption);
      expect(copy.openAriaLabel).toContain(locale === "pl" ? "Milą" : "Mila");
      expect(copy.startChat.trim()).not.toBe("");
      expect(copy.startChat).not.toBe(copy.fab);
      expect(copy.fab.toLowerCase()).not.toBe("start a call");
    });
  }

  it("sends the agent widget lowercase language codes for every locale", () => {
    expect(Object.keys(localeAgentLanguage).sort()).toEqual(Object.keys(translations).sort());
    for (const code of Object.values(localeAgentLanguage)) {
      expect(code).toMatch(/^[a-z]{2}(-[a-z]{2})?$/);
    }
    expect(localeAgentLanguage["pt-BR"]).toBe("pt-br");
  });
});
