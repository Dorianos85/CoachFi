"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FinancialScoreCard } from "@/components/FinancialScoreCard";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { getHealthCheck, saveHealthCheck, type HealthCheckResult } from "@/lib/healthCheck";
import { useProductStorage } from "@/lib/use-product-storage";
import { validateFinancialScoreInput, type FinancialInputError, type FinancialInputErrors, type FinancialScoreInput } from "@/lib/financial-score";

type NumberKey = "monthlyIncome" | "monthlyExpenses" | "savings" | "debt" | "cashHeld";
type BooleanKey = "hasEmergencyFund" | "understandsInflation" | "hasRetirementPlan" | "investsAlready";
type Draft = Record<NumberKey | BooleanKey | "mainFinancialGoal", string>;
const NUMBER_KEYS: NumberKey[] = ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"];
const BOOLEAN_KEYS: BooleanKey[] = ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"];
const EMPTY: Draft = { monthlyIncome: "", monthlyExpenses: "", savings: "", debt: "", cashHeld: "",
  hasEmergencyFund: "", understandsInflation: "", hasRetirementPlan: "", investsAlready: "", mainFinancialGoal: "" };
const inputClass = "min-h-12 rounded-input border-2 border-border bg-white px-3 text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const COPY = {
  pl: {
    eyebrow: "Lokalna diagnoza edukacyjna", title: "Sprawdź swoją sytuację finansową",
    description: "Wpisz własne kwoty w PLN i wybierz odpowiedzi. Formularz nie zakłada odpowiedzi z demo i nie tworzy konta.",
    local: "Wynik zapisuje się w tej przeglądarce. Nie wymaga adresu email, logowania ani okresu próbnego. Ta diagnoza nie wysyła nowych odpowiedzi do dostawcy.",
    fields: { monthlyIncome: "Miesięczny dochód", monthlyExpenses: "Miesięczne wydatki", savings: "Obecne oszczędności", debt: "Łączny dług", cashHeld: "Gotówka i środki na rachunku",
      hasEmergencyFund: "Czy masz fundusz awaryjny?", understandsInflation: "Czy rozumiesz wpływ inflacji na swoją sytuację?", hasRetirementPlan: "Czy masz plan emerytalny?", investsAlready: "Czy już inwestujesz?", mainFinancialGoal: "Twój cel finansowy (opcjonalnie)" },
    choose: "Wybierz odpowiedź", yes: "Tak", no: "Nie", submit: "Oblicz lokalny wynik",
    terms: "Przed zapisaniem wyniku zaakceptuj zasady w ustawieniach zgód. Zgody opcjonalne mogą zostać wyłączone.", settings: "Sprawdź zasady",
    errors: "Uzupełnij lub popraw oznaczone pola. Puste pole nie jest traktowane jako zero.",
    saveError: "Nie udało się zapisać diagnozy w tej przeglądarce. Wynik nie został potwierdzony jako zapisany; odpowiedzi pozostają w formularzu.",
    saved: "Wynik lokalny zapisany", waiting: "Wypełnij formularz, aby zobaczyć wynik",
    empty: "Pokażemy wynik oparty na kompletnych odpowiedziach. Nie zastępujemy ich przykładowym wynikiem 42.",
    dirty: "Odpowiedzi zostały zmienione. Oblicz ponownie, aby zastąpić zapisany wynik.",
    legacy: "Stary zapis nie zawiera waluty. Przeliczono wyłącznie indeks zależny od proporcji, bez konwersji kwot i zmiany storage/dat. Kwoty formularza pozostają puste; podaj je ponownie w PLN przed nowym zapisem.",
    explanation: "To podsumowanie wpisanych danych według dotychczasowych wag Coach FI. Szczegóły pokazują różne obszary osobno.",
    zero: "Zero jest poprawną, świadomie podaną kwotą. Przy zerowym dochodzie lub wydatkach część proporcji jest niewyznaczalna; dotychczasowy wzór stosuje wtedy jawne wartości zastępcze opisane poniżej.",
    next: "Następny krok", nextBody: "Sprawdź kwoty względem swojego zestawienia i wybierz jedną krótką lekcję. Wynik nie ocenia Twojej wartości ani nie nakazuje inwestowania.", learn: "Przejdź do lekcji",
    ratios: "Sytuacja w liczbach", free: "Dochód minus wydatki, co najmniej zero", cushion: "Oszczędności w miesiącach wydatków", unavailable: "Niewyznaczalne", knowledge: "Odpowiedź o inflacji jest deklaracją; wiedzę możesz sprawdzić w quizie.",
    schema: "Wzór zachowuje stare wagi i maksimum 98. Nie przeskalowujemy wyniku do 100 i nie przedstawiamy go jako naukowo zwalidowanego pomiaru.", unknownCurrency: "Waluta poprzednich kwot nie została zapisana.",
  },
  en: {
    eyebrow: "Local educational diagnosis", title: "Review your financial situation",
    description: "Enter your own amounts in PLN and select your answers. The form does not assume demo answers or create an account.",
    local: "The result is saved in this browser. No email, login or trial is required. This diagnosis does not send new answers to a provider.",
    fields: { monthlyIncome: "Monthly income", monthlyExpenses: "Monthly expenses", savings: "Current savings", debt: "Total debt", cashHeld: "Cash and account balance",
      hasEmergencyFund: "Do you have an emergency fund?", understandsInflation: "Do you understand how inflation affects your situation?", hasRetirementPlan: "Do you have a retirement plan?", investsAlready: "Do you already invest?", mainFinancialGoal: "Your financial goal (optional)" },
    choose: "Select an answer", yes: "Yes", no: "No", submit: "Calculate local score",
    terms: "Accept the terms in consent settings before saving a result. Optional permissions may remain off.", settings: "Review terms",
    errors: "Complete or correct the marked fields. An empty field is not treated as zero.",
    saveError: "The diagnosis could not be saved in this browser. The result has not been confirmed as saved; your answers remain in the form.",
    saved: "Local result saved", waiting: "Complete the form to see your result",
    empty: "We show a result based on complete answers. We do not substitute the example score of 42.",
    dirty: "Your answers have changed. Calculate again to replace the saved result.",
    legacy: "The old entry did not record its currency. Only the ratio-based index was recalculated, without converting amounts or changing storage/dates. Amount fields remain empty; enter them again in PLN before a new save.",
    explanation: "This summarizes your entries using Coach FI's existing weights. The details show the different areas separately.",
    zero: "Zero is a valid, deliberate amount. With zero income or expenses, some ratios cannot be calculated; the existing formula then uses the explicit fallback values explained below.",
    next: "Next step", nextBody: "Check the amounts against your own records and choose one short lesson. This result does not measure your worth or tell you to invest.", learn: "Go to lessons",
    ratios: "Your entries in numbers", free: "Income minus expenses, at least zero", cushion: "Savings in months of expenses", unavailable: "Cannot be calculated", knowledge: "The inflation answer is a declaration; you can check your understanding in a quiz.",
    schema: "The formula keeps its original weights and maximum of 98. We do not rescale it to 100 or present it as a scientifically validated measure.", unknownCurrency: "The currency of the previous amounts was not recorded.",
  },
};

