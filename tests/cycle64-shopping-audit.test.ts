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
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: "c64-voice-props" }));
vi.mock("@/components/read-aloud-button", () => ({ ReadAloudButton: "c64-read-props" }));

type Props = { children?: unknown; label?: string; value?: string | number; text?: string; locale?: string; className?: string;
  role?: string; type?: string; min?: string | number; max?: string | number; step?: string | number; checked?: boolean;
  onClick?: () => void; onChange?: (event: { target: { value: string; checked?: boolean } }) => void };
type Node = ReactElement<Props>;
type View = { tree: Node; name: Node; value: Node; add: Node; total: string; purchase: string; alerts: string[];
  rows: Array<{ name: string; amount: string; remove: Node }>; voices: Array<{ text?: string; label?: string; locale?: string }>; all: Node[] };
let Shopping: typeof import("@/app/shopping/page").default;
let store: typeof import("@/lib/product-storage"), owner: StorageOwnershipSnapshot, handle: PersonalStorageHandle;
let local: Map<string, string>, session: Map<string, string>, writes: unknown[], beforeRaw: { local: Array<[string, string]>; session: Array<[string, string]> };
const COPY = {
  pl: { name: "Nieużywana rzecz", value: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń", total: "Możliwa gotówka z nieużywanych rzeczy",
    price: "Cena", recoverable: "Potencjalna gotówka do odzyskania", read: "Odczytaj decyzję coacha", error: "Podaj nazwę rzeczy i dodatnią kwotę z dokładnością do grosza." },
  en: { name: "Unused thing", value: "Estimated sale value", add: "Add item", remove: "Remove", total: "Possible cash from unused things",
    price: "Price", recoverable: "Potential cash to recover", read: "Read Coach decision", error: "Enter an item name and a positive amount in steps of 0.01." },
};
const LIMITS = "Actual ShoppingPage and actual emitted TextField/NumberField input handlers, Add/Remove closures, purchase analysis, MetricBox and generated decision VoiceButton props. Persistent state/memo/ref React emulator; pure local field/metric functions are invoked, other UI elements remain trees. Real translation records/Intl and real product-storage guest ownership with separate synthetic physical Maps. VoiceButton/ReadAloudButton are unexecuted leaf markers, fetch a rejecting trap. No proposed helper import, arithmetic replacement, source-string oracle, ReactDOM batching/hydration, native input validity/focus/accessibility, storage ownership change/transaction, SDK/provider/audio, real data, cloud or deployment acceptance. Fourteen cases include grouped observations and new validation/raw-input/identity contracts, not fourteen historical bugs.";
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  // These actual local functions have no hooks; the page owns every state transition.
  const localOutput = typeof node.type === "function" && ["TextField", "NumberField", "MetricBox"].includes(node.type.name)
    ? (node.type as (props: Props) => unknown)(node.props) : null;
  return [node, ...nodes(node.props.children), ...nodes(localOutput)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function one(values: Node[], description: string) { if (values.length !== 1) throw Error("C64 expected one " + description + ", observed " + values.length); return values[0]; }
function field(all: Node[], label: string) {
  const actualLabel = one(all.filter(node => node.type === "label" && normalize(text(node)) === label), "actual field label " + label);
  return one(nodes(actualLabel).filter(node => node.type === "input"), "emitted input " + label);
}
function render(): View {
  fixture.slot = 0; const tree = Shopping(), all = nodes(tree), copy = COPY[fixture.locale];
  const rows = all.filter(node => node.type === "div" && (Array.isArray(node.props.children) ? node.props.children : [node.props.children])
    .some(child => child && typeof child === "object" && "props" in child && (child as Node).type === "button" && normalize(text(child)) === copy.remove))
    .map(row => { const children = nodes(row), paragraphs = children.filter(node => node.type === "p");
      return { name: text(paragraphs[0]), amount: text(paragraphs[1]), remove: one(children.filter(node => node.type === "button" && normalize(text(node)) === copy.remove), "row remove") }; });
  const metric = one(all.filter(node => node.props.label === copy.total && typeof node.props.value === "string"), "actual unused total metric");
  return { tree, all, name: field(all, copy.name), value: field(all, copy.value),
    add: one(all.filter(node => !!node.props.onClick && normalize(text(node)) === copy.add), "actual Add handler"),
    total: String(metric.props.value), purchase: text(one(all.filter(node => node.type === "p" && node.props.className?.includes("text-4xl")), "purchase recovery")),
    alerts: all.filter(node => node.props.role === "alert").map(node => normalize(text(node))), rows,
    voices: all.filter(node => node.type === "c64-voice-props").map(node => ({ text: node.props.text, label: node.props.label, locale: node.props.locale })) };
}
function fresh() { fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); return render(); }
function change(control: Node, raw: string) { if (!control.props.onChange) throw Error("C64 missing actual onChange"); control.props.onChange({ target: { value: raw } }); return render(); }
function draft(name: string, amount: string) { change(render().name, name); return change(render().value, amount); }
function add(name: string, amount: string) { const view = draft(name, amount); view.add.props.onClick?.(); return render(); }
function remove(view: View, index: number) { view.rows[index].remove.props.onClick?.(); return render(); }
function summary(view: View) { return { name: view.name.props.value, value: view.value.props.value, valueText: String(view.value.props.value), input: { type: view.value.props.type,
  min: view.value.props.min, max: view.value.props.max, step: view.value.props.step }, total: view.total, purchase: view.purchase,
  alerts: view.alerts, rows: view.rows.map(({ name, amount }) => ({ name, amount })), voices: view.voices }; }
