"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useConsent } from "@/context/ConsentContext";
import { useMode } from "@/context/ModeContext";
import { hasAdultConfirmation } from "@/lib/product-scope";
import { useLearningPaths } from "@/context/LearningPathsContext";
import type { AnswerId } from "@/lib/learning-paths";

const button = buttonVariants();
const panel = "space-y-4 rounded-card border border-border-subtle bg-card p-5 text-text shadow-soft sm:p-6";

export default function AdultPath() {
  const { locale } = useLanguage();
  const { loaded: consentLoaded, requiredAccepted } = useConsent();
  const { loaded: modeLoaded, modeRecord } = useMode();
  const ready = consentLoaded && requiredAccepted && modeLoaded && hasAdultConfirmation(modeRecord);
  const pl = locale === "pl";
  const { paths, chooseGoal, markLessonRead, answerQuestion, markActionPlanned } = useLearningPaths();
  const session = paths.adult;
  const correct = session.answer === "b";
  const completed = Number(!!session.goal) + Number(session.lessonRead) + Number(correct) + Number(session.actionPlanned);
  const answers: Array<{ id: AnswerId; label: string }> = [{ id: "a", label: "1 000 PLN" }, { id: "b", label: "500 PLN" }, { id: "c", label: "4 000 PLN" }];
  return <div className="learning-path-surface mx-auto max-w-3xl space-y-6 rounded-card bg-background text-text" data-testid="adult-path">
    <header className="space-y-4 rounded-card border border-border-subtle bg-card p-5 shadow-soft sm:p-7">
      <p className="inline-flex rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-black uppercase text-primary">{pl ? "Dla dorosłych · Twoje własne finanse" : "For adults · Your personal finances"}</p>
      <h1 className="text-3xl font-black leading-tight text-text sm:text-4xl">{pl ? "Zacznij od jednego spokojnego kroku" : "Start with one manageable step"}</h1>
      <p className="text-base font-semibold leading-7 text-muted">{pl ? "Nie musisz mieć dzieci ani podawać swoich kwot. Wybierz temat, przejdź przykład i zaplanuj działanie dla siebie." : "You do not need to have children or share your own financial figures. Choose a topic, try an example and plan an action for yourself."}</p>
      <p className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm font-semibold leading-6 text-muted">{pl ? "Postęp tylko w pamięci sesji: przełączanie ścieżek go zachowuje, odświeżenie zeruje. Bez zapisu na koncie i bez eksportu nowych ćwiczeń." : "Progress stays only in session memory: switching paths preserves it; refreshing resets it. New exercises are not saved to an account or exported."}</p>
    </header>
    <section className={panel} aria-labelledby="adult-progress-title">
      <h2 id="adult-progress-title" className="font-black text-text">{pl ? "Twój postęp w tym ćwiczeniu" : "Your progress in this exercise"}</h2>
      <progress className="h-3 w-full accent-primary" value={completed} max={4} aria-label={pl ? "Postęp ćwiczenia dla dorosłych" : "Adult exercise progress"} />
      <p role="status" data-testid="adult-progress" className="text-sm font-bold text-muted">{completed}/4 {pl ? "kroki w tej sesji" : "steps this session"}</p>
    </section>
    {!ready && <p role="status" className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm font-semibold leading-6 text-muted">{pl ? "Ćwiczenie wymaga potwierdzenia pełnoletności i wymaganych ustawień prywatności. Wybór ścieżki ich nie zastępuje." : "The exercise requires adult confirmation and required privacy settings. Choosing a path does not replace them."}</p>}
    <fieldset disabled={!ready} className="space-y-6">
    <legend className="sr-only">{pl ? "Ćwiczenie dla dorosłych" : "Adult exercise"}</legend>
    <section className={panel} aria-labelledby="adult-goal-title">
      <h2 id="adult-goal-title" className="text-xl font-black text-text">1. {pl ? "Wybierz swój temat" : "Choose your topic"}</h2>
      <fieldset className="space-y-3"><legend className="sr-only">{pl ? "Temat dla dorosłych" : "Adult topic"}</legend>
        {(["budget", "reserve"] as const).map(goal => <label key={goal} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-white p-4 font-bold text-text transition hover:border-primary/50 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2"><input type="radio" name="adult-goal" value={goal} checked={session.goal === goal} onChange={() => chooseGoal("adult", goal)} className="h-5 w-5 accent-primary" />{goal === "budget" ? (pl ? "Uporządkuj budżet" : "Organise your budget") : (pl ? "Zrozum poduszkę finansową" : "Understand an emergency buffer")}</label>)}
      </fieldset>
      <p className="text-sm font-semibold leading-6 text-muted">{pl ? "Zmiana tematu rozpoczyna ćwiczenie od początku; postęp rodzinny pozostaje osobny." : "Changing topics restarts this exercise; family progress stays separate."}</p>
    </section>
    {session.goal && <section className={panel} aria-labelledby="adult-lesson-title">
      <h2 id="adult-lesson-title" className="text-xl font-black text-text">2. {session.goal === "reserve" ? (pl ? "Poduszka zaczyna się od budżetu" : "A buffer starts with a budget") : (pl ? "Co zostaje po potrzebach i zobowiązaniach?" : "What remains after needs and commitments?")}</h2>
      <p>{pl ? "Wymyślony miesięczny budżet: wpływy 4 000 PLN, podstawowe potrzeby 3 000 PLN i wymagane raty 500 PLN. Pozostaje 500 PLN. Pominięte lub nieregularne wydatki też trzeba uwzględnić — to nie jest automatycznie oszczędność." : "A fictional monthly budget: income of 4,000 PLN, basic needs of 3,000 PLN and required debt payments of 500 PLN. That leaves 500 PLN. Omitted or irregular expenses still need to be considered; this is not automatically savings."}</p>
      <p>{session.goal === "reserve" ? (pl ? "Poduszka to pieniądze odłożone na niespodziewane, potrzebne wydatki. Jej wysokość i tempo budowania zależą od sytuacji. Najpierw sprawdź koszty życia i zobowiązania; nie obiecujemy określonego wyniku." : "A buffer is money set aside for unexpected necessary expenses. Its size and pace depend on your circumstances. Check essential costs and commitments first; no particular outcome is promised.") : (pl ? "Budżet to plan, który możesz poprawiać. Rozróżnij potrzeby, zobowiązania, wydatki opcjonalne i cele. Nie trzeba oceniać siebie przez jedną liczbę." : "A budget is a plan you can adjust. Distinguish needs, commitments, optional spending and goals. One number does not define how well you are doing.")}</p>
      <aside className="rounded-lg border border-primary/15 bg-area-mila p-4 text-text"><strong className="font-black">{pl ? "Mila · przygotowana wskazówka" : "Mila · prepared guidance"}</strong><p className="mt-2 text-sm font-semibold leading-6 text-muted">{pl ? "Zacznij od jednej kategorii wydatków. Ten tekst jest gotową wskazówką edukacyjną; nie wysyłamy Twoich odpowiedzi do zewnętrznego AI." : "Start with one spending category. This is prepared educational guidance; your answers are not sent to external AI."}</p></aside>
      <button type="button" className={button} onClick={() => markLessonRead("adult")} disabled={session.lessonRead}>{session.lessonRead ? (pl ? "Lekcja przeczytana" : "Lesson read") : (pl ? "Przeczytałem lekcję" : "I have read the lesson")}</button>
    </section>}
    {session.lessonRead && <section className={panel} aria-labelledby="adult-question-title">
      <h2 id="adult-question-title" className="text-xl font-black text-text">3. {pl ? "Sprawdź zrozumienie" : "Check your understanding"}</h2>
      <fieldset className="space-y-3"><legend className="mb-3">{pl ? "Ile pozostaje z 4 000 PLN po odjęciu potrzeb 3 000 PLN i rat 500 PLN w tym przykładzie?" : "In this example, what remains from 4,000 PLN after needs of 3,000 PLN and payments of 500 PLN?"}</legend>
        {answers.map(answer => <label key={answer.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-white p-4 font-bold text-text transition hover:border-primary/50 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2"><input type="radio" name="adult-answer" value={answer.id} checked={session.answer === answer.id} onChange={() => answerQuestion("adult", answer.id)} className="h-5 w-5 accent-primary" />{answer.label}</label>)}
      </fieldset>
      {session.answer && <p role="status" className={correct ? "rounded-lg border border-success/30 bg-success/10 p-4 font-semibold text-text" : "rounded-lg border border-warning/30 bg-warning/10 p-4 font-semibold text-text"}>{correct ? (pl ? "Tak: 4 000 − 3 000 − 500 = 500 PLN. To pozostałość w przykładzie, nie gwarancja oszczędności." : "Yes: 4,000 − 3,000 − 500 = 500 PLN. This is the example's remainder, not guaranteed savings.") : session.answer === "a" ? (pl ? "1 000 PLN pomija raty 500 PLN. Odejmij również zobowiązania i spróbuj ponownie." : "1,000 PLN leaves out the payments of 500 PLN. Subtract the commitments too and try again.") : (pl ? "4 000 PLN to całe wpływy. Odejmij potrzeby i raty; możesz spróbować ponownie." : "4,000 PLN is all the income. Subtract needs and payments; you can try again.")}</p>}
    </section>}
    {correct && <section className={panel} aria-labelledby="adult-action-title">
      <h2 id="adult-action-title" className="text-xl font-black text-text">4. {pl ? "Zaplanuj małe działanie poza ekranem" : "Plan a small offline action"}</h2>
      <p>{session.goal === "reserve" ? (pl ? "W dogodnym momencie sprawdzę jeden nieprzewidziany wydatek z przeszłości i zastanowię się, jak go uwzględnić w planie. Nie muszę dziś odkładać żadnej kwoty." : "At a suitable time, I will review one past unexpected expense and consider how to allow for it in my plan. I do not have to set aside any money today.") : (pl ? "W dogodnym momencie porównam jedną kategorię wydatków z moim planem. Danych ani kwot nie wpisuję do tego ćwiczenia." : "At a suitable time, I will compare one spending category with my plan. I do not enter personal figures or data in this exercise.")}</p>
      <button type="button" className={button} disabled={session.actionPlanned} onClick={() => markActionPlanned("adult")}>{session.actionPlanned ? (pl ? "Działanie zaplanowane" : "Action planned") : (pl ? "Wybieram ten plan" : "Choose this plan")}</button>
      {session.actionPlanned && <p role="status">{pl ? "Plan wybrany w tej sesji. To Twoja deklaracja, a nie potwierdzenie wykonania, poprawy wyniku czy zaoszczędzenia pieniędzy." : "Plan selected this session. This is your declaration, not verification of completion, an improved score or money saved."}</p>}
    </section>}
    </fieldset>
    <nav aria-label={pl ? "Dalsza nauka dla dorosłych" : "More adult learning"} className="flex flex-wrap gap-4 rounded-card border border-border-subtle bg-card p-5 font-bold text-primary shadow-soft underline underline-offset-4"><Link href="/adult/dashboard">{pl ? "Otwórz mój panel" : "Open my dashboard"}</Link><Link href="/learn">{pl ? "Biblioteka lekcji" : "Lesson library"}</Link><Link href="/family">{pl ? "Przejdź do ścieżki rodzinnej" : "Switch to the family path"}</Link></nav>
  </div>;
}
