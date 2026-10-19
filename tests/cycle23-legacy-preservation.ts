import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle17-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle17-legacy-preservation";

const ID = "emergency-first-milestone";
const INVENTORY_HASH = "b1d559d029ad3f12baf495c6a4723a2ea16858301de06707c2df2bd7fbdc0eb5";
const CHANGE_HASH = "20e3f77ac4d8c330daf5f4b9e18be6037f9b32288f9781f6e30028e45e319e9c";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C23 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-23/content-author-inventory.json", INVENTORY_HASH) as {
  targetEnglish: QuizQuestion;
  targetUnifiedByLocale: Record<Locale, UnifiedQuestion>;
};
const change = artifact("evidence/cycle-23/content-author-source-change.json", CHANGE_HASH) as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; node: { before: string; after: string; beforeSha256: string; afterSha256: string } }>;
};
if (hash(change.approvedDraft.fullSource) !== change.approvedDraft.sha256) throw new Error("C23 archived draft bytes changed");
const approved = JSON.parse(change.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"pl" | "en", QuizQuestion> }>;
};
const proposal = approved.questions.find(question => question.id === ID);
if (!proposal) throw new Error("C23 approved target missing");
const copies = proposal.copy;
for (const entry of change.changes) {
  if (hash(entry.node.before) !== entry.node.beforeSha256 || hash(entry.node.after) !== entry.node.afterSha256) {
    throw new Error("C23 archived target node changed");
  }
}

/** The old assertions see a historical copy projection; current C23 content is checked independently. */
export function restorePreC23Source(file: string, source: string): string {
  const preserved = change.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const nodes: ts.Node[] = [];
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node) && node.properties.some(property =>
      ts.isPropertyAssignment(property) && name(property.name) === "id" &&
      ts.isStringLiteral(property.initializer) && property.initializer.text === ID)) nodes.push(node);
    if (file === "lib/allQuestions.ts" && ts.isPropertyAssignment(node) && name(node.name) === ID) nodes.push(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  const target = nodes[0];
  if (nodes.length !== 1 || !target) throw new Error(`C23 target source shape changed: ${file}`);
  const start = target.getStart(tree), raw = source.slice(start, target.end);
  if (raw !== preserved.node.before && raw !== preserved.node.after) throw new Error(`C23 unexpected target source mutation: ${file}`);
  return raw === preserved.node.before ? source : source.slice(0, start) + preserved.node.before + source.slice(target.end);
}

type RecordCopy = Pick<QuizQuestion, "question" | "answers"> & Partial<Pick<QuizQuestion, "successMessage" | "retryMessage">> & { explanation?: string };
function copyView(record: RecordCopy, unified: boolean) {
  return {
    question: record.question,
    answers: record.answers.map(answer => ({ id: answer.id, text: answer.text })),
    ...(unified ? { explanation: record.explanation } : { successMessage: record.successMessage, retryMessage: record.retryMessage }),
  };
}
function restoreCopy<T extends QuizQuestion | UnifiedQuestion>(record: T, old: T, expected: RecordCopy, unified: boolean): T {
  if (record.id !== ID) return record;
  // Never conceal a key, reward, category, answer-ID, or unexpected future copy change.
  if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward || record.category !== old.category) {
    throw new Error("C23 target scoring/category changed outside the approved copy update");
  }
  const actual = JSON.stringify(copyView(record, unified)), historical = JSON.stringify(copyView(old, unified));
  if (actual === historical) return record;
  if (actual !== JSON.stringify(copyView(expected, unified))) throw new Error("C23 target copy differs from the approved or historical version");
  const answers = record.answers.map((answer, index) => {
    const historicalAnswer = old.answers[index];
    if (!historicalAnswer || answer.id !== historicalAnswer.id) throw new Error("C23 target answer shape changed");
    return { ...answer, text: historicalAnswer.text };
  });
  // Preserve every other field, including any unknown record or answer fields, for old non-target assertions.
  return { ...record, ...copyView(old, unified), answers } as T;
}
export function restorePreC23EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  return records.map(record => record.id === ID ? restoreCopy(record, inventory.targetEnglish, copies.en, false) : record);
}
export function restorePreC23UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  const old = inventory.targetUnifiedByLocale[locale];
  if (!old) throw new Error(`C23 missing historical canonical locale: ${locale}`);
  // ES/FR have explicit, unchanged records; five other locales inherit EN without new localization acceptance.
  const copy = locale === "pl" ? copies.pl : copies.en;
  const expected = locale === "es" || locale === "fr" ? old : { ...old, question: copy.question, answers: copy.answers, explanation: copy.retryMessage };
  return records.map(record => record.id === ID ? restoreCopy(record, old, expected, true) : record);
}

// Compose C23 first; the immutable C17/C16/C15 helpers retain their original scope and literal expectations.
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC23Source(file, source));
export const restorePreC17EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC17EnglishRecords(restorePreC23EnglishRecords(records));
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC23UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC23Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC16EnglishRecords(restorePreC23EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC23UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC23Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC15EnglishRecords(restorePreC23EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC23UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
