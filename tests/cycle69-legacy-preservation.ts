import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";
import type { QuizQuestion } from "@/data/quizQuestions";
import type { UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import * as previous from "./cycle37-legacy-preservation";
export { restorePreC15PlainRecords, restorePreC15StageLessons, restorePreC16PlainRecords, restorePreC16StageLessons } from "./cycle37-legacy-preservation";

// Test-only historical view. Application banks and the C37 chain stay literal.
const IDS = ["us-401k-match", "tax-advantaged-wrapper"] as const;
const LOCALES: Locale[] = ["en", "pl", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
const QUIZ_KEYS = ["id", "question", "answers", "correctAnswer", "reward", "successMessage", "retryMessage", "category"];
const UNIFIED_KEYS = ["id", "question", "answers", "correctAnswer", "explanation", "category", "reward"];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error("C69 strict historical admission: " + label);
}
function pinnedText(path: string, pin: string): string {
  const text = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  check(hash(text) === pin, "immutable artifact " + path); return text;
}
function artifact<T>(path: string, pin: string): T { return JSON.parse(pinnedText(path, pin)) as T; }
type Meta = Pick<UnifiedQuestion, "id" | "correctAnswer" | "reward">;
type Bank = { locale: "pl" | "en"; ids: string[]; metadata: Meta[]; nonTargetRows: UnifiedQuestion[] };
type Change = { path: string; locale: "EN" | "PL"; field: string; oldSpan: string; newSpan: string };
type Source = { path: string; beforeSHA256: string; afterSHA256: string };
type Patch = { cycle: number; sources: Source[]; changes: Change[] };
const patches = [
  artifact<Patch>("evidence/cycle-53/source-change.json", "3cbf4b6cbdaaac64d774619314769ec51df275bb094b7a816eeb0d2f4693c894"),
  artifact<Patch>("evidence/cycle-54/source-change.json", "53a6c2108ed8bcb10852b3710b1be6d53d1bec53a6bb778c152cde935d96a8a2"),
];
check(patches[0]!.cycle === 53 && patches[1]!.cycle === 54, "patch identity");
for (const [index, patch] of patches.entries()) {
  check(patch.sources.length === 2 && new Set(patch.sources.map(row => row.path)).size === 2, "source cardinality");
  for (const locale of ["EN", "PL"] as const) {
    const actual = patch.changes.filter(row => row.locale === locale).map(row => row.field).sort();
    const expected = index === 0 ? (locale === "EN" ? ["B", "question", "retryMessage", "successMessage"] : ["B", "explanation", "question"])
      : (locale === "EN" ? ["B", "retryMessage", "successMessage"] : ["B", "explanation"]);
    check(isDeepStrictEqual(actual, expected.sort()), "exact approved fields");
  }
}
function exactKeys(value: object, expected: string[], label: string) {
  check(Object.getPrototypeOf(value) === Object.prototype && isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort()), label + " keys/prototype");
}
function shape(record: QuizQuestion | UnifiedQuestion, keys: string[]) {
  check(record !== null && typeof record === "object" && !Array.isArray(record), "record shape"); exactKeys(record, keys, record.id);
  check(Array.isArray(record.answers) && record.answers.length === 4 && isDeepStrictEqual(record.answers.map(row => row.id), ["A", "B", "C", "D"]), "answer cardinality/order");
  for (const answer of record.answers) { exactKeys(answer, ["id", "text"], "answer"); check(typeof answer.text === "string", "answer text"); }
}
function loadBank(path: string, pin: string, prefix: string, excluded: string): Bank[] {
  const run = artifact<{ stdout: string }>(path, pin), lines = run.stdout.split(/\r?\n/).filter(line => line.startsWith(prefix));
  check(lines.length === 1, "single archived bank observation"); const banks = JSON.parse(lines[0]!.slice(prefix.length)) as Bank[];
  check(banks.length === 2 && isDeepStrictEqual(banks.map(row => row.locale), ["pl", "en"]), "archived PLEN");
  for (const bank of banks) {
    check(bank.ids.length === 82 && new Set(bank.ids).size === 82 && bank.metadata.length === 82, "archived bank size/order");
    check(isDeepStrictEqual(bank.ids, bank.metadata.map(row => row.id)), "archived metadata order");
    check(bank.nonTargetRows.length === 81 && isDeepStrictEqual(bank.nonTargetRows.map(row => row.id), bank.ids.filter(id => id !== excluded)), "archived non-target order");
    for (const row of bank.nonTargetRows) { shape(row, UNIFIED_KEYS); check(isDeepStrictEqual({ id: row.id, correctAnswer: row.correctAnswer, reward: row.reward }, bank.metadata.find(meta => meta.id === row.id)), "archived scoring"); }
  }
  return banks;
}
const oldBanks = loadBank("evidence/cycle-53/baseline-run.json", "24cfa70e9e86468db4a0226b62911a634245864c6ec74a9d32cb88f91a73c28f", "C53_BANK_OBSERVATION ", IDS[0]);
const newBanks = loadBank("evidence/cycle-54/acceptance-run.json", "57135ca965d1272be29abae8e096a2ee48d4c4d3717bad3e619f321be8e6357c", "C54_BANK_OBSERVATION ", IDS[1]);
for (const locale of ["pl", "en"] as const) {
  const old = oldBanks.find(bank => bank.locale === locale)!, current = newBanks.find(bank => bank.locale === locale)!;
  check(isDeepStrictEqual(old.metadata, current.metadata), "accepted ID/key/reward order");
  const common = old.nonTargetRows.filter(row => row.id !== IDS[1]);
  check(common.length === 80 && common.every(row => isDeepStrictEqual(row, current.nonTargetRows.find(other => other.id === row.id))), "80 archived non-target objects");
}
const metadata = newBanks.find(bank => bank.locale === "en")!.metadata, englishMetadata = metadata.slice(0, 62);
function spanText(span: string): string {
  const match = span.match(/(?:question|successMessage|retryMessage|explanation|text): ("(?:\\.|[^"\\])*")$/);
  check(match, "literal approved text span"); return JSON.parse(match[1]!) as string;
}
function textField(patch: Patch, locale: "EN" | "PL", field: string, old: boolean): string {
  const candidates = patch.changes.filter(row => row.locale === locale && row.field === field); check(candidates.length === 1, "single approved field " + field);
  return spanText(old ? candidates[0]!.oldSpan : candidates[0]!.newSpan);
}
function changedCanonical(record: UnifiedQuestion, patch: Patch, locale: "EN" | "PL", old: boolean): UnifiedQuestion {
  const result = clone(record);
  for (const operation of patch.changes.filter(row => row.locale === locale)) {
    const value = spanText(old ? operation.oldSpan : operation.newSpan);
    if (operation.field === "B") result.answers[1]!.text = value;
    else if (operation.field === "question") result.question = value;
    else if (operation.field === "explanation" || operation.field === "retryMessage") result.explanation = value;
    else check(operation.field === "successMessage", "canonical approved field");
  }
  return result;
}
const canonical = new Map<string, { before: UnifiedQuestion; after: UnifiedQuestion }>();
for (const locale of ["pl", "en"] as const) {
  const key = locale === "pl" ? "PL" : "EN";
  const matchAfter = newBanks.find(bank => bank.locale === locale)!.nonTargetRows.find(row => row.id === IDS[0])!;
  const wrapperBefore = oldBanks.find(bank => bank.locale === locale)!.nonTargetRows.find(row => row.id === IDS[1])!;
  canonical.set(locale + ":" + IDS[0], { before: changedCanonical(matchAfter, patches[0]!, key, true), after: clone(matchAfter) });
  canonical.set(locale + ":" + IDS[1], { before: clone(wrapperBefore), after: changedCanonical(wrapperBefore, patches[1]!, key, false) });
}
function asQuiz(record: UnifiedQuestion, patch: Patch, old: boolean): QuizQuestion {
  return { id: record.id, question: record.question, answers: clone(record.answers), correctAnswer: record.correctAnswer, reward: record.reward,
    successMessage: textField(patch, "EN", "successMessage", old), retryMessage: textField(patch, "EN", "retryMessage", old), category: record.category };
}
function asUnified(record: QuizQuestion): UnifiedQuestion {
  return { id: record.id, question: record.question, answers: clone(record.answers), correctAnswer: record.correctAnswer, explanation: record.retryMessage, category: record.category, reward: record.reward };
}
const english = new Map(IDS.map((id, index) => { const pair = canonical.get("en:" + id)!;
  return [id, { before: asQuiz(pair.before, patches[index]!, true), after: asQuiz(pair.after, patches[index]!, false) }] as const;
}));
// ES/FR target literals were unchanged; inspect a pinned AST, never eval/import source.
const localized = ts.createSourceFile("lib/localizedQuiz.ts", pinnedText("lib/localizedQuiz.ts", "a85a1173d681bae61dc4836298c32b4254ea547e2e945b152d44cd7e0c5e9588"), ts.ScriptTarget.Latest, true);
const name = (node: ts.PropertyName) => ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : "";
function literal(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(item => literal(item));
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(item => { check(ts.isPropertyAssignment(item) && name(item.name), "literal property"); return [name(item.name), literal(item.initializer)]; }));
  throw new Error("C69 strict historical admission: unsupported literal node");
}
for (const locale of ["es", "fr"] as const) {
  const arrays: ts.ArrayLiteralExpression[] = [];
  function visit(node: ts.Node) { if (ts.isVariableDeclaration(node) && node.name.getText(localized) === locale && node.initializer && ts.isArrayLiteralExpression(node.initializer)) arrays.push(node.initializer); ts.forEachChild(node, visit); }
  visit(localized); check(arrays.length === 1, "single ES/FR literal bank");
  for (const id of IDS) {
    const targets = arrays[0]!.elements.filter(node => ts.isObjectLiteralExpression(node) && node.properties.some(item => ts.isPropertyAssignment(item) && name(item.name) === "id" && ts.isStringLiteral(item.initializer) && item.initializer.text === id));
    check(targets.length === 1, "single ES/FR target"); const record = literal(targets[0]!) as QuizQuestion; shape(record, QUIZ_KEYS);
    const unchanged = asUnified(record); canonical.set(locale + ":" + id, { before: unchanged, after: clone(unchanged) });
  }
}
for (const locale of ["zh", "ja", "hi", "pt-BR", "tr"] as const) for (const id of IDS) canonical.set(locale + ":" + id, canonical.get("en:" + id)!);
for (const pair of [...english.values(), ...canonical.values()]) for (const record of [pair.before, pair.after]) {
  shape(record, "explanation" in record ? UNIFIED_KEYS : QUIZ_KEYS); check(record.correctAnswer === "B" && record.reward === 30, "two target scoring");
}

