"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { Locale } from "@/lib/i18n";
import type { InflationScenario } from "@/lib/inflation";
import { formatCurrency } from "@/lib/utils";

const chartCopy: Record<
  Locale,
  { aria: string; cash: string; habit: string; investing: string }
> = {
  pl: {
    aria: "Wykres liniowy porównujący samą gotówkę, nawyk oszczędzania i scenariusz długoterminowego inwestowania.",
    cash: "Sama gotówka",
    habit: "Nawyk oszczędzania",
    investing: "Scenariusz długoterminowy",
  },
  en: {
    aria: "Line chart comparing cash only, saving habit and long-term investing scenario.",
    cash: "Cash only",
    habit: "Saving habit",
    investing: "Long-term investing scenario",
  },
  ja: {
    aria: "現金のみ、貯蓄習慣、長期投資シナリオを比較する折れ線グラフ。",
    cash: "現金のみ",
    habit: "貯蓄習慣",
    investing: "長期シナリオ",
  },
};

export function InflationChart({
  data,
  currency = "PLN",
  locale = "pl"
}: {
  data: InflationScenario[];
  currency?: string;
  locale?: Locale;
}) {
  const copy = chartCopy[locale];

  return (
    <div
      className="h-80 w-full"
      role="img"
      aria-label={copy.aria}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="year" tick={{ fill: "#6B7280", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value), currency, locale)} />
          <Line type="monotone" dataKey="Cash only" name={copy.cash} stroke="#FFB703" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Saving habit" name={copy.habit} stroke="#69D2E7" strokeWidth={3} dot={false} />
          <Line
            type="monotone"
            dataKey="Long-term investing scenario"
            name={copy.investing}
            stroke="#7C6FF6"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
