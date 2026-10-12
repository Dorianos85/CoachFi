export const ACCOUNT_GATES = {
  persistProgress: false,
  viewHealthResults: false,
  persistHealth: false,
} as const;

export type AccountGateId = keyof typeof ACCOUNT_GATES;