function raw() { return { local: [...local], session: [...session] }; }
function observe(name: string, data: unknown) { console.log("C64_SHOPPING_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data,
  raw: raw(), writes, owner: store.getStorageOwnershipSnapshot(), current: handle.isCurrent(), limits: LIMITS })); }
function money(cents: bigint) {
  expect(cents >= BigInt("0") && cents <= BigInt("100000000000000")).toBe(true);
  return normalize(new Intl.NumberFormat(fixture.locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(cents) / 100));
}
function valid(view: View, expected: Array<[string, bigint]>, purchaseCents = BigInt("24900")) {
  const cents = expected.reduce((sum, [, value]) => sum + value, BigInt("0"));
  expect(normalize(view.total), "actual total equals the independent integer-cent sum in PLN").toBe(money(cents));
  expect(view.rows.map(row => [row.name, normalize(row.amount)])).toEqual(expected.map(([name, value]) => [name, money(value)]));
  expect(normalize(view.purchase)).toBe(money(purchaseCents)); expect(view.voices).toHaveLength(1);
  const voice = view.voices[0]; expect(voice.locale).toBe(fixture.locale); expect(voice.label).toBe(COPY[fixture.locale].read);
  expect(normalize(voice.text ?? "")).toContain(COPY[fixture.locale].recoverable + ": " + money(purchaseCents));
  if (cents > BigInt("0")) expect(normalize(voice.text ?? "")).toContain(COPY[fixture.locale].total + ": " + money(cents));
  expect(view.total + view.rows.map(row => row.amount).join(" ") + voice.text).not.toMatch(/Infinity|NaN|∞/);
}
function refusal(view: View, expectedName: string, expectedRaw: string) {
  expect(String(view.name.props.value)).toBe(expectedName); expect(String(view.value.props.value), "rejected draft is retained").toBe(expectedRaw);
  expect(view.alerts).toHaveLength(1); expect(view.alerts[0]).toContain(COPY[fixture.locale].error);
  expect(view.alerts[0]).toContain(money(BigInt("100000000000000")));
}
function physical(values: Map<string, string>, area: string) { return {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { writes.push({ area, kind: "set", key, value }); values.set(key, value); },
  removeItem: (key: string) => { writes.push({ area, kind: "remove", key }); values.delete(key); },
  clear: () => { writes.push({ area, kind: "clear" }); values.clear(); },
}; }

