import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stageLessons as currentStageLessons, type StageLessonStep } from "@/data/stageLessons";
import { quizQuestions as currentQuizQuestions, type QuizQuestion } from "@/data/quizQuestions";
import { challengeQuestions } from "@/data/challengeQuestions";
import { getAllQuestions as currentGetAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions as currentGetQuizQuestions } from "@/lib/localizedQuiz";
import type { Locale } from "@/lib/i18n";
import {
  c16AllowedSourceBlocks, restorePreC16Source, restorePreC16EnglishRecords,
  restorePreC16PlainRecords, restorePreC17PlainRecords, restorePreC17StageLessons,
} from "./cycle37-legacy-preservation";
import { restorePreC17Source, restorePreC17EnglishRecords, restorePreC17UnifiedRecords } from "./cycle69-legacy-preservation";

// C16 still checks live credit targets; restore only later emergency records for its historical non-target oracles.
const stageLessons = restorePreC17StageLessons(currentStageLessons);
const quizQuestions = restorePreC17EnglishRecords(currentQuizQuestions);
const getAllQuestions = (locale?: Locale) => restorePreC17UnifiedRecords(currentGetAllQuestions(locale), locale ?? "en");
const getQuizQuestions = (locale: Locale) => restorePreC17PlainRecords(currentGetQuizQuestions(locale), locale);
const IDs = ["interest-rates", "debt-avalanche", "credit-score-factors", "bond-prices"];
const locales: Locale[] = ["en", "pl", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
const languages = ["pl", "en"] as const;
const hash = (source: string) => createHash("sha256").update(source).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing C16 author input: ${label}`);
  return value;
}
interface SourceMask { path: string; originalSha256: string; maskedSha256: string; allowedRegions: number }
interface Baseline {
  non_target: unknown; source_masks: SourceMask[]; targetQuestions: QuizQuestion[];
  counts: { stages: number; englishQuiz: number; challenge: number; canonical: number; canonicalUnique: number; plainByLocale: Record<Locale, number> };
  unchangedHistorical: Array<{ path: string; sha256: string }>;
}
interface MetadataQuestion {
  id: string; correct_answer: string; reward: number; country: string; author: string; reviewer: string;
  version: string; created_date: string; source_ids: string[]; objective: Record<"pl" | "en", string>;
  calculation_assumptions: Record<string, unknown>;
  wrong_option_explanations: Record<string, Record<"pl" | "en", string>>;
  copy: Record<"pl" | "en", QuizQuestion>;
}
interface Metadata {
  module: string; version: string; status: string; author: string; market_country: string; implementation_authorized: boolean;
  distinct_existing_questions: number; new_question_ids: number; language_versions: number; reward_total: number;
  reviewers: Record<string, { name: string; status: string }>;
  steps: Array<{ question_id: string; country: string; version: string; created_date: string; source_ids: string[];
    copy: Record<"pl" | "en", StageLessonStep>; practice: Record<"pl" | "en", string>;
    optional_action: Record<"pl" | "en", string>; calm_return: Record<"pl" | "en", string>;
    irregular_income: Record<"pl" | "en", string>; calculation_assumptions: Record<string, unknown> }>;
  questions: MetadataQuestion[];
  sources: Array<{ id: string; url: string; checked_date: string; access: string; limits: string }>;
  voice_checks: { maximum: number; cases: Array<{ id: string; locale: "pl" | "en"; text: string; utf16_length: number; limit: number; untruncated: boolean }> };
}
const baseline = JSON.parse(readFileSync(new URL("../evidence/cycle-16/content-author-non-target-baseline.json", import.meta.url), "utf8")) as Baseline;
const metadata = JSON.parse(readFileSync(new URL("../docs/coachfi/cycle-16/content-metadata.json", import.meta.url), "utf8")) as Metadata;
const question = (id: string) => required(metadata.questions.find(q => q.id === id), `metadata ${id}`);
const lesson = (locale: "pl" | "en") => required(required(stageLessons["credit-rates"], "credit lesson").copy[locale], `credit ${locale}`);
const canonical = (id: string, locale: "pl" | "en") => required(getQuestionById(id, locale), `${locale} ${id}`);
const readSource = (file: string) => restorePreC17Source(file, readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
const runtimeJSON = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, item: unknown) =>
  typeof item === "function" ? { functionResults: [item(1, 4), item(4, 4), item(0, 0)] } : item));
function nonTargets() {
  return runtimeJSON({
    stageLessons: Object.fromEntries(Object.entries(stageLessons).map(([id, item]) => [id, {
      ...item, copy: Object.fromEntries(Object.entries(item.copy).map(([locale, copy]) => [locale,
        id === "credit-rates" && (locale === "en" || locale === "pl") ? { ...copy, steps: "C16_TARGET_STEPS" } : copy])),
    }])),
    quizQuestions: quizQuestions.filter(q => !IDs.includes(q.id)),
    unifiedQuestions: Object.fromEntries(locales.map(locale => [locale, getAllQuestions(locale).filter(q => !IDs.includes(q.id))])),
    localizedQuiz: Object.fromEntries(locales.map(locale => [locale, getQuizQuestions(locale).filter(q =>
      !((locale === "en" || locale === "pl") && q.id === "interest-rates"))])),
  });
}
function masked(file: string) {
  let source = readSource(file);
  const blocks = c16AllowedSourceBlocks(file, source);
  for (let index = blocks.length - 1; index >= 0; index--) {
    const block = required(blocks[index], `block ${index}`);
    source = source.slice(0, block.start) + `__C16_ALLOWED_${index}__` + source.slice(block.end);
  }
  return { count: blocks.length, hash: hash(source) };
}

describe("C16 credit content author checks; independent acceptance is separate", () => {
  it("preserves complete runtime non-targets across all stages and nine locale banks", () => {
    expect(nonTargets()).toEqual(baseline.non_target);
  });
  it.each(baseline.source_masks)("preserves every byte outside exactly authorized credit spans in $path", old => {
    expect(masked(old.path)).toEqual({ count: old.allowedRegions, hash: old.maskedSha256 });
  });
  it.each(baseline.source_masks)("restores exact pre-C16 source bytes for $path", old => {
    expect(hash(restorePreC16Source(old.path, readSource(old.path)))).toBe(old.originalSha256);
  });
  it.each(baseline.unchangedHistorical)("retains immutable historical helper or golden artifact $path", old => {
    expect(hash(readSource(old.path))).toBe(old.sha256);
  });
  it("retains four IDs, C/C/B/B, rewards25/30/25/30, 82unique canonical IDs and all pool counts", () => {
    expect(quizQuestions.filter(q => IDs.includes(q.id)).map(q => [q.id, q.correctAnswer, q.reward])).toEqual([
      ["interest-rates", "C", 25], ["debt-avalanche", "C", 30], ["credit-score-factors", "B", 25], ["bond-prices", "B", 30],
    ]);
    expect(quizQuestions.length).toBe(62); expect(challengeQuestions.length).toBe(20);
    expect(getAllQuestions().length).toBe(82); expect(new Set(getAllQuestions().map(q => q.id)).size).toBe(82);
    expect(Object.keys(stageLessons).length).toBe(baseline.counts.stages);
    for (const locale of locales) expect(getQuizQuestions(locale).length).toBe(baseline.counts.plainByLocale[locale]);
    expect(metadata.reward_total).toBe(110); expect(metadata.new_question_ids).toBe(0);
  });
  it.each(languages.flatMap(locale => IDs.map(id => ({ locale, id }))))("actual canonical $locale $id matches reviewed draft copy and keeps one answer", ({ locale, id }) => {
    const item = question(id), expected = item.copy[locale], actual = canonical(id, locale);
    expect(actual.question).toBe(expected.question); expect(actual.answers).toEqual(expected.answers);
    expect(actual.explanation).toBe(expected.retryMessage); expect(actual.category).toBe(expected.category);
    expect(actual.correctAnswer).toBe(item.correct_answer); expect(actual.reward).toBe(item.reward);
    expect(actual.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]);
    expect(actual.answers.filter(a => a.id === actual.correctAnswer)).toHaveLength(1);
    expect(new Set(actual.answers.map(a => a.text)).size).toBe(4);
  });
  it.each(languages)("%s actual steps preserve route and contain example, exercise, optional action, irregular income and calm return", locale => {
    const actual = lesson(locale);
    expect(required(stageLessons["credit-rates"], "credit lesson").quizHref).toBe("/quiz?topic=credit");
    expect(actual.steps).toEqual(metadata.steps.map(s => s.copy[locale])); expect(actual.steps).toHaveLength(4);
    for (const step of actual.steps) {
      expect(step.body).toMatch(locale === "pl" ? /przykład/i : /example/i);
      expect(step.body).toMatch(locale === "pl" ? /ćwiczenie/i : /try:/i);
      expect(step.body).toMatch(locale === "pl" ? /działanie.*opcjonalnie/i : /action:.*optionally/i);
      expect(step.body).toMatch(locale === "pl" ? /nieregularn/i : /irregular/i);
      expect(step.body).toMatch(locale === "pl" ? /po przerwie/i : /after a break/i);
      expect(step.body).not.toMatch(/USD|\$/);
    }
  });
  it.each(languages)("%s actual plain interest remains canonical and whole four-option voice fits500 without truncation", locale => {
    const plain = required(getQuizQuestions(locale).find(q => q.id === "interest-rates"), `plain ${locale}`);
    expect(plain).toEqual(question("interest-rates").copy[locale]);
    expect(plain.question).toBe(canonical("interest-rates", locale).question);
    for (const id of IDs) {
      const q = canonical(id, locale), voice = [q.question, ...q.answers.map(a => `${a.id}. ${a.text}`)].join(" ");
      const recorded = required(metadata.voice_checks.cases.find(x => x.id === id && x.locale === locale), `voice ${locale} ${id}`);
      expect(voice).toBe(recorded.text); expect(voice.length).toBe(recorded.utf16_length); expect(voice.length).toBeLessThanOrEqual(500);
      for (const answer of q.answers) expect(voice).toContain(`${answer.id}. ${answer.text}`);
    }
  });
  it("metadata retains PL scope, four steps/eight versions, twelve rationales and independent pending reviewers", () => {
    expect(metadata.module).toBe("credit-rates"); expect(metadata.market_country).toBe("PL");
    expect(metadata.distinct_existing_questions).toBe(4); expect(metadata.language_versions).toBe(8);
    expect(metadata.steps.map(s => s.question_id)).toEqual(IDs); expect(metadata.questions.map(q => q.id)).toEqual(IDs);
    expect(metadata.implementation_authorized).toBe(true); expect(metadata.status).toMatch(/pending|reviewed_limited/);
    expect(required(metadata.reviewers.financial, "financial reviewer").name).toBe("daily_data_review");
    expect(required(metadata.reviewers.frontend_localization, "UI reviewer").name).toBe("daily_ui_review");
    expect(Object.values(metadata.reviewers).every(x => x.name !== metadata.author)).toBe(true);
    expect(metadata.questions.reduce((n, q) => n + Object.keys(q.wrong_option_explanations).length, 0)).toBe(12);
    for (const item of [...metadata.questions, ...metadata.steps]) {
      expect(item.country).toBe("PL"); expect(item.version).toBe(metadata.version); expect(item.created_date).toBe("2026-10-15");
      for (const id of item.source_ids) {
        const source = required(metadata.sources.find(s => s.id === id), `source ${id}`);
        expect(source.checked_date).toBe("2026-10-15"); expect(source.access).toMatch(/^primary/);
        expect(source.url).toMatch(/^https:\/\//); expect(source.limits.length).toBeGreaterThan(20);
      }
    }
    for (const q of metadata.questions) {
      expect(q.author).toBe("daily_author"); expect(q.reviewer).toBe("daily_data_review");
      expect(q.calculation_assumptions.currency).toBe("PLN");
      expect(Object.keys(q.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter(x => x !== q.correct_answer));
      for (const rationale of Object.values(q.wrong_option_explanations)) for (const locale of languages) expect(rationale[locale].length).toBeGreaterThan(20);
    }
  });
  it("independent integer units give reference4percent plus2percentage-points =6percent and60PLN simple interest", () => {
    const basisPoints = BigInt("400") + BigInt("200");
    const interestGrosze = BigInt("100000") * basisPoints / BigInt("10000");
    expect(basisPoints.toString()).toBe("600"); expect(interestGrosze.toString()).toBe("6000");
    const a = question("interest-rates").calculation_assumptions;
    expect(a.total_rate_before_percent).toBe(5); expect(a.total_rate_after_percent).toBe(6); expect(a.simple_interest_one_year_at_new_rate).toBe(60);
    expect(a.principal_constant).toBe(true); expect(a.repayments).toBe(0); expect(a.capitalization).toBe(false);
  });
  it.each(languages)("%s interest qualification names periodically fixed and later contractual terms in both step and feedback", locale => {
    const step = required(lesson(locale).steps[0], "rate step").body, feedback = canonical("interest-rates", locale).explanation;
    for (const text of [step, feedback]) {
      expect(text).toMatch(locale === "pl" ? /okresowo stałe/i : /periodically fixed/i);
      expect(text).toMatch(locale === "pl" ? /warunki umowy.*po/i : /contractual terms.*(after|when)/i);
      expect(text).toMatch(locale === "pl" ? /opłat/i : /fee/i);
    }
  });
  it("independent marginal avalanche comparison gives20PLN versus10PLN only in the declared simple year", () => {
    const extra = BigInt("10000"), high = extra * BigInt("20") / BigInt("100"), low = extra * BigInt("10") / BigInt("100");
    expect(high.toString()).toBe("2000"); expect(low.toString()).toBe("1000"); expect((high - low).toString()).toBe("1000");
    const a = question("debt-avalanche").calculation_assumptions;
    expect(a.extra_payment_at_period_start).toBe(true); expect(a.each_comparable_balance_at_least).toBe(100);
    expect(a.other_cash_flows_in_marginal_model).toBe(0); expect(a.capitalization).toBe(false);
    expect(a.initial_comparable_balances).toEqual([1000, 500]); expect(a.annual_rates_percent).toEqual([20, 10]);
    expect(a.essentials_and_all_required_minimums_already_covered).toBe(true); expect(a.minimum_payments_not_replaced).toBe(true);
    expect(a.not_total_schedule_or_guaranteed_savings).toBe(true); expect(a.no_extra_payment_required_when_income_insufficient).toBe(true);
  });
  it.each(languages)("%s avalanche keeps minimums and no surplus optional rather than promising a universal saving", locale => {
    const body = required(lesson(locale).steps[1], "debt step").body, q = canonical("debt-avalanche", locale);
    expect(body).toMatch(locale === "pl" ? /minimalne spłaty wszystkich/ : /all debts' required minimum/);
    expect(body).toMatch(locale === "pl" ? /braku nadwyżki nie musisz/ : /no surplus, no extra payment is required/);
    expect(body).toMatch(locale === "pl" ? /nie pełny harmonogram ani gwarancja/ : /not a full schedule or guarantee/);
    expect(q.answers.find(a => a.id === "C")?.text).toContain("20%");
    expect(q.explanation).toMatch(locale === "pl" ? /umowie/ : /contract/);
  });
  it.each(languages)("%s scoring teaches no universal weights, approval promise, new-debt requirement or Coachfi-bank score equivalence", locale => {
    const body = required(lesson(locale).steps[2], "score step").body, q = canonical("credit-score-factors", locale);
    expect(body + q.explanation).not.toMatch(/35\s*%|FICO|biggest|największ/);
    expect(body).toMatch(locale === "pl" ? /dochody, wydatki/ : /income, expenses/);
    expect(body).toMatch(locale === "pl" ? /nie jest tym samym/ : /not the same/);
    expect(body).toMatch(locale === "pl" ? /Punkty Coachfi nie są oceną BIK/ : /Coachfi points are not a BIK score/);
    expect(q.explanation).toMatch(locale === "pl" ? /nie gwarantuje/ : /does not guarantee/);
    expect(q.explanation).toMatch(locale === "pl" ? /Nie trzeba brać nowego długu ani kupować raportu/ : /No new debt or paid report is needed/);
  });
  it("independent rounded grosze discount one fixed1100PLN cashflow to1000 then916.67 without changing promised principal", () => {
    const cashFlowGrosze = BigInt("110000");
    const initial = cashFlowGrosze * BigInt("100") / BigInt("110");
    const newRounded = (cashFlowGrosze * BigInt("100") + BigInt("60")) / BigInt("120");
    expect(initial.toString()).toBe("100000"); expect(newRounded.toString()).toBe("91667");
    const a = question("bond-prices").calculation_assumptions;
    expect(a.face_value).toBe(1000); expect(a.fixed_final_coupon).toBe(100); expect(a.fixed_cash_flow_at_maturity).toBe(1100);
    expect(a.later_model_price_rounded).toBe(916.67); expect(a.time_to_maturity_unchanged).toBe(true);
    expect(a.default_assumed_absent_in_calculation).toBe(true); expect(a.default_risk_still_exists).toBe(true);
    expect(a.secondary_market_sale_not_face_value_change).toBe(true);
  });
  it.each(languages)("%s bonds distinguish secondary-market price, fixed principal/coupon, default and difficulty selling", locale => {
    const body = required(lesson(locale).steps[3], "bond step").body, q = canonical("bond-prices", locale);
    expect(body).toMatch(locale === "pl" ? /1 100 ÷ 1,20 ≈ 916,67/ : /1,100 ÷ 1.20 ≈ PLN 916.67/);
    expect(body).toMatch(locale === "pl" ? /Emitent może nie zapłacić/ : /issuer may fail to pay/);
    expect(body).toMatch(locale === "pl" ? /sprzedaż może być trudna/ : /selling may be difficult/);
    expect(q.explanation).toMatch(locale === "pl" ? /rynku wtórnym/ : /secondary-market/);
    expect(q.explanation).toMatch(locale === "pl" ? /nie reguła dla każdej obligacji/ : /not a rule for every bond/);
  });
  it("restoration cannot hide another runtime record or a byte outside approved spans", () => {
    const other = required(quizQuestions.find(q => !IDs.includes(q.id)), "non-credit question");
    const changed = { ...other, reward: other.reward + 1 };
    expect(restorePreC16EnglishRecords([changed])[0]).toBe(changed);
    expect(restorePreC16EnglishRecords(quizQuestions).filter(q => IDs.includes(q.id))).toEqual(baseline.targetQuestions);
    const file = "data/quizQuestions.ts", original = readSource(file), tampered = "// unrelated mutation\n" + original;
    expect(restorePreC16Source(file, tampered)).toBe("// unrelated mutation\n" + restorePreC16Source(file, original));
    for (const locale of locales.filter(x => x !== "en" && x !== "pl")) {
      const records = getQuizQuestions(locale); expect(restorePreC16PlainRecords(records, locale)).toEqual(records);
    }
    expect(restorePreC16Source("lib/inflation.ts", "unrelated bytes")).toBe("unrelated bytes");
  });
});
