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
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: "c67-voice-props" }));
vi.mock("@/components/read-aloud-button", () => ({ ReadAloudButton: "c67-read-props" }));

type Props = { children?: unknown; label?: string; value?: string | number; text?: string; locale?: string; className?: string;
  role?: string; id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; type?: string; min?: string | number; max?: string | number; step?: string | number; checked?: boolean;
  onClick?: () => void; onChange?: (event: { target: { value: string; checked?: boolean } }) => void };
type Node = ReactElement<Props>;
type View = { price: Node; days: Node; used: Node; window: Node; decisionTitles: string[]; unusedName: Node; unusedValue: Node; add: Node; total: string; amounts: string[]; decisionLabels: number;
  impulse: string[]; returnStatus: string[]; alerts: string[]; alertIds: Array<string | undefined>; rows: Array<{ name: string; amount: string; remove: Node }>;
  voices: Array<{ text?: string; label?: string; locale?: string }>; all: Node[]; controls: { used: unknown; days: unknown; window: unknown; receipt: boolean | undefined; need: unknown; regret: unknown; trigger: unknown } };
let Shopping: typeof import("@/app/shopping/page").default;
let store: typeof import("@/lib/product-storage"), owner: StorageOwnershipSnapshot, handle: PersonalStorageHandle;
let local: Map<string, string>, session: Map<string, string>, writes: unknown[], initialRaw: { local: Array<[string, string]>; session: Array<[string, string]> };
const COPY = {
  pl: { price: "Cena", unusedName: "Nieużywana rzecz", unusedValue: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń",
    total: "Możliwa gotówka z nieużywanych rzeczy", recoverable: "Potencjalna gotówka do odzyskania", read: "Odczytaj decyzję coacha", decision: "Decyzja coacha",
    impulse: "Wynik impulsu", returnStatus: "Status zwrotu", used: "Ile razy użyte?", days: "Dni od zakupu", window: "Okno zwrotu w dniach", error: "Podaj cenę od 0 do", daysError: "Podaj liczbę dni od zakupu równą 0 lub większą.", open: "Zwrot może być jeszcze możliwy", closed: "Zwrot prawdopodobnie zamknięty", need: "Realna potrzeba", regret: "Kac zakupowy", usedError: "Podaj liczbę użyć równą 0 lub większą.", windowError: "Podaj okno zwrotu wynoszące co najmniej 1 dzień.", titles: { return: "Zwróć, jeśli regulamin na to pozwala", sell: "Sprzedaj i zamień bałagan na gotówkę", pause: "Odczekaj przed decyzją", keep: "Zostaw, ale używaj świadomie" } },
  en: { price: "Price", unusedName: "Unused thing", unusedValue: "Estimated sale value", add: "Add item", remove: "Remove",
    total: "Possible cash from unused things", recoverable: "Potential cash to recover", read: "Read Coach decision", decision: "Coach decision",
    impulse: "Impulse score", returnStatus: "Return status", used: "How many times have you used it?", days: "Days since purchase", window: "Return window in days", error: "Enter a price from 0 to", daysError: "Enter the days since purchase as a number of 0 or more.", open: "Return may still be possible", closed: "Return is probably closed", need: "Real need", regret: "Buyer's remorse", usedError: "Enter the number of uses as a number of 0 or more.", windowError: "Enter a return window of at least 1 day.", titles: { return: "Return it if the policy allows it", sell: "Sell it and turn clutter into cash", pause: "Pause before deciding", keep: "Keep it, but use it intentionally" } },
};
const LIMITS = "Actual ShoppingPage/emitted NumberField, days/price/range/select/receipt/Add/Remove handlers and actual imported helpers with real i18n/Intl. Explicit persistent React state/memo/ref/callback emulator, invokes pure TextField/NumberField/RangeField/MetricBox; no ReactDOM/native scheduling/input sanitization. Fully synthetic separate physical Maps/real product-storage readyguest/owner/current-handle and raw non-mutation. Voice/read leaves inert generated-props markers, rejecting fetchtrap; no audio/provider/cloud/realstorage. Sixteen PLEN grouped cases, not16oldbugs. Both remaining count fields only: windowmin1/usedmin0, preserve default14/0, finitefractions/scientific/hugefinite allowed/nointeger/max policy; nonzero underflow refused, truezero used valid. Existing score41/55 and Math.round60percent are preservation probes, not validatedfinancial/scientific model. Allobservations beforeassert; no newparser/helper export imported atbaseline. Other7locale/fullAA/AT/production not accepted.";
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  const output = typeof node.type === "function" && ["TextField", "NumberField", "RangeField", "MetricBox"].includes(node.type.name)
    ? (node.type as (props: Props) => unknown)(node.props) : null;
  return [node, ...nodes(node.props.children), ...nodes(output)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function one(values: Node[], label: string) { if (values.length !== 1) throw Error("C67 expected one " + label + ", observed " + values.length); return values[0]; }
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
  return { all, price: field(all, c.price), days: field(all, c.days), used: field(all, c.used), window: field(all, c.window), decisionTitles: all.filter(node => typeof node.props.children === "string" && Object.values(c.titles).includes(node.props.children)).map(node => String(node.props.children)), unusedName: field(all, c.unusedName), unusedValue: field(all, c.unusedValue),
    add: one(all.filter(node => !!node.props.onClick && normalize(text(node)) === c.add), "actual Add"), total: String(one(all.filter(node => node.props.label === c.total && typeof node.props.value === "string"), "always-present unused total").props.value),
    amounts: all.filter(node => node.type === "p" && node.props.className?.includes("text-4xl")).map(node => text(node)),
    decisionLabels: all.filter(node => node.type === "p" && normalize(text(node)) === c.decision).length,
    impulse: metric(c.impulse), returnStatus: metric(c.returnStatus), alerts: all.filter(node => node.props.role === "alert").map(node => normalize(text(node))), alertIds: all.filter(node => node.props.role === "alert").map(node => node.props.id), rows,
    voices: all.filter(node => node.type === "c67-voice-props").map(node => ({ text: node.props.text, label: node.props.label, locale: node.props.locale })),
    controls: { used: field(all, c.used).props.value, days: field(all, c.days).props.value, window: field(all, c.window).props.value,
      receipt: one(all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt").props.checked,
      need: one(all.filter(node => typeof node.type === "function" && node.type.name === "RangeField" && node.props.label === c.need), "need RangeField").props.value,
      regret: one(all.filter(node => typeof node.type === "function" && node.type.name === "RangeField" && node.props.label === c.regret), "regret RangeField").props.value,
      trigger: one(all.filter(node => node.type === "select"), "actual trigger select").props.value } };
}
function fresh() { fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); return render(); }
function input(control: Node, value: string) { if (!control.props.onChange) throw Error("C67 missing actual input handler"); control.props.onChange({ target: { value } }); return render(); }
function price(raw: string) { return input(render().price, raw); }
function days(raw: string) { return input(render().days, raw); }
function used(raw: string) { return input(render().used, raw); }
function windowDays(raw: string) { return input(render().window, raw); }
function actualRange(label: string, raw: string) {
  const parent = one(render().all.filter(node => typeof node.type === "function" && node.type.name === "RangeField" && node.props.label === label), "actual RangeField " + label);
  return input(one(nodes(parent).filter(node => node.type === "input" && node.props.type === "range"), "actual emitted range"), raw);
}
function keepScenario() {
  actualRange(COPY[fixture.locale].need, "4"); actualRange(COPY[fixture.locale].regret, "1");
  input(one(render().all.filter(node => node.type === "select"), "actual trigger select"), "need"); return used("2");
}
function receipt(checked: boolean) { one(render().all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt").props.onChange?.({ target: { value: "", checked } }); return render(); }
function draft(name: string, value: string) { input(render().unusedName, name); return input(render().unusedValue, value); }
function add(name: string, value: string) { draft(name, value).add.props.onClick?.(); return render(); }
type FieldKey = "price" | "days" | "used" | "window";
type RawInputs = Record<FieldKey, string>;
function fields(view: View) { return { price: view.price, days: view.days, used: view.used, window: view.window }; }
function summary(v: View) { return { inputs: Object.fromEntries(Object.entries(fields(v)).map(([key, control]) => [key, { raw: String(control.props.value), min: control.props.min, max: control.props.max, step: control.props.step, ariaInvalid: control.props["aria-invalid"], describedBy: control.props["aria-describedby"] }])),
  amounts: v.amounts, decisionTitles: v.decisionTitles, decisionLabels: v.decisionLabels, impulse: v.impulse, returnStatus: v.returnStatus, alerts: v.alerts, alertIds: v.alertIds, total: v.total,
  unusedDraft: { name: v.unusedName.props.value, value: v.unusedValue.props.value }, rows: v.rows.map(({ name, amount }) => ({ name, amount })), voices: v.voices, controls: v.controls }; }
function raw() { return { local: [...local], session: [...session] }; }
function observe(name: string, data: unknown) { console.log("C67_SHOPPING_COUNTS_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data, raw: raw(), writes,
  owner: store.getStorageOwnershipSnapshot(), current: handle.isCurrent(), limits: LIMITS })); }
