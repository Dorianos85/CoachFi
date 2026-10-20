"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { locale } = useLanguage();
  const pl = locale === "pl";
  const paths = [
    { href: "/adult", title: pl ? "Dla dorosłych" : "For adults", body: pl ? "Dla Twoich własnych finansów, także gdy nie masz dzieci. Zacznij od budżetu lub poduszki finansowej i wybierz mały kolejny krok." : "For your personal finances, whether or not you have children. Start with a budget or an emergency buffer and choose a small next step.", features: pl ? ["Lekcja, sprawdzenie zrozumienia i plan działania", "Osobny postęp i dostęp do dotychczasowego panelu"] : ["A lesson, knowledge check and action plan", "Separate progress and access to the existing dashboard"], action: pl ? "Zacznij dla siebie" : "Start for yourself" },
    { href: "/family", title: pl ? "Dla rodzin z dziećmi" : "For families with children", body: pl ? "Dla pełnoletniego rodzica lub opiekuna prowadzącego wspólną naukę. Rozmawiajcie o potrzebach, zachciankach i wspólnych celach na wymyślonych przykładach." : "For an adult parent or guardian leading shared learning. Talk about needs, wants and shared goals using fictional examples.", features: pl ? ["Ćwiczenie, pytanie i pomysł na rozmowę poza ekranem", "Bez kont dzieci i podawania ich danych"] : ["An exercise, question and an offline conversation idea", "No child accounts or child information requested"], action: pl ? "Zacznijcie razem" : "Start together" },
  ];
  return <div className="learning-path-surface mx-auto max-w-5xl space-y-8 rounded-2xl bg-slate-950 px-4 py-8 text-slate-100 sm:py-12" data-testid="audience-home">
    <header className="max-w-3xl space-y-4">
      <p className="text-sm font-semibold text-sky-300">CoachfiAI · {pl ? "Edukacja finansowa w Polsce" : "Financial education in Poland"}</p>
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{pl ? "Twoje finanse. Wspólne rozmowy. Wybierz swój początek." : "Your finances. Shared conversations. Choose where to start."}</h1>
      <p className="text-lg text-slate-300">{pl ? "Ucz się samodzielnie albo prowadź rodzinne ćwiczenia z dziećmi. Każda ścieżka działa niezależnie — możesz korzystać z obu." : "Learn on your own or lead shared exercises with your children. Each path works independently, and you can use both."}</p>
    </header>
    <div className="grid gap-5 md:grid-cols-2">{paths.map(path => <section key={path.href} className="flex flex-col rounded-2xl border border-sky-400/40 bg-slate-900 p-6" aria-labelledby={`${path.href.slice(1)}-title`}>
      <h2 id={`${path.href.slice(1)}-title`} className="text-2xl font-semibold">{path.title}</h2>
      <p className="mt-3 text-slate-300">{path.body}</p>
      <ul className="my-5 list-disc space-y-2 pl-5 text-slate-300">{path.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
      <Link href={path.href} className="mt-auto inline-flex min-h-12 items-center justify-between gap-3 rounded-xl bg-sky-300 px-4 py-3 font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">{path.action}<span aria-hidden="true">→</span></Link>
    </section>)}</div>
    <aside className="rounded-xl border border-slate-700 p-5 text-sm leading-relaxed text-slate-300">{pl ? "Lokalny prototyp: nowe ćwiczenia zachowują postęp tylko w pamięci tej sesji. Przełączanie ścieżek go zachowuje; odświeżenie zeruje. Nie trafia on do konta ani eksportu. Materiały są edukacyjne, a przykłady w PLN nie są poradą finansową. Wybór ścieżki nie jest potwierdzeniem wieku ani zgodą na przetwarzanie danych." : "Local prototype: new exercises keep progress only in this session's memory. Switching paths preserves it; refreshing resets it. It is not saved to an account or included in exports. Materials are educational; PLN examples are not financial advice. Choosing a path does not confirm age or provide data consent."}</aside>
  </div>;
}
