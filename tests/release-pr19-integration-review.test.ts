import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getAllQuestions } from "@/lib/allQuestions";
import { deckOverrides } from "@/lib/localizedDeck";

// Literal oracle derives from immutable PR19 parent15de716, not the post-merge exports.
// Source preservation and metadata checks do not revalidate all financial copy or seven other locales.
const EXPECTED: Array<[string, string, number]> = [["inflation-basics","B",25],["emergency-fund","C",25],["saving-habit","C",25],["interest-rates","C",25],["net-worth","B",25],["lifestyle-inflation","C",25],["pay-yourself-first","B",20],["budget-50-30-20","B",25],["high-yield-savings","B",20],["dca","C",30],["real-return","D",30],["rule-of-72","B",30],["inflation-hedge","C",25],["debt-avalanche","C",30],["credit-score-factors","B",25],["bond-prices","B",30],["emergency-fund-characteristics","C",25],["emergency-fund-start","B",20],["compound-interest","C",30],["diversification","B",25],["index-fund","B",25],["etf-definition","C",25],["time-in-market","B",30],["retirement-purpose","B",25],["retirement-early-start","C",35],["poland-compound-gap","C",30],["poland-trust-institutions","D",25],["poland-oecd-score","B",25],["poland-ppk-participation","C",30],["financial-wellbeing-components","B",25],["financial-resilience","C",30],["debt-spiral-cause","B",35],["insurance-purpose","B",25],["joint-finances","B",20],["teaching-kids-money","C",20],["nbp-inflation-target","B",30],["inflation-target-why","B",30],["monetary-policy-tool","B",25],["rates-and-borrowing","B",25],["gdp-definition","B",25],["deflation-risk","B",30],["zero-based-budget","B",25],["track-before-budget","B",20],["sinking-fund","B",25],["impulse-pause","B",20],["emergency-first-milestone","B",25],["bfg-guarantee","B",30],["asset-allocation","B",25],["rebalancing","B",25],["fees-ter","B",30],["risk-return","A",25],["invest-prerequisites","B",30],["speculative-allocation","B",25],["ike-vs-ikze","B",35],["ppk-employer-match","B",30],["ppk-state-bonus","B",25],["deposit-guarantee-scope","B",30],["fdic-coverage","B",25],["eu-dgs","B",25],["us-401k-match","B",30],["tax-advantaged-wrapper","B",30],["rbi-inflation-target","A",25],["c1","B",50],["c2","C",50],["c3","B",50],["c4","C",50],["c5","D",50],["c6","B",50],["c7","C",50],["c8","B",50],["c9","C",50],["c10","C",50],["c11","B",50],["c12","C",50],["c13","B",50],["c14","B",50],["c15","C",50],["c16","D",50],["c17","B",50],["c18","C",50],["c19","B",50],["c20","C",50]];
const PL_OVERRIDE_SHA = "1df34fe444f781525681b8f8b73543de176533be16e49ae5e4956342ff1e0b19";
const SOURCES = {"data/quizQuestions.ts":"35348f66be5023d2b59e2bfed697147ef6912147e17c1e347a61eba8b600f4fd","data/challengeQuestions.ts":"607e51529075bae871590f8b53cf01032b251aa7a2440bf78cdcf5714b9ef4f3"};
const normalized = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

describe("PR19 independent main integration preservation", () => {
  it("keeps unique PL override properties and every reviewed PR19 PL record literal", () => {
    const source = ts.createSourceFile("allQuestions.ts", normalized("lib/allQuestions.ts"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const declarations: ts.VariableDeclaration[] = [];
    const visit = (node: ts.Node) => { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "plQuestionOverrides") declarations.push(node); ts.forEachChild(node, visit); };
    visit(source); expect(declarations).toHaveLength(1);
    const object = declarations[0].initializer; expect(object && ts.isObjectLiteralExpression(object)).toBe(true);
    if (!object || !ts.isObjectLiteralExpression(object)) throw Error("PL overrides must remain an object literal");
    const names = object.properties.map(property => {
      if (!ts.isPropertyAssignment(property)) throw Error("Unreviewed override spread or method");
      return ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(source);
    });
    expect(new Set(names).size).toBe(names.length);
    expect(digest(object.getText(source))).toBe(PL_OVERRIDE_SHA);
    for (const [path, expected] of Object.entries(SOURCES)) expect(digest(normalized(path))).toBe(expected);
  });
  for (const locale of ["pl", "en"] as const) it(`preserves all82 ordered IDs, keys and rewards in ${locale}`, () => {
    const bank = getAllQuestions(locale);
    console.log("RELEASE_INTEGRATION_BANK " + JSON.stringify({ locale, tuples: bank.map(q => [q.id, q.correctAnswer, q.reward]) }));
    expect(bank).toHaveLength(82); expect(new Set(bank.map(question => question.id)).size).toBe(82);
    expect(bank.map(question => [question.id, question.correctAnswer, question.reward])).toEqual(EXPECTED);
    for (const question of bank) { expect(question.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]); expect(question.answers.some(answer => answer.id === question.correctAnswer)).toBe(true); }
  });
  it("keeps the incoming deck fallback for a question outside the lesson quiz", () => {
    const question = getAllQuestions("es").find(question => question.id === "net-worth")!;
    const incoming = deckOverrides.es?.["net-worth"];
    expect(incoming).toBeDefined(); expect(question.question).toBe(incoming!.question);
    expect(question.answers).toEqual(incoming!.answers); expect(question.explanation).toBe(incoming!.explanation);
    expect([question.id, question.correctAnswer, question.reward]).toEqual(["net-worth", "B", 25]);
  });
});
