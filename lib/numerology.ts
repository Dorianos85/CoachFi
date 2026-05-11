export const numerologyStyles: Record<number, string> = {
  1: "Independent builder: you like ownership. Your money habit is a clear personal rule.",
  2: "Calm collaborator: you learn best with support, reminders and shared goals.",
  3: "Creative learner: make progress visual, playful and easy to celebrate.",
  4: "Structured planner: systems, checklists and budgets are your superpower.",
  5: "Freedom seeker: you need discipline so freedom does not become chaos.",
  6: "Family protector: connect money habits to care, safety and people you love.",
  7: "Deep thinker: learn the why before you act, but avoid analysis paralysis.",
  8: "Goal strategist: track numbers, incentives and long-term compounding.",
  9: "Purpose-driven learner: money habits stick when they serve a bigger mission."
};

export function calculateLifePathNumber(date: string): number | null {
  const digits = date.replace(/\D/g, "").split("").map(Number);
  if (!digits.length) return null;

  let total = digits.reduce((sum, digit) => sum + digit, 0);
  if (total === 0) return null;

  while (total > 9) {
    total = String(total)
      .split("")
      .map(Number)
      .reduce((sum, digit) => sum + digit, 0);
  }

  // Enforce 1–9 range (0 cannot happen after the guard above)
  return total >= 1 && total <= 9 ? total : 9;
}
