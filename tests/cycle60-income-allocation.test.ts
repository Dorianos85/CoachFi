import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

type Locale = "pl" | "en";
const fixture = vi.hoisted(() => ({ locale: "pl" as Locale, slot: 0, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>() }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = fixture.slot++;
    if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(slot), (next: unknown) => fixture.values.set(slot, typeof next === "function" ? next(fixture.values.get(slot)) : next)];
  },
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => {
    const slot = fixture.slot++, prior = fixture.memos.get(slot);
    if (!prior || !deps || !prior.deps || deps.length !== prior.deps.length || deps.some((value, i) => !Object.is(value, prior.deps?.[i])))
      fixture.memos.set(slot, { deps, value: factory() });
    return fixture.memos.get(slot)?.value;
  },
  useId: () => "c60-controlled-id-" + fixture.slot++,
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
// Only a leaf marker: the actual planner constructs these props. No VoiceContext or speech executes.
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: "c60-voice-props" }));

type Props = { children?: unknown; className?: string; role?: string; type?: string; value?: string | number;
  min?: string | number; max?: string | number; step?: string | number; text?: string; label?: string; locale?: string;
  onChange?: (event: { target: { value: string } }) => void };
type Node = ReactElement<Props>;
type View = { tree: Node; input: Node; label: string; headings: string[]; total: string | null; alerts: string[];
  rows: Array<{ title: string; percent: number; amount: string; cents: number | null }>; voices: Array<{ text?: string; label?: string; locale?: string }> };
let Planner: typeof import("@/components/IncomeJarPlanner").IncomeJarPlanner;
const PERCENT = [55, 10, 10, 10, 10, 5];
const COPY = {
  pl: { title: "Model 6 słoików Ekera", label: "Miesięczny dochód", read: "Odczytaj podział dochodu",
    jars: ["Wydatki konieczne", "Edukacja", "Długoterminowe wydatki", "Przyjemności", "Inwestycje", "Pomoc innym"] },
  en: { title: "Eker 6 jar model", label: "Monthly income", read: "Read income split",
    jars: ["Necessities", "Education", "Long-term spending", "Fun", "Investing", "Giving"] },
};
const LIMITS = "Actual adult IncomeJarPlanner function, handlers and generated VoiceButton props. Explicit persistent React state/memo/id emulator; locale supplied through actual translation records; VoiceButton is an unexecuted leaf marker. No new helper import at baseline, source regex, copied proposed implementation, ReactDOM, hydration, browser number-input validity, native accessibility, storage owner, SDK, speech, backend or cloud acceptance. Money oracle independently checks PLN formatting, integer-cent conservation and rational quotas; a few explicit hand-calculated ties fix stable jar-order behavior. Scenario observations are not extra test cases.";
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node; return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function formatted(cents: number, locale = fixture.locale) {
  return normalize(new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(cents / 100));
}
function decoded(value: string): number | null {
  const parts = new Intl.NumberFormat(fixture.locale === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: "PLN" }).formatToParts(1234.56);
  let raw = value;
  for (const part of parts.filter(part => part.type === "currency" || part.type === "group")) raw = raw.split(part.value).join("");
  raw = raw.replace(/\s/g, "").replace(parts.find(part => part.type === "decimal")?.value ?? ".", ".");
  if (!/^\d+\.\d{2}$/.test(raw)) return null;
  const [whole, fraction] = raw.split("."); const cents = Number(whole) * 100 + Number(fraction);
  return Number.isSafeInteger(cents) ? cents : null;
}
function render(): View {
  fixture.slot = 0; const tree = Planner({ mode: "adult" }), all = nodes(tree);
  const inputs = all.filter(node => node.type === "input");
  if (inputs.length !== 1) throw Error("C60 expected the actual single planner input, observed " + inputs.length);
  const input = inputs[0], label = all.find(node => node.type === "label" && nodes(node).includes(input));
  const totals = all.filter(node => node.type === "p" && node.props.className?.includes("text-3xl"));
  const rows = all.filter(node => node.type === "article").map(article => {
    const children = nodes(article), amount = text(children.find(node => node.type === "p")?.props.children);
    const percent = children.filter(node => node.type === "span").map(node => text(node.props.children)).find(value => /^\d+%$/.test(value));
    return { title: text(children.find(node => node.type === "h3")?.props.children), percent: Number(percent?.slice(0, -1)), amount, cents: decoded(amount) };
  });
  return { tree, input, label: normalize(text(label)), headings: all.filter(node => node.type === "h2").map(node => text(node.props.children)),
    total: totals.length === 1 ? text(totals[0].props.children) : null, rows,
    alerts: all.filter(node => node.props.role === "alert").map(node => normalize(text(node))),
    voices: all.filter(node => node.type === "c60-voice-props").map(node => ({ text: node.props.text, label: node.props.label, locale: node.props.locale })) };
}
function input(raw: string): View {
  const current = render(); if (!current.input.props.onChange) throw Error("C60 actual input has no onChange");
  current.input.props.onChange({ target: { value: raw } }); return render();
}
function summary(view: View) { return { input: view.input.props.value, type: view.input.props.type, min: view.input.props.min,
  max: view.input.props.max, step: view.input.props.step, label: view.label, headings: view.headings, total: view.total,
  rows: view.rows, alerts: view.alerts, voices: view.voices }; }
