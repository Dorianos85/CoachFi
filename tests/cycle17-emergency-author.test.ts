import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { stageLessons as currentStageLessons, type StageLessonStep } from "@/data/stageLessons";
import { quizQuestions as currentQuizQuestions, type QuizQuestion } from "@/data/quizQuestions";
import { challengeQuestions } from "@/data/challengeQuestions";
import { getAllQuestions as currentGetAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import type { Locale } from "@/lib/i18n";
import { c17AllowedSourceBlocks, restorePreC17Source, restorePreC17EnglishRecords, restorePreC17PlainRecords, restorePreC24StageLessons } from "./cycle37-legacy-preservation";
import { restorePreC23Source, restorePreC23EnglishRecords, restorePreC23UnifiedRecords } from "./cycle69-legacy-preservation";

// C17 assertions retain their historical view of the separately approved C23 copy update.
const stageLessons = restorePreC24StageLessons(currentStageLessons);
const quizQuestions = restorePreC23EnglishRecords(currentQuizQuestions);
const getAllQuestions = (locale?: Locale) => restorePreC23UnifiedRecords(currentGetAllQuestions(locale), locale ?? "en");

const forbiddenFetch = vi.fn(() => { throw new Error("C17 author tests forbid all fetch calls"); });
beforeAll(() => { vi.stubGlobal("fetch", forbiddenFetch); });
afterAll(() => { try { expect(forbiddenFetch).not.toHaveBeenCalled(); } finally { vi.unstubAllGlobals(); } });

const IDs = ["emergency-fund", "emergency-fund-characteristics", "emergency-fund-start"];
const languages = ["pl", "en"] as const;
const locales: Locale[] = ["en", "pl", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing C17 author input: ${label}`);
  return value;
}
interface Baseline {
  non_target: unknown; targetQuestions: QuizQuestion[]; deferredNonTarget: QuizQuestion;
  source_masks: Array<{ path: string; originalSha256: string; maskedSha256: string; allowedRegions: number }>;
  counts: { stages: number; plainByLocale: Record<Locale, number> };
  unchangedHistorical: Array<{ path: string; sha256: string }>;
}
interface Item {
  id: string; correct_answer: string; reward: number; country: string; version: string; created_date: string;
  author: string; reviewer: string; source_ids: string[]; calculation_assumptions: Record<string, unknown>;
  copy: Record<"pl" | "en", QuizQuestion>; wrong_option_explanations: Record<string, Record<"pl" | "en", string>>;
}
interface Metadata {
  module: string; status: string; version: string; market_country: string; author: string; implementation_authorized: boolean;
  distinct_existing_questions: number; language_versions: number; lesson_steps_per_language: number; new_question_ids: number; reward_total: number;
  reviewers: Record<string, { name: string; status: string }>;
  questions: Item[];
  steps: Array<{ question_id: string; country: string; version: string; created_date: string; source_ids: string[];
    copy: Record<"pl" | "en", StageLessonStep>; calculation_assumptions: Record<string, unknown> }>;
  sources: Array<{ id: string; url: string; checked_date: string; access: string; limits: string }>;
  voice_checks: { maximum: number; cases: Array<{ id: string; locale: "pl" | "en"; text: string; utf16_length: number }> };
  review_scenarios_not_additional_quiz_items: Array<{ income: number; essentials: number; minimums: number; other_required_costs: number; raw_surplus: number; chosen_transfer: number }>;
  deferred_related_records: Array<{ id: string; status: string }>;
}
const read = (file: string) => restorePreC23Source(file, readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const baseline = JSON.parse(read("evidence/cycle-17/content-author-non-target-baseline.json")) as Baseline;
const metadata = JSON.parse(read("docs/coachfi/cycle-17/content-metadata.json")) as Metadata;
const item = (id: string) => required(metadata.questions.find(q => q.id === id), `metadata ${id}`);
const lesson = (locale: "pl" | "en") => required(required(stageLessons["emergency-fund"], "emergency lesson").copy[locale], `lesson ${locale}`);
const canonical = (id: string, locale: "pl" | "en") => required(getQuestionById(id, locale), `${locale} ${id}`);
const runtimeJSON = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, v: unknown) =>
  typeof v === "function" ? { functionResults: [v(1, 3), v(3, 3), v(0, 0)] } : v));
function nonTargets() {
  return runtimeJSON({
    stageLessons: Object.fromEntries(Object.entries(stageLessons).map(([id, lesson]) => [id, {
      ...lesson, copy: Object.fromEntries(Object.entries(lesson.copy).map(([locale, copy]) => [locale,
        id === "emergency-fund" && (locale === "en" || locale === "pl") ? { ...copy, steps: "C17_TARGET_STEPS" } : copy])),
    }])),
    quizQuestions: quizQuestions.filter(q => !IDs.includes(q.id)),
    unifiedQuestions: Object.fromEntries(locales.map(locale => [locale, getAllQuestions(locale).filter(q => !IDs.includes(q.id))])),
    localizedQuiz: Object.fromEntries(locales.map(locale => [locale, getQuizQuestions(locale).filter(q =>
      !((locale === "en" || locale === "pl") && q.id === "emergency-fund"))])),
  });
}
function mask(file: string) {
  let source = read(file);
  const blocks = c17AllowedSourceBlocks(file, source);
  for (let index = blocks.length - 1; index >= 0; index--) {
    const block = required(blocks[index], `block ${index}`);
    source = source.slice(0, block.start) + `__C17_ALLOWED_${index}__` + source.slice(block.end);
  }
  return { regions: blocks.length, sha256: hash(source) };
}

describe("C17 emergency content author checks; independent acceptance remains separate", () => {
  it("preserves all runtime non-targets across seven lesson modules and nine locale banks", () => {
    expect(nonTargets()).toEqual(baseline.non_target);
  });
  it.each(baseline.source_masks)("preserves every byte outside2/3/3/2approved emergency spans in $path", old => {
    expect(mask(old.path)).toEqual({ regions: old.allowedRegions, sha256: old.maskedSha256 });
  });
  it.each(baseline.source_masks)("restores exact pre-C17 source for $path", old => {
    expect(hash(restorePreC17Source(old.path, read(old.path)))).toBe(old.originalSha256);
  });
  it.each(baseline.unchangedHistorical)("retains immutable historical helper or golden input $path", old => {
    expect(hash(read(old.path))).toBe(old.sha256);
  });
  it("retains three IDs C/C/B rewards25/25/20 sum70 and union82 without altering pool counts", () => {
    expect(quizQuestions.filter(q => IDs.includes(q.id)).map(q => [q.id, q.correctAnswer, q.reward])).toEqual([
      ["emergency-fund", "C", 25], ["emergency-fund-characteristics", "C", 25], ["emergency-fund-start", "B", 20],
    ]);
    expect(quizQuestions).toHaveLength(62); expect(challengeQuestions).toHaveLength(20); expect(getAllQuestions()).toHaveLength(82);
    expect(new Set(getAllQuestions().map(q => q.id)).size).toBe(82); expect(Object.keys(stageLessons)).toHaveLength(baseline.counts.stages);
    for (const locale of locales) expect(getQuizQuestions(locale)).toHaveLength(baseline.counts.plainByLocale[locale]);
    expect(metadata.reward_total).toBe(70); expect(metadata.lesson_steps_per_language).toBe(3); expect(metadata.new_question_ids).toBe(0);
  });
  it.each(languages.flatMap(locale => IDs.map(id => ({ locale, id }))))("actual $locale $id matches draft words, one key, reward and complete feedback", ({ locale, id }) => {
    const q = canonical(id, locale), authored = item(id), draft = authored.copy[locale];
    expect(q.question).toBe(draft.question); expect(q.answers).toEqual(draft.answers); expect(q.explanation).toBe(draft.retryMessage);
    expect(q.category).toBe(draft.category); expect(q.correctAnswer).toBe(authored.correct_answer); expect(q.reward).toBe(authored.reward);
    expect(q.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]); expect(q.answers.filter(a => a.id === q.correctAnswer)).toHaveLength(1);
    expect(new Set(q.answers.map(a => a.text)).size).toBe(4);
  });
  it.each(languages)("%s lesson keeps3steps and route with examples, exercises, optional actions, irregular income and calm return", locale => {
    const current = lesson(locale);
    expect(current.steps).toEqual(metadata.steps.map(s => s.copy[locale])); expect(current.steps).toHaveLength(3);
    expect(required(stageLessons["emergency-fund"], "emergency").quizHref).toBe("/quiz?topic=emergency");
    for (const step of current.steps) {
      expect(step.body).toMatch(locale === "pl" ? /przykład/i : /example/i);
      expect(step.body).toMatch(locale === "pl" ? /ćwiczenie/i : /try:/i);
      expect(step.body).toMatch(locale === "pl" ? /działanie.*opcjonalnie/i : /action:.*optionally/i);
      expect(step.body).toMatch(locale === "pl" ? /nieregularn/i : /irregular/i);
      expect(step.body).toMatch(locale === "pl" ? /po przerwie|lub przerwie/i : /after a break|taking a break/i);
      expect(step.body).not.toMatch(/USD|\$/);
    }
  });
  it.each(languages)("%s actual plain emergency agrees with canonical and complete question+ABCD voice fits500", locale => {
    expect(required(getQuizQuestions(locale).find(q => q.id === "emergency-fund"), `plain ${locale}`)).toEqual(item("emergency-fund").copy[locale]);
    for (const id of IDs) {
      const q = canonical(id, locale), voice = [q.question, ...q.answers.map(a => `${a.id}. ${a.text}`)].join(" ");
      const recorded = required(metadata.voice_checks.cases.find(c => c.id === id && c.locale === locale), `voice ${id} ${locale}`);
      expect(voice).toBe(recorded.text); expect(voice.length).toBe(recorded.utf16_length); expect(voice.length).toBeLessThanOrEqual(500);
      for (const answer of q.answers) expect(voice).toContain(`${answer.id}. ${answer.text}`);
    }
  });
  it("metadata has3IDs/6language versions/9rationales with PL sources and independent reviewers", () => {
    expect(metadata.module).toBe("emergency-fund"); expect(metadata.market_country).toBe("PL");
    expect(metadata.distinct_existing_questions).toBe(3); expect(metadata.language_versions).toBe(6);
    expect(metadata.questions.map(q => q.id)).toEqual(IDs); expect(metadata.steps.map(s => s.question_id)).toEqual(IDs);
    expect(metadata.implementation_authorized).toBe(true); expect(metadata.status).toMatch(/pending|reviewed_limited/);
    expect(required(metadata.reviewers.financial, "financial").name).toBe("daily_data_review");
    expect(required(metadata.reviewers.frontend_localization, "UI").name).toBe("daily_ui_review");
    expect(Object.values(metadata.reviewers).every(r => r.name !== metadata.author)).toBe(true);
    expect(metadata.questions.reduce((sum, q) => sum + Object.keys(q.wrong_option_explanations).length, 0)).toBe(9);
    for (const q of metadata.questions) {
      expect(q.author).toBe("daily_author"); expect(q.reviewer).toBe("daily_data_review"); expect(q.calculation_assumptions.currency).toBe("PLN");
      expect(Object.keys(q.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter(a => a !== q.correct_answer));
      for (const explanation of Object.values(q.wrong_option_explanations)) for (const locale of languages) expect(explanation[locale].length).toBeGreaterThan(20);
    }
    for (const record of [...metadata.questions, ...metadata.steps]) {
      expect(record.country).toBe("PL"); expect(record.version).toBe(metadata.version); expect(record.created_date).toBe("2026-10-15");
      for (const id of record.source_ids) {
        const source = required(metadata.sources.find(s => s.id === id), `source ${id}`);
        expect(source.url).toMatch(/^https:\/\//); expect(source.access).toMatch(/^primary/);
        expect(source.checked_date).toBe("2026-10-15"); expect(source.limits.length).toBeGreaterThan(20);
      }
    }
  });
  it("chosen3months at2000PLN give6000PLN in integer grosze, with debt minima counted once", () => {
    const monthly = BigInt("200000"), three = monthly * BigInt("3"), six = monthly * BigInt("6");
    expect(three.toString()).toBe("600000"); expect(six.toString()).toBe("1200000");
    const a = item("emergency-fund").calculation_assumptions;
    expect(a.chosen_months).toBe(3); expect(a.chosen_goal).toBe(6000); expect(a.alternative_six_month_goal).toBe(12000);
    expect(a.minimum_repayments_counted_once).toBe(true); expect(a.required_minimum_repayments_already_included).toBe(true);
    expect(a.not_a_required_minimum_or_safety_guarantee).toBe(true); expect(a.goal_arithmetic_not_savings_timeline).toBe(true);
  });
  it.each(languages)("%s goal states hypothetical choice and no duty/guarantee instead of imposing a universal month range", locale => {
    const body = required(lesson(locale).steps[0], "goal").body, q = canonical("emergency-fund", locale);
    expect(body).toMatch(locale === "pl" ? /nie jest obowiązkiem ani gwarancją/ : /not a duty or guarantee/);
    expect(body).toMatch(locale === "pl" ? /liczonymi raz/ : /counted once/);
    expect(q.question).toMatch(locale === "pl" ? /W przykładzie wybierasz 3/ : /In this example you choose 3/);
    expect(q.explanation).toMatch(locale === "pl" ? /zależy od sytuacji/ : /depends on circumstances/);
    expect(body + q.explanation).not.toMatch(/NBP|wynagrodzeni|monthly salaries/i);
  });
  it("hypothetical access fee leaves30PLN:200minus150minus20 with time availability explicitly assumed", () => {
    const remainder = BigInt("20000") - BigInt("15000") - BigInt("2000"); expect(remainder.toString()).toBe("3000");
    const a = item("emergency-fund-characteristics").calculation_assumptions;
    expect(a.remainder).toBe(30); expect(a.hypothetical_access_fee).toBe(20); expect(a.cost_available_in_time_assumed_for_arithmetic).toBe(true);
    expect(a.low_risk_not_zero_loss_or_zero_cost_or_instant_access).toBe(true); expect(a.no_product_recommended).toBe(true);
  });
  it.each(languages)("%s access step and feedback distinguish limited risk from no loss/cost/delay or blanket protection", locale => {
    const body = required(lesson(locale).steps[1], "access").body, q = canonical("emergency-fund-characteristics", locale);
    expect(body).toMatch(locale === "pl" ? /nie oznacza braku strat, kosztów lub opóźnień/ : /does not mean no losses, costs or delays/);
    expect(body).toMatch(locale === "pl" ? /podmiotu i produktu/ : /institution and product/);
    expect(body).toMatch(locale === "pl" ? /bez zakupu lub otwierania konta/ : /without buying or opening an account/);
    expect(q.correctAnswer).toBe("C"); expect(q.answers.find(a => a.id === "C")?.text).toMatch(locale === "pl" ? /zmiennych akcjach/ : /volatile shares/);
    expect(q.explanation).toMatch(locale === "pl" ? /nie każda inwestycja/ : /does not cover every investment/);
  });
  it.each(metadata.review_scenarios_not_additional_quiz_items)("income$income preserves essentials/minima and chooses only affordable optional savings", scenario => {
    const surplus = scenario.income - scenario.essentials - scenario.minimums - scenario.other_required_costs;
    expect(surplus).toBe(scenario.raw_surplus); expect(scenario.chosen_transfer).toBeGreaterThanOrEqual(0);
    expect(scenario.chosen_transfer).toBeLessThanOrEqual(Math.max(0, surplus));
    if (surplus <= 0) expect(scenario.chosen_transfer).toBe(0);
  });
  it.each(languages)("%s small start is optional after minimums, not one required month or borrowing, with calm return", locale => {
    const body = required(lesson(locale).steps[2], "start").body, q = canonical("emergency-fund-start", locale);
    expect(body).toMatch(locale === "pl" ? /Nie trzeba zaczynać od miesiąca/ : /not a required first milestone/);
    expect(body).toMatch(locale === "pl" ? /dobrowolnie/ : /optionally/);
    expect(body).toMatch(locale === "pl" ? /nie pożyczaj, żeby oszczędzać/ : /do not borrow to save/);
    expect(body).toMatch(locale === "pl" ? /bez kary i nadrabiania/ : /without punishment or catching up/);
    expect(body + q.explanation).not.toMatch(/covers most common shocks|most common emergencies|większość.*awari/i);
    expect(q.explanation).toMatch(locale === "pl" ? /0 zł/ : /PLN 0/);
    const a = item("emergency-fund-start").calculation_assumptions;
    expect(a.optional_chosen_transfer).toBe(10); expect(a.uncommitted_surplus_left).toBe(10); expect(a.illustrative_small_goal).toBe(50);
    expect(a.one_month_not_required_first_goal).toBe(true); expect(a.transfer_required).toBe(false); expect(a.borrowing_to_save).toBe(0);
  });
  it("related research/one-month ID remains an unchanged deferred non-target and is not added to this module", () => {
    const deferred = required(quizQuestions.find(q => q.id === "emergency-first-milestone"), "deferred ID");
    expect(deferred).toEqual(baseline.deferredNonTarget); expect(IDs).not.toContain(deferred.id);
    expect(required(metadata.deferred_related_records.find(x => x.id === deferred.id), "deferred metadata").status).toMatch(/deferred/);
  });
  it("adapter restores only3IDs and cannot conceal unrelated record changes or source bytes", () => {
    const other = required(quizQuestions.find(q => !IDs.includes(q.id)), "non-emergency record"), changed = { ...other, reward: other.reward + 1 };
    expect(restorePreC17EnglishRecords([changed])[0]).toBe(changed);
    expect(restorePreC17EnglishRecords(quizQuestions).filter(q => IDs.includes(q.id))).toEqual(baseline.targetQuestions);
    const file = "data/quizQuestions.ts", original = read(file), changedSource = "// unrelated change\n" + original;
    expect(restorePreC17Source(file, changedSource)).toBe("// unrelated change\n" + restorePreC17Source(file, original));
    for (const locale of locales.filter(l => l !== "pl" && l !== "en")) {
      const records = getQuizQuestions(locale); expect(restorePreC17PlainRecords(records, locale)).toEqual(records);
    }
    expect(restorePreC17Source("lib/quiz-topic.ts", "root-owned source")).toBe("root-owned source");
  });
});
