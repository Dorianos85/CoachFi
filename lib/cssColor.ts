// Canvas cannot read CSS variables, so share images resolve design tokens at draw time.
export function resolveCssColor(value: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(value);
  if (!match || typeof window === "undefined") return value;
  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || value;
}

// A design token as a canvas colour with alpha, e.g. tokenWithAlpha("text", 0.6).
export function tokenWithAlpha(token: string, alpha: number): string {
  if (typeof window === "undefined") return "transparent";
  const channels = getComputedStyle(document.documentElement).getPropertyValue(`--cf-${token}-rgb`).trim();
  return `rgb(${channels} / ${alpha})`;
}