function money(cents: bigint) { return normalize(new Intl.NumberFormat(fixture.locale === "pl" ? "pl-PL" : "en-US", {
  style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(cents) / 100)); }
function unused(view: View, expected: Array<[string, bigint]>) {
  expect(normalize(view.total)).toBe(money(expected.reduce((sum, [, cents]) => sum + cents, BigInt("0"))));
  expect(view.rows.map(row => [row.name, normalize(row.amount)])).toEqual(expected.map(([name, cents]) => [name, money(cents)]));
}
function saleCents(cents: bigint) { return ((cents * BigInt("3") + BigInt("250")) / BigInt("500")) * BigInt("100"); }
function supported(view: View, resultCents: bigint, options: { decision?: "return" | "sell" | "pause" | "keep"; open?: boolean; score?: number } = {}) {
  const { decision = "return", open = true, score } = options;
  Object.values(fields(view)).forEach(control => { expect(control.props["aria-invalid"]).not.toBe(true); expect(control.props["aria-describedby"]).toBeUndefined(); });
  expect(view.alerts).toEqual([]); expect(view.amounts.map(normalize)).toEqual([money(resultCents)]); expect(view.decisionLabels).toBe(1);
  expect(view.decisionTitles).toEqual([COPY[fixture.locale].titles[decision]]); expect(view.impulse).toHaveLength(1); if (score !== undefined) expect(view.impulse).toEqual([score + "/100"]);
  expect(view.returnStatus).toEqual([COPY[fixture.locale][open ? "open" : "closed"]]); expect(view.voices).toHaveLength(1);
  expect(view.voices[0].locale).toBe(fixture.locale); expect(view.voices[0].label).toBe(COPY[fixture.locale].read);
  expect(normalize(view.voices[0].text ?? "")).toContain(COPY[fixture.locale].recoverable + ": " + money(resultCents));
  expect(view.amounts.join(" ") + view.voices[0].text).not.toMatch(/Infinity|NaN|∞/);
}
function unsupported(view: View, bad: FieldKey[], values: Partial<RawInputs> = {}) {
  const expected = { price: "249", days: "3", used: "0", window: "14", ...values }, c = COPY[fixture.locale];
  const messages = { price: c.error, days: c.daysError, used: c.usedError, window: c.windowError }, refs: string[] = [];
  for (const key of Object.keys(fields(view)) as FieldKey[]) {
    const control = fields(view)[key]; expect(String(control.props.value), "raw " + key + " is not an invented known value").toBe(expected[key]);
    if (bad.includes(key)) {
      expect(control.props["aria-invalid"]).toBe(true); const ids = (control.props["aria-describedby"] ?? "").split(/\s+/).filter(Boolean); expect(ids).toHaveLength(1); refs.push(ids[0]);
      const targets = view.all.filter(node => node.props.id === ids[0]); expect(targets).toHaveLength(1); expect(targets[0].props.role).toBe("alert"); expect(normalize(text(targets[0]))).toContain(messages[key]);
    } else { expect(control.props["aria-invalid"]).not.toBe(true); expect(control.props["aria-describedby"]).toBeUndefined(); }
  }
  expect(new Set(refs).size).toBe(bad.length); expect(view.alerts).toHaveLength(bad.length);
  expect(view.amounts).toEqual([]); expect(view.decisionLabels).toBe(0); expect(view.decisionTitles).toEqual([]); expect(view.impulse).toEqual([]); expect(view.returnStatus).toEqual([]); expect(view.voices).toEqual([]);
}
function physical(values: Map<string, string>, area: string) { return { getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { writes.push({ area, kind: "set", key, value }); values.set(key, value); },
  removeItem: (key: string) => { writes.push({ area, kind: "remove", key }); values.delete(key); }, clear: () => { writes.push({ area, kind: "clear" }); values.clear(); } }; }

beforeEach(async () => {
  vi.resetModules(); fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); writes = [];
  local = new Map([["coachfi-tokens", "125"], ["coachfi-srs", ' [{"id":"inflation","repetitions":0}] '], ["coachfi-user", ' {"name":"C67 synthetic","setupDone":true} '],
    ["coachfi-lesson-steps", ' {"retirement":2} '], ["coachfi-learn-manual", ' {"inflation":"completed"} '], ["C67_UNRELATED", "local-retained"]]);
  session = new Map([["coachfi-tokens", "321"], ["coachfi-srs", " [] "], ["coachfi-user", '{"name":"C67_SESSION","setupDone":true}'], ["C67_UNRELATED", "session-retained"]]);
  const win = new EventTarget(); Object.assign(win, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session") });
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C67 unauthorized network"); }));
  store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); handle = store.captureCurrentPersonalStorage(); owner = store.getStorageOwnershipSnapshot(); initialRaw = raw();
  Shopping = (await import("@/app/shopping/page")).default;
});
afterEach(() => { expect(raw()).toEqual(initialRaw); expect(writes).toEqual([]); expect(store.getStorageOwnershipSnapshot()).toBe(owner); expect(handle.isCurrent()).toBe(true);
  expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C67 actual Shopping remaining count inputs PL/EN integrity", () => {
  for (const locale of ["pl", "en"] as const) {
    it(locale + " preserves default used0 window14 days3 price249 and the existing decision", () => {
      fixture.locale = locale; const view = render(); observe("defaults", summary(view));
      expect(String(view.used.props.value)).toBe("0"); expect(String(view.window.props.value)).toBe("14"); expect(String(view.days.props.value)).toBe("3"); expect(String(view.price.props.value)).toBe("249");
      supported(view, BigInt("24900"), { score: 100 }); unused(view, []); expect(view.controls.need).toBe(2); expect(view.controls.regret).toBe(4); expect(view.controls.trigger).toBe("ad");
    });
    it(locale + " keeps a blank return window unknown instead of inventing one day and a sell result", () => {
      fixture.locale = locale; const initial = render(), blank = windowDays(""), oneDay = windowDays("1"), recovered = windowDays("14"), blankAgain = windowDays("");
      observe("window-blank-one-recovery", { initial: summary(initial), blank: summary(blank), oneDay: summary(oneDay), recovered: summary(recovered), blankAgain: summary(blankAgain) });
      unsupported(blank, ["window"], { window: "" }); unsupported(blankAgain, ["window"], { window: "" }); supported(initial, BigInt("24900")); supported(oneDay, saleCents(BigInt("24900")), { decision: "sell", open: false }); supported(recovered, BigInt("24900"));
    });
    it(locale + " keeps unknown uses separate from explicit zero in the actual range and trigger score41 versus55 scenario", () => {
      fixture.locale = locale; const keep = keepScenario(), blank = used(""), zero = used("0"), recovered = used("2");
      observe("uses-keep41-blank-zero55", { keep: summary(keep), blank: summary(blank), zero: summary(zero), recovered: summary(recovered) });
      unsupported(blank, ["used"], { used: "" }); supported(keep, saleCents(BigInt("24900")), { decision: "keep", score: 41 }); supported(zero, saleCents(BigInt("24900")), { decision: "pause", score: 55 }); supported(recovered, saleCents(BigInt("24900")), { decision: "keep", score: 41 });
      expect(recovered.controls).toMatchObject({ need: 4, regret: 1, trigger: "need", receipt: true });
    });
    it(locale + " admits finite fractional scientific and huge return windows under the existing lower bound", () => {
      fixture.locale = locale; const samples: Array<[string, boolean]> = [["1.5", false], ["3", true], ["3.0001", true], ["1e2", true], ["1e308", true]];
      const rows = samples.map(([raw, open]) => ({ raw, open, view: windowDays(raw) })); observe("window-admitted", rows.map(row => ({ raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => { expect(String(row.view.window.props.value)).toBe(row.raw); supported(row.view, row.open ? BigInt("24900") : saleCents(BigInt("24900")), { decision: row.open ? "return" : "sell", open: row.open }); });
      expect(rows[0].view.window.props.min).toBe(1); expect(rows[0].view.window.props.step).toBe("any"); expect(rows[0].view.window.props.max).toBeUndefined();
    });
    it(locale + " admits fractional scientific huge and true zero uses without an integer or maximum policy", () => {
      fixture.locale = locale; keepScenario(); const samples: Array<[string, number, "keep" | "pause"]> = [["0.5", 49, "keep"], ["1e-3", 49, "keep"], ["1.5", 41, "keep"], ["1e2", 41, "keep"], ["1e308", 41, "keep"], ["-0", 55, "pause"], ["0.000", 55, "pause"], ["0e-999", 55, "pause"], ["-0e-999", 55, "pause"]];
      const rows = samples.map(([raw, score, decision]) => ({ raw, score, decision, view: used(raw) })); observe("uses-admitted", rows.map(row => ({ raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => { expect(String(row.view.used.props.value)).toBe(row.raw); supported(row.view, saleCents(BigInt("24900")), { decision: row.decision, score: row.score }); });
      expect(rows[0].view.used.props.min).toBe(0); expect(rows[0].view.used.props.step).toBe("any"); expect(rows[0].view.used.props.max).toBeUndefined();
    });
    it(locale + " refuses unsupported windows and uses without clamping or stale results", () => {
      fixture.locale = locale; const samples: Array<{ key: "used" | "window"; raw: string }> = [
        ...[" ", "0", "0.5", "-1", "1e309", "NaN", "Infinity", "0x10", "1e-999"].map(raw => ({ key: "window" as const, raw })),
        ...[" ", "-1", "-0.5", "1e309", "NaN", "Infinity", "0x10", "1e-999", "-1e-999"].map(raw => ({ key: "used" as const, raw }))];
      const rows = samples.map(sample => { fresh(); return { ...sample, view: sample.key === "window" ? windowDays(sample.raw) : used(sample.raw) }; });
      observe("counts-unsupported", rows.map(row => ({ key: row.key, raw: row.raw, ...summary(row.view) })));
      rows.forEach(row => unsupported(row.view, [row.key], { [row.key]: row.raw }));
    });
    it(locale + " keeps four field errors independently linked and recovers in both orders", () => {
      fixture.locale = locale; used(""); windowDays(""); days(""); const all = price(""), countsDays = price("249"), counts = days("3"), onlyWindow = used("0"), recovered = windowDays("14");
      used(""); windowDays(""); days(""); const allAgain = price(""), priceDaysUsed = windowDays("14"), priceDays = used("0"), onlyPrice = days("3"), recoveredAgain = price("0.29");
      observe("four-errors-recovery", { all: summary(all), countsDays: summary(countsDays), counts: summary(counts), onlyWindow: summary(onlyWindow), recovered: summary(recovered), allAgain: summary(allAgain), priceDaysUsed: summary(priceDaysUsed), priceDays: summary(priceDays), onlyPrice: summary(onlyPrice), recoveredAgain: summary(recoveredAgain) });
      unsupported(all, ["price", "days", "used", "window"], { price: "", days: "", used: "", window: "" }); unsupported(countsDays, ["days", "used", "window"], { days: "", used: "", window: "" }); unsupported(counts, ["used", "window"], { used: "", window: "" }); unsupported(onlyWindow, ["window"], { window: "" }); supported(recovered, BigInt("24900"));
      unsupported(allAgain, ["price", "days", "used", "window"], { price: "", days: "", used: "", window: "" }); unsupported(priceDaysUsed, ["price", "days", "used"], { price: "", days: "", used: "" }); unsupported(priceDays, ["price", "days"], { price: "", days: "" }); unsupported(onlyPrice, ["price"], { price: "" }); supported(recoveredAgain, BigInt("29"));
    });
    it(locale + " preserves the unused audit and staged draft while both count fields are unknown", () => {
      fixture.locale = locale; add("kept", "0.29"); draft("pending", "12.34"); used(""); const both = windowDays(""), appended = add("new", "0.01"); appended.rows[0].remove.props.onClick?.(); const removed = render(), onlyWindow = used("0"), recovered = windowDays("14");
      observe("audit-independence", { both: summary(both), appended: summary(appended), removed: summary(removed), onlyWindow: summary(onlyWindow), recovered: summary(recovered) });
      unsupported(both, ["used", "window"], { used: "", window: "" }); expect(both.unusedName.props.value).toBe("pending"); expect(both.unusedValue.props.value).toBe("12.34"); unused(both, [["kept", BigInt("29")]]);
      unsupported(appended, ["used", "window"], { used: "", window: "" }); unused(appended, [["kept", BigInt("29")], ["new", BigInt("1")]]); unsupported(removed, ["used", "window"], { used: "", window: "" }); unused(removed, [["new", BigInt("1")]]); unsupported(onlyWindow, ["window"], { window: "" }); supported(recovered, BigInt("24900")); unused(recovered, [["new", BigInt("1")]]);
    });
  }
});
