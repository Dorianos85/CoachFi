import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildLocalDataExport, deleteLocalProductData } from "../lib/data-export";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, createConsentRecord,
  readStoredConsent, writeStoredConsent } from "../lib/consent";
import { getApiCredentials, setApiAccessTokenGetter } from "../lib/client/api-credentials";
import { createVoiceResources, startLocalSpeech } from "../lib/client/local-voice";
import { beginStorageOwner, captureCurrentPersonalStorage } from "../lib/product-storage";

const cloud = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: cloud.notify }));

function storage(values: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]));
  return { data, getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }) };
}

let local: ReturnType<typeof storage>;
let events: EventTarget;
beforeEach(() => {
  local = storage({ [CONSENT_STORAGE_KEY]: createConsentRecord({ voice: true, aiCoach: true }) });
  events = new EventTarget();
  vi.stubGlobal("window", { localStorage: local, dispatchEvent: events.dispatchEvent.bind(events) });
  cloud.notify.mockReset();
});
afterEach(() => { setApiAccessTokenGetter(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("independent P0 client review using synthetic state only", () => {
  it("legacy accepted-required records cannot obtain a credential", async () => {
    local.data.set(CONSENT_STORAGE_KEY, JSON.stringify({ ...createConsentRecord({ voice: true }), version: "2026-05-01" }));
    const getter = vi.fn(async () => "SYNTHETIC_TOKEN");
    setApiAccessTokenGetter(getter);
    expect(readStoredConsent()).toBeNull();
    expect(await getApiCredentials(["voice"])).toBeNull();
    expect(getter).not.toHaveBeenCalled();
  });

  it.each(["same_callback", "logout_then_same_callback"])("invalidates pending credentials after registration: %s", async (kind) => {
    let resolve!: (token: string) => void;
    const stable = () => new Promise<string>((finish) => { resolve = finish; });
    setApiAccessTokenGetter(stable);
    const pending = getApiCredentials(["voice"]);
    if (kind === "logout_then_same_callback") setApiAccessTokenGetter(null);
    setApiAccessTokenGetter(stable);
    resolve("SYNTHETIC_OLD_ACCOUNT_TOKEN");
    expect(await pending).toBeNull();
  });

  it("rejects a late credential when consent was withdrawn without a caller abort", async () => {
    let resolve!: (token: string) => void;
    setApiAccessTokenGetter(() => new Promise((finish) => { resolve = finish; }));
    const pending = getApiCredentials(["voice", "aiCoach"]);
    writeStoredConsent(createConsentRecord());
    resolve("SYNTHETIC_LATE_TOKEN");
    expect(await pending).toBeNull();
  });

  it("announces withdrawal synchronously after storage update and before cloud sync", () => {
    const order: string[] = [];
    events.addEventListener(CONSENT_CHANGED_EVENT, () => {
      order.push("withdrawal");
      expect(readStoredConsent()?.optional.voice).toBe(false);
      expect(cloud.notify).not.toHaveBeenCalled();
    });
    cloud.notify.mockImplementation(() => order.push("cloud"));
    writeStoredConsent(createConsentRecord());
    expect(order).toEqual(["withdrawal", "cloud"]);
  });

  it("never reads exact legacy coachfi-auth or SDK sessions from either storage", () => {
    const marker = "SYNTHETIC_SESSION_MUST_STAY_PRIVATE";
    const session = storage({ "coachfi-auth": { access_token: marker }, "cdp-session": marker,
      "coachfi-unknown": marker, "coachfi-user": { setupDone: true, name: marker, goal: marker },
      "coachfi-tokens": 19 });
    local.data.set("coachfi-auth", JSON.stringify({ refresh_token: marker }));
    const payload = buildLocalDataExport(local, session);
    for (const item of [local, session]) {
      expect(item.getItem.mock.calls.map(([key]) => key)).not.toContain("coachfi-auth");
      expect(item.getItem.mock.calls.map(([key]) => key)).not.toContain("cdp-session");
      expect(item.getItem.mock.calls.map(([key]) => key)).not.toContain("coachfi-unknown");
    }
    expect(payload.sessionStorage["coachfi-user"]).toEqual({ setupDone: true });
    expect(payload.sessionStorage["coachfi-tokens"]).toBe(19);
    expect(JSON.stringify(payload)).not.toContain(marker);
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session, dispatchEvent: events.dispatchEvent.bind(events) });
    beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
    expect(deleteLocalProductData(captureCurrentPersonalStorage())).toBe(true);
    expect(session.data.has("coachfi-auth")).toBe(true);
    expect(session.data.has("cdp-session")).toBe(true);
    expect(session.data.has("coachfi-tokens")).toBe(false);
  });

  it("accepts only an explicit local voice matching the requested language", () => {
    const speak = vi.fn();
    const remote = { localService: false, lang: "pl-PL" } as SpeechSynthesisVoice;
    const ambiguous = { localService: "true", lang: "pl-PL" } as unknown as SpeechSynthesisVoice;
    const english = { localService: true, lang: "en-US" } as SpeechSynthesisVoice;
    const polish = { localService: true, lang: "pl-PL" } as SpeechSynthesisVoice;
    const utterance = {} as SpeechSynthesisUtterance;
    const create = vi.fn(() => utterance);
    expect(startLocalSpeech("Przykład", "pl", true, { getVoices: () => [remote, ambiguous, english], speak }, create)).toBeNull();
    expect(startLocalSpeech("Przykład", "pl", false, { getVoices: () => [polish], speak }, create)).toBeNull();
    expect(speak).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(startLocalSpeech(" Przykład ", "pl", true, { getVoices: () => [remote, polish], speak }, create)).toBe(utterance);
    expect(utterance.voice).toBe(polish);
    expect(speak).toHaveBeenCalledOnce();
  });

  it("repeated revocation cleanup cannot replay or retain a previous media generation", () => {
    const cancel = vi.fn(); vi.stubGlobal("window", { speechSynthesis: { cancel } });
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const resources = createVoiceResources();
    const request = new AbortController(); const pause = vi.fn();
    const media = { pause, onended: vi.fn(), onerror: vi.fn() };
    resources.request = request; resources.audio = media;
    resources.cache.set("test", "blob:synthetic-review");
    const generation = resources.generation;
    resources.cancel(true); resources.cancel(true);
    expect(request.signal.aborted).toBe(true);
    expect(resources.generation).toBeGreaterThan(generation);
    expect(media.onended).toBeNull(); expect(media.onerror).toBeNull();
    expect(pause).toHaveBeenCalledOnce(); expect(revoke).toHaveBeenCalledOnce();
    expect(resources.cache.size).toBe(0); expect(resources.audio).toBeNull();
  });
});
