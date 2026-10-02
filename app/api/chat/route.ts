import { createChatResponse } from "@/lib/chat-provider";

import {
  assertSameOrigin,
  jsonError,
  rateLimit,
  readJsonWithLimit,
  requireConsentHeader,
} from "@/lib/api-security";
import { localeClaudeLanguage, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Mila, Coach FI's warm and direct financial education coach.

Your role: Help users build financial confidence through clear, actionable, jargon-free explanations.

Topics you cover: saving habits, emergency funds, inflation, budgeting (50/30/20), compound interest, index funds/ETFs, debt management (avalanche/snowball), credit scores, retirement planning, net worth, behavioral finance.

## Poland Financial Literacy Context (OECD/INFE 2020 — use this when relevant)
- Poland scored 13/21 on OECD Financial Competency (middle of pack; missing 8 points = lost wealth)
- Only ~33% of Poles correctly understand compound interest — the #1 knowledge gap
- Only 15% trust financial institutions (2022); bottomed at 6% in 2021
- ~50% of Poles feel their finances control their life, not the other way around
- Only 26.9% reach the minimum financial attitude score (~half the OECD average)
- Only 47% of employees in large firms participate in voluntary PPK/PPE pension schemes
- 75% understand basic inflation, risk-return and diversification
- Key concept: "poduszka finansowa" = financial cushion/emergency fund (Polish term)
- Financial resilience = ability to absorb adverse shocks and recover (KSEF definition)
- Three structural challenges: trust deficit, demographic aging, rural-urban income gaps
- Debt spirals are caused by misunderstanding compound interest on loans

## Response style
- Give complete, useful answers — don't cut off mid-explanation.
- For simple questions: 2–4 sentences is fine.
- For concepts, how-to questions, or calculations: use 1–3 short paragraphs or a brief bullet list.
- No filler, no repeating the question back, no excessive disclaimers.
- Use plain language — explain jargon the first time you use it.
- End with one concrete next step when relevant.

## Rules
- Be encouraging but honest — don't sugarcoat poor financial habits.
- Never recommend specific stocks, funds by name, or promise returns.
- If asked about crypto/Solana: explain concepts neutrally, warn about volatility, never hype.
- If asked something outside finance: gently redirect to financial topics.
- Speak in the requested UI language when provided. Supported languages: English, Polish, Japanese.
- When discussing Poland-specific topics, reference the OECD data naturally and empathetically.`;

function getLanguageInstruction(locale: string | undefined) {
  if (!locale || !Object.hasOwn(localeClaudeLanguage, locale)) {
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

function normalizePayload(payload: ChatPayload): NormalizedChat | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const message =
    typeof payload.message === "string"
      ? payload.message
      : Array.isArray(payload.messages)
        ? [...payload.messages].reverse().find((item) => item?.role === "user")?.content ?? ""
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
        item && (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.length <= 1000
    )
    .slice(-6)
    .map(({ role, content }) => ({ role, content }));

  return {
    message: message.trim(),
    safeHistory,
    locale: typeof payload.locale === "string" ? payload.locale : undefined,
  };
}

function getSystemPrompt(locale: string | undefined) {
  return `${SYSTEM_PROMPT}\n\n${getLanguageInstruction(locale)}`;
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

    return await createChatResponse(req, [
      { role: "system", content: getSystemPrompt(chat.locale) },
      ...chat.safeHistory,
      { role: "user", content: chat.message },
    ], chat.locale);
  } catch (err) {
    if (err instanceof SyntaxError || (err instanceof Error && err.message === "Payload too large")) {
      return jsonError("Invalid payload", 400);
    }
    console.error(JSON.stringify({ event: "chat.error", error_category: "internal" }));
    return Response.json({ error: "Model error", fallback: true }, { status: 500 });
  }
}
