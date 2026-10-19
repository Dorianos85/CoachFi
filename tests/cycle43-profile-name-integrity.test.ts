import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const bridges = vi.hoisted(() => ({ cloud: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: bridges.cloud }));
const KEY = "coachfi-user";
let getUser: typeof import("@/lib/user").getUser;
let getDisplayName: typeof import("@/lib/user").getDisplayName;

const invalidNames = [
  { label: "null name", name: null },
  { label: "numeric name", name: 42 },
  { label: "boolean name", name: false },
  { label: "array name", name: ["Ada"] },
  { label: "object name", name: { label: "Ada" } },
  { label: "JSON object with a spoofed trim member", name: { trim: "FIXTURE_NOT_A_FUNCTION" } },
] as const;
const validNames = [
  { label: "empty string", name: "", expected: "Your" },
  { label: "only whitespace", name: "\t \u00a0\n", expected: "Your" },
  { label: "trimmed ordinary name", name: "  Ada  ", expected: "Ada" },
  { label: "Unicode and emoji", name: " Łucja 🌱 ", expected: "Łucja 🌱" },
  { label: "literal percent sequence", name: " %2F ", expected: "%2F" },
  { label: "literal markup string", name: " <em>Ada</em> ", expected: "<em>Ada</em>" },
] as const;
const profileControls = [
  { label: "absent profile", raw: null },
  { label: "malformed profile JSON", raw: "{FIXTURE_BAD_PROFILE" },
  { label: "profile without name retains its unknown fields", raw: '{"goal":"FIXTURE","future":{"kept":true}}' },
  { label: "literal JSON null still reaches the helper as an actual getUser object", raw: "null" },
] as const;

function storage(raw: string | null) {
  const bytes = new Map([["coachfi-tokens", "125"], ["FIXTURE_UNRELATED", "retained"]]);
  if (raw !== null) bytes.set(KEY, raw);
  const get = vi.fn((key: string) => bytes.get(key) ?? null);
  const put = vi.fn((_key: string, _value: string): boolean => { throw new Error("FIXTURE name rendering must not write"); });
  const remove = vi.fn((_key: string): boolean => { throw new Error("FIXTURE name rendering must not remove"); });
  const release = vi.fn();
  const handle: PersonalStorageHandle = Object.freeze({
    owner: Object.freeze({ kind: "guest" as const }), revision: 43, area: "local" as const,
    isCurrent: () => true, getItem: get, setItem: put, removeItem: remove, release,
  });
  return { bytes, handle, get, put, remove, release };
}
function readAndDisplay(label: string, raw: string | null) {
  const state = storage(raw), before = new Map(state.bytes);
  const profile = getUser(state.handle); // Never pass a fabricated/null profile to the helper under review.
  const profileBefore = JSON.stringify(profile);
  let display: string | undefined, error: unknown = null;
  try { display = getDisplayName(profile); } catch (caught) { error = caught; }
  console.log("C43_PROFILE_NAME_DATA_OBSERVATION " + JSON.stringify({
    label, profile, display, error: error instanceof Error ? { name: error.name, message: error.message } : error,
    before: [...before], after: [...state.bytes], reads: state.get.mock.calls,
    writes: state.put.mock.calls, removes: state.remove.mock.calls, releases: state.release.mock.calls.length,
    profileBefore, profileAfter: JSON.stringify(profile), cloudCalls: bridges.cloud.mock.calls.length,
  }));
  expect(profile).not.toBeNull(); expect(typeof profile).toBe("object");
  expect(JSON.stringify(profile)).toBe(profileBefore);
  expect(state.bytes).toEqual(before); expect(state.get).toHaveBeenCalledExactlyOnceWith(KEY);
  expect(state.put).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  expect(state.release).not.toHaveBeenCalled(); expect(bridges.cloud).not.toHaveBeenCalled();
  return { profile, display, error };
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("FIXTURE no network in C43 profile display review"); }));
  ({ getUser, getDisplayName } = await import("@/lib/user"));
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C43 actual stored profile to display-name boundary", () => {
  it.each(invalidNames)("$label uses the existing Your fallback without throwing or repairing the profile", sample => {
    const raw = JSON.stringify({ name: sample.name, goal: "FIXTURE", setupDone: false, future: { kept: true } });
    const outcome = readAndDisplay(sample.label, raw);
    expect(outcome.error).toBeNull(); expect(outcome.display).toBe("Your");
    expect(outcome.profile.name).toEqual(sample.name); // Getter compatibility: invalid stored value remains untouched.
    expect((outcome.profile as unknown as Record<string, unknown>).future).toEqual({ kept: true });
  });

  it.each(validNames)("$label retains the existing trim and literal-string semantics", sample => {
    const outcome = readAndDisplay(sample.label, JSON.stringify({ name: sample.name, future: "retained" }));
    expect(outcome.error).toBeNull(); expect(outcome.display).toBe(sample.expected);
    expect(outcome.profile.name).toBe(sample.name);
    expect((outcome.profile as unknown as Record<string, unknown>).future).toBe("retained");
  });

  it.each(profileControls)("$label preserves the actual getter convention and Your display", sample => {
    const outcome = readAndDisplay(sample.label, sample.raw);
    expect(outcome.error).toBeNull(); expect(outcome.display).toBe("Your");
    expect(outcome.profile.name).toBe("");
    if (sample.label === "profile without name retains its unknown fields") {
      expect(outcome.profile.goal).toBe("FIXTURE");
      expect((outcome.profile as unknown as Record<string, unknown>).future).toEqual({ kept: true });
    }
  });
});
