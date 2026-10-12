"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clipboard,
  Coins,
  FileText,
  Gavel,
  HeartHandshake,
  Home,
  Landmark,
  LifeBuoy,
  Link as LinkIcon,
  MessageCircleHeart,
  Phone,
  Scale,
  Search,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { addTokens, getTokenBalance } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const REWARD_KEY = "coachfi-crisis-actions";
const ACTION_REWARD = 15;

type Resource = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  source?: string;
  phone?: string;
};

const resalePlatforms = [
  {
    name: "Vinted",
    href: "https://www.vinted.pl/",
    bestFor: "Ubrania, buty, dodatki, rzeczy lifestyle.",
    tip: "Najpierw wystaw rzeczy, których nie użyłeś od 90 dni.",
  },
  {
    name: "OLX",
    href: "https://www.olx.pl/",
    bestFor: "Meble, AGD, elektronika, rowery, większe rzeczy lokalnie.",
    tip: "Dobre zdjęcia i odbiór osobisty często przyspieszają sprzedaż.",
  },
  {
    name: "Allegro Lokalnie",
    href: "https://allegrolokalnie.pl/",
    bestFor: "Elektronika, książki, hobby, przedmioty o wyższej wartości.",
    tip: "Warto porównać cenę z podobnymi aktywnymi ogłoszeniami.",
  },
  {
    name: "Facebook Marketplace",
    href: "https://www.facebook.com/marketplace/",
    bestFor: "Szybka sprzedaż lokalna i grupy osiedlowe.",
    tip: "Nie klikaj podejrzanych linków od kupujących. Trzymaj płatność w bezpiecznym kanale.",
  },
  {
    name: "eBay",
    href: "https://www.ebay.pl/",
    bestFor: "Kolekcje, elektronika, niszowe rzeczy z potencjałem międzynarodowym.",
    tip: "Uwzględnij prowizje, wysyłkę i czas obsługi zamówienia.",
  },
];

const emotionalSupportContacts = [
  {
    title: "112",
    subtitle: "Natychmiastowe zagrożenie życia lub zdrowia",
    body: "Dzwoń od razu, jeśli możesz zrobić sobie krzywdę, jesteś w bezpośrednim zagrożeniu albo ktoś obok Ciebie jest zagrożony.",
    href: "tel:112",
    cta: "Dzwoń 112",
    urgent: true,
  },
  {
    title: "116 123",
    subtitle: "Telefon zaufania dla dorosłych",
    body: "Bezpłatna, anonimowa pomoc dla osób dorosłych w kryzysie psychicznym i emocjonalnym.",
    href: "tel:116123",
    cta: "Dzwoń 116 123",
  },
  {
    title: "800 70 2222",
    subtitle: "Centrum Wsparcia dla dorosłych",
    body: "Całodobowe wsparcie psychologiczne dla osób dorosłych w kryzysie psychicznym.",
    href: "tel:800702222",
    cta: "Dzwoń 800 70 2222",
  },
  {
    title: "116sos.pl",
    subtitle: "Pomoc online",
    body: "Platforma dla dorosłych: telefon, informacje, pomoc online i baza miejsc wsparcia.",
    href: "https://116sos.pl/otrzymaj-pomoc/telefon",
    cta: "Otwórz 116sos.pl",
  },
  {
    title: "Centrum Zdrowia Psychicznego",
    subtitle: "Bezpłatna pomoc bez skierowania",
    body: "Dorosła osoba może szukać wsparcia w CZP właściwym dla miejsca zamieszkania, także w nagłej sytuacji.",
    href: "https://www.gov.pl/web/zdrowie/centra-zdrowia-psychicznego",
    cta: "Znajdź CZP",
  },
];

const actionSteps = [
  {
    id: "write-close-person",
    title: "Napisz do najbliższej osoby",
    body: "Poproś o krótką pożyczkę tylko na podstawowe potrzeby. Ustal termin zwrotu i spisz prostą umowę.",
  },
  {
    id: "call-creditor",
    title: "Skontaktuj się z bankiem lub wierzycielem",
    body: "Poproś o restrukturyzację, karencję, raty lub sprawdzenie dostępnych wakacji kredytowych.",
  },
  {
    id: "book-free-legal",
    title: "Umów darmową pomoc prawną",
    body: "Nie ignoruj pism z sądu, komornika lub banku. Prawnik pomoże ustalić kolejność działań.",
  },
  {
    id: "contact-mops",
    title: "Sprawdź MOPS/OPS",
    body: "Zapytaj o zasiłek celowy, żywność, leki, opał, czynsz albo inną pomoc bytową.",
  },
  {
    id: "sell-unused",
    title: "Wystaw 3 nieużywane rzeczy",
    body: "Odzyskaj pierwszą gotówkę bez nowego długu. Zacznij od ubrań, elektroniki i sprzętów.",
  },
];

