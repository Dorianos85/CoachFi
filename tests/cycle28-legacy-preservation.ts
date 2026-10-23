import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle27-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle27-legacy-preservation";

const IDS = ["c1", "c2", "c3", "c4", "c5", "c6"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C28 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C28 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-28/content-author-inventory.json", "c7ae5e3870e9a1374a5fa6873353777ab642755c74d500367ed4a1eaa8344d84") as {
  oldCanonicalByLocale: Record<Locale, UnifiedQuestion[]>;
};
const changes = artifact("evidence/cycle-28/content-author-source-change.json", "7a2100c30f15cbf24e6623a8f2bc62541b9169780c2c0b0de68e6574086de947") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{
    id: string; kind: string; before: string; after: string; beforeSha256: string; afterSha256: string;
  }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C28 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", UnifiedQuestion> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C28 archived target object changed");
}

/** Restore the six approved existing objects in each source before immutable historical helpers. */
export function restorePreC28Source(file: string, source: string): string {
  const preserved = changes.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const nodes: Array<{ id: string; start: number; end: number }> = [];
  const record = (id: string, node: ts.Node) => nodes.push({ id, start: node.getStart(tree), end: node.end });
  function visit(node: ts.Node) {
    if (file === "data/challengeQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDS.includes(id.initializer.text)) record(id.initializer.text, node);
    }
    if (file === "lib/allQuestions.ts" && ts.isVariableDeclaration(node) && node.name.getText(tree) === "plQuestionOverrides") {
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error("C28 PL map shape changed");
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && IDS.includes(name(property.name))) record(name(property.name), property.initializer);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (nodes.length !== IDS.length || preserved.nodes.length !== IDS.length || new Set(nodes.map(node => node.id)).size !== IDS.length) throw new Error("C28 existing target object count changed");
  for (const node of nodes.sort((left, right) => right.start - left.start)) {
    const operation = required(preserved.nodes.find(operation => operation.id === node.id), `${file} ${node.id}`);
    const kind = file === "data/challengeQuestions.ts" ? "REPLACE_EXISTING_EN_CHALLENGE_OBJECT" : "REPLACE_EXISTING_PL_VALUE_OBJECT";
    if (operation.kind !== kind) throw new Error("C28 existing-object operation kind changed");
    const raw = source.slice(node.start, node.end);
    if (raw !== operation.before && raw !== operation.after) throw new Error(`C28 unexpected target source mutation: ${file} ${node.id}`);
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
export function restorePreC28UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  // Seven explicit translations remain current and visible; C28 projects PL/EN only.
  if (locale !== "pl" && locale !== "en") return Array.from(records);
  const originals = required(inventory.oldCanonicalByLocale[locale], `locale ${locale}`);
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(originals.find(question => question.id === record.id), `${locale} ${record.id}`);
    const draft = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy[locale];
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward || record.category !== old.category) throw new Error("C28 target scoring/category changed");
    const actual = JSON.stringify(copyView(record));
    if (actual === JSON.stringify(copyView(old))) return record;
    if (actual !== JSON.stringify(copyView(draft))) throw new Error("C28 target copy differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C28 target answer IDs changed");
      return { ...answer, text: historical.text };
    });
    return { ...record, ...copyView(old), answers }; // Unknown record/answer fields remain visible.
  });
}

// No C28 quiz-bank, stage or plain-pool mutation: delegate those historical aliases literally.
export const restorePreC27Source = (file: string, source: string) => previous.restorePreC27Source(file, restorePreC28Source(file, source));
export const restorePreC27UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC27UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC26Source = (file: string, source: string) => previous.restorePreC26Source(file, restorePreC28Source(file, source));
export const restorePreC26EnglishRecords = previous.restorePreC26EnglishRecords;
export const restorePreC26UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC26UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC25Source = (file: string, source: string) => previous.restorePreC25Source(file, restorePreC28Source(file, source));
export const restorePreC25EnglishRecords = previous.restorePreC25EnglishRecords;
export const restorePreC25UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC25UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC25StageLessons = previous.restorePreC25StageLessons;
export const restorePreC24Source = (file: string, source: string) => previous.restorePreC24Source(file, restorePreC28Source(file, source));
export const restorePreC24EnglishRecords = previous.restorePreC24EnglishRecords;
export const restorePreC24UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC24UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC24StageLessons = previous.restorePreC24StageLessons;
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC28Source(file, source));
export const restorePreC23EnglishRecords = previous.restorePreC23EnglishRecords;
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC28Source(file, source));
export const restorePreC17EnglishRecords = previous.restorePreC17EnglishRecords;
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC28Source(file, source));
export const restorePreC16EnglishRecords = previous.restorePreC16EnglishRecords;
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC28Source(file, source));
export const restorePreC15EnglishRecords = previous.restorePreC15EnglishRecords;
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC28UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
