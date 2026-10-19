import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle, StorageOwnershipSnapshot } from "@/lib/product-storage";

type Locale = "pl" | "en";
const fixture = vi.hoisted(() => ({ locale: "pl" as Locale, slot: 0, values: new Map<number, unknown>(),
  refs: new Map<number, { current: unknown }>(), memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>() }));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const slot = fixture.slot++, prior = fixture.memos.get(slot);
  if (!prior || !deps || !prior.deps || deps.length !== prior.deps.length || deps.some((value, i) => !Object.is(value, prior.deps?.[i])))
    fixture.memos.set(slot, { deps, value: factory() });
  return fixture.memos.get(slot)?.value;
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = fixture.slot++;
    if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(slot), (next: unknown) => fixture.values.set(slot, typeof next === "function" ? next(fixture.values.get(slot)) : next)];
  },
  useMemo: memo, useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => { const slot = fixture.slot++; if (!fixture.refs.has(slot)) fixture.refs.set(slot, { current: initial }); return fixture.refs.get(slot); },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
// Only downstream leaves: actual ShoppingPage constructs decision/voice props; no VoiceContext or speech runs.
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: "c65-voice-props" }));
vi.mock("@/components/read-aloud-button", () => ({ ReadAloudButton: "c65-read-props" }));

type Props = { children?: unknown; label?: string; value?: string | number; text?: string; locale?: string; className?: string;
  role?: string; id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; type?: string; min?: string | number; max?: string | number; step?: string | number; checked?: boolean;
  onClick?: () => void; onChange?: (event: { target: { value: string; checked?: boolean } }) => void };
type Node = ReactElement<Props>;
type View = { price: Node; unusedName: Node; unusedValue: Node; add: Node; total: string; amounts: string[]; decisionLabels: number;
  impulse: string[]; returnStatus: string[]; alerts: string[]; alertIds: Array<string | undefined>; rows: Array<{ name: string; amount: string; remove: Node }>;
  voices: Array<{ text?: string; label?: string; locale?: string }>; all: Node[]; controls: { used: unknown; days: unknown; window: unknown; receipt: boolean | undefined } };
