import { CdpClient } from "@coinbase/cdp-sdk";

import { getOptionalEnv } from "@/lib/server-env";

let client: CdpClient | null = null;

export function cdpAuthConfigured() {
  return Boolean(getOptionalEnv("CDP_API_KEY_ID") && getOptionalEnv("CDP_API_KEY_SECRET"));
}

function getCdpClient() {
  const apiKeyId = getOptionalEnv("CDP_API_KEY_ID");
  const apiKeySecret = getOptionalEnv("CDP_API_KEY_SECRET");
  if (!apiKeyId || !apiKeySecret) return null;
  if (!client) client = new CdpClient({ apiKeyId, apiKeySecret });
  return client;
}

export type CdpIdentity = {
  userId: string;
  email: string | null;
  name: string | null;
  solanaAddress: string | null;
  evmAddress: string | null;
  authProvider: string | null;
  cdpCreatedAt: string | null;
  lastAuthenticatedAt: string | null;
  profileJson: string;
};

type AuthMethod = {
  type?: string;
  email?: string;
  name?: string;
  username?: string;
  sub?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
};

function methodFacts(method: AuthMethod) {
  if (method.type === "email") return { provider: "email", email: method.email || "", name: "" };
  if (method.type === "sms") return { provider: "sms", email: "", name: method.phoneNumber || "" };
  if (method.type === "telegram") {
    const name = [method.firstName, method.lastName].filter(Boolean).join(" ") || method.username || "";
    return { provider: "telegram", email: "", name };
  }
  return {
    provider: method.type || "",
    email: method.email || "",
    name: method.name || method.username || "",
  };
}

export function cdpIdentityFromEndUser(endUser: {
  userId?: string;
  authenticationMethods?: AuthMethod[];
  solanaAccounts?: string[];
  solanaAccountObjects?: Array<{ address?: string }>;
  evmAccounts?: string[];
  evmAccountObjects?: Array<{ address?: string }>;
  evmSmartAccounts?: string[];
  createdAt?: string;
  lastAuthenticatedAt?: string;
}): CdpIdentity {
  if (!endUser.userId) throw new Error("CDP token has no user id");
  const methods = (endUser.authenticationMethods ?? []).map((method) => ({
    ...methodFacts(method),
    sub: method.sub || undefined,
    username: method.username || undefined,
  }));
  const email = methods.map((method) => method.email).find(Boolean) || null;
  const name = methods.map((method) => method.name).find(Boolean) || null;
  const authProvider = methods.map((method) => method.provider).filter(Boolean).join(", ") || null;
  const solanaAddresses = [
    ...(endUser.solanaAccounts ?? []),
    ...(endUser.solanaAccountObjects ?? []).map((account) => account.address || ""),
  ].filter(Boolean);
  const evmAddresses = [
    ...(endUser.evmAccounts ?? []),
    ...(endUser.evmAccountObjects ?? []).map((account) => account.address || ""),
  ].filter(Boolean);
  const unique = (values: string[]) => [...new Set(values)];
  const profile = {
    email,
    name,
    authProvider,
    methods,
    solanaAddresses: unique(solanaAddresses),
    evmAddresses: unique(evmAddresses),
    evmSmartAddresses: endUser.evmSmartAccounts ?? [],
    createdAt: endUser.createdAt ?? null,
    lastAuthenticatedAt: endUser.lastAuthenticatedAt ?? null,
  };
  return {
    userId: endUser.userId,
    email,
    name,
    solanaAddress: profile.solanaAddresses[0] ?? null,
    evmAddress: profile.evmAddresses[0] ?? null,
    authProvider,
    cdpCreatedAt: endUser.createdAt ?? null,
    lastAuthenticatedAt: endUser.lastAuthenticatedAt ?? null,
    profileJson: JSON.stringify(profile),
  };
}

export async function verifyCdpUser(accessToken: string) {
  const cdp = getCdpClient();
  if (!cdp) throw new Error("CDP auth is not configured");
  const endUser = await cdp.endUser.validateAccessToken({ accessToken });
  return cdpIdentityFromEndUser(endUser);
}
