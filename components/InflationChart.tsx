"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useMemo } from "react";

import { pickLocalized, type LocalizedMap, type Locale } from "@/lib/i18n";
import type { InflationScenario } from "@/lib/inflation";
import { formatInflationMoney, getInflationCopy } from "@/lib/inflation-copy";

const chartCopy: LocalizedMap<
  { aria: string; cash: string; habit: string; investing: string }
> = {
  pl: getInflationCopy("pl").chartLabels,
  en: getInflationCopy("en").chartLabels,
  ja: {
    aria: "現金のみ、貯蓄習慣、長期投資シナリオを比較する折れ線グラフ。",
    cash: "現金のみ",
    habit: "貯蓄習慣",
    investing: "長期シナリオ",
  },
  es: {
    aria: "Gráfico de líneas que compara solo efectivo, hábito de ahorro y escenario de inversión a largo plazo.",
    cash: "Solo efectivo",
    habit: "Hábito de ahorro",
    investing: "Escenario de inversión a largo plazo",
  },
  fr: {
    aria: "Graphique en courbes comparant les espèces seules, l'habitude d'épargne et le scénario d'investissement à long terme.",
    cash: "Espèces seules",
    habit: "Habitude d'épargne",
    investing: "Scénario d'investissement à long terme",
  },
  zh: {
    aria: "折线图：比较仅持有现金、储蓄习惯和长期投资情景。",
    cash: "仅现金",
    habit: "储蓄习惯",
    investing: "长期投资情景",
  },
  hi: {
    aria: "सिर्फ़ नकदी, बचत की आदत और लंबी अवधि के निवेश की स्थिति की तुलना करने वाला लाइन चार्ट।",
    cash: "सिर्फ़ नकदी",
    habit: "बचत की आदत",
    investing: "लंबी अवधि के निवेश की स्थिति",
  },
  "pt-BR": {
    aria: "Gráfico de linhas comparando apenas dinheiro parado, hábito de poupar e cenário de investimento de longo prazo.",
    cash: "Só dinheiro parado",
    habit: "Hábito de poupar",
    investing: "Cenário de investimento de longo prazo",
  },
  tr: {
    aria: "Yalnızca nakit, birikim alışkanlığı ve uzun vadeli yatırım senaryosunu karşılaştıran çizgi grafik.",
    cash: "Yalnızca nakit",
    habit: "Birikim alışkanlığı",
    investing: "Uzun vadeli yatırım senaryosu",
  },
};

export function InflationChart({
  data,
  currency = "PLN",
  locale = "pl"
}: {
  data: readonly InflationScenario[];
  currency?: string;
  locale?: Locale;
}) {
  const copy = pickLocalized(chartCopy, locale);
  const chartData = useMemo(() => data.map((row) => ({ ...row })), [data]);

  return (
    <div
      className="h-96 w-full min-w-0"
      role="img"
      aria-label={copy.aria}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-border-subtle)" />
          <XAxis dataKey="year" tick={{ fill: "var(--cf-text-muted)", fontSize: 12 }} tickFormatter={(year) => locale === "pl" ? "Rok " + String(year).slice(1) : locale === "en" ? "Year " + String(year).slice(1) : String(year)} />
          <YAxis
            tick={{ fill: "var(--cf-text-muted)", fontSize: 12 }}
            tickFormatter={(value) => new Intl.NumberFormat(locale, { notation: "compact", maximumSignificantDigits: 3 }).format(Number(value))}
          />
          <Tooltip formatter={(value) => formatInflationMoney(Number(value), currency, locale)} />
          <Legend />
          <Line type="monotone" dataKey="Cash only" name={copy.cash} stroke="var(--cf-chart-3)" strokeWidth={3} dot={data.length === 1} />
          <Line type="monotone" dataKey="Saving habit" name={copy.habit} stroke="var(--cf-chart-highlight)" strokeWidth={3} dot={data.length === 1} />
          <Line
            type="monotone"
            dataKey="Long-term investing scenario"
            name={copy.investing}
            stroke="var(--cf-chart-1)"
            strokeWidth={3}
            dot={data.length === 1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
