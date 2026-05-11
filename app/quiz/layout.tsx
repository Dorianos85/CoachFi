import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Quiz — Coach FI",
  description: "Test your financial knowledge, earn tokens and challenge friends. One question away from becoming a money master.",
  openGraph: {
    title: "🧠 Can you beat me on this financial quiz?",
    description: "I scored on Coach FI's quiz! Take the challenge — answer 4 questions correctly and earn tokens.",
    type: "website",
    siteName: "Coach FI",
  },
  twitter: {
    card: "summary_large_image",
    title: "🧠 Can you beat me on this financial quiz?",
    description: "Take Coach FI's financial quiz. Test your knowledge and challenge friends!",
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
