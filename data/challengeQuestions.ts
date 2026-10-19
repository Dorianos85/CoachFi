import { assertCurrentPersonalStorage, captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";
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
    "id": "c1",
    "question": "How should 50/30/20 be understood as a flexible guide for take-home income?",
    "answers": [
      {
        "id": "A",
        "text": "50% savings, 30% needs, 20% wants"
      },
      {
        "id": "B",
        "text": "50% needs, 30% wants, 20% savings and debt payments"
      },
      {
        "id": "C",
        "text": "Always save 20%, even at the expense of essential bills"
      },
      {
        "id": "D",
        "text": "Borrow in order to save exactly 20%"
      }
    ],
    "correctAnswer": "B",
    "explanation": "50/30/20 is an illustrative split of take-home income that can be adapted. First protect essential needs and required minimum repayments; do not count the same payment twice. Adjust amounts when income varies. Without a surplus, do not force 20% saving.",
    "reward": 50
  },
  {
    "id": "c2",
    "question": "Model: PLN 1,000, a constant hypothetical 5% a year, annual compounding, interest retained. No contributions, withdrawals, fees or tax; inflation ignored. Nominal balance after 2 years?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 1,000"
      },
      {
        "id": "B",
        "text": "PLN 1,100"
      },
      {
        "id": "C",
        "text": "PLN 1,102.50"
      },
      {
        "id": "D",
        "text": "PLN 2,000"
      }
    ],
    "correctAnswer": "C",
    "explanation": "Compounding adds interest on retained earlier interest. In the model, 1,000 × 1.05 × 1.05 = PLN 1,102.50. The positive result depends on the assumed 5%, not time alone. This is a hypothetical calculation, with no guarantee of actual gains; investments can lose value.",
    "reward": 50
  },
  {
    "id": "c3",
    "question": "Which statement describes diversification and its limit?",
    "answers": [
      {
        "id": "A",
        "text": "Everything in one strong company"
      },
      {
        "id": "B",
        "text": "Different assets can reduce concentration; losses remain possible"
      },
      {
        "id": "C",
        "text": "One bond removes every risk"
      },
      {
        "id": "D",
        "text": "Frequent trades guarantee protection from a decline"
      }
    ],
    "correctAnswer": "B",
    "explanation": "Diversification spreads exposure across different assets and can reduce concentration risk. It does not remove market risk or guarantee avoiding losses. Different fund names may hide similar holdings; check holdings, risk and costs. No purchase is required.",
    "reward": 50
  },
  {
    "id": "c4",
    "question": "How does a debt avalanche work once essentials and all required minimum repayments are covered?",
    "answers": [
      {
        "id": "A",
        "text": "Finances every extra payment with a new loan"
      },
      {
        "id": "B",
        "text": "Always starts with the smallest balance"
      },
      {
        "id": "C",
        "text": "Puts an available extra payment toward the highest-rate debt"
      },
      {
        "id": "D",
        "text": "Skips required payments on other debts"
      }
    ],
    "correctAnswer": "C",
    "explanation": "An avalanche puts available extra money toward the highest rate after essentials and every debt minimum. With fixed rates and no extra fees, it can reduce interest. Check fees and consequences of arrears; without a surplus, do not force an extra payment. It does not guarantee the lowest total cost under all conditions.",
    "reward": 50
  },
  {
    "id": "c5",
    "question": "Hypothetical: nominal return +2% and inflation 5% over the same year, no fees or tax. What is the rounded real return?",
    "answers": [
      {
        "id": "A",
        "text": "+7%"
      },
      {
        "id": "B",
        "text": "+2%"
      },
      {
        "id": "C",
        "text": "0%"
      },
      {
        "id": "D",
        "text": "About −2.86%"
      }
    ],
    "correctAnswer": "D",
    "explanation": "The exact relation is (1.02 ÷1.05 −1) × 100% ≈ −2.86%. Subtracting 2% −5% =−3% is an approximation. Initial PLN 1,000 becomes nominal PLN 1,020, or about PLN 971.43 in initial prices. The model uses the same year and no fees or tax; it is not a current offer.",
    "reward": 50
  },
  {
    "id": "c6",
    "question": "Which statement about funds is correct?",
    "answers": [
      {
        "id": "A",
        "text": "Every ETF always tracks an index"
      },
      {
        "id": "B",
        "text": "An index fund tracks an index; an ETF can be indexed or active"
      },
      {
        "id": "C",
        "text": "Every index fund is the cheapest"
      },
      {
        "id": "D",
        "text": "Every ETF guarantees beating the market"
      }
    ],
    "correctAnswer": "B",
    "explanation": "An index fund aims to track an index. An ETF is an exchange-traded fund structure; it can be indexed or active. Neither label guarantees low costs, beating the market or avoiding losses. Check the objective, holdings, risk and all costs. You do not have to invest.",
    "reward": 50
  },
  {
    "id": "c7",
    "question": "Which statement describes DCA?",
    "answers": [
      {
        "id": "A",
        "text": "Investing the whole amount only at the lowest price"
      },
      {
        "id": "B",
        "text": "Selling everything after every decline"
      },
      {
        "id": "C",
        "text": "An equal amount at regular intervals, regardless of price"
      },
      {
        "id": "D",
        "text": "Converting savings into dollars"
      }
    ],
    "correctAnswer": "C",
    "explanation": "DCA uses an equal amount at regular intervals; a lower price buys more units. It guarantees neither profit nor protection from loss and does not automatically remove emotions. With no fees or tax: PLN 100 at 10 and PLN 100 at 20 buys 15 units. At 8 they are worth PLN 120 versus PLN 200 contributed. Contributions are optional, after essentials and required minimum repayments.",
    "reward": 50
  },
  {
    "id": "c8",
    "question": "Rule 72: a hypothetical constant positive 8% nominal annual rate, annual compounding, no contributions, withdrawals, fees or tax; inflation ignored. What doubling-time estimate does the rule give?",
    "answers": [
      {
        "id": "A",
        "text": "About 6 years"
      },
      {
        "id": "B",
        "text": "About 9 years"
      },
      {
        "id": "C",
        "text": "About 72 years"
      },
      {
        "id": "D",
        "text": "Exactly 9 years for every investment"
      }
    ],
    "correctAnswer": "B",
    "explanation": "72 ÷8 ≈ 9 years is an approximation, not an exact date. In the model, 1,000 × 1.08⁹ ≈ PLN 1,999.00; after 10 annual credits it exceeds PLN 2,000. A constant positive 8% is an assumption, not a forecast. Actual rates may change and investments can lose value. This nominal model excludes cash flows, fees, tax and inflation.",
    "reward": 50
  },
  {
    "id": "c9",
    "question": "What is an ETF?",
    "answers": [
      {
        "id": "A",
        "text": "A deposit guaranteeing a stated interest payment"
      },
      {
        "id": "B",
        "text": "An electronic transfer fee"
      },
      {
        "id": "C",
        "text": "An exchange-traded fund, indexed or actively managed"
      },
      {
        "id": "D",
        "text": "A government emergency reserve"
      }
    ],
    "correctAnswer": "C",
    "explanation": "An ETF is an exchange-traded fund. It may track an index or be actively managed. Diversification depends on actual holdings; a narrow-sector fund can be concentrated. The label guarantees neither low costs nor freedom from loss. Check objectives, holdings, risks and costs; no purchase is required.",
    "reward": 50
  },
  {
    "id": "c10",
    "question": "Which choice does NOT fit the purpose of an emergency reserve?",
    "answers": [
      {
        "id": "A",
        "text": "Ready access for an unexpected expense"
      },
      {
        "id": "B",
        "text": "A situation-based goal and small achievable start"
      },
      {
        "id": "C",
        "text": "High-risk stocks solely for maximum growth"
      },
      {
        "id": "D",
        "text": "Keeping the reserve separate from everyday spending"
      }
    ],
    "correctAnswer": "C",
    "explanation": "A reserve aims to make funds accessible for unexpected needs with limited risk, rather than maximize returns. Keep it separate from everyday spending. Size depends on circumstances;3–6 months is an optional guide, not a duty or guarantee. Start voluntarily after essentials and required minimum repayments; without a surplus, pause contributions.",
    "reward": 50
  },
  {
    "id": "c11",
    "question": "What generally happens to an existing fixed-coupon bond’s secondary-market price when comparable market yields rise and all other conditions stay equal?",
    "answers": [
      {
        "id": "A",
        "text": "The price rises"
      },
      {
        "id": "B",
        "text": "The price falls"
      },
      {
        "id": "C",
        "text": "The price always equals face value"
      },
      {
        "id": "D",
        "text": "The price must double"
      }
    ],
    "correctAnswer": "B",
    "explanation": "With fixed cash flows and all else equal, a higher market yield means a lower secondary-market price. The agreed coupon does not rise automatically. A sale price before maturity differs from contractual payments. Repayment also depends on the issuer’s ability to pay; default and liquidity risk remain.",
    "reward": 50
  },
  {
    "id": "c12",
    "question": "Hypothetically, monthly income rises by PLN 200 and discretionary spending by PLN 180; essentials and required minimum repayments are unchanged. How much does the surplus rise?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 200"
      },
      {
        "id": "B",
        "text": "PLN 180"
      },
      {
        "id": "C",
        "text": "PLN 20"
      },
      {
        "id": "D",
        "text": "It can never change"
      }
    ],
    "correctAnswer": "C",
    "explanation": "200 − 180 = PLN 20 of extra monthly surplus. Discretionary spending rising with income illustrates lifestyle inflation, distinct from rising prices and necessary costs. Not every pay rise must be saved. Adapt the plan to essentials, required minimum repayments, goals and variable income; this is not a judgment of the person.",
    "reward": 50
  },
  {
    "id": "c13",
    "question": "What is the main purpose of long-term retirement planning?",
    "answers": [
      {
        "id": "A",
        "text": "Guaranteed doubling of every balance"
      },
      {
        "id": "B",
        "text": "Preparing resources for future needs when work changes or ends"
      },
      {
        "id": "C",
        "text": "Replacing an emergency reserve with a risky investment"
      },
      {
        "id": "D",
        "text": "A certain tax benefit for every payment and every account"
      }
    ],
    "correctAnswer": "B",
    "explanation": "Planning helps prepare resources for future needs but guarantees neither full income replacement nor profit. A retirement goal alone does not give every account a tax benefit. Essentials, required minimum repayments and reserves come before optional investment. Adjust or pause contributions when income varies.",
    "reward": 50
  },
  {
    "id": "c14",
    "question": "Hypothetically on a given date: assets PLN 50,000 and liabilities PLN 20,000. What is net worth?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 70,000"
      },
      {
        "id": "B",
        "text": "PLN 30,000"
      },
      {
        "id": "C",
        "text": "PLN 50,000"
      },
      {
        "id": "D",
        "text": "Monthly salary"
      }
    ],
    "correctAnswer": "B",
    "explanation": "Net worth =assets −liabilities:50,000 − 20,000 = PLN 30,000 on that date. It is a wealth snapshot, not monthly income and expense flows or available cash. It does not define overall financial well-being or a person’s worth. Valuations and liabilities may change.",
    "reward": 50
  },

  // ── Poland Financial Literacy (OECD/INFE source) ─────────────────────────
  {
    "id": "c15",
    "question": "Hypothetical month: PLN 100 remains after essentials and required repayments; no other funds are available. A new payment is PLN 150. What does the budget show?",
    "answers": [
      {
        "id": "A",
        "text": "Knowing compound interest covers the missing PLN 50"
      },
      {
        "id": "B",
        "text": "An unconfirmed pay rise guarantees repayment"
      },
      {
        "id": "C",
        "text": "PLN 50 is missing; check costs and affordability before deciding"
      },
      {
        "id": "D",
        "text": "Borrow PLN 50 and assume the budget is unchanged"
      }
    ],
    "correctAnswer": "C",
    "explanation": "100 − 150 = −PLN 50. Essentials and existing required repayments have already been deducted once in this example. Knowing compound interest alone does not provide income or ensure repayment. Before a new commitment, check full costs, dates and a realistic budget; allow for fluctuations with variable income. Another loan does not prove that this payment is covered by the stated budget.",
    "reward": 50
  },
  {
    "id": "c16",
    "question": "Which checklist is most complete when comparing surveys of trust in financial institutions?",
    "answers": [
      {
        "id": "A",
        "text": "Only the publication headline"
      },
      {
        "id": "B",
        "text": "Only the year, without sample information"
      },
      {
        "id": "C",
        "text": "The number of likes on the publication"
      },
      {
        "id": "D",
        "text": "Year, sample, question wording and measurement method"
      }
    ],
    "correctAnswer": "D",
    "explanation": "Check who was surveyed, when, what was asked and how the result was calculated. Different questions or samples limit comparability. Declared trust is not a certificate that a particular institution is safe or proof of an effect on wealth.",
    "reward": 50
  },
  {
    "id": "c17",
    "question": "Exercise: a made-up 0–21-point scale gives a score of 13. What does the gap to the maximum mean?",
    "answers": [
      {
        "id": "A",
        "text": "8 lost opportunities for profit"
      },
      {
        "id": "B",
        "text": "8 points under the chosen scoring key, not a wealth diagnosis"
      },
      {
        "id": "C",
        "text": "8 months without money"
      },
      {
        "id": "D",
        "text": "8 people without an account"
      }
    ],
    "correctAnswer": "B",
    "explanation": "21 − 13 = 8 points in this exercise. This made-up scale is not the current OECD scale; points are not a count of questions. Points alone prove neither behaviour, debt, resilience nor the causes of difficulties. Survey results need a year, sample, questions and scoring key; measurement versions can differ.",
    "reward": 50
  },
  {
    "id": "c18",
    "question": "Exercise: this month, PLN 50 remains after essential needs and required minimum repayments. Which step is voluntary and fits within that amount?",
    "answers": [
      {
        "id": "A",
        "text": "Borrow PLN 100 to make a compulsory saving of 100"
      },
      {
        "id": "B",
        "text": "Skip a required repayment"
      },
      {
        "id": "C",
        "text": "Choose PLN 10 for a reserve and leave PLN 40"
      },
      {
        "id": "D",
        "text": "Assume a small transfer will remove all stress"
      }
    ],
    "correctAnswer": "C",
    "explanation": "50 − 10 = PLN 40 in the same month; essentials and required repayments were already counted once. A small step is an option, not a duty or a guarantee of no stress. Without a surplus, pause contributions; do not borrow to save. When income varies, return to the plan and adjust the amount.",
    "reward": 50
  },
  {
    "id": "c19",
    "question": "Which Polish term means money set aside for unexpected, unplanned expenses?",
    "answers": [
      {
        "id": "A",
        "text": "Pay for current work"
      },
      {
        "id": "B",
        "text": "Poduszka finansowa (emergency reserve)"
      },
      {
        "id": "C",
        "text": "A required loan to fund savings"
      },
      {
        "id": "D",
        "text": "A certain investment profit"
      }
    ],
    "correctAnswer": "B",
    "explanation": "An emergency reserve is kept separately for unexpected expenses. Adapt the goal to your circumstances; a small start is voluntary, with no single mandatory threshold. First protect essential needs and required minimum repayments; without a surplus, pause contributions. Check access and risk; a reserve cannot automatically cover every event.",
    "reward": 50
  },
  {
    "id": "c20",
    "question": "What do attitudes towards money describe in a survey?",
    "answers": [
      {
        "id": "A",
        "text": "The number of products owned"
      },
      {
        "id": "B",
        "text": "Income level and wealth"
      },
      {
        "id": "C",
        "text": "Stated views on spending, saving and the future"
      },
      {
        "id": "D",
        "text": "Guaranteed repayment capacity"
      }
    ],
    "correctAnswer": "C",
    "explanation": "These are stated views, such as spending today versus saving for the future. They are not a knowledge test or a full measure of behaviour or financial circumstances. Stated views alone prove neither the cause of difficulties nor a future outcome. Income and essential costs also shape possibilities; avoid judging the person.",
    "reward": 50
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

export function isChallengeCompletedToday(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = storage.getItem(CHALLENGE_KEY);
    if (!raw) return false;
    const { date } = JSON.parse(raw) as { date: string };
    return date === new Date().toISOString().split("T")[0];
  } catch {
    return false;
  }
}

export function markChallengeCompleted(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): void {
  assertCurrentPersonalStorage(storage);
  const today = new Date().toISOString().split("T")[0];
  if (!storage.setItem(CHALLENGE_KEY, JSON.stringify({ date: today }))) throw new Error("Storage session changed");
}
