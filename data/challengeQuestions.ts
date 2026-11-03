export interface ChallengeQuestion {
  id: string;
  question: string;
  answers: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  reward: number;
}

export const challengeQuestions: ChallengeQuestion[] = [
  {
    id: "c1",
    question: "What is the 50/30/20 budget rule?",
    answers: [
      { id: "A", text: "50% savings, 30% needs, 20% wants" },
      { id: "B", text: "50% needs, 30% wants, 20% savings" },
      { id: "C", text: "50% debt repayment, 30% food, 20% fun" },
      { id: "D", text: "50% income tax, 30% rent, 20% food" },
    ],
    correctAnswer: "B",
    explanation: "50% for needs (rent, food), 30% for wants (entertainment), 20% for savings and debt repayment. Simple and effective.",
    reward: 50,
  },
  {
    id: "c2",
    question: "What is compound interest?",
    answers: [
      { id: "A", text: "Interest paid only on the original amount" },
      { id: "B", text: "A bank fee for early withdrawal" },
      { id: "C", text: "Interest earned on both principal and previously earned interest" },
      { id: "D", text: "Interest you pay on credit cards only" },
    ],
    correctAnswer: "C",
    explanation: "Compound interest means you earn interest on your interest — over time this creates exponential growth.",
    reward: 50,
  },
  {
    id: "c3",
    question: "What does 'diversification' mean in investing?",
    answers: [
      { id: "A", text: "Putting all your money in one strong stock" },
      { id: "B", text: "Spreading investments across different assets to reduce risk" },
      { id: "C", text: "Investing only in government bonds" },
      { id: "D", text: "Changing your portfolio every week" },
    ],
    correctAnswer: "B",
    explanation: "Don't put all your eggs in one basket. Diversification reduces the risk that one bad investment destroys your entire portfolio.",
    reward: 50,
  },
  {
    id: "c4",
    question: "What is a 'debt avalanche' strategy?",
    answers: [
      { id: "A", text: "Taking new loans to pay old loans" },
      { id: "B", text: "Paying off smallest debts first regardless of interest rate" },
      { id: "C", text: "Paying off highest-interest debts first to minimize total interest" },
      { id: "D", text: "Ignoring debt until it grows" },
    ],
    correctAnswer: "C",
    explanation: "Debt avalanche = attack the highest interest rate first. It saves the most money mathematically. Contrast with 'debt snowball' which targets smallest balances for motivation.",
    reward: 50,
  },
  {
    id: "c5",
    question: "What is the real return on your savings if inflation is 5% and your bank gives 2%?",
    answers: [
      { id: "A", text: "+7%" },
      { id: "B", text: "+2%" },
      { id: "C", text: "0%" },
      { id: "D", text: "-3%" },
    ],
    correctAnswer: "D",
    explanation: "Real return = nominal rate − inflation = 2% − 5% = −3%. Your money is losing purchasing power even with a 2% savings account.",
    reward: 50,
  },
  {
    id: "c6",
    question: "Which type of fund tracks a market index automatically with low fees?",
    answers: [
      { id: "A", text: "Hedge fund" },
      { id: "B", text: "Index fund / ETF" },
      { id: "C", text: "Venture capital fund" },
      { id: "D", text: "Pension fund" },
    ],
    correctAnswer: "B",
    explanation: "Index funds and ETFs passively track a market index (like S&P 500). They have low fees, and over long periods most actively managed U.S. stock funds have trailed their benchmark index after fees (S&P SPIVA). In 2025 alone, 79% of active large-cap funds lagged the S&P 500.",
    reward: 50,
  },
  {
    id: "c7",
    question: "What is dollar-cost averaging (DCA)?",
    answers: [
      { id: "A", text: "Buying all at the market low" },
      { id: "B", text: "Selling everything when prices drop" },
      { id: "C", text: "Investing a fixed amount at regular intervals regardless of price" },
      { id: "D", text: "Converting all savings to USD" },
    ],
    correctAnswer: "C",
    explanation: "DCA means investing the same fixed amount every month, regardless of price. You buy more when prices are low and less when high — removing emotion from investing.",
    reward: 50,
  },
  {
    id: "c8",
    question: "What is the 'rule of 72'?",
    answers: [
      { id: "A", text: "You need 72 months to pay off any debt" },
      { id: "B", text: "Divide 72 by annual return rate to estimate how many years to double your money" },
      { id: "C", text: "Save 72% of your income" },
      { id: "D", text: "Retire at 72 to maximize pension" },
    ],
    correctAnswer: "B",
    explanation: "72 ÷ annual return % = years to double your money. At 8% return, your money doubles in ~9 years. At 6%, ~12 years. A quick mental math trick.",
    reward: 50,
  },
  {
    id: "c9",
    question: "What is an ETF?",
    answers: [
      { id: "A", text: "A savings account with higher interest" },
      { id: "B", text: "An electronic transfer fee" },
      { id: "C", text: "Exchange-Traded Fund — a basket of assets traded like a stock" },
      { id: "D", text: "A government emergency fund" },
    ],
    correctAnswer: "C",
    explanation: "ETFs bundle many assets (stocks, bonds, commodities) into one tradeable instrument. They combine diversification of a mutual fund with the flexibility of a stock.",
    reward: 50,
  },
  {
    id: "c10",
    question: "Which is NOT a characteristic of a good emergency fund?",
    answers: [
      { id: "A", text: "Easily accessible (liquid)" },
      { id: "B", text: "Covers 3–6 months of expenses" },
      { id: "C", text: "Invested in high-risk stocks for maximum growth" },
      { id: "D", text: "Kept separate from everyday spending account" },
    ],
    correctAnswer: "C",
    explanation: "An emergency fund should be liquid and safe — NOT invested in volatile assets. Its purpose is accessibility when emergencies strike, not growth.",
    reward: 50,
  },
  {
    id: "c11",
    question: "What happens to bond prices when interest rates rise?",
    answers: [
      { id: "A", text: "Bond prices rise" },
      { id: "B", text: "Bond prices fall" },
      { id: "C", text: "No change" },
      { id: "D", text: "Bond prices double" },
    ],
    correctAnswer: "B",
    explanation: "Bonds and interest rates move inversely. When rates rise, existing bonds with lower rates become less attractive, so their market price falls.",
    reward: 50,
  },
  {
    id: "c12",
    question: "What is 'lifestyle inflation'?",
    answers: [
      { id: "A", text: "Government increasing minimum wage" },
      { id: "B", text: "Prices rising faster than salaries" },
      { id: "C", text: "Spending more as you earn more, leaving savings unchanged" },
      { id: "D", text: "Inflating your lifestyle on your resume" },
    ],
    correctAnswer: "C",
    explanation: "Lifestyle inflation (also called lifestyle creep) means every salary raise gets consumed by new expenses. The antidote: save the raise before you get used to the extra income.",
    reward: 50,
  },
  {
    id: "c13",
    question: "What is the primary purpose of a pension/retirement account?",
    answers: [
      { id: "A", text: "To pay for vacations" },
      { id: "B", text: "To replace income when you stop working, using decades of compounding" },
      { id: "C", text: "To speculate on high-risk assets" },
      { id: "D", text: "To store emergency cash" },
    ],
    correctAnswer: "B",
    explanation: "Retirement accounts are long-term vehicles. Contributions grow tax-advantaged over decades. Time is your biggest asset — starting at 25 vs 35 can mean 2× the final balance.",
    reward: 50,
  },
  {
    id: "c14",
    question: "What does 'net worth' mean?",
    answers: [
      { id: "A", text: "Your monthly salary after tax" },
      { id: "B", text: "Total assets minus total liabilities" },
      { id: "C", text: "How much cash you have in your wallet" },
      { id: "D", text: "Your credit score" },
    ],
    correctAnswer: "B",
    explanation: "Net worth = all you own (assets) minus all you owe (liabilities). A positive and growing net worth is the real measure of financial health — more meaningful than income alone.",
    reward: 50,
  },

  // ── US financial literacy data (Polish versions live in lib/allQuestions.ts) ──
  {
    id: "c15",
    question: "Gen Z answered about what share of personal-finance questions correctly in the 2025 TIAA Institute–GFLEC Personal Finance Index?",
    answers: [
      { id: "A", text: "About 70%" },
      { id: "B", text: "About 55%" },
      { id: "C", text: "About 38%" },
      { id: "D", text: "About 15%" },
    ],
    correctAnswer: "C",
    explanation: "Gen Z averaged 38% — the lowest of any generation. U.S. adults overall got about 49% right. A few minutes of learning a day closes that gap fast.",
    reward: 50,
  },
  {
    id: "c16",
    question: "Federal Reserve data: about what share of U.S. adults would cover a $400 surprise expense with cash or its equivalent?",
    answers: [
      { id: "A", text: "About 90%" },
      { id: "B", text: "About 80%" },
      { id: "C", text: "About 75%" },
      { id: "D", text: "About 63%" },
    ],
    correctAnswer: "D",
    explanation: "63% would; 37% would have to borrow, sell something or couldn't pay at all (Federal Reserve, Economic Well-Being of U.S. Households in 2025). Even a small emergency fund changes that.",
    reward: 50,
  },
  {
    id: "c17",
    question: "Which personal-finance topic did U.S. adults find hardest in the 2025 Personal Finance Index?",
    answers: [
      { id: "A", text: "Saving" },
      { id: "B", text: "Understanding risk and uncertainty" },
      { id: "C", text: "Earning" },
      { id: "D", text: "Consuming (spending)" },
    ],
    correctAnswer: "B",
    explanation: "Risk was the lowest-scoring area — only 36% of risk questions were answered correctly. Knowing how risk works protects you from \"guaranteed return\" pitches and panic selling.",
    reward: 50,
  },
  {
    id: "c18",
    question: "Many people say money controls their life. Which mindset shift helps most?",
    answers: [
      { id: "A", text: "Earn more money at all costs" },
      { id: "B", text: "Avoid thinking about money to reduce stress" },
      { id: "C", text: "Restore a sense of personal agency — treat money as a tool, not a source of stress" },
      { id: "D", text: "Let someone else handle everything" },
    ],
    correctAnswer: "C",
    explanation: "Short-term thinking is a common defense when people feel they have no control. Small, repeatable wins — tracking spending, one automatic transfer — rebuild that sense of control.",
    reward: 50,
  },
  {
    id: "c19",
    question: "What's another common name for an emergency fund?",
    answers: [
      { id: "A", text: "Sinking fund" },
      { id: "B", text: "Rainy-day fund" },
      { id: "C", text: "Brokerage account" },
      { id: "D", text: "Escrow account" },
    ],
    correctAnswer: "B",
    explanation: "A rainy-day fund is money set aside for surprises like a car repair or a job loss. A sinking fund is different: it's for a known, planned expense.",
    reward: 50,
  },
  {
    id: "c20",
    question: "What does \"financial attitude\" measure?",
    answers: [
      { id: "A", text: "How many financial products someone owns" },
      { id: "B", text: "Income level and savings rate" },
      { id: "C", text: "Whether someone plans for the future vs. lives only for the present" },
      { id: "D", text: "Level of trust in banks" },
    ],
    correctAnswer: "C",
    explanation: "Financial attitude is about orientation: planning ahead vs. living only for today. Setting even one specific goal is the first step toward long-term thinking.",
    reward: 50,
  },
];

export function getDailyQuestion(): ChallengeQuestion {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  return challengeQuestions[dayOfYear % challengeQuestions.length];
}

export function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

const CHALLENGE_KEY = "coachfi-challenge";

export function isChallengeCompletedToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    if (!raw) return false;
    const { date } = JSON.parse(raw) as { date: string };
    return date === new Date().toISOString().split("T")[0];
  } catch {
    return false;
  }
}

export function markChallengeCompleted(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify({ date: today }));
}
