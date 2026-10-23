import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { StageLesson, StageLessonStep } from "@/data/stageLessons";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle23-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle23-legacy-preservation";

const IDS = ["compound-interest", "diversification", "index-fund", "etf-definition", "time-in-market"];
const STAGE = "long-term-investing";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C24 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C24 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-24/content-author-inventory.json", "dd39a4d4ddb0f7a5439abe76ef04954d53cbcfbc39358ab6ff75ea49c06fd292") as {
  targetQuestions: QuizQuestion[];
  targetUnifiedByLocale: Record<Locale, UnifiedQuestion[]>;
  targetSteps: Record<"en" | "pl", StageLessonStep[]>;
};
const changes = artifact("evidence/cycle-24/content-author-source-change.json", "0e0e5574fa9d1a205811418f8d0bc87569178bf86314765fbfff8f097519ca17") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{ id: string; before: string; after: string; beforeSha256: string; afterSha256: string }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C24 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", QuizQuestion> }>;
  steps: Array<{ copy: Record<"en" | "pl", StageLessonStep> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C24 archived target node changed");
}

/** Project only the approved C24 nodes to exact pre-C24 bytes before earlier historical helpers. */
export function restorePreC24Source(file: string, source: string): string {
  const preserved = changes.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const nodes: Array<{ id: string; start: number; end: number }> = [];
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const record = (node: ts.Node, id: string) => nodes.push({ id, start: node.getStart(tree), end: node.end });
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDS.includes(id.initializer.text)) record(node, id.initializer.text);
    }
    if (file === "lib/allQuestions.ts" && ts.isPropertyAssignment(node) && IDS.includes(name(node.name))) record(node.initializer, name(node.name));
    if (file === "data/stageLessons.ts" && ts.isPropertyAssignment(node) && name(node.name) === STAGE && ts.isCallExpression(node.initializer)) {
      const copy = node.initializer.arguments[1];
      if (!copy || !ts.isObjectLiteralExpression(copy)) throw new Error("C24 lesson source shape changed");
      for (const entry of copy.properties) if (ts.isPropertyAssignment(entry) && ["en", "pl"].includes(name(entry.name))) record(entry.initializer, name(entry.name));
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (nodes.length !== preserved.nodes.length || new Set(nodes.map(node => node.id)).size !== nodes.length) throw new Error(`C24 target source count changed: ${file}`);
  for (const node of nodes.sort((left, right) => right.start - left.start)) {
    const original = required(preserved.nodes.find(entry => entry.id === node.id), `${file} ${node.id}`);
    const raw = source.slice(node.start, node.end);
    if (raw !== original.before && raw !== original.after) throw new Error(`C24 unexpected target source mutation: ${file} ${node.id}`);
    if (raw !== original.before) source = source.slice(0, node.start) + original.before + source.slice(node.end);
  }
  return source;
}

type RecordCopy = Pick<QuizQuestion, "question" | "answers"> & Partial<Pick<QuizQuestion, "successMessage" | "retryMessage">> & { explanation?: string };
const copyView = (record: RecordCopy, unified: boolean) => ({
  question: record.question,
  answers: record.answers.map(answer => ({ id: answer.id, text: answer.text })),
  ...(unified ? { explanation: record.explanation } : { successMessage: record.successMessage, retryMessage: record.retryMessage }),
});
function restoreCopy<T extends QuizQuestion | UnifiedQuestion>(record: T, old: T, expected: RecordCopy, unified: boolean): T {
  if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward || record.category !== old.category) throw new Error("C24 target scoring/category changed");
  const actual = JSON.stringify(copyView(record, unified));
  if (actual === JSON.stringify(copyView(old, unified))) return record;
  if (actual !== JSON.stringify(copyView(expected, unified))) throw new Error("C24 target copy differs from approved or historical copy");
  const answers = record.answers.map((answer, index) => {
    const historical = required(old.answers[index], `answer ${index}`);
    if (historical.id !== answer.id) throw new Error("C24 target answer IDs changed");
    return { ...answer, text: historical.text };
  });
  // Keep unknown fields visible to old full-record assertions instead of replacing the whole record.
  return { ...record, ...copyView(old, unified), answers } as T;
}
export function restorePreC24EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(inventory.targetQuestions.find(question => question.id === record.id), record.id);
    const draft = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`);
    return restoreCopy(record, old, draft.copy.en, false);
  });
}
export function restorePreC24UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  const originals = required(inventory.targetUnifiedByLocale[locale], `locale ${locale}`);
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(originals.find(question => question.id === record.id), `${locale} ${record.id}`);
    const draft = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy[locale === "pl" ? "pl" : "en"];
    return restoreCopy(record, old, { question: draft.question, answers: draft.answers, explanation: draft.retryMessage }, true);
  });
}
export function restorePreC24StageLessons(lessons: Record<string, StageLesson>): Record<string, StageLesson> {
  const lesson = required(lessons[STAGE], STAGE);
  const en = required(lesson.copy.en, "lesson en"), pl = required(lesson.copy.pl, "lesson pl");
  function steps(current: StageLessonStep[], locale: "en" | "pl"): StageLessonStep[] {
    const old = inventory.targetSteps[locale], expected = approved.steps.map(step => step.copy[locale]);
    const view = (items: StageLessonStep[]) => JSON.stringify(items.map(step => ({ title: step.title, body: step.body })));
    if (view(current) === view(old)) return current;
    if (view(current) !== view(expected)) throw new Error(`C24 unexpected lesson copy mutation: ${locale}`);
    return current.map((step, index) => ({ ...step, ...required(old[index], `step ${locale} ${index}`) }));
  }
  const enSteps = steps(en.steps, "en"), plSteps = steps(pl.steps, "pl");
  if (enSteps === en.steps && plSteps === pl.steps) return lessons;
  return { ...lessons, [STAGE]: { ...lesson, copy: { ...lesson.copy, en: { ...en, steps: enSteps }, pl: { ...pl, steps: plSteps } } } };
}

// C17 uses these PreC23 names for its existing raw-source and runtime projections.
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC24Source(file, source));
export const restorePreC23EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC23EnglishRecords(restorePreC24EnglishRecords(records));
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC24UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC24Source(file, source));
export const restorePreC17EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC17EnglishRecords(restorePreC24EnglishRecords(records));
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC24UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = (lessons: Record<string, StageLesson>) => previous.restorePreC17StageLessons(restorePreC24StageLessons(lessons));
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC24Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC16EnglishRecords(restorePreC24EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC24UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = (lessons: Record<string, StageLesson>) => previous.restorePreC16StageLessons(restorePreC24StageLessons(lessons));
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC24Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC15EnglishRecords(restorePreC24EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC24UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = (lessons: Record<string, StageLesson>) => previous.restorePreC15StageLessons(restorePreC24StageLessons(lessons));
