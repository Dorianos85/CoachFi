import { afterEach, describe, expect, it, vi } from "vitest";
import { createVoiceResources, selectLocalVoice, startLocalSpeech } from "../lib/client/local-voice";

function voice(localService: boolean, lang = "pl-PL") {
  return { localService, lang, name: "synthetic voice" } as SpeechSynthesisVoice;
}
afterEach(() => vi.unstubAllGlobals());

describe("local-only conscious voice reading", () => {
  it("rejects browser-cloud voices and never fetches remote TTS", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const speak = vi.fn();
    expect(selectLocalVoice([voice(false)], "pl")).toBeUndefined();
    expect(startLocalSpeech("Przykład", "pl", true, { getVoices: () => [voice(false)], speak },
      () => ({} as SpeechSynthesisUtterance))).toBeNull();
    expect(speak).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires an actual user initiated action even with a local voice", () => {
    const getVoices = vi.fn(() => [voice(true)]); const speak = vi.fn();
    expect(startLocalSpeech("Przykład", "pl", false, { getVoices, speak }, () => ({} as SpeechSynthesisUtterance))).toBeNull();
    expect(getVoices).not.toHaveBeenCalled(); expect(speak).not.toHaveBeenCalled();
  });

  it("uses only a matching local language and binds callbacks before speaking", () => {
    const local = voice(true); const utterance = {} as SpeechSynthesisUtterance;
    const onend = vi.fn();
    const speak = vi.fn((value: SpeechSynthesisUtterance) => expect(value.onend).toBe(onend));
    expect(startLocalSpeech(" Przykład ", "pl", true, { getVoices: () => [voice(false), voice(true, "en-US"), local], speak },
      () => utterance, (value) => { value.onend = onend; })).toBe(utterance);
    expect(utterance.voice).toBe(local); expect(utterance.lang).toBe("pl-PL");
    expect(speak).toHaveBeenCalledOnce();
    expect(startLocalSpeech("Example", "en", true, { getVoices: () => [local], speak }, () => utterance)).toBeNull();
  });

  it("withdrawal cleanup aborts requests, stops playback and invalidates cached audio", () => {
    const synthCancel = vi.fn(); vi.stubGlobal("window", { speechSynthesis: { cancel: synthCancel } });
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const resources = createVoiceResources(); const controller = new AbortController();
    const pause = vi.fn(); const audio = { pause, onended: vi.fn(), onerror: vi.fn() };
    resources.request = controller; resources.audio = audio;
    resources.cache.set("synthetic-key", "blob:synthetic-audio");
    const before = resources.generation;
    resources.cancel(true);
    expect(controller.signal.aborted).toBe(true); expect(pause).toHaveBeenCalledOnce();
    expect(audio.onended).toBeNull(); expect(audio.onerror).toBeNull();
    expect(resources.request).toBeNull(); expect(resources.audio).toBeNull();
    expect(resources.generation).toBeGreaterThan(before);
    expect(resources.cache.size).toBe(0); expect(revoke).toHaveBeenCalledWith("blob:synthetic-audio");
    expect(synthCancel).toHaveBeenCalledOnce(); revoke.mockRestore();
  });
});
