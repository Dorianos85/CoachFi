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
    explanation: "Compound interest means you earn interest on your interest — over time this creates exponential growth. Einstein reportedly called it the 8th wonder of the world.",
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
    explanation: "Index funds and ETFs passively track a market index (like S&P 500). They have very low fees and historically outperform most actively managed funds.",
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

  // ── Poland Financial Literacy (OECD/INFE source) ─────────────────────────
  {
    id: "c15",
    question: "According to OECD data, what percentage of Poles correctly understand compound interest?",
    answers: [
      { id: "A", text: "About 75%" },
      { id: "B", text: "About 50%" },
      { id: "C", text: "About 33%" },
      { id: "D", text: "About 10%" },
    ],
    correctAnswer: "C",
    explanation: "Only ~1 in 3 Poles understands compound interest in practice. This is the #1 knowledge gap — it leads to debt spirals and explains why only 47% of employees join voluntary PPK/PPE pension schemes.",
    reward: 50,
  },
  {
    id: "c16",
    question: "What percentage of Poles trusted financial institutions for savings in 2022?",
    answers: [
      { id: "A", text: "65%" },
      { id: "B", text: "40%" },
      { id: "C", text: "28%" },
      { id: "D", text: "15%" },
    ],
    correctAnswer: "D",
    explanation: "Only 15% of Poles trusted financial institutions in 2022 — and it dropped to just 6% in 2021. This trust deficit is a major barrier to financial participation and long-term wealth building.",
    reward: 50,
  },
  {
    id: "c17",
    question: "Poland scored 13/21 on OECD Financial Competency. What does the missing score represent?",
    answers: [
      { id: "A", text: "Nothing significant — 13/21 is excellent" },
      { id: "B", text: "Lost opportunities for wealth accumulation and lack of financial preparedness" },
      { id: "C", text: "A language barrier in the OECD test" },
      { id: "D", text: "Low bank account ownership" },
    ],
    correctAnswer: "B",
    explanation: "Poland's 13/21 score places it middle-of-the-pack. The missing 8 points represent concrete lost opportunities: less effective use of capital markets, lower emergency fund rates, and greater vulnerability to economic shocks.",
    reward: 50,
  },
  {
    id: "c18",
    question: "Nearly half of Poles report that their finances control their life. What is the recommended mindset shift?",
    answers: [
      { id: "A", text: "Earn more money at all costs" },
      { id: "B", text: "Avoid thinking about money to reduce stress" },
      { id: "C", text: "Restore a sense of personal agency — treat money as a tool, not a source of stress" },
      { id: "D", text: "Let a financial advisor handle everything" },
    ],
    correctAnswer: "C",
    explanation: "Short-term thinking is a psychological defense when people feel no agency. Financial education must restore this sense of control — transforming money from a source of stress into a tool for empowerment.",
    reward: 50,
  },
  {
    id: "c19",
    question: "Which Polish concept describes an emergency financial cushion?",
    answers: [
      { id: "A", text: "Kapitał własny" },
      { id: "B", text: "Poduszka finansowa" },
      { id: "C", text: "Rezerwa walutowa" },
      { id: "D", text: "Dywidenda bezpieczeństwa" },
    ],
    correctAnswer: "B",
    explanation: "'Poduszka finansowa' (financial cushion/pillow) is the Polish term for an emergency fund. It's a core component of financial well-being — providing a safety net to absorb unexpected shocks without resorting to high-interest borrowing.",
    reward: 50,
  },
  {
    id: "c20",
    question: "The OECD found that only 26.9% of Poles reach the minimum target financial attitude score. What does 'financial attitude' measure?",
    answers: [
      { id: "A", text: "How many financial products someone owns" },
      { id: "B", text: "Income level and savings rate" },
      { id: "C", text: "Whether someone plans for the future vs. lives only for the present" },
      { id: "D", text: "Level of trust in banks" },
    ],
    correctAnswer: "C",
    explanation: "Financial attitude measures orientation toward future planning vs. present-only thinking. Poland's 26.9% reaching the minimum is roughly half the OECD average — reflecting a systemic culture of short-term financial thinking.",
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
