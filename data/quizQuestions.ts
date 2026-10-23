export interface QuizQuestion {
  id: string;
  question: string;
  answers: { id: string; text: string }[];
  correctAnswer: string;
  reward: number;
  successMessage: string;
  retryMessage: string;
  category: string;
}

export const quizQuestions: QuizQuestion[] = [
  // ── Foundations ──────────────────────────────────────────────────────────
  {
    "id": "inflation-basics",
    "question": "The same weighted basket costs PLN 1,000, then PLN 1,050. What does this illustration show?",
    "answers": [
      {
        "id": "A",
        "text": "Every price must rise by 5%"
      },
      {
        "id": "B",
        "text": "Basket prices rise 5%; the same cash buys less"
      },
      {
        "id": "C",
        "text": "All household costs rise by exactly 5%"
      },
      {
        "id": "D",
        "text": "One higher price alone proves general inflation"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "The basket rises 5%; each price and household can differ. +25 local points.",
    "retryMessage": "Inflation concerns a broad weighted basket, not one price. Here (1,050 ÷ 1,000 − 1) × 100% = 5%; the same cash buys less of that basket. Different households have different spending baskets.",
    "category": "Inflation"
  },
  {
    "id": "emergency-fund",
    "question": "In this example you choose 3 months at PLN 2,000 of essential costs (required debt minimums included once). What is the goal with constant costs?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 2,000"
      },
      {
        "id": "B",
        "text": "PLN 4,000"
      },
      {
        "id": "C",
        "text": "PLN 6,000"
      },
      {
        "id": "D",
        "text": "PLN 12,000"
      }
    ],
    "correctAnswer": "C",
    "reward": 25,
    "successMessage": "Chosen goal: 3 × 2,000 = PLN 6,000. An example, not a required threshold. +25 local points.",
    "retryMessage": "3 × PLN 2,000 = PLN 6,000 under the stated constant costs, with debt minimums already included once. Reserve size depends on circumstances; 3–6 months can be an indicative choice without guaranteed protection. This gives no completion date or transfer obligation.",
    "category": "Emergency Fund"
  },
  {
    "id": "saving-habit",
    "question": "Which transfer is safe when income varies?",
    "answers": [
      {
        "id": "A",
        "text": "Save a fixed amount even if bills are unpaid"
      },
      {
        "id": "B",
        "text": "Borrow money to keep saving every month"
      },
      {
        "id": "C",
        "text": "Choose an affordable amount after essentials and minimum payments"
      },
      {
        "id": "D",
        "text": "Transfer all income before checking upcoming bills"
      }
    ],
    "correctAnswer": "C",
    "reward": 25,
    "successMessage": "An optional transfer uses affordable surplus after essentials and required minimum payments. +25 local points.",
    "retryMessage": "Reserve essentials and required minimum payments first. Then choose an optional transfer from available surplus. Recheck its amount and timing when income varies; pause when there is no surplus.",
    "category": "Saving Habit"
  },
  {
    "id": "interest-rates",
    "question": "Hypothetical loan: a 3% reference rate + a 2 percentage-point margin. At the contractual reset the reference rises to 4%; the margin is unchanged. What is the new rate?",
    "answers": [
      {
        "id": "A",
        "text": "2%"
      },
      {
        "id": "B",
        "text": "5%"
      },
      {
        "id": "C",
        "text": "6%"
      },
      {
        "id": "D",
        "text": "9%"
      }
    ],
    "correctAnswer": "C",
    "reward": 25,
    "successMessage": "4% + 2 percentage points = 6% at the contractual reset. +25 local points.",
    "retryMessage": "The new reference replaces the old: 4% + the unchanged 2 percentage-point margin = 6%. The contract sets the timing; a central-bank decision alone does not instantly change every installment. A rate can be fixed or periodically fixed. Check the agreed period and the subsequent contractual terms when it ends; this does not freeze every fee.",
    "category": "Credit & Rates"
  },

  // ── Money Mindset ─────────────────────────────────────────────────────────
  {
    id: "net-worth",
    question: "What is 'net worth'?",
    answers: [
      { id: "A", text: "Your monthly salary after tax" },
      { id: "B", text: "Total assets minus total liabilities" },
      { id: "C", text: "How much cash you have in your wallet" },
      { id: "D", text: "Your credit score" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "Net worth = assets minus liabilities at the same date. It describes a financial position, not your value as a person or whether cash is available for this month's bills. +25 points!",
    retryMessage: "Net worth is assets minus liabilities at the same date. Income is a flow; cash and credit scores are different measures. Net worth alone does not describe liquidity or your value as a person.",
    category: "Money Mindset",
  },
  {
    id: "lifestyle-inflation",
    question: "What is 'lifestyle inflation'?",
    answers: [
      { id: "A", text: "Government increasing minimum wage" },
      { id: "B", text: "Prices rising faster than salaries" },
      { id: "C", text: "Choosing more discretionary spending as your income rises" },
      { id: "D", text: "Inflating your lifestyle on your resume" },
    ],
    correctAnswer: "C",
    reward: 25,
    successMessage: "Lifestyle inflation concerns choices about a higher standard of living. Higher prices or necessary costs are different. If there is a surplus after needs and commitments, you can choose to save part of it. +25 points!",
    retryMessage: "Lifestyle inflation is a voluntary rise in discretionary spending as income grows. It is different from price inflation or necessary expenses, and it does not mean every raise is fully spent.",
    category: "Money Mindset",
  },
  {
    id: "pay-yourself-first",
    question: "What does 'pay yourself first' mean?",
    answers: [
      { id: "A", text: "Spend on yourself before paying bills" },
      { id: "B", text: "Plan affordable savings after reserving money for essentials and required minimum payments" },
      { id: "C", text: "Increase your own salary first" },
      { id: "D", text: "Buy luxury items before groceries" },
    ],
    correctAnswer: "B",
    reward: 20,
    successMessage: "Plan savings from available surplus after protecting essentials and required minimum payments. With irregular income, review each payment; with no surplus, skip the transfer. +20 points!",
    retryMessage: "First reserve money for essentials and required minimum payments, then choose savings from available surplus before discretionary spending. A transfer is optional; no surplus means no transfer, without blame.",
    category: "Money Mindset",
  },

  // ── Saving Habit ──────────────────────────────────────────────────────────
  {
    "id": "budget-50-30-20",
    "question": "With PLN 4,000 take-home income, what is the illustrative 20% bucket?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 1,200"
      },
      {
        "id": "B",
        "text": "PLN 800"
      },
      {
        "id": "C",
        "text": "PLN 2,000"
      },
      {
        "id": "D",
        "text": "PLN 4,000"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "20% of PLN 4,000 is PLN 800. The percentages are a flexible guide. +25 local points.",
    "retryMessage": "4,000 × 20% = PLN 800. In this example, required minimum debt payments are included once in needs; the 20% bucket is savings and extra debt repayment. This is our illustration convention, not a compulsory split.",
    "category": "Saving Habit"
  },
  {
    "id": "high-yield-savings",
    "question": "Which checklist is most complete when comparing savings accounts in Poland?",
    "answers": [
      {
        "id": "A",
        "text": "Only the advertised interest rate"
      },
      {
        "id": "B",
        "text": "Rates and conditions, fees, access, and deposit protection"
      },
      {
        "id": "C",
        "text": "Whether the account guarantees an inflation-beating return"
      },
      {
        "id": "D",
        "text": "Whether your deposit is automatically invested in stocks"
      }
    ],
    "correctAnswer": "B",
    "reward": 20,
    "successMessage": "Compare actual conditions and costs, not just the advertised rate. +20 local points.",
    "retryMessage": "Check the rate and its duration, qualifying conditions, fees, withdrawal access, and the applicable deposit guarantee scheme. A deposit account is not a stock investment; inflation can still reduce purchasing power.",
    "category": "Saving Habit"
  },
  {
    "id": "dca",
    "question": "You invest PLN 100 twice, at PLN 10 then PLN 20 per unit. What do you buy?",
    "answers": [
      {
        "id": "A",
        "text": "10 units both times"
      },
      {
        "id": "B",
        "text": "5 units then 10 units"
      },
      {
        "id": "C",
        "text": "10 units then 5 units"
      },
      {
        "id": "D",
        "text": "A guaranteed profit"
      }
    ],
    "correctAnswer": "C",
    "reward": 30,
    "successMessage": "The same PLN 100 buys 10 units, then 5 units. DCA can still lose money. +30 local points.",
    "retryMessage": "100 ÷ 10 = 10 units; 100 ÷ 20 = 5 units. DCA uses equal amounts at regular intervals, not equal unit counts. At PLN 8 per unit, all 15 units are worth PLN 120 against PLN 200 invested: a PLN 80 loss, ignoring fees and taxes.",
    "category": "Saving Habit"
  },

  // ── Inflation ─────────────────────────────────────────────────────────────
  {
    "id": "real-return",
    "question": "For one year, assumed nominal return is 2% and inflation 5%, with no fees, tax or cash flows. What is real return?",
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
        "text": "Approximately −2.86%"
      }
    ],
    "correctAnswer": "D",
    "reward": 30,
    "successMessage": "(1.02 ÷ 1.05 − 1) × 100% ≈ −2.86%. +30 local points.",
    "retryMessage": "PLN 1,000 becomes PLN 1,020 nominally, but 1,020 ÷ 1.05 ≈ PLN 971.43 in starting prices. Real return is approximately −2.86%; 2% − 5% = −3% is only a subtraction estimate, with fees/tax and cash flows excluded.",
    "category": "Inflation"
  },
  {
    "id": "rule-of-72",
    "question": "Assume a fixed 6% nominal rate, annual compounding and no fees, tax or cash flows. What does Rule of 72 estimate?",
    "answers": [
      {
        "id": "A",
        "text": "432 years, a guaranteed result"
      },
      {
        "id": "B",
        "text": "About 12 years to double, without a guarantee"
      },
      {
        "id": "C",
        "text": "0.08 years, a guaranteed result"
      },
      {
        "id": "D",
        "text": "Exactly 12 years even if rates change"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "72 ÷ 6 ≈ 12 years is an estimate under the stated assumptions. +30 local points.",
    "retryMessage": "Rule of 72 estimates nominal doubling: 72 ÷ a positive annual percentage rate. At an assumed fixed 6% with annual compounding/reinvestment and no cash flows, fees or tax, this is about 12 years. It is not an exact result, forecast or guarantee; inflation is excluded here.",
    "category": "Inflation"
  },
  {
    "id": "inflation-hedge",
    "question": "Someone says an investment will always beat inflation. Which response is justified?",
    "answers": [
      {
        "id": "A",
        "text": "Treat good past returns as a guarantee"
      },
      {
        "id": "B",
        "text": "Invest essential bill money to avoid inflation"
      },
      {
        "id": "C",
        "text": "Check loss risk, costs and access; gains are not guaranteed"
      },
      {
        "id": "D",
        "text": "A long holding period removes all loss risk"
      }
    ],
    "correctAnswer": "C",
    "reward": 25,
    "successMessage": "Assess risk, costs and access before trusting a promise. +25 local points.",
    "retryMessage": "No investment automatically guarantees beating inflation. Check possible loss, costs and access to money. Past results and a long holding period are not guarantees. Protect essentials and required minimum repayments; postponing investment is an option when income varies.",
    "category": "Inflation"
  },

  // ── Credit & Rates ────────────────────────────────────────────────────────
  {
    "id": "debt-avalanche",
    "question": "After essentials and required minimums, PLN 100 remains. A PLN 1,000 debt charges 20% and a PLN 500 debt 10% annually; fixed rates, no fees, penalties or arrears. Where does avalanche direct the extra?",
    "answers": [
      {
        "id": "A",
        "text": "Split equally, ignoring rates"
      },
      {
        "id": "B",
        "text": "To the smallest debt regardless of rate"
      },
      {
        "id": "C",
        "text": "To the debt charging 20%"
      },
      {
        "id": "D",
        "text": "Instead of another debt's minimum"
      }
    ],
    "correctAnswer": "C",
    "reward": 30,
    "successMessage": "Avalanche directs the extra to 20% while keeping all minimums. +30 local points.",
    "retryMessage": "After essentials and all required minimums, avalanche directs the available extra PLN 100 to the higher 20% rate. This model assumes fixed rates and no fees, penalties or arrears; actual prepayment terms depend on the contract. No extra payment is required without a surplus.",
    "category": "Credit & Rates"
  },
  {
    "id": "credit-score-factors",
    "question": "Which statement distinguishes BIK repayment history from repayment capacity in Poland?",
    "answers": [
      {
        "id": "A",
        "text": "A high score guarantees a new loan"
      },
      {
        "id": "B",
        "text": "Timeliness matters; a lender also assesses income and expenses"
      },
      {
        "id": "C",
        "text": "Coachfi points replace a lender's assessment"
      },
      {
        "id": "D",
        "text": "Income does not matter for repayment capacity"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Repayment history and capacity are different parts of assessment. +25 local points.",
    "retryMessage": "Timely repayment matters for risk assessment. A lender also assesses income, expenses and debts, then makes its own decision. A BIK score does not guarantee a loan; Coachfi points are not a BIK score. No new debt or paid report is needed for the exercise.",
    "category": "Credit & Rates"
  },
  {
    "id": "bond-prices",
    "question": "You sell a fixed-cash-flow bond before maturity. Its required market yield rises, other factors unchanged. What happens to its price?",
    "answers": [
      {
        "id": "A",
        "text": "It rises"
      },
      {
        "id": "B",
        "text": "It falls"
      },
      {
        "id": "C",
        "text": "The coupon automatically rises"
      },
      {
        "id": "D",
        "text": "Principal at maturity automatically falls"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "With fixed cash flows, a higher required yield lowers the price. +30 local points.",
    "retryMessage": "For the same fixed cash flows, a higher required yield means a lower secondary-market price. This does not automatically change the coupon or contractual principal at maturity. Sale price, redemption terms and default risk are distinct; this is not a rule for every bond.",
    "category": "Credit & Rates"
  },

  // ── Emergency Fund ────────────────────────────────────────────────────────
  {
    "id": "emergency-fund-characteristics",
    "question": "Which decision conflicts with a readily accessible reserve with low volatility?",
    "answers": [
      {
        "id": "A",
        "text": "Check access timing"
      },
      {
        "id": "B",
        "text": "Check fees and protection scope"
      },
      {
        "id": "C",
        "text": "Put the entire reserve in volatile shares"
      },
      {
        "id": "D",
        "text": "Distinguish reserves from planned spending"
      }
    ],
    "correctAnswer": "C",
    "reward": 25,
    "successMessage": "Changing share prices may reduce the reserve just when needed. +25 local points.",
    "retryMessage": "An entire reserve in volatile shares may lose value when needed. Check access, fees and terms; lower risk does not mean no losses or costs. Deposit protection depends on the institution and product, and does not cover every investment. This is not a provider choice.",
    "category": "Emergency Fund"
  },
  {
    "id": "emergency-fund-start",
    "question": "Example: PLN 1,000 income, PLN 900 essentials, PLN 80 required minimums, no other costs or fees. Which small start fits these conditions?",
    "answers": [
      {
        "id": "A",
        "text": "Transfer PLN 100 from a PLN 20 surplus"
      },
      {
        "id": "B",
        "text": "Optionally save PLN 10, leaving PLN 10"
      },
      {
        "id": "C",
        "text": "Borrow to save"
      },
      {
        "id": "D",
        "text": "Treat one month of costs as a required first threshold"
      }
    ],
    "correctAnswer": "B",
    "reward": 20,
    "successMessage": "Surplus is PLN 20; PLN 10 is an optional choice, not a duty. +20 local points.",
    "retryMessage": "1,000 − 900 − 80 = PLN 20. An optional PLN 10 fits the surplus and leaves PLN 10; no transfer is required. At PLN 980 income, surplus is PLN 0. One month of expenses is not a required first goal; without funds, pause the transfer and do not borrow to save.",
    "category": "Emergency Fund"
  },

  // ── Long-Term Investing ───────────────────────────────────────────────────
  {
    id: "compound-interest",
    question: "What is compound interest when credited interest stays in the balance?",
    answers: [
      { id: "A", text: "Interest only on the initial amount" },
      { id: "B", text: "An early withdrawal fee" },
      { id: "C", text: "Interest on principal and retained earlier interest" },
      { id: "D", text: "A certain profit from every investment" },
    ],
    correctAnswer: "C",
    reward: 30,
    successMessage: "In a hypothetical model, PLN 1,000 at a constant 5% a year with annual compounding becomes PLN 1,050, then PLN 1,102.50. Interest stays; there are no contributions, withdrawals, fees or tax, and inflation is ignored. The extra PLN 2.50 is interest on the first PLN 50 of interest. This is a nominal model, not an offer or guaranteed investment profit. +30 local points.",
    retryMessage: "In a hypothetical model, PLN 1,000 at a constant 5% a year with annual compounding becomes PLN 1,050, then PLN 1,102.50. Interest stays; there are no contributions, withdrawals, fees or tax, and inflation is ignored. The extra PLN 2.50 is interest on the first PLN 50 of interest. This is a nominal model, not an offer or guaranteed investment profit.",
    category: "Long-Term Investing",
  },
  {
    id: "diversification",
    question: "What is the purpose of diversification, without guaranteeing no losses?",
    answers: [
      { id: "A", text: "Putting everything into one company" },
      { id: "B", text: "Spreading investments to reduce concentration risk" },
      { id: "C", text: "Ensuring a profit regardless of the market" },
      { id: "D", text: "Changing the portfolio weekly to ensure a profit" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "Different investments can reduce dependence on one issuer or sector. Multiple holdings may still share risks and fall together. Diversification does not guarantee profit or remove the risk of market losses. +25 local points.",
    retryMessage: "Different investments can reduce dependence on one issuer or sector. Multiple holdings may still share risks and fall together. Diversification does not guarantee profit or remove the risk of market losses.",
    category: "Long-Term Investing",
  },
  {
    id: "index-fund",
    question: "What defines an index fund?",
    answers: [
      { id: "A", text: "Always having zero costs" },
      { id: "B", text: "An objective of tracking a specified index" },
      { id: "C", text: "Every ETF being an index fund" },
      { id: "D", text: "A guaranteed return above the market" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "An index fund seeks to track a specified index. Costs and tracking error can create differences in returns. Not every index fund is cheaper; check actual costs and risks. An ETF may track an index or be actively managed. The name does not promise market outperformance. +25 local points.",
    retryMessage: "An index fund seeks to track a specified index. Costs and tracking error can create differences in returns. Not every index fund is cheaper; check actual costs and risks. An ETF may track an index or be actively managed. The name does not promise market outperformance.",
    category: "Long-Term Investing",
  },
  {
    id: "etf-definition",
    question: "What does ETF mean?",
    answers: [
      { id: "A", text: "An account with guaranteed interest" },
      { id: "B", text: "A bank transfer fee" },
      { id: "C", text: "A fund whose shares trade on an exchange" },
      { id: "D", text: "A fund that always tracks a broad index" },
    ],
    correctAnswer: "C",
    reward: 25,
    successMessage: "An ETF is an exchange-traded fund. It may follow an index or an active strategy and hold a narrow set of investments. An ETF alone does not ensure broad diversification or protect capital. Check holdings, risks, fees and buying and selling costs; losses are possible. +25 local points.",
    retryMessage: "An ETF is an exchange-traded fund. It may follow an index or an active strategy and hold a narrow set of investments. An ETF alone does not ensure broad diversification or protect capital. Check holdings, risks, fees and buying and selling costs; losses are possible.",
    category: "Long-Term Investing",
  },
  {
    id: "time-in-market",
    question: "What belongs in an investment plan instead of assuming time alone guarantees profit?",
    answers: [
      { id: "A", text: "The date of a certain market bottom" },
      { id: "B", text: "Goals, horizon, reserves, acceptable losses and costs" },
      { id: "C", text: "Always selling after a 10% drop" },
      { id: "D", text: "Always holding every investment" },
    ],
    correctAnswer: "B",
    reward: 30,
    successMessage: "A long horizon alone does not guarantee profit. A plan depends on goals, when money is needed, reserves, risk and costs; it can be reassessed when circumstances change. This is not an always-hold or sell-after-a-set-drop rule. Essentials and required minimums come first, and without surplus it is acceptable not to invest. +30 local points.",
    retryMessage: "A long horizon alone does not guarantee profit. A plan depends on goals, when money is needed, reserves, risk and costs; it can be reassessed when circumstances change. This is not an always-hold or sell-after-a-set-drop rule. Essentials and required minimums come first, and without surplus it is acceptable not to invest.",
    category: "Long-Term Investing",
  },

  // ── Retirement ────────────────────────────────────────────────────────────
  {
    id: "retirement-purpose",
    question: "What is the purpose of planning finances for retirement?",
    answers: [
      { id: "A", text: "Certainty of maintaining every current income" },
      { id: "B", text: "Preparing resources for future needs after work changes or ends" },
      { id: "C", text: "Replacing emergency reserves with a risky investment" },
      { id: "D", text: "Doubling money simply by opening an account" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "A plan compares future needs and possible sources of funds; it does not guarantee maintaining current income. Emergency reserves have a separate role. Outcomes depend on contributions, conditions, costs and risk, among other factors. Essentials, required minimum repayments and reserves come first; without surplus, start with a free planning exercise, without buying anything or opening an account. +25 local points.",
    retryMessage: "A plan compares future needs and possible sources of funds; it does not guarantee maintaining current income. Emergency reserves have a separate role. Outcomes depend on contributions, conditions, costs and risk, among other factors. Essentials, required minimum repayments and reserves come first; without surplus, start with a free planning exercise, without buying anything or opening an account.",
    category: "Retirement",
  },
  {
    id: "retirement-early-start",
    question: "Model: PLN 1,000 once, a constant 5% a year, annual compounding, interest retained. No later contributions, withdrawals, fees or tax; inflation ignored. What is the nominal balance after 2 years?",
    answers: [
      { id: "A", text: "PLN 1,000" },
      { id: "B", text: "PLN 1,100" },
      { id: "C", text: "PLN 1,102.50" },
      { id: "D", text: "PLN 2,000" },
    ],
    correctAnswer: "C",
    reward: 35,
    successMessage: "In this hypothetical model, 1,000 × 1.05 × 1.05 = PLN 1,102.50. After year one the balance is PLN 1,050; the second interest payment is PLN 52.50. The positive result comes from the assumed constant rate, not time alone. More periods allow more compounding here, but actual outcomes can differ and losses are possible. This is not a pension forecast or a recommendation to contribute. +35 local points.",
    retryMessage: "In this hypothetical model, 1,000 × 1.05 × 1.05 = PLN 1,102.50. After year one the balance is PLN 1,050; the second interest payment is PLN 52.50. The positive result comes from the assumed constant rate, not time alone. More periods allow more compounding here, but actual outcomes can differ and losses are possible. This is not a pension forecast or a recommendation to contribute.",
    category: "Retirement",
  },

  // ── Poland & Financial Literacy (OECD/INFE) ──────────────────────────────
  {
    "id": "poland-compound-gap",
    "question": "What can a survey percentage of correct answers about compound interest in Poland tell us?",
    "answers": [
      {
        "id": "A",
        "text": "Everyone answering incorrectly will fall into debt"
      },
      {
        "id": "B",
        "text": "Knowledge alone guarantees a high pension"
      },
      {
        "id": "C",
        "text": "It is a result of specific questions, sample, year and scoring"
      },
      {
        "id": "D",
        "text": "That percentage describes all financial behaviour"
      }
    ],
    "correctAnswer": "C",
    "reward": 30,
    "successMessage": "Check the year, surveyed population, questions and scoring method. A knowledge result is not the same as behaviour or financial circumstances. A statistical association alone does not prove that lacking this knowledge directly causes debt or low retirement savings. +30 local points.",
    "retryMessage": "Check the year, surveyed population, questions and scoring method. A knowledge result is not the same as behaviour or financial circumstances. A statistical association alone does not prove that lacking this knowledge directly causes debt or low retirement savings.",
    "category": "Financial Literacy"
  },
  {
    "id": "poland-trust-institutions",
    "question": "Does a survey percentage of stated trust establish that a particular institution is safe?",
    "answers": [
      {
        "id": "A",
        "text": "Yes, if it has many customers"
      },
      {
        "id": "B",
        "text": "Yes, every higher percentage means no risk"
      },
      {
        "id": "C",
        "text": "Yes, if the result is older"
      },
      {
        "id": "D",
        "text": "No; a survey does not replace checking the institution"
      }
    ],
    "correctAnswer": "D",
    "reward": 25,
    "successMessage": "Check the date, sample and exact wording, including whether the question concerns institutions or their employees. Stated trust does not certify a particular institution or product as safe. A percentage alone also does not prove a cause of savings or wealth.",
    "retryMessage": "Check the date, sample and exact wording, including whether the question concerns institutions or their employees. Stated trust does not certify a particular institution or product as safe. A percentage alone also does not prove a cause of savings or wealth.",
    "category": "Financial Literacy"
  },
  {
    "id": "poland-oecd-score",
    "question": "How should a gap to the maximum financial-literacy survey score be interpreted?",
    "answers": [
      {
        "id": "A",
        "text": "As a certain amount of lost savings"
      },
      {
        "id": "B",
        "text": "As a point gap dependent on questions and scoring"
      },
      {
        "id": "C",
        "text": "As a future investment return"
      },
      {
        "id": "D",
        "text": "As proof that the respondent is to blame"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Check the year, sample, instrument version and scoring key. A historical result does not automatically describe the current population. A point gap does not measure lost wealth and alone proves neither behaviour nor causes of financial difficulties.",
    "retryMessage": "Check the year, sample, instrument version and scoring key. A historical result does not automatically describe the current population. A point gap does not measure lost wealth and alone proves neither behaviour nor causes of financial difficulties.",
    "category": "Financial Literacy"
  },
  {
    "id": "poland-ppk-participation",
    "question": "What should be established before comparing PPK and PPE participation percentages?",
    "answers": [
      {
        "id": "A",
        "text": "Only the highest percentage"
      },
      {
        "id": "B",
        "text": "That both names mean the same programme"
      },
      {
        "id": "C",
        "text": "The separate programme, date and group used for each percentage"
      },
      {
        "id": "D",
        "text": "That non-participation proves a lack of knowledge"
      }
    ],
    "correctAnswer": "C",
    "reward": 30,
    "successMessage": "PPK and PPE are separate arrangements. Identify the programme, date, surveyed group and denominator; do not combine percentages without a stated method. Participation statistics alone explain neither why people decide nor whether a lack of compound-interest knowledge caused that decision.",
    "retryMessage": "PPK and PPE are separate arrangements. Identify the programme, date, surveyed group and denominator; do not combine percentages without a stated method. Participation statistics alone explain neither why people decide nor whether a lack of compound-interest knowledge caused that decision.",
    "category": "Financial Literacy"
  },
  {
    "id": "financial-wellbeing-components",
    "question": "Which set most fully describes financial well-being in the CFPB framework?",
    "answers": [
      {
        "id": "A",
        "text": "Only income level"
      },
      {
        "id": "B",
        "text": "Day-to-day finances, shock absorption, goals and freedom of choice"
      },
      {
        "id": "C",
        "text": "Only a financial quiz score"
      },
      {
        "id": "D",
        "text": "The number of financial products owned"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "The CFPB framework covers a sense of control over current finances, capacity to handle shocks, progress towards goals and freedom of choice. It is a descriptive framework, not a guarantee after mastering three tasks. Resources, circumstances and personal perceptions also matter; not everything depends on individual choices.",
    "retryMessage": "The CFPB framework covers a sense of control over current finances, capacity to handle shocks, progress towards goals and freedom of choice. It is a descriptive framework, not a guarantee after mastering three tasks. Resources, circumstances and personal perceptions also matter; not everything depends on individual choices.",
    "category": "Financial Literacy"
  },
  {
    "id": "financial-resilience",
    "question": "What best describes financial resilience?",
    "answers": [
      {
        "id": "A",
        "text": "A guaranteed million in savings"
      },
      {
        "id": "B",
        "text": "An absolute absence of any debt"
      },
      {
        "id": "C",
        "text": "The capacity to handle a financial shock and rebuild one’s situation"
      },
      {
        "id": "D",
        "text": "Merely having an insurance policy"
      }
    ],
    "correctAnswer": "C",
    "reward": 30,
    "successMessage": "Income, resources, obligations, available support and the size of a shock matter, not just knowledge or mindset. A reserve may help but guarantees no coverage of every expense. Choose contributions voluntarily after essential needs and required minimum repayments; without a surplus, pause contributions.",
    "retryMessage": "Income, resources, obligations, available support and the size of a shock matter, not just knowledge or mindset. A reserve may help but guarantees no coverage of every expense. Choose contributions voluntarily after essential needs and required minimum repayments; without a surplus, pause contributions.",
    "category": "Financial Literacy"
  },
  {
    "id": "debt-spiral-cause",
    "question": "Exercise: PLN 1000 debt, a hypothetical fixed 10% per period added to the debt. For 2 periods there are no repayments, fees or new borrowing. What is the balance?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 1000"
      },
      {
        "id": "B",
        "text": "PLN 1210"
      },
      {
        "id": "C",
        "text": "PLN 1200"
      },
      {
        "id": "D",
        "text": "PLN 2000"
      }
    ],
    "correctAnswer": "B",
    "reward": 35,
    "successMessage": "1000 × 1.10 × 1.10 = PLN 1210. This is an assumed model, not an offer or a rule for every contract. Actual cost depends on terms and repayments. Debt difficulties can also involve lost income, unexpected costs and fees. A quiz establishes neither the cause of difficulties nor a person’s blame.",
    "retryMessage": "1000 × 1.10 × 1.10 = PLN 1210. This is an assumed model, not an offer or a rule for every contract. Actual cost depends on terms and repayments. Debt difficulties can also involve lost income, unexpected costs and fees. A quiz establishes neither the cause of difficulties nor a person’s blame.",
    "category": "Financial Literacy"
  },

  // ── Family Financial Plan ─────────────────────────────────────────────────
  {
    "id": "insurance-purpose",
    "question": "What is the protection purpose of life insurance covering death?",
    "answers": [
      {
        "id": "A",
        "text": "To get rich when someone dies"
      },
      {
        "id": "B",
        "text": "Financial support for beneficiaries after the insured person's death, subject to the contract"
      },
      {
        "id": "C",
        "text": "To save on taxes"
      },
      {
        "id": "D",
        "text": "To invest in the stock market safely"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "A benefit can support beneficiaries, including financial dependants. Cover depends on the contract and its terms (OWU), sum insured, exclusions and beneficiary designation. It does not automatically replace all income or pay in every situation. Insurance needs depend on obligations and circumstances; this quiz does not decide that everyone must buy a policy.",
    "retryMessage": "A benefit can support beneficiaries, including financial dependants. Cover depends on the contract and its terms (OWU), sum insured, exclusions and beneficiary designation. It does not automatically replace all income or pay in every situation. Insurance needs depend on obligations and circumstances; this quiz does not decide that everyone must buy a policy.",
    "category": "Family Financial Plan"
  },
  {
    id: "joint-finances",
    question: "What is the recommended approach to finances for couples?",
    answers: [
      { id: "A", text: "One partner handles all finances, the other doesn't need to know" },
      { id: "B", text: "Both partners should understand the full financial picture and plan together" },
      { id: "C", text: "Keep all finances 100% separate — never share anything" },
      { id: "D", text: "Whoever earns more controls all decisions" },
    ],
    correctAnswer: "B",
    reward: 20,
    successMessage: "Both partners understanding the full financial picture reduces conflict and improves outcomes. +20 points!",
    retryMessage: "Financial transparency and joint planning between partners leads to better decisions and fewer conflicts.",
    category: "Family Financial Plan",
  },
  {
    id: "teaching-kids-money",
    question: "What is the most effective way to teach kids about money?",
    answers: [
      { id: "A", text: "Give them pocket money with no conditions" },
      { id: "B", text: "Let them observe — never discuss money with children" },
      { id: "C", text: "Give pocket money with saving rules (e.g. save 20%, spend 60%, give 20%)" },
      { id: "D", text: "Wait until they're 18 to discuss finances" },
    ],
    correctAnswer: "C",
    reward: 20,
    successMessage: "Pocket money with rules teaches budgeting through real decisions. Mistakes with small amounts are cheap lessons. +20 points!",
    retryMessage: "Pocket money with saving/spending rules gives kids real financial decisions at low cost.",
    category: "Family Financial Plan",
  },

  // ── Macroeconomics (NBP / IMF / Federal Reserve) ─────────────────────────
  {
    "id": "nbp-inflation-target",
    "question": "What inflation rate has the National Bank of Poland (NBP) targeted since 2004?",
    "answers": [
      {
        "id": "A",
        "text": "0% — prices should never rise"
      },
      {
        "id": "B",
        "text": "2.5% with a ±1 percentage point band"
      },
      {
        "id": "C",
        "text": "5% to encourage spending"
      },
      {
        "id": "D",
        "text": "Whatever the government sets each year"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "Since 2004, NBP has targeted a 2.5% annual CPI change over the medium term, with a symmetric ±1 percentage point deviation band (edges: 1.5% and 3.5%). This is a target, not current inflation, a forecast or a guaranteed monthly outcome. CPI concerns a basket of prices, not the same change in every price. The band is not a loan or deposit interest rate.",
    "retryMessage": "Since 2004, NBP has targeted a 2.5% annual CPI change over the medium term, with a symmetric ±1 percentage point deviation band (edges: 1.5% and 3.5%). This is a target, not current inflation, a forecast or a guaranteed monthly outcome. CPI concerns a basket of prices, not the same change in every price. The band is not a loan or deposit interest rate.",
    "category": "Macroeconomics"
  },
  {
    "id": "inflation-target-why",
    "question": "Why might a central bank choose a small positive inflation target?",
    "answers": [
      {
        "id": "A",
        "text": "To make the currency worthless faster"
      },
      {
        "id": "B",
        "text": "It provides a margin against deflation risk and can aid price stability"
      },
      {
        "id": "C",
        "text": "Because higher prices are always good"
      },
      {
        "id": "D",
        "text": "To increase government tax revenue only"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "A small positive target provides a margin against deflation risk and can help monetary policy operate. It does not guarantee economic growth or predictability of every price. The target concerns the rate of change in the general price level; positive inflation means that level is still rising. Specific targets differ across central banks.",
    "retryMessage": "A small positive target provides a margin against deflation risk and can help monetary policy operate. It does not guarantee economic growth or predictability of every price. The target concerns the rate of change in the general price level; positive inflation means that level is still rising. Specific targets differ across central banks.",
    "category": "Macroeconomics"
  },
  {
    "id": "monetary-policy-tool",
    "question": "What is a central bank's main tool for steering inflation?",
    "answers": [
      {
        "id": "A",
        "text": "Printing more banknotes for citizens"
      },
      {
        "id": "B",
        "text": "Setting benchmark interest rates"
      },
      {
        "id": "C",
        "text": "Fixing the price of bread"
      },
      {
        "id": "D",
        "text": "Banning imports"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Policy interest rates are NBP’s main tool, but not its only one: open market operations and other instruments also play a role. They influence financing conditions, demand and inflation with lags and uncertain strength. NBP does not thereby set every price or the interest rate of every contract; banks’ offers can differ.",
    "retryMessage": "Policy interest rates are NBP’s main tool, but not its only one: open market operations and other instruments also play a role. They influence financing conditions, demand and inflation with lags and uncertain strength. NBP does not thereby set every price or the interest rate of every contract; banks’ offers can differ.",
    "category": "Macroeconomics"
  },
  {
    "id": "rates-and-borrowing",
    "question": "When a central bank raises interest rates, what typically happens?",
    "answers": [
      {
        "id": "A",
        "text": "Borrowing gets cheaper and spending jumps"
      },
      {
        "id": "B",
        "text": "Borrowing can become more expensive, weakening demand and inflation pressure"
      },
      {
        "id": "C",
        "text": "Nothing changes for households"
      },
      {
        "id": "D",
        "text": "Savings accounts always pay 0%"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Higher rates can raise the cost of new or variable-rate borrowing, weakening demand and inflation pressure; effects are delayed and uncertain. Repricing terms and timing depend on the contract; an agreed fixed-rate period need not reprice immediately. Slower positive inflation means prices rise more slowly, not that they fall. This is not a payment forecast or a borrowing decision.",
    "retryMessage": "Higher rates can raise the cost of new or variable-rate borrowing, weakening demand and inflation pressure; effects are delayed and uncertain. Repricing terms and timing depend on the contract; an agreed fixed-rate period need not reprice immediately. Slower positive inflation means prices rise more slowly, not that they fall. This is not a payment forecast or a borrowing decision.",
    "category": "Macroeconomics"
  },
  {
    "id": "gdp-definition",
    "question": "What does GDP (Gross Domestic Product) measure?",
    "answers": [
      {
        "id": "A",
        "text": "The total savings of all citizens"
      },
      {
        "id": "B",
        "text": "The value of final goods and services produced in an economy over a period"
      },
      {
        "id": "C",
        "text": "The amount of cash in circulation"
      },
      {
        "id": "D",
        "text": "The national debt"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "GDP describes the value of final production in an economy over a period. In GUS’s production approach, gross value added plus taxes on products less subsidies are counted; intermediate goods are not added again to final output. GDP is not total savings, personal income or a complete measure of wellbeing or income distribution.",
    "retryMessage": "GDP describes the value of final production in an economy over a period. In GUS’s production approach, gross value added plus taxes on products less subsidies are counted; intermediate goods are not added again to final output. GDP is not total savings, personal income or a complete measure of wellbeing or income distribution.",
    "category": "Macroeconomics"
  },
  {
    "id": "deflation-risk",
    "question": "Why can a persistent fall in the general price level (deflation) be harmful?",
    "answers": [
      {
        "id": "A",
        "text": "It makes everyone richer with no downside"
      },
      {
        "id": "B",
        "text": "It can delay some purchases, weaken demand and raise the real debt burden"
      },
      {
        "id": "C",
        "text": "It always boosts wages"
      },
      {
        "id": "D",
        "text": "It has no effect on the economy"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "A persistent fall in the general price level can delay some purchases, weaken demand and increase the real burden of unchanged nominal debt. These are possible mechanisms, not an inevitable spiral in every situation. A single discount or slower positive inflation does not mean deflation. This is not a reason to postpone urgent essential needs or required repayments.",
    "retryMessage": "A persistent fall in the general price level can delay some purchases, weaken demand and increase the real burden of unchanged nominal debt. These are possible mechanisms, not an inevitable spiral in every situation. A single discount or slower positive inflation does not mean deflation. This is not a reason to postpone urgent essential needs or required repayments.",
    "category": "Macroeconomics"
  },

  // ── Household Budgeting (CFPB / OECD) ─────────────────────────────────────
  {
    "id": "zero-based-budget",
    "question": "What does “zero” mean in zero-based budgeting?",
    "answers": [
      {
        "id": "A",
        "text": "You must spend everything and empty the account"
      },
      {
        "id": "B",
        "text": "Every available unit has a purpose in the plan, including reserves"
      },
      {
        "id": "C",
        "text": "Savings must equal zero"
      },
      {
        "id": "D",
        "text": "Only cash may be used"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "This is a planning method, not a requirement to spend everything or empty an account. Hypothetically: PLN 1000 = 800 for essential needs + 100 for required minimum repayments + 100 for a voluntary reserve; unallocated: PLN 0. Repayments are counted once. Update the plan when income varies; no surplus means no duty to save. The plan does not guarantee freedom from unexpected expenses.",
    "retryMessage": "This is a planning method, not a requirement to spend everything or empty an account. Hypothetically: PLN 1000 = 800 for essential needs + 100 for required minimum repayments + 100 for a voluntary reserve; unallocated: PLN 0. Repayments are counted once. Update the plan when income varies; no surplus means no duty to save. The plan does not guarantee freedom from unexpected expenses.",
    "category": "Budgeting"
  },
  {
    "id": "track-before-budget",
    "question": "What can help you understand spending before making or revising a budget?",
    "answers": [
      {
        "id": "A",
        "text": "First postpone urgent essential purchases for 30 days"
      },
      {
        "id": "B",
        "text": "Optionally review your own spending over a suitable period using a method you choose"
      },
      {
        "id": "C",
        "text": "Everyone must first collect exactly 30 days of data"
      },
      {
        "id": "D",
        "text": "Borrow money instead of checking spending"
      }
    ],
    "correctAnswer": "B",
    "reward": 20,
    "successMessage": "You can start with a day or week of your own notes and extend the period; 30 days is not a mandatory prerequisite. Include less frequent bills and variable income too. Do not postpone urgent essential needs or required minimum repayments while observing. Choose a manageable method and return when you can; you do not need to share data with the app.",
    "retryMessage": "You can start with a day or week of your own notes and extend the period; 30 days is not a mandatory prerequisite. Include less frequent bills and variable income too. Do not postpone urgent essential needs or required minimum repayments while observing. Choose a manageable method and return when you can; you do not need to share data with the app.",
    "category": "Budgeting"
  },
  {
    "id": "sinking-fund",
    "question": "You have PLN 0 saved for an optional PLN 600 purchase in 6 months. What are 6 equal monthly contributions before purchase, ignoring interest and fees?",
    "answers": [
      {
        "id": "A",
        "text": "PLN 600 each month"
      },
      {
        "id": "B",
        "text": "PLN 100 each month for this planned goal"
      },
      {
        "id": "C",
        "text": "PLN 0, because reserves guarantee every cost is covered"
      },
      {
        "id": "D",
        "text": "Borrowing always replaces such a plan"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "600 ÷ 6 = PLN 100 monthly in this hypothetical plan. A sinking fund is for a known future cost; emergency reserves cover unexpected events. Contributions are voluntary, after essential needs and required minimum repayments. With no surplus, change the goal or postpone this optional purchase; update the plan when income varies. There is no guarantee of avoiding debt.",
    "retryMessage": "600 ÷ 6 = PLN 100 monthly in this hypothetical plan. A sinking fund is for a known future cost; emergency reserves cover unexpected events. Contributions are voluntary, after essential needs and required minimum repayments. With no surplus, change the goal or postpone this optional purchase; update the plan when income varies. There is no guarantee of avoiding debt.",
    "category": "Budgeting"
  },
  {
    "id": "impulse-pause",
    "question": "What could you optionally do before a non-urgent, non-essential purchase?",
    "answers": [
      {
        "id": "A",
        "text": "Always buy immediately and check the cost later"
      },
      {
        "id": "B",
        "text": "Take a pause you choose and check the need, price and plan"
      },
      {
        "id": "C",
        "text": "Postpone urgent essential purchases too"
      },
      {
        "id": "D",
        "text": "Assume every pause guarantees savings"
      }
    ],
    "correctAnswer": "B",
    "reward": 20,
    "successMessage": "You can pause and return to the decision at a suitable time. This is an option, not a mandatory 24 hours or a guarantee of savings or a change in desire to buy. Do not postpone urgent essential needs or required minimum repayments. After a break, calmly check the price, available money and priorities; you can revise the decision without pressure.",
    "retryMessage": "You can pause and return to the decision at a suitable time. This is an option, not a mandatory 24 hours or a guarantee of savings or a change in desire to buy. Do not postpone urgent essential needs or required minimum repayments. After a break, calmly check the price, available money and priorities; you can revise the decision without pressure.",
    "category": "Budgeting"
  },

  // ── Saving & Deposit Safety (CFPB / BFG) ─────────────────────────────────
  {
    id: "emergency-first-milestone",
    question: "After covering essentials and all required minimum repayments, PLN 20 remains. Which small first step is an optional choice in this example?",
    answers: [
      { id: "A", text: "Save a full month of costs at once as a requirement" },
      { id: "B", text: "Choose e.g. PLN 5; pause if there is no surplus" },
      { id: "C", text: "Borrow PLN 100 to start a reserve" },
      { id: "D", text: "Transfer all income before paying bills" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "A small achievable goal is optional and uses available surplus. +25 local points.",
    retryMessage: "Example budget: PLN 1,200 income − PLN 1,080 essentials − PLN 100 required minimums = PLN 20 surplus, with no other costs or fees. An optional PLN 5 leaves PLN 15; no transfer is required. Adapt the goal to circumstances without requiring a full month at the start. Without surplus, pause; do not borrow to save.",
    category: "Emergency Fund",
  },
  {
    "id": "bfg-guarantee",
    "question": "What is BFG’s standard limit for an eligible depositor in one bank covered by the scheme?",
    "answers": [
      {
        "id": "A",
        "text": "There is no deposit guarantee"
      },
      {
        "id": "B",
        "text": "The PLN equivalent of EUR 100,000 per depositor, per bank"
      },
      {
        "id": "C",
        "text": "Exactly 10,000 PLN total"
      },
      {
        "id": "D",
        "text": "Unlimited, always 100%"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "Aggregate eligible deposits, including interest, for one eligible depositor in one covered bank. Reference amounts: EUR 60,000 + 50,000 = 110,000; without special higher cover, the standard limit covers 100,000. This is not a foreign-currency valuation or payout calculation. BFG pays in PLN; the PLN limit uses the NBP average rate on the guarantee-trigger date, not a fixed rate. Exclusions and special higher guarantees exist.",
    "retryMessage": "Aggregate eligible deposits, including interest, for one eligible depositor in one covered bank. Reference amounts: EUR 60,000 + 50,000 = 110,000; without special higher cover, the standard limit covers 100,000. This is not a foreign-currency valuation or payout calculation. BFG pays in PLN; the PLN limit uses the NBP average rate on the guarantee-trigger date, not a fixed rate. Exclusions and special higher guarantees exist.",
    "category": "Saving Habit"
  },

  // ── Long-Term Investing (SEC / Investor.gov / FINRA) ─────────────────────
  {
    "id": "asset-allocation",
    "question": "What does 'asset allocation' mean?",
    "answers": [
      {
        "id": "A",
        "text": "Picking one winning stock"
      },
      {
        "id": "B",
        "text": "How you split investments among stocks, bonds and cash"
      },
      {
        "id": "C",
        "text": "Borrowing money to invest"
      },
      {
        "id": "D",
        "text": "Keeping everything in a checking account"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Allocation divides investments among asset types, such as stocks, bonds and cash. The mix depends on the goal, timeframe and ability to bear a loss. It affects risk and potential results, but does not guarantee a profit or protection from losses; there is no single right mix for everyone.",
    "retryMessage": "Allocation divides investments among asset types, such as stocks, bonds and cash. The mix depends on the goal, timeframe and ability to bear a loss. It affects risk and potential results, but does not guarantee a profit or protection from losses; there is no single right mix for everyone.",
    "category": "Long-Term Investing"
  },
  {
    "id": "rebalancing",
    "question": "What is portfolio 'rebalancing'?",
    "answers": [
      {
        "id": "A",
        "text": "Selling everything when markets fall"
      },
      {
        "id": "B",
        "text": "Periodically adjusting holdings back to your target mix"
      },
      {
        "id": "C",
        "text": "Adding only the best-performing stock"
      },
      {
        "id": "D",
        "text": "Checking your balance every day"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "Rebalancing restores the target portfolio mix. Holdings or the direction of new contributions can be adjusted; it need not mean selling everything. Before acting, consider costs, possible taxes and whether the goal still fits. It does not guarantee constant risk, profit or freedom from loss; it is not an instruction to trade after every price change.",
    "retryMessage": "Rebalancing restores the target portfolio mix. Holdings or the direction of new contributions can be adjusted; it need not mean selling everything. Before acting, consider costs, possible taxes and whether the goal still fits. It does not guarantee constant risk, profit or freedom from loss; it is not an instruction to trade after every price change.",
    "category": "Long-Term Investing"
  },
  {
    "id": "fees-ter",
    "question": "Why consider ongoing fees when investing?",
    "answers": [
      {
        "id": "A",
        "text": "They don't — fees are negligible"
      },
      {
        "id": "B",
        "text": "They reduce the amount invested and can lower long-term results"
      },
      {
        "id": "C",
        "text": "Higher fees always mean higher returns"
      },
      {
        "id": "D",
        "text": "Fees are refunded at retirement"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "TER is a fund expense ratio; check its scope in the documents. A simplification, not the TER charging method: PLN 1000 before one year-end charge; gross return 0%, no contributions, withdrawals, other costs, tax or inflation. 1% of this base is PLN 10, leaving 990; 0.2% is PLN 2, leaving 998. TER does not cover all possible costs; check documents and transaction fees. A lower cost does not guarantee a profit.",
    "retryMessage": "TER is a fund expense ratio; check its scope in the documents. A simplification, not the TER charging method: PLN 1000 before one year-end charge; gross return 0%, no contributions, withdrawals, other costs, tax or inflation. 1% of this base is PLN 10, leaving 990; 0.2% is PLN 2, leaving 998. TER does not cover all possible costs; check documents and transaction fees. A lower cost does not guarantee a profit.",
    "category": "Long-Term Investing"
  },
  {
    "id": "risk-return",
    "question": "What is the general relationship between risk and expected return?",
    "answers": [
      {
        "id": "A",
        "text": "Higher expected returns generally come with higher risk"
      },
      {
        "id": "B",
        "text": "High returns are guaranteed with zero risk"
      },
      {
        "id": "C",
        "text": "Risk and return are unrelated"
      },
      {
        "id": "D",
        "text": "Lower risk always means higher return"
      }
    ],
    "correctAnswer": "A",
    "reward": 25,
    "successMessage": "Higher expected return generally comes with higher risk, but an expectation is not a realised result or a promise. Part or all of the capital may be lost. Risk is more than price swings: it also includes, for example, default and difficulty selling. Consider risk against the goal and capacity for loss; high profit without risk is not a credible promise.",
    "retryMessage": "Higher expected return generally comes with higher risk, but an expectation is not a realised result or a promise. Part or all of the capital may be lost. Risk is more than price swings: it also includes, for example, default and difficulty selling. Consider risk against the goal and capacity for loss; high profit without risk is not a credible promise.",
    "category": "Long-Term Investing"
  },
  {
    "id": "invest-prerequisites",
    "question": "What should you generally have in place BEFORE investing in volatile assets?",
    "answers": [
      {
        "id": "A",
        "text": "A hot stock tip"
      },
      {
        "id": "B",
        "text": "An emergency fund and high-interest debt under control"
      },
      {
        "id": "C",
        "text": "A maxed-out credit card"
      },
      {
        "id": "D",
        "text": "Nothing — invest everything immediately"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "Before deciding, protect essential needs and required minimum repayments; assess reserves and the cost of expensive debt. Money needed for these purposes should not face large fluctuations. Investing is voluntary; with no surplus or variable income, it can be postponed. These preparations do not guarantee a profit or prevent a sale at an unfavourable time.",
    "retryMessage": "Before deciding, protect essential needs and required minimum repayments; assess reserves and the cost of expensive debt. Money needed for these purposes should not face large fluctuations. Investing is voluntary; with no surplus or variable income, it can be postponed. These preparations do not guarantee a profit or prevent a sale at an unfavourable time.",
    "category": "Long-Term Investing"
  },
  {
    "id": "speculative-allocation",
    "question": "Which approach to highly speculative assets is cautious?",
    "answers": [
      {
        "id": "A",
        "text": "Put all savings in for maximum gains"
      },
      {
        "id": "B",
        "text": "Choosing none is valid; otherwise only an amount whose total loss would not affect essentials or reserves"
      },
      {
        "id": "C",
        "text": "Borrow money to buy more"
      },
      {
        "id": "D",
        "text": "Treat it as a safe emergency fund"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "The allocation can be zero; speculation is optional. If considered at all, keep essential spending, required minimum repayments and emergency reserves out of it, and do not borrow for it. The entire allocated amount can be lost. There is no universal safe percentage; a small allocation guarantees neither profit nor safety. This is not a recommendation to buy.",
    "retryMessage": "The allocation can be zero; speculation is optional. If considered at all, keep essential spending, required minimum repayments and emergency reserves out of it, and do not borrow for it. The entire allocated amount can be lost. There is no universal safe percentage; a small allocation guarantees neither profit nor safety. This is not a recommendation to buy.",
    "category": "Long-Term Investing"
  },

  // ── Retirement in Poland (IKE / IKZE / PPK) ──────────────────────────────
  {
    "id": "ike-vs-ikze",
    "question": "What's the key tax difference between Poland's IKE and IKZE accounts?",
    "answers": [
      {
        "id": "A",
        "text": "They are identical in every way"
      },
      {
        "id": "B",
        "text": "IKE: gains tax exemption on qualifying withdrawal; IKZE: possible contribution deduction and 10% tax on the whole qualifying withdrawal"
      },
      {
        "id": "C",
        "text": "Both are taxed at 19% every year"
      },
      {
        "id": "D",
        "text": "Neither offers any tax benefit"
      }
    ],
    "correctAnswer": "B",
    "reward": 35,
    "successMessage": "IKE contributions are not deductible; gains tax exemption needs statutory withdrawal conditions. IKZE payments may be deducted in the annual tax return, within the annual limit, from income or revenue; relief depends on the tax situation. For the saver, a qualifying IKZE withdrawal requires age 65 and contributions in at least 5 calendar years; 10% applies to the whole withdrawal, not just gains. An early IKZE return is taxed on the PIT scale. Neither account guarantees profit.",
    "retryMessage": "IKE contributions are not deductible; gains tax exemption needs statutory withdrawal conditions. IKZE payments may be deducted in the annual tax return, within the annual limit, from income or revenue; relief depends on the tax situation. For the saver, a qualifying IKZE withdrawal requires age 65 and contributions in at least 5 calendar years; 10% applies to the whole withdrawal, not just gains. An early IKZE return is taxed on the PIT scale. Neither account guarantees profit.",
    "category": "Retirement"
  },
  {
    "id": "ppk-employer-match",
    "question": "What are the employer's PPK contribution rates on the statutory remuneration base?",
    "answers": [
      {
        "id": "A",
        "text": "Nothing — only the employee pays"
      },
      {
        "id": "B",
        "text": "Basic 1.5% of the PPK base plus an optional additional contribution up to 2.5%"
      },
      {
        "id": "C",
        "text": "A flat 100 PLN regardless of salary"
      },
      {
        "id": "D",
        "text": "10% of salary"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "Employer rates are 1.5% basic plus up to 2.5% additional, on the statutory PPK base. One-period example, PLN 6,000 base: employee 2% = 120; employer 1.5% = 90; optional 2.5% = 150, maximum employer total = 240. Assume the full employee 2%; a reduction is possible under conditions. These are contributions, not net pay: employer payments are PIT income, with possible exemptions. Contributions do not guarantee profit.",
    "retryMessage": "Employer rates are 1.5% basic plus up to 2.5% additional, on the statutory PPK base. One-period example, PLN 6,000 base: employee 2% = 120; employer 1.5% = 90; optional 2.5% = 150, maximum employer total = 240. Assume the full employee 2%; a reduction is possible under conditions. These are contributions, not net pay: employer payments are PIT income, with possible exemptions. Contributions do not guarantee profit.",
    "category": "Retirement"
  },
  {
    "id": "ppk-state-bonus",
    "question": "What state payments does PPK provide after the eligibility conditions are met?",
    "answers": [
      {
        "id": "A",
        "text": "No state support at all"
      },
      {
        "id": "B",
        "text": "One-off PLN250 and annual PLN240 after meeting the conditions"
      },
      {
        "id": "C",
        "text": "A 50,000 PLN lump sum"
      },
      {
        "id": "D",
        "text": "Free shares in the employer"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "PLN250 is a one-off welcome payment: at least 3 full calendar months of participation and employee basic contributions for at least 3 months. The PLN240 annual payment requires the statutory contribution level; reduced employee payments have separate conditions. An account alone is insufficient; annual payments stop once withdrawals after age 60 begin. State payments are not a rate of return or a profit guarantee.",
    "retryMessage": "PLN250 is a one-off welcome payment: at least 3 full calendar months of participation and employee basic contributions for at least 3 months. The PLN240 annual payment requires the statutory contribution level; reduced employee payments have separate conditions. An account alone is insufficient; annual payments stop once withdrawals after age 60 begin. State payments are not a rate of return or a profit guarantee.",
    "category": "Retirement"
  },

  // ── Global Markets (FDIC / EU DGS / FSCS / NISA / 401k) ──────────────────
  {
    "id": "deposit-guarantee-scope",
    "question": "What does BFG deposit protection in Poland cover under statutory conditions?",
    "answers": [
      {
        "id": "A",
        "text": "All investments including stocks and crypto"
      },
      {
        "id": "B",
        "text": "Eligible deposits; not stocks, fund units or crypto"
      },
      {
        "id": "C",
        "text": "Only cash kept at home"
      },
      {
        "id": "D",
        "text": "Your salary if you lose your job"
      }
    ],
    "correctAnswer": "B",
    "reward": 30,
    "successMessage": "BFG protects eligible deposits of eligible depositors in covered institutions under statutory conditions. Stocks, fund units and crypto are not deposits and do not gain this cover merely because they were bought through a bank. Deposit protection does not remove inflation or investment market risk. Check the product, institution and applicable scheme; not every entity operating in Poland is covered by BFG.",
    "retryMessage": "BFG protects eligible deposits of eligible depositors in covered institutions under statutory conditions. Stocks, fund units and crypto are not deposits and do not gain this cover merely because they were bought through a bank. Deposit protection does not remove inflation or investment market risk. Check the product, institution and applicable scheme; not every entity operating in Poland is covered by BFG.",
    "category": "Global Markets"
  },
  {
    id: "fdic-coverage",
    question: "In the United States, how much does the FDIC insure per depositor, per bank?",
    answers: [
      { id: "A", text: "$1,000" },
      { id: "B", text: "$250,000 (per ownership category)" },
      { id: "C", text: "Unlimited" },
      { id: "D", text: "There is no deposit insurance in the US" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "The FDIC insures $250,000 per depositor, per bank, per ownership category. +25 tokens!",
    retryMessage: "US FDIC coverage is $250,000 per depositor, per insured bank, for each ownership category.",
    category: "Global Markets",
  },
  {
    "id": "eu-dgs",
    "question": "What is the standard EU deposit guarantee limit for eligible deposits?",
    "answers": [
      {
        "id": "A",
        "text": "€1,000 per country"
      },
      {
        "id": "B",
        "text": "€100,000 per depositor, per bank (or local-currency equivalent)"
      },
      {
        "id": "C",
        "text": "€1,000,000 always"
      },
      {
        "id": "D",
        "text": "Nothing is guaranteed in the EU"
      }
    ],
    "correctAnswer": "B",
    "reward": 25,
    "successMessage": "The EU standard is EUR 100,000 per eligible depositor at one credit institution for covered deposits. That person’s accounts are aggregated; several brands of one bank do not create separate limits. A branch of a bank from another EU country operating in Poland is generally covered by its home-country scheme, not automatically BFG. Conditions, exclusions and special higher guarantees exist; check the applicable scheme.",
    "retryMessage": "The EU standard is EUR 100,000 per eligible depositor at one credit institution for covered deposits. That person’s accounts are aggregated; several brands of one bank do not create separate limits. A branch of a bank from another EU country operating in Poland is generally covered by its home-country scheme, not automatically BFG. Conditions, exclusions and special higher guarantees exist; check the applicable scheme.",
    "category": "Global Markets"
  },
  {
    id: "us-401k-match",
    question: "In this US 401(k) example, the employee is eligible and the contribution is affordable after essentials and required debt payments. Which action can qualify for the full employer match under the plan rules?",
    answers: [
      { id: "A", text: "Skip it — matches are a trick" },
      { id: "B", text: "Contribute the amount needed for the full match under the plan rules" },
      { id: "C", text: "Only contribute after age 60" },
      { id: "D", text: "Put it all into a single company stock" },
    ],
    correctAnswer: "B",
    reward: 30,
    successMessage: "The matching formula, cap, eligibility and vesting schedule depend on the plan. For illustration, a 50% match on an eligible USD 100 contribution adds USD 50. Employer contributions may vest over time. Any unvested portion may be forfeited if you leave before it vests. This is not a guaranteed investment return or a universal first spending priority. This US example does not describe Polish PPK.",
    retryMessage: "The matching formula, cap, eligibility and vesting schedule depend on the plan. For illustration, a 50% match on an eligible USD 100 contribution adds USD 50. Employer contributions may vest over time. Any unvested portion may be forfeited if you leave before it vests. This is not a guaranteed investment return or a universal first spending priority. This US example does not describe Polish PPK.",
    category: "Global Markets",
  },
  {
    id: "tax-advantaged-wrapper",
    question: "What do a UK ISA, a Japanese NISA and a Polish IKE have in common?",
    answers: [
      { id: "A", text: "They guarantee a fixed 10% return" },
      { id: "B", text: "Tax advantages under each country’s rules, without guaranteed investment returns" },
      { id: "C", text: "They are types of credit card" },
      { id: "D", text: "They are only for millionaires" },
    ],
    correctAnswer: "B",
    reward: 30,
    successMessage: "ISA (UK), NISA (Japan) and IKE (Poland) offer tax advantages under different national rules and limits. Tax treatment does not guarantee investment gains or protection from losses. For Polish IKE, exemption depends on statutory withdrawal conditions; an earlier return can make investment income taxable. Eligibility, permitted assets and withdrawal rules differ. This comparison does not imply that every account is available to a Polish resident.",
    retryMessage: "ISA (UK), NISA (Japan) and IKE (Poland) offer tax advantages under different national rules and limits. Tax treatment does not guarantee investment gains or protection from losses. For Polish IKE, exemption depends on statutory withdrawal conditions; an earlier return can make investment income taxable. Eligibility, permitted assets and withdrawal rules differ. This comparison does not imply that every account is available to a Polish resident.",
    category: "Global Markets",
  },
  {
    id: "rbi-inflation-target",
    question: "What inflation target does India's central bank (RBI) aim for?",
    answers: [
      { id: "A", text: "4% with a ±2 percentage point tolerance band" },
      { id: "B", text: "0%" },
      { id: "C", text: "15%" },
      { id: "D", text: "It has no target" },
    ],
    correctAnswer: "A",
    reward: 25,
    successMessage: "The RBI targets 4% inflation with a ±2pp band (2–6%), retained through 2026–2031. +25 tokens!",
    retryMessage: "India's RBI targets 4% inflation with a tolerance band of ±2 percentage points (2–6%).",
    category: "Global Markets",
  },
];
