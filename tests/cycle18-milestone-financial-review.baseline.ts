import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { STAGE_QUESTION_IDS } from "@/lib/learningProgress";

const id = "emergency-first-milestone";
const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C18 old-content baseline forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
function question(locale: Locale) { const q = getQuestionById(id, locale); if (!q) throw new Error("Expected actual canonical milestone: " + locale); return q; }
function english() { const q = quizQuestions.find(row => row.id === id); if (!q) throw new Error("Expected actual English milestone bank record"); return q; }
function correct(locale: Locale) { const q = question(locale); const answer = q.answers.find(row => row.id === "B"); if (!answer) throw new Error("Expected actual correct optionB"); return answer; }

describe("C18 actual old milestone observations, without evaluating research validity", () => {
  it.each(locales)("%s existing standalone canonical record is B25 and outside the three C17 stage IDs", locale => {
    const q = question(locale);
    expect(q.id).toBe(id); expect(q.correctAnswer).toBe("B"); expect(q.reward).toBe(25);
    expect(q.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
    expect(quizQuestions.filter(row => row.id === id)).toHaveLength(1);
    expect(getAllQuestions(locale).filter(row => row.id === id)).toHaveLength(1);
    expect(STAGE_QUESTION_IDS["emergency-fund"]).toEqual(["emergency-fund", "emergency-fund-characteristics", "emergency-fund-start"]);
    expect(STAGE_QUESTION_IDS["emergency-fund"]).not.toContain(id);
  });
  it.each(locales)("%s first-month answer lacks optional-smaller-amount and protected-minimum/no-surplus conditions", locale => {
    const q = question(locale);
    expect(q.question).toMatch(/FIRST|PIERWSZY/); expect(q.question).toContain("3–6");
    expect(correct(locale).text).toMatch(/One month of essential expenses|Jeden miesiąc podstawowych wydatków/);
    const reviewed = q.question + " " + correct(locale).text + " " + q.explanation;
    expect(reviewed).not.toMatch(/optional|voluntary|dobrowoln|required minimum|minimaln|irregular|nieregularn|no surplus|zero surplus|nadwyż/i);
    expect(q.question).not.toMatch(/mandatory|legally required|obowiązek prawny|ustawow/i);
  });
  it("English success and retry use unqualified effect/research wording without an inline source or population", () => {
    const q = english();
    expect(q.successMessage).toContain("sharply cuts the risk of falling behind on bills");
    expect(q.retryMessage).toContain("research shows even a small buffer dramatically reduces delinquency");
    expect(question("en").explanation).toBe(q.retryMessage);
    expect(q.retryMessage).not.toMatch(/https?:\/\/|CFPB|sample|population|associated|correlation|study date/i);
  });
  it("Polish canonical feedback claims a significant effect; this is observed wording, not a falsity diagnosis", () => {
    const q = question("pl");
    expect(q.explanation).toContain("znacząco obniża ryzyko zaległości w rachunkach");
    expect(q.explanation).toContain("zacznij mało");
    expect(q.explanation).not.toMatch(/https?:\/\/|CFPB|populac|prób[ay]|korelac|związek statystyczny/i);
  });
});
