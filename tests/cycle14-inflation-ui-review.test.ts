import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, cursor: 0, values: new Map<number, unknown>(), effectCursor: 0, effects: new Map<number, { deps?: readonly unknown[]; cleanup?: () => void }>(), pending: [] as Array<() => void>, stopVoice: vi.fn() }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown) => factory(),
  useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
    const index = fixture.effectCursor++, previous = fixture.effects.get(index);
    if (previous && deps && previous.deps && deps.length === previous.deps.length && deps.every((value, position) => Object.is(value, previous.deps![position]))) return;
    fixture.pending.push(() => { previous?.cleanup?.(); const cleanup = effect(); fixture.effects.set(index, { deps, cleanup: typeof cleanup === "function" ? cleanup : undefined }); });
  },
  useState: (initial: unknown) => {
    const index = fixture.cursor++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (next: unknown) => fixture.values.set(index, typeof next === "function" ? next(fixture.values.get(index)) : next)];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});

vi.mock("@/context/VoiceContext", () => ({ useVoice: () => ({ stop: fixture.stopVoice }) }));

type Props = { children?: unknown; role?: string; text?: string; readText?: string; currency?: string; value?: number | string;
  label?: string; disabled?: boolean; data?: readonly import("@/lib/inflation").InflationScenario[]; "data-testid"?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; id?: string; htmlFor?: string; inputMode?: string; onChange?: (event: { target: { value: string } }) => void };
