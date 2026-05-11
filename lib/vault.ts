export type VaultRisk = "low" | "medium" | "high";

export interface VaultStrategy {
  id: string;
  name: string;
  apy: number;
  risk: VaultRisk;
  protocol: string;
  description: string;
  tvl?: number;
  live?: boolean;
}

export interface VaultState {
  depositedAmount: number;
  depositedAt: string;
  strategyId: string;
  strategyName: string;
  strategyApy: number;
  accruedYield: number;
  lastSyncAt: string;
}

const KEY = "coachfi-vault";

export function getVault(): VaultState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as VaultState; } catch { return null; }
}

export function deposit(amount: number, strategy: VaultStrategy): VaultState {
  const now = new Date().toISOString();
  const state: VaultState = {
    depositedAmount: amount,
    depositedAt: now,
    strategyId: strategy.id,
    strategyName: strategy.name,
    strategyApy: strategy.apy,
    accruedYield: 0,
    lastSyncAt: now,
  };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function syncYield(state: VaultState): VaultState {
  const now = Date.now();
  const last = new Date(state.lastSyncAt).getTime();
  const elapsedDays = (now - last) / 86_400_000;
  if (elapsedDays < 1 / 1440) return state;
  const principal = state.depositedAmount + state.accruedYield;
  const newAccrued = state.accruedYield + principal * (state.strategyApy / 365) * elapsedDays;
  const updated: VaultState = { ...state, accruedYield: newAccrued, lastSyncAt: new Date().toISOString() };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function withdrawAll(state: VaultState): { principal: number; yield: number } {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  return { principal: state.depositedAmount, yield: state.accruedYield };
}

export function daysInVault(state: VaultState): number {
  return Math.max(0, (Date.now() - new Date(state.depositedAt).getTime()) / 86_400_000);
}

export function projectGrowth(principal: number, apy: number, months: number): { month: number; value: number }[] {
  return Array.from({ length: months + 1 }, (_, m) => ({
    month: m,
    value: Math.round(principal * Math.pow(1 + apy / 365, m * 30.44) * 10) / 10,
  }));
}
