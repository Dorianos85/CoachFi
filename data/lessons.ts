import {
  Banknote,
  Brain,
  ChartLine,
  CreditCard,
  HeartHandshake,
  Landmark,
  PiggyBank,
  ShieldCheck
} from "lucide-react";

export const learningStages = [
  {
    title: "Money Mindset",
    status: "Completed",
    progress: 100,
    reward: 25,
    nft: "Minted",
    icon: Brain
  },
  {
    title: "Saving Habit",
    status: "In progress",
    progress: 64,
    reward: 35,
    nft: "Ready after quiz",
    icon: Banknote
  },
  {
    title: "Inflation & Purchasing Power",
    status: "Current stage",
    progress: 42,
    reward: 40,
    nft: "Locked",
    icon: ChartLine
  },
  {
    title: "Credit, Interest & Rates",
    status: "Locked",
    progress: 12,
    reward: 45,
    nft: "Locked",
    icon: CreditCard
  },
  {
    title: "Emergency Fund",
    status: "Locked",
    progress: 0,
    reward: 50,
    nft: "Locked",
    icon: PiggyBank
  },
  {
    title: "Long-Term Investing Basics",
    status: "Locked",
    progress: 0,
    reward: 60,
    nft: "Locked",
    icon: Landmark
  },
  {
    title: "Retirement & Future Security",
    status: "Locked",
    progress: 0,
    reward: 70,
    nft: "Locked",
    icon: ShieldCheck
  },
  {
    title: "Family Financial Plan",
    status: "Locked",
    progress: 0,
    reward: 100,
    nft: "Locked",
    icon: HeartHandshake
  }
];

export const initialCoachMessages = [
  "You don't need to be rich to start saving. You need a system.",
  "Today's task: set aside 5% of your income and finish the inflation lesson.",
  "Your goal is not perfection. Your goal is your first repeatable habit.",
  "Public pensions may not be enough. Build your own financial resilience, step by step."
];

// Keyword-based intent matching for freeform coach input
interface CoachIntent {
  keywords: string[];
  response: string;
}