function nodes(node: unknown): Array<ReactElement<Props>> {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Props>;
  // Execute the actual hook-free internal NumberField to inspect its real input handler.
  if (typeof element.type === "function" && element.type.name === "NumberField") return nodes((element.type as (props: Props) => ReactElement)(element.props));
  return [element, ...nodes(element.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object" && "props" in node ? text((node as ReactElement<Props>).props.children) : "";
}
let render: () => ReactElement;
let Chart: typeof import("@/components/InflationChart").InflationChart;
let Voice: typeof import("@/components/VoiceButton").VoiceButton;
let Header: typeof import("@/components/SectionHeader").SectionHeader;
function inputs(tree: unknown) { return nodes(tree).filter(node => node.type === "input" && node.props.onChange); }
function change(tree: unknown, index: number, raw: string) { expect(inputs(tree)).toHaveLength(5); inputs(tree)[index].props.onChange!({ target: { value: raw } }); return render(); }
function assertSuppressed(tree: unknown) {
  expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1);
  expect(nodes(tree).filter(node => node.type === Chart)).toHaveLength(0);
  expect(nodes(tree).filter(node => node.type === Voice && !!node.props.text)).toHaveLength(0);
  expect(nodes(tree).find(node => node.type === Header)?.props.readText ?? "").toBe("");
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); fixture.locale = "pl"; fixture.cursor = 0; fixture.values.clear(); fixture.effectCursor = 0; fixture.effects.clear(); fixture.pending = []; fixture.stopVoice.mockClear();
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("No real network allowed in inflation UI review"); }));
  const { default: InflationPage } = await import("@/app/inflation/page");
  ({ InflationChart: Chart } = await import("@/components/InflationChart"));
  ({ VoiceButton: Voice } = await import("@/components/VoiceButton"));
  ({ SectionHeader: Header } = await import("@/components/SectionHeader"));
  render = () => { fixture.cursor = 0; fixture.effectCursor = 0; const tree = InflationPage(); const pending = fixture.pending.splice(0); pending.forEach(effect => effect()); return tree; };
}, 30_000);
afterEach(() => { fixture.effects.forEach(effect => effect.cleanup?.()); expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent C14 actual InflationPage initial findings", () => {
  it.each(["pl", "en"] as const)("%s blank amount is retained as blank and cannot publish a zero calculation", locale => {
    fixture.locale = locale; const tree = change(render(), 0, ""); expect(inputs(tree)[0].props.value).toBe(""); assertSuppressed(tree);
  });
  it.each(["pl", "en"] as const)("%s negative amount cannot publish a calculation despite native min", locale => {
    fixture.locale = locale; const tree = change(render(), 0, "-1"); assertSuppressed(tree);
  });
  it.each(["pl", "en"] as const)("%s malformed amount cannot publish NaN chart or spoken values", locale => {
    fixture.locale = locale; const tree = change(render(), 0, "not-a-number"); assertSuppressed(tree);
  });
  it.each(["pl", "en"] as const)("%s fractional5.5 year input is rejected or chart endpoint matches the declared period", async locale => {
    fixture.locale = locale; const tree = change(render(), 1, "5.5");
    if (nodes(tree).some(node => node.props.role === "alert")) { assertSuppressed(tree); return; }
    const chart = nodes(tree).find(node => node.type === Chart); expect(chart).toBeDefined();
    const amounts = inputs(tree).map(input => Number(input.props.value));
    const expected = (await import("@/lib/inflation")).calculateRealValue(amounts[0], amounts[1], amounts[2]);
    expect(chart!.props.data!.at(-1)!["Cash only"]).toBeCloseTo(expected, 8);
  });
  it("English on the Poland market keeps PLN in the actual chart and monetary result", () => {
    fixture.locale = "en"; const tree = render(), chart = nodes(tree).find(node => node.type === Chart); expect(chart).toBeDefined();
    expect(chart!.props.currency ?? "PLN").toBe("PLN"); expect(text(tree)).toContain("PLN"); expect(text(tree)).not.toContain("$");
  });
  // The old pair requiring unused 3000 is RETIRED_SUPERSEDED, preserved in the baseline/proof; it is never counted as PASS.
  it.each(["pl", "en"] as const)("%s exposes current common contribution/nominal change and real end-year table values", locale => {
    fixture.locale = locale; let tree = render();
    const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    const byId = (id: string) => nodes(tree).find(node => node.props["data-testid"] === id)!;
    expect(inputs(tree)[3].props.value).toBe("2400"); expect(inputs(tree)[4].props.value).toBe("5.5");
    expect(text(byId("inflation-active-assumptions"))).toContain(money(2400));
    expect(text(byId("inflation-active-assumptions"))).toContain(locale === "pl" ? "5,5%" : "5.5%");
    for (const [index, raw] of ["1000", "2", "10", "100", "10"].entries()) tree = change(tree, index, raw);
    expect(text(byId("inflation-active-assumptions"))).toContain(money(100)); expect(text(byId("inflation-active-assumptions"))).toContain("10%");
    const chart = nodes(tree).find(node => node.type === Chart)!;
    // Hand derivation: inflation 1.1^2 = 1.21; cash1000; saving1000+100+100=1200;
    // nominal model: 1000*1.1+100=1200, then1200*1.1+100=1420. All three divide by1.21.
    const expected = [100000 / 121, 120000 / 121, 142000 / 121];
    const keys = ["Cash only", "Saving habit", "Long-term investing scenario"] as const;
    expect(chart.props.currency).toBe("PLN"); expect(chart.props.data).toHaveLength(3);
    keys.forEach((key, index) => expect(chart.props.data!.at(-1)![key]).toBeCloseTo(expected[index], 8));
    const table = byId("inflation-summary"); expect(table.type).toBe("table");
    const values = nodes(table).filter(node => node.type === "td"); expect(values).toHaveLength(3);
    values.forEach((cell, index) => expect(text(cell)).toBe(money(expected[index])));
    expect(text(byId("inflation-real-value"))).toBe(money(expected[0]));
  });
});