function toDraft(answers: FinancialScoreInput, currency: HealthCheckResult["currency"]): Draft {
  const amount = (value: number) => currency === "PLN" ? String(value) : "";
  return { monthlyIncome: amount(answers.monthlyIncome), monthlyExpenses: amount(answers.monthlyExpenses),
    savings: amount(answers.savings), debt: amount(answers.debt), cashHeld: amount(answers.cashHeld),
    hasEmergencyFund: answers.hasEmergencyFund ? "yes" : "no", understandsInflation: answers.understandsInflation ? "yes" : "no",
    hasRetirementPlan: answers.hasRetirementPlan ? "yes" : "no", investsAlready: answers.investsAlready ? "yes" : "no",
    mainFinancialGoal: answers.mainFinancialGoal };
}
function draftInput(draft: Draft): Record<string, unknown> {
  const numbers = Object.fromEntries(NUMBER_KEYS.map((key) => [key, draft[key].trim() === "" ? undefined : Number(draft[key])]));
  const booleans = Object.fromEntries(BOOLEAN_KEYS.map((key) => [key, draft[key] === "yes" ? true : draft[key] === "no" ? false : undefined]));
  return { ...numbers, ...booleans, mainFinancialGoal: draft.mainFinancialGoal };
}
function errorMessage(code: FinancialInputError | undefined, pl: boolean) {
  if (!code) return null;
  if (code === "required") return pl ? "Podaj kwotę lub wybierz odpowiedź." : "Enter an amount or select an answer.";
  if (code === "nonnegative") return pl ? "Podaj zero lub liczbę dodatnią." : "Enter zero or a positive number.";
  if (code === "amount_limit") return pl ? "Kwota nie może przekraczać 1 biliona PLN." : "The amount cannot exceed 1 trillion PLN.";
  if (code === "text_limit") return pl ? "Cel może mieć najwyżej 1000 znaków." : "Your goal may contain at most 1000 characters.";
  return pl ? "Podaj prawidłową wartość." : "Enter a valid value.";
}

