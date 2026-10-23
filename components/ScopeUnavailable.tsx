"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function ScopeUnavailable() {
  const { locale } = useLanguage();
  const pl = locale === "pl";
  return (
    <section className="rounded-lg border border-primary/15 bg-white p-6" aria-labelledby="scope-unavailable-title">
      <h1 id="scope-unavailable-title" className="text-2xl font-black text-text">{pl ? "Ta funkcja jest niedostępna w tej wersji" : "This feature is unavailable in this release"}</h1>
      <p className="mt-3 text-muted">{pl ? "Obecna wersja Coach FI obejmuje edukację finansową dla dorosłych." : "The current Coach FI release covers financial learning for adults."}</p>
      <Link href="/learn" className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{pl ? "Przejdź do nauki" : "Go to learning"}</Link>
    </section>
  );
}
