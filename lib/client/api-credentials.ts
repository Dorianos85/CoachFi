"use client";

import { hasConsentFor, readStoredConsent, type ConsentRecord, type OptionalConsentKey } from "@/lib/consent";

type AccessTokenGetter = () => Promise<string | null>;
let tokenGetter: AccessTokenGetter | null = null;
let registrationEpoch = 0;

/** Registered only by AccountSync inside the existing CDP provider. Never persisted. */
export function setApiAccessTokenGetter(getter: AccessTokenGetter | null) {
  registrationEpoch += 1;
  tokenGetter = getter;
}

export interface ApiCredentials {
  headers: { "Content-Type": string; Authorization: string };
  consent: ConsentRecord;
}

export async function getApiCredentials(
  required: readonly OptionalConsentKey[],
  signal?: AbortSignal,
): Promise<ApiCredentials | null> {
  const before = readStoredConsent();
  const getter = tokenGetter;
  const epoch = registrationEpoch;
  if (signal?.aborted || !getter || !hasConsentFor(before, required)) return null;
  try {
    const token = await getter();
    const after = readStoredConsent();
    if (
      signal?.aborted || registrationEpoch !== epoch || tokenGetter !== getter ||
      !token || typeof token !== "string" || /[\r\n]/.test(token) ||
      !hasConsentFor(after, required) ||
      JSON.stringify(before) !== JSON.stringify(after)
    ) return null;
    return {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      consent: after!,
    };
  } catch {
    return null;
  }
}
