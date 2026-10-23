import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const MARKER = "SYNTHETIC_PR19_AUTH_NEVER_EXPORT";
const FORBIDDEN = ["coachfi-auth", "coachfi-supabase-auth", "coachfi-auth-code-verifier",
  "sb-synthetic-auth-token", "cdp-session", "coachfi-wallet", "coachfi-future-unknown"];
let local: Map<string, string>, session: Map<string, string>;
let store: typeof import("@/lib/product-storage"), data: typeof import("@/lib/data-export");
type StorageAccess = (area: "local" | "session", key: string) => void;
let read: ReturnType<typeof vi.fn<StorageAccess>>, write: ReturnType<typeof vi.fn<StorageAccess>>, outbound: ReturnType<typeof vi.fn<() => never>>;
let onRead: ((area: "local" | "session", key: string) => void) | undefined;

function physical(values: Map<string, string>, area: "local" | "session") {
  return {
    getItem: (key: string) => { read(area, key); onRead?.(area, key); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => { write(area, key); values.set(key, value); },
    removeItem: (key: string) => { write(area, key); values.delete(key); },
  };
}
function snapshot() { return { local: [...local], session: [...session] }; }
function ready(userId = "SYNTHETIC_A") {
  const lease = store.beginStorageOwner({ kind: "account", provider: "cdp", userId });
  lease.publishReady({ localOnly: true });
  return { local: store.captureCurrentPersonalStorage(), session: store.captureCurrentPersonalStorage("session") };
}
function exportOwned(handles: { local: PersonalStorageHandle; session: PersonalStorageHandle }) {
  return data.buildOwnedLocalDataExport(handles.local, handles.session);
}

beforeEach(async () => {
  vi.resetModules(); local = new Map(); session = new Map(); onRead = undefined;
  read = vi.fn<StorageAccess>(); write = vi.fn<StorageAccess>(); outbound = vi.fn(() => { throw new Error("No network authorized."); });
  vi.stubGlobal("fetch", outbound);
  vi.stubGlobal("window", Object.assign(new EventTarget(), {
    localStorage: physical(local, "local"), sessionStorage: physical(session, "session"),
  }));
  store = await import("@/lib/product-storage"); data = await import("@/lib/data-export");
});
afterEach(() => { expect(outbound).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

describe("PR19 exact live-auth-key export regression", () => {
  it("never enumerates storage or reads auth/PKCE/wallet/unknown keys in either area", () => {
    const storage = (tokens: number) => ({
      get length(): number { throw new Error("Enumerating real storage is forbidden."); },
      key: () => { throw new Error("Enumerating real storage is forbidden."); },
      getItem: vi.fn((key: string) => {
        if (FORBIDDEN.includes(key)) throw new Error("Auth/unknown key must not be read.");
        return key === "coachfi-tokens" ? JSON.stringify(tokens) : null;
      }),
    });
    const a = storage(25), b = storage(5); const result = data.buildLocalDataExport(a, b);
    expect(result.localStorage).toEqual({ "coachfi-tokens": 25 });
    expect(result.sessionStorage).toEqual({ "coachfi-tokens": 5 });
    for (const input of [a, b]) expect(input.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(FORBIDDEN.some((key) => (data.LOCAL_PRODUCT_KEYS as readonly string[]).includes(key))).toBe(false);
  });

  it("retains only current-owner selected data while synthetic sessions and other owners remain untouched", () => {
    const b = ready("SYNTHETIC_B"); b.local.setItem("coachfi-tokens", "999");
    const a = ready(); a.local.setItem("coachfi-tokens", "25"); a.session.setItem("coachfi-user", JSON.stringify({ setupDone: true, refresh_token: MARKER }));
    for (const values of [local, session]) for (const key of FORBIDDEN) values.set(key, JSON.stringify({ access_token: MARKER, refresh_token: MARKER }));
    local.set("coachfi-locale-v1", "pl");
    const before = snapshot(); read.mockClear(); write.mockClear();
    const result = exportOwned(a); const serialized = JSON.stringify(result);
    expect(result.localStorage).toEqual({ "coachfi-tokens": 25, "coachfi-locale-v1": "pl" });
    expect(result.sessionStorage).toEqual({ "coachfi-user": { setupDone: true } });
    expect(result.ownerKind).toBe("account"); expect(result.scope).toBe("selected_current_owner_local_product_data");
    expect(serialized).not.toMatch(/SYNTHETIC_A|SYNTHETIC_B|SYNTHETIC_PR19_AUTH|access_token|refresh_token/);
    expect(read.mock.calls.every(([, key]) => !FORBIDDEN.includes(key) && !String(key).includes("SYNTHETIC_B"))).toBe(true);
    expect(snapshot()).toEqual(before); expect(write).not.toHaveBeenCalled();
  });

  it("does not copy credential-shaped fields, arbitrary text, malformed values or legacy consent grants", async () => {
    const { createConsentRecord, CONSENT_STORAGE_KEY } = await import("@/lib/consent");
    const values = new Map<string, string>([
      ["coachfi-user", JSON.stringify({ setupDone: true, name: MARKER, goal: MARKER, auth: { access_token: MARKER } })],
      ["coachfi-srs", MARKER],
      ["coachfi-avatar", JSON.stringify({ gender: "female", style: "builder", session: { refresh_token: MARKER } })],
      [CONSENT_STORAGE_KEY, JSON.stringify({ ...createConsentRecord({ aiCoach: true, voice: true }), version: "2026-05-01" })],
    ]);
    const result = data.collectProductStorage({ getItem: (key) => values.get(key) ?? null });
    expect(result).toEqual({ "coachfi-avatar": { gender: "female", style: "builder" }, "coachfi-user": { setupDone: true } });
    expect(JSON.stringify(result)).not.toContain(MARKER);
  });

  it.each(["local", "session"] as const)("a denied %s read fails the export instead of publishing a misleading partial result", (area) => {
    const handles = ready(); const before = snapshot(); write.mockClear();
    onRead = (actual, key) => { if (actual === area && key.endsWith(":coachfi-tokens")) throw new Error("Synthetic denied read"); };
    expect(() => exportOwned(handles)).toThrow("Synthetic denied read");
    expect(snapshot()).toEqual(before); expect(write).not.toHaveBeenCalled();
  });

  it("rejects stale or mixed-owner handles before any personal read", () => {
    const a = ready(); const b = ready("SYNTHETIC_B"); read.mockClear(); write.mockClear(); const before = snapshot();
    expect(() => exportOwned(a)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(b.local, a.session)).toThrow("Storage owner changed");
    expect(read).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before);
  });

  it("a same-user new revision during collection invalidates the captured export", () => {
    const handles = ready(); handles.local.setItem("coachfi-tokens", "25");
    const before = snapshot(); write.mockClear(); let transitioned = false;
    onRead = (area, key) => {
      if (!transitioned && area === "local" && key.endsWith(":coachfi-tokens")) { transitioned = true; ready(); }
    };
    expect(() => exportOwned(handles)).toThrow("Storage owner changed");
    expect(transitioned).toBe(true); expect(snapshot()).toEqual(before); expect(write).not.toHaveBeenCalled();
  });
});
