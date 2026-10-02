import "server-only";

import { chatErrorMessage } from "@/lib/chat-errors";
import { getNumberEnv, getOptionalEnv } from "@/lib/server-env";

const PROVIDERS = [
  { name: "cerebras", model: "gpt-oss-120b", url: "https://api.cerebras.ai/v1/chat/completions", key: "CEREBRAS_API_KEY" },
  { name: "groq", model: "openai/gpt-oss-120b", url: "https://api.groq.com/openai/v1/chat/completions", key: "GROQ_API_KEY" },
] as const;

type Message = { role: "system" | "user" | "assistant"; content: string };
type Category = "rate_limit" | "quota" | "server" | "timeout" | "network" | "cancelled" | "authentication" | "invalid_request" | "protocol" | "output_limit" | "configuration";
class ProviderError extends Error {
  constructor(readonly category: Category, readonly retryable = false) {
    super(category); // Never carry an upstream message, request or response into logs.
  }
}

function classify(error: unknown, signal: AbortSignal): ProviderError {
  if (signal.aborted && signal.reason?.category === "cancelled") return signal.reason as ProviderError;
  if (error instanceof ProviderError) return error;
  if (signal.aborted) return signal.reason as ProviderError;
  return new ProviderError(error instanceof TypeError ? "network" : "protocol", error instanceof TypeError);
}

function httpError(status: number, code?: unknown) {
  if (status === 402 || ["insufficient_quota", "quota_exceeded", "billing_hard_limit_reached", "credit_limit_exceeded"].includes(String(code))) return new ProviderError("quota", true);
  if (status === 429) return new ProviderError("rate_limit", true);
  if (code === "invalid_request_error" || code === "invalid_request") return new ProviderError("invalid_request");
  if (status >= 500) return new ProviderError("server", true);
  if (status === 408) return new ProviderError("timeout", true);
  if (status === 401 || status === 403) return new ProviderError("authentication");
  return new ProviderError("invalid_request");
}

// Bound both fetch and body reads, including a provider that stops sending SSE data.
async function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { void promise.catch(() => {}); throw signal.reason; }
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try { return await Promise.race([promise, aborted]); }
  finally { signal.removeEventListener("abort", onAbort); }
}

async function* textDeltas(body: ReadableStream<Uint8Array>, signal: AbortSignal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await withAbort(reader.read(), signal);
      if (done) throw new ProviderError("network", true); // EOF without a completion marker.
      buffer += decoder.decode(value, { stream: true });
      // Protect memory without accumulating the conversation or generated answer.
      if (buffer.length > 262144) throw new ProviderError("protocol");
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^ /, "")).join("\n");
        if (!data) continue;
        if (data.trim() === "[DONE]") return;
        let event;
        try { event = JSON.parse(data); }
        catch { throw new ProviderError("protocol"); }
        if (!event || typeof event !== "object") throw new ProviderError("protocol");
        if (event.error) throw httpError(Number(event.error.status ?? 500), event.error.code);
        const choice = event.choices?.[0];
        // Only final-answer content is forwarded. Never forward reasoning/tool fields.
        if (typeof choice?.delta?.content === "string" && choice.delta.content) yield choice.delta.content as string;
        if (choice?.finish_reason === "length") throw new ProviderError("output_limit");
        if (choice?.finish_reason === "stop") return;
        if (choice?.finish_reason) throw new ProviderError("protocol");
      }
    }
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

type Options = {
  // Injection is used only by local tests; clients cannot override providers or deadlines.
  fetch?: typeof fetch;
  firstTokenMs?: number;
  totalMs?: number;
};

