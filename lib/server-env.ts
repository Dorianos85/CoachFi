const PLACEHOLDER_VALUES = new Set([
  "empty",
  "placeholder",
  "changeme",
  "change-me",
  "your_key_here",
  "your-api-key",
]);

export function isConfiguredEnvValue(value: string | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();

  return (
    !PLACEHOLDER_VALUES.has(lower) &&
    !lower.startsWith("your_") &&
    !lower.startsWith("your-") &&
    !lower.includes("example") &&
    !lower.includes("xxx") &&
    !lower.endsWith("...")
  );
}

export function getOptionalEnv(name: string) {
  const value = process.env[name];
  return isConfiguredEnvValue(value) ? value!.trim() : undefined;
}

export function hasConfiguredEnv(name: string) {
  return getOptionalEnv(name) !== undefined;
}

export function getNumberEnv(name: string, fallback: number, min: number, max: number) {
  const value = getOptionalEnv(name);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