// The merged main adds one pinned deck fallback. This test-only inverse keeps
// the original C69/C37 historical oracles; it never admits arbitrary locale copy.
type ReleaseAdmission = {
  schema: number;
  source: { path: string; historicalSHA256: string; currentSHA256: string;
    inverse: Array<{ current: string; historical: string }> };
  sourcePins: Array<{ path: string; sha256: string }>;
  locales: Array<{ locale: Locale; projectedIds: string[]; deckRecordsSHA256: string }>;
};
const release = artifact<ReleaseAdmission>("tests/release-pr19-preservation-admission.json",
  "f64626fc12165ce59f7ee33ce14c724feaf2eb5b97012d724719f84909e82ff2");
check(release.schema === 1 && release.source.path === "lib/allQuestions.ts" && release.source.inverse.length === 2, "incoming source identity");
check(isDeepStrictEqual(release.locales.map(row => row.locale), ["es", "fr", "zh", "ja", "hi", "pt-BR", "tr"]), "incoming locale identity/order");
for (const pin of release.sourcePins) pinnedText(pin.path, pin.sha256);
const deckPin = release.sourcePins.find(row => row.path === "lib/localizedDeck.ts")!;
const deckTree = ts.createSourceFile(deckPin.path, pinnedText(deckPin.path, deckPin.sha256), ts.ScriptTarget.Latest, true);
const deckNodes: ts.ObjectLiteralExpression[] = [];
function findDeck(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(deckTree) === "deckOverrides" && node.initializer && ts.isObjectLiteralExpression(node.initializer)) deckNodes.push(node.initializer);
  ts.forEachChild(node, findDeck);
}
findDeck(deckTree); check(deckNodes.length === 1, "single pinned incoming deck");
const incomingDeck = literal(deckNodes[0]!) as Record<Locale, Record<string, Pick<UnifiedQuestion, "question" | "answers" | "explanation" | "category">>>;
exactKeys(incomingDeck, release.locales.map(row => row.locale), "incoming deck locales");
const archivedEnglish = newBanks.find(bank => bank.locale === "en")!;
const englishFallback = new Map(metadata.map(meta => {
  const row = IDS.some(id => id === meta.id) ? canonical.get("en:" + meta.id)!.after
    : archivedEnglish.nonTargetRows.find(row => row.id === meta.id)!;
  check(row !== undefined, "independent archived fallback " + meta.id); shape(row, UNIFIED_KEYS);
  return [meta.id, row] as const;
}));
for (const locale of release.locales) {
  const rows = incomingDeck[locale.locale];
  check(isDeepStrictEqual(Object.keys(rows), locale.projectedIds) && new Set(locale.projectedIds).size === locale.projectedIds.length, "exact incoming ID list " + locale.locale);
  check(hash(JSON.stringify(rows)) === locale.deckRecordsSHA256, "incoming record digest " + locale.locale);
  for (const id of locale.projectedIds) {
    check(englishMetadata.some(row => row.id === id), "incoming existing quiz ID");
    exactKeys(rows[id]!, ["question", "answers", "explanation", "category"], "incoming text-only fields");
    shape({ ...englishFallback.get(id)!, ...rows[id]! }, UNIFIED_KEYS);
  }
}

