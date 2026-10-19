import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle30-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle30-legacy-preservation";

const IDS = ["poland-trust-institutions", "poland-oecd-score", "poland-ppk-participation", "financial-wellbeing-components", "financial-resilience", "debt-spiral-cause"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C31 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C31 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-31/content-author-inventory.json", "69bf46b05c81fdb8df2728c70cbf06f4e8b31d9a7388dd0d3d7752326175e4f9") as {
  oldCanonicalByLocale: Record<Locale, UnifiedQuestion[]>;
  oldEnglishRecords: QuizQuestion[];
};
const changes = artifact("evidence/cycle-31/content-author-source-change.json", "95fc610b605680eb3a0988dd79c04789c8ca5ef4bb19e2b862fbd94896dd812e") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{
    id: string; kind: string; before: string; after: string; beforeSha256: string; afterSha256: string;
  }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C31 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", QuizQuestion> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C31 archived target object changed");
}

/** Restore six raw EN quiz objects and remove only six exact new PL properties. */
export function restorePreC31Source(file: string, source: string): string {
  const preserved = changes.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  if (preserved.nodes.length !== IDS.length || new Set(preserved.nodes.map(node => node.id)).size !== IDS.length || preserved.nodes.some(node => !IDS.includes(node.id))) throw new Error("C31 archived operation count changed");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const nodes: Array<{ id: string; start: number; end: number }> = [];
  const record = (id: string, node: ts.Node, wholeProperty = false) => nodes.push({
    id, start: node.getStart(tree) - (wholeProperty ? 2 : 0), end: node.end + (wholeProperty ? 3 : 0),
  });
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDS.includes(id.initializer.text)) record(id.initializer.text, node);
    }
    if (file === "lib/allQuestions.ts" && ts.isVariableDeclaration(node) && node.name.getText(tree) === "plQuestionOverrides") {
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error("C31 PL map shape changed");
      for (const property of node.initializer.properties) {
        if (property.name && IDS.includes(name(property.name))) record(name(property.name), property, true);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (file === "lib/allQuestions.ts") {
    if (preserved.nodes.some(operation => operation.kind !== "INSERT_NEW_PL_PROPERTY_WITH_COMMA_AND_CRLF" || operation.before !== "")) throw new Error("C31 new PL insertion contract changed");
    if (nodes.length === 0) return source; // All six own PL properties were genuinely absent before C31.
    if (nodes.length !== IDS.length || new Set(nodes.map(node => node.id)).size !== IDS.length) throw new Error("C31 partial or duplicate new PL properties");
    for (const node of nodes.sort((left, right) => right.start - left.start)) {
      const operation = required(preserved.nodes.find(operation => operation.id === node.id), `PL property ${node.id}`);
      if (source.slice(node.start, node.end) !== operation.after) throw new Error("C31 unexpected PL property, category, comma or EOL mutation");
      source = source.slice(0, node.start) + source.slice(node.end);
    }
    return source;
  }
  if (nodes.length !== IDS.length || new Set(nodes.map(node => node.id)).size !== IDS.length) throw new Error("C31 EN object count changed");
  for (const node of nodes.sort((left, right) => right.start - left.start)) {
    const operation = required(preserved.nodes.find(operation => operation.id === node.id), `EN object ${node.id}`);
    if (operation.kind !== "REPLACE_EXISTING_EN_QUIZ_OBJECT") throw new Error("C31 EN operation kind changed");
    const raw = source.slice(node.start, node.end);
    if (raw !== operation.before && raw !== operation.after) throw new Error("C31 unexpected EN target source mutation");
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
export function restorePreC31EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(inventory.oldEnglishRecords.find(question => question.id === record.id), `English ${record.id}`);
    const draft = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy.en;
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward) throw new Error("C31 raw quiz scoring changed");
    const actual = JSON.stringify(englishCopyView(record));
    if (actual === JSON.stringify(englishCopyView(old))) return record;
    if (actual !== JSON.stringify(englishCopyView(draft))) throw new Error("C31 raw quiz copy/category differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `English answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C31 raw quiz answer IDs changed");
      return { ...answer, text: historical.text };
    });
    return { ...record, ...englishCopyView(old), answers };
  });
}
export function restorePreC31UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  // PL newly localizes these six IDs; the other eight views have the existing English fallback.
  // Restore only exact approved target copy in all nine views, not arbitrary future translations.
  const originals = required(inventory.oldCanonicalByLocale[locale], `locale ${locale}`);
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(originals.find(question => question.id === record.id), `${locale} ${record.id}`);
    const draftQuiz = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy[locale === "pl" ? "pl" : "en"];
    const draft: UnifiedQuestion = { id: draftQuiz.id, question: draftQuiz.question, answers: draftQuiz.answers,
      correctAnswer: draftQuiz.correctAnswer, reward: draftQuiz.reward, explanation: draftQuiz.retryMessage, category: draftQuiz.category };
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward) throw new Error("C31 target scoring changed");
    const actual = JSON.stringify(copyView(record));
    if (actual === JSON.stringify(copyView(old))) return record;
    if (actual !== JSON.stringify(copyView(draft))) throw new Error("C31 target copy/category differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C31 target answer IDs changed");
      return { ...answer, text: historical.text };
    });
    return { ...record, ...copyView(old), answers }; // Unknown fields remain observable to historical tests.
  });
}

// Every affected English/source/unified alias first projects C31, then delegates immutable C30.
// Stage and plain pools contain none of the six IDs and delegate literally.
export const restorePreC30Source = (file: string, source: string) => previous.restorePreC30Source(file, restorePreC31Source(file, source));
export const restorePreC30EnglishRecords = restorePreC31EnglishRecords;
export const restorePreC30UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC30UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC29Source = (file: string, source: string) => previous.restorePreC29Source(file, restorePreC31Source(file, source));
export const restorePreC29UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC29UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC28Source = (file: string, source: string) => previous.restorePreC28Source(file, restorePreC31Source(file, source));
export const restorePreC28UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC28UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC27Source = (file: string, source: string) => previous.restorePreC27Source(file, restorePreC31Source(file, source));
export const restorePreC27UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC27UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC26Source = (file: string, source: string) => previous.restorePreC26Source(file, restorePreC31Source(file, source));
export const restorePreC26EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC26EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC26UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC26UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC25Source = (file: string, source: string) => previous.restorePreC25Source(file, restorePreC31Source(file, source));
export const restorePreC25EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC25EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC25UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC25UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC25StageLessons = previous.restorePreC25StageLessons;
export const restorePreC24Source = (file: string, source: string) => previous.restorePreC24Source(file, restorePreC31Source(file, source));
export const restorePreC24EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC24EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC24UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC24UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC24StageLessons = previous.restorePreC24StageLessons;
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC31Source(file, source));
export const restorePreC23EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC23EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC31Source(file, source));
export const restorePreC17EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC17EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC31Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC16EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC31Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC15EnglishRecords(restorePreC31EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC31UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