function observe(name: string, data: unknown) { console.log("C60_INCOME_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data, limits: LIMITS })); }
function valid(view: View, cents: number, exact?: number[]) {
  expect(view.headings).toEqual([COPY[fixture.locale].title]); expect(view.label).toContain(COPY[fixture.locale].label);
  expect(view.alerts).toEqual([]); expect(view.rows.map(row => row.title)).toEqual(COPY[fixture.locale].jars);
  expect(view.rows.map(row => row.percent)).toEqual(PERCENT); expect(normalize(view.total ?? "")).toBe(formatted(cents));
  expect(view.rows.every(row => row.cents !== null), "every displayed PLN share has exactly two decimal digits").toBe(true);
  const actual = view.rows.map(row => row.cents as number);
  expect(actual.reduce((sum, value) => sum + value, 0), "six displayed cent shares conserve entered income").toBe(cents);
  actual.forEach((value, i) => {
    // These integer products remain <=5.5e15 throughout the approved <=1e12 PLN domain.
    const numerator = cents * PERCENT[i]; expect(Number.isSafeInteger(numerator)).toBe(true);
    expect(value, "share respects lower quota " + i).toBeGreaterThanOrEqual(Math.floor(numerator / 100));
    expect(value, "share respects upper quota " + i).toBeLessThanOrEqual(Math.ceil(numerator / 100));
    expect(normalize(view.rows[i].amount)).toBe(formatted(value));
  });
  if (exact) expect(actual).toEqual(exact);
  expect(view.voices).toHaveLength(1); const voice = view.voices[0];
  expect(voice.locale).toBe(fixture.locale); expect(voice.label).toBe(COPY[fixture.locale].read);
  expect(normalize(voice.text ?? "")).toContain(formatted(cents));
  view.rows.forEach((row, i) => {
    const segment = (voice.text ?? "").split(row.title + ":")[1]?.split(COPY[fixture.locale].jars[i + 1] + ":")[0] ?? "";
    expect(segment, "actual voice prop includes the same displayed share for " + row.title).toContain(row.amount);
  });
}
function invalid(view: View, raw: string) {
  expect(String(view.input.props.value), "controlled input preserves invalid raw text").toBe(raw);
  expect(view.alerts).toHaveLength(1); expect(view.alerts[0].length).toBeGreaterThan(10);
  expect(view.rows, "no confirmed allocation for invalid income").toEqual([]);
  expect(view.voices, "no stale or invented financial readout").toEqual([]);
  expect(view.total, "no numeric confirmed total for invalid income").toBeNull();
}

beforeEach(async () => {
  vi.resetModules(); fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.locale = "pl";
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("C60 unauthorized network"); }));
  Planner = (await import("@/components/IncomeJarPlanner")).IncomeJarPlanner;
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C60 actual adult planner PL/EN income integrity", () => {
  for (const locale of ["pl", "en"] as const) {
    it(locale + " default5000 keeps the existing six weights and Poland currency", () => {
      fixture.locale = locale; const view = render(); observe("default", summary(view));
      expect(String(view.input.props.value)).toBe("5000"); valid(view, 500000, [275000, 50000, 50000, 50000, 50000, 25000]);
    });
    it(locale + " ten PLN conserves every displayed cent and matching voice amount", () => {
      fixture.locale = locale; const view = input("10"); observe("ten", summary(view)); valid(view, 1000, [550, 100, 100, 100, 100, 50]);
    });
    it(locale + " three cents use stable ties without inventing or dropping money", () => {
      fixture.locale = locale; const view = input("0.03"); observe("three-cents", summary(view)); valid(view, 3, [2, 1, 0, 0, 0, 0]);
    });
    it(locale + " empty input is unavailable while explicit zero is a valid allocation", () => {
      fixture.locale = locale; const empty = input(""), zero = input("0"), emptyAgain = input("");
      observe("blank-versus-zero", { empty: summary(empty), zero: summary(zero), emptyAgain: summary(emptyAgain) });
      invalid(empty, ""); valid(zero, 0, [0, 0, 0, 0, 0, 0]); invalid(emptyAgain, "");
    });
    it(locale + " invalid numeric inputs suppress results and recover through the actual handler", () => {
      fixture.locale = locale;
      const rejected = ["0.001", "1e-3", "-1", "1e308", "1e309", "1000000000000.01", "NaN", "Infinity", "0x10", "   "];
      const refusals = rejected.map(raw => ({ raw, view: input(raw) }));
      const recovered = ["0.29", "1e2", "1e-2", "-0"].map(raw => ({ raw, view: input(raw) }));
      observe("invalid-recovery", { rejected: refusals.map(item => ({ raw: item.raw, ...summary(item.view) })),
        recovered: recovered.map(item => ({ raw: item.raw, ...summary(item.view) })) });
      refusals.forEach(item => invalid(item.view, item.raw)); recovered.forEach(item => valid(item.view, Math.round(Number(item.raw) * 100) || 0));
    });
  }
});

