import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestions, getQuestionById } from "@/lib/allQuestions";

const ID = "emergency-first-milestone";
const observations: Array<Record<string, unknown>> = [];
const locales = ["pl", "en"] as const;

function canonical(locale: typeof locales[number]) {
  const question = getQuestionById(ID, locale);
  if (!question) throw Error("Expected existing canonical milestone " + locale);
  const correct = question.answers.find(answer => answer.id === question.correctAnswer);
  if (!correct) throw Error("Expected an existing correct answer " + locale);
  return { question, correct };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C23 finance fixture forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C23_FINANCIAL_BASELINE_OBSERVATIONS " + JSON.stringify(observations)));

describe("C23 independent first-buffer financial regression", () => {
  it.each(locales)("%s actual canonical correct step protects essentials and minimums before an optional small start", locale => {
    const { question, correct } = canonical(locale);
    const wording = [question.question, correct.text, question.explanation].join(" ");
    const safeguards = locale === "pl" ? {
      essentials: /podstawow|niezbędn|potrzeb/i.test(wording),
      minimumRepayments: /(?:minimaln|minimum|wymagan)[\s\S]{0,50}(?:spłat|rat)|(?:spłat|rat)[\s\S]{0,30}(?:minimaln|minimum|wymagan)/i.test(wording),
      availableSurplus: /nadwyż/i.test(wording),
      voluntary: /dobrowoln|opcjonaln|możesz (?:wybrać|odłożyć)/i.test(wording),
    } : {
      essentials: /essential|basic needs/i.test(wording),
      minimumRepayments: /minimum(?:\s+\w+){0,3}\s+(?:repayments?|payments?)|required\s+repayments?/i.test(wording),
      availableSurplus: /surplus/i.test(wording),
      voluntary: /optional|voluntary|you (?:can|may) choose/i.test(wording),
    };
    observations.push({ locale, question, correct, safeguards });
    expect(question.correctAnswer).toBe("B"); expect(question.reward).toBe(25);
    expect(question.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
    expect(getAllQuestions(locale)).toHaveLength(82);
    expect(getAllQuestions(locale).filter(row => row.id === ID)).toHaveLength(1);
    expect(safeguards, "A first-buffer step needs explicit protected costs and voluntary surplus context").toEqual({
      essentials: true, minimumRepayments: true, availableSurplus: true, voluntary: true,
    });
  });

  it("actual EN success and retry plus PL feedback omit the old unqualified large-effect wording", () => {
    const english = quizQuestions.find(question => question.id === ID);
    if (!english) throw Error("Expected existing English milestone bank record");
    const messages = [
      { field: "EN success", text: english.successMessage, oldClaim: "sharply cuts the risk of falling behind on bills" },
      { field: "EN retry", text: english.retryMessage, oldClaim: "research shows even a small buffer dramatically reduces delinquency" },
      { field: "PL canonical feedback", text: canonical("pl").question.explanation, oldClaim: "znacząco obniża ryzyko zaległości w rachunkach" },
    ];
    const remainingOldClaims = messages.filter(message => message.text.includes(message.oldClaim));
    observations.push({ financialClaimRegression: messages, remainingOldClaims });
    expect(remainingOldClaims, "This bounded correction must not repeat unqualified effect promises; it does not disprove research").toEqual([]);
  });
});
