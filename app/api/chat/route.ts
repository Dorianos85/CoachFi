import { assertSameOrigin, readJsonWithLimit, rateLimit } from "@/lib/api-security";
import { accessErrorResponse, ApiAccessError } from "@/lib/server/api-access";
import { denyExternalAiUnlessReady } from "@/lib/server/api-access-policy";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function localText(message: string, locale: unknown) {
  const polish = locale === "pl";
  if (/inflac|inflation/i.test(message)) {
    return polish
      ? "Gdy ceny tego samego koszyka rosną, niezmieniona kwota kupuje mniej. Porównaj ceny i założenia, zanim wybierzesz kolejny krok. To lokalne wyjaśnienie edukacyjne."
      : "When prices for the same basket rise, an unchanged amount buys less. Compare prices and assumptions before choosing a next step. This is a local educational explanation.";
  }
  if (/oszcz|saving|save/i.test(message)) {
    return polish
      ? "Najpierw sprawdź podstawowe potrzeby i terminy płatności. Kwotę oszczędzania dopasuj do pieniędzy, które rzeczywiście zostają; brak możliwości wpłaty nie jest porażką. To lokalne wyjaśnienie edukacyjne."
      : "Check essential needs and payment dates first. Adapt any savings amount to money that is actually available; being unable to save is not a failure. This is a local educational explanation.";
  }
  return polish
    ? "Zapisz terminy najbliższych wpływów i koniecznych wydatków. Wybierz jeden mały krok, który nie ogranicza podstawowych potrzeb. Mila odpowiada teraz lokalnym tekstem edukacyjnym."
    : "Record the dates of upcoming income and essential expenses. Choose one small step that does not compromise essential needs. Mila currently provides local educational text.";
}

export async function POST(req: Request) {
  try {
    try { assertSameOrigin(req); } catch {
      throw new ApiAccessError("ORIGIN_BLOCKED", 403, "Request origin is not allowed.");
    }
    rateLimit(req, "local-chat", 60);
    const body = await readJsonWithLimit<unknown>(req, 8192);
    if (!isRecord(body) || (body.mode !== undefined && body.mode !== "local" && body.mode !== "external")) {
      throw new Error("Invalid request");
    }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 800) throw new Error("Invalid request");
    if (body.mode === "external") {
      return await denyExternalAiUnlessReady(req, body.consent, ["aiCoach"]);
    }
    // No provider, SDK verification, stored identity or history is used for this
    // public local-only path. Supplying an identity/consent header cannot upgrade it.
    return new Response(localText(message, body.locale), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-CoachFI-Provider": "local",
        "X-CoachFI-Model": "predefined",
        "X-CoachFI-External-AI": "disabled",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Too many requests") {
      return accessErrorResponse(new ApiAccessError("LOCAL_RATE_LIMIT", 429, "Please try again later."));
    }
    return accessErrorResponse(error);
  }
}
