import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { quizQuestions, type QuizQuestion } from "@/data/quizQuestions";
import { getAllQuestions, type UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import { projectC53C54Source, projectC53C54EnglishRecords, projectC53C54UnifiedRecords,
  projectReleaseMainSource, projectReleaseMainUnifiedRecords } from "./cycle69-legacy-preservation";

const IDS = ["us-401k-match", "tax-advantaged-wrapper"];
const LOCALES: Locale[] = ["en", "pl", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const archiveText = read("evidence/cycle-11/content-author-non-target-baseline.json");
if (hash(archiveText) !== "4abeb7a79e74df161fde030cdd726e2bc4fce6faf0a2ab2b249b5dfa635f7d13") throw new Error("Independent C11 historical oracle changed");
const archive = JSON.parse(archiveText) as { non_target: { quizQuestions: QuizQuestion[]; unifiedQuestions: Record<Locale, UnifiedQuestion[]> } };
const observations: Array<{ group: string; variant: string; rejected?: boolean }> = [];
function target<T extends { id: string }>(rows: readonly T[], id: string): T {
  const matches = rows.filter(row => row.id === id); if (matches.length !== 1) throw new Error("Expected single target " + id); return matches[0]!;
}
function refusal(group: string, variant: string, action: () => unknown) {
  let error: unknown; try { action(); } catch (caught) { error = caught; }
  observations.push({ group, variant, rejected: error instanceof Error });
  expect(error).toBeInstanceOf(Error); expect((error as Error).message).toMatch(/C69 strict historical admission/);
}
afterAll(() => console.log("C69_PRESERVATION_OBSERVATIONS " + JSON.stringify(observations)));

describe("C69 strict historical preservation admission, no financial or release acceptance claim", () => {
  it("inverts only accepted C53/C54 whole sources to immutable pre-C53 hashes", () => {
    const expected = { "data/quizQuestions.ts": "1d78f25ea02b6d11a514614cd593d56c8f72e32bc5bc59d86689065829d7ddfe",
      "lib/allQuestions.ts": "f1a7e9849409e1efc7e1211d6585a31ca317f720a68b9fb5e470f4fdf8443343" };
    for (const [path, pin] of Object.entries(expected)) {
      const current = read(path), restored = projectC53C54Source(path, current); observations.push({ group: "source", variant: path });
      expect(hash(restored)).toBe(pin); expect(projectC53C54Source(path, restored)).toBe(restored); expect(read(path)).toBe(current);
    }
  });
  it("restores exactly two English records to independent C11 objects and retains all non-target identities", () => {
    const before = JSON.stringify(quizQuestions), restored = projectC53C54EnglishRecords(quizQuestions);
    observations.push({ group: "english", variant: "62 current records" });
    expect(restored).toHaveLength(62); expect(restored.map(row => row.id)).toEqual(quizQuestions.map(row => row.id));
    for (const id of IDS) expect(target(restored, id)).toEqual(target(archive.non_target.quizQuestions, id));
    for (const [index, row] of quizQuestions.entries()) if (!IDS.includes(row.id)) expect(restored[index]).toBe(row);
    expect(JSON.stringify(quizQuestions)).toBe(before);
  });
  it("projects PLEN and inherited views while leaving independent ESFR targets and 80 non-targets literal", () => {
    for (const locale of LOCALES) {
      const current = projectReleaseMainUnifiedRecords(getAllQuestions(locale), locale), before = JSON.stringify(current), restored = projectC53C54UnifiedRecords(current, locale);
      observations.push({ group: "canonical", variant: locale });
      expect(restored).toHaveLength(82); expect(restored.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward }))).toEqual(current.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward })));
      for (const id of IDS) expect(target(restored, id)).toEqual(target(archive.non_target.unifiedQuestions[locale], id));
      for (const [index, row] of current.entries()) if (!IDS.includes(row.id)) expect(restored[index]).toBe(row);
      expect(JSON.stringify(current)).toBe(before);
    }
  });
  it("admits exact archived target records idempotently without changing their references", () => {
    const english = quizQuestions.map(row => IDS.includes(row.id) ? clone(target(archive.non_target.quizQuestions, row.id)) : row);
    expect(projectC53C54EnglishRecords(english)).toEqual(english);
    for (const id of IDS) expect(target(projectC53C54EnglishRecords(english), id)).toBe(target(english, id));
    for (const locale of LOCALES) {
      const records = projectReleaseMainUnifiedRecords(getAllQuestions(locale), locale).map(row => IDS.includes(row.id) ? clone(target(archive.non_target.unifiedQuestions[locale], row.id)) : row);
      expect(projectC53C54UnifiedRecords(records, locale)).toEqual(records);
    }
    observations.push({ group: "archived", variant: "old records remain admitted" });
  });
  it("rejects unexpected whole-source copy or unrelated byte changes without masking them", () => {
    for (const path of ["data/quizQuestions.ts", "lib/allQuestions.ts"]) {
      const original = read(path);
      refusal("source-refusal", path + ":suffix", () => projectC53C54Source(path, original + "\n// UNEXPECTED_C69\n"));
      refusal("source-refusal", path + ":target-id", () => projectC53C54Source(path, original.replace("us-401k-match", "unexpected-c69-id")));
    }
  });
  it("rejects unapproved English target text, hybrid feedback, keys, scoring, distractors and answer order", () => {
    for (const variant of ["copy", "hybrid", "key", "reward", "distractor", "answer-order", "extra-key"]) {
      const rows = clone(quizQuestions), row = target(rows, IDS[0]!);
      if (variant === "copy") row.question += " UNEXPECTED_C69";
      if (variant === "hybrid") row.successMessage = target(archive.non_target.quizQuestions, IDS[0]!).successMessage;
      if (variant === "key") row.correctAnswer = "A";
      if (variant === "reward") row.reward = 31;
      if (variant === "distractor") row.answers[0]!.text += " UNEXPECTED_C69";
      if (variant === "answer-order") row.answers.reverse();
      if (variant === "extra-key") Object.assign(row, { unexpectedC69: true });
      refusal("english-refusal", variant, () => projectC53C54EnglishRecords(rows));
    }
  });
  it("rejects missing, duplicate, reordered bank entries and non-target scoring changes", () => {
    for (const variant of ["missing", "duplicate", "order", "non-target-reward"]) {
      const rows = clone(quizQuestions);
      if (variant === "missing") rows.pop();
      if (variant === "duplicate") rows[1] = clone(rows[0]!);
      if (variant === "order") [rows[0], rows[1]] = [rows[1]!, rows[0]!];
      if (variant === "non-target-reward") rows.find(row => !IDS.includes(row.id))!.reward += 1;
      refusal("bank-refusal", variant, () => projectC53C54EnglishRecords(rows));
    }
  });
  it("rejects unapproved PLEN canonical target copy, unknown fields, scoring and answer mutation", () => {
    for (const locale of ["pl", "en"] as const) for (const variant of ["copy", "extra-key", "reward", "answer"] as const) {
      const rows = clone(getAllQuestions(locale)), row = target(rows, IDS[1]!);
      if (variant === "copy") row.explanation += " UNEXPECTED_C69";
      if (variant === "extra-key") Object.assign(row, { unexpectedC69: true });
      if (variant === "reward") row.reward = 31;
      if (variant === "answer") row.answers[3]!.text += " UNEXPECTED_C69";
      refusal("canonical-refusal", locale + ":" + variant, () => projectC53C54UnifiedRecords(rows, locale));
    }
  });
  it("keeps unrelated unknown fields/copy visible to old preservation oracles and unrelated sources byte literal", () => {
    const rows = clone(quizQuestions), row = rows.find(item => !IDS.includes(item.id))!;
    row.question += " UNEXPECTED_C69_NON_TARGET"; Object.assign(row, { unexpectedC69: "visible" });
    const projected = projectC53C54EnglishRecords(rows); expect(target(projected, row.id)).toBe(row);
    expect(target(projected, row.id)).toHaveProperty("unexpectedC69", "visible"); expect(target(projected, row.id).question).toContain("UNEXPECTED_C69_NON_TARGET");
    expect(projectC53C54Source("lib/quiz-topic.ts", "// unrelated C69 bytes\r\n")).toBe("// unrelated C69 bytes\r\n");
    observations.push({ group: "unmasked", variant: "non-target identity and unrelated bytes" });
  });
  it("admits the exact accepted C53 intermediate source and independent old/current target combinations", () => {
    const patch = JSON.parse(read("evidence/cycle-54/source-change.json")) as { sources: Array<{ path: string; beforeSHA256: string }>; changes: Array<{ path: string; oldSpan: string; newSpan: string }> };
    for (const path of ["data/quizQuestions.ts", "lib/allQuestions.ts"]) {
      let intermediate = projectReleaseMainSource(path, read(path)); for (const change of patch.changes.filter(row => row.path === path)) intermediate = intermediate.replace(change.newSpan, () => change.oldSpan);
      expect(hash(intermediate)).toBe(patch.sources.find(row => row.path === path)!.beforeSHA256);
      expect(projectC53C54Source(path, intermediate)).toBe(projectC53C54Source(path, read(path)));
    }
    const mixed = clone(quizQuestions), index = mixed.findIndex(row => row.id === IDS[0]); mixed[index] = clone(target(archive.non_target.quizQuestions, IDS[0]!));
    expect(projectC53C54EnglishRecords(mixed)).toEqual(projectC53C54EnglishRecords(quizQuestions));
    observations.push({ group: "accepted-intermediate", variant: "C53 bytes and exact old/current records" });
  });
});
