import Anthropic from "@anthropic-ai/sdk";

import {
  assertSameOrigin,
  jsonError,
  rateLimit,
  readJsonWithLimit,
  requireConsentHeader,
} from "@/lib/api-security";
import { localeClaudeLanguage, pickLocalized, type Locale, type LocalizedMap } from "@/lib/i18n";
import { getNumberEnv, getOptionalEnv } from "@/lib/server-env";

const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENROUTER_MODEL = "openrouter/auto";

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
- Speak in the requested UI language when provided. Supported languages: English, Polish, Spanish, French, Simplified Chinese, Japanese, Hindi, Brazilian Portuguese and Turkish.
- When discussing Poland-specific topics, reference the OECD data naturally and empathetically.`;

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

const GENERIC_FALLBACK: LocalizedMap<string> = {
  en: "Start with one small action today: track your spending, save a fixed amount after payday, and learn how inflation changes purchasing power. Coach FI is educational and does not provide investment advice.",
  pl: "Zacznij od jednego małego kroku dzisiaj: zapisz wydatki, odłóż stałą kwotę po wypłacie i zrozum, jak inflacja zmienia siłę nabywczą. Coach FI ma charakter edukacyjny i nie udziela porad inwestycyjnych.",
  es: "Empieza hoy con una acción pequeña: registra tus gastos, ahorra una cantidad fija después de cobrar y aprende cómo la inflación cambia tu poder de compra. Coach FI es educativo y no da asesoramiento de inversión.",
  fr: "Commence aujourd'hui par une petite action : suis tes dépenses, épargne un montant fixe après le salaire et comprends comment l'inflation change ton pouvoir d'achat. Coach FI est éducatif et ne donne pas de conseil en investissement.",
  zh: "今天先做一个小动作：记录支出，发薪后固定储蓄，并理解通货膨胀如何改变购买力。Coach FI 只做教育，不提供投资建议。",
  ja: "今日できる小さな一歩から始めましょう。支出を記録し、給料日の後に一定額を貯金し、インフレが購買力をどう変えるか学びます。Coach FI は教育目的であり、投資助言ではありません。",
  hi: "आज एक छोटे कदम से शुरुआत करें: खर्च लिखें, आय आने के बाद तय रकम बचाएं, और समझें कि महंगाई खरीद शक्ति को कैसे बदलती है। Coach FI शैक्षिक है और निवेश सलाह नहीं देता।",
  "pt-BR": "Comece hoje com uma pequena ação: registre seus gastos, poupe um valor fixo depois de receber e entenda como a inflação muda seu poder de compra. Coach FI é educacional e não dá recomendação de investimento.",
  tr: "Bugün küçük bir adımla başla: harcamalarını takip et, maaştan sonra sabit bir tutar biriktir ve enflasyonun satın alma gücünü nasıl değiştirdiğini öğren. Coach FI eğiticidir ve yatırım tavsiyesi vermez.",
};

const INFLATION_FALLBACK: LocalizedMap<string> = {
  en: "Inflation means money buys less over time. If prices rise and your cash does not grow, the number in your account may look the same, but your real purchasing power falls.",
  pl: "Inflacja oznacza, że pieniądze z czasem kupują mniej. Jeśli ceny rosną, a gotówka nie pracuje, saldo może wyglądać tak samo, ale realna siła nabywcza spada.",
  es: "La inflación significa que el dinero compra menos con el tiempo. Si los precios suben y tu efectivo no crece, el saldo puede verse igual, pero tu poder de compra real baja.",
  fr: "L'inflation signifie que l'argent achète moins avec le temps. Si les prix montent et que ton argent ne progresse pas, le solde paraît identique, mais le pouvoir d'achat réel baisse.",
  zh: "通货膨胀意味着钱随着时间能买到的东西变少。如果价格上涨而现金没有增长，账户数字看起来一样，但真实购买力会下降。",
  ja: "インフレとは、時間とともにお金で買えるものが少なくなることです。物価が上がり現金が増えなければ、残高は同じに見えても実質的な購買力は下がります。",
  hi: "महंगाई का मतलब है कि समय के साथ पैसा कम चीजें खरीद पाता है। कीमतें बढ़ें और नकद न बढ़े, तो खाता वैसा दिख सकता है, लेकिन असली खरीद शक्ति घटती है।",
  "pt-BR": "Inflação significa que o dinheiro compra menos com o tempo. Se os preços sobem e seu dinheiro parado não cresce, o saldo parece igual, mas o poder de compra real cai.",
  tr: "Enflasyon, paranın zamanla daha az şey satın alması demektir. Fiyatlar yükselir ve nakit büyümezse, hesap bakiyesi aynı görünür ama gerçek satın alma gücü düşer.",
};

const SAVING_FALLBACK: LocalizedMap<string> = {
  en: "A strong saving habit is automatic and small enough to repeat. Move a fixed amount right after payday, even if it is tiny, and treat it like a bill to your future self.",
  pl: "Dobry nawyk oszczędzania jest automatyczny i na tyle mały, żeby dało się go powtarzać. Przelej stałą kwotę zaraz po wypłacie, nawet niewielką, i traktuj ją jak rachunek dla przyszłego siebie.",
  es: "Un buen hábito de ahorro es automático y lo bastante pequeño para repetirlo. Aparta una cantidad fija justo después de cobrar, aunque sea pequeña, y trátala como una factura para tu yo futuro.",
  fr: "Une bonne habitude d'épargne est automatique et assez petite pour être répétée. Mets de côté un montant fixe juste après le salaire, même faible, comme une facture pour ton futur toi.",
  zh: "好的储蓄习惯应该自动化，而且小到可以重复。发薪后立刻转出固定金额，哪怕很少，把它当作给未来自己的账单。",
  ja: "強い貯金習慣は自動化され、繰り返せるほど小さいものです。給料日の後に少額でも一定額を移し、未来の自分への請求書として扱いましょう。",
  hi: "मजबूत बचत आदत स्वचालित और दोहराने योग्य छोटी होनी चाहिए। आय आते ही तय रकम अलग रखें, चाहे छोटी हो, और उसे भविष्य के अपने लिए बिल समझें।",
  "pt-BR": "Um bom hábito de poupança é automático e pequeno o bastante para repetir. Separe um valor fixo logo depois de receber, mesmo que seja baixo, como uma conta para seu futuro.",
  tr: "Güçlü tasarruf alışkanlığı otomatik ve tekrar edilecek kadar küçük olmalıdır. Maaştan hemen sonra sabit bir tutarı ayır, küçük olsa bile, bunu gelecekteki kendine ödeme gibi gör.",
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

function getSafeLocale(locale: string | undefined): Locale {
  return locale && locale in localeClaudeLanguage ? (locale as Locale) : "en";
}

function createFallbackText(chat: NormalizedChat) {
  const locale = getSafeLocale(chat.locale);
  const message = chat.message.toLowerCase();

  if (/inflac|inflation|inflación|inflation|enflasyon|通货|インフレ|महंगाई/.test(message)) {
    return pickLocalized(INFLATION_FALLBACK, locale);
  }

  if (/oszcz|save|saving|ahorr|épargn|poup|tasarruf|储蓄|貯金|बचत/.test(message)) {
    return pickLocalized(SAVING_FALLBACK, locale);
  }

  return pickLocalized(GENERIC_FALLBACK, locale);
}

function createFallbackResponse(chat: NormalizedChat) {
  return new Response(createFallbackText(chat), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-CoachFI-Provider": "fallback",
      "X-CoachFI-Model": "predefined",
    },
  });
}

async function createAnthropicResponse(apiKey: string, chat: NormalizedChat) {
  const client = new Anthropic({ apiKey });
  const model = getOptionalEnv("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
  const maxTokens = getNumberEnv("ANTHROPIC_MAX_TOKENS", 600, 64, 1024);

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: getSystemPrompt(chat.locale),
    messages: [
      ...chat.safeHistory, // last 6 turns for context, keeps costs low
      { role: "user", content: chat.message },
    ],
    stream: false,
  });

  const reply = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  if (!reply) throw new Error("Anthropic empty response");

  return new Response(reply, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-CoachFI-Provider": "anthropic",
      "X-CoachFI-Model": model,
    },
  });
}

async function createOpenRouterResponse(apiKey: string, chat: NormalizedChat) {
  const model = getOptionalEnv("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL;
  const maxTokens = getNumberEnv("OPENROUTER_MAX_TOKENS", 600, 64, 1024);

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
    throw new Error("OpenRouter error");
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;
  const reply = Array.isArray(content)
    ? content.map((item) => item.text ?? "").join("")
    : content;

  if (!reply?.trim()) {
    throw new Error("OpenRouter empty response");
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

    const providers =
      preferredProvider === "openrouter"
        ? [
            openRouterApiKey ? () => createOpenRouterResponse(openRouterApiKey, chat) : null,
            anthropicApiKey ? () => createAnthropicResponse(anthropicApiKey, chat) : null,
          ]
        : [
            anthropicApiKey ? () => createAnthropicResponse(anthropicApiKey, chat) : null,
            openRouterApiKey ? () => createOpenRouterResponse(openRouterApiKey, chat) : null,
          ];

    for (const provider of providers) {
      if (!provider) continue;
      try {
        return await provider();
      } catch (error) {
        console.error("[chat/provider]", error);
      }
    }

    return createFallbackResponse(chat);
  } catch (err) {
    if (err instanceof SyntaxError || (err instanceof Error && err.message === "Payload too large")) {
      return jsonError("Invalid payload", 400);
    }
    console.error("[chat/route]", err);
    return Response.json({ error: "Chat failed", fallback: true }, { status: 500 });
  }
}
