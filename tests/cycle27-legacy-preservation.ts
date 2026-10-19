import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle26-legacy-preservation";
export { c16AllowedSourceBlocks, c17AllowedSourceBlocks } from "./cycle26-legacy-preservation";

const ID = "c15";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`C27 preserved value missing: ${label}`);
  return value;
}
function artifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (hash(raw) !== expected) throw new Error(`C27 immutable preservation input changed: ${file}`);
  return JSON.parse(raw);
}
const inventory = artifact("evidence/cycle-27/content-author-inventory.json", "80774f48f15889cfb989e59c60c7fe037430fa41366278e1f83b6dde16ad9177") as {
  oldCanonicalByLocale: Record<Locale, UnifiedQuestion>;
};
const changes = artifact("evidence/cycle-27/content-author-source-change.json", "670026f8d16fb7154945721b664d6def095822a704842bd436798e0f6c9195bb") as {
  approvedDraft: { fullSource: string; sha256: string };
  changes: Array<{ path: string; nodes: Array<{
    id: string; kind: string; before: string; after: string; beforeSha256: string; afterSha256: string;
  }> }>;
};
if (hash(changes.approvedDraft.fullSource) !== changes.approvedDraft.sha256) throw new Error("C27 archived draft bytes changed");
const approved = JSON.parse(changes.approvedDraft.fullSource) as {
  questions: Array<{ id: string; copy: Record<"en" | "pl", UnifiedQuestion> }>;
};
for (const file of changes.changes) for (const node of file.nodes) {
  if (hash(node.before) !== node.beforeSha256 || hash(node.after) !== node.afterSha256) throw new Error("C27 archived target span changed");
}

/** Restore only the approved challenge object and newly inserted PL property, before older helpers. */
export function restorePreC27Source(file: string, source: string): string {
  const preserved = changes.changes.find(entry => entry.path === file);
  if (!preserved) return source;
  const operation = required(preserved.nodes[0], `operation ${file}`);
  if (preserved.nodes.length !== 1 || operation.id !== ID) throw new Error("C27 source operation count changed");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const nodes: ts.Node[] = [];
  function visit(node: ts.Node) {
    if (file === "data/challengeQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && id.initializer.text === ID) nodes.push(node);
    }
    if (file === "lib/allQuestions.ts" && ts.isVariableDeclaration(node) && node.name.getText(tree) === "plQuestionOverrides") {
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error("C27 PL map shape changed");
      for (const property of node.initializer.properties) if (property.name && name(property.name) === ID) nodes.push(property);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (file === "lib/allQuestions.ts") {
    if (operation.kind !== "INSERT_NEW_PL_PROPERTY_WITH_COMMA_AND_CRLF" || operation.before !== "") throw new Error("C27 PL insertion contract changed");
    if (nodes.length === 0) return source; // Historical PL genuinely had no own c15 property.
    if (nodes.length !== 1) throw new Error("C27 duplicate PL property");
    const node = required(nodes[0], "PL property"), start = node.getStart(tree) - 2, end = node.end + 3;
    if (source.slice(start, end) !== operation.after) throw new Error("C27 unexpected PL property, comma or EOL mutation");
    return source.slice(0, start) + source.slice(end);
  }
  if (operation.kind !== "REPLACE_EXISTING_EN_CHALLENGE_OBJECT" || nodes.length !== 1) throw new Error("C27 EN challenge count changed");
  const node = required(nodes[0], "EN challenge"), start = node.getStart(tree), end = node.end, raw = source.slice(start, end);
  if (raw !== operation.before && raw !== operation.after) throw new Error("C27 unexpected EN challenge mutation");
  return raw === operation.before ? source : source.slice(0, start) + operation.before + source.slice(end);
}

const copyView = (record: UnifiedQuestion) => ({
  question: record.question,
  answers: record.answers.map(answer => ({ id: answer.id, text: answer.text })),
  explanation: record.explanation,
  category: record.category,
});
export function restorePreC27UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  // Seven explicit translations are outside C27; never project or hide their current copy.
  if (locale !== "pl" && locale !== "en") return Array.from(records);
  const old = required(inventory.oldCanonicalByLocale[locale], `locale ${locale}`);
  const draft = required(approved.questions.find(question => question.id === ID), "draft").copy[locale];
  return records.map(record => {
    if (record.id !== ID) return record;
    if (record.correctAnswer !== old.correctAnswer || record.reward !== old.reward) throw new Error("C27 target scoring changed");
    const actual = JSON.stringify(copyView(record));
    if (actual === JSON.stringify(copyView(old))) return record;
    if (actual !== JSON.stringify(copyView(draft))) throw new Error("C27 target copy or category differs from approved or historical copy");
    const answers = record.answers.map((answer, index) => {
      const historical = required(old.answers[index], `answer ${index}`);
      if (historical.id !== answer.id) throw new Error("C27 target answer IDs changed");
      return { ...answer, text: historical.text };
    });
    // Preserve unknown fields on records and answers, rather than replacing whole objects.
    return { ...record, ...copyView(old), answers };
  });
}

// C27 changes no quiz-bank, stage or plain-pool record; those aliases delegate literally.
export const restorePreC26Source = (file: string, source: string) => previous.restorePreC26Source(file, restorePreC27Source(file, source));
export const restorePreC26EnglishRecords = previous.restorePreC26EnglishRecords;
export const restorePreC26UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC26UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC25Source = (file: string, source: string) => previous.restorePreC25Source(file, restorePreC27Source(file, source));
export const restorePreC25EnglishRecords = previous.restorePreC25EnglishRecords;
export const restorePreC25UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC25UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC25StageLessons = previous.restorePreC25StageLessons;
export const restorePreC24Source = (file: string, source: string) => previous.restorePreC24Source(file, restorePreC27Source(file, source));
export const restorePreC24EnglishRecords = previous.restorePreC24EnglishRecords;
export const restorePreC24UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC24UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC24StageLessons = previous.restorePreC24StageLessons;
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, restorePreC27Source(file, source));
export const restorePreC23EnglishRecords = previous.restorePreC23EnglishRecords;
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, restorePreC27Source(file, source));
export const restorePreC17EnglishRecords = previous.restorePreC17EnglishRecords;
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC17PlainRecords = previous.restorePreC17PlainRecords;
export const restorePreC17StageLessons = previous.restorePreC17StageLessons;
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, restorePreC27Source(file, source));
export const restorePreC16EnglishRecords = previous.restorePreC16EnglishRecords;
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = previous.restorePreC16PlainRecords;
export const restorePreC16StageLessons = previous.restorePreC16StageLessons;
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, restorePreC27Source(file, source));
export const restorePreC15EnglishRecords = previous.restorePreC15EnglishRecords;
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(restorePreC27UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = previous.restorePreC15PlainRecords;
export const restorePreC15StageLessons = previous.restorePreC15StageLessons;
