import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle28-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle28-legacy-preservation";

const IDS = ["c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C29 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C29 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-29/content-author-inventory.json", "d1631fdc064e63c697687c4bd6615f6c9ddd90b0141483fe4a012c73df529bf2") as {
  oldCanonicalByLocale: Record<Locale, UnifiedQuestion[]>;
};
const changes = artifact("evidence/cycle-29/content-author-source-change.json", "eb64fb99c1ea3573e7ce24bc1738e0bba16ddf048cf1e26ef03532b1550042a3") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{
    id: string; kind: string; before: string; after: string; beforeSha256: string; afterSha256: string;
  }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C29 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", UnifiedQuestion> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C29 archived target object changed");
}

/** Restore the eight approved existing objects in each source before immutable historical helpers. */
export function restorePreC29Source(file: string, source: string): string {
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
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error("C29 PL map shape changed");
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && IDS.includes(name(property.name))) record(name(property.name), property.initializer);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (nodes.length !== IDS.length || preserved.nodes.length !== IDS.length || new Set(nodes.map(node => node.id)).size !== IDS.length) throw new Error("C29 existing target object count changed");
  for (const node of nodes.sort((left, right) => right.start - left.start)) {
    const operation = required(preserved.nodes.find(operation => operation.id === node.id), `${file} ${node.id}`);
    const kind = file === "data/challengeQuestions.ts" ? "REPLACE_EXISTING_EN_CHALLENGE_OBJECT" : "REPLACE_EXISTING_PL_VALUE_OBJECT";
    if (operation.kind !== kind) throw new Error("C29 existing-object operation kind changed");
    const raw = source.slice(node.start, node.end);
    if (raw !== operation.before && raw !== operation.after) throw new Error(`C29 unexpected target source mutation: ${file} ${node.id}`);
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
export function restorePreC29UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  // Seven explicit translations remain current and visible; C29 projects PL/EN only.
  if (locale !== "pl" && locale !== "en") return Array.from(records);
  const originals = required(inventory.oldCanonicalByLocale[locale], `locale ${locale}`);
  return records.map(record => {
    if (!IDS.includes(record.id)) return record;
    const old = required(originals.find(question => question.id === record.id), `${locale} ${record.id}`);
    const draft = required(approved.questions.find(question => question.id === record.id), `draft ${record.id}`).copy[locale];
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward || record.category !== old.category) throw new Error("C29 target scoring/category changed");
    const actual = JSON.stringify(copyView(record));
    if (actual === JSON.stringify(copyView(old))) return record;
    if (actual !== JSON.stringify(copyView(draft))) throw new Error("C29 target copy differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C29 target answer IDs changed");
      return { ...answer, text: historical.text };
    });
    return { ...record, ...copyView(old), answers }; // Unknown record/answer fields remain visible.
  });
}

// No C29 quiz-bank, stage or plain-pool mutation: delegate those historical aliases literally.
export const restorePreC28Source = (file: string, source: string) => previous.restorePreC28Source(file, restorePreC29Source(file, source));
export const restorePreC28UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC28UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC27Source = (file: string, source: string) => previous.restorePreC27Source(file, restorePreC29Source(file, source));
export const restorePreC27UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC27UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC26Source = (file: string, source: string) => previous.restorePreC26Source(file, restorePreC29Source(file, source));
export const restorePreC26EnglishRecords = previous.restorePreC26EnglishRecords;
export const restorePreC26UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC26UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC25Source = (file: string, source: string) => previous.restorePreC25Source(file, restorePreC29Source(file, source));
export const restorePreC25EnglishRecords = previous.restorePreC25EnglishRecords;
export const restorePreC25UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC25UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC25StageLessons = previous.restorePreC25StageLessons;
export const restorePreC24Source = (file: string, source: string) => previous.restorePreC24Source(file, restorePreC29Source(file, source));
export const restorePreC24EnglishRecords = previous.restorePreC24EnglishRecords;
export const restorePreC24UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC24UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC24StageLessons = previous.restorePreC24StageLessons;
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC29Source(file, source));
export const restorePreC23EnglishRecords = previous.restorePreC23EnglishRecords;
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC29Source(file, source));
export const restorePreC17EnglishRecords = previous.restorePreC17EnglishRecords;
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC29Source(file, source));
export const restorePreC16EnglishRecords = previous.restorePreC16EnglishRecords;
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC29Source(file, source));
export const restorePreC15EnglishRecords = previous.restorePreC15EnglishRecords;
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC29UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