const requestTemplate = `Cześć [IMIĘ],

piszę, bo mam pilną sytuację finansową i potrzebuję pomocy na podstawowe wydatki: [jedzenie/leki/czynsz/dojazd].

Czy możesz pożyczyć mi [KWOTA] zł do dnia [DATA ZWROTU]?
Chcę zrobić to uczciwie i jasno, dlatego mogę od razu wysłać prostą umowę pożyczki z terminem zwrotu.

Nie proszę o prezent. Proszę o krótką pomoc, którą oddam w ustalonym terminie.
Dziękuję, że to czytasz.`;

const emotionalCrisisTemplate = `Cześć [IMIĘ],

jestem w bardzo trudnym momencie. Długi i stres mnie przerastają. Nie proszę Cię teraz o rozwiązanie wszystkiego.

Potrzebuję, żeby ktoś był ze mną w kontakcie przez najbliższą godzinę.
Czy możesz do mnie zadzwonić albo odpisać?

Jeśli nie odpisuję, proszę spróbuj ponownie albo zadzwoń po pomoc.
Chcę przejść przez ten moment bezpiecznie.`;

const loanAgreementTemplate = `UMOWA POŻYCZKI

Zawarta w dniu [DATA] w [MIASTO] pomiędzy:
Pożyczkodawcą: [IMIĘ, NAZWISKO, ADRES, PESEL]
a
Pożyczkobiorcą: [IMIĘ, NAZWISKO, ADRES, PESEL].

1. Pożyczkodawca przekazuje Pożyczkobiorcy kwotę [KWOTA] zł.
2. Pożyczkobiorca zobowiązuje się zwrócić pełną kwotę do dnia [DATA ZWROTU].
3. Zwrot nastąpi przelewem na rachunek: [NUMER KONTA] lub gotówką za pokwitowaniem.
4. Pożyczka jest nieoprocentowana, chyba że strony wpiszą inaczej: [WARUNKI].
5. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.

Podpis Pożyczkodawcy: ____________________
Podpis Pożyczkobiorcy: ____________________`;

const bankRequestTemplate = `WNIOSEK DO BANKU O CZASOWE OBNIŻENIE LUB ZAWIESZENIE RAT

Dane kredytobiorcy: [IMIĘ, NAZWISKO, PESEL]
Numer umowy kredytu: [NUMER UMOWY]

Zwracam się z prośbą o pilny kontakt i rozpatrzenie możliwości:
- zawieszenia spłaty rat lub skorzystania z dostępnych wakacji kredytowych,
- czasowego obniżenia rat,
- karencji w spłacie kapitału,
- restrukturyzacji zadłużenia,
- informacji o Funduszu Wsparcia Kredytobiorców, jeśli dotyczy.

Uzasadnienie:
Moja sytuacja finansowa pogorszyła się z powodu [UTRATA PRACY/CHOROBA/SPADEK DOCHODÓW/INNE].
Chcę uniknąć zaległości i ustalić realny plan spłaty.

Proszę o odpowiedź pisemną oraz wskazanie dokumentów potrzebnych do rozpatrzenia wniosku.

Data i podpis: ____________________`;

const mopsTemplate = `WNIOSEK DO MOPS/OPS O POMOC W SYTUACJI KRYZYSOWEJ

Dane: [IMIĘ, NAZWISKO, ADRES, TELEFON]

Proszę o pilny kontakt i informację o możliwych formach pomocy, w szczególności:
- zasiłek celowy na żywność, leki, opał, czynsz lub niezbędne potrzeby,
- pomoc rzeczowa lub żywnościowa,
- wsparcie pracownika socjalnego,
- wskazanie innych lokalnych form pomocy.

Opis sytuacji:
[KRÓTKO OPISZ: dochód, liczba osób w gospodarstwie, pilne wydatki, zadłużenie, choroba, utrata pracy].

Data i podpis: ____________________`;

const templates = [
  { id: "emotional", title: "Wiadomość do bliskiej osoby w załamaniu", text: emotionalCrisisTemplate },
  { id: "request", title: "Prośba o pożyczkę do bliskiej osoby", text: requestTemplate },
  { id: "loan", title: "Prosty wzór umowy pożyczki", text: loanAgreementTemplate },
  { id: "bank", title: "Wniosek do banku o ulgę w spłacie", text: bankRequestTemplate },
  { id: "mops", title: "Wniosek do MOPS/OPS o pomoc", text: mopsTemplate },
];

