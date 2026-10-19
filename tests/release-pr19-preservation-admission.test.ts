import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getAllQuestions, type UnifiedQuestion } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import admission from "./release-pr19-preservation-admission.json";
import { projectReleaseMainSource, projectReleaseMainUnifiedRecords, projectC53C54Source } from "./cycle69-legacy-preservation";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const read = (file: string) => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const target = (rows: readonly UnifiedQuestion[], id: string) => {
  const row = rows.find(row => row.id === id); if (!row) throw new Error("Missing test target " + id); return row;
};

describe("PR19 exact incoming deck historical admission, no translation acceptance claim", () => {
  it("inverts exactly the two approved source spans while retaining all old C69 source states", () => {
    const current = read(admission.source.path);
    expect(hash(current)).toBe(admission.source.currentSHA256);
    const historical = projectReleaseMainSource(admission.source.path, current);
    expect(hash(historical)).toBe(admission.source.historicalSHA256);
    expect(projectReleaseMainSource(admission.source.path, historical)).toBe(historical);
    expect(projectC53C54Source(admission.source.path, current)).toBe(projectC53C54Source(admission.source.path, historical));
    expect(read(admission.source.path)).toBe(current);
  });

  it("rejects an unrelated byte, PL branch change, fallback change or extra import", () => {
    const current = read(admission.source.path);
    const variants = [current + "\n// UNEXPECTED_RELEASE\n", current.replace('locale === "pl"', 'locale === "en"'),
      current.replace("return deckOverride ?", "return false ?"), 'import "unexpected-release";\n' + current];
    for (const variant of variants) expect(() => projectReleaseMainSource(admission.source.path, variant)).toThrow(/strict historical admission/);
  });

  it("projects only the fixed locale ID lists to archived English fallback without changing identity or scoring", () => {
    const english = getAllQuestions("en");
    for (const entry of admission.locales) {
      const locale = entry.locale as Locale, current = getAllQuestions(locale), original = JSON.stringify(current);
      const projected = projectReleaseMainUnifiedRecords(current, locale);
      expect(projected.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward })))
        .toEqual(current.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward })));
      for (const [index, row] of current.entries()) {
        if (entry.projectedIds.includes(row.id)) expect(projected[index]).toEqual(target(english, row.id));
        else expect(projected[index]).toBe(row);
      }
      expect(JSON.stringify(current)).toBe(original);
    }
  });

  it("leaves every PLEN object and unrelated translated mutation visible", () => {
    for (const locale of ["pl", "en"] as const) {
      const rows = getAllQuestions(locale), projected = projectReleaseMainUnifiedRecords(rows, locale);
      for (const [index, row] of rows.entries()) expect(projected[index]).toBe(row);
    }
    const rows = clone(getAllQuestions("es"));
    const id = admission.locales.find(row => row.locale === "es")!.localizedQuizIds[0];
    const row = target(rows, id); row.question += " UNEXPECTED_RELEASE"; Object.assign(row, { unexpectedRelease: true });
    const projected = projectReleaseMainUnifiedRecords(rows, "es");
    expect(target(projected, id)).toBe(row); expect(target(projected, id)).toHaveProperty("unexpectedRelease", true);
  });

  it("rejects unpinned copy, fields, answer IDs/order, scoring and bank shape for all admitted locales", () => {
    for (const entry of admission.locales) for (const variant of ["copy", "field", "answer-order", "answer-id", "reward", "key", "missing", "duplicate", "order"]) {
      const locale = entry.locale as Locale, rows = clone(getAllQuestions(locale)), row = target(rows, entry.projectedIds[0]);
      if (variant === "copy") row.question += " UNEXPECTED_RELEASE";
      if (variant === "field") Object.assign(row, { unexpectedRelease: true });
      if (variant === "answer-order") row.answers.reverse();
      if (variant === "answer-id") row.answers[0].id = "UNEXPECTED";
      if (variant === "reward") row.reward += 1;
      if (variant === "key") row.correctAnswer = row.correctAnswer === "A" ? "B" : "A";
      if (variant === "missing") rows.pop();
      if (variant === "duplicate") rows[1] = clone(rows[0]);
      if (variant === "order") [rows[0], rows[1]] = [rows[1], rows[0]];
      expect(() => projectReleaseMainUnifiedRecords(rows, locale), `${locale}:${variant}`).toThrow(/strict historical admission/);
    }
  });

  it("keeps historical locale rows idempotent and unrelated source text byte literal", () => {
    for (const entry of admission.locales) {
      const locale = entry.locale as Locale;
      const projected = projectReleaseMainUnifiedRecords(getAllQuestions(locale), locale);
      const again = projectReleaseMainUnifiedRecords(projected, locale);
      expect(again).toEqual(projected);
      for (const [index, row] of projected.entries()) expect(again[index]).toBe(row);
    }
    expect(projectReleaseMainSource("lib/unrelated-release.ts", "// ORIGINAL\r\n")).toBe("// ORIGINAL\r\n");
  });
});
