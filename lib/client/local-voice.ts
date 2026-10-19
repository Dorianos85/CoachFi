import { localeSpeechLang, type Locale } from "@/lib/i18n";

/** No remote/browser-cloud voice is accepted as a fallback. */
export function selectLocalVoice(voices: readonly SpeechSynthesisVoice[], locale: Locale) {
  const language = localeSpeechLang[locale].split("-")[0].toLowerCase();
  return voices.find((voice) => voice.localService === true &&
    typeof voice.lang === "string" && voice.lang.split("-")[0].toLowerCase() === language);
}

/** Shared cleanup for pending requests, old cached media and local utterances. */
export function createVoiceResources() {
  const resources = {
    generation: 0,
    request: null as AbortController | null,
    audio: null as Pick<HTMLAudioElement, "pause" | "onended" | "onerror"> | null,
    cache: new Map<string, string>(),
    cancel(clearCache = false) {
      resources.generation += 1;
      resources.request?.abort();
      resources.request = null;
      if (resources.audio) {
        resources.audio.onended = null;
        resources.audio.onerror = null;
        resources.audio.pause();
        resources.audio = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      if (clearCache) {
        for (const url of resources.cache.values()) URL.revokeObjectURL(url);
        resources.cache.clear();
      }
    },
  };
  return resources;
}

export function startLocalSpeech(
  text: string,
  locale: Locale,
  userInitiated: boolean,
  synthesis: Pick<SpeechSynthesis, "getVoices" | "speak">,
  createUtterance: (text: string) => SpeechSynthesisUtterance,
  configure: (utterance: SpeechSynthesisUtterance) => void = () => {},
): SpeechSynthesisUtterance | null {
  if (!userInitiated || !text.trim()) return null;
  const voice = selectLocalVoice(synthesis.getVoices(), locale);
  if (!voice) return null;
  const utterance = createUtterance(text.trim().slice(0, 500));
  utterance.voice = voice;
  utterance.lang = voice.lang;
  configure(utterance);
  synthesis.speak(utterance);
  return utterance;
}
