"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import type { FinancialScoreCalculation } from "@/lib/financial-score";

export function FinancialScoreCard({ result, diagnosis }: { result: FinancialScoreCalculation; diagnosis: string }) {
  const { locale } = useLanguage();
  const pl = locale === "pl";
  const format = new Intl.NumberFormat(pl ? "pl-PL" : "en-GB", { maximumFractionDigits: 2 });
  const ringStyle = { background: `conic-gradient(var(--cf-grape) ${(result.score / result.scoreMax) * 100}%, var(--cf-area-learn) 0)` };
  const title = pl ? "Lokalny indeks edukacyjny" : "Local educational index";
  const groupLabels = { cashFlowAndRisk: pl ? "Przepływy, poduszka i ryzyko" : "Cash flow, buffer and risk",
    planningDeclarations: pl ? "Deklaracje planowania" : "Planning declarations",
    knowledgeDeclaration: pl ? "Deklarowana wiedza o inflacji" : "Declared inflation knowledge" };
  const componentLabels: Record<keyof FinancialScoreCalculation["components"], string> = {
    savingsRate: pl ? "Dochód minus wydatki" : "Income minus expenses", emergencyCoverage: pl ? "Pokrycie wydatków oszczędnościami" : "Expenses covered by savings",
    debtPressure: pl ? "Dług względem dochodu" : "Debt relative to income", cashAwareness: pl ? "Gotówka i deklaracja inwestowania" : "Cash and investment declaration",
    investingDeclaration: pl ? "Deklaracja inwestowania" : "Investment declaration", goalDeclaration: pl ? "Długość opisu celu (stara reguła)" : "Goal text length (legacy rule)",
    emergencyDeclaration: pl ? "Deklaracja funduszu awaryjnego" : "Emergency fund declaration", inflationKnowledgeDeclaration: pl ? "Samoocena rozumienia inflacji" : "Self-reported inflation understanding",
    retirementDeclaration: pl ? "Deklaracja planu emerytalnego" : "Retirement plan declaration" };

  return <Card className="border-primary/10 bg-white/90" data-testid="financial-score-card">
    <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{pl ? "Dotychczasowe wagi, jawna skala 98 punktów." : "Existing weights, explicit scale of 98 points."}</CardDescription></CardHeader>
    <CardContent>
      <div className="grid place-items-center rounded-lg bg-primary/5 p-6 text-center">
        <div role="img" aria-label={`${title}: ${result.score}/${result.scoreMax}`} className="grid h-44 w-44 place-items-center rounded-full p-3" style={ringStyle}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white"><div>
            <div className="text-6xl font-black leading-none text-primary" data-testid="financial-score-value">{result.score}</div>
            <div className="text-lg font-black text-text">/{result.scoreMax}</div>
          </div></div>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-text">{diagnosis}</p>
      <dl className="mt-4 space-y-3" data-testid="financial-score-groups">
        {(Object.keys(result.groups) as Array<keyof typeof result.groups>).map((key) => <div key={key} className="rounded-lg bg-primary/5 p-3">
          <dt className="text-sm font-bold text-text">{groupLabels[key]}</dt>
          <dd className="mt-1 text-sm text-muted">{format.format(result.groups[key].points)}/{result.groups[key].maxPoints}</dd>
        </div>)}
      </dl>
      <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-primary">{pl ? "Zobacz składniki i zasady" : "View components and rules"}</summary>
        <dl className="mt-3 space-y-2">{(Object.keys(result.components) as Array<keyof typeof result.components>).map((key) => <div key={key} className="flex justify-between gap-3">
          <dt>{componentLabels[key]}</dt><dd>{format.format(result.components[key])}</dd>
        </div>)}</dl>
        <p className="mt-3 text-xs leading-5 text-muted">{pl ? "Przy dochodzie 0: udział wolnych środków=0, presja długu=1. Przy wydatkach 0: pokrycie=0. To zastępcze reguły starego wzoru, nie ocena bezpieczeństwa. Końcowa suma jest zaokrąglona; maksimum wynosi 98." : "With income 0: available-income ratio=0, debt pressure=1. With expenses 0: coverage=0. These are fallback rules of the legacy formula, not a safety assessment. The final sum is rounded; its maximum is 98."}</p>
      </details>
      <p className="mt-4 text-xs leading-5 text-muted">{pl ? "Wskaźnik nie jest naukowo zwalidowany. Deklaracja wiedzy nie zastępuje sprawdzenia umiejętności, a długość celu nie określa jego jakości. To nie miara wartości człowieka ani zalecenie inwestowania." : "This index is not scientifically validated. Declared knowledge does not replace a skill check, and goal length does not measure goal quality. It is not a measure of personal worth or a recommendation to invest."}</p>
      <p className="mt-2 break-all text-[11px] text-muted">{result.formulaVersion}</p>
    </CardContent>
  </Card>;
}