function testId(tree: unknown, id: string) { const match = nodes(tree).find(node => node.props["data-testid"] === id); expect(match, id).toBeDefined(); return match!; }
function choose(raw: readonly string[]) { let tree = render(); expect(raw).toHaveLength(5); raw.forEach((value, index) => { tree = change(tree, index, value); }); return tree; }
function visibleMoney(locale: "pl" | "en", value: number) { return new Intl.NumberFormat(locale, { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
function endpoint(tree: unknown) { const chart = nodes(tree).find(node => node.type === Chart); expect(chart).toBeDefined(); return chart!.props.data!.at(-1)!; }
function assertVisibleEndpoint(tree: unknown, locale: "pl" | "en", values: readonly number[]) {
  const keys = ["Cash only", "Saving habit", "Long-term investing scenario"] as const;
  keys.forEach((key, index) => expect(endpoint(tree)[key]).toBeCloseTo(values[index], 8));
  const cells = nodes(testId(tree, "inflation-summary")).filter(node => node.type === "td"); expect(cells).toHaveLength(3);
  cells.forEach((cell, index) => expect(text(cell)).toBe(visibleMoney(locale, values[index])));
}

describe("independent C14 actual five-field acceptance", () => {
  it.each(["pl", "en"] as const)("%s all raw fields enforce their bounds, retain invalid drafts and restore guarded output", locale => {
    fixture.locale = locale; let tree = render();
    for (const [index, invalid, valid] of [[0, "1000000000001", "20000"], [1, "101", "5"], [2, "-100", "7"], [3, "-1", "2400"], [4, "-101", "5.5"]] as const) {
      tree = change(tree, index, invalid); expect(inputs(tree)[index].props.value).toBe(invalid); expect(inputs(tree)[index].props["aria-invalid"]).toBe(true); assertSuppressed(tree);
      expect(nodes(tree).filter(node => node.props["data-testid"] === "inflation-summary" || node.props["data-testid"] === "inflation-results")).toHaveLength(0);
      tree = change(tree, index, valid); expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(0); expect(nodes(tree).find(node => node.type === Chart)).toBeDefined();
    }
  });
  it.each(["pl", "en"] as const)("%s decimal dot/comma meaning survives locale changes without reinterpreting raw values", locale => {
    fixture.locale = locale; let tree = choose(["1000,5", "1", "0", "0", "0"]); assertVisibleEndpoint(tree, locale, [1000.5, 1000.5, 1000.5]);
    expect(inputs(tree)[0].props.value).toBe("1000,5"); const other = locale === "pl" ? "en" : "pl"; fixture.locale = other; tree = render();
    expect(inputs(tree)[0].props.value).toBe("1000,5"); assertVisibleEndpoint(tree, other, [1000.5, 1000.5, 1000.5]);
    tree = change(tree, 0, "1,000"); assertVisibleEndpoint(tree, other, [1, 1, 1]);
    tree = change(tree, 0, "1.000"); assertVisibleEndpoint(tree, other, [1, 1, 1]);
    for (const invalid of ["1,000.00", "1 000", "1e3", "Infinity"]) { tree = change(tree, 0, invalid); expect(inputs(tree)[0].props.value).toBe(invalid); assertSuppressed(tree); }
  });
  it.each(["pl", "en"] as const)("%s zero amount and zero period are valid rather than blank fallbacks", locale => {
    fixture.locale = locale; let tree = choose(["0", "0", "-99", "100", "-100"]);
    assertVisibleEndpoint(tree, locale, [0, 0, 0]); expect(text(testId(tree, "inflation-change"))).toBe(visibleMoney(locale, 0));
    tree = change(tree, 0, "250"); assertVisibleEndpoint(tree, locale, [250, 250, 250]);
    tree = change(tree, 1, "1"); tree = change(tree, 2, "0"); assertVisibleEndpoint(tree, locale, [250, 350, 100]);
  });
  it.each(["pl", "en"] as const)("%s nominal loss and deflation preserve signed purchasing-power change and common base-year endpoints", locale => {
    fixture.locale = locale; let tree = choose(["1000", "2", "0", "0", "-50"]);
    assertVisibleEndpoint(tree, locale, [1000, 1000, 250]); expect(text(testId(tree, "inflation-change"))).toBe(visibleMoney(locale, 0));
    tree = change(tree, 2, "-10"); assertVisibleEndpoint(tree, locale, [100000 / 81, 100000 / 81, 25000 / 81]);
    expect(text(testId(tree, "inflation-change"))).toBe(visibleMoney(locale, 100000 / 81 - 1000));
    expect(nodes(tree).find(node => node.type === Header)!.props.readText).toContain(visibleMoney(locale, 100000 / 81 - 1000));
  });
  it.each(["pl", "en"] as const)("%s in-range assumptions with unrepresentable monetary intermediates suppress every output until edited", locale => {
    fixture.locale = locale; let tree = choose(["1000000000000", "2", "0", "0", "100"]); assertSuppressed(tree);
    expect(inputs(tree).map(input => input.props.value)).toEqual(["1000000000000", "2", "0", "0", "100"]);
    expect(inputs(tree).every(input => !input.props["aria-invalid"])).toBe(true);
    expect(text(testId(tree, "inflation-error"))).not.toMatch(/NaN|Infinity/); tree = change(tree, 0, "1000"); assertVisibleEndpoint(tree, locale, [1000, 1000, 4000]);
  });
  it.each(["pl", "en"] as const)("%s edits, locale changes and unmount stop stale speech while fresh voice text matches current assumptions", locale => {
    fixture.locale = locale; let tree = render(); fixture.stopVoice.mockClear();
    tree = change(tree, 0, "1000"); expect(fixture.stopVoice).toHaveBeenCalledTimes(1);
    tree = change(tree, 3, "100"); expect(fixture.stopVoice).toHaveBeenCalledTimes(2);
    tree = change(tree, 4, "10"); expect(fixture.stopVoice).toHaveBeenCalledTimes(3);
    const spoken = nodes(tree).find(node => node.type === Header)!.props.readText!;
    expect(spoken).toContain(visibleMoney(locale, 1000)); expect(spoken).toContain(visibleMoney(locale, 100)); expect(spoken).toContain("10%");
    expect(spoken).not.toContain(visibleMoney(locale, 2400));
    const other = locale === "pl" ? "en" : "pl"; fixture.locale = other; tree = render(); expect(fixture.stopVoice).toHaveBeenCalledTimes(5);
    expect(nodes(tree).find(node => node.type === Header)!.props.readText).toContain(visibleMoney(other, 1000));
    tree = change(tree, 0, ""); assertSuppressed(tree); expect(fixture.stopVoice).toHaveBeenCalledTimes(6);
    fixture.effects.forEach(effect => effect.cleanup?.()); fixture.effects.clear(); expect(fixture.stopVoice).toHaveBeenCalledTimes(7);
  });
  it.each(["pl", "en"] as const)("%s real input labels/hints and actual chart retain accessible semantics and localized endpoints", locale => {
    fixture.locale = locale; const tree = choose(["1000", "2", "10", "100", "10"]), fields = inputs(tree);
    expect(fields).toHaveLength(5);
    for (const [index, name] of ["amount", "years", "rate", "contribution", "return"].entries()) {
      const input = fields[index], id = "inflation-input-" + name; expect(input.props.id).toBe(id); expect(input.props["data-testid"]).toBe(id);
      expect(input.props.inputMode).toBe(name === "years" ? "numeric" : "decimal"); expect(input.props["aria-describedby"]).toBe(id + "-hint inflation-decimal-hint");
      const label = nodes(tree).find(node => node.type === "label" && node.props.htmlFor === id); expect(label).toBeDefined(); expect(text(label)).not.toBe("");
      expect(nodes(tree).find(node => node.props.id === id + "-hint")).toBeDefined();
    }
    const chartElement = nodes(tree).find(node => node.type === Chart)!;
    const actualChart = Chart({ data: chartElement.props.data!, currency: chartElement.props.currency!, locale });
    expect(actualChart.props.role).toBe("img"); expect(actualChart.props["aria-label"]).toContain(locale === "pl" ? "Hipotetyczny" : "Hypothetical");
    const axis = nodes(actualChart).find(node => "tickFormatter" in node.props && (node.props as { dataKey?: string }).dataKey === "year")!;
    expect((axis.props as { tickFormatter: (year: string) => string }).tickFormatter("Y2")).toBe(locale === "pl" ? "Rok 2" : "Year 2");
    const chartPayload = nodes(actualChart).find(node => node.props.data)!; expect(chartPayload.props.data).not.toBe(chartElement.props.data); expect(chartPayload.props.data).toEqual(chartElement.props.data);
  });
});