export function projectReleaseMainSource(file: string, source: string): string {
  if (file !== release.source.path) return source;
  const historicalPins = patches.flatMap(patch => patch.sources.filter(row => row.path === file).flatMap(row => [row.beforeSHA256, row.afterSHA256]));
  check([release.source.currentSHA256, ...historicalPins].includes(hash(source)), "unexpected incoming whole source bytes");
  if (hash(source) !== release.source.currentSHA256) return source;
  for (const operation of release.source.inverse) {
    check(source.split(operation.current).length === 2, "single incoming inverse span");
    source = source.replace(operation.current, () => operation.historical);
  }
  check(hash(source) === release.source.historicalSHA256, "whole incoming inverse source");
  return source;
}

export function projectReleaseMainUnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  check(LOCALES.includes(locale), "known incoming locale");
  admitBank(records, metadata, locale === "pl" || locale === "en");
  const incoming = release.locales.find(row => row.locale === locale);
  return records.map(record => {
    if (!incoming?.projectedIds.includes(record.id)) return record;
    shape(record, UNIFIED_KEYS);
    const before = englishFallback.get(record.id)!;
    const after = { ...before, ...incomingDeck[locale][record.id]! };
    const oldTarget = canonical.get(locale + ":" + record.id)?.before;
    check(isDeepStrictEqual(record, before) || isDeepStrictEqual(record, after) ||
      (oldTarget !== undefined && isDeepStrictEqual(record, oldTarget)), "unexpected incoming target copy/fields " + locale + ":" + record.id);
    return isDeepStrictEqual(record, after) ? clone(before) : record;
  });
}

