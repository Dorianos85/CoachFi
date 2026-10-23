import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle25-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle25-legacy-preservation";

const ID = "poland-compound-gap";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C26 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C26 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-26/content-author-inventory.json", "7250c31fc6f83a967b953398588059eb8fd289e9dc978a413c546c29fbe024ad") as {
  oldEnglish: QuizQuestion;
  oldCanonicalByLocale: Record<Locale, UnifiedQuestion>;
};
const changes = artifact("evidence/cycle-26/content-author-source-change.json", "0e33c62aa0b63b92bf85808595efa43026f8d5888e97fd6463dbc76b0454e92a") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{
    id: string; kind: string; before: string; after: string; beforeSha256: string; afterSha256: string;
  }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C26 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", QuizQuestion> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C26 archived target span changed");
}

/** Project only C26's approved EN object and NEW PL property before immutable historical helpers. */
export function restorePreC26Source(file: string, source: string): string {
  const preserved = changes.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  const operation = required(preserved.nodes[0], `operation ${file}`);
  if (preserved.nodes.length !== 1 || operation.id !== ID) throw new Error("C26 source operation count changed");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const nodes: ts.Node[] = [];
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && id.initializer.text === ID) nodes.push(node);
    }
    if (file === "lib/allQuestions.ts" && ts.isVariableDeclaration(node) && node.name.getText(tree) === "plQuestionOverrides") {
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error("C26 PL map shape changed");
      for (const property of node.initializer.properties) {
        if (property.name && name(property.name) === ID) nodes.push(property);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (file === "lib/allQuestions.ts") {
    if (operation.kind !== "INSERT_NEW_PL_PROPERTY_WITH_COMMA_AND_CRLF" || operation.before !== "") throw new Error("C26 PL insertion contract changed");
    if (nodes.length === 0) return source; // The actual historical state had no own PL property.
    if (nodes.length !== 1) throw new Error("C26 duplicate PL property");
    const node = required(nodes[0], "PL property");
    const start = node.getStart(tree) - 2, end = node.end + 3;
    const raw = source.slice(start, end);
    if (raw !== operation.after) throw new Error("C26 unexpected PL property, comma or EOL mutation");
    return source.slice(0, start) + source.slice(end);
  }
  if (operation.kind !== "REPLACE_EXISTING_EN_OBJECT" || nodes.length !== 1) throw new Error("C26 EN target source count changed");
  const node = required(nodes[0], "EN object"), start = node.getStart(tree), end = node.end;
  const raw = source.slice(start, end);
  if (raw !== operation.before && raw !== operation.after) throw new Error("C26 unexpected EN target mutation");
  return raw === operation.before ? source : source.slice(0, start) + operation.before + source.slice(end);
}

type RecordCopy = Pick<QuizQuestion, "question" | "answers" | "category"> & Partial<Pick<QuizQuestion, "successMessage" | "retryMessage">> & { explanation?: string };
const copyView = (record: RecordCopy, unified: boolean) => ({
  question: record.question,
  answers: record.answers.map(answer => ({ id: answer.id, text: answer.text })),
  category: record.category,
  ...(unified ? { explanation: record.explanation } : { successMessage: record.successMessage, retryMessage: record.retryMessage }),
});
function restoreCopy<T extends QuizQuestion | UnifiedQuestion>(record: T, old: T, expected: RecordCopy, unified: boolean): T {
  if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward) throw new Error("C26 target scoring changed");
  const actual = JSON.stringify(copyView(record, unified));
  if (actual === JSON.stringify(copyView(old, unified))) return record;
  if (actual !== JSON.stringify(copyView(expected, unified))) throw new Error("C26 target copy or category differs from approved or historical copy");
  const answers = record.answers.map((answer, index) => {
    const historical = required(old.answers[index], `answer ${index}`);
    if (historical.id !== answer.id) throw new Error("C26 target answer IDs changed");
    return { ...answer, text: historical.text };
  });
  // Only approved copy/category changes are projected; unknown fields stay visible to old oracles.
  return { ...record, ...copyView(old, unified), answers } as T;
}
export function restorePreC26EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  const draft = required(approved.questions.find(question => question.id === ID), "draft").copy.en;
  return records.map(record => record.id === ID ? restoreCopy(record, inventory.oldEnglish, draft, false) : record);
}
export function restorePreC26UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  const old = required(inventory.oldCanonicalByLocale[locale], `locale ${locale}`);
  const draft = required(approved.questions.find(question => question.id === ID), "draft").copy[locale === "pl" ? "pl" : "en"];
  return records.map(record => record.id === ID ? restoreCopy(record, old, {
    question: draft.question, answers: draft.answers, category: draft.category, explanation: draft.retryMessage,
  }, true) : record);
}

// Keep historical setup names and stage/plain aliases; C26 changes no stage or plain-pool records.
export const restorePreC25Source = (file: string, source: string) => previous.restorePreC25Source(file, restorePreC26Source(file, source));
export const restorePreC25EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC25EnglishRecords(restorePreC26EnglishRecords(records));
export const restorePreC25UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC25UnifiedRecords(restorePreC26UnifiedRecords(records, locale), locale);
export const restorePreC25StageLessons = previous.restorePreC25StageLessons;
export const restorePreC24Source = (file: string, source: string) => previous.restorePreC24Source(file, restorePreC26Source(file, source));
export const restorePreC24EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC24EnglishRecords(restorePreC26EnglishRecords(records));
export const restorePreC24UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC24UnifiedRecords(restorePreC26UnifiedRecords(records, locale), locale);
export const restorePreC24StageLessons = previous.restorePreC24StageLessons;
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC26Source(file, source));
export const restorePreC23EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC23EnglishRecords(restorePreC26EnglishRecords(records));
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC26UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC26Source(file, source));
export const restorePreC17EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC17EnglishRecords(restorePreC26EnglishRecords(records));
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC26UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC26Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC16EnglishRecords(restorePreC26EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC26UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC26Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC15EnglishRecords(restorePreC26EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC26UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
