import { BadgeCheck, BookOpen, Coins } from "lucide-react";

export const certificates = [
  {
    id: "money-mindset" as const,
    title: "Money Mindset certificate",
    description: "Proof that you completed the first mindset lesson.",
    icon: BadgeCheck
  },
  {
    id: "saving-habit" as const,
    title: "Saving Habit certificate",
    description: "Unlocks after the saving habit quiz and 3-day streak.",
    icon: Coins
  },
  {
    id: "inflation-fighter" as const,
    title: "Inflation Fighter certificate",
    description: "Earned after completing the inflation calculator and quiz.",
    icon: BookOpen
  }
];
