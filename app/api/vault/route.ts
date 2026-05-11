import { NextResponse } from "next/server";
import type { VaultStrategy } from "@/lib/vault";

const FALLBACK: VaultStrategy[] = [
  {
    id: "usdc-stable",
    name: "USDC Vault",
    apy: 0.0415,
    risk: "low",
    protocol: "Kamino",
    description: "Stablecoin yield — najniższe ryzyko, przewidywalny zwrot.",
    tvl: 48_200_000,
  },
  {
    id: "sol-usdc-lp",
    name: "SOL-USDC LP",
    apy: 0.0782,
    risk: "medium",
    protocol: "Kamino",
    description: "Skoncentrowany LP — wyższy yield, ryzyko nietrwałej straty.",
    tvl: 21_500_000,
  },
  {
    id: "jitosol-aggressive",
    name: "JitoSOL Vault",
    apy: 0.143,
    risk: "high",
    protocol: "Kamino",
    description: "LST + dźwignia — najwyższy APY z ryzykiem likwidacji.",
    tvl: 8_900_000,
  },
];

type KaminoRaw = Record<string, unknown>;

function parseStrategies(raw: KaminoRaw[]): VaultStrategy[] {
  return raw
    .filter((s) => {
      const apy = Number(s.apy ?? s.totalApy ?? 0);
      const tvl = Number(s.totalValueLocked ?? s.tvl ?? 0);
      return apy > 0.001 && apy < 0.6 && tvl > 500_000;
    })
    .sort((a, b) => Number(b.totalValueLocked ?? b.tvl ?? 0) - Number(a.totalValueLocked ?? a.tvl ?? 0))
    .slice(0, 3)
    .map((s, i) => {
      const apy = Number(s.apy ?? s.totalApy);
      const tvl = Number(s.totalValueLocked ?? s.tvl ?? 0);
      const risk: VaultStrategy["risk"] = apy < 0.08 ? "low" : apy < 0.15 ? "medium" : "high";
      const tokenA = String(s.tokenASymbol ?? s.tokenAMint ?? "");
      const tokenB = String(s.tokenBSymbol ?? s.tokenBMint ?? "");
      const name = tokenA && tokenB ? `${tokenA}-${tokenB}` : tokenA ? `${tokenA} Vault` : FALLBACK[i]?.name;
      return {
        id: String(s.address ?? s.strategy ?? s.pubkey ?? i),
        name: name ?? FALLBACK[i]?.name ?? `Vault ${i + 1}`,
        apy,
        risk,
        protocol: "Kamino",
        description: FALLBACK[i]?.description ?? "Solana yield vault.",
        tvl,
        live: true,
      };
    });
}

export async function GET() {
  try {
    const res = await fetch(
      "https://api.kamino.finance/strategies?env=mainnet-beta&status=ACTIVE",
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) throw new Error("upstream");
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw) || raw.length === 0) throw new Error("empty");
    const strategies = parseStrategies(raw as KaminoRaw[]);
    if (strategies.length === 0) throw new Error("parse failed");
    return NextResponse.json({ strategies, source: "kamino" });
  } catch {
    return NextResponse.json({ strategies: FALLBACK, source: "fallback" });
  }
}
