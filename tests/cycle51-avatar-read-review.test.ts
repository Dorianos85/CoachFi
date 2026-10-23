import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import type { PersonalStorageHandle, StorageOwner } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en", storage: null as unknown as PersonalStorageHandle,
  slot: 0, dirty: false, values: new Map<number, unknown>(),
  deps: new Map<number, readonly unknown[] | undefined>(), effects: [] as Effect[],
  cleanups: new Map<number, () => void>(), updates: vi.fn(),
  notify: vi.fn(), speak: vi.fn(async () => {}), stop: vi.fn(),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = fixture.slot++;
    if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(slot), (value: unknown) => {
      const old = fixture.values.get(slot), next = typeof value === "function" ? value(old) : value;
      fixture.updates(next); fixture.values.set(slot, next);
      if (!Object.is(old, next)) fixture.dirty = true;
    }];
  },
  useEffect: (callback: Effect, deps?: readonly unknown[]) => {
    const slot = fixture.slot++;
    if (!fixture.deps.has(slot) || !sameDeps(fixture.deps.get(slot), deps)) fixture.effects.push(() => {
      fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot);
      const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup);
    });
    fixture.deps.set(slot, deps);
  },
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/context/VoiceContext", () => ({ useVoice: () => ({ isPlaying: false, currentText: null, speak: fixture.speak, stop: fixture.stop }) }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));
vi.mock("framer-motion", async () => {
  const { createElement } = await import("react");
  const button = ({ whileTap: _animation, ...props }: ComponentPropsWithoutRef<"button"> & { whileTap?: unknown }) => createElement("button", props);
  return { motion: { button } };
});

const KEY = "coachfi-avatar", PRIVATE = "TEST_C51_PRIVATE_EXTRA";
const invalid = [
  { name: "JSON null", value: null }, { name: "empty object", value: {} },
  { name: "array", value: [] }, { name: "number", value: 42 },
  { name: "boolean", value: false }, { name: "string", value: "female" },
  { name: "missing gender", value: { style: "builder" } },
  { name: "missing style", value: { gender: "male" } },
  { name: "numeric gender", value: { gender: 7, style: "warrior" } },
  { name: "unknown gender", value: { gender: "other", style: "warrior" } },
  { name: "object style", value: { gender: "female", style: { title: PRIVATE } } },
  { name: "unknown style", value: { gender: "male", style: "invalid" } },
] as const;
const valid = (["female", "male"] as const).flatMap(gender =>
  (["warrior", "explorer", "builder"] as const).map(style => ({ gender, style })));
