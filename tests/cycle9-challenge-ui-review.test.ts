import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const index = fixture.slot++, previous = fixture.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) fixture.memos.set(index, { deps, value: factory() });
  return fixture.memos.get(index)?.value;
}
function effect(effect: Effect, deps?: readonly unknown[]) {
  const index = fixture.slot++;
  if (!fixture.effectDeps.has(index) || !sameDeps(fixture.effectDeps.get(index), deps)) fixture.effects.push(() => {
    fixture.cleanups.get(index)?.(); fixture.cleanups.delete(index);
    const cleanup = effect(); if (typeof cleanup === "function") fixture.cleanups.set(index, cleanup);
  });
  fixture.effectDeps.set(index, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useLayoutEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useState: (initial: unknown) => {
    const index = fixture.slot++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => { fixture.setState(value);
      fixture.values.set(index, typeof value === "function" ? value(fixture.values.get(index)) : value); }];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.markActive }) }));

type Props = { children?: unknown; role?: string; disabled?: boolean; "aria-live"?: string; "data-testid"?: string; onClick?: () => void };
function nodes(node: unknown): Array<ReactElement<Props>> {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Props>; return [element, ...nodes(element.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object" && "props" in node ? text((node as ReactElement<Props>).props.children) : "";
}
type Fault = "none" | "challenge-read" | "token-read" | "token-before" | "token-after" | "marker-before" | "marker-after";
let bytes: Map<string, string>, writes: Array<{ key: string; value: string }>, fault: Fault;
let reenter: (() => void) | undefined, render: () => ReactElement;
let daily: import("@/data/challengeQuestions").ChallengeQuestion;
const alerts = (tree: unknown) => nodes(tree).filter(node => node.props.role === "alert");
const earned = (tree: unknown) => nodes(tree).filter(node => node.props["data-testid"] === "daily-challenge-earned");
const message = (tree: unknown) => text(nodes(alerts(tree)[0]?.props.children).find(node => node.type === "p"));
const copy = {
  pl: { retry: "Nie udało się zapisać odpowiedzi. Nie przyznano nowych punktów. Możesz spróbować ponownie.",
    uncertain: "Nie udało się potwierdzić pełnego zapisu. Punkty lub ukończenie wyzwania mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Zmiana języka nie odblokuje ponowienia.",
    unavailable: "Nie można odczytać danych wyzwania. Nie przyznano nowych punktów. Sprawdź odczyt ponownie." },
  en: { retry: "Your answer could not be saved. No new points were awarded. You can try again.",
    uncertain: "The full save could not be confirmed. Points or challenge completion may have been partially saved. Do not retry this answer. Changing the language will not unlock another attempt.",
    unavailable: "The challenge data could not be read. No new points were awarded. Check the data again." },
};
function answer(tree: unknown, id: string) {
  const node = nodes(tree).find(node => node.key === id && node.props.onClick);
  expect(node).toBeDefined(); return node!;
}
async function submit(tree: unknown) {
  const { translations } = await import("@/lib/i18n");
  const node = nodes(tree).find(node => node.props.onClick && text(node) === translations[fixture.locale].challenge.answerButton);
  expect(node).toBeDefined(); return node!;
}
function settle() {
  let tree = render();
  for (let i = 0; i < 8 && fixture.effects.length; i++) { fixture.effects.splice(0).forEach(callback => callback()); tree = render(); }
  expect(fixture.effects).toHaveLength(0); return tree;
}
function select(tree: unknown, id = daily.correctAnswer) { answer(tree, id).props.onClick!(); return settle(); }
async function noSuccess(tree: unknown) {
  const { translations } = await import("@/lib/i18n");
  expect(text(tree)).not.toContain(translations[fixture.locale].challenge.completedTitle);
  expect(earned(tree)).toHaveLength(0); expect(fixture.markActive).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length = 0;
  fixture.markActive.mockReset(); bytes = new Map([["coachfi-tokens", "125"]]); writes = []; fault = "none"; reenter = undefined;
  const storage = { getItem: (key: string) => {
    if ((key === "coachfi-challenge" && fault === "challenge-read") || (key === "coachfi-tokens" && fault === "token-read")) {
      fault = "none"; throw new Error("FIXTURE refused read before mutation");
    }
    return bytes.get(key) ?? null;
  }, setItem: (key: string, value: string) => {
    writes.push({ key, value });
    if ((key === "coachfi-challenge" && fault === "marker-before") || (key === "coachfi-tokens" && fault === "token-before")) {
      fault = "none"; throw new Error("FIXTURE writer refused before changing bytes");
    }
    bytes.set(key, value);
    if (key === "coachfi-tokens" && reenter) { const callback = reenter; reenter = undefined; callback(); }
    if ((key === "coachfi-challenge" && fault === "marker-after") || (key === "coachfi-tokens" && fault === "token-after")) {
      fault = "none"; throw new Error("FIXTURE writer changed bytes before throwing");
    }
  }, removeItem: (key: string) => { bytes.delete(key); } };
  const windowStub = new EventTarget() as EventTarget & { localStorage: typeof storage; sessionStorage: typeof storage; location: { reload: ReturnType<typeof vi.fn> } };
  Object.assign(windowStub, { localStorage: storage, sessionStorage: storage, location: { reload: vi.fn() } });
  vi.stubGlobal("window", windowStub); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  daily = (await import("@/data/challengeQuestions")).getDailyQuestion(); expect(daily.reward).toBe(50);
  const { default: ChallengePage } = await import("@/app/challenge/page"); render = () => { fixture.slot = 0; return ChallengePage(); };
});
afterEach(() => { fixture.cleanups.forEach(callback => callback()); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent B19 actual ChallengePage save gates", () => {
  it.each(["pl", "en"] as const)("%s success is shown only after reward, marker and streak return", async locale => {
    fixture.locale = locale; let tree = select(settle()); const captured = (await submit(tree)).props.onClick!;
    captured(); tree = settle(); expect(alerts(tree)).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("175");
    expect(JSON.parse(bytes.get("coachfi-challenge")!)).toEqual({ date: "2026-01-01" });
    expect(earned(tree)).toHaveLength(1); expect(text(earned(tree)[0])).toContain("+50"); const { translations } = await import("@/lib/i18n");
    expect(text(tree)).toContain(translations[locale].challenge.completedTitle); expect(fixture.markActive).toHaveBeenCalledOnce();
    const count = writes.length; fixture.setState.mockClear(); captured(); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["pl", "en"] as const)("%s wrong answer shows feedback without reward or completion mutation", async locale => {
    fixture.locale = locale; let tree = select(settle(), daily.answers.find(value => value.id !== daily.correctAnswer)!.id);
    (await submit(tree)).props.onClick!(); tree = settle(); await noSuccess(tree);
    const { translations } = await import("@/lib/i18n"); expect(text(tree)).toContain(translations[locale].challenge.wrongBanner);
    expect(writes).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(bytes.has("coachfi-challenge")).toBe(false);
  });
  it.each(["pl", "en"] as const)("%s pre-action blocked read preserves data and permits one explicit retry", async locale => {
    fixture.locale = locale; let tree = select(settle()); fault = "challenge-read";
    (await submit(tree)).props.onClick!(); tree = settle(); await noSuccess(tree); expect(alerts(tree)).toHaveLength(1);
    expect(message(tree)).toBe(copy[locale].retry);
    expect(writes).toHaveLength(0); expect((await submit(tree)).props.disabled).not.toBe(true); expect(bytes.get("coachfi-tokens")).toBe("125");
    (await submit(tree)).props.onClick!(); tree = settle(); expect(alerts(tree)).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("175");
    expect(writes.filter(value => value.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "175" }]);
    expect(fixture.markActive).toHaveBeenCalledOnce();
  });
  it.each(["pl", "en"] as const)("%s token write-then-throw blocks replay and publishes no success", async locale => {
    fixture.locale = locale; let tree = select(settle()); const captured = (await submit(tree)).props.onClick!; fault = "token-after";
    captured(); tree = settle(); expect(alerts(tree)).toHaveLength(1); await noSuccess(tree);
    expect(message(tree)).toBe(copy[locale].uncertain);
    expect(bytes.get("coachfi-tokens")).toBe("175"); expect(bytes.has("coachfi-challenge")).toBe(false);
    expect((await submit(tree)).props.disabled).toBe(true); for (const value of daily.answers) expect(answer(tree, value.id).props.disabled).toBe(true);
    const before = new Map(bytes), count = writes.length; captured(); (await submit(tree)).props.onClick!(); tree = settle();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); await noSuccess(tree);
  });
  it.each(["pl", "en"] as const)("%s marker refusal after reward quarantines even when marker bytes are absent", async locale => {
    fixture.locale = locale; let tree = select(settle()); fault = "marker-before"; (await submit(tree)).props.onClick!(); tree = settle();
    expect(alerts(tree)).toHaveLength(1); expect((await submit(tree)).props.disabled).toBe(true); await noSuccess(tree);
    expect(message(tree)).toBe(copy[locale].uncertain);
    expect(bytes.get("coachfi-tokens")).toBe("175"); expect(bytes.has("coachfi-challenge")).toBe(false);
    expect(writes.filter(value => value.key === "coachfi-challenge")).toHaveLength(1);
    const count = writes.length; (await submit(tree)).props.onClick!(); expect(writes).toHaveLength(count);
  });
  it.each(["pl", "en"] as const)("%s malformed points reject before either writer and preserve exact bytes", async locale => {
    fixture.locale = locale; bytes.set("coachfi-tokens", "25garbage"); let tree = select(settle()); (await submit(tree)).props.onClick!(); tree = settle();
    expect(alerts(tree)).toHaveLength(1); await noSuccess(tree); expect(writes).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("25garbage");
    expect(message(tree)).toBe(copy[locale].retry);
    expect(bytes.has("coachfi-challenge")).toBe(false);
  });
  it.each(["pl", "en"] as const)("%s malformed marker on initial view blocks guessing that challenge is available", async locale => {
    fixture.locale = locale; bytes.set("coachfi-challenge", "{broken"); const tree = settle();
    expect(alerts(tree)).toHaveLength(1); await noSuccess(tree); expect(writes).toHaveLength(0); expect(bytes.get("coachfi-challenge")).toBe("{broken");
    expect(message(tree)).toBe(copy[locale].unavailable);
    expect(nodes(tree).filter(node => node.props.onClick && node.key && daily.answers.some(value => value.id === node.key)).every(node => node.props.disabled)).toBe(true);
  });
  it("locale switch retains uncertain quarantine for the same current owner", async () => {
    let tree = select(settle()); fault = "token-after"; const old = (await submit(tree)).props.onClick!; old(); tree = settle();
    fixture.locale = "en"; tree = settle(); expect(alerts(tree)).toHaveLength(1); await noSuccess(tree);
    expect(message(tree)).toBe(copy.en.uncertain);
    const before = new Map(bytes), count = writes.length; old();
    for (const value of daily.answers) { const node = answer(tree, value.id); expect(node.props.disabled).toBe(true); node.props.onClick!(); }
    tree = settle(); expect((await submit(tree)).props.disabled).toBe(true); (await submit(tree)).props.onClick!();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count);
  });
  it("locale changes labels while retaining a valid selected answer and one controller outcome", async () => {
    let tree = select(settle()); fixture.locale = "en"; tree = settle();
    expect((await submit(tree)).props.disabled).not.toBe(true); (await submit(tree)).props.onClick!(); tree = settle();
    expect(bytes.get("coachfi-tokens")).toBe("175"); expect(writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1);
    expect(earned(tree)).toHaveLength(1); expect(text(earned(tree)[0])).toContain("+50"); expect(fixture.markActive).toHaveBeenCalledOnce();
  });
  it("new owner rejects old callbacks and preserves the synthetic account B namespace", async () => {
    let tree = select(settle()); const old = (await submit(tree)).props.onClick!, oldAnswer = answer(tree, daily.answers[0].id).props.onClick!;
    const store = await import("@/lib/product-storage"), b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B19_B" });
    b.storage.setItem("coachfi-tokens", "77"); b.publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); tree = settle();
    const before = new Map(bytes), count = writes.length; fixture.setState.mockClear(); old(); oldAnswer();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled();
    expect(fixture.storage.getItem("coachfi-tokens")).toBe("77"); expect(fixture.storage.getItem("coachfi-challenge")).toBeNull(); await noSuccess(tree);
  });
  it("late streak error after reward and marker never publishes completed or earned UI", async () => {
    let tree = select(settle()); fixture.markActive.mockImplementationOnce(() => { throw new Error("FIXTURE late streak failure"); });
    (await submit(tree)).props.onClick!(); tree = settle(); expect(alerts(tree)).toHaveLength(1);
    const { translations } = await import("@/lib/i18n"); expect(text(tree)).not.toContain(translations.pl.challenge.completedTitle); expect(earned(tree)).toHaveLength(0);
    expect(bytes.get("coachfi-tokens")).toBe("175"); expect(JSON.parse(bytes.get("coachfi-challenge")!)).toEqual({ date: "2026-01-01" });
    expect(fixture.markActive).toHaveBeenCalledOnce(); expect((await submit(tree)).props.disabled).toBe(true);
  });
  it("reentry and duplicate captured submit cannot award twice", async () => {
    const tree = select(settle()), captured = (await submit(tree)).props.onClick!; reenter = captured; captured(); captured();
    expect(bytes.get("coachfi-tokens")).toBe("175"); expect(writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1);
    expect(writes.filter(value => value.key === "coachfi-challenge")).toHaveLength(1); expect(fixture.markActive).toHaveBeenCalledOnce();
  });
  it("same-owner component disposal invalidates captured callbacks", async () => {
    const tree = select(settle()), captured = (await submit(tree)).props.onClick!;
    fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.setState.mockClear(); captured();
    expect(writes).toHaveLength(0); expect(fixture.setState).not.toHaveBeenCalled(); expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it("an existing activity milestone bonus adds15 without hiding the confirmed daily reward50", async () => {
    const { addTokens } = await import("@/lib/tokens"); const captured = fixture.storage;
    fixture.markActive.mockImplementationOnce(() => { addTokens(15, "FIXTURE existing three-day milestone", "streak_bonus", captured); });
    let tree = select(settle()); (await submit(tree)).props.onClick!(); tree = settle();
    expect(bytes.get("coachfi-tokens")).toBe("190"); expect(JSON.parse(bytes.get("coachfi-challenge")!)).toEqual({ date: "2026-01-01" });
    expect(alerts(tree)).toHaveLength(0); expect(earned(tree)).toHaveLength(1); expect(text(earned(tree)[0])).toContain("+50");
    const { translations } = await import("@/lib/i18n"); expect(text(tree)).toContain(translations.pl.challenge.completedTitle);
    expect(writes.filter(value => value.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "175" }, { key: "coachfi-tokens", value: "190" }]);
    expect(fixture.markActive).toHaveBeenCalledOnce();
  });
});
