import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const contract: Record<string, number> = { "zero-based-budget": 25, "track-before-budget": 20, "sinking-fund": 25, "impulse-pause": 20 };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  if (!canonical || !english || contract[id] === undefined) throw Error("Expected existing C32 item " + id);
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected existing correct option " + id);
  expect(canonical.correctAnswer).toBe("B"); expect(canonical.reward).toBe(contract[id]);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  const text = [canonical.question, correct.text, canonical.explanation].join("\n");
  const endorsed = locale === "en" ? [text, english.successMessage, english.retryMessage].join("\n") : text;
  return { canonical, english, correct, text, endorsed };
}
function record(id: string, locale: Locale, guards: Record<string, boolean>, numeric?: Record<string, string>) {
  observations.push({ id, locale, guards, numeric });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}
const voluntary = (text: string) => /dobrowol|opcjonal|możesz|optional|voluntar|you can|you may/i.test(text);
const essentialsAndMinimums = (text: string) => /podstawow|niezbędn|essential|basic needs/i.test(text) && /minimaln|minimum/i.test(text) && /spłat|repay|payment/i.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C32 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C32_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C32 independent feasible budgeting and optional-pause qualifications", () => {
  it.each(locales)("%s zero-based allocations preserve reserves instead of requiring a zero bank balance", locale => {
    const source = material("zero-based-budget", locale), text = source.endorsed;
    record("zero-based-budget", locale, {
      plannedAllocationIncludesReserve: /plan|alok|allocat/i.test(source.correct.text) && /rezerw|reserv|saving|oszczędn/i.test(source.correct.text),
      notAnAccountEmptyingInstruction: /kont|account/i.test(text) && /nie nakaz|nie wymaga|not a requirement|does not require/i.test(text),
      obligationsBeforeVoluntaryReserve: essentialsAndMinimums(text) && voluntary(text),
      variableIncomeAndNoSurplus: /zmienn|nieregular|income varies|variable income|irregular/i.test(text) && /bez nadwyż|brak nadwyż|no surplus|without a surplus/i.test(text),
      noGuaranteedLeakPrevention: !/nothing leaks unplanned|nic nie wycieka bez planu/i.test(text),
    });
  });

  it.each(locales)("%s spending review can use a manageable period without mandatory data collection or delayed essentials", locale => {
    const source = material("track-before-budget", locale), text = source.endorsed;
    record("track-before-budget", locale, {
      voluntaryMethodChoice: voluntary(text) && /metod|method/i.test(text) && /wybran|wybierz|dogodn|wygodn|choose|chosen|suitable|manageable/i.test(text),
      noMandatoryThirtyDays: !/30/.test(text) || /30[^.!?\n]{0,55}nie jest obowiązk|30[^.!?\n]{0,55}not a mandatory/i.test(text),
      urgentNeedsNotDelayed: essentialsAndMinimums(text) && /piln|urgent/i.test(text) && /nie odkładaj|nie odraczaj|do not postpone|do not delay|without delaying/i.test(text),
      noAppDataRequirement: /nie[^.!?\n]{0,55}przekazywać danych|do not need to share data|no data upload/i.test(text),
      noUnsupportedManagementOrLeakageClaim: !/you can.t manage what you don.t measure|nie zarządzisz tym, czego nie mierzysz|most people find hidden leakage/i.test(text),
    });
  });

  it.each(locales)("%s planned sinking funds differ from emergencies and remain conditional on safe surplus", locale => {
    const source = material("sinking-fund", locale), text = source.endorsed;
    record("sinking-fund", locale, {
      knownPlannedGoal: /znan|planowan|known|planned/i.test(text) && /cel|goal|cost|koszt/i.test(text),
      emergencyDistinction: /awaryjn|emergency/i.test(text) && /nieoczek|nieprzewidz|unexpected|unplanned/i.test(text),
      optionalAfterRequiredCosts: voluntary(text) && essentialsAndMinimums(text),
      noSurplusAdaptsPurchase: /bez nadwyż|brak nadwyż|no surplus|without a surplus/i.test(text) && /zmień|odłóż|change|postpone/i.test(text),
      noDebtAvoidancePromise: !/no debt needed/i.test(text),
    });
  });

  it.each(locales)("%s a pause is optional for non-urgent wants and promises no universal waiting-time effect", locale => {
    const source = material("impulse-pause", locale), text = source.endorsed;
    record("impulse-pause", locale, {
      voluntaryNonUrgentChoice: voluntary(text) && /niepiln|non.urgent/i.test(text) && /niekoniecz|non.essential/i.test(text),
      noMandatoryWaitOrGuaranteedSaving: /nie obowiązkowe|not a mandatory/i.test(text) && /nie[^.!?\n]{0,160}gwaranc|no guarantee|not[^.!?\n]{0,160}guarantee|does not guarantee|guarantees no/i.test(text),
      protectsUrgentNeedsAndMinimums: essentialsAndMinimums(text) && /piln|urgent/i.test(text) && /nie odkładaj|nie odraczaj|do not postpone|do not delay|without delaying/i.test(text),
      calmReturnWithoutPressure: /wró|powr|return|after a break/i.test(text) && /bez presji|without pressure/i.test(text),
      noMostPurchasesEffectClaim: !/most impulse buys don.t survive|pause defeats most|większość zakupów impulsowych nie przeżywa/i.test(text),
    });
  });

  it.each(locales)("%s independent allocation model has zero unassigned money while retaining one hundred PLN", locale => {
    const source = material("zero-based-budget", locale), text = source.endorsed;
    const incomeGrosze = BigInt("100000"), essentialGrosze = BigInt("80000"), minimumGrosze = BigInt("10000"), reserveGrosze = BigInt("10000");
    const unassignedGrosze = incomeGrosze - essentialGrosze - minimumGrosze - reserveGrosze;
    const cashAfterOnlyNeedsAndMinimumsGrosze = incomeGrosze - essentialGrosze - minimumGrosze;
    expect(unassignedGrosze).toBe(BigInt("0")); expect(cashAfterOnlyNeedsAndMinimumsGrosze).toBe(BigInt("10000"));
    expect(cashAfterOnlyNeedsAndMinimumsGrosze).toBe(reserveGrosze);
    record("zero-based-budget-numeric", locale, {
      actualHypotheticalInputs: /1[\s,.\u00a0\u202f]?000/.test(text) && /800/.test(text) && /100/.test(text) && /hipotet|hypothet/i.test(text),
      requiredRepaymentsCountedOnce: essentialsAndMinimums(text) && /raz|once/i.test(text),
      zeroDescribesUnassignedPlan: /nieprzypisan|unallocat/i.test(text) && /(?:[:=]\s*(?:PLN\s*)?0)/i.test(text),
      reserveRetainedNotRequiredSpending: /rezerw|reserv|saving|oszczędn/i.test(source.correct.text) && /nie nakaz|nie wymaga|not a requirement|does not require/i.test(text),
    }, { incomeGrosze: incomeGrosze.toString(), essentialGrosze: essentialGrosze.toString(), minimumGrosze: minimumGrosze.toString(), reserveGrosze: reserveGrosze.toString(), unassignedGrosze: unassignedGrosze.toString(), cashAfterOnlyNeedsAndMinimumsGrosze: cashAfterOnlyNeedsAndMinimumsGrosze.toString() });
  });

  it.each(locales)("%s independent planned-goal model divides six hundred PLN into six affordable equal contributions", locale => {
    const source = material("sinking-fund", locale), text = source.endorsed;
    const goalGrosze = BigInt("60000"), periods = BigInt("6"), contributionGrosze = goalGrosze / periods;
    expect(contributionGrosze).toBe(BigInt("10000")); expect(contributionGrosze * periods).toBe(goalGrosze);
    expect(BigInt("60000") * periods).toBe(BigInt("360000"));
    record("sinking-fund-numeric", locale, {
      actualGoalAndZeroStart: /600/.test(source.canonical.question) && /(?:^|[^\d])0(?:[^\d]|$)/.test(source.canonical.question),
      sixEqualContributionsBeforePurchase: /(?:^|[^\d])6(?:[^\d]|$)/.test(source.canonical.question) && /równ|equal/i.test(text) && /przed zakupem|before purchase/i.test(text),
      noInterestOrFeesAssumed: /pomijając|ignoring|bez|without|no /i.test(text) && /odset|interest/i.test(text) && /opłat|fee/i.test(text),
      independentHundredPerMonth: /100/.test(source.correct.text) && /miesiąc|month/i.test(source.correct.text) && /PLN|zł/i.test(text) && !/\bUSD\b|\$/.test(text),
    }, { goalGrosze: goalGrosze.toString(), periods: periods.toString(), contributionGrosze: contributionGrosze.toString(), totalGrosze: (contributionGrosze * periods).toString(), wrongSixHundredEachGrosze: (BigInt("60000") * periods).toString() });
  });
});
