import Anthropic from "@anthropic-ai/sdk";

import {
  assertSameOrigin,
  jsonError,
  rateLimit,
  readJsonWithLimit,
  requireConsentHeader,
} from "@/lib/api-security";
import { localeClaudeLanguage, type Locale } from "@/lib/i18n";
import { getNumberEnv, getOptionalEnv } from "@/lib/server-env";

const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENROUTER_MODEL = "openrouter/auto";

const SYSTEM_PROMPT = `You are Mila, Coach FI's warm and direct financial education coach.

Your role: Help users build financial confidence through clear, actionable, jargon-free explanations.

Topics you cover: saving habits, emergency funds, inflation, budgeting (50/30/20), compound interest, index funds/ETFs, debt management (avalanche/snowball), credit scores, retirement planning, net worth, behavioral finance.

Rules:
- Keep every response to 2–4 sentences max. Concise wins.
- Be encouraging but honest — don't sugarcoat poor financial habits.
- Never recommend specific stocks, funds by name, or promise returns.
- If asked about crypto/Solana: explain concepts neutrally, warn about volatility, never hype.
- If asked something outside finance: gently redirect to financial topics.
- Speak in the requested UI language when provided. Supported languages: English, Polish, Japanese.
- End with one actionable takeaway when relevant.`;

function getLanguageInstruction(locale: string | undefined) {
  if (!locale || !(locale in localeClaudeLanguage)) {
    return "Respond in the same language as the user's latest message.";
  }

  const language = localeClaudeLanguage[locale as Locale];
  return `The current Coach FI UI language is ${language}. Respond in ${language}.`;
}

type ChatPayload = {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  messages?: { role: "user" | "assistant"; content: string }[];
  locale?: string;
};

type NormalizedChat = {
  message: string;
  safeHistory: { role: "user" | "assistant"; content: string }[];
  locale?: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

function normalizePayload(payload: ChatPayload): NormalizedChat | null {
  const message =
    typeof payload.message === "string"
      ? payload.message
      : Array.isArray(payload.messages)
        ? [...payload.messages].reverse().find((item) => item.role === "user")?.content ?? ""
        : "";

  if (typeof message !== "string" || message.trim().length === 0 || message.length > 800) {
    return null;
  }

  const rawHistory = Array.isArray(payload.history)
    ? payload.history
    : Array.isArray(payload.messages)
      ? payload.messages.slice(0, -1)
      : [];

  const safeHistory = rawHistory
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.length <= 1000
    )
    .slice(-6);

  return {
    message: message.trim(),
    safeHistory,
    locale: payload.locale,
  };
}

function getSystemPrompt(locale: string | undefined) {
  return `${SYSTEM_PROMPT}\n\n${getLanguageInstruction(locale)}`;
}

async function createAnthropicResponse(apiKey: string, chat: NormalizedChat) {
  const client = new Anthropic({ apiKey });
  const model = getOptionalEnv("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
  const maxTokens = getNumberEnv("ANTHROPIC_MAX_TOKENS", 256, 64, 1024);

  const stream = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: getSystemPrompt(chat.locale),
    messages: [
      ...chat.safeHistory, // last 6 turns for context, keeps costs low
      { role: "user", content: chat.message },
    ],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-CoachFI-Provider": "anthropic",
      "X-CoachFI-Model": model,
    },
  });
}

async function createOpenRouterResponse(apiKey: string, chat: NormalizedChat) {
  const model = getOptionalEnv("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL;
  const maxTokens = getNumberEnv("OPENROUTER_MAX_TOKENS", 256, 64, 1024);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
      "X-Title": "Coach FI",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: getSystemPrompt(chat.locale) },
        ...chat.safeHistory,
        { role: "user", content: chat.message },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[openrouter]", res.status, errorText);
    return Response.json({ error: "OpenRouter error", fallback: true }, { status: 500 });
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;
  const reply = Array.isArray(content)
    ? content.map((item) => item.text ?? "").join("")
    : content;

  if (!reply?.trim()) {
    return Response.json({ error: "OpenRouter empty response", fallback: true }, { status: 500 });
  }

  return new Response(reply, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-CoachFI-Provider": "openrouter",
      "X-CoachFI-Model": model,
    },
  });
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    requireConsentHeader(req, "ai-coach");
    rateLimit(req, "chat", 20);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  try {
    const payload = await readJsonWithLimit<ChatPayload>(req, 6000);
    const chat = normalizePayload(payload);

    if (!chat) {
      return jsonError("Invalid message", 400);
    }

    const preferredProvider = getOptionalEnv("AI_PROVIDER");
    const anthropicApiKey = getOptionalEnv("ANTHROPIC_API_KEY");
    const openRouterApiKey = getOptionalEnv("OPENROUTER_API_KEY");

    if (preferredProvider === "openrouter" && openRouterApiKey) {
      return createOpenRouterResponse(openRouterApiKey, chat);
    }

    if (preferredProvider === "anthropic" && anthropicApiKey) {
      return createAnthropicResponse(anthropicApiKey, chat);
    }

    if (anthropicApiKey) {
      return createAnthropicResponse(anthropicApiKey, chat);
    }

    if (openRouterApiKey) {
      return createOpenRouterResponse(openRouterApiKey, chat);
    }

    return Response.json({ error: "AI provider API key not set", fallback: true }, { status: 503 });
  } catch (err) {
    if (err instanceof SyntaxError || (err instanceof Error && err.message === "Payload too large")) {
      return jsonError("Invalid payload", 400);
    }
    console.error("[chat/route]", err);
    return Response.json({ error: "Model error", fallback: true }, { status: 500 });
  }
}
