import { restorePreC15Source, restorePreC15EnglishRecords, restorePreC15UnifiedRecords, restorePreC15PlainRecords, restorePreC15StageLessons } from "./cycle69-legacy-preservation";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import type { Locale } from "@/lib/i18n";

const IDs = ["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"];
const locales: Locale[] = ["en", "pl", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function nonTargets() {
  return JSON.parse(JSON.stringify({
    stageLessons: Object.fromEntries(Object.entries(restorePreC15StageLessons(stageLessons)).map(([id, lesson]) => [id, {
      ...lesson, copy: Object.fromEntries(Object.entries(lesson.copy).map(([locale, copy]) => [locale,
        id === "saving-habit" && (locale === "en" || locale === "pl") ? { ...copy, steps: "C11_TARGET_STEPS" } : copy])),
    }])),
    quizQuestions: restorePreC15EnglishRecords(quizQuestions).filter(q => !IDs.includes(q.id)),
    unifiedQuestions: Object.fromEntries(locales.map(locale => [locale, restorePreC15UnifiedRecords(getAllQuestions(locale), locale).filter(q => !IDs.includes(q.id))])),
    localizedQuiz: Object.fromEntries(locales.map(locale => [locale, restorePreC15PlainRecords(getQuizQuestions(locale), locale).filter(q =>
      !((locale === "en" || locale === "pl") && q.id === "saving-habit"))])),
  }, (_key, value: unknown) => typeof value === "function" ? String(value) : value));
}
function maskedSource(file: string) {
  const source = restorePreC15Source(file, readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const ranges: Array<[number, number]> = [];
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const record = (node: ts.Node) => ranges.push([node.getStart(tree), node.end]);
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(p => ts.isPropertyAssignment(p) && name(p.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDs.includes(id.initializer.text)) record(node);
    }
    if (file === "lib/allQuestions.ts" && ts.isPropertyAssignment(node) && IDs.includes(name(node.name))) record(node.initializer);
    if (file === "data/stageLessons.ts" && ts.isPropertyAssignment(node) && name(node.name) === "saving-habit" && ts.isCallExpression(node.initializer)) {
      const steps = node.initializer.arguments[1];
      if (ts.isObjectLiteralExpression(steps)) for (const entry of steps.properties) {
        if (ts.isPropertyAssignment(entry) && ["en", "pl"].includes(name(entry.name))) record(entry.initializer);
      }
    }
    if (file === "lib/localizedQuiz.ts" && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ["en", "pl"].includes(node.name.text) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) record(node.initializer.elements[2]);
    ts.forEachChild(node, visit);
  }
  visit(tree); ranges.sort((a, b) => a[0] - b[0]);
  let masked = source;
  for (let i = ranges.length - 1; i >= 0; i--) masked = masked.slice(0, ranges[i][0]) + `__C11_ALLOWED_${i}__` + masked.slice(ranges[i][1]);
  return { path: file, originalSha256: hash(source), maskedSha256: hash(masked), allowedRegions: ranges.length };
}
const baseline = JSON.parse(readFileSync(new URL("../evidence/cycle-11/content-author-non-target-baseline.json", import.meta.url), "utf8")) as {
  non_target: unknown; source_masks: Array<{ path: string; maskedSha256: string; allowedRegions: number }>;
  unchangedC6: Array<{ path: string; sha256: string }>;
};
interface Assumptions {
  income_available?: number; essentials_reserved?: number; minimum_payments_reserved?: number; available_surplus?: number;
  chosen_transfer?: number; take_home_income?: number; needs?: number; wants?: number; savings_and_extra_repayments?: number;
  cash_per_purchase?: number; unit_price_first?: number; unit_price_second?: number; units_first?: number; units_second?: number;
  total_units?: number; total_contributions?: number; final_unit_price?: number; final_value?: number; loss?: number;
  currency: string; fees_assumed?: number; taxes_assumed?: number; classification_is_our_illustration_not_literal_CFPB_definition?: boolean;
}
const metadata = JSON.parse(readFileSync(new URL("../docs/coachfi/cycle-11/content-metadata.json", import.meta.url), "utf8")) as {
  status: string; version: string; market_country: string; new_question_ids: number; distinct_existing_questions: number;
  questions: Array<{ id: string; correct_answer: string; reward: number; source_ids: string[];
    wrong_option_explanations: Record<string, { pl: string; en: string }>; calculation_assumptions: Assumptions }>;
  steps: Array<{ question_id: string; country: string; source_ids: string[] }>;
  sources: Array<{ id: string; publisher: string; url: string; checked_date: string; access: string }>;
  review_scenarios_not_additional_quiz_items: Array<Required<Pick<Assumptions,
    "income_available" | "essentials_reserved" | "minimum_payments_reserved" | "available_surplus" | "chosen_transfer">>>;
};

describe("B06 saving-habit author content checks, no independent acceptance claim", () => {
  it("preserves all non-target semantic records across seven modules/nine locales and canonical question banks", () => {
    expect(nonTargets()).toEqual(baseline.non_target);
  });
  it.each(baseline.source_masks)("preserves every byte outside allowed AST regions of $path", original => {
    const actual = maskedSource(original.path); expect(actual.allowedRegions).toBe(original.allowedRegions);
    expect(actual.maskedSha256).toBe(original.maskedSha256);
  });
  it.each(baseline.unchangedC6)("preserves C6 complete bytes of $path", item => {
    expect(hash(readFileSync(new URL(`../${item.path}`, import.meta.url), "utf8"))).toBe(item.sha256);
  });
  it("preserves four existing IDs, C/B/B/C keys, rewards25/25/20/30 and A-D options", () => {
    const targets = quizQuestions.filter(q => IDs.includes(q.id));
    expect(targets.map(q => [q.id, q.correctAnswer, q.reward])).toEqual([[IDs[0], "C", 25], [IDs[1], "B", 25], [IDs[2], "B", 20], [IDs[3], "C", 30]]);
    for (const q of targets) { expect(q.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]); expect(new Set(q.answers.map(a => a.text)).size).toBe(4); }
  });
  it.each(["pl", "en"] as const)("%s actual lesson has four matching steps and unchanged quiz route", locale => {
    expect(stageLessons["saving-habit"].copy[locale]!.steps).toHaveLength(4);
    expect(stageLessons["saving-habit"].quizHref).toBe("/quiz?topic=saving");
    for (const id of IDs) expect(getQuestionById(id, locale)).toBeDefined();
  });
  it.each(["pl", "en"] as const)("%s foundation saving entry agrees with canonical prompt/options/feedback", locale => {
    const local = getQuizQuestions(locale).find(q => q.id === "saving-habit")!, canonical = getQuestionById("saving-habit", locale)!;
    expect(local.question).toBe(canonical.question); expect(local.answers).toEqual(canonical.answers);
    expect(local.retryMessage).toBe(canonical.explanation); expect(local.correctAnswer).toBe("C"); expect(local.reward).toBe(25);
  });
  it.each(["pl", "en"] as const)("%s all four questions and labelled options fit the voice cap", locale => {
    for (const id of IDs) {
      const q = getQuestionById(id, locale)!; const text = `${q.question} ${q.answers.map(a => `${a.id}: ${a.text}.`).join(" ")}`;
      expect(text.length).toBeLessThanOrEqual(480); expect(q.correctAnswer).toBe(metadata.questions.find(q => q.id === id)!.correct_answer);
    }
  });
  it("metadata covers four steps/four questions/twelve bilingual distractor rationales with verified primary sources", () => {
    expect(metadata.market_country).toBe("PL"); expect(metadata.new_question_ids).toBe(0); expect(metadata.distinct_existing_questions).toBe(4);
    expect(metadata.steps.map(s => s.question_id)).toEqual(IDs); expect(metadata.questions.map(q => q.id)).toEqual(IDs);
    expect(metadata.questions.reduce((n, q) => n + Object.keys(q.wrong_option_explanations).length, 0)).toBe(12);
    for (const q of metadata.questions) {
      expect(Object.keys(q.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter(key => key !== q.correct_answer));
      for (const value of Object.values(q.wrong_option_explanations)) { expect(value.en.length).toBeGreaterThan(20); expect(value.pl.length).toBeGreaterThan(20); }
      for (const id of q.source_ids) { const source = metadata.sources.find(s => s.id === id)!; expect(source.checked_date).toBe("2026-10-15"); expect(source.access).toMatch(/^verified primary/); expect(source.url).toMatch(/^https:\/\/(?:[^/]+\.)?(?:consumerfinance\.gov|bfg\.pl|knf\.gov\.pl|investor\.gov)\//); }
    }
  });
  it.each(["pl", "en"] as const)("%s saving is optional after essentials/minimums and varies with income", locale => {
    const body = stageLessons["saving-habit"].copy[locale]!.steps[0].body;
    expect(body).toMatch(locale === "pl" ? /minimalne spłaty/ : /minimum debt payments/);
    expect(body).toMatch(locale === "pl" ? /opcjonalne/ : /optional/);
    expect(body).toMatch(locale === "pl" ? /nieregularnym/ : /irregular/);
    expect(body).toMatch(locale === "pl" ? /Bez nadwyżki/ : /No surplus/);
  });
  it.each(metadata.review_scenarios_not_additional_quiz_items)("surplus boundary $income_available preserves required spending before optional transfer", s => {
    expect(s.income_available - s.essentials_reserved - s.minimum_payments_reserved).toBe(s.available_surplus);
    expect(s.chosen_transfer).toBeGreaterThanOrEqual(0); expect(s.chosen_transfer).toBeLessThanOrEqual(Math.max(0, s.available_surplus));
    if (s.available_surplus <= 0) expect(s.chosen_transfer).toBe(0);
  });
  it("the PLN budget conserves4000 and explicitly counts minimum debt once", () => {
    const a = metadata.questions[1].calculation_assumptions;
    expect(a.take_home_income).toBe(4000); expect(a.needs! + a.wants! + a.savings_and_extra_repayments!).toBe(4000);
    expect(a.take_home_income! * 0.2).toBe(800); expect(a.savings_and_extra_repayments).toBe(800);
    expect(a.classification_is_our_illustration_not_literal_CFPB_definition).toBe(true);
  });
  it.each(["pl", "en"] as const)("%s budget convention and account limits/risk are explicit", locale => {
    const budget = stageLessons["saving-habit"].copy[locale]!.steps[1].body, deposit = stageLessons["saving-habit"].copy[locale]!.steps[2].body;
    expect(budget).toMatch(locale === "pl" ? /nasza konwencja/ : /our budgeting convention/);
    expect(budget).toMatch(locale === "pl" ? /liczymy raz/ : /included once/);
    expect(deposit).toMatch(/BFG/); expect(deposit).toMatch(locale === "pl" ? /limity i wyłączenia/ : /limits and exclusions/);
    expect(deposit).toMatch(locale === "pl" ? /inflacji/ : /inflation/); expect(deposit).toMatch(locale === "pl" ? /opłaty/ : /fees/);
    expect(deposit).not.toMatch(/4.?5×|guaranteed profit|gwarantowany zysk/);
  });
  it("DCA unit arithmetic and the explicit zero-cost loss illustration are consistent", () => {
    const a = metadata.questions[3].calculation_assumptions;
    expect(a.cash_per_purchase! / a.unit_price_first!).toBe(a.units_first); expect(a.cash_per_purchase! / a.unit_price_second!).toBe(a.units_second);
    expect(a.units_first! + a.units_second!).toBe(a.total_units); expect(a.total_units! * a.final_unit_price!).toBe(a.final_value);
    expect(a.total_contributions! - a.final_value!).toBe(a.loss); expect(a.final_value).toBe(120); expect(a.loss).toBe(80);
    expect(a.fees_assumed).toBe(0); expect(a.taxes_assumed).toBe(0); expect(a.currency).toBe("PLN");
  });
  it.each(["pl", "en"] as const)("%s DCA explains loss rather than guarantees or dollar exchange", locale => {
    const lesson = stageLessons["saving-habit"].copy[locale]!.steps[3].body, feedback = getQuestionById("dca", locale)!.explanation;
    expect(lesson).toMatch(locale === "pl" ? /nie gwarantuje/ : /does not guarantee/);
    for (const text of [lesson, feedback]) { expect(text).toContain("120"); expect(text).toContain("200"); expect(text).toContain("80"); expect(text).toMatch(locale === "pl" ? /opłat i podatków/ : /fees and taxes/); }
    expect(lesson).not.toMatch(/USD|\$/);
  });
});
