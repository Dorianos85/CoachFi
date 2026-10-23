import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

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

const KEY = "coachfi-avatar", PRIVATE = "TEST_C52_PRIVATE_EXTRA";
const CASES = [
  { mode: "null", raw: "null", gender: "female", style: "warrior" },
  { mode: "bad-style", raw: '{"gender":"male","style":"invalid"}', gender: "female", style: "warrior" },
  { mode: "healthy", raw: '{"gender":"male","style":"builder","future":{"kept":true}}', gender: "male", style: "builder" },
] as const;
const COPY = {
  pl: { caption: "Podgląd wyglądu", oldCaption: "Podgląd na żywo", title: "Twój finansowy avatar", warrior: "Wojownik", builder: "Budowniczy", save: "Zapisz avatar" },
  en: { caption: "Appearance preview", oldCaption: "Live preview", title: "Your Financial Avatar", warrior: "Warrior", builder: "Builder", save: "Save avatar" },
};
let store: typeof import("@/lib/product-storage");
let AvatarPage: () => ReactElement;
let local: Map<string, string>, session: Map<string, string>;
let physicalLocal: ReturnType<typeof physical>, physicalSession: ReturnType<typeof physical>;
function physical(bytes: Map<string, string>) {
  return { getItem: vi.fn((key: string) => bytes.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); }),
    removeItem: vi.fn((key: string) => { bytes.delete(key); }) };
}
function rawSnapshot() { return { local: [...local], session: [...session] }; }
function seed(raw: string) {
  const lease = store.beginStorageOwner({ kind: "guest" });
  expect(lease.storage.setItem(KEY, raw)).toBe(true); expect(lease.publishReady()).toBe(true);
  for (const storage of [physicalLocal, physicalSession]) { storage.getItem.mockClear(); storage.setItem.mockClear(); storage.removeItem.mockClear(); }
  fixture.storage = store.captureCurrentPersonalStorage();
}
function resetHooks() {
  fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear();
  fixture.values.clear(); fixture.deps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false;
}
function staticClaimMatches(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  // Scope is the removed score/stat blocks. Existing descriptive prose and
  // the financial-avatar title remain unchanged and are not a measured score.
  return text.match(/\b(?:67|40|80)\s*%|\b62\s*\/\s*100\b|Financial\s+Shield|\bSaving\b|\bInvesting\b|\bCredit\b/g) ?? [];
}
function renderAfterEffects() {
  let phase = "initial", effectRuns = 0;
  const frames: Array<{ phase: string; html: string; preview: string | null; staticClaims: string[] }> = [];
  try {
    for (let turn = 0; turn < 8; turn++) {
      fixture.slot = 0; fixture.dirty = false; phase = turn === 0 ? "initial-render" : "after-effect-render";
      const html = renderToStaticMarkup(AvatarPage());
      frames.push({ phase, html, preview: /<p[^>]*class="[^"]*tracking-widest[^"]*"[^>]*>([^<]*)<\/p>/.exec(html)?.[1] ?? null, staticClaims: staticClaimMatches(html) });
      phase = "effect"; fixture.effects.splice(0).forEach(callback => { effectRuns++; callback(); });
      if (!fixture.dirty && fixture.effects.length === 0) return { frames, effectRuns, error: null };
    }
    throw Error("C52 fixture did not settle within eight render/effect turns");
  } catch (caught) {
    return { frames, effectRuns, error: { phase, name: caught instanceof Error ? caught.name : "non-Error", message: caught instanceof Error ? caught.message : String(caught) } };
  }
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl";
  local = new Map([["coachfi-tokens", "125"], ["coachfi-srs", "[]"], ["TEST_C52_UNRELATED", PRIVATE]]);
  session = new Map([[KEY, '{"gender":"male","style":"explorer"}']]);
  physicalLocal = physical(local); physicalSession = physical(session);
  vi.stubGlobal("window", { localStorage: physicalLocal, sessionStorage: physicalSession, dispatchEvent: vi.fn(() => true) });
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("No network authorized in C52"); }));
  store = await import("@/lib/product-storage"); AvatarPage = (await import("@/app/avatar/page")).default;
});
afterEach(() => {
  resetHooks(); expect(fetch).not.toHaveBeenCalled(); expect(fixture.notify).not.toHaveBeenCalled();
  expect(fixture.speak).not.toHaveBeenCalled(); expect(fixture.stop).not.toHaveBeenCalled();
  for (const storage of [physicalLocal, physicalSession]) { expect(storage.setItem).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled(); }
  vi.unstubAllGlobals();
});

describe.each(["pl", "en"] as const)("C52 actual AvatarPage appearance-only preview %s", locale => {
  it.each(CASES)("$mode never displays the static financial values in any observed frame", item => {
    fixture.locale = locale; seed(item.raw); const before = rawSnapshot();
    const observation = renderAfterEffects();
    console.log("C52_AVATAR_PREVIEW_OBSERVATION " + JSON.stringify({ locale, mode: item.mode, ...observation, raw: rawSnapshot(),
      stateSlots: [...fixture.values], updates: fixture.updates.mock.calls,
      limits: "Actual page/getAvatar/owner handles/SectionHeader/Button/ReactDOMServer and copy; page state/effects explicitly emulated, motion button adapter, language/voice/storage-hook inputs mocked. Every initial/following frame checked. No hydration, native scheduling, animation, save/voice, personal score or formula validation." }));
    // Primary oracle comes first and cannot pass with no rendered samples.
    expect({ observed: observation.frames.length > 0, claims: observation.frames.flatMap(frame => frame.staticClaims) },
      "Every observed avatar preview frame must omit the static financial claims").toEqual({ observed: true, claims: [] });
    expect(observation.error).toBeNull(); expect(observation.effectRuns).toBe(1);
    expect(observation.frames.map(frame => frame.preview)).toEqual(item.mode === "healthy"
      ? [COPY[locale].warrior, COPY[locale].builder] : [COPY[locale].warrior]);
    for (const frame of observation.frames) {
      expect(frame.html).toContain(COPY[locale].caption); expect(frame.html).not.toContain(COPY[locale].oldCaption);
      expect(frame.html).toContain('<section aria-labelledby="avatar-title">');
      expect(frame.html).toContain(COPY[locale].title); expect(frame.html).toContain(COPY[locale].save);
      expect(frame.html).not.toContain(PRIVATE);
    }
    const final = observation.frames.at(-1)!;
    expect(final.preview).toBe(COPY[locale][item.style]);
    expect(final.html).toContain(item.gender === "female" ? ">👩</span>" : ">👨</span>");
    expect(rawSnapshot()).toEqual(before); expect(physicalLocal.getItem).toHaveBeenCalledExactlyOnceWith(KEY);
  });
});
