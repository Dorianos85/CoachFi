import { restorePreC15Source } from "./cycle69-legacy-preservation";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";
import { moneyMindsetLesson, MONEY_MINDSET_QUIZ } from "@/data/moneyMindsetLesson";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestions, getQuestionById } from "@/lib/allQuestions";

interface PositionMetadata {
  id: string; correct_answer: string; reward: number; country: string; languages: string[]; status: string;
  level: string; author: string; reviewer: string; review_date: string; version: string; source_ids: string[];
  objective: { pl: string; en: string };
  wrong_option_explanations: Record<string, { pl: string; en: string }>;
  calculation_assumptions: { assets?: number; liabilities?: number; expected_net_worth?: number; currency?: string };
}
interface ModuleMetadata {
  questions: PositionMetadata[]; distinct_existing_questions: number; language_versions: number; new_question_ids: number;
  market_country: string; jurisdiction: string; version: string; status: string; author: string;
  reviewers: { financial: { name: string; status: string; report?: string };
    frontend_localization: { name: string; status: string; report?: string } };
  review_scenarios_not_additional_quiz_items: Array<{ income_available: number; essentials_reserved: number;
    minimum_payments_reserved: number; available_surplus: number; chosen_transfer: number; currency: string }>;
}
const metadata = JSON.parse(readFileSync(new URL("../docs/coachfi/cycle-6/content-metadata.json", import.meta.url), "utf8")) as ModuleMetadata;
const sources = JSON.parse(readFileSync(new URL("../evidence/cycle-6/content-sources.json", import.meta.url), "utf8")) as {
  checked_date: string; sources: Array<{ id: string; publisher: string; url: string; access: string }>;
};
const IDs = ["net-worth", "lifestyle-inflation", "pay-yourself-first"];
const expected = [{ id: IDs[0], key: "B", reward: 25 }, { id: IDs[1], key: "C", reward: 25 }, { id: IDs[2], key: "B", reward: 20 }];
const normalize = (value: string) => value.replace(/\r\n/g, "\n");
const savingPreservation = JSON.parse(readFileSync(new URL("../evidence/cycle-11/legacy-preservation-oracle-adaptation.json", import.meta.url), "utf8")) as {
  oldSourceBlocks: Record<string, Array<{ id: string; before: string }>>;
};
// Restore only the four C11-authorized records from hash-verified pre-C11 source.
// Original literal C6 expected hashes still guard every remaining source byte.
function restoreAuthorizedSavingBlocks(file: string, source: string) {
  const blocks = savingPreservation.oldSourceBlocks[file]; expect(blocks).toHaveLength(4);
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const replacements: Array<{ start: number; end: number; before: string }> = [];
  const propertyName = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      let id: string | undefined;
      if (file.includes("allQuestions") && ts.isPropertyAssignment(node.parent)) id = propertyName(node.parent.name);
      if (file.includes("quizQuestions")) {
        const property = node.properties.find(p => ts.isPropertyAssignment(p) && propertyName(p.name) === "id");
        if (property && ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) id = property.initializer.text;
      }
      const block = blocks.find(block => block.id === id);
      if (block) replacements.push({ start: node.getStart(tree), end: node.end, before: normalize(block.before) });
    }
    ts.forEachChild(node, visit);
  }
  visit(tree); expect(replacements).toHaveLength(4);
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, replacement.start) + replacement.before + source.slice(replacement.end);
  }
  return source;
}
function requiredLesson(locale: "pl" | "en") {
  const lesson = moneyMindsetLesson[locale];
  if (!lesson) throw new Error(`Required ${locale} lesson is missing`);
  return lesson;
}