function admitBank(records: readonly (QuizQuestion | UnifiedQuestion)[], expected: readonly Meta[], strictScoring: boolean) {
  check(Array.isArray(records) && records.length === expected.length && isDeepStrictEqual(records.map(row => row.id), expected.map(row => row.id)), "bank cardinality/ID/order");
  if (strictScoring) check(isDeepStrictEqual(records.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward })), expected), "bank key/reward");
}
export function projectC53C54EnglishRecords(records: readonly QuizQuestion[]): QuizQuestion[] {
  admitBank(records, englishMetadata, true);
  return records.map(record => {
    if (!IDS.some(id => id === record.id)) return record;
    shape(record, QUIZ_KEYS); const pair = english.get(record.id as typeof IDS[number])!;
    check(isDeepStrictEqual(record, pair.before) || isDeepStrictEqual(record, pair.after), "unexpected English target copy/fields");
    return isDeepStrictEqual(record, pair.before) ? record : clone(pair.before);
  });
}
export function projectC53C54UnifiedRecords(records: readonly UnifiedQuestion[], locale: Locale): UnifiedQuestion[] {
  records = projectReleaseMainUnifiedRecords(records, locale);
  check(LOCALES.includes(locale), "known locale"); admitBank(records, metadata, locale === "pl" || locale === "en");
  return records.map(record => {
    if (!IDS.some(id => id === record.id)) return record;
    shape(record, UNIFIED_KEYS); const pair = canonical.get(locale + ":" + record.id)!;
    check(isDeepStrictEqual(record, pair.before) || isDeepStrictEqual(record, pair.after), "unexpected canonical target copy/fields");
    return isDeepStrictEqual(record, pair.before) ? record : clone(pair.before);
  });
}
export function projectC53C54Source(file: string, source: string): string {
  source = projectReleaseMainSource(file, source);
  if (file !== "data/quizQuestions.ts" && file !== "lib/allQuestions.ts") return source;
  const states = patches.map(patch => { const candidates = patch.sources.filter(row => row.path === file); check(candidates.length === 1, "single source tuple"); return candidates[0]!; });
  check(states[0]!.afterSHA256 === states[1]!.beforeSHA256, "source history link");
  check([states[0]!.beforeSHA256, states[0]!.afterSHA256, states[1]!.afterSHA256].includes(hash(source)), "unexpected whole source bytes");
  for (const index of [1, 0]) {
    const state = states[index]!; if (hash(source) !== state.afterSHA256) continue;
    for (const operation of patches[index]!.changes.filter(row => row.path === file)) {
      check(source.split(operation.newSpan).length === 2, "single inverse source span"); source = source.replace(operation.newSpan, () => operation.oldSpan);
    }
    check(hash(source) === state.beforeSHA256, "whole inverse source");
  }
  check(hash(source) === states[0]!.beforeSHA256, "pre-C53 source result"); return source;
}
export const restorePreC15Source = (file: string, source: string) => previous.restorePreC15Source(file, projectC53C54Source(file, source));
export const restorePreC15EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC15EnglishRecords(projectC53C54EnglishRecords(records));
export const restorePreC15UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC15UnifiedRecords(projectC53C54UnifiedRecords(records, locale), locale);
export const restorePreC16Source = (file: string, source: string) => previous.restorePreC16Source(file, projectC53C54Source(file, source));
export const restorePreC16EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC16EnglishRecords(projectC53C54EnglishRecords(records));
export const restorePreC16UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC16UnifiedRecords(projectC53C54UnifiedRecords(records, locale), locale);
export const restorePreC17Source = (file: string, source: string) => previous.restorePreC17Source(file, projectC53C54Source(file, source));
export const restorePreC17EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC17EnglishRecords(projectC53C54EnglishRecords(records));
export const restorePreC17UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC17UnifiedRecords(projectC53C54UnifiedRecords(records, locale), locale);
export const restorePreC23Source = (file: string, source: string) => previous.restorePreC23Source(file, projectC53C54Source(file, source));
export const restorePreC23EnglishRecords = (records: readonly QuizQuestion[]) => previous.restorePreC23EnglishRecords(projectC53C54EnglishRecords(records));
export const restorePreC23UnifiedRecords = (records: readonly UnifiedQuestion[], locale: Locale) => previous.restorePreC23UnifiedRecords(projectC53C54UnifiedRecords(records, locale), locale);