describe("C60 arithmetic contracts through the actual planner, not a new API", () => {
  it("one and two cents respect quotas and original-order equal remainders", () => {
    const one = input("0.01"), two = input("0.02"); observe("smallest-positive", { one: summary(one), two: summary(two) });
    valid(one, 1, [1, 0, 0, 0, 0, 0]); valid(two, 2, [1, 1, 0, 0, 0, 0]);
  });
  it("maximum and near-maximum admissible income stay finite and cent-exact", () => {
    const cap = input("1000000000000"), near = input("999999999999.99");
    observe("cap", { cap: summary(cap), near: summary(near) }); valid(cap, 100000000000000); valid(near, 99999999999999);
  });
  it("every sub-PLN cent residue conserves money and keeps six rational quotas", () => {
    const views = Array.from({ length: 100 }, (_, cents) => ({ cents, view: input((cents / 100).toFixed(2)) }));
    observe("all-cent-residues", views.map(item => ({ cents: item.cents, ...summary(item.view) })));
    views.forEach(item => valid(item.view, item.cents));
  });
  it("diverse larger incomes preserve exact sums, quota bounds and unchanged jar order", () => {
    const amounts = [101, 1299, 123456, 500001, 99999999, 1234567890123, 98765432109876];
    const views = amounts.map(cents => ({ cents, view: input((cents / 100).toFixed(2)) }));
    observe("larger-incomes", views.map(item => ({ cents: item.cents, ...summary(item.view) })));
    views.forEach(item => valid(item.view, item.cents));
  });
});