export const coachIntents: CoachIntent[] = [
  {
    keywords: ["inflation", "inflacja", "purchasing power", "money lose", "siła nabywcza", "inflación"],
    response: "Inflation means the same amount of money buys less over time. If you hold cash without a plan, your purchasing power slowly shrinks. Example: $20,000 today is worth only ~$14,260 in real terms after 5 years at 7% inflation. The antidote is awareness and a saving habit."
  },
  {
    keywords: ["saving", "oszczędz", "habit", "nawyk", "save money", "ahorrar", "start saving"],
    response: "Start small and automate. Transfer a fixed amount right after your paycheck arrives — even 5% works. It's about identity: 'I am someone who saves' — not about the amount. The system does the work so you don't have to rely on willpower."
  },
  {
    keywords: ["emergency fund", "fundusz awaryjny", "cushion", "poduszka", "fondo de emergencia", "rainy day"],
    response: "Your emergency fund is your financial immune system. Without it, every surprise — car repair, medical bill, job loss — goes straight to a credit card. Goal: 3–6 months of essential expenses in a liquid account. Start with 1 month if that feels overwhelming."
  },
  {
    keywords: ["kids", "dziecko", "children", "child", "niños", "pocket money", "kieszonkowe"],
    response: "Start with three jars: spend, save, give. Kids learn through action, not lectures. Pocket money with real choices is a better lesson than theory. When they make a mistake — a bad purchase — let it happen. That's a cheap lesson now, cheaper than an expensive one at 30."
  },
  {
    keywords: ["retire", "emerytura", "retirement", "pension", "jubilación", "future", "przyszłość"],
    response: "Public pensions are designed for survival, not comfort. The earlier you start building your own, the less you need to save per month. At 25, $200/month growing at 7% becomes ~$525,000 at 65. At 45, you'd need ~$800/month for the same result. Time is your most powerful financial tool."
  },
  {
    keywords: ["credit", "kredyt", "interest", "stopa", "loan", "pożyczka", "crédito", "debt", "dług"],
    response: "Variable-rate loans track benchmark rates set by central banks. When rates rise to fight inflation, your monthly payments rise too. Always understand: is your loan fixed or variable? Fixed gives certainty. Variable is cheaper when rates are low — but carries risk when they rise."
  },
  {
    keywords: ["invest", "inwest", "stocks", "etf", "akcje", "investing", "invertir", "market"],
    response: "Investing basics: diversify broadly (ETFs beat stock-picking for most people), invest regularly regardless of market conditions (dollar-cost averaging), and think in decades not days. The biggest risk is not investing at all — inflation eats what you don't put to work."
  },
  {
    keywords: ["nft", "certificate", "certyfikat", "solana", "blockchain", "token", "mint"],
    response: "Coach FI certificates are non-speculative proof of education — not investment products. They live on Solana because blockchain gives you ownership nobody can revoke. Your certificate proves you understand inflation, emergency funds and saving habits. That knowledge has real-world value."
  },
  {
    keywords: ["budget", "budżet", "presupuesto", "spend", "wydatki", "expenses"],
    response: "A simple budget that works: 50% needs, 30% wants, 20% savings and debt. The key is automating the 20% before you see it. Most people budget after spending — that's why most people struggle. Pay yourself first, then live on the rest."
  },
  {
    keywords: ["nothing", "nic nie", "do nothing", "what if", "co jeśli", "qué pasa si"],
    response: "Doing nothing is also a financial decision — and often the most expensive one. Inflation erodes cash. No emergency fund leads to debt. No retirement plan means depending on a system that may not be enough. The good news: small, consistent actions compound dramatically over time. You don't need a perfect plan. You need to start."
  },
  {
    keywords: ["net worth", "wealth", "assets", "bogactwo", "majątek", "patrimonio"],
    response: "Net worth = everything you own (assets) minus everything you owe (liabilities). Track it monthly — not to obsess, but to see the trend. A positive, growing net worth matters more than your income. High earners can have negative net worth. Modest earners with good habits can build real wealth."
  },
  {
    keywords: ["compound", "procent składany", "exponential", "snowball", "interés compuesto"],
    response: "Compound interest is why starting early matters so much. At 8% annual return: $10,000 becomes ~$21,600 in 10 years, ~$46,600 in 20 years, ~$100,600 in 30 years. The gains accelerate — that's the exponential effect. The best time to start was yesterday. The second best time is today."
  },
  {
    keywords: ["etf", "index fund", "s&p", "sp500", "vanguard", "fundusz indeksowy"],
    response: "Index funds and ETFs are the cornerstone of smart passive investing. They buy a tiny slice of hundreds of companies at once, giving instant diversification. The average actively managed fund underperforms a simple S&P 500 index fund over 15 years. Low fees (0.03–0.2%) vs. active funds (1–2%) compound into massive differences over time."
  },
  {
    keywords: ["debt snowball", "spłata długu", "pay off debt", "pagar deudas", "dług"],
    response: "Two popular debt payoff methods: Avalanche (pay highest interest first — saves most money) vs. Snowball (pay smallest balance first — gives psychological wins). Mathematically, avalanche wins. Behaviorally, snowball works better for some people. The best method is the one you'll actually stick with."
  },
  {
    keywords: ["salary", "raise", "wynagrodzenie", "podwyżka", "income", "zarobki", "negocjacja"],
    response: "Negotiating your salary is one of the highest-ROI financial moves you can make. A $5,000 raise compounds over a career. Research market rates before any negotiation — use job boards, LinkedIn salary data. Have competing offers when possible. Don't anchor yourself by revealing your current salary first. Confidence + data = leverage."
  },
  {
    keywords: ["tax", "podatek", "impuesto", "deduction", "odliczenie"],
    response: "Legally minimizing taxes is financial wisdom. Key strategies: contribute to tax-advantaged retirement accounts (contributions reduce taxable income), track deductible expenses, understand capital gains tax rates (long-term < short-term). You don't need to love tax — you need to understand enough not to overpay it."
  },
  {
    keywords: ["crypto", "bitcoin", "kryptowaluta", "solana", "btc", "ethereum", "blockchain"],
    response: "Crypto can be part of a portfolio — but understand what you own and why. Bitcoin has a fixed supply of 21M coins — some call it 'digital gold'. Solana focuses on speed and low fees for Web3 apps. Rule of thumb: only put in what you're willing to lose entirely. And never let crypto replace your emergency fund or retirement savings."
  },
  {
    keywords: ["house", "mortgage", "dom", "hipoteka", "hipoteca", "rent", "buy", "kupić"],
    response: "Buying vs. renting: buying builds equity but ties up capital and adds maintenance costs. Renting offers flexibility but builds no equity. A mortgage is cheap leverage — but only if you can comfortably afford it. Rule of thumb: housing costs (mortgage + taxes + maintenance) shouldn't exceed 28% of gross income."
  }
];

export const quickCoachActions = [
  "Explain inflation simply",
  "Build my first saving habit",
  "Why do I need an emergency fund?",
  "How to teach kids about money?",
  "Fixed vs variable rate loans",
  "What if I do nothing?"
];

export const quickCoachReplies: Record<string, string> = {
  "Explain inflation simply": coachIntents[0].response,
  "Build my first saving habit": coachIntents[1].response,
  "Why do I need an emergency fund?": coachIntents[2].response,
  "How to teach kids about money?": coachIntents[3].response,
  "Fixed vs variable rate loans": coachIntents[5].response,
  "What if I do nothing?": coachIntents[9].response
};

export const kidsConcepts = [
  {
    title: "Needs vs wants",
    copy: "A need helps you live. A want is fun, but it can wait."
  },
  {
    title: "Saving jar",
    copy: "Every coin has a mission. Put coins toward a goal before spending."
  },
  {
    title: "Pocket money",
    copy: "Save first, spend later. Future-you gets a vote too."
  }
];

export const voiceCommands = [
  "Read my financial score",
  "Start next lesson",
  "Explain inflation simply",
  "Repeat the question"
];

export function matchCoachIntent(input: string): string {
  const normalized = input.toLowerCase();
  for (const intent of coachIntents) {
    if (intent.keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
      return intent.response;
    }
  }
  return "That's a great question. Financial confidence comes from understanding the basics: spending less than you earn, building an emergency fund, and letting time work for you through consistent saving. Which of these would you like to explore first?";
}
