"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTokenBalance } from "@/lib/tokens";

export default function RewardsPage() {
  const { locale } = useLanguage();
  const pl = locale === "pl";
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const refresh = () => setBalance(getTokenBalance());
    refresh();
    window.addEventListener("coachfi-tokens", refresh);
    window.addEventListener("coachfi-cloud-synced", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("coachfi-tokens", refresh);
      window.removeEventListener("coachfi-cloud-synced", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section aria-labelledby="rewards-title" className="rounded-lg border border-primary/15 bg-white p-6 shadow-soft">
      <h1 id="rewards-title" className="text-2xl font-black text-text">{pl ? "Punkty za naukę" : "Learning points"}</h1>
      <p className="mt-3 text-muted">{pl ? "Punkty Coach FI pomagają śledzić działania edukacyjne. Nie mają wartości pieniężnej i nie można ich wypłacić ani wymienić." : "Coach FI points help track learning activities. They have no monetary value and cannot be withdrawn or exchanged."}</p>
      <div className="mt-5 flex items-center gap-3 rounded-lg bg-primary/5 p-5">
        <Coins className="h-8 w-8 text-primary" aria-hidden="true" />
        <p className="text-3xl font-black text-text" aria-live="polite">{balance} {pl ? "punktów" : "points"}</p>
      </div>
      <Link href="/learn" className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{pl ? "Kontynuuj naukę" : "Continue learning"}</Link>
    </section>
  );
}
