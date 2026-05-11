export const mockUser = {
  name: "Dorian",
  financialHealthScore: 42,
  tokenBalance: 125,
  completedStages: 1,
  currentStage: "Inflation & Purchasing Power",
  savingsGoal: "Emergency fund",
  monthlyIncome: 6000,
  monthlyExpenses: 5200,
  savings: 3000,
  debt: 8000,
  cashHeld: 20000,
  investsAlready: false,
  mainFinancialGoal: "Build an emergency fund, then learn long-term investing."
};

export const userModes = [
  {
    id: "adult",
    title: "Adult Mode",
    description: "Plan cash flow, debt, emergency funds and long-term basics."
  },
  {
    id: "kids",
    title: "Kids Mode",
    description: "Needs, wants, saving jars and pocket-money goals."
  },
  {
    id: "accessibility",
    title: "Accessibility Mode",
    description: "Large buttons, high contrast and voice-first learning."
  }
];