const uiCases = [
  { mode: "null", raw: "null", gender: "female", style: "warrior" },
  { mode: "empty", raw: "{}", gender: "female", style: "warrior" },
  { mode: "bad-style", raw: '{"gender":"male","style":"invalid"}', gender: "female", style: "warrior" },
  { mode: "healthy", raw: '{"gender":"male","style":"builder","future":{"kept":true}}', gender: "male", style: "builder" },
] as const;
const copy = {
  pl: { title: "Twój finansowy avatar", warrior: "Wojownik", builder: "Budowniczy", save: "Zapisz avatar" },
  en: { title: "Your Financial Avatar", warrior: "Warrior", builder: "Builder", save: "Save avatar" },
};
let store: typeof import("@/lib/product-storage"), avatar: typeof import("@/lib/avatar");
let AvatarPage: () => ReactElement;
let local: Map<string, string>, session: Map<string, string>;
let physicalLocal: ReturnType<typeof physical>, physicalSession: ReturnType<typeof physical>;
let onRead: ((area: "local" | "session", key: string) => void) | undefined;
function physical(bytes: Map<string, string>, area: "local" | "session") {
  return { getItem: vi.fn((key: string) => { const raw = bytes.get(key) ?? null; onRead?.(area, key); return raw; }),
    setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); }),
    removeItem: vi.fn((key: string) => { bytes.delete(key); }) };
}
function rawSnapshot() { return { local: [...local], session: [...session] }; }
function clearPhysical() { for (const storage of [physicalLocal, physicalSession]) { storage.getItem.mockClear(); storage.setItem.mockClear(); storage.removeItem.mockClear(); } }
function seed(raw: string | null, owner: StorageOwner = { kind: "guest" }) {
  const lease = store.beginStorageOwner(owner);
  if (raw !== null) expect(lease.storage.setItem(KEY, raw)).toBe(true);
  expect(lease.publishReady()).toBe(true); clearPhysical();
  fixture.storage = store.captureCurrentPersonalStorage(); return fixture.storage;
}
function resetHooks() {
  fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear();
  fixture.values.clear(); fixture.deps.clear(); fixture.effects.length = 0;
  fixture.slot = 0; fixture.dirty = false;
}
function renderAfterEffects() {
  let phase = "initial", html = "";
  const phases: Array<{ phase: string; preview: string | null }> = [];
  try {
    for (let turn = 0; turn < 8; turn++) {
      fixture.slot = 0; fixture.dirty = false; phase = turn === 0 ? "initial-render" : "after-effect-render";
      const tree = AvatarPage();
      html = renderToStaticMarkup(tree);
      phases.push({ phase, preview: /<p[^>]*class="[^"]*tracking-widest[^"]*"[^>]*>([^<]*)<\/p>/.exec(html)?.[1] ?? null });
      phase = "effect"; fixture.effects.splice(0).forEach(callback => callback());
      if (!fixture.dirty && fixture.effects.length === 0) return { html, phases, error: null };
    }
    throw Error("C51 fixture did not settle within eight render/effect turns");
  } catch (caught) {
    return { html, phases, error: { phase, name: caught instanceof Error ? caught.name : "non-Error", message: caught instanceof Error ? caught.message : String(caught) } };
  }
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl";
  local = new Map([["coachfi-tokens", "125"], ["coachfi-srs", "[]"], ["TEST_C51_UNRELATED", PRIVATE]]);
  session = new Map([[KEY, '{"gender":"male","style":"explorer"}']]); onRead = undefined;
  physicalLocal = physical(local, "local"); physicalSession = physical(session, "session");
  vi.stubGlobal("window", { localStorage: physicalLocal, sessionStorage: physicalSession, dispatchEvent: vi.fn(() => true) });
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("No network authorized in C51"); }));
  store = await import("@/lib/product-storage"); avatar = await import("@/lib/avatar");
  AvatarPage = (await import("@/app/avatar/page")).default;
});
afterEach(() => {
  resetHooks(); expect(fetch).not.toHaveBeenCalled(); expect(fixture.notify).not.toHaveBeenCalled();
  expect(fixture.speak).not.toHaveBeenCalled(); expect(fixture.stop).not.toHaveBeenCalled();
  for (const storage of [physicalLocal, physicalSession]) {
    expect(storage.setItem).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled();
  }
  vi.unstubAllGlobals();
});