export default function CrisisPage() {
  const { locale } = useLanguage();
  const [city, setCity] = useState("Warszawa");
  const [copied, setCopied] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tokenBalance, setTokenBalance] = useState(125);

  useEffect(() => {
    setTokenBalance(getTokenBalance());
    try {
      const raw = localStorage.getItem(REWARD_KEY);
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {
      setDone(new Set());
    }
  }, []);

  const resources = useMemo(() => buildResources(city), [city]);
  const voiceText = [
    "Plan kryzysu finansowego Coach FI.",
    "Najpierw zabezpiecz życie, zdrowie, jedzenie, leki, dach nad głową i kontakt z drugim człowiekiem.",
    "Jeśli masz myśli samobójcze albo boisz się, że zrobisz sobie krzywdę, dzwoń pod 112 albo 116 123.",
    "Długi można porządkować krok po kroku. Nie musisz przechodzić przez to sam.",
    "Nie bierz kolejnej drogiej pożyczki pod presją.",
    "Skontaktuj się z bezpłatną pomocą prawną, MOPS lub OPS, bankiem i najbliższą zaufaną osobą.",
    "Wystaw nieużywane rzeczy na sprzedaż, aby odzyskać pierwszą gotówkę bez zwiększania długu.",
  ].join(" ");

  function markDone(id: string) {
    if (done.has(id)) return;
    const nextDone = new Set(done).add(id);
    setDone(nextDone);
    localStorage.setItem(REWARD_KEY, JSON.stringify(Array.from(nextDone)));
    setTokenBalance(addTokens(ACTION_REWARD));
  }

  async function copyText(id: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    }
  }

  return (
    <section aria-labelledby="crisis-title">
      <SectionHeader
        eyebrow="Kryzys finansowy"
        title="Plan awaryjny, kiedy kończą się pieniądze."
        description="Coach FI pomaga zatrzymać panikę, znaleźć bezpłatną pomoc, skontaktować się z instytucjami i odzyskać pierwszą gotówkę bez pogłębiania długu."
        readText={voiceText}
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-warning/30 bg-warning/15 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-warning text-background">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text">Najpierw bezpieczeństwo</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Jeśli jest zagrożenie życia, zdrowia, przemocy albo bezpośrednie niebezpieczeństwo, dzwoń pod 112.
                Jeśli jesteś w kryzysie psychicznym, skorzystaj z telefonu 116 123 lub centrumwsparcia.pl.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <EmergencyLink href="tel:112" label="112" detail="alarmowo" />
                <EmergencyLink href="tel:116123" label="116 123" detail="kryzys psychiczny" />
                <EmergencyLink href="https://116sos.pl/" label="116sos.pl" detail="online" />
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tokeny za działanie</CardTitle>
            <CardDescription>Każdy wykonany krok SOS daje +{ACTION_REWARD} Coach FI Tokens.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary p-5 text-center text-white">
              <Coins className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
              <p className="mt-2 text-4xl font-black">{tokenBalance}</p>
              <p className="text-sm font-bold text-white/80">Coach FI Tokens</p>
            </div>
            <VoiceButton text={voiceText} label="Odczytaj plan SOS" locale={locale} variant="pill" className="mt-4 w-full justify-center" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5 border-warning/30">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-warning">Najpierw człowiek, potem dług</p>
              <CardTitle className="mt-2 text-3xl">Gdy długi powodują załamanie, depresję albo myśli samobójcze</CardTitle>
              <CardDescription className="mt-3 text-base">
                Ten moduł jest dla dorosłych. Jeśli czujesz, że nie wytrzymasz, nie zostawaj sam/a z tym stanem.
                Zadzwoń, napisz do kogoś zaufanego, poproś, żeby ktoś z Tobą został. Dług jest problemem do rozwiązania, ale najpierw trzeba zadbać o bezpieczeństwo.
              </CardDescription>
            </div>
            <VoiceButton
              text="Jeśli długi powodują załamanie, depresję albo myśli samobójcze, najpierw zadbaj o bezpieczeństwo. Zadzwoń pod 112, jeśli możesz zrobić sobie krzywdę. Zadzwoń pod 116 123 albo 800 70 2222, jeśli potrzebujesz rozmowy z kimś teraz. Nie musisz przechodzić przez to sam."
              label="Odczytaj pomoc teraz"
              locale={locale}
              variant="pill"
              className="shrink-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {emotionalSupportContacts.map((contact) => (
              <a
                key={contact.title}
                href={contact.href}
                target={contact.href.startsWith("http") ? "_blank" : undefined}
                rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={cn(
                  "rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  contact.urgent
                    ? "border-warning/45 bg-warning/15"
                    : "border-primary/10 bg-background/45 hover:border-primary/35"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-lg",
                      contact.urgent ? "bg-warning text-background" : "bg-primary/12 text-primary"
                    )}
                  >
                    {contact.urgent ? (
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <LinkIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-black leading-tight text-text">{contact.title}</h3>
                <p className="mt-1 text-xs font-black uppercase text-primary">{contact.subtitle}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{contact.body}</p>
                <p className="mt-4 text-sm font-black text-accent">{contact.cta}</p>
              </a>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-primary/10 bg-background/45 p-4 md:grid-cols-3">
            <SafetyStep title="1. Powiedz komuś" body="Wyślij krótką wiadomość: jestem w kryzysie i potrzebuję, żebyś był/a ze mną w kontakcie." />
            <SafetyStep title="2. Oddal ryzyko" body="Odsuń od siebie rzeczy, którymi możesz sobie zrobić krzywdę. Przejdź do miejsca, gdzie są inni ludzie." />
            <SafetyStep title="3. Zrób jeden telefon" body="Nie musisz umieć wszystkiego wyjaśnić. Powiedz tylko: mam kryzys, potrzebuję pomocy teraz. W nagłym zagrożeniu możesz też dzwonić 999 albo jechać na SOR." />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Znajdź pomoc w swoim mieście</CardTitle>
          <CardDescription>
            Wpisz miasto. Coach FI podpowie, gdzie szukać OIK, MOPS/OPS, darmowej pomocy prawnej i wsparcia kredytobiorców.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="grid gap-2 text-sm font-black text-text md:max-w-md">
            Twoje miasto
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="np. Warszawa, Kraków, Gdańsk"
              className="min-h-12 rounded-lg border border-primary/20 bg-background/70 px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Pierwsze 24 godziny</CardTitle>
            <CardDescription>Zrób małe kroki w dobrej kolejności. Nie rozwiązuj wszystkiego naraz.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {actionSteps.map((step) => (
              <ActionStep key={step.id} step={step} done={done.has(step.id)} onDone={() => markDone(step.id)} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" aria-hidden="true" />
              <CardTitle>Czego nie robić w panice</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm font-semibold leading-6 text-muted">
              <li>Nie bierz chwilówki tylko po to, żeby spłacić inną chwilówkę.</li>
              <li>Nie ignoruj listów z banku, sądu, komornika ani ZUS.</li>
              <li>Nie obiecuj rodzinie zwrotu bez daty, kwoty i prostych warunków.</li>
              <li>Nie sprzedawaj rzeczy potrzebnych do pracy lub zdrowia.</li>
              <li>Nie podpisuj ugody, której kosztów nie rozumiesz.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Wzory wiadomości i wniosków</CardTitle>
          <CardDescription>
            To są edukacyjne szkice do dopasowania. W sprawach prawnych skorzystaj z bezpłatnej pomocy prawnej.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-primary/10 bg-background/45 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-black text-text">{template.title}</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyText(template.id, template.text)}>
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                  {copied === template.id ? "Skopiowano" : "Kopiuj"}
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-card/80 p-3 text-xs font-semibold leading-5 text-muted">
                {template.text}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Odzyskaj gotówkę przez reselling</CardTitle>
              <CardDescription>
                Najszybszy mały zastrzyk gotówki często jest w rzeczach, których już nie używasz.
              </CardDescription>
            </div>
            <VoiceButton
              text="Wystaw trzy nieużywane rzeczy. Ubrania i dodatki sprawdź na Vinted. Większe rzeczy lokalne na OLX albo Facebook Marketplace. Elektronikę i rzeczy o wyższej wartości porównaj na Allegro Lokalnie."
              label="Odczytaj reselling"
              locale={locale}
              variant="pill"
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {resalePlatforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-primary/10 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ShoppingBag className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-black text-text">{platform.name}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{platform.bestFor}</p>
              <p className="mt-3 text-xs font-bold leading-5 text-accent">{platform.tip}</p>
            </a>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function buildResources(city: string): Resource[] {
  const cleanCity = city.trim() || "moje miasto";
  const q = encodeURIComponent(cleanCity);
  const search = (phrase: string) => `https://www.google.com/search?q=${encodeURIComponent(`${phrase} ${cleanCity}`)}`;

  return [
    {
      id: "oik",
      title: "Ośrodek Interwencji Kryzysowej",
      body: "Pomoc w kryzysie, rozmowa, interwencja, czasem schronienie lub wsparcie psychologiczne. Szukaj lokalnego OIK.",
      href: search("Ośrodek Interwencji Kryzysowej"),
      cta: `Szukaj OIK: ${cleanCity}`,
      phone: "lokalny numer OIK",
    },
    {
      id: "legal",
      title: "Nieodpłatna pomoc prawna",
      body: "Publiczne punkty w całej Polsce. Można uzyskać poradę prawną, obywatelską lub mediację.",
      href: "https://zapisy-np.ms.gov.pl/",
      cta: "Umów poradę",
      source: "gov.pl",
    },
    {
      id: "mops",
      title: "MOPS / OPS",
      body: "Zapytaj o zasiłek celowy, żywność, leki, opał, czynsz i kontakt z pracownikiem socjalnym.",
      href: search("MOPS OPS zasiłek celowy"),
      cta: `Szukaj MOPS/OPS: ${cleanCity}`,
      source: "gov.pl",
    },
    {
      id: "zus",
      title: "ZUS",
      body: "Jeśli prowadzisz firmę lub masz zaległości składkowe, sprawdź odroczenie, raty albo ulgę w spłacie.",
      href: "https://www.zus.pl/firmy/ulgi/ulgi-w-splacie-naleznosci",
      cta: "Sprawdź ulgi ZUS",
    },
    {
      id: "alimony",
      title: "Alimenty i fundusz alimentacyjny",
      body: "Jeśli ktoś powinien partycypować w utrzymaniu dziecka lub rodziny, sprawdź alimenty i świadczenia.",
      href: "https://www.gov.pl/web/gov/uzyskaj-swiadczenia-z-funduszu-alimentacyjnego",
      cta: "Sprawdź fundusz",
      source: "gov.pl",
    },
    {
      id: "credit",
      title: "Kredyt hipoteczny i raty",
      body: "Sprawdź w banku wakacje kredytowe, restrukturyzację, karencję oraz Fundusz Wsparcia Kredytobiorców.",
      href: "https://www.bgk.pl/produkty/fundusz-wsparcia-kredytobiorcow/",
      cta: "Sprawdź FWK",
      source: "BGK",
    },
    {
      id: "city-office",
      title: "Urząd miasta lub gminy",
      body: "Lokalne strony często publikują aktualne numery do OIK, MOPS, punktów prawnych i pomocy żywnościowej.",
      href: `https://www.google.com/search?q=${encodeURIComponent(`urząd miasta gminy pomoc kryzysowa ${cleanCity}`)}&near=${q}`,
      cta: "Szukaj lokalnie",
    },
  ];
}

function EmergencyLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-background/70 px-4 py-2 text-sm font-black text-text transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Phone className="h-4 w-4 text-warning" aria-hidden="true" />
      <span>{label}</span>
      <span className="text-xs text-muted">{detail}</span>
    </a>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const icon = resource.id === "legal" ? Gavel : resource.id === "mops" ? Home : resource.id === "zus" ? Landmark : resource.id === "credit" ? Banknote : resource.id === "alimony" ? Scale : resource.id === "oik" ? LifeBuoy : Search;
  const Icon = icon;

  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-primary/10 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <LinkIcon className="h-4 w-4 text-muted" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-black leading-tight text-text">{resource.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">{resource.body}</p>
      {resource.phone && <p className="mt-3 text-xs font-black uppercase text-accent">{resource.phone}</p>}
      {resource.source && <p className="mt-2 text-xs font-bold text-muted">Źródło: {resource.source}</p>}
      <p className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">
        {resource.cta}
        <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </p>
    </a>
  );
}

function SafetyStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-background">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-black text-text">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-muted">{body}</p>
      </div>
    </div>
  );
}

function ActionStep({
  step,
  done,
  onDone,
}: {
  step: { id: string; title: string; body: string };
  done: boolean;
  onDone: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center",
        done ? "border-success/35 bg-success/12" : "border-primary/10 bg-background/45"
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", done ? "bg-success text-background" : "bg-primary/12 text-primary")}>
        {done ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-black text-text">{step.title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-muted">{step.body}</p>
      </div>
      <Button type="button" variant={done ? "success" : "outline"} size="sm" onClick={onDone} disabled={done}>
        {done ? "Wykonane" : `+${ACTION_REWARD} tokenów`}
      </Button>
    </div>
  );
}
