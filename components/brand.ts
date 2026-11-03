// Public app URL used on share cards and achievement images.
// NEXT_PUBLIC_APP_URL wins (e.g. a preview deployment); otherwise the
// production domain.
const FALLBACK_APP_URL = "https://coachfiai.com";

function normalize(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return FALLBACK_APP_URL;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return url.origin;
  } catch {
    return FALLBACK_APP_URL;
  }
}

export const APP_URL = normalize(process.env.NEXT_PUBLIC_APP_URL);
export const APP_HOST = new URL(APP_URL).host;