describe("C51 actual avatar getter shape and enum admission", () => {
  it.each(invalid)("$name returns the existing default without repairing raw", ({ value }) => {
    const storage = seed(JSON.stringify(value)), before = rawSnapshot();
    const result = avatar.getAvatar(storage);
    expect(rawSnapshot()).toEqual(before);
    expect(physicalLocal.getItem).toHaveBeenCalledExactlyOnceWith(KEY);
    expect(result).toBe(avatar.DEFAULT_AVATAR);
  });
  it.each(valid)("preserves valid $gender/$style exactly", value => {
    const storage = seed(JSON.stringify(value)), before = rawSnapshot();
    expect(avatar.getAvatar(storage)).toEqual(value); expect(rawSnapshot()).toEqual(before);
  });
  it("preserves valid extra fields without rewriting or normalizing the record", () => {
    const value = { gender: "male", style: "explorer", future: { kept: true, private: PRIVATE } };
    const storage = seed(JSON.stringify(value)), before = rawSnapshot();
    expect(avatar.getAvatar(storage)).toEqual(value); expect(rawSnapshot()).toEqual(before);
  });
  it.each([{ name: "absent", raw: null }, { name: "malformed", raw: "{TEST_C51_BAD_JSON" }, { name: "empty raw", raw: "" }])("keeps the existing $name fallback", ({ raw }) => {
    const storage = seed(raw), before = rawSnapshot();
    expect(avatar.getAvatar(storage)).toBe(avatar.DEFAULT_AVATAR); expect(rawSnapshot()).toEqual(before);
  });
  it("keeps the existing fallback on a denied native read", () => {
    const storage = seed('{"gender":"male","style":"builder"}'), before = rawSnapshot();
    onRead = (area, key) => { if (area === "local" && key === KEY) throw Error("TEST_C51_DENIED"); };
    expect(avatar.getAvatar(storage)).toBe(avatar.DEFAULT_AVATAR); expect(rawSnapshot()).toEqual(before);
  });
  it("returns default for real pending or stale handles without reading a later owner", () => {
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "TEST_C51_A" });
    const pending = store.captureCurrentPersonalStorage();
    expect(avatar.getAvatar(pending)).toBe(avatar.DEFAULT_AVATAR);
    const stale = seed('{"gender":"female","style":"builder"}', { kind: "account", provider: "cdp", userId: "TEST_C51_A" });
    seed('{"gender":"male","style":"explorer"}', { kind: "account", provider: "cdp", userId: "TEST_C51_B" });
    const before = rawSnapshot(); expect(avatar.getAvatar(stale)).toBe(avatar.DEFAULT_AVATAR);
    expect(physicalLocal.getItem).not.toHaveBeenCalled(); expect(rawSnapshot()).toEqual(before);
  });
  it("reads the actual current namespace while retaining guest and other-account bytes", () => {
    seed('{"gender":"female","style":"explorer"}');
    seed('{"gender":"male","style":"warrior"}', { kind: "account", provider: "cdp", userId: "TEST_C51_A" });
    const current = seed('{"gender":"male","style":"builder"}', { kind: "account", provider: "cdp", userId: "TEST_C51_B" });
    const before = rawSnapshot(); expect(avatar.getAvatar(current)).toEqual({ gender: "male", style: "builder" });
    store.beginStorageOwner({ kind: "guest" }).publishReady();
    expect(avatar.getAvatar(store.captureCurrentPersonalStorage())).toEqual({ gender: "female", style: "explorer" });
    expect(rawSnapshot()).toEqual(before);
  });
});

describe.each(["pl", "en"] as const)("C51 actual AvatarPage after explicit emulated effects %s", locale => {
  it.each(uiCases)("$mode renders a supported preview without saving or audio", item => {
    fixture.locale = locale; seed(item.raw); const before = rawSnapshot();
    const observation = renderAfterEffects();
    console.log("C51_AVATAR_PAGE_OBSERVATION " + JSON.stringify({ locale, mode: item.mode, ...observation,
      raw: rawSnapshot(), stateSlots: [...fixture.values], updates: fixture.updates.mock.calls,
      limits: "Actual AvatarPage/getAvatar/product-storage/SectionHeader/Button/ReactDOMServer and locale copy. Only page state/effects use a persistent explicit lifecycle emulator; motion.button is a plain button adapter, locale/voice/storage-hook inputs mocked, storage handle is real. No React hydration, browser scheduling, animation, save handler or native voice claim." }));
    expect(rawSnapshot()).toEqual(before);
    expect(observation.error, "Actual avatar effect and following page render must remain usable").toBeNull();
    expect(observation.html).toContain('<section aria-labelledby="avatar-title">');
    expect(observation.html).toContain(copy[locale].title); expect(observation.html).toContain(copy[locale].save);
    expect(observation.phases.at(-1)?.preview).toBe(copy[locale][item.style]);
    expect(observation.html).toContain(item.gender === "female" ? ">👩</span>" : ">👨</span>");
    expect(observation.html).not.toContain(PRIVATE);
    expect(physicalLocal.getItem).toHaveBeenCalledExactlyOnceWith(KEY);
  });
});
