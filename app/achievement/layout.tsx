import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Financial Achievement — Coach FI",
  description: "I earned a financial achievement on Coach FI! Check your own financial health score.",
  openGraph: {
    title: "🏆 Financial Achievement — Coach FI",
    description: "I just levelled up my financial knowledge! See my score and challenge yourself.",
    type: "website",
    siteName: "Coach FI",
  },
  twitter: {
    card: "summary_large_image",
    title: "🏆 Financial Achievement — Coach FI",
    description: "I earned a financial achievement! Check your own score on Coach FI.",
  },
};

export default function AchievementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