describe("B06 first module content author checks (no accounts/network/UI claims)", () => {
  it("preserves three distinct existing IDs, B/C/B keys, option IDs and rewards", () => {
    expect(quizQuestions.filter((question) => IDs.includes(question.id)).map((q) => q.id)).toEqual(IDs);
    for (const item of expected) {
      const original = quizQuestions.find((q) => q.id === item.id)!;
      expect(original.correctAnswer).toBe(item.key); expect(original.reward).toBe(item.reward);
      expect(original.answers.map((option) => option.id)).toEqual(["A", "B", "C", "D"]);
      expect(original.answers.filter((option) => option.id === original.correctAnswer)).toHaveLength(1);
    }
  });

  it.each(["pl", "en"] as const)("%s has three lesson steps and exactly the three matching canonical questions", (locale) => {
    expect(requiredLesson(locale).steps).toHaveLength(3);
    const selected = getAllQuestions(locale).filter((q) => IDs.includes(q.id));
    expect(selected.map((q) => q.id)).toEqual(IDs);
    for (const item of expected) {
      const question = getQuestionById(item.id, locale)!;
      expect(question.correctAnswer).toBe(item.key); expect(question.reward).toBe(item.reward);
      expect(question.answers.map((a) => a.id)).toEqual(["A", "B", "C", "D"]);
      expect(new Set(question.answers.map((a) => a.text)).size).toBe(4);
      expect(question.explanation.length).toBeGreaterThan(20);
    }
    expect(MONEY_MINDSET_QUIZ).toBe("/quiz?topic=mindset");
  });

  it.each(["pl", "en"] as const)("%s canonical prompt and all four labelled options fit voice's 500-character cap with margin", (locale) => {
    for (const id of IDs) {
      const question = getQuestionById(id, locale)!;
      const text = `${question.question} ${question.answers.map((a) => `${a.id}: ${a.text}.`).join(" ")}`;
      expect(text.length).toBeLessThanOrEqual(480); // Leaves 20 chars for existing UI prefix/formatting.
      for (const answer of question.answers) expect(text).toContain(`${answer.id}: ${answer.text}`);
    }
  });

  it("net worth example uses the same integer PLN values in PL/EN and a complete liabilities subtraction", () => {
    const assumptions = metadata.questions.find((q) => q.id === "net-worth")!.calculation_assumptions;
    expect(assumptions.currency).toBe("PLN");
    expect(assumptions.assets! - assumptions.liabilities!).toBe(assumptions.expected_net_worth);
    expect(assumptions.expected_net_worth).toBe(3000);
    const pl = requiredLesson("pl").steps[0].body.replace(/\s+/g, " ");
    const en = requiredLesson("en").steps[0].body;
    for (const amount of [5000, 2000, 3000]) {
      const plGrouped = String(amount).replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
      expect(pl).toContain(`${plGrouped} zł`);
      expect(en).toContain(`PLN ${new Intl.NumberFormat("en-GB").format(amount)}`);
    }
    expect(pl).toMatch(/ten sam dzień/); expect(en).toMatch(/same date/);
  });

  it.each(["pl", "en"] as const)("%s net worth lesson and canonical feedback separate human value from liquidity", (locale) => {
    const lesson = requiredLesson(locale).steps[0].body;
    const feedback = getQuestionById("net-worth", locale)!.explanation;
    for (const text of [lesson, feedback]) {
      expect(text).toMatch(locale === "pl" ? /płynno/ : /liquidity/);
      expect(text).toMatch(locale === "pl" ? /człowieka/ : /person/);
    }
    expect(lesson).toMatch(locale === "pl" ? /Dochody i wydatki są przepływami za okres/ : /Income and expenses are flows over a period/);
    expect(quizQuestions.find((q) => q.id === "net-worth")!.successMessage).not.toContain("real measure of financial health");
  });

  it.each(["pl", "en"] as const)("%s lifestyle correct option identifies choice, and feedback distinguishes necessary costs", (locale) => {
    const question = getQuestionById("lifestyle-inflation", locale)!;
    const correct = question.answers.find((answer) => answer.id === "C")!.text;
    expect(correct).toMatch(locale === "pl" ? /Dobrowolne/ : /Choosing/);
    const lesson = requiredLesson(locale).steps[1].body;
    expect(lesson).toMatch(locale === "pl" ? /konieczne leczenie/ : /necessary healthcare/);
    expect(lesson).toMatch(locale === "pl" ? /ceny jedzenia/ : /food prices/);
    expect(question.explanation).toMatch(locale === "pl" ? /konieczne wydatki/ : /necessary expenses/);
    expect(lesson).toMatch(locale === "pl" ? /Nie musisz oszczędzać całej/ : /do not have to save the entire/);
  });

  it.each(["pl", "en"] as const)("%s saving instruction protects essentials/minimums and accommodates zero or irregular income", (locale) => {
    const lesson = requiredLesson(locale).steps[2].body;
    const question = getQuestionById("pay-yourself-first", locale)!;
    const correct = question.answers.find((answer) => answer.id === "B")!.text;
    expect(correct).toMatch(locale === "pl" ? /po zabezpieczeniu/ : /after reserving/);
    expect(correct).toMatch(locale === "pl" ? /minimalnych spłat/ : /minimum payments/);
    expect(lesson).toMatch(locale === "pl" ? /nieregularnym dochodzie/ : /irregular income/);
    expect(lesson).toMatch(locale === "pl" ? /zerowej nadwyżce nie rób przelewu/ : /no surplus, do not make a transfer/);
    expect(lesson).toMatch(locale === "pl" ? /To nie porażka/ : /not a failure/);
    expect(lesson).toMatch(locale === "pl" ? /nie obowiązkiem/ : /not a requirement/);
    expect(question.explanation).toMatch(locale === "pl" ? /brak nadwyżki oznacza brak przelewu/ : /no surplus means no transfer/);
    expect(lesson).not.toMatch(locale === "pl" ? /zanim zapłacisz czynsz/ : /before rent, food/);
  });

  it("review scenarios protect reserved needs/minimums before an optional transfer (not extra quiz items)", () => {
    for (const scenario of metadata.review_scenarios_not_additional_quiz_items) {
      const surplus = Math.max(0, scenario.income_available - scenario.essentials_reserved - scenario.minimum_payments_reserved);
      expect(scenario.available_surplus).toBe(surplus); expect(scenario.chosen_transfer).toBeGreaterThanOrEqual(0);
      expect(scenario.chosen_transfer).toBeLessThanOrEqual(surplus); expect(scenario.currency).toBe("PLN");
      if (surplus === 0) expect(scenario.chosen_transfer).toBe(0);
    }
    expect(metadata.new_question_ids).toBe(0);
  });

  it("metadata covers objectives, three wrong options, sources, PL/EN and Poland without self-approval", () => {
    expect(metadata.distinct_existing_questions).toBe(3); expect(metadata.language_versions).toBe(6);
    expect(metadata.market_country).toBe("PL"); expect(metadata.author).toBe("curriculum_pilot");
    expect(["draft_for_independent_review", "reviewed_limited_local_release_pending"]).toContain(metadata.status);
    const reviewed = metadata.status === "reviewed_limited_local_release_pending";
    const financial = metadata.reviewers.financial, frontend = metadata.reviewers.frontend_localization;
    expect(financial.name).toBe("architecture_audit"); expect(frontend.name).toBe("ux_audit");
    expect(new Set([financial.name, frontend.name]).size).toBe(2);
    for (const review of [financial, frontend]) {
      expect(review.name).not.toBe(metadata.author);
      expect(review.status).toBe(reviewed ? "accepted_limited_local" : "pending");
      if (reviewed) expect(review.report).toMatch(/^docs\/coachfi\/cycle-6\/[^/]+\.md$/);
    }
    if (reviewed) {
      expect(financial.report).toBe("docs/coachfi/cycle-6/financial-review.md");
      expect(frontend.report).not.toBe(financial.report);
    }
    const sourceIDs = new Set(sources.sources.map((source) => source.id));
    expect(sourceIDs.size).toBe(sources.sources.length); expect(sources.checked_date).toBe("2026-10-14");
    for (const question of metadata.questions) {
      const item = expected.find((i) => i.id === question.id)!;
      expect(question.correct_answer).toBe(item.key); expect(question.reward).toBe(item.reward);
      expect(question.country).toBe("PL"); expect(question.languages).toEqual(["pl", "en"]);
      expect(question.objective.pl.length).toBeGreaterThan(10); expect(question.objective.en.length).toBeGreaterThan(10);
      expect(question.level).toBe("beginner"); expect(question.author).toBe("curriculum_pilot");
      expect(question.status).toBe(metadata.status); expect(question.version).toBe(metadata.version);
      expect(question.reviewer).toBe(reviewed ? "architecture_audit" : "pending");
      expect(Object.keys(question.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter((key) => key !== item.key));
      for (const rationale of Object.values(question.wrong_option_explanations)) {
        expect(rationale.pl.length).toBeGreaterThan(10); expect(rationale.en.length).toBeGreaterThan(10);
      }
      for (const sourceID of question.source_ids) expect(sourceIDs.has(sourceID)).toBe(true);
    }
    for (const source of sources.sources) expect(source.url).toMatch(/^https:\/\//);
  });

  it.each([
    ["data/moneyMindsetLesson.ts", "a6a1fb1be8af2c51c9012d913736567c93b7713a218ca47be44b449d41f38315"],
    ["data/quizQuestions.ts", "3d9775063f8dc4f55e255bde6af71d19dfb338b1a298e30b88395faf0d5f3877"],
    ["lib/allQuestions.ts", "53371ada6797aa06838a77bbad7a0505b11b23634107f0a0802da5baeedb39dc"],
  ])("%s preserves all source outside the authorized locale/three-record blocks", (file, expectedHash) => {
    let source = normalize(restorePreC15Source(file, readFileSync(new URL(`../${file}`, import.meta.url), "utf8")));
    if (file.includes("moneyMindsetLesson")) {
      const pattern = /^  (en|pl): \{[\s\S]*?^  \},/gm;
      expect(source.match(pattern)).toHaveLength(2); source = source.replace(pattern, "TARGET_LOCALE");
    } else {
      source = restoreAuthorizedSavingBlocks(file, source);
      for (const id of IDs) {
        const pattern = file.includes("allQuestions") ? new RegExp(`^  "${id}": \\{[\\s\\S]*?^  \\},`, "m")
          : new RegExp(`^  \\{\\n    id: "${id}",[\\s\\S]*?^  \\},`, "m");
        expect(source.match(pattern)).not.toBeNull(); source = source.replace(pattern, "TARGET_QUESTION");
      }
    }
    expect(createHash("sha256").update(source).digest("hex")).toBe(expectedHash);
  });
});
