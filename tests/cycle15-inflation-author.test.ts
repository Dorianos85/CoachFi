import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { stageLessons as currentStageLessons } from "@/data/stageLessons";
import { quizQuestions as currentQuizQuestions } from "@/data/quizQuestions";
import { getAllQuestions as currentGetAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions as currentGetQuizQuestions } from "@/lib/localizedQuiz";
import type { Locale } from "@/lib/i18n";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { StageLessonStep } from "@/data/stageLessons";
import { restorePreC15Source, restorePreC15EnglishRecords, restorePreC15PlainRecords } from "./cycle15-legacy-preservation";
import { restorePreC16Source, restorePreC16EnglishRecords, restorePreC16UnifiedRecords, restorePreC16PlainRecords, restorePreC16StageLessons } from "./cycle69-legacy-preservation";
// C15 keeps testing its own targets; only later C16 records are projected to the immutable pre-C16 baseline.
const stageLessons = restorePreC16StageLessons(currentStageLessons);
const quizQuestions = restorePreC16EnglishRecords(currentQuizQuestions);
const getAllQuestions = (locale?: Locale) => restorePreC16UnifiedRecords(currentGetAllQuestions(locale), locale ?? "en");
const getQuizQuestions = (locale: Locale) => restorePreC16PlainRecords(currentGetQuizQuestions(locale), locale);
const IDs = ["inflation-basics", "real-return", "rule-of-72", "inflation-hedge"];
const locales: Locale[] = ["en", "pl", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function nonTargets() {
  return JSON.parse(JSON.stringify({
    stageLessons: Object.fromEntries(Object.entries(stageLessons).map(([id, lesson]) => [id, {
      ...lesson, copy: Object.fromEntries(Object.entries(lesson.copy).map(([locale, copy]) => [locale,
        id === "inflation" && (locale === "en" || locale === "pl") ? { ...copy, steps: "C15_TARGET_STEPS" } : copy])),
    }])),
    quizQuestions: quizQuestions.filter(question => !IDs.includes(question.id)),
    unifiedQuestions: Object.fromEntries(locales.map(locale => [locale, getAllQuestions(locale).filter(question => !IDs.includes(question.id))])),
    localizedQuiz: Object.fromEntries(locales.map(locale => [locale, getQuizQuestions(locale).filter(question =>
      !((locale === "en" || locale === "pl") && question.id === "inflation-basics"))])),
  }, (_key, value: unknown) => typeof value === "function" ? String(value) : value));
}
function maskedSource(file: string) {
  const source = restorePreC16Source(file, readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const ranges: Array<[number, number]> = [];
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const record = (node: ts.Node) => ranges.push([node.getStart(tree), node.end]);
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDs.includes(id.initializer.text)) record(node);
    }
    if (file === "lib/allQuestions.ts" && ts.isPropertyAssignment(node) && IDs.includes(name(node.name))) record(node.initializer);
    if (file === "data/stageLessons.ts" && ts.isPropertyAssignment(node) && name(node.name) === "inflation" && ts.isCallExpression(node.initializer)) {
      const steps = node.initializer.arguments[1];
      if (ts.isObjectLiteralExpression(steps)) for (const entry of steps.properties) {
        if (ts.isPropertyAssignment(entry) && ["en", "pl"].includes(name(entry.name))) record(entry.initializer);
      }
    }
    if (file === "lib/localizedQuiz.ts" && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ["en", "pl"].includes(node.name.text) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) record(node.initializer.elements[0]);
    ts.forEachChild(node, visit);
  }
  visit(tree); ranges.sort((a, b) => a[0] - b[0]);
  let masked = source;
  for (let index = ranges.length - 1; index >= 0; index--) masked = masked.slice(0, ranges[index][0]) + `__C15_ALLOWED_${index}__` + masked.slice(ranges[index][1]);
  return { path: file, originalSha256: hash(source), maskedSha256: hash(masked), allowedRegions: ranges.length };
}
interface Baseline {
  non_target: unknown; targetQuestions: QuizQuestion[];
  source_masks: Array<{ path: string; originalSha256: string; maskedSha256: string; allowedRegions: number }>;
  counts: { stages: number; englishQuiz: number; plainByLocale: Record<Locale, number> };
  unchangedC14: Array<{ path: string; sha256: string }>;
}
type Assumptions = Record<string, number | string | boolean>;
interface Metadata {
  module: string; version: string; status: string; author: string; market_country: string;
  distinct_existing_questions: number; new_question_ids: number; language_versions: number; reward_total: number;
  reviewers: Record<string, { name: string; status: string }>;
  steps: Array<{ question_id: string; country: string; source_ids: string[]; version: string; created_date: string;
    copy: Record<"pl" | "en", StageLessonStep>; calculation_assumptions: Assumptions }>;
  questions: Array<{ id: string; correct_answer: string; reward: number; country: string; version: string; created_date: string;
    author: string; reviewer: string; source_ids: string[]; objective: Record<"pl" | "en", string>;
    wrong_option_explanations: Record<string, Record<"pl" | "en", string>>; calculation_assumptions: Assumptions;
    copy: Record<"pl" | "en", QuizQuestion> }>;
  sources: Array<{ id: string; publisher: string; url: string; checked_date: string; access: string }>;
}
const baseline = JSON.parse(readFileSync(new URL("../evidence/cycle-15/content-author-non-target-baseline.json", import.meta.url), "utf8")) as Baseline;
const metadata = JSON.parse(readFileSync(new URL("../docs/coachfi/cycle-15/content-metadata.json", import.meta.url), "utf8")) as Metadata;