let Shopping: typeof import("@/app/shopping/page").default;
let store: typeof import("@/lib/product-storage"), owner: StorageOwnershipSnapshot, handle: PersonalStorageHandle;
let local: Map<string, string>, session: Map<string, string>, writes: unknown[], initialRaw: { local: Array<[string, string]>; session: Array<[string, string]> };
const COPY = {
  pl: { price: "Cena", unusedName: "Nieużywana rzecz", unusedValue: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń",
    total: "Możliwa gotówka z nieużywanych rzeczy", recoverable: "Potencjalna gotówka do odzyskania", read: "Odczytaj decyzję coacha", decision: "Decyzja coacha",
    impulse: "Wynik impulsu", returnStatus: "Status zwrotu", used: "Ile razy użyte?", days: "Dni od zakupu", window: "Okno zwrotu w dniach", error: "Podaj cenę od 0 do" },
  en: { price: "Price", unusedName: "Unused thing", unusedValue: "Estimated sale value", add: "Add item", remove: "Remove",
    total: "Possible cash from unused things", recoverable: "Potential cash to recover", read: "Read Coach decision", decision: "Coach decision",
    impulse: "Impulse score", returnStatus: "Return status", used: "How many times have you used it?", days: "Days since purchase", window: "Return window in days", error: "Enter a price from 0 to" },
};
const LIMITS = "Actual ShoppingPage price/input/receipt/Add/Remove handlers and generated decision voice props, real i18n/Intl and existing helper imports through actual page. Persistent state/memo/ref/callback React emulator; actual pure local TextField/NumberField/MetricBox invoked, other UI trees retained. No new parser export imported at baseline. Real product-storage ready guest with separate synthetic physical Maps/current-snapshot non-mutation checks. VoiceButton/ReadAloudButton inert leaf markers and fetch rejecting trap. Numeric represented-cent semantics, not lexical arbitrary precision. Existing sell Math.round(price*0.6) remains a legacy whole-PLN estimate, not a validated recommendation. No ReactDOM/native scheduling/input sanitization/focus/AT/audio/provider/auth/cloud/real profiles/other seven locale or production acceptance. Counts/days policy deferred. Twelve cases contain grouped frames, not twelve historic defects.";
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  const output = typeof node.type === "function" && ["TextField", "NumberField", "MetricBox"].includes(node.type.name)
    ? (node.type as (props: Props) => unknown)(node.props) : null;
  return [node, ...nodes(node.props.children), ...nodes(output)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function one(values: Node[], label: string) { if (values.length !== 1) throw Error("C65 expected one " + label + ", observed " + values.length); return values[0]; }
function field(all: Node[], label: string) {
  const actualLabel = one(all.filter(node => node.type === "label" && normalize(text(node)) === label), "actual label " + label);
  return one(nodes(actualLabel).filter(node => node.type === "input"), "emitted input " + label);
}
function render(): View {
  fixture.slot = 0; const all = nodes(Shopping()), c = COPY[fixture.locale];
  const rows = all.filter(node => node.type === "div" && (Array.isArray(node.props.children) ? node.props.children : [node.props.children])
    .some(child => child && typeof child === "object" && "props" in child && (child as Node).type === "button" && normalize(text(child)) === c.remove))
    .map(row => { const children = nodes(row), p = children.filter(node => node.type === "p");
      return { name: text(p[0]), amount: text(p[1]), remove: one(children.filter(node => node.type === "button" && normalize(text(node)) === c.remove), "row Remove") }; });
  const metric = (label: string) => all.filter(node => node.props.label === label && typeof node.props.value === "string").map(node => String(node.props.value));
  return { all, price: field(all, c.price), unusedName: field(all, c.unusedName), unusedValue: field(all, c.unusedValue),
    add: one(all.filter(node => !!node.props.onClick && normalize(text(node)) === c.add), "actual Add"), total: String(one(all.filter(node => node.props.label === c.total && typeof node.props.value === "string"), "always-present unused total").props.value),
    amounts: all.filter(node => node.type === "p" && node.props.className?.includes("text-4xl")).map(node => text(node)),
    decisionLabels: all.filter(node => node.type === "p" && normalize(text(node)) === c.decision).length,
    impulse: metric(c.impulse), returnStatus: metric(c.returnStatus), alerts: all.filter(node => node.props.role === "alert").map(node => normalize(text(node))), alertIds: all.filter(node => node.props.role === "alert").map(node => node.props.id), rows,
    voices: all.filter(node => node.type === "c65-voice-props").map(node => ({ text: node.props.text, label: node.props.label, locale: node.props.locale })),
    controls: { used: field(all, c.used).props.value, days: field(all, c.days).props.value, window: field(all, c.window).props.value,
      receipt: one(all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt").props.checked } };
}
function fresh() { fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); return render(); }
function input(control: Node, value: string) { if (!control.props.onChange) throw Error("C65 missing actual input handler"); control.props.onChange({ target: { value } }); return render(); }
function price(raw: string) { return input(render().price, raw); }
function receipt(checked: boolean) { one(render().all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt").props.onChange?.({ target: { value: "", checked } }); return render(); }
function draft(name: string, value: string) { input(render().unusedName, name); return input(render().unusedValue, value); }
function add(name: string, value: string) { draft(name, value).add.props.onClick?.(); return render(); }
function summary(v: View) { return { price: String(v.price.props.value), input: { type: v.price.props.type, min: v.price.props.min, max: v.price.props.max, step: v.price.props.step, ariaInvalid: v.price.props["aria-invalid"], describedBy: v.price.props["aria-describedby"] },
  amounts: v.amounts, decisionLabels: v.decisionLabels, impulse: v.impulse, returnStatus: v.returnStatus, alerts: v.alerts, alertIds: v.alertIds, total: v.total,
  unusedDraft: { name: v.unusedName.props.value, value: v.unusedValue.props.value }, rows: v.rows.map(({ name, amount }) => ({ name, amount })), voices: v.voices, controls: v.controls }; }
function raw() { return { local: [...local], session: [...session] }; }
function observe(name: string, data: unknown) { console.log("C65_SHOPPING_PRICE_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data, raw: raw(), writes,
  owner: store.getStorageOwnershipSnapshot(), current: handle.isCurrent(), limits: LIMITS })); }
function money(cents: bigint) { return normalize(new Intl.NumberFormat(fixture.locale === "pl" ? "pl-PL" : "en-US", {
  style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(cents) / 100)); }
function unused(view: View, expected: Array<[string, bigint]>) {
  expect(normalize(view.total)).toBe(money(expected.reduce((sum, [, cents]) => sum + cents, BigInt("0"))));
  expect(view.rows.map(row => [row.name, normalize(row.amount)])).toEqual(expected.map(([name, cents]) => [name, money(cents)]));
}
function valid(view: View, inputCents: bigint, sell = false) {
  // Independent exact positive rational rounding of the preserved 60% whole-PLN estimate.
  const result = sell ? ((inputCents * BigInt("3") + BigInt("250")) / BigInt("500")) * BigInt("100") : inputCents;
  expect(view.price.props["aria-invalid"]).not.toBe(true); expect(view.price.props["aria-describedby"]).toBeUndefined();
  expect(view.alerts).toEqual([]); expect(view.amounts.map(normalize)).toEqual([money(result)]); expect(view.decisionLabels).toBe(1);
  expect(view.impulse).toHaveLength(1); expect(view.returnStatus).toHaveLength(1); expect(view.voices).toHaveLength(1);
  const voice = view.voices[0]; expect(voice.locale).toBe(fixture.locale); expect(voice.label).toBe(COPY[fixture.locale].read);
  expect(normalize(voice.text ?? "")).toContain(COPY[fixture.locale].recoverable + ": " + money(result));
  expect(view.amounts.join(" ") + voice.text).not.toMatch(/Infinity|NaN|∞/);
}
function invalid(view: View, expectedRaw: string) {
  expect(String(view.price.props.value), "unsupported current raw price is retained").toBe(expectedRaw);
  expect(view.price.props["aria-invalid"]).toBe(true); const references = (view.price.props["aria-describedby"] ?? "").split(/\s+/).filter(Boolean);
  expect(references).toHaveLength(1); expect(view.alertIds.filter(id => id === references[0])).toHaveLength(1);
  expect(view.alerts).toHaveLength(1); expect(view.alerts[0]).toContain(COPY[fixture.locale].error); expect(view.alerts[0]).toContain(money(BigInt("100000000000000")));
  expect(view.amounts, "no unsupported purchase amount").toEqual([]); expect(view.decisionLabels).toBe(0);
  expect(view.impulse).toEqual([]); expect(view.returnStatus).toEqual([]); expect(view.voices, "no stale purchase decision readout").toEqual([]);
}
function physical(values: Map<string, string>, area: string) { return { getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { writes.push({ area, kind: "set", key, value }); values.set(key, value); },
  removeItem: (key: string) => { writes.push({ area, kind: "remove", key }); values.delete(key); }, clear: () => { writes.push({ area, kind: "clear" }); values.clear(); } }; }

beforeEach(async () => {
  vi.resetModules(); fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); writes = [];
  local = new Map([["coachfi-tokens", "125"], ["coachfi-srs", ' [{"id":"inflation","repetitions":0}] '], ["coachfi-user", ' {"name":"C65 synthetic","setupDone":true} '],
    ["coachfi-lesson-steps", ' {"retirement":2} '], ["coachfi-learn-manual", ' {"inflation":"completed"} '], ["C65_UNRELATED", "local-retained"]]);
  session = new Map([["coachfi-tokens", "321"], ["coachfi-srs", " [] "], ["coachfi-user", '{"name":"C65_SESSION","setupDone":true}'], ["C65_UNRELATED", "session-retained"]]);
  const win = new EventTarget(); Object.assign(win, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session") });
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C65 unauthorized network"); }));
  store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); handle = store.captureCurrentPersonalStorage(); owner = store.getStorageOwnershipSnapshot(); initialRaw = raw();
  Shopping = (await import("@/app/shopping/page")).default;
});
afterEach(() => { expect(raw()).toEqual(initialRaw); expect(writes).toEqual([]); expect(store.getStorageOwnershipSnapshot()).toBe(owner); expect(handle.isCurrent()).toBe(true);
  expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C65 actual Shopping purchase price PL/EN integrity", () => {
  for (const locale of ["pl", "en"] as const) {
    it(locale + " default249 keeps the existing supported purchase and count controls", () => {
      fixture.locale = locale; const view = render(); observe("default", summary(view));
      expect(String(view.price.props.value)).toBe("249"); valid(view, BigInt("24900")); unused(view, []);
      expect({ ...view.controls, used: String(view.controls.used), days: String(view.controls.days), window: String(view.controls.window) }).toEqual({ used: "0", days: "3", window: "14", receipt: true });
    });
    it(locale + " blank price withholds a result while intentional zero remains supported", () => {
      fixture.locale = locale; const empty = price(""), zero = price("0"), emptyAgain = price("");
      observe("blank-zero", { empty: summary(empty), zero: summary(zero), emptyAgain: summary(emptyAgain) });
      invalid(empty, ""); valid(zero, BigInt("0")); invalid(emptyAgain, ""); [empty, zero, emptyAgain].forEach(view => unused(view, []));
    });
    it(locale + " admits represented cents exponents signed zero and the inclusive technical cap", () => {
      fixture.locale = locale;
      const samples: Array<[string, string]> = [["0.29", "29"], ["1e-2", "1"], ["1e2", "10000"], ["1000000000000", "100000000000000"], ["-0", "0"], ["+0", "0"], ["0.000", "0"], ["0e-999", "0"], ["-0e-999", "0"]];
      const rows = samples.map(([raw, cents]) => ({ raw, cents, view: price(raw) })); observe("supported-boundaries", rows.map(row => ({ raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => { valid(row.view, BigInt(row.cents)); unused(row.view, []); expect(String(row.view.price.props.value)).toBe(row.raw); });
    });
    it(locale + " refuses unsupported price without leaving stale decision metrics amount or voice", () => {
      fixture.locale = locale;
      const samples = [" ", "-1", "0.001", "1e-3", "1e308", "1e309", "1e-999", "-1e-999", "1000000000000.01", "NaN", "Infinity", "0x10"];
      const rows = samples.map(raw => { fresh(); price("249"); return { raw, view: price(raw) }; });
      observe("unsupported", rows.map(row => ({ raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => { invalid(row.view, row.raw); unused(row.view, []); expect({ ...row.view.controls, used: String(row.view.controls.used), days: String(row.view.controls.days), window: String(row.view.controls.window) }).toEqual({ used: "0", days: "3", window: "14", receipt: true }); });
    });
    it(locale + " preserves return sell rounding and receipt state through invalid-price recovery", () => {
      fixture.locale = locale; const returned = price("250.25"); receipt(false); const sold = render(), half = price("2.5"), centSell = price("0.29"), unavailable = price("0.001"), recovered = price("100.29");
      observe("return-sell-recovery", { returned: summary(returned), sold: summary(sold), half: summary(half), centSell: summary(centSell), unavailable: summary(unavailable), recovered: summary(recovered) });
      valid(returned, BigInt("25025")); valid(sold, BigInt("25025"), true); valid(half, BigInt("250"), true); valid(centSell, BigInt("29"), true);
      invalid(unavailable, "0.001"); valid(recovered, BigInt("10029"), true); expect({ ...recovered.controls, used: String(recovered.controls.used), days: String(recovered.controls.days), window: String(recovered.controls.window) }).toEqual({ used: "0", days: "3", window: "14", receipt: false });
      expect(String(recovered.price.props.value)).toBe("100.29");
    });
    it(locale + " keeps unused-list handlers and drafts usable while purchase price is unavailable", () => {
      fixture.locale = locale; add("kept", "0.29"); draft("pending", "12.34"); const bad = price("1e308"), appended = add("new", "0.01");
      appended.rows[0].remove.props.onClick?.(); const removed = render(), recovered = price("0.29");
      observe("unused-independence", { bad: summary(bad), appended: summary(appended), removed: summary(removed), recovered: summary(recovered) });
      invalid(bad, "1e308"); unused(bad, [["kept", BigInt("29")]]); expect(bad.unusedName.props.value).toBe("pending"); expect(bad.unusedValue.props.value).toBe("12.34");
      invalid(appended, "1e308"); unused(appended, [["kept", BigInt("29")], ["new", BigInt("1")]]);
      invalid(removed, "1e308"); unused(removed, [["new", BigInt("1")]]); valid(recovered, BigInt("29")); unused(recovered, [["new", BigInt("1")]]);
    });
  }
});