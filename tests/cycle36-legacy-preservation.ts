import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle35-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle35-legacy-preservation";

const IDS = ["ike-vs-ikze","ppk-employer-match","ppk-state-bonus"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C36 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C36 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-36/content-author-inventory.json", "398bff11d9f062c9ce4ee7905b75defc2235c7d060efe98910ae12463f6a0dd8") as {
  oldCanonicalByLocale: Record<Locale, UnifiedQuestion[]>;
  oldEnglishRecords: QuizQuestion[];
};
const changes = artifact("evidence/cycle-36/content-author-source-change.json", "339a85de11413d58955d84afd6e863a7d91648ee4b1ada4070a84a7ee91e1d71") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{
    id: string; kind: string; before: string; after: string; beforeSha256: string; afterSha256: string;
  }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C36 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", QuizQuestion> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C36 archived target object changed");
}

/** Restore only three exact existing EN objects and three existing PL value objects. */
export function restorePreC36Source(file: string, source: string): string {
  const preserved = changes.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  if (preserved.nodes.length !== IDS.length || new Set(preserved.nodes.map(node => node.id)).size !== IDS.length || preserved.nodes.some(node => !IDS.includes(node.id))) throw new Error("C36 archived operation count changed");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const nodes: Array<{ id: string; start: number; end: number }> = [];
  const record = (id: string, node: ts.Node) => nodes.push({ id, start: node.getStart(tree), end: node.end });
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDS.includes(id.initializer.text)) record(id.initializer.text, node);
    }
    if (file === "lib/allQuestions.ts" && ts.isVariableDeclaration(node) && node.name.getText(tree) === "plQuestionOverrides") {
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error("C36 PL map shape changed");
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && IDS.includes(name(property.name))) record(name(property.name), property.initializer);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (nodes.length !== IDS.length || new Set(nodes.map(node => node.id)).size !== IDS.length) throw new Error("C36 existing target object count changed");
  const kind = file === "data/quizQuestions.ts" ? "REPLACE_EXISTING_EN_QUIZ_OBJECT" : "REPLACE_EXISTING_PL_VALUE_OBJECT";
  for (const node of nodes.sort((left, right) => right.start - left.start)) {
    const operation = required(preserved.nodes.find(operation => operation.id === node.id), "source target " + node.id);
    if (operation.kind !== kind) throw new Error("C36 existing-object operation kind changed");
    const raw = source.slice(node.start, node.end);
    if (raw !== operation.before && raw !== operation.after) throw new Error("C36 unexpected target source, scoring or category mutation");
    if (raw !== operation.before) source = source.slice(0, node.start) + operation.before + source.slice(node.end);
  }
  return source;
}

const copyView = (record: UnifiedQuestion) => ({
  question: record.question,
  answers: record.answers.map(answer => ({ id: answer.id, text: answer.text })),
  explanation: record.explanation,
  category: record.category,
});
const englishCopyView = (record: QuizQuestion) => ({
  question: record.question,
  answers: record.answers.map(answer => ({ id: answer.id, text: answer.text })),
  successMessage: record.successMessage,
  retryMessage: record.retryMessage,
  category: record.category,
});
/** Restore only approved raw quiz copy, keeping unknown record and answer fields visible. */
export function restorePreC36EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(inventory.oldEnglishRecords.find(question => question.id === record.id), `English ${record.id}`);
    const draft = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy.en;
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward) throw new Error("C36 raw quiz scoring changed");
    const actual = JSON.stringify(englishCopyView(record));
    if (actual === JSON.stringify(englishCopyView(old))) return record;
    if (actual !== JSON.stringify(englishCopyView(draft))) throw new Error("C36 raw quiz copy/category differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `English answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C36 raw quiz answer IDs changed");
      return { ...answer, text: historical.text };
    });
    return { ...record, ...englishCopyView(old), answers };
  });
}
export function restorePreC36UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  // ES/FR have explicit old translations: pass through every field so future changes remain visible.
  // Only PL, EN and the five existing EN fallback views may project exact approved C36 copy.
  if (locale === "es" || locale === "fr") return Array.from(records);
  const originals = required(inventory.oldCanonicalByLocale[locale], `locale ${locale}`);
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(originals.find(question => question.id === record.id), `${locale} ${record.id}`);
    const draftQuiz = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy[locale === "pl" ? "pl" : "en"];
    const draft: UnifiedQuestion = { id: draftQuiz.id, question: draftQuiz.question, answers: draftQuiz.answers,
      correctAnswer: draftQuiz.correctAnswer, reward: draftQuiz.reward, explanation: draftQuiz.retryMessage, category: draftQuiz.category };
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward) throw new Error("C36 target scoring changed");
    const actual = JSON.stringify(copyView(record));
    if (actual === JSON.stringify(copyView(old))) return record;
    if (actual !== JSON.stringify(copyView(draft))) throw new Error("C36 target copy/category differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C36 target answer IDs changed");
      return { ...answer, text: historical.text };
    });
    return { ...record, ...copyView(old), answers }; // Unknown fields remain observable to historical tests.
  });
}

// Every affected English/source/unified alias projects C36 before immutable C35.
// Stage/plain pools are unchanged; ES/FR explicit copy remains completely unmasked.
export const restorePreC35Source = (file: string, source: string) => previous.restorePreC35Source(file, restorePreC36Source(file, source));
export const restorePreC35EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC35EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC35UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC35UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC34Source = (file: string, source: string) => previous.restorePreC34Source(file, restorePreC36Source(file, source));
export const restorePreC34EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC34EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC34UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC34UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC33Source = (file: string, source: string) => previous.restorePreC33Source(file, restorePreC36Source(file, source));
export const restorePreC33EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC33EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC33UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC33UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC32Source = (file: string, source: string) => previous.restorePreC32Source(file, restorePreC36Source(file, source));
export const restorePreC32EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC32EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC32UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC32UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC31Source = (file: string, source: string) => previous.restorePreC31Source(file, restorePreC36Source(file, source));
export const restorePreC31EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC31EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC31UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC31UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC30Source = (file: string, source: string) => previous.restorePreC30Source(file, restorePreC36Source(file, source));
export const restorePreC30EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC30EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC30UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC30UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC29Source = (file: string, source: string) => previous.restorePreC29Source(file, restorePreC36Source(file, source));
export const restorePreC29UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC29UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC28Source = (file: string, source: string) => previous.restorePreC28Source(file, restorePreC36Source(file, source));
export const restorePreC28UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC28UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC27Source = (file: string, source: string) => previous.restorePreC27Source(file, restorePreC36Source(file, source));
export const restorePreC27UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC27UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC26Source = (file: string, source: string) => previous.restorePreC26Source(file, restorePreC36Source(file, source));
export const restorePreC26EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC26EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC26UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC26UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC25Source = (file: string, source: string) => previous.restorePreC25Source(file, restorePreC36Source(file, source));
export const restorePreC25EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC25EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC25UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC25UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC25StageLessons = previous.restorePreC25StageLessons;
export const restorePreC24Source = (file: string, source: string) => previous.restorePreC24Source(file, restorePreC36Source(file, source));
export const restorePreC24EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC24EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC24UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC24UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC24StageLessons = previous.restorePreC24StageLessons;
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC36Source(file, source));
export const restorePreC23EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC23EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC36Source(file, source));
export const restorePreC17EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC17EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC36Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC16EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC36Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC15EnglishRecords(restorePreC36EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC36UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
