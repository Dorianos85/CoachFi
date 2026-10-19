import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { StageLesson, StageLessonStep } from "@/data/stageLessons";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";

const IDs = ["inflation-basics", "real-return", "rule-of-72", "inflation-hedge"];
const BEFORE_HASH = "0aa31a3fc3fff243df1868c02c37a2cce165adee1c163d67e238c76b0770546c";
const RUNTIME_HASH = "72601434c7cac887eb69f29288e8b5148ccd437c1cc32549b3cb3702ef8f7572";
function checkedArtifact(path: string, expected: string) {
  const raw = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  if (createHash("sha256").update(raw).digest("hex") !== expected) throw new Error(`C15 preserved artifact changed: ${path}`);
  return JSON.parse(raw);
}
const preserved = checkedArtifact("evidence/cycle-15/content-author-before-source.json", BEFORE_HASH) as {
  sources: Record<string, { source: string; sha256: string }>;
};
const runtime = checkedArtifact("evidence/cycle-15/content-author-non-target-baseline.json", RUNTIME_HASH) as {
  targetQuestions: QuizQuestion[];
  targetStages: Record<"en" | "pl", StageLessonStep[]>;
  targetUnifiedByLocale: Record<Locale, UnifiedQuestion[]>;
  targetPlainByLocale: Record<Locale, QuizQuestion[]>;
};
for (const entry of Object.values(preserved.sources)) {
  if (createHash("sha256").update(entry.source).digest("hex") !== entry.sha256) throw new Error("C15 preserved source hash mismatch");
}
function allowedBlocks(file: string, source: string) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const result: Array<{ id: string; start: number; end: number }> = [];
  const name = (node: ts.PropertyName) => ts.isStringLiteral(node) || ts.isIdentifier(node) ? node.text : "";
  const record = (node: ts.Node, id: string) => result.push({ id, start: node.getStart(tree), end: node.end });
  function visit(node: ts.Node) {
    if (file === "data/quizQuestions.ts" && ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(property => ts.isPropertyAssignment(property) && name(property.name) === "id");
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer) && IDs.includes(id.initializer.text)) record(node, id.initializer.text);
    }
    if (file === "lib/allQuestions.ts" && ts.isPropertyAssignment(node) && IDs.includes(name(node.name))) record(node.initializer, name(node.name));
    if (file === "data/stageLessons.ts" && ts.isPropertyAssignment(node) && name(node.name) === "inflation" && ts.isCallExpression(node.initializer)) {
      const steps = node.initializer.arguments[1];
      if (ts.isObjectLiteralExpression(steps)) for (const entry of steps.properties) {
        if (ts.isPropertyAssignment(entry) && ["en", "pl"].includes(name(entry.name))) record(entry.initializer, name(entry.name));
      }
    }
    if (file === "lib/localizedQuiz.ts" && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ["en", "pl"].includes(node.name.text) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) record(node.initializer.elements[0], node.name.text);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return result.sort((left, right) => left.start - right.start);
}

/** Historical checks restore only C15's authorized spans; their original expectations remain intact. */
export function restorePreC15Source(file: string, source: string): string {
  const before = preserved.sources[file];
  if (!before) return source;
  const old = allowedBlocks(file, before.source), current = allowedBlocks(file, source);
  const count = file === "data/stageLessons.ts" || file === "lib/localizedQuiz.ts" ? 2 : 4;
  if (old.length !== count || current.length !== count || new Set(current.map(block => block.id)).size !== count ||
    current.some(block => !old.some(original => original.id === block.id))) throw new Error(`C15 allowed block shape changed: ${file}`);
  for (const block of [...current].reverse()) {
    const original = old.find(item => item.id === block.id)!;
    source = source.slice(0, block.start) + before.source.slice(original.start, original.end) + source.slice(block.end);
  }
  return source;
}
export function restorePreC15EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  return records.map(record => IDs.includes(record.id) ? runtime.targetQuestions.find(original => original.id === record.id)! : record);
}
export function restorePreC15UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  return records.map(record => IDs.includes(record.id) ? runtime.targetUnifiedByLocale[locale].find(original => original.id === record.id)! : record);
}
export function restorePreC15PlainRecords(records: readonly QuizQuestion[], locale: Locale): QuizQuestion[] {
  return records.map(record => (locale === "en" || locale === "pl") && record.id === "inflation-basics"
    ? runtime.targetPlainByLocale[locale].find(original => original.id === record.id)! : record);
}
export function restorePreC15StageLessons(lessons: Record<string, StageLesson>): Record<string, StageLesson> {
  const inflation = lessons.inflation;
  return { ...lessons, inflation: { ...inflation, copy: { ...inflation.copy,
    en: { ...inflation.copy.en, steps: runtime.targetStages.en },
    pl: { ...inflation.copy.pl!, steps: runtime.targetStages.pl },
  } } };
}