describe("C15 inflation content author checks; independent acceptance remains separate", () => {
  it("preserves all non-target semantics across seven stages and nine locale banks", () => {
    expect(nonTargets()).toEqual(baseline.non_target);
  });
  it.each(baseline.source_masks)("preserves every byte outside authorized AST spans of $path", original => {
    const actual = maskedSource(original.path); expect(actual.allowedRegions).toBe(original.allowedRegions);
    expect(actual.maskedSha256).toBe(original.maskedSha256);
  });
  it.each(baseline.source_masks)("legacy source restoration exactly reproduces pre-C15 $path", original => {
    const current = restorePreC16Source(original.path, readFileSync(new URL("../" + original.path, import.meta.url), "utf8"));
    expect(hash(restorePreC15Source(original.path, current))).toBe(original.originalSha256);
  });
  it.each(baseline.unchangedC14)("preserves complete C14 bytes of $path", item => {
    expect(hash(readFileSync(new URL("../" + item.path, import.meta.url), "utf8"))).toBe(item.sha256);
  });
  it("preserves distinctIDs B/D/B/C keys,25/30/30/25 rewards, A-D order and all counters", () => {
    expect(quizQuestions.filter(q => IDs.includes(q.id)).map(q => [q.id, q.correctAnswer, q.reward])).toEqual([
      [IDs[0], "B", 25], [IDs[1], "D", 30], [IDs[2], "B", 30], [IDs[3], "C", 25],
    ]);
    expect(quizQuestions.length).toBe(baseline.counts.englishQuiz); expect(Object.keys(stageLessons).length).toBe(baseline.counts.stages);
    for (const locale of locales) expect(getQuizQuestions(locale).length).toBe(baseline.counts.plainByLocale[locale]);
    expect(metadata.reward_total).toBe(110); expect(metadata.new_question_ids).toBe(0);
  });
  it.each((["pl", "en"] as const).flatMap(locale => IDs.map(id => ({ locale, id }))))("actual $locale $id agrees with authored options, key, reward and explanation", ({ locale, id }) => {
    const item = metadata.questions.find(question => question.id === id)!, draft = item.copy[locale], actual = getQuestionById(id, locale)!;
    expect(actual.question).toBe(draft.question); expect(actual.answers).toEqual(draft.answers);
    expect(actual.correctAnswer).toBe(item.correct_answer); expect(actual.reward).toBe(item.reward); expect(actual.explanation).toBe(draft.retryMessage);
    expect(actual.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]); expect(new Set(actual.answers.map(answer => answer.text)).size).toBe(4);
  });
  it.each(["pl", "en"] as const)("%s lesson keeps4matchingsteps/route with example, exercise, action and return", locale => {
    expect(stageLessons.inflation.quizHref).toBe("/quiz?topic=inflation"); expect(stageLessons.inflation.copy[locale]!.steps).toEqual(metadata.steps.map(step => step.copy[locale]));
    expect(stageLessons.inflation.copy[locale]!.steps.length).toBe(4);
    for (const step of stageLessons.inflation.copy[locale]!.steps) {
      expect(step.body).toMatch(locale === "pl" ? /Przykład/ : /example/i);
      expect(step.body).toMatch(locale === "pl" ? /Ćwiczenie/ : /Try:/);
      expect(step.body).toMatch(locale === "pl" ? /Działanie/ : /Action:/);
      expect(step.body).toMatch(locale === "pl" ? /Po przerwie/ : /After a break/);
      expect(step.body).not.toMatch(/USD|\$/);
    }
  });
  it.each(["pl", "en"] as const)("%s updated plain basics remains canonical and all labelled quiz options fit480", locale => {
    const plain = getQuizQuestions(locale).find(q => q.id === "inflation-basics")!, canonical = getQuestionById("inflation-basics", locale)!;
    expect(plain.question).toBe(canonical.question); expect(plain.answers).toEqual(canonical.answers); expect(plain.retryMessage).toBe(canonical.explanation);
    for (const id of IDs) {
      const q = getQuestionById(id, locale)!, voice = [q.question, ...q.answers.map(answer => answer.id + ". " + answer.text)].join(" ");
      expect(voice.length).toBeLessThanOrEqual(480); for (const answer of q.answers) expect(voice).toContain(answer.id + ". " + answer.text);
    }
  });
  it("metadata covers4steps/4questions/12bilingual distractors, sources and independent reviewers", () => {
    expect(metadata.steps.map(step => step.question_id)).toEqual(IDs); expect(metadata.questions.map(q => q.id)).toEqual(IDs);
    expect(metadata.market_country).toBe("PL"); expect(metadata.distinct_existing_questions).toBe(4); expect(metadata.language_versions).toBe(8);
    expect(["draft_pending_independent_review", "reviewed_limited_local_release_pending"]).toContain(metadata.status); expect(metadata.author).toBe("daily_author");
    expect(metadata.reviewers.financial.name).toBe("daily_data_review"); expect(metadata.reviewers.frontend_localization.name).toBe("daily_ui_review");
    expect(Object.values(metadata.reviewers).every(reviewer => reviewer.name !== metadata.author)).toBe(true);
    expect(metadata.questions.reduce((total, q) => total + Object.keys(q.wrong_option_explanations).length, 0)).toBe(12);
    for (const item of [...metadata.questions, ...metadata.steps]) {
      expect(item.country).toBe("PL"); expect(item.version).toBe(metadata.version); expect(item.created_date).toBe("2026-10-15");
      for (const id of item.source_ids) { const source = metadata.sources.find(source => source.id === id)!; expect(source.access).toMatch(/^verified primary/); expect(source.checked_date).toBe("2026-10-15"); expect(source.url).toMatch(/^https:\/\//); }
    }
    for (const q of metadata.questions) {
      expect(q.author).toBe("daily_author"); expect(q.reviewer).toBe("daily_data_review"); expect(q.calculation_assumptions.currency).toBe("PLN");
      expect(Object.keys(q.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter(id => id !== q.correct_answer));
      for (const explanation of Object.values(q.wrong_option_explanations)) { expect(explanation.pl.length).toBeGreaterThan(20); expect(explanation.en.length).toBeGreaterThan(20); }
    }
  });
  it("basket example is a5percent increase of samebasket with variable household costs", () => {
    const assumptions = metadata.questions[0].calculation_assumptions;
    expect((Number(assumptions.basket_after) / Number(assumptions.basket_before) - 1) * 100).toBeCloseTo(5, 9);
    for (const locale of ["pl", "en"] as const) {
      const text = stageLessons.inflation.copy[locale]!.steps[0].body;
      expect(text).toMatch(locale === "pl" ? /ważonego koszyka/ : /weighted basket/); expect(text).toMatch(locale === "pl" ? /Niektóre ceny mogą spadać/ : /Some prices can fall/);
    }
  });
  it("one-year real return uses1.02/1.05−1, notexact subtraction; PLN value971.43", () => {
    const assumptions = metadata.questions[1].calculation_assumptions;
    expect(Number(assumptions.initial_amount) * 1.02).toBe(assumptions.final_nominal_amount);
    expect(1020 / 1.05).toBeCloseTo(Number(assumptions.final_real_amount_rounded), 2);
    expect((1.02 / 1.05 - 1) * 100).toBeCloseTo(Number(assumptions.real_return_percent_rounded), 2);
    expect(assumptions.real_return_percent_rounded).toBe(-2.86); expect(assumptions.years).toBe(1);
    expect(assumptions.fees_assumed).toBe(0); expect(assumptions.taxes_assumed).toBe(0); expect(assumptions.additional_contributions).toBe(0); expect(assumptions.withdrawals).toBe(0);
  });
  it.each(["pl", "en"] as const)("%s return feedback distinguishes approximate−3 and exactmodel rounded−2.86", locale => {
    const q = getQuestionById("real-return", locale)!; expect(q.answers.find(answer => answer.id === "D")!.text).toContain(locale === "pl" ? "−2,86%" : "−2.86%");
    expect(q.explanation).toMatch(locale === "pl" ? /przybliżeniem/ : /estimate/); expect(q.explanation).toContain("−3%");
    expect(q.explanation).toContain(locale === "pl" ? "971,43" : "971.43");
  });
  it("rule72 arithmetic has explicit fixedpositiveannualcompound assumptions and onlyestimate", () => {
    const a = metadata.questions[2].calculation_assumptions;
    expect(Number(a.rule_numerator) / Number(a.annual_nominal_return_percent)).toBe(a.estimated_years); expect(a.estimated_years).toBe(12);
    expect(a.constant_positive_rate).toBe(true); expect(a.annual_compounding).toBe(true); expect(a.reinvestment).toBe(true);
    expect(a.additional_contributions).toBe(0); expect(a.withdrawals).toBe(0); expect(a.fees_assumed).toBe(0); expect(a.taxes_assumed).toBe(0); expect(a.inflation_ignored_for_nominal_example).toBe(true);
    expect(Math.log(2) / Math.log(1.06)).not.toBe(12); expect(Math.log(2) / Math.log(1.06)).toBeCloseTo(12, 0);
  });
  it.each(["pl", "en"] as const)("%s risk module protects essentials/minimums with irregular income and no purchase obligation", locale => {
    const step = stageLessons.inflation.copy[locale]!.steps[3].body, q = getQuestionById("inflation-hedge", locale)!;
    expect(q.correctAnswer).toBe("C"); expect(q.question).not.toMatch(/best|najlepsz/);
    expect(step).toMatch(locale === "pl" ? /Nie ma jednej inwestycji gwarantującej/ : /No single investment guarantees/);
    expect(step).toMatch(locale === "pl" ? /minimalne spłaty/ : /minimum repayments/);
    expect(step).toMatch(locale === "pl" ? /nieregularnym/ : /irregular/);
    expect(step).toMatch(locale === "pl" ? /nie wymaga zakupu/ : /does not require a purchase/);
    const a = metadata.steps[3].calculation_assumptions; expect(Number(a.initial_amount) - Number(a.final_nominal_amount)).toBe(a.nominal_loss); expect(a.nominal_loss).toBe(100);
  });
  it("legacy runtime restoration changes onlyauthorized IDs and cannot hide an unrelated mutation", () => {
    const restored = restorePreC15EnglishRecords(quizQuestions); expect(restored.filter(q => IDs.includes(q.id))).toEqual(baseline.targetQuestions);
    for (let index = 0; index < quizQuestions.length; index++) if (!IDs.includes(quizQuestions[index].id)) expect(restored[index]).toBe(quizQuestions[index]);
    const other = quizQuestions.find(q => !IDs.includes(q.id))!, changed = { ...other, reward: other.reward + 1 };
    expect(restorePreC15EnglishRecords([changed])[0]).toBe(changed);
    for (const locale of locales.filter(locale => !["pl", "en"].includes(locale))) {
      const records = getQuizQuestions(locale); expect(restorePreC15PlainRecords(records, locale)).toEqual(records);
    }
  });
});
