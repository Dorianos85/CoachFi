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

import { pickLocalized, type LocalizedMap, type Locale } from "@/lib/i18n";
import type { InflationScenario } from "@/lib/inflation";
import { formatCurrency } from "@/lib/utils";

const chartCopy: LocalizedMap<
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
  data: InflationScenario[];
  currency?: string;
  locale?: Locale;
}) {
  const copy = pickLocalized(chartCopy, locale);

  return (
    <div
      className="h-80 w-full"
      role="img"
      aria-label={copy.aria}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-border-subtle)" />
          <XAxis dataKey="year" tick={{ fill: "var(--cf-text-muted)", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "var(--cf-text-muted)", fontSize: 12 }}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value), currency, locale)} />
          <Line type="monotone" dataKey="Cash only" name={copy.cash} stroke="var(--cf-chart-3)" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Saving habit" name={copy.habit} stroke="var(--cf-chart-highlight)" strokeWidth={3} dot={false} />
          <Line
            type="monotone"
            dataKey="Long-term investing scenario"
            name={copy.investing}
            stroke="var(--cf-chart-1)"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
