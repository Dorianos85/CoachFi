import { assertSameOrigin, isLikelySolanaAddress, jsonError, rateLimit, readJsonWithLimit } from "@/lib/api-security";
import { accountStorageConfigured, listCertificates, saveCertificate, type CertificateRecord } from "@/lib/account-store";
import { ownedCoachCertificates, readCoachCertificate } from "@/lib/certificate-chain";
import { compareCertificateState, type SeenCertificate, type StoredCertificate } from "@/lib/certificate-compare";
import { embeddedSolanaAddress, privyAuthConfigured, verifyPrivyUserId } from "@/lib/privy-server";

export const runtime = "nodejs";

function bearerToken(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function looksLikeJwt(token: string) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "certificates", 30);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  const token = bearerToken(req);
  if (!token || !looksLikeJwt(token)) return jsonError("Unauthorized", 401);
  if (!privyAuthConfigured() || !accountStorageConfigured()) {
    return Response.json({ ok: false, configured: false, certificates: [] });
  }

  try {
    const userId = await verifyPrivyUserId(token);
    const certificates = await listCertificates(userId);
    return Response.json({
      ok: true,
      configured: true,
      certificates: certificates.map((certificate) => ({
        certificateId: certificate.certificateId,
        status: certificate.status,
        assetAddress: certificate.assetAddress,
        ownerAddress: certificate.ownerAddress,
        txHash: certificate.txHash,
      })),
    });
  } catch (error) {
    console.error("[certificates GET]", error instanceof Error ? error.message : "read failed");
    return jsonError("Certificate read failed", 500);
  }
}

function publicCertificate(certificate: CertificateRecord) {
  return {
    certificateId: certificate.certificateId,
    status: certificate.status,
    assetAddress: certificate.assetAddress,
    ownerAddress: certificate.ownerAddress,
    txHash: certificate.txHash,
  };
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "certificate-sync", 20);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  const token = bearerToken(req);
  if (!token || !looksLikeJwt(token)) return jsonError("Unauthorized", 401);
  if (!privyAuthConfigured() || !accountStorageConfigured()) {
    return Response.json({ ok: false, configured: false, certificates: [] });
  }

  let hintAddress = "";
  let hintTx = "";
  try {
    const body = await readJsonWithLimit<{ assetAddress?: unknown; txHash?: unknown }>(req, 1400);
    if (body && typeof body === "object" && !Array.isArray(body)) {
      if (typeof body.assetAddress === "string" && isLikelySolanaAddress(body.assetAddress)) hintAddress = body.assetAddress;
      if (typeof body.txHash === "string" && body.txHash.length <= 128) hintTx = body.txHash.trim();
    }
  } catch {
    return jsonError("Invalid payload", 400);
  }

  try {
    const userId = await verifyPrivyUserId(token);
    const wallet = await embeddedSolanaAddress(userId);
    let rows = await listCertificates(userId);
    if (!wallet) {
      return Response.json({ ok: true, configured: true, certificates: rows.map(publicCertificate) });
    }

    let lookupError = "";
    let owned: SeenCertificate[] = [];
    try {
      owned = await ownedCoachCertificates(wallet);
    } catch (error) {
      lookupError = error instanceof Error ? error.message : "Certificate lookup failed";
      console.error("[certificates sync]", lookupError);
    }

    const hint = hintAddress ? await readCoachCertificate(hintAddress) : null;
    if (hint && hint.ownerAddress === wallet && !owned.some((item) => item.assetAddress === hint.assetAddress)) {
      owned.push(hint);
    }

    const storedLooks: SeenCertificate[] = [];
    if (!lookupError) {
      for (const row of rows) {
        if (owned.some((item) => item.assetAddress === row.assetAddress)) continue;
        const looked = await readCoachCertificate(row.assetAddress);
        if (looked) storedLooks.push(looked);
      }
    }

    const current: StoredCertificate[] = rows.map((row) => ({
      certificateId: row.certificateId,
      status: row.status,
      assetAddress: row.assetAddress,
      ownerAddress: row.ownerAddress,
    }));
    const updates = compareCertificateState(current, lookupError ? owned.filter((item) => item.assetAddress === hint?.assetAddress) : owned, storedLooks);
    for (const update of updates) {
      await saveCertificate(userId, {
        ...update,
        txHash: hint && hint.assetAddress === update.assetAddress && hintTx ? hintTx : undefined,
      });
    }
    if (updates.length > 0) rows = await listCertificates(userId);

    return Response.json({
      ok: true,
      configured: true,
      certificates: rows.map(publicCertificate),
      ...(lookupError && process.env.NODE_ENV !== "production" ? { lookupError } : {}),
    });
  } catch (error) {
    console.error("[certificates sync]", error instanceof Error ? error.message : "sync failed");
    return jsonError("Certificate sync failed", 500);
  }
}
