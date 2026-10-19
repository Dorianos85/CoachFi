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
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: "c66-voice-props" }));
vi.mock("@/components/read-aloud-button", () => ({ ReadAloudButton: "c66-read-props" }));

type Props = { children?: unknown; label?: string; value?: string | number; text?: string; locale?: string; className?: string;
  role?: string; id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; type?: string; min?: string | number; max?: string | number; step?: string | number; checked?: boolean;
  onClick?: () => void; onChange?: (event: { target: { value: string; checked?: boolean } }) => void };
type Node = ReactElement<Props>;
type View = { price: Node; days: Node; unusedName: Node; unusedValue: Node; add: Node; total: string; amounts: string[]; decisionLabels: number;
  impulse: string[]; returnStatus: string[]; alerts: string[]; alertIds: Array<string | undefined>; rows: Array<{ name: string; amount: string; remove: Node }>;
  voices: Array<{ text?: string; label?: string; locale?: string }>; all: Node[]; controls: { used: unknown; days: unknown; window: unknown; receipt: boolean | undefined } };
let Shopping: typeof import("@/app/shopping/page").default;
let store: typeof import("@/lib/product-storage"), owner: StorageOwnershipSnapshot, handle: PersonalStorageHandle;
let local: Map<string, string>, session: Map<string, string>, writes: unknown[], initialRaw: { local: Array<[string, string]>; session: Array<[string, string]> };
const COPY = {
  pl: { price: "Cena", unusedName: "Nieużywana rzecz", unusedValue: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń",
    total: "Możliwa gotówka z nieużywanych rzeczy", recoverable: "Potencjalna gotówka do odzyskania", read: "Odczytaj decyzję coacha", decision: "Decyzja coacha",
    impulse: "Wynik impulsu", returnStatus: "Status zwrotu", used: "Ile razy użyte?", days: "Dni od zakupu", window: "Okno zwrotu w dniach", error: "Podaj cenę od 0 do", daysError: "Podaj liczbę dni od zakupu równą 0 lub większą.", open: "Zwrot może być jeszcze możliwy", closed: "Zwrot prawdopodobnie zamknięty" },
  en: { price: "Price", unusedName: "Unused thing", unusedValue: "Estimated sale value", add: "Add item", remove: "Remove",
    total: "Possible cash from unused things", recoverable: "Potential cash to recover", read: "Read Coach decision", decision: "Coach decision",
    impulse: "Impulse score", returnStatus: "Return status", used: "How many times have you used it?", days: "Days since purchase", window: "Return window in days", error: "Enter a price from 0 to", daysError: "Enter the days since purchase as a number of 0 or more.", open: "Return may still be possible", closed: "Return is probably closed" },
};
const LIMITS = "Actual ShoppingPage emitted days/price/receipt/Add/Remove handlers with actual helper imports, real i18n/Intl and pure local TextField/NumberField/MetricBox. Persistent React state/memo/ref/callback emulator only; no ReactDOM/native input sanitization/scheduling/focus. Real ready-guest product-storage and separate synthetic physical Maps, exact owner/raw non-mutation. Voice/read leaves are inert generated-props markers; no speech/provider/cloud; rejecting fetch trap. Twelve PLEN grouped cases, not twelve old bugs. Default3 preserved; raw30-to-blank is reproduction, not a default change. Finite fractional/very-large days admitted without integer or maximum-days policy; raw decimal/exponent contract and nonzero-underflow refusal, not arbitrary lexical precision. C65 price/60percent whole-PLN sell estimate and C64 unused audit are controls, not new fullfinancial/policy acceptance. Other seven locales not executed. No new export imported at baseline.";
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
function one(values: Node[], label: string) { if (values.length !== 1) throw Error("C66 expected one " + label + ", observed " + values.length); return values[0]; }
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
  return { all, price: field(all, c.price), days: field(all, c.days), unusedName: field(all, c.unusedName), unusedValue: field(all, c.unusedValue),
    add: one(all.filter(node => !!node.props.onClick && normalize(text(node)) === c.add), "actual Add"), total: String(one(all.filter(node => node.props.label === c.total && typeof node.props.value === "string"), "always-present unused total").props.value),
    amounts: all.filter(node => node.type === "p" && node.props.className?.includes("text-4xl")).map(node => text(node)),
    decisionLabels: all.filter(node => node.type === "p" && normalize(text(node)) === c.decision).length,
    impulse: metric(c.impulse), returnStatus: metric(c.returnStatus), alerts: all.filter(node => node.props.role === "alert").map(node => normalize(text(node))), alertIds: all.filter(node => node.props.role === "alert").map(node => node.props.id), rows,
    voices: all.filter(node => node.type === "c66-voice-props").map(node => ({ text: node.props.text, label: node.props.label, locale: node.props.locale })),
    controls: { used: field(all, c.used).props.value, days: field(all, c.days).props.value, window: field(all, c.window).props.value,
      receipt: one(all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt").props.checked } };
}
function fresh() { fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); return render(); }
function input(control: Node, value: string) { if (!control.props.onChange) throw Error("C66 missing actual input handler"); control.props.onChange({ target: { value } }); return render(); }
function price(raw: string) { return input(render().price, raw); }
function days(raw: string) { return input(render().days, raw); }
function receipt(checked: boolean) { one(render().all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt").props.onChange?.({ target: { value: "", checked } }); return render(); }
function draft(name: string, value: string) { input(render().unusedName, name); return input(render().unusedValue, value); }
function add(name: string, value: string) { draft(name, value).add.props.onClick?.(); return render(); }
function summary(v: View) { return { days: String(v.days.props.value), daysInput: { type: v.days.props.type, min: v.days.props.min, max: v.days.props.max, step: v.days.props.step, ariaInvalid: v.days.props["aria-invalid"], describedBy: v.days.props["aria-describedby"] }, price: String(v.price.props.value), input: { type: v.price.props.type, min: v.price.props.min, max: v.price.props.max, step: v.price.props.step, ariaInvalid: v.price.props["aria-invalid"], describedBy: v.price.props["aria-describedby"] },
  amounts: v.amounts, decisionLabels: v.decisionLabels, impulse: v.impulse, returnStatus: v.returnStatus, alerts: v.alerts, alertIds: v.alertIds, total: v.total,
  unusedDraft: { name: v.unusedName.props.value, value: v.unusedValue.props.value }, rows: v.rows.map(({ name, amount }) => ({ name, amount })), voices: v.voices, controls: v.controls }; }
function raw() { return { local: [...local], session: [...session] }; }
function observe(name: string, data: unknown) { console.log("C66_SHOPPING_DAYS_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data, raw: raw(), writes,
  owner: store.getStorageOwnershipSnapshot(), current: handle.isCurrent(), limits: LIMITS })); }
function money(cents: bigint) { return normalize(new Intl.NumberFormat(fixture.locale === "pl" ? "pl-PL" : "en-US", {
  style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(cents) / 100)); }
function unused(view: View, expected: Array<[string, bigint]>) {
  expect(normalize(view.total)).toBe(money(expected.reduce((sum, [, cents]) => sum + cents, BigInt("0"))));
  expect(view.rows.map(row => [row.name, normalize(row.amount)])).toEqual(expected.map(([name, cents]) => [name, money(cents)]));
}
function valid(view: View, inputCents: bigint, sell = false, returnOpen = !sell) {
  // Independent exact positive rational rounding of the preserved 60% whole-PLN estimate.
  const result = sell ? ((inputCents * BigInt("3") + BigInt("250")) / BigInt("500")) * BigInt("100") : inputCents;
  expect(view.price.props["aria-invalid"]).not.toBe(true); expect(view.price.props["aria-describedby"]).toBeUndefined();
  expect(view.days.props["aria-invalid"]).not.toBe(true); expect(view.days.props["aria-describedby"]).toBeUndefined();
  expect(view.alerts).toEqual([]); expect(view.amounts.map(normalize)).toEqual([money(result)]); expect(view.decisionLabels).toBe(1);
  expect(view.impulse).toHaveLength(1); expect(view.returnStatus).toEqual([COPY[fixture.locale][returnOpen ? "open" : "closed"]]); expect(view.voices).toHaveLength(1);
  const voice = view.voices[0]; expect(voice.locale).toBe(fixture.locale); expect(voice.label).toBe(COPY[fixture.locale].read);
  expect(normalize(voice.text ?? "")).toContain(COPY[fixture.locale].recoverable + ": " + money(result));
  expect(view.amounts.join(" ") + voice.text).not.toMatch(/Infinity|NaN|∞/);
}
function unavailable(view: View, rawDays: string, rawPrice = "249", badDays = true, badPrice = false) {
  expect(String(view.days.props.value), "unknown days must not become bought-today zero").toBe(rawDays);
  expect(String(view.price.props.value)).toBe(rawPrice);
  for (const [control, bad, message] of [[view.days, badDays, COPY[fixture.locale].daysError], [view.price, badPrice, COPY[fixture.locale].error]] as const) {
    if (bad) {
      expect(control.props["aria-invalid"]).toBe(true);
      const references = (control.props["aria-describedby"] ?? "").split(/\s+/).filter(Boolean);
      expect(references).toHaveLength(1);
      const targets = view.all.filter(node => node.props.id === references[0]);
      expect(targets).toHaveLength(1); expect(targets[0].props.role).toBe("alert"); expect(normalize(text(targets[0]))).toContain(message);
    } else { expect(control.props["aria-invalid"]).not.toBe(true); expect(control.props["aria-describedby"]).toBeUndefined(); }
  }
  expect(view.alerts).toHaveLength(Number(badDays) + Number(badPrice));
  if (badDays && badPrice) expect(view.days.props["aria-describedby"]).not.toBe(view.price.props["aria-describedby"]);
  expect(view.amounts, "no unsupported purchase amount").toEqual([]); expect(view.decisionLabels).toBe(0);
  expect(view.impulse).toEqual([]); expect(view.returnStatus, "no reopened return status for unknown days").toEqual([]);
  expect(view.voices, "no unsupported decision readout").toEqual([]);
}
function physical(values: Map<string, string>, area: string) { return { getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { writes.push({ area, kind: "set", key, value }); values.set(key, value); },
  removeItem: (key: string) => { writes.push({ area, kind: "remove", key }); values.delete(key); }, clear: () => { writes.push({ area, kind: "clear" }); values.clear(); } }; }

beforeEach(async () => {
  vi.resetModules(); fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); writes = [];
  local = new Map([["coachfi-tokens", "125"], ["coachfi-srs", ' [{"id":"inflation","repetitions":0}] '], ["coachfi-user", ' {"name":"C66 synthetic","setupDone":true} '],
    ["coachfi-lesson-steps", ' {"retirement":2} '], ["coachfi-learn-manual", ' {"inflation":"completed"} '], ["C66_UNRELATED", "local-retained"]]);
  session = new Map([["coachfi-tokens", "321"], ["coachfi-srs", " [] "], ["coachfi-user", '{"name":"C66_SESSION","setupDone":true}'], ["C66_UNRELATED", "session-retained"]]);
  const win = new EventTarget(); Object.assign(win, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session") });
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C66 unauthorized network"); }));
  store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); handle = store.captureCurrentPersonalStorage(); owner = store.getStorageOwnershipSnapshot(); initialRaw = raw();
  Shopping = (await import("@/app/shopping/page")).default;
});
afterEach(() => { expect(raw()).toEqual(initialRaw); expect(writes).toEqual([]); expect(store.getStorageOwnershipSnapshot()).toBe(owner); expect(handle.isCurrent()).toBe(true);
  expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C66 actual Shopping purchase days PL/EN integrity", () => {
  for (const locale of ["pl", "en"] as const) {
    it(locale + " preserves default3 price249 and existing purchase controls", () => {
      fixture.locale = locale; const view = render(); observe("default", summary(view));
      expect(String(view.days.props.value)).toBe("3"); expect(String(view.price.props.value)).toBe("249");
      valid(view, BigInt("24900")); unused(view, []);
      expect(String(view.controls.used)).toBe("0"); expect(String(view.controls.window)).toBe("14"); expect(view.controls.receipt).toBe(true);
    });
    it(locale + " withholds the blank after closed30 while explicit zero and recovery remain supported", () => {
      fixture.locale = locale; const closed = days("30"), blank = days(""), today = days("0"), blankAgain = days(""), recovered = days("3");
      observe("closed-blank-zero-recovery", { closed: summary(closed), blank: summary(blank), today: summary(today), blankAgain: summary(blankAgain), recovered: summary(recovered) });
      unavailable(blank, ""); unavailable(blankAgain, ""); valid(closed, BigInt("24900"), true); valid(today, BigInt("24900")); valid(recovered, BigInt("24900"));
      [closed, blank, today, blankAgain, recovered].forEach(view => unused(view, []));
    });
    it(locale + " admits finite fractional scientific boundary and large days without a new maximum or integer rule", () => {
      fixture.locale = locale;
      const samples: Array<[string, boolean]> = [["0.5", true], ["1e-3", true], ["14", true], ["14.0001", false], ["1e2", false], ["1e308", false], ["-0", true], ["0.000", true], ["0e-999", true], ["-0e-999", true]];
      const rows = samples.map(([raw, open]) => ({ raw, open, view: days(raw) })); observe("admitted-days", rows.map(row => ({ raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => { valid(row.view, BigInt("24900"), !row.open); unused(row.view, []); expect(String(row.view.days.props.value)).toBe(row.raw); });
      expect(rows[0].view.days.props.step).toBe("any"); expect(rows[0].view.days.props.max).toBeUndefined();
    });
    it(locale + " refuses negative nonfinite malformed and nonzero-underflow days without stale purchase results", () => {
      fixture.locale = locale;
      const samples = [" ", "-1", "-0.5", "1e309", "NaN", "Infinity", "0x10", "1e-999", "-1e-999"];
      const rows = samples.map(raw => { fresh(); days("30"); return { raw, view: days(raw) }; });
      observe("unsupported-days", rows.map(row => ({ raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => { unavailable(row.view, row.raw); unused(row.view, []); expect(String(row.view.controls.used)).toBe("0"); expect(String(row.view.controls.window)).toBe("14"); expect(row.view.controls.receipt).toBe(true); });
    });
    it(locale + " fences days and price independently with unique live error references in either recovery order", () => {
      fixture.locale = locale; days("30"); const dayBad = days(""), bothBad = price(""), priceOnly = days("3"), supported = price("0.29");
      receipt(false); const sold = render(), dayBadAgain = days(""), recoveredNoReceipt = days("0");
      days(""); const bothAgain = price(""), daysOnly = price("0.29"), recoveredDaysLast = days("0");
      observe("independent-price-days", { dayBad: summary(dayBad), bothBad: summary(bothBad), priceOnly: summary(priceOnly), supported: summary(supported), sold: summary(sold), dayBadAgain: summary(dayBadAgain), recoveredNoReceipt: summary(recoveredNoReceipt), bothAgain: summary(bothAgain), daysOnly: summary(daysOnly), recoveredDaysLast: summary(recoveredDaysLast) });
      unavailable(dayBad, ""); unavailable(bothBad, "", "", true, true); unavailable(priceOnly, "3", "", false, true);
      valid(supported, BigInt("29")); valid(sold, BigInt("29"), true); unavailable(dayBadAgain, "", "0.29"); valid(recoveredNoReceipt, BigInt("29"), true);
      unavailable(bothAgain, "", "", true, true); unavailable(daysOnly, "", "0.29"); valid(recoveredDaysLast, BigInt("29"), true);
      expect(recoveredNoReceipt.controls.receipt).toBe(false); expect(recoveredDaysLast.controls.receipt).toBe(false); unused(recoveredDaysLast, []);
    });
    it(locale + " preserves C64 unused draft Add Remove and total while days are unavailable", () => {
      fixture.locale = locale; add("kept", "0.29"); draft("pending", "12.34"); const bad = days(""), appended = add("new", "0.01");
      appended.rows[0].remove.props.onClick?.(); const removed = render(), recovered = days("3");
      observe("unused-independence", { bad: summary(bad), appended: summary(appended), removed: summary(removed), recovered: summary(recovered) });
      unavailable(bad, ""); unused(bad, [["kept", BigInt("29")]]); expect(bad.unusedName.props.value).toBe("pending"); expect(bad.unusedValue.props.value).toBe("12.34");
      unavailable(appended, ""); unused(appended, [["kept", BigInt("29")], ["new", BigInt("1")]]);
      unavailable(removed, ""); unused(removed, [["new", BigInt("1")]]); valid(recovered, BigInt("24900")); unused(recovered, [["new", BigInt("1")]]);
    });
  }
});
