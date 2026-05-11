export interface InflationScenario {
  year: string;
  "Cash only": number;
  "Saving habit": number;
  "Long-term investing scenario": number;
}

export function calculateRealValue(amount: number, years: number, annualInflationRate: number) {
  return amount / Math.pow(1 + annualInflationRate / 100, years);
}

export function calculatePurchasingPowerLoss(amount: number, years: number, annualInflationRate: number) {
  return amount - calculateRealValue(amount, years, annualInflationRate);
}

export function buildInflationScenario(
  startingAmount: number,
  years: number,
  annualInflationRate: number
): InflationScenario[] {
  return Array.from({ length: years + 1 }, (_, year) => {
    const inflationFactor = Math.pow(1 + annualInflationRate / 100, year);

    return {
      year: `Y${year}`,
      "Cash only": startingAmount / inflationFactor,
      "Saving habit": (startingAmount + year * 2400) / inflationFactor,
      "Long-term investing scenario":
        (startingAmount * Math.pow(1.055, year) + year * 3000) / inflationFactor
    };
  });
}
