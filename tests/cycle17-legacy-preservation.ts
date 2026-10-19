import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { StageLesson, StageLessonStep } from "@/data/stageLessons";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import {
  restorePreC15Source as earlierSource, restorePreC15EnglishRecords as earlierEnglish,
  restorePreC15UnifiedRecords as earlierUnified, restorePreC15PlainRecords as earlierPlain,
  restorePreC15StageLessons as earlierLessons,
  restorePreC16Source as previousSource, restorePreC16EnglishRecords as previousEnglish,
  restorePreC16UnifiedRecords as previousUnified, restorePreC16PlainRecords as previousPlain,
  restorePreC16StageLessons as previousLessons,
} from "./cycle16-legacy-preservation";
export { c16AllowedSourceBlocks } from "./cycle16-legacy-preservation";

const IDs = ["emergency-fund", "emergency-fund-characteristics", "emergency-fund-start"];
const FILES = ["data/stageLessons.ts", "data/quizQuestions.ts", "lib/allQuestions.ts", "lib/localizedQuiz.ts"];
const BEFORE_HASH = "a4d0e78d3d57ef76901fab69f264316e46693df3fb7731acc3cbdebfc17f1eb7";
const RUNTIME_HASH = "fcd81f4b2e2348d732122edc4152d34419c2fdb1781ab6902f17201754c04f16";
function checkedArtifact(file: string, expected: string): unknown {
  const raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (createHash("sha256").update(raw).digest("hex") !== expected) throw new Error(`C17 preserved artifact changed: ${file}`);
  return JSON.parse(raw);
}
const preserved = checkedArtifact("evidence/cycle-17/content-author-before-source.json", BEFORE_HASH) as {
  sources: Record<string, { source: string; sha256: string }>;
};
const runtime = checkedArtifact("evidence/cycle-17/content-author-non-target-baseline.json", RUNTIME_HASH) as {
  targetQuestions: QuizQuestion[];
  targetStages: Record<"en" | "pl", StageLessonStep[]>;
  targetUnifiedByLocale: Record<Locale, UnifiedQuestion[]>;
  targetPlainByLocale: Record<Locale, QuizQuestion[]>;
};
function required<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new Error(`C17 missing historical value: ${context}`);
  return value;
}
for (const entry of Object.values(preserved.sources)) {
  if (createHash("sha256").update(entry.source).digest("hex") !== entry.sha256) throw new Error("C17 preserved source hash mismatch");
}

export function c17AllowedSourceBlocks(file: string, source: string) {
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
    if (file === "data/stageLessons.ts" && ts.isPropertyAssignment(node) && name(node.name) === "emergency-fund" && ts.isCallExpression(node.initializer)) {
      const steps = node.initializer.arguments[1];
      if (steps && ts.isObjectLiteralExpression(steps)) for (const entry of steps.properties) {
        if (ts.isPropertyAssignment(entry) && ["en", "pl"].includes(name(entry.name))) record(entry.initializer, name(entry.name));
      }
    }
    if (file === "lib/localizedQuiz.ts" && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ["en", "pl"].includes(node.name.text) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      record(required(node.initializer.elements[1], `plain ${node.name.text} index1`), node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return result.sort((left, right) => left.start - right.start);
}

/** Restore only the approved C17 spans to immutable pre-C17 bytes, before earlier cycle adapters. */
export function restorePreC17Source(file: string, source: string): string {
  if (!FILES.includes(file)) return source;
  const before = required(preserved.sources[file], file);
  const old = c17AllowedSourceBlocks(file, before.source), current = c17AllowedSourceBlocks(file, source);
  const count = file === "data/stageLessons.ts" || file === "lib/localizedQuiz.ts" ? 2 : 3;
  if (old.length !== count || current.length !== count || new Set(current.map(block => block.id)).size !== count ||
    current.some(block => !old.some(original => original.id === block.id))) throw new Error(`C17 allowed block shape changed: ${file}`);
  for (const block of [...current].reverse()) {
    const original = required(old.find(item => item.id === block.id), `source ${file} ${block.id}`);
    source = source.slice(0, block.start) + before.source.slice(original.start, original.end) + source.slice(block.end);
  }
  return source;
}
export function restorePreC17EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  return records.map(record => IDs.includes(record.id)
    ? required(runtime.targetQuestions.find(original => original.id === record.id), record.id) : record);
}
export function restorePreC17UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  const originals = required(runtime.targetUnifiedByLocale[locale], `canonical locale ${locale}`);
  return records.map(record => IDs.includes(record.id)
    ? required(originals.find(original => original.id === record.id), `${locale} ${record.id}`) : record);
}
export function restorePreC17PlainRecords(records: readonly QuizQuestion[], locale: Locale): QuizQuestion[] {
  if (locale !== "en" && locale !== "pl") return [...records];
  return records.map(record => record.id === "emergency-fund"
    ? required(runtime.targetPlainByLocale[locale].find(original => original.id === record.id), `plain ${locale}`) : record);
}
export function restorePreC17StageLessons(lessons: Record<string, StageLesson>): Record<string, StageLesson> {
  const emergency = required(lessons["emergency-fund"], "emergency lesson");
  const en = required(emergency.copy.en, "emergency en"), pl = required(emergency.copy.pl, "emergency pl");
  return { ...lessons, "emergency-fund": { ...emergency, copy: { ...emergency.copy,
    en: { ...en, steps: runtime.targetStages.en }, pl: { ...pl, steps: runtime.targetStages.pl },
  } } };
}

// Preserve historical call sites: restore C17 before C16, then earlier C15/C11 projections.
export const restorePreC16Source = (file: string, source: string) => previousSource(file, restorePreC17Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previousEnglish(restorePreC17EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previousUnified(restorePreC17UnifiedRecords(records, locale), locale);
export const restorePreC16PlainRecords = (records: readonly QuizQuestion[], locale: Locale) => previousPlain(restorePreC17PlainRecords(records, locale), locale);
export const restorePreC16StageLessons = (lessons: Record<string, StageLesson>) => previousLessons(restorePreC17StageLessons(lessons));
export const restorePreC15Source = (file: string, source: string) => earlierSource(file, restorePreC17Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => earlierEnglish(restorePreC17EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => earlierUnified(restorePreC17UnifiedRecords(records, locale), locale);
export const restorePreC15PlainRecords = (records: readonly QuizQuestion[], locale: Locale) => earlierPlain(restorePreC17PlainRecords(records, locale), locale);
export const restorePreC15StageLessons = (lessons: Record<string, StageLesson>) => earlierLessons(restorePreC17StageLessons(lessons));
