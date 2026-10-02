import { chatErrorMessage } from "@/lib/chat-errors";

// Kept separate so the actual frontend stream consumer is exercised in tests.
export async function streamFromAPI(
  message: string,
  locale: string,
  history: { role: "user" | "assistant"; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (message: string) => void
) {
  let receivedText = false;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CoachFI-Consent": "ai-coach" },
      body: JSON.stringify({ message, history, locale }),
    });
    if (!res.ok || !res.body || res.headers.get("Content-Type")?.includes("application/json")) {
      let errorMessage = chatErrorMessage("unavailable", locale);
      if (res.headers.get("Content-Type")?.includes("application/json")) {
        const data = await res.json();
        if (typeof data?.error === "string") errorMessage = data.error;
      }
      onError(errorMessage);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) { receivedText = true; onChunk(chunk); }
      }
      const tail = decoder.decode();
      if (tail) { receivedText = true; onChunk(tail); }
    } finally { reader.releaseLock(); }
    if (!receivedText) { onError(chatErrorMessage("unavailable", locale)); return; }
    onDone();
  } catch {
    onError(chatErrorMessage(receivedText ? "interrupted" : "unavailable", locale));
  }
}