beforeEach(async () => {
  vi.resetModules(); fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.refs.clear(); writes = [];
  local = new Map([["coachfi-tokens", "125"], ["coachfi-srs", ' [{"id":"inflation","repetitions":0}] '], ["coachfi-lesson-steps", ' {"retirement":2} '],
    ["coachfi-user", ' {"name":"C64 synthetic","setupDone":true} '], ["coachfi-learn-manual", ' {"inflation":"completed"} '], ["C64_UNRELATED", "local-retained"]]);
  session = new Map([["coachfi-tokens", "321"], ["coachfi-srs", " [] "], ["coachfi-user", '{"name":"C64_SESSION","setupDone":true}'], ["C64_UNRELATED", "session-retained"]]);
  const win = new EventTarget(); Object.assign(win, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session") });
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C64 unauthorized network"); }));
  let clock = 1000; vi.spyOn(Date, "now").mockImplementation(() => clock++);
  store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady();
  handle = store.captureCurrentPersonalStorage(); owner = store.getStorageOwnershipSnapshot(); beforeRaw = raw();
  Shopping = (await import("@/app/shopping/page")).default;
});
afterEach(() => {
  expect(raw(), "shopping remains transient; both synthetic physical areas stay byte-exact").toEqual(beforeRaw);
  expect(writes).toEqual([]); expect(store.getStorageOwnershipSnapshot()).toBe(owner); expect(handle.isCurrent()).toBe(true);
  expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("C64 actual shopping audit, PL/EN Poland cent integrity", () => {
  for (const locale of ["pl", "en"] as const) {
    it(locale + " defaults and existing purchase calculation retain their controls with PLN cents", () => {
      fixture.locale = locale; const initial = render(); change(field(initial.all, COPY[locale].price), "250.25");
      const priced = render(), receipt = one(priced.all.filter(node => node.type === "input" && node.props.type === "checkbox"), "receipt checkbox");
      receipt.props.onChange?.({ target: { value: "", checked: false } }); const sell = render();
      observe("default-purchase-control", { initial: summary(initial), priced: summary(priced), sell: summary(sell) });
      expect(String(initial.value.props.value)).toBe("80"); expect(initial.rows).toEqual([]); expect(initial.alerts).toEqual([]);
      valid(initial, []); valid(priced, [], BigInt("25025")); valid(sell, [], BigInt("15000"));
      expect(String(field(sell.all, COPY[locale].price).props.value)).toBe("250.25");
    });
    it(locale + " accepts exact small/scientific cents and removes through the actual row handler", () => {
      fixture.locale = locale; const first = add("one", "0.29"), second = add("two", "1e-2"), third = add("three", "1e2"), removed = remove(third, 1);
      observe("valid-add-remove", [first, second, third, removed].map(summary));
      valid(first, [["one", BigInt("29")]]); valid(second, [["one", BigInt("29")], ["two", BigInt("1")]]); valid(third, [["one", BigInt("29")], ["two", BigInt("1")], ["three", BigInt("10000")]]);
      valid(removed, [["one", BigInt("29")], ["three", BigInt("10000")]]); expect(removed.alerts).toEqual([]);
      expect(String(third.name.props.value)).toBe(""); expect(String(third.value.props.value)).toBe("80");
    });
    it(locale + " refuses invalid drafts without corrupting the existing list and recovers", () => {
      fixture.locale = locale;
      const samples = ["", " ", "0", "-0", "-1", "0.001", "1e-3", "1e308", "1e309", "1000000000000.01", "NaN", "Infinity", "0x10"];
      const rows = [...samples.map(amount => ({ name: "rejected", amount })), { name: "   ", amount: "80" }].map(sample => {
        fresh(); const kept = add("kept", "1.25"), rejected = add(sample.name, sample.amount), recovery = add("recovered", "0.29");
        return { ...sample, kept, rejected, recovery };
      });
      fresh(); add("kept", "1.25"); const hugeFirst = add("huge-a", "1e308"), hugeSecond = add("huge-b", "1e308");
      observe("invalid-drafts", { rows: rows.map(row => ({ name: row.name, amount: row.amount, kept: summary(row.kept), rejected: summary(row.rejected), recovery: summary(row.recovery) })),
        finiteInputOverflow: { first: summary(hugeFirst), second: summary(hugeSecond) } });
      valid(hugeFirst, [["kept", BigInt("125")]]); valid(hugeSecond, [["kept", BigInt("125")]]); refusal(hugeSecond, "huge-b", "1e308");
      rows.forEach(row => { refusal(row.rejected, row.name, row.amount); valid(row.rejected, [["kept", BigInt("125")]]);
        valid(row.recovery, [["kept", BigInt("125")], ["recovered", BigInt("29")]]); expect(row.recovery.alerts).toEqual([]); });
    });
    it(locale + " admits the exact aggregate cap then refuses one cent and releases capacity on Remove", () => {
      fixture.locale = locale; const near = add("near", "999999999999.99"), capped = add("cent", "0.01"), rejected = add("over", "0.01");
      const freed = remove(rejected, 0), recovered = add("new", "1");
      observe("cap-recovery", { near: summary(near), capped: summary(capped), rejected: summary(rejected), freed: summary(freed), recovered: summary(recovered) });
      valid(near, [["near", BigInt("99999999999999")]]); valid(capped, [["near", BigInt("99999999999999")], ["cent", BigInt("1")]]);
      refusal(rejected, "over", "0.01"); valid(rejected, [["near", BigInt("99999999999999")], ["cent", BigInt("1")]]);
      valid(freed, [["cent", BigInt("1")]]); expect(freed.alerts).toEqual([]); valid(recovered, [["cent", BigInt("1")], ["new", BigInt("100")]]);
    });
    it(locale + " checks the current list when the same Add closure runs twice before rerender", () => {
      fixture.locale = locale; const captured = draft("large", "600000000000").add.props.onClick;
      captured?.(); captured?.(); const result = render(); observe("rapid-captured-add", summary(result));
      valid(result, [["large", BigInt("60000000000000")]]); expect(result.alerts).toHaveLength(1);
    });
    it(locale + " keeps same-clock rows distinct and stale Remove never deletes the other rows", () => {
      fixture.locale = locale; vi.mocked(Date.now).mockReturnValue(1000);
      add("a", "1"); add("b", "2"); const initial = add("c", "3"), oldRemove = initial.rows[0].remove.props.onClick;
      oldRemove?.(); oldRemove?.(); const twice = render(), added = add("d", "4"); oldRemove?.(); const after = render();
      observe("same-clock-stale-remove", { initial: summary(initial), twice: summary(twice), added: summary(added), after: summary(after) });
      valid(initial, [["a", BigInt("100")], ["b", BigInt("200")], ["c", BigInt("300")]]); valid(twice, [["b", BigInt("200")], ["c", BigInt("300")]]);
      valid(added, [["b", BigInt("200")], ["c", BigInt("300")], ["d", BigInt("400")]]); valid(after, [["b", BigInt("200")], ["c", BigInt("300")], ["d", BigInt("400")]]);
    });
    it(locale + " conserves a diverse independent integer-cent series at every observed list state", () => {
      fixture.locale = locale;
      const samples: Array<[string, bigint]> = [["0.01", BigInt("1")], ["0.29", BigInt("29")], ["0.10", BigInt("10")], ["1e-2", BigInt("1")], ["12.34", BigInt("1234")], ["100.07", BigInt("10007")], ["999.99", BigInt("99999")]];
      const frames = samples.map(([amount], i) => add("item-" + i, amount));
      observe("cent-series", frames.map(summary));
      frames.forEach((view, i) => valid(view, samples.slice(0, i + 1).map(([, cents], j) => ["item-" + j, cents])));
    });
  }
});