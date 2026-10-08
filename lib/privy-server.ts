import { PrivyClient } from "@privy-io/node";

import { getOptionalEnv } from "@/lib/server-env";

let client: PrivyClient | null = null;

export function privyAuthConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_PRIVY_APP_ID") && getOptionalEnv("PRIVY_APP_SECRET"));
}

function getPrivyClient() {
  const appId = getOptionalEnv("NEXT_PUBLIC_PRIVY_APP_ID");
  const appSecret = getOptionalEnv("PRIVY_APP_SECRET");
  if (!appId || !appSecret) return null;
  if (!client) client = new PrivyClient({ appId, appSecret });
  return client;
}

export async function verifyPrivyUserId(accessToken: string) {
  const privy = getPrivyClient();
  if (!privy) throw new Error("Privy auth is not configured");
  const claims = await privy.utils().auth().verifyAccessToken(accessToken);
  if (!claims.user_id) throw new Error("Privy token has no user id");
  return claims.user_id;
}