export async function createChatResponse(req: Request, messages: Message[], locale?: string, options: Options = {}) {
  const fetcher = options.fetch ?? fetch;
  const deadline = Date.now() + (options.totalMs ?? 45000);
  const firstTokenMs = options.firstTokenMs ?? 15000;
  const configured = PROVIDERS.map((provider) => ({ ...provider, apiKey: getOptionalEnv(provider.key) }));
  const errorResponse = (configuration = false) => Response.json({
    error: chatErrorMessage(configuration ? "configuration" : "unavailable", locale), fallback: true,
  }, { status: 503, headers: { "Cache-Control": "no-store" } });

  for (const provider of configured) {
    const started = Date.now();
    const fallback = provider.name === "groq";
    let logged = false;
    let attempted = false;
    const log = (event: "completed" | "error" | "skipped", category: Category | null = null) => {
      if (logged) return;
      logged = true;
      console.info(JSON.stringify({ event: `chat.${event}`, provider: provider.name, model: provider.model,
        latency_ms: Date.now() - started, error_category: category, fallback: fallback && attempted }));
    };
    if (!provider.apiKey) { log("skipped", "configuration"); continue; }
    if (req.signal.aborted) return new Response(null, { status: 499 });
    if (Date.now() >= deadline) { log("error", "timeout"); break; }

    const controller = new AbortController();
    const cancel = () => controller.abort(new ProviderError("cancelled"));
    req.signal.addEventListener("abort", cancel, { once: true });
    const timeout = () => controller.abort(new ProviderError("timeout", true));
    const totalTimer = setTimeout(timeout, Math.max(1, deadline - Date.now()));
    const firstTimer = setTimeout(timeout, firstTokenMs);
    let iterator: AsyncGenerator<string> | undefined;
    const cleanup = () => {
      clearTimeout(firstTimer);
      clearTimeout(totalTimer);
      req.signal.removeEventListener("abort", cancel);
      // Abort before iterator.return(): its next() may be waiting on a body read.
      controller.abort(new ProviderError("cancelled"));
      if (iterator) void iterator.return(undefined).catch(() => {});
    };

    try {
      attempted = true;
      const upstream = await withAbort(fetcher(provider.url, {
        method: "POST", signal: controller.signal, cache: "no-store", redirect: "error",
        headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: provider.model, messages, stream: true, reasoning_effort: "low",
          // GPT-OSS counts reasoning in this budget too; the old 600-token limit is insufficient.
          max_completion_tokens: Math.trunc(getNumberEnv("CHAT_MAX_COMPLETION_TOKENS", 2048, 256, 4096)),
          ...(fallback ? { include_reasoning: false } : { reasoning_format: "hidden" }),
        }),
      }), controller.signal);
      if (!upstream.ok) {
        // Status is sufficient except for quota codes returned with HTTP 400.
        // Do not wait for an error body on a known retryable status.
        if (upstream.status !== 400) {
          void upstream.body?.cancel().catch(() => {});
          throw httpError(upstream.status);
        }
        let code: unknown;
        try {
          const payload = await withAbort(upstream.json(), controller.signal);
          code = payload?.error?.code;
        } catch { /* Classification by status remains possible without a JSON body. */ }
        throw httpError(upstream.status, code);
      }
      if (!upstream.body || !upstream.headers.get("content-type")?.includes("text/event-stream")) {
        void upstream.body?.cancel().catch(() => {});
        throw new ProviderError("protocol");
      }
      iterator = textDeltas(upstream.body, controller.signal);
      const first = await iterator.next();
      if (first.done) throw new ProviderError("protocol");
      clearTimeout(firstTimer);
      const encoder = new TextEncoder();
      // Provider selection ends here, before the Response is returned. Once text is
      // committed, failures terminate this stream; they can never start another model.
      const body = new ReadableStream<Uint8Array>({
        start(stream) { stream.enqueue(encoder.encode(first.value)); },
        async pull(stream) {
          try {
            const next = await iterator!.next();
            if (next.done) { log("completed"); stream.close(); cleanup(); }
            else stream.enqueue(encoder.encode(next.value));
          } catch (error) {
            log("error", classify(error, controller.signal).category);
            stream.error(new Error("Chat stream interrupted"));
            cleanup();
          }
        },
        cancel() { log("error", "cancelled"); cleanup(); },
      });
      return new Response(body, { headers: {
        "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store",
        "X-CoachFI-Provider": provider.name, "X-CoachFI-Model": provider.model,
      } });
    } catch (error) {
      const failure = classify(error, controller.signal);
      log("error", failure.category);
      cleanup();
      if (failure.category === "cancelled") return new Response(null, { status: 499 });
      if (!failure.retryable) return errorResponse();
      // One recovery attempt at most: primary once, then configured fallback once.
    }
  }
  return errorResponse(!configured.some((provider) => provider.apiKey));
}