export default function HealthCheckPage() {
  const { storage } = useProductStorage();
  const { locale } = useLanguage();
  const pl = locale === "pl";
  const copy = pl ? COPY.pl : COPY.en;
  const { loaded, requiredAccepted, openSettings } = useConsent();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<FinancialInputErrors>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const format = new Intl.NumberFormat(pl ? "pl-PL" : "en-GB", { maximumFractionDigits: 2 });

  useEffect(() => {
    const saved = loaded && storage.isCurrent() ? getHealthCheck(storage) : null;
    setResult(saved); setDraft(saved ? toDraft(saved.answers, saved.currency) : EMPTY);
    setDirty(false); setErrors({}); setSaveFailed(false);
  }, [loaded, storage]);

  useEffect(() => {
    // Withdrawal clears sensitive state. Granting required terms in this
    // same scope must preserve the draft the person already entered.
    if (requiredAccepted) return;
    setResult(null); setDraft(EMPTY); setDirty(false); setErrors({}); setSaveFailed(false);
  }, [requiredAccepted]);

  function edit(key: keyof Draft, value: string) {
    if (!storage.isCurrent()) return;
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSaveFailed(false);
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!storage.isCurrent()) return;
    setSaveFailed(false);
    if (!requiredAccepted) { openSettings(); return; }
    const validation = validateFinancialScoreInput(draftInput(draft));
    if (!validation.ok) {
      setErrors(validation.errors);
      window.requestAnimationFrame(() => { if (storage.isCurrent()) formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(); });
      return;
    }
    try {
      const saved = saveHealthCheck(validation.input, storage);
      if (!storage.isCurrent()) return;
      setResult(saved); setDirty(false); setErrors({});
    } catch { if (storage.isCurrent()) setSaveFailed(true); }
  }
  const showResult = storage.isCurrent() && requiredAccepted && result !== null && !dirty;

  return (
    <section aria-label={copy.title}>
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description}
        readText={`${copy.title}. ${copy.description}. ${copy.local}`} />
      <p className="mb-5 rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted">{copy.local}</p>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <form ref={formRef} noValidate onSubmit={submit} className="focus-card rounded-lg p-5 md:p-6" aria-label={copy.title}>
          <div className="grid gap-4 md:grid-cols-2">
            {NUMBER_KEYS.map((key) => (
              <label key={key} className="grid gap-1.5 text-sm font-bold text-text">
                <span>{copy.fields[key]} (PLN)</span>
                <input type="number" name={key} min="0" max="1000000000000" step="any" inputMode="decimal"
                  value={draft[key]} onChange={(event) => edit(key, event.target.value)} className={inputClass}
                  aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} />
                {errors[key] ? <span id={`error-${key}`} className="text-xs text-attention">{errorMessage(errors[key], pl)}</span> : null}
              </label>
            ))}
            {BOOLEAN_KEYS.map((key) => (
              <label key={key} className="grid gap-1.5 text-sm font-bold text-text">
                <span>{copy.fields[key]}</span>
                <select name={key} value={draft[key]} onChange={(event) => edit(key, event.target.value)} className={inputClass}
                  aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined}>
                  <option value="">{copy.choose}</option><option value="no">{copy.no}</option><option value="yes">{copy.yes}</option>
                </select>
                {errors[key] ? <span id={`error-${key}`} className="text-xs text-attention">{errorMessage(errors[key], pl)}</span> : null}
              </label>
            ))}
            <label className="grid gap-1.5 text-sm font-bold text-text md:col-span-2">
              <span>{copy.fields.mainFinancialGoal}</span>
              <input name="mainFinancialGoal" value={draft.mainFinancialGoal} maxLength={1000}
                onChange={(event) => edit("mainFinancialGoal", event.target.value)} className={inputClass}
                aria-invalid={!!errors.mainFinancialGoal} aria-describedby={errors.mainFinancialGoal ? "error-goal" : undefined} />
              {errors.mainFinancialGoal ? <span id="error-goal" className="text-xs text-attention">{errorMessage(errors.mainFinancialGoal, pl)}</span> : null}
            </label>
          </div>
          {!requiredAccepted ? <div className="mt-5 rounded-lg bg-primary/5 p-4 text-sm leading-6">
            <p>{copy.terms}</p><Button type="button" variant="outline" onClick={openSettings} className="mt-3">{copy.settings}</Button>
          </div> : null}
          {Object.keys(errors).some((key) => errors[key as keyof FinancialInputErrors]) ? <p role="alert" className="mt-4 text-sm font-bold text-attention">{copy.errors}</p> : null}
          {saveFailed ? <p role="alert" className="mt-4 text-sm font-bold text-attention" data-testid="health-save-error">{copy.saveError}</p> : null}
          <Button type="submit" size="lg" disabled={!loaded || !requiredAccepted} className="mt-6 w-full">{copy.submit}</Button>
          <p className="mt-3 text-xs leading-5 text-muted">{copy.zero}</p>
        </form>
        <div className="grid content-start gap-3">
          {showResult ? <>
            <p role="status" className="text-sm font-bold text-text" data-testid="health-saved-status"><CheckCircle2 aria-hidden="true" className="mr-2 inline h-4 w-4" />{copy.saved}</p>
            {result.source === "legacy_recomputed" ? <p className="rounded-lg bg-primary/5 p-3 text-xs leading-5 text-muted">{copy.legacy}</p> : null}
            <FinancialScoreCard result={result} diagnosis={copy.explanation} />
            <VoiceButton text={`${copy.saved}: ${result.score}/${result.scoreMax}. ${copy.schema}. ${copy.knowledge}`} variant="pill" label={pl ? "Odczytaj wynik lokalnym głosem" : "Read the result with a local voice"} />
            <div className="rounded-lg border border-primary/15 bg-white p-4">
              <h2 className="font-black text-text">{copy.ratios}</h2>
              {result.currency === "PLN" ? <p className="mt-2 text-sm">{copy.free}: {format.format(result.ratios.monthlyFree)} PLN</p> : <p className="mt-2 text-sm">{copy.unknownCurrency}</p>}
              <p className="mt-2 text-sm">{copy.cushion}: {result.ratios.cushionMonths === null ? copy.unavailable : format.format(result.ratios.cushionMonths)}</p>
              <p className="mt-3 text-xs leading-5 text-muted">{copy.knowledge}</p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-white p-4">
              <h2 className="font-black text-text">{copy.next}</h2><p className="mt-2 text-sm leading-6 text-muted">{copy.nextBody}</p>
              <Button asChild variant="outline" className="mt-3"><Link href="/learn">{copy.learn}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
            </div>
          </> : <div className="rounded-lg border border-primary/15 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-text">{copy.waiting}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{dirty && result ? copy.dirty : copy.empty}</p>
            <p className="mt-3 text-xs leading-5 text-muted">{copy.schema}</p>
          </div>}
        </div>
      </div>
    </section>
  );
}
