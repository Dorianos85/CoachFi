import type { Locale, LocalizedMap } from "@/lib/i18n";

/**
 * Text of the financial crisis page.
 *
 * The page is region-aware (see getCrisisRegionData below):
 * - "en" and "es" show United States resources (911, 988, Crisis Text Line, 211, NFCC, 1-800-GAMBLER).
 * - "pl" and the remaining locales keep the Polish resources (112, 116 123, MOPS, Polish document templates).
 * Phone numbers and links live in the region data; texts are matched to them by position or by id.
 */
export interface CrisisCopy {
  regionNotice: string;
  eyebrow: string;
  title: string;
  description: string;
  voiceText: string[];
  safety: {
    title: string;
    body: string;
    emergencyDetail: string;
    mentalDetail: string;
    onlineDetail: string;
  };
  /** Side card. In regions with action rewards it shows the token balance; elsewhere only the read-aloud button. */
  tokens: {
    title: string;
    description: string;
    readPlan: string;
  };
  emotional: {
    eyebrow: string;
    title: string;
    description: string;
    voiceText: string;
    voiceLabel: string;
    /** Fallback title for a contact without its own title (Polish Mental Health Centre). */
    mentalHealthCentre?: string;
    contacts: { subtitle: string; body: string; cta: string }[];
    steps: { title: string; body: string }[];
  };
  city: {
    title: string;
    description: string;
    label: string;
    placeholder: string;
    fallback: string;
  };
  resources: {
    source: string;
    oikPhone?: string;
    /** Keyed by the resource ids of the region (see CRISIS_REGION_RESOURCES). */
    items: Record<string, { title: string; body: string; cta: string }>;
  };
  firstDay: {
    title: string;
    description: string;
    done: string;
    /** Button label for an unfinished step. May contain {reward} in regions with action rewards. */
    reward: string;
    steps: { title: string; body: string }[];
  };
  avoid: {
    title: string;
    items: string[];
  };
  templates: {
    title: string;
    description: string;
    copy: string;
    copied: string;
    polishDocumentNote?: string;
    titles: Partial<Record<CrisisTemplateId, string>>;
    emotionalText: string;
    requestText: string;
    /** Local-language loan agreement (US region). The Polish region uses the Polish formal document. */
    loanText?: string;
    /** Local-language hardship letter (US region). */
    bankText?: string;
  };
  resale: {
    title: string;
    description: string;
    voiceText: string;
    voiceLabel: string;
    platforms: { bestFor: string; tip: string }[];
  };
}

export type CrisisTemplateId = "emotional" | "request" | "loan" | "bank" | "mops";
export type CrisisRegion = "US" | "PL";

export interface CrisisRegionData {
  region: CrisisRegion;
  /** Token rewards for SOS steps. Only kept for the Polish community version. */
  actionRewards: boolean;
  defaultCity: string;
  safetyLinks: { label: string; href: string; detail: "emergencyDetail" | "mentalDetail" | "onlineDetail" }[];
  /** Matched by position with copy.emotional.contacts. */
  emotionalContacts: { title?: string; href: string; urgent?: boolean }[];
  resources: { id: string; href: string; source?: string; phone?: string; usesCity?: boolean }[];
  /** Matched by position with copy.resale.platforms. */
  resalePlatforms: { name: string; href: string }[];
  templateIds: CrisisTemplateId[];
}

export function crisisRegionForLocale(locale: Locale): CrisisRegion {
  return locale === "en" || locale === "es" ? "US" : "PL";
}

/** Google search for a phrase near the user's city; the page fills in `{city}`. */
function googleSearch(phrase: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(phrase)}+{city}`;
}

/**
 * Links and phone numbers for the crisis page. `{city}` in an href is replaced with the URL-encoded city.
 * US numbers verified 2026-11-03: 988lifeline.org, crisistextline.org, 211.org, nfcc.org, hud.gov, ncpgambling.org.
 */
export function getCrisisRegionData(locale: Locale): CrisisRegionData {
  if (crisisRegionForLocale(locale) === "US") {
    const spanish = locale === "es";
    return {
      region: "US",
      actionRewards: false,
      defaultCity: "",
      safetyLinks: [
        { label: "911", href: "tel:911", detail: "emergencyDetail" },
        { label: "988", href: "tel:988", detail: "mentalDetail" },
        {
          label: "988lifeline.org",
          href: spanish ? "https://988lifeline.org/es/inicio/" : "https://988lifeline.org/",
          detail: "onlineDetail",
        },
      ],
      emotionalContacts: [
        { title: "911", href: "tel:911", urgent: true },
        { title: "988", href: "tel:988" },
        { title: "741741", href: spanish ? "sms:741741?&body=AYUDA" : "sms:741741?&body=HOME" },
        { title: "211", href: "tel:211" },
        { title: "1-800-GAMBLER", href: "tel:+18004262537" },
      ],
      resources: [
        { id: "nfcc", href: "https://www.nfcc.org/", source: "nfcc.org", phone: "1-800-388-2227" },
        { id: "legal", href: "https://www.lawhelp.org/", source: "LawHelp.org" },
        { id: "cfpb", href: spanish ? "https://www.consumerfinance.gov/es/" : "https://www.consumerfinance.gov/consumer-tools/debt-collection/", source: "consumerfinance.gov" },
        { id: "housing", href: "https://www.hud.gov/stat/sfh/housing-counseling", source: "hud.gov", phone: "1-800-569-4287" },
        { id: "help211", href: "https://www.211.org/", source: "211.org", phone: "211", usesCity: true },
        { id: "utilities", href: "https://www.acf.hhs.gov/ocs/programs/liheap", source: "acf.hhs.gov" },
        {
          id: "local",
          href: googleSearch(spanish ? "ayuda de emergencia alquiler banco de comida" : "emergency rental assistance food bank"),
          usesCity: true,
        },
      ],
      resalePlatforms: [
        { name: "Facebook Marketplace", href: "https://www.facebook.com/marketplace/" },
        { name: "OfferUp", href: "https://offerup.com/" },
        { name: "eBay", href: "https://www.ebay.com/" },
        { name: "Mercari", href: "https://www.mercari.com/" },
        { name: "Poshmark", href: "https://poshmark.com/" },
      ],
      templateIds: ["emotional", "request", "loan", "bank"],
    };
  }

  return {
    region: "PL",
    actionRewards: true,
    defaultCity: "Warszawa",
    safetyLinks: [
      { label: "112", href: "tel:112", detail: "emergencyDetail" },
      { label: "116 123", href: "tel:116123", detail: "mentalDetail" },
      { label: "116sos.pl", href: "https://116sos.pl/", detail: "onlineDetail" },
    ],
    emotionalContacts: [
      { title: "112", href: "tel:112", urgent: true },
      { title: "116 123", href: "tel:116123" },
      { title: "800 70 2222", href: "tel:800702222" },
      { title: "116sos.pl", href: "https://116sos.pl/otrzymaj-pomoc/telefon" },
      { href: "https://www.gov.pl/web/zdrowie/centra-zdrowia-psychicznego" },
    ],
    // The institutions are Polish, so the search phrases stay in Polish.
    resources: [
      { id: "oik", href: googleSearch("Ośrodek Interwencji Kryzysowej"), usesCity: true },
      { id: "legal", href: "https://zapisy-np.ms.gov.pl/", source: "gov.pl" },
      { id: "mops", href: googleSearch("MOPS OPS zasiłek celowy"), source: "gov.pl", usesCity: true },
      { id: "zus", href: "https://www.zus.pl/firmy/ulgi/ulgi-w-splacie-naleznosci" },
      { id: "alimony", href: "https://www.gov.pl/web/gov/uzyskaj-swiadczenia-z-funduszu-alimentacyjnego", source: "gov.pl" },
      { id: "credit", href: "https://www.bgk.pl/produkty/fundusz-wsparcia-kredytobiorcow/", source: "BGK" },
      { id: "cityOffice", href: googleSearch("urząd miasta gminy pomoc kryzysowa"), usesCity: true },
    ],
    resalePlatforms: [
      { name: "Vinted", href: "https://www.vinted.pl/" },
      { name: "OLX", href: "https://www.olx.pl/" },
      { name: "Allegro Lokalnie", href: "https://allegrolokalnie.pl/" },
      { name: "Facebook Marketplace", href: "https://www.facebook.com/marketplace/" },
      { name: "eBay", href: "https://www.ebay.pl/" },
    ],
    templateIds: ["emotional", "request", "loan", "bank", "mops"],
  };
}

const pl: CrisisCopy = {
  regionNotice: "Numery telefonów, instytucje i wzory pism na tej stronie dotyczą Polski.",
  eyebrow: "Kryzys finansowy",
  title: "Plan awaryjny, kiedy kończą się pieniądze.",
  description:
    "Coach FI pomaga zatrzymać panikę, znaleźć bezpłatną pomoc, skontaktować się z instytucjami i odzyskać pierwszą gotówkę bez pogłębiania długu.",
  voiceText: [
    "Plan kryzysu finansowego Coach FI.",
    "Najpierw zabezpiecz życie, zdrowie, jedzenie, leki, dach nad głową i kontakt z drugim człowiekiem.",
    "Jeśli masz myśli samobójcze albo boisz się, że zrobisz sobie krzywdę, dzwoń pod 112 albo 116 123.",
    "Długi można porządkować krok po kroku. Nie musisz przechodzić przez to sam.",
    "Nie bierz kolejnej drogiej pożyczki pod presją.",
    "Skontaktuj się z bezpłatną pomocą prawną, MOPS lub OPS, bankiem i najbliższą zaufaną osobą.",
    "Wystaw nieużywane rzeczy na sprzedaż, aby odzyskać pierwszą gotówkę bez zwiększania długu.",
  ],
  safety: {
    title: "Najpierw bezpieczeństwo",
    body: "Jeśli jest zagrożenie życia, zdrowia, przemocy albo bezpośrednie niebezpieczeństwo, dzwoń pod 112. Jeśli jesteś w kryzysie psychicznym, skorzystaj z telefonu 116 123 lub centrumwsparcia.pl.",
    emergencyDetail: "alarmowo",
    mentalDetail: "kryzys psychiczny",
    onlineDetail: "online",
  },
  tokens: {
    title: "Tokeny za działanie",
    description: "Każdy wykonany krok SOS daje +{reward} Coach FI Tokens.",
    readPlan: "Odczytaj plan SOS",
  },
  emotional: {
    eyebrow: "Najpierw człowiek, potem dług",
    title: "Gdy długi powodują załamanie, depresję albo myśli samobójcze",
    description:
      "Ten moduł jest dla dorosłych. Jeśli czujesz, że nie wytrzymasz, nie zostawaj sam/a z tym stanem. Zadzwoń, napisz do kogoś zaufanego, poproś, żeby ktoś z Tobą został. Dług jest problemem do rozwiązania, ale najpierw trzeba zadbać o bezpieczeństwo.",
    voiceText:
      "Jeśli długi powodują załamanie, depresję albo myśli samobójcze, najpierw zadbaj o bezpieczeństwo. Zadzwoń pod 112, jeśli możesz zrobić sobie krzywdę. Zadzwoń pod 116 123 albo 800 70 2222, jeśli potrzebujesz rozmowy z kimś teraz. Nie musisz przechodzić przez to sam.",
    voiceLabel: "Odczytaj pomoc teraz",
    mentalHealthCentre: "Centrum Zdrowia Psychicznego",
    contacts: [
      {
        subtitle: "Natychmiastowe zagrożenie życia lub zdrowia",
        body: "Dzwoń od razu, jeśli możesz zrobić sobie krzywdę, jesteś w bezpośrednim zagrożeniu albo ktoś obok Ciebie jest zagrożony.",
        cta: "Dzwoń 112",
      },
      {
        subtitle: "Telefon zaufania dla dorosłych",
        body: "Bezpłatna, anonimowa pomoc dla osób dorosłych w kryzysie psychicznym i emocjonalnym.",
        cta: "Dzwoń 116 123",
      },
      {
        subtitle: "Centrum Wsparcia dla dorosłych",
        body: "Całodobowe wsparcie psychologiczne dla osób dorosłych w kryzysie psychicznym.",
        cta: "Dzwoń 800 70 2222",
      },
      {
        subtitle: "Pomoc online",
        body: "Platforma dla dorosłych: telefon, informacje, pomoc online i baza miejsc wsparcia.",
        cta: "Otwórz 116sos.pl",
      },
      {
        subtitle: "Bezpłatna pomoc bez skierowania",
        body: "Dorosła osoba może szukać wsparcia w CZP właściwym dla miejsca zamieszkania, także w nagłej sytuacji.",
        cta: "Znajdź CZP",
      },
    ],
    steps: [
      {
        title: "1. Powiedz komuś",
        body: "Wyślij krótką wiadomość: jestem w kryzysie i potrzebuję, żebyś był/a ze mną w kontakcie.",
      },
      {
        title: "2. Oddal ryzyko",
        body: "Odsuń od siebie rzeczy, którymi możesz sobie zrobić krzywdę. Przejdź do miejsca, gdzie są inni ludzie.",
      },
      {
        title: "3. Zrób jeden telefon",
        body: "Nie musisz umieć wszystkiego wyjaśnić. Powiedz tylko: mam kryzys, potrzebuję pomocy teraz. W nagłym zagrożeniu możesz też dzwonić 999 albo jechać na SOR.",
      },
    ],
  },
  city: {
    title: "Znajdź pomoc w swoim mieście",
    description:
      "Wpisz miasto. Coach FI podpowie, gdzie szukać OIK, MOPS/OPS, darmowej pomocy prawnej i wsparcia kredytobiorców.",
    label: "Twoje miasto",
    placeholder: "np. Warszawa, Kraków, Gdańsk",
    fallback: "moje miasto",
  },
  resources: {
    source: "Źródło",
    oikPhone: "lokalny numer OIK",
    items: {
      oik: {
        title: "Ośrodek Interwencji Kryzysowej",
        body: "Pomoc w kryzysie, rozmowa, interwencja, czasem schronienie lub wsparcie psychologiczne. Szukaj lokalnego OIK.",
        cta: "Szukaj OIK: {city}",
      },
      legal: {
        title: "Nieodpłatna pomoc prawna",
        body: "Publiczne punkty w całej Polsce. Można uzyskać poradę prawną, obywatelską lub mediację.",
        cta: "Umów poradę",
      },
      mops: {
        title: "MOPS / OPS",
        body: "Zapytaj o zasiłek celowy, żywność, leki, opał, czynsz i kontakt z pracownikiem socjalnym.",
        cta: "Szukaj MOPS/OPS: {city}",
      },
      zus: {
        title: "ZUS",
        body: "Jeśli prowadzisz firmę lub masz zaległości składkowe, sprawdź odroczenie, raty albo ulgę w spłacie.",
        cta: "Sprawdź ulgi ZUS",
      },
      alimony: {
        title: "Alimenty i fundusz alimentacyjny",
        body: "Jeśli ktoś powinien partycypować w utrzymaniu dziecka lub rodziny, sprawdź alimenty i świadczenia.",
        cta: "Sprawdź fundusz",
      },
      credit: {
        title: "Kredyt hipoteczny i raty",
        body: "Sprawdź w banku wakacje kredytowe, restrukturyzację, karencję oraz Fundusz Wsparcia Kredytobiorców.",
        cta: "Sprawdź FWK",
      },
      cityOffice: {
        title: "Urząd miasta lub gminy",
        body: "Lokalne strony często publikują aktualne numery do OIK, MOPS, punktów prawnych i pomocy żywnościowej.",
        cta: "Szukaj lokalnie",
      },
    },
  },
  firstDay: {
    title: "Pierwsze 24 godziny",
    description: "Zrób małe kroki w dobrej kolejności. Nie rozwiązuj wszystkiego naraz.",
    done: "Wykonane",
    reward: "+{reward} tokenów",
    steps: [
      {
        title: "Napisz do najbliższej osoby",
        body: "Poproś o krótką pożyczkę tylko na podstawowe potrzeby. Ustal termin zwrotu i spisz prostą umowę.",
      },
      {
        title: "Skontaktuj się z bankiem lub wierzycielem",
        body: "Poproś o restrukturyzację, karencję, raty lub sprawdzenie dostępnych wakacji kredytowych.",
      },
      {
        title: "Umów darmową pomoc prawną",
        body: "Nie ignoruj pism z sądu, komornika lub banku. Prawnik pomoże ustalić kolejność działań.",
      },
      {
        title: "Sprawdź MOPS/OPS",
        body: "Zapytaj o zasiłek celowy, żywność, leki, opał, czynsz albo inną pomoc bytową.",
      },
      {
        title: "Wystaw 3 nieużywane rzeczy",
        body: "Odzyskaj pierwszą gotówkę bez nowego długu. Zacznij od ubrań, elektroniki i sprzętów.",
      },
    ],
  },
  avoid: {
    title: "Czego nie robić w panice",
    items: [
      "Nie bierz chwilówki tylko po to, żeby spłacić inną chwilówkę.",
      "Nie ignoruj listów z banku, sądu, komornika ani ZUS.",
      "Nie obiecuj rodzinie zwrotu bez daty, kwoty i prostych warunków.",
      "Nie sprzedawaj rzeczy potrzebnych do pracy lub zdrowia.",
      "Nie podpisuj ugody, której kosztów nie rozumiesz.",
    ],
  },
  templates: {
    title: "Wzory wiadomości i wniosków",
    description: "To są edukacyjne szkice do dopasowania. W sprawach prawnych skorzystaj z bezpłatnej pomocy prawnej.",
    copy: "Kopiuj",
    copied: "Skopiowano",
    polishDocumentNote: "Wzór po polsku — w tej formie składa się go w polskich instytucjach.",
    titles: {
      emotional: "Wiadomość do bliskiej osoby w załamaniu",
      request: "Prośba o pożyczkę do bliskiej osoby",
      loan: "Prosty wzór umowy pożyczki",
      bank: "Wniosek do banku o ulgę w spłacie",
      mops: "Wniosek do MOPS/OPS o pomoc",
    },
    emotionalText:
      "Cześć [IMIĘ],\n\njestem w bardzo trudnym momencie. Długi i stres mnie przerastają. Nie proszę Cię teraz o rozwiązanie wszystkiego.\n\nPotrzebuję, żeby ktoś był ze mną w kontakcie przez najbliższą godzinę.\nCzy możesz do mnie zadzwonić albo odpisać?\n\nJeśli nie odpisuję, proszę spróbuj ponownie albo zadzwoń po pomoc.\nChcę przejść przez ten moment bezpiecznie.",
    requestText:
      "Cześć [IMIĘ],\n\npiszę, bo mam pilną sytuację finansową i potrzebuję pomocy na podstawowe wydatki: [jedzenie/leki/czynsz/dojazd].\n\nCzy możesz pożyczyć mi [KWOTA] zł do dnia [DATA ZWROTU]?\nChcę zrobić to uczciwie i jasno, dlatego mogę od razu wysłać prostą umowę pożyczki z terminem zwrotu.\n\nNie proszę o prezent. Proszę o krótką pomoc, którą oddam w ustalonym terminie.\nDziękuję, że to czytasz.",
  },
  resale: {
    title: "Odzyskaj gotówkę przez reselling",
    description: "Najszybszy mały zastrzyk gotówki często jest w rzeczach, których już nie używasz.",
    voiceText:
      "Wystaw trzy nieużywane rzeczy. Ubrania i dodatki sprawdź na Vinted. Większe rzeczy lokalne na OLX albo Facebook Marketplace. Elektronikę i rzeczy o wyższej wartości porównaj na Allegro Lokalnie.",
    voiceLabel: "Odczytaj reselling",
    platforms: [
      { bestFor: "Ubrania, buty, dodatki, rzeczy lifestyle.", tip: "Najpierw wystaw rzeczy, których nie użyłeś od 90 dni." },
      {
        bestFor: "Meble, AGD, elektronika, rowery, większe rzeczy lokalnie.",
        tip: "Dobre zdjęcia i odbiór osobisty często przyspieszają sprzedaż.",
      },
      {
        bestFor: "Elektronika, książki, hobby, przedmioty o wyższej wartości.",
        tip: "Warto porównać cenę z podobnymi aktywnymi ogłoszeniami.",
      },
      {
        bestFor: "Szybka sprzedaż lokalna i grupy osiedlowe.",
        tip: "Nie klikaj podejrzanych linków od kupujących. Trzymaj płatność w bezpiecznym kanale.",
      },
      {
        bestFor: "Kolekcje, elektronika, niszowe rzeczy z potencjałem międzynarodowym.",
        tip: "Uwzględnij prowizje, wysyłkę i czas obsługi zamówienia.",
      },
    ],
  },
};

const en: CrisisCopy = {
  regionNotice:
    "These phone numbers and services are for the United States. If you're somewhere else, call your local emergency number.",
  eyebrow: "Money crisis help",
  title: "A plan for when the money runs out.",
  description:
    "Slow the panic down, find free help, talk to the right people and raise your first bit of cash — without going deeper into debt.",
  voiceText: [
    "CoachfiAI money crisis plan.",
    "First, protect your life and health, food, medicine, a roof over your head and contact with another person.",
    "If you're thinking about suicide or might hurt yourself, call or text 988, or chat at 988lifeline.org. It's free and open 24/7. If you're in immediate danger, call 911.",
    "Debt can be worked out step by step. You don't have to go through this alone.",
    "Don't take out another expensive loan under pressure.",
    "Reach out to a nonprofit credit counselor, free legal aid, 211 for local help, your lender and the person you trust most.",
    "List a few things you don't use and sell them, so you can raise some cash without adding debt.",
  ],
  safety: {
    title: "Safety first",
    body: "If you're thinking about suicide or might hurt yourself, call or text 988, or chat at 988lifeline.org. It's free and open 24/7. If you're in immediate danger, call 911.",
    emergencyDetail: "emergency",
    mentalDetail: "call or text, 24/7",
    onlineDetail: "online chat",
  },
  tokens: {
    title: "Hear this plan",
    description: "Mila can read the steps on this page out loud.",
    readPlan: "Read the plan aloud",
  },
  emotional: {
    eyebrow: "You first, the debt second",
    title: "When debt leads to panic, depression or thoughts of suicide",
    description:
      "This section is for adults. If you feel you can't cope, don't stay alone with it. Call or text someone you trust and ask them to stay with you. Debt is a problem that can be solved — but your safety comes first.",
    voiceText:
      "If debt is causing panic, depression or thoughts of suicide, take care of your safety first. If you're thinking about suicide or might hurt yourself, call or text 988, or chat at 988lifeline.org. It's free and open 24/7. If you're in immediate danger, call 911. You can also text HOME to 741741. You don't have to go through this alone.",
    voiceLabel: "Read help now",
    contacts: [
      {
        subtitle: "Immediate danger",
        body: "Call right away if you might hurt yourself, you're in immediate danger, or someone near you is at risk.",
        cta: "Call 911",
      },
      {
        subtitle: "988 Suicide & Crisis Lifeline",
        body: "Free, confidential support 24/7 by call, text or chat at 988lifeline.org. Veterans: press 1. Spanish: press 2.",
        cta: "Call or text 988",
      },
      {
        subtitle: "Crisis Text Line",
        body: "Text with a trained crisis counselor. Free and open 24/7.",
        cta: "Text HOME to 741741",
      },
      {
        subtitle: "Local help with rent, food and utilities",
        body: "211 connects you with local programs for rent, food, utility bills and other basics. Free and confidential.",
        cta: "Call 211",
      },
      {
        subtitle: "Gambling problem",
        body: "Free, confidential help with gambling and gambling debt. You can also call or text 1-800-MY-RESET (1-800-697-3738).",
        cta: "Call 1-800-GAMBLER",
      },
    ],
    steps: [
      {
        title: "1. Tell someone",
        body: "Send a short message: I'm in a crisis and I need you to stay in touch with me.",
      },
      {
        title: "2. Move away from danger",
        body: "Put away anything you could hurt yourself with. Go somewhere other people are.",
      },
      {
        title: "3. Make one call",
        body: "You don't have to explain everything. Just say: I'm in a crisis and I need help now. In an emergency, call 911 or go to the nearest emergency room.",
      },
    ],
  },
  city: {
    title: "Find help near you",
    description:
      "Enter your city or ZIP code. We'll point you to nonprofit credit counseling, free legal aid, housing counseling and local help with bills.",
    label: "City or ZIP code",
    placeholder: "e.g., Columbus, OH",
    fallback: "your area",
  },
  resources: {
    source: "Source",
    items: {
      nfcc: {
        title: "Nonprofit credit counseling (NFCC)",
        body: "A certified counselor can review your budget and debts for free or at low cost, and explain options like a debt management plan.",
        cta: "Find a counselor",
      },
      legal: {
        title: "Free legal aid",
        body: "Nonprofit legal aid can help with debt collection lawsuits, eviction, wage garnishment and more. Find help in your state.",
        cta: "Find legal aid",
      },
      cfpb: {
        title: "Your rights with debt collectors",
        body: "Debt collectors have to follow federal rules. Learn what they can and can't do, and file a complaint if you need to.",
        cta: "Know your rights (CFPB)",
      },
      housing: {
        title: "HUD-approved housing counseling",
        body: "Behind on rent or your mortgage? A HUD-approved counselor can help for free or at low cost.",
        cta: "Find a housing counselor",
      },
      help211: {
        title: "211: local help with the basics",
        body: "Rent, food, utility bills, child care and more. 211 connects you with programs in {city}.",
        cta: "Find your local 211",
      },
      utilities: {
        title: "Help with energy bills (LIHEAP)",
        body: "The Low Income Home Energy Assistance Program helps pay heating and cooling bills. Ask 211 or your utility company how to apply.",
        cta: "Learn about LIHEAP",
      },
      local: {
        title: "Emergency help near you",
        body: "Search for emergency rental assistance, food banks and community action agencies.",
        cta: "Search for help in {city}",
      },
    },
  },
  firstDay: {
    title: "The first 24 hours",
    description: "Take small steps in the right order. You don't have to solve everything at once.",
    done: "Done",
    reward: "Mark as done",
    steps: [
      {
        title: "Reach out to someone you trust",
        body: "Tell them what's going on. If you ask to borrow money, keep it to the basics and agree on a repayment date in writing.",
      },
      {
        title: "Call your lender or creditor",
        body: "Ask about a hardship program, a lower payment, a new due date or a short pause. Ask them to confirm it in writing.",
      },
      {
        title: "Talk to a nonprofit credit counselor",
        body: "An NFCC member agency can review your budget and debts. Avoid companies that charge upfront fees to \"settle\" your debt.",
      },
      {
        title: "Call 211",
        body: "Ask about local help with rent, food, utility bills and transportation.",
      },
      {
        title: "List 3 things you don't use",
        body: "Raise some cash without new debt. Start with clothes, electronics and small appliances.",
      },
    ],
  },
  avoid: {
    title: "What not to do in a panic",
    items: [
      "Don't take out a payday loan to pay off another payday loan.",
      "Don't ignore letters from your lender, a court or a debt collector.",
      "Don't pay a company upfront fees to settle or \"erase\" your debt.",
      "Don't sell things you need for work or your health.",
      "Don't sign anything whose costs you don't understand.",
    ],
  },
  templates: {
    title: "Message and letter templates",
    description:
      "Educational drafts to adapt. Never put your Social Security number or full account numbers in a message. For legal questions, contact free legal aid.",
    copy: "Copy",
    copied: "Copied",
    titles: {
      emotional: "Message to someone close when you're struggling",
      request: "Asking someone close for a short-term loan",
      loan: "Simple family loan agreement",
      bank: "Hardship request to your lender",
    },
    emotionalText:
      "Hi [NAME],\n\nI'm in a really hard place. The debt and the stress are too much for me right now. I'm not asking you to fix everything.\n\nI need someone to stay in touch with me for the next hour.\nCan you call me or text me back?\n\nIf I don't answer, please try again or call for help.\nI want to get through this safely.",
    requestText:
      "Hi [NAME],\n\nI'm writing because I'm in an urgent money situation and I need help with basic costs: [food/medicine/rent/transportation].\n\nCould you lend me $[AMOUNT] until [REPAYMENT DATE]?\nI want to keep this fair and clear, so I can send you a simple written agreement with the repayment date right away.\n\nI'm not asking for a gift. I'm asking for short-term help that I'll pay back on the date we agree on.\nThank you for reading this.",
    loanText:
      "FAMILY LOAN AGREEMENT\n\nDate: [DATE]\nLender: [FULL NAME]\nBorrower: [FULL NAME]\n\n1. The Lender is lending the Borrower $[AMOUNT].\n2. The Borrower will repay the full amount by [REPAYMENT DATE] (or in payments of $[AMOUNT] on [DATES]).\n3. Repayment will be made by [bank transfer / payment app / cash with a written receipt].\n4. No interest will be charged unless written here: [TERMS].\n5. If the Borrower can't make a payment on time, both sides will talk before the due date and write down any new date.\n\nLender signature: ____________________\nBorrower signature: ____________________\n\nThis is a simple educational template, not legal advice. Rules differ by state.",
    bankText:
      "HARDSHIP REQUEST\n\nDate: [DATE]\nTo: [LENDER OR CREDITOR NAME]\nAccount ending in: [LAST 4 DIGITS]\nName: [FULL NAME]\nPhone or email: [CONTACT]\n\nI'm writing to ask for help because of a financial hardship. My income dropped because of [JOB LOSS / ILLNESS / FEWER HOURS / OTHER] starting [DATE].\n\nI want to keep paying and avoid falling behind. Please tell me whether I qualify for any of these:\n- a temporary lower payment or a pause (forbearance)\n- a lower interest rate or waived late fees\n- a longer repayment plan or a loan modification\n- a different due date\n\nRight now I can pay $[AMOUNT] a month. Please reply in writing and tell me which documents you need.\n\nThank you,\n[NAME]",
  },
  resale: {
    title: "Raise cash by selling things",
    description: "The fastest small cash boost is often in things you no longer use.",
    voiceText:
      "List three things you don't use. Try Facebook Marketplace or OfferUp for bigger local items, eBay or Mercari for electronics and collectibles, and Poshmark for clothes and accessories. Meet buyers in a public place.",
    voiceLabel: "Read selling tips",
    platforms: [
      {
        bestFor: "Furniture, appliances, bikes and bigger items sold locally.",
        tip: "Good photos and local pickup speed up the sale. Meet buyers in a public place.",
      },
      {
        bestFor: "Fast local sales of everyday items.",
        tip: "Never accept an overpayment or click a link a buyer sends you.",
      },
      {
        bestFor: "Electronics, collectibles and higher-value items.",
        tip: "Compare your price with recently sold listings.",
      },
      {
        bestFor: "Electronics, games, books and household items shipped nationwide.",
        tip: "Factor in fees and shipping before you set a price.",
      },
      {
        bestFor: "Clothes, shoes and accessories.",
        tip: "Start with what you haven't worn in 90 days.",
      },
    ],
  },
};

const es: CrisisCopy = {
  regionNotice:
    "Estos números y servicios son para los Estados Unidos. Si estás en otro país, llama al número de emergencias local.",
  eyebrow: "Ayuda en una crisis de dinero",
  title: "Un plan para cuando se acaba el dinero.",
  description:
    "Frena el pánico, encuentra ayuda gratuita, habla con las personas adecuadas y consigue algo de dinero sin endeudarte más.",
  voiceText: [
    "Plan de crisis financiera de CoachfiAI.",
    "Primero, protege tu vida y tu salud, la comida, los medicamentos, un techo y el contacto con otra persona.",
    "Si piensas en el suicidio o temes hacerte daño, llama o envía un mensaje de texto al 988 y marca 2 para hablar en español. Es gratis, confidencial y funciona las 24 horas. Si estás en peligro inmediato, llama al 911.",
    "Las deudas se pueden ordenar paso a paso. No tienes que pasar por esto a solas.",
    "No pidas otro préstamo caro bajo presión.",
    "Busca a un consejero de crédito sin fines de lucro, asistencia legal gratuita, el 211 para ayuda local, a tu prestamista y a la persona en quien más confías.",
    "Haz una lista de cosas que no usas y véndelas para conseguir algo de dinero sin deuda nueva.",
  ],
  safety: {
    title: "Primero, la seguridad",
    body: "Si piensas en el suicidio o temes hacerte daño, llama o envía un mensaje de texto al 988 (marca 2 para español) o chatea en 988lifeline.org. Es gratis y funciona las 24 horas. Si estás en peligro inmediato, llama al 911.",
    emergencyDetail: "emergencias",
    mentalDetail: "llamada o texto, 24/7",
    onlineDetail: "chat en línea",
  },
  tokens: {
    title: "Escucha este plan",
    description: "Mila puede leer en voz alta los pasos de esta página.",
    readPlan: "Leer el plan en voz alta",
  },
  emotional: {
    eyebrow: "Primero tú, después la deuda",
    title: "Cuando las deudas causan pánico, depresión o pensamientos suicidas",
    description:
      "Esta sección es para adultos. Si sientes que no puedes más, no te quedes a solas con ello. Llama o escribe a alguien de confianza y pídele que se quede contigo. La deuda es un problema que se puede resolver, pero primero va tu seguridad.",
    voiceText:
      "Si las deudas te causan pánico, depresión o pensamientos suicidas, primero cuida tu seguridad. Llama o envía un mensaje de texto al 988 y marca 2 para español. Es gratis y funciona las 24 horas. Si estás en peligro inmediato, llama al 911. También puedes enviar la palabra AYUDA al 741741. No tienes que pasar por esto a solas.",
    voiceLabel: "Leer la ayuda ahora",
    contacts: [
      {
        subtitle: "Peligro inmediato",
        body: "Llama de inmediato si puedes hacerte daño, estás en peligro o alguien a tu lado corre riesgo.",
        cta: "Llamar al 911",
      },
      {
        subtitle: "988 Línea de Prevención del Suicidio y Crisis",
        body: "Apoyo gratuito y confidencial las 24 horas por llamada, texto o chat. Marca 2 para español. Veteranos: marca 1.",
        cta: "Llamar o escribir al 988",
      },
      {
        subtitle: "Crisis Text Line en español",
        body: "Escribe con un consejero bilingüe capacitado, gratis y las 24 horas. También por WhatsApp: 442-AYUDAME.",
        cta: "Envía AYUDA al 741741",
      },
      {
        subtitle: "Ayuda local con alquiler, comida y servicios",
        body: "El 211 te conecta con programas locales para el alquiler, la comida, las facturas de servicios y otras necesidades. Gratis y confidencial.",
        cta: "Llamar al 211",
      },
      {
        subtitle: "Problemas con el juego",
        body: "Ayuda gratuita y confidencial con el juego y las deudas de juego. También puedes llamar o escribir al 1-800-MY-RESET (1-800-697-3738).",
        cta: "Llamar al 1-800-GAMBLER",
      },
    ],
    steps: [
      {
        title: "1. Díselo a alguien",
        body: "Envía un mensaje corto: estoy en crisis y necesito que sigas en contacto conmigo.",
      },
      {
        title: "2. Aléjate del peligro",
        body: "Aparta las cosas con las que podrías hacerte daño. Ve a un lugar donde haya otras personas.",
      },
      {
        title: "3. Haz una llamada",
        body: "No tienes que explicarlo todo. Di solo: estoy en crisis y necesito ayuda ahora. En una emergencia, llama al 911 o ve a la sala de emergencias más cercana.",
      },
    ],
  },
  city: {
    title: "Busca ayuda cerca de ti",
    description:
      "Escribe tu ciudad o código postal. Te indicaremos dónde buscar asesoría de crédito sin fines de lucro, asistencia legal gratuita, asesoría de vivienda y ayuda local con las facturas.",
    label: "Ciudad o código postal",
    placeholder: "p. ej., Houston, TX",
    fallback: "tu zona",
  },
  resources: {
    source: "Fuente",
    items: {
      nfcc: {
        title: "Asesoría de crédito sin fines de lucro (NFCC)",
        body: "Un consejero certificado puede revisar tu presupuesto y tus deudas gratis o a bajo costo, y explicarte opciones como un plan de manejo de deudas.",
        cta: "Buscar un consejero",
      },
      legal: {
        title: "Asistencia legal gratuita",
        body: "La asistencia legal sin fines de lucro puede ayudarte con demandas por deudas, desalojos, embargos de salario y más. Busca ayuda en tu estado.",
        cta: "Buscar asistencia legal",
      },
      cfpb: {
        title: "Tus derechos ante los cobradores de deudas",
        body: "Los cobradores de deudas deben seguir reglas federales. Aprende qué pueden y qué no pueden hacer, y presenta una queja si hace falta.",
        cta: "Conoce tus derechos (CFPB)",
      },
      housing: {
        title: "Asesoría de vivienda aprobada por HUD",
        body: "¿Atrasado con el alquiler o la hipoteca? Un consejero aprobado por HUD puede ayudarte gratis o a bajo costo.",
        cta: "Buscar un consejero de vivienda",
      },
      help211: {
        title: "211: ayuda local con lo básico",
        body: "Alquiler, comida, facturas de servicios, cuidado infantil y más. El 211 te conecta con programas en {city}.",
        cta: "Busca tu 211 local",
      },
      utilities: {
        title: "Ayuda con las facturas de energía (LIHEAP)",
        body: "El Programa de Asistencia de Energía para Hogares de Bajos Ingresos ayuda a pagar la calefacción y el aire acondicionado. Pregunta al 211 o a tu compañía de servicios cómo solicitarlo.",
        cta: "Información sobre LIHEAP",
      },
      local: {
        title: "Ayuda de emergencia cerca de ti",
        body: "Busca programas de ayuda con el alquiler, bancos de comida y agencias de acción comunitaria.",
        cta: "Buscar ayuda en {city}",
      },
    },
  },
  firstDay: {
    title: "Las primeras 24 horas",
    description: "Da pasos pequeños en el orden correcto. No tienes que resolverlo todo a la vez.",
    done: "Hecho",
    reward: "Marcar como hecho",
    steps: [
      {
        title: "Habla con alguien de confianza",
        body: "Cuéntale lo que pasa. Si pides dinero prestado, que sea solo para lo básico y acuerden por escrito una fecha de devolución.",
      },
      {
        title: "Llama a tu prestamista o acreedor",
        body: "Pregunta por un programa para dificultades económicas, un pago más bajo, otra fecha de pago o una pausa breve. Pide que te lo confirmen por escrito.",
      },
      {
        title: "Habla con un consejero de crédito sin fines de lucro",
        body: "Una agencia miembro de la NFCC puede revisar tu presupuesto y tus deudas. Evita las empresas que cobran por adelantado para \"liquidar\" deudas.",
      },
      {
        title: "Llama al 211",
        body: "Pregunta por ayuda local con el alquiler, la comida, las facturas de servicios y el transporte.",
      },
      {
        title: "Haz una lista de 3 cosas que no usas",
        body: "Consigue algo de dinero sin deuda nueva. Empieza por ropa, electrónica y electrodomésticos pequeños.",
      },
    ],
  },
  avoid: {
    title: "Qué no hacer con pánico",
    items: [
      "No pidas un préstamo de día de pago (payday loan) para pagar otro.",
      "No ignores las cartas de tu prestamista, de un tribunal o de un cobrador de deudas.",
      "No pagues por adelantado a una empresa que promete liquidar o \"borrar\" tus deudas.",
      "No vendas cosas que necesitas para trabajar o para tu salud.",
      "No firmes nada cuyos costos no entiendas.",
    ],
  },
  templates: {
    title: "Modelos de mensajes y cartas",
    description:
      "Son borradores educativos para adaptar. Nunca pongas tu número de Seguro Social ni números de cuenta completos en un mensaje. Para asuntos legales, busca asistencia legal gratuita.",
    copy: "Copiar",
    copied: "Copiado",
    titles: {
      emotional: "Mensaje a alguien cercano cuando lo estás pasando mal",
      request: "Pedir un préstamo breve a alguien cercano",
      loan: "Acuerdo sencillo de préstamo familiar",
      bank: "Solicitud a tu prestamista por dificultades económicas",
    },
    emotionalText:
      "Hola, [NOMBRE]:\n\nestoy pasando por un momento muy difícil. Las deudas y el estrés me superan. No te pido que lo resuelvas todo.\n\nNecesito que alguien esté en contacto conmigo durante la próxima hora.\n¿Puedes llamarme o contestarme?\n\nSi no respondo, por favor inténtalo de nuevo o pide ayuda.\nQuiero pasar este momento de forma segura.",
    requestText:
      "Hola, [NOMBRE]:\n\nte escribo porque tengo una situación económica urgente y necesito ayuda con gastos básicos: [comida/medicamentos/alquiler/transporte].\n\n¿Podrías prestarme $[CANTIDAD] hasta el [FECHA DE DEVOLUCIÓN]?\nQuiero hacerlo de forma justa y clara, así que puedo enviarte ya un acuerdo sencillo por escrito con la fecha de devolución.\n\nNo te pido un regalo. Te pido una ayuda breve que devolveré en la fecha que acordemos.\nGracias por leer esto.",
    loanText:
      "ACUERDO DE PRÉSTAMO FAMILIAR\n\nFecha: [FECHA]\nPrestamista: [NOMBRE COMPLETO]\nPrestatario: [NOMBRE COMPLETO]\n\n1. El Prestamista presta al Prestatario $[CANTIDAD].\n2. El Prestatario devolverá la cantidad completa a más tardar el [FECHA DE DEVOLUCIÓN] (o en pagos de $[CANTIDAD] en [FECHAS]).\n3. La devolución se hará por [transferencia bancaria / aplicación de pagos / efectivo con recibo por escrito].\n4. No se cobrarán intereses, salvo que se indique aquí: [CONDICIONES].\n5. Si el Prestatario no puede pagar a tiempo, ambas partes hablarán antes de la fecha de pago y anotarán la nueva fecha.\n\nFirma del Prestamista: ____________________\nFirma del Prestatario: ____________________\n\nEs un modelo educativo sencillo, no asesoría legal. Las reglas varían según el estado.",
    bankText:
      "SOLICITUD POR DIFICULTADES ECONÓMICAS\n\nFecha: [FECHA]\nPara: [NOMBRE DEL PRESTAMISTA O ACREEDOR]\nCuenta que termina en: [ÚLTIMOS 4 DÍGITOS]\nNombre: [NOMBRE COMPLETO]\nTeléfono o correo: [CONTACTO]\n\nLes escribo para pedir ayuda por una dificultad económica. Mis ingresos bajaron por [PÉRDIDA DE EMPLEO / ENFERMEDAD / MENOS HORAS / OTRO] desde el [FECHA].\n\nQuiero seguir pagando y no atrasarme. Por favor, díganme si califico para alguna de estas opciones:\n- un pago más bajo por un tiempo o una pausa (forbearance)\n- una tasa de interés más baja o la exención de cargos por pago tardío\n- un plan de pagos más largo o una modificación del préstamo\n- otra fecha de pago\n\nAhora mismo puedo pagar $[CANTIDAD] al mes. Por favor, respondan por escrito e indíquenme qué documentos necesitan.\n\nGracias,\n[NOMBRE]",
  },
  resale: {
    title: "Consigue dinero vendiendo cosas",
    description: "El ingreso pequeño más rápido suele estar en cosas que ya no usas.",
    voiceText:
      "Haz una lista de tres cosas que no usas. Prueba Facebook Marketplace u OfferUp para cosas grandes de venta local, eBay o Mercari para electrónica y coleccionables, y Poshmark para ropa y accesorios. Reúnete con los compradores en un lugar público.",
    voiceLabel: "Leer consejos de venta",
    platforms: [
      {
        bestFor: "Muebles, electrodomésticos, bicicletas y cosas grandes de venta local.",
        tip: "Unas buenas fotos y la recogida en persona aceleran la venta. Reúnete en un lugar público.",
      },
      {
        bestFor: "Ventas locales rápidas de artículos del día a día.",
        tip: "Nunca aceptes un pago de más ni hagas clic en enlaces que te envíe un comprador.",
      },
      {
        bestFor: "Electrónica, coleccionables y artículos de más valor.",
        tip: "Compara tu precio con anuncios que ya se vendieron.",
      },
      {
        bestFor: "Electrónica, juegos, libros y artículos del hogar con envío a todo el país.",
        tip: "Ten en cuenta las comisiones y el envío antes de poner el precio.",
      },
      {
        bestFor: "Ropa, zapatos y accesorios.",
        tip: "Empieza por lo que no te has puesto en 90 días.",
      },
    ],
  },
};

const fr: CrisisCopy = {
  regionNotice: "Les numéros de téléphone, les institutions et les modèles de documents de cette page concernent la Pologne.",
  eyebrow: "Crise financière",
  title: "Un plan d'urgence quand l'argent vient à manquer.",
  description:
    "Coach FI vous aide à calmer la panique, trouver une aide gratuite, contacter les institutions et récupérer un premier peu d'argent sans aggraver la dette.",
  voiceText: [
    "Plan de crise financière Coach FI.",
    "D'abord, protégez la vie, la santé, la nourriture, les médicaments, un toit et le contact avec une autre personne.",
    "Si vous avez des pensées suicidaires ou craignez de vous faire du mal, appelez le 112 ou le 116 123.",
    "Les dettes peuvent se régler étape par étape. Vous n'avez pas à traverser cela seul.",
    "Ne contractez pas un nouveau prêt coûteux sous la pression.",
    "Contactez l'aide juridique gratuite, le centre d'aide sociale (MOPS ou OPS), votre banque et la personne de confiance la plus proche.",
    "Mettez en vente des objets inutilisés pour récupérer un premier peu d'argent sans augmenter la dette.",
  ],
  safety: {
    title: "La sécurité d'abord",
    body: "En cas de menace pour la vie ou la santé, de violence ou de danger immédiat, appelez le 112. Si vous traversez une crise psychique, utilisez la ligne 116 123 ou centrumwsparcia.pl.",
    emergencyDetail: "urgence",
    mentalDetail: "crise psychique",
    onlineDetail: "en ligne",
  },
  tokens: {
    title: "Des jetons pour l'action",
    description: "Chaque étape SOS accomplie rapporte +{reward} Coach FI Tokens.",
    readPlan: "Lire le plan SOS",
  },
  emotional: {
    eyebrow: "La personne d'abord, la dette ensuite",
    title: "Quand les dettes provoquent un effondrement, une dépression ou des pensées suicidaires",
    description:
      "Ce module s'adresse aux adultes. Si vous sentez que vous ne tenez plus, ne restez pas seul avec cet état. Appelez, écrivez à une personne de confiance, demandez à quelqu'un de rester avec vous. La dette est un problème qui peut se résoudre, mais il faut d'abord assurer la sécurité.",
    voiceText:
      "Si les dettes provoquent un effondrement, une dépression ou des pensées suicidaires, occupez-vous d'abord de votre sécurité. Appelez le 112 si vous risquez de vous faire du mal. Appelez le 116 123 ou le 800 70 2222 si vous avez besoin de parler à quelqu'un maintenant. Vous n'avez pas à traverser cela seul.",
    voiceLabel: "Lire l'aide maintenant",
    mentalHealthCentre: "Centre de santé mentale (CZP)",
    contacts: [
      {
        subtitle: "Menace immédiate pour la vie ou la santé",
        body: "Appelez tout de suite si vous risquez de vous faire du mal, si vous êtes en danger immédiat ou si une personne près de vous est menacée.",
        cta: "Appeler le 112",
      },
      {
        subtitle: "Ligne d'écoute pour adultes",
        body: "Aide gratuite et anonyme pour les adultes en crise psychique ou émotionnelle.",
        cta: "Appeler le 116 123",
      },
      {
        subtitle: "Centre de soutien pour adultes",
        body: "Soutien psychologique 24 h/24 pour les adultes en crise psychique.",
        cta: "Appeler le 800 70 2222",
      },
      {
        subtitle: "Aide en ligne",
        body: "Plateforme pour adultes : téléphone, informations, aide en ligne et annuaire des lieux de soutien.",
        cta: "Ouvrir 116sos.pl",
      },
      {
        subtitle: "Aide gratuite sans ordonnance",
        body: "Un adulte peut chercher du soutien au Centre de santé mentale de son lieu de résidence, y compris en urgence.",
        cta: "Trouver un centre",
      },
    ],
    steps: [
      {
        title: "1. Parlez-en à quelqu'un",
        body: "Envoyez un court message : je traverse une crise et j'ai besoin que tu restes en contact avec moi.",
      },
      {
        title: "2. Éloignez le risque",
        body: "Mettez à distance ce qui pourrait vous servir à vous faire du mal. Allez dans un endroit où il y a d'autres personnes.",
      },
      {
        title: "3. Passez un appel",
        body: "Vous n'avez pas à tout expliquer. Dites simplement : je traverse une crise, j'ai besoin d'aide maintenant. En cas d'urgence, vous pouvez aussi appeler le 999 ou vous rendre aux urgences d'un hôpital.",
      },
    ],
  },
  city: {
    title: "Trouver de l'aide dans votre ville",
    description:
      "Saisissez votre ville. Coach FI vous indiquera où chercher un centre d'intervention de crise, l'aide sociale, une aide juridique gratuite et un soutien aux emprunteurs.",
    label: "Votre ville",
    placeholder: "p. ex. Varsovie, Cracovie, Gdansk",
    fallback: "ma ville",
  },
  resources: {
    source: "Source",
    oikPhone: "numéro local du centre de crise",
    items: {
      oik: {
        title: "Centre d'intervention de crise (OIK)",
        body: "Aide en situation de crise, écoute, intervention, parfois hébergement ou soutien psychologique. Cherchez le centre le plus proche.",
        cta: "Chercher OIK : {city}",
      },
      legal: {
        title: "Aide juridique gratuite",
        body: "Des points publics dans toute la Pologne. Vous pouvez y obtenir un conseil juridique, un conseil citoyen ou une médiation.",
        cta: "Prendre rendez-vous",
      },
      mops: {
        title: "Aide sociale (MOPS / OPS)",
        body: "Renseignez-vous sur l'aide ponctuelle, la nourriture, les médicaments, le chauffage, le loyer et le contact avec un travailleur social.",
        cta: "Chercher MOPS/OPS : {city}",
      },
      zus: {
        title: "Sécurité sociale (ZUS)",
        body: "Si vous avez une entreprise ou des cotisations en retard, renseignez-vous sur le report, l'échelonnement ou l'allègement du paiement.",
        cta: "Voir les allègements ZUS",
      },
      alimony: {
        title: "Pension alimentaire et fonds alimentaire",
        body: "Si quelqu'un doit contribuer à l'entretien d'un enfant ou de la famille, renseignez-vous sur la pension alimentaire et les prestations.",
        cta: "Voir le fonds",
      },
      credit: {
        title: "Prêt immobilier et mensualités",
        body: "Demandez à votre banque les reports d'échéances, la restructuration, le différé et le Fonds de soutien aux emprunteurs.",
        cta: "Voir le fonds (FWK)",
      },
      cityOffice: {
        title: "Mairie",
        body: "Les sites locaux publient souvent les numéros à jour des centres de crise, de l'aide sociale, des points d'aide juridique et de l'aide alimentaire.",
        cta: "Chercher près de chez vous",
      },
    },
  },
  firstDay: {
    title: "Les premières 24 heures",
    description: "Avancez par petits pas, dans le bon ordre. Ne cherchez pas à tout résoudre d'un coup.",
    done: "Fait",
    reward: "+{reward} jetons",
    steps: [
      {
        title: "Écrivez à la personne la plus proche",
        body: "Demandez un prêt court, uniquement pour les besoins essentiels. Fixez une date de remboursement et rédigez un accord simple.",
      },
      {
        title: "Contactez votre banque ou votre créancier",
        body: "Demandez une restructuration, un différé, un échelonnement ou les reports d'échéances disponibles.",
      },
      {
        title: "Prenez rendez-vous pour une aide juridique gratuite",
        body: "N'ignorez pas les courriers du tribunal, de l'huissier ou de la banque. Un juriste vous aidera à fixer l'ordre des démarches.",
      },
      {
        title: "Renseignez-vous auprès de l'aide sociale",
        body: "Demandez l'aide ponctuelle, la nourriture, les médicaments, le chauffage, le loyer ou une autre aide de subsistance.",
      },
      {
        title: "Mettez en vente 3 objets inutilisés",
        body: "Récupérez un premier peu d'argent sans nouvelle dette. Commencez par les vêtements, l'électronique et les appareils.",
      },
    ],
  },
  avoid: {
    title: "Ce qu'il ne faut pas faire dans la panique",
    items: [
      "Ne prenez pas un crédit express uniquement pour en rembourser un autre.",
      "N'ignorez pas les courriers de la banque, du tribunal, de l'huissier ou de la sécurité sociale (ZUS).",
      "Ne promettez pas à vos proches un remboursement sans date, montant ni conditions simples.",
      "Ne vendez pas ce dont vous avez besoin pour travailler ou pour votre santé.",
      "Ne signez pas un accord dont vous ne comprenez pas les coûts.",
    ],
  },
  templates: {
    title: "Modèles de messages et de demandes",
    description: "Ce sont des brouillons éducatifs à adapter. Pour les questions juridiques, faites appel à l'aide juridique gratuite.",
    copy: "Copier",
    copied: "Copié",
    polishDocumentNote: "Modèle en polonais : c'est sous cette forme qu'il se dépose auprès des institutions polonaises.",
    titles: {
      emotional: "Message à un proche en cas d'effondrement",
      request: "Demande de prêt à un proche",
      loan: "Modèle simple de contrat de prêt",
      bank: "Demande à la banque d'un allègement des remboursements",
      mops: "Demande d'aide à l'aide sociale",
    },
    emotionalText:
      "Bonjour [PRÉNOM],\n\nje traverse un moment très difficile. Les dettes et le stress me dépassent. Je ne te demande pas de tout résoudre maintenant.\n\nJ'ai besoin que quelqu'un reste en contact avec moi pendant l'heure qui vient.\nPeux-tu m'appeler ou me répondre ?\n\nSi je ne réponds pas, réessaie s'il te plaît, ou appelle les secours.\nJe veux traverser ce moment en sécurité.",
    requestText:
      "Bonjour [PRÉNOM],\n\nje t'écris parce que je suis dans une situation financière urgente et que j'ai besoin d'aide pour des dépenses essentielles : [nourriture/médicaments/loyer/transport].\n\nPourrais-tu me prêter [MONTANT] jusqu'au [DATE DE REMBOURSEMENT] ?\nJe veux faire les choses honnêtement et clairement : je peux t'envoyer tout de suite un contrat de prêt simple avec la date de remboursement.\n\nJe ne demande pas un cadeau. Je demande une aide de courte durée que je rembourserai à la date convenue.\nMerci de m'avoir lu.",
  },
  resale: {
    title: "Récupérer de l'argent grâce à la revente",
    description: "Le petit apport d'argent le plus rapide se trouve souvent dans les objets que vous n'utilisez plus.",
    voiceText:
      "Mettez en vente trois objets inutilisés. Regardez Vinted pour les vêtements et accessoires. Utilisez OLX ou Facebook Marketplace pour les objets volumineux vendus localement. Comparez l'électronique et les objets de plus grande valeur sur Allegro Lokalnie.",
    voiceLabel: "Lire les conseils de revente",
    platforms: [
      { bestFor: "Vêtements, chaussures, accessoires, articles lifestyle.", tip: "Commencez par ce que vous n'avez pas utilisé depuis 90 jours." },
      {
        bestFor: "Meubles, électroménager, électronique, vélos, objets volumineux vendus localement.",
        tip: "De bonnes photos et une remise en main propre accélèrent souvent la vente.",
      },
      {
        bestFor: "Électronique, livres, loisirs, objets de plus grande valeur.",
        tip: "Il vaut la peine de comparer le prix avec des annonces actives similaires.",
      },
      {
        bestFor: "Vente locale rapide et groupes de quartier.",
        tip: "Ne cliquez pas sur les liens suspects envoyés par des acheteurs. Gardez le paiement sur un canal sûr.",
      },
      {
        bestFor: "Objets de collection, électronique, objets de niche à potentiel international.",
        tip: "Tenez compte des commissions, de l'expédition et du délai de traitement.",
      },
    ],
  },
};

const zh: CrisisCopy = {
  regionNotice: "本页的电话号码、机构和文件模板均适用于波兰。",
  eyebrow: "财务危机",
  title: "钱快用完时的应急计划。",
  description:
    "Coach FI 帮你稳住情绪、找到免费帮助、联系相关机构，并在不加深债务的情况下拿回第一笔现金。",
  voiceText: [
    "Coach FI 财务危机计划。",
    "首先，保障生命、健康、食物、药品、住处以及与他人的联系。",
    "如果你有自杀念头，或担心会伤害自己，请拨打 112 或 116 123。",
    "债务可以一步一步理清。你不必独自承受这一切。",
    "不要在压力下再借一笔昂贵的贷款。",
    "联系免费法律援助、社会救助中心（MOPS 或 OPS）、你的银行，以及你最信任的人。",
    "把闲置物品挂出去卖，在不增加债务的情况下拿回第一笔现金。",
  ],
  safety: {
    title: "安全第一",
    body: "如果存在生命或健康危险、暴力或直接的危险，请拨打 112。如果你正处于心理危机中，请使用 116 123 热线或 centrumwsparcia.pl。",
    emergencyDetail: "紧急",
    mentalDetail: "心理危机",
    onlineDetail: "在线",
  },
  tokens: {
    title: "行动赢代币",
    description: "每完成一个 SOS 步骤可获得 +{reward} Coach FI Tokens。",
    readPlan: "朗读 SOS 计划",
  },
  emotional: {
    eyebrow: "先顾人，再顾债",
    title: "当债务导致崩溃、抑郁或自杀念头时",
    description:
      "本模块面向成年人。如果你觉得撑不下去了，不要独自承受。打电话、给信任的人发消息、请人陪着你。债务是可以解决的问题，但首先要保证安全。",
    voiceText:
      "如果债务让你崩溃、抑郁或产生自杀念头，请先确保安全。如果你可能伤害自己，请拨打 112。如果你现在需要找人说话，请拨打 116 123 或 800 70 2222。你不必独自承受这一切。",
    voiceLabel: "朗读即时帮助",
    mentalHealthCentre: "心理健康中心（CZP）",
    contacts: [
      {
        subtitle: "生命或健康面临紧迫危险",
        body: "如果你可能伤害自己、处于直接危险中，或身边有人面临危险，请立即拨打。",
        cta: "拨打 112",
      },
      {
        subtitle: "成人心理援助热线",
        body: "为处于心理和情绪危机中的成年人提供免费、匿名的帮助。",
        cta: "拨打 116 123",
      },
      {
        subtitle: "成人支持中心",
        body: "为处于心理危机中的成年人提供全天候心理支持。",
        cta: "拨打 800 70 2222",
      },
      {
        subtitle: "在线帮助",
        body: "面向成年人的平台：电话、信息、在线帮助和支持机构名录。",
        cta: "打开 116sos.pl",
      },
      {
        subtitle: "无需转诊的免费帮助",
        body: "成年人可以到居住地所属的心理健康中心寻求支持，紧急情况下也可以。",
        cta: "查找中心",
      },
    ],
    steps: [
      {
        title: "1. 告诉别人",
        body: "发一条简短的消息：我正处于危机中，需要你和我保持联系。",
      },
      {
        title: "2. 远离风险",
        body: "把可能用来伤害自己的东西拿开。到有其他人在的地方去。",
      },
      {
        title: "3. 打一个电话",
        body: "你不需要把一切都解释清楚。只要说：我正处于危机中，现在需要帮助。紧急情况下也可以拨打 999 或前往医院急诊。",
      },
    ],
  },
  city: {
    title: "在你的城市寻找帮助",
    description:
      "输入你的城市。Coach FI 会提示到哪里寻找危机干预中心、社会救助中心、免费法律援助和对贷款人的支持。",
    label: "你的城市",
    placeholder: "例如：华沙、克拉科夫、格但斯克",
    fallback: "我的城市",
  },
  resources: {
    source: "来源",
    oikPhone: "当地危机中心电话",
    items: {
      oik: {
        title: "危机干预中心（OIK）",
        body: "危机中的帮助、谈话、干预，有时提供临时住所或心理支持。查找你当地的中心。",
        cta: "搜索 OIK：{city}",
      },
      legal: {
        title: "免费法律援助",
        body: "遍布波兰各地的公共服务点。可以获得法律咨询、公民咨询或调解。",
        cta: "预约咨询",
      },
      mops: {
        title: "社会救助中心（MOPS / OPS）",
        body: "询问专项补助、食物、药品、取暖燃料、房租，以及如何联系社工。",
        cta: "搜索 MOPS/OPS：{city}",
      },
      zus: {
        title: "社会保险（ZUS）",
        body: "如果你经营企业或拖欠社保缴费，可以了解延期、分期或缴费减免。",
        cta: "查看 ZUS 减免",
      },
      alimony: {
        title: "抚养费与抚养基金",
        body: "如果有人应当分担孩子或家庭的生活费，请了解抚养费和相关补助。",
        cta: "查看基金",
      },
      credit: {
        title: "房贷与月供",
        body: "向银行了解延期还款、债务重组、宽限期以及借款人支持基金。",
        cta: "查看基金（FWK）",
      },
      cityOffice: {
        title: "市政府或乡镇办公室",
        body: "当地网站通常会公布危机中心、社会救助中心、法律援助点和食物援助的最新电话。",
        cta: "在当地搜索",
      },
    },
  },
  firstDay: {
    title: "最初的 24 小时",
    description: "按正确的顺序迈出小步。不要一次解决所有问题。",
    done: "已完成",
    reward: "+{reward} 代币",
    steps: [
      {
        title: "给最亲近的人发消息",
        body: "只为基本需要请求一笔短期借款。约定归还日期，并写一份简单的协议。",
      },
      {
        title: "联系银行或债权人",
        body: "请求债务重组、宽限期、分期，或了解可用的延期还款政策。",
      },
      {
        title: "预约免费法律援助",
        body: "不要忽视法院、执行官或银行的来函。律师会帮你确定行动的先后顺序。",
      },
      {
        title: "咨询社会救助中心",
        body: "询问专项补助、食物、药品、取暖燃料、房租或其他生活援助。",
      },
      {
        title: "挂出 3 件闲置物品",
        body: "在不新增债务的情况下拿回第一笔现金。从衣服、电子产品和家电开始。",
      },
    ],
  },
  avoid: {
    title: "慌乱时不要做的事",
    items: [
      "不要为了还一笔小额快贷而再借一笔小额快贷。",
      "不要忽视银行、法院、执行官或社保机构（ZUS）的来函。",
      "不要在没有日期、金额和简单条件的情况下向家人承诺还款。",
      "不要卖掉工作或健康所需的物品。",
      "不要签署你看不懂成本的和解协议。",
    ],
  },
  templates: {
    title: "消息与申请模板",
    description: "这些是供你修改的教育性草稿。涉及法律事务，请使用免费法律援助。",
    copy: "复制",
    copied: "已复制",
    polishDocumentNote: "模板为波兰语：向波兰机构提交时需使用这种形式。",
    titles: {
      emotional: "崩溃时发给亲近之人的消息",
      request: "向亲近之人借款的请求",
      loan: "简单的借款协议模板",
      bank: "向银行申请还款减免",
      mops: "向社会救助中心申请帮助",
    },
    emotionalText:
      "[姓名]，你好：\n\n我现在处在非常艰难的时刻。债务和压力让我撑不住了。我不是要你现在解决所有问题。\n\n我需要在接下来的一个小时里有人和我保持联系。\n你能给我打电话或回复我吗？\n\n如果我没有回复，请再试一次，或者帮我求助。\n我想平安度过这一刻。",
    requestText:
      "[姓名]，你好：\n\n我写信给你，是因为我遇到了紧急的经济困难，需要帮助支付基本开销：[食物/药品/房租/交通]。\n\n你能借给我 [金额]，我在 [还款日期] 之前归还吗？\n我想把这件事做得诚实、清楚，所以可以马上发给你一份写明还款日期的简单借款协议。\n\n我不是在要礼物。我请求的是一笔短期帮助，会在约定的日期归还。\n谢谢你读完这些。",
  },
  resale: {
    title: "通过转卖拿回现金",
    description: "最快的一小笔现金，往往就在你已经不用的东西里。",
    voiceText:
      "挂出三件闲置物品。衣服和配饰可以看看 Vinted。本地出售的大件用 OLX 或 Facebook Marketplace。电子产品和价值较高的物品可以在 Allegro Lokalnie 上比价。",
    voiceLabel: "朗读转卖建议",
    platforms: [
      { bestFor: "衣服、鞋子、配饰和生活方式类物品。", tip: "先挂出 90 天没用过的东西。" },
      {
        bestFor: "家具、家电、电子产品、自行车以及本地出售的大件。",
        tip: "好的照片和当面取货通常能加快成交。",
      },
      {
        bestFor: "电子产品、书籍、兴趣用品和价值较高的物品。",
        tip: "值得与类似的在售信息比较价格。",
      },
      {
        bestFor: "快速的本地出售和社区群组。",
        tip: "不要点击买家发来的可疑链接。把付款留在安全的渠道里。",
      },
      {
        bestFor: "收藏品、电子产品和有国际市场潜力的小众物品。",
        tip: "要把手续费、运费和处理时间算进去。",
      },
    ],
  },
};

const ja: CrisisCopy = {
  regionNotice: "このページの電話番号、機関、書類のひな形はポーランド向けのものです。",
  eyebrow: "お金の危機",
  title: "お金が尽きそうなときの緊急プラン。",
  description:
    "Coach FIは、パニックを落ち着かせ、無料の支援を見つけ、機関に連絡し、借金を増やさずに最初の現金を取り戻すお手伝いをします。",
  voiceText: [
    "Coach FIのお金の危機プラン。",
    "まず、命、健康、食べ物、薬、住む場所、そして誰かとのつながりを守りましょう。",
    "自殺を考えている、または自分を傷つけてしまいそうで怖いときは、112または116 123に電話してください。",
    "借金は一歩ずつ整理できます。ひとりで抱える必要はありません。",
    "追い詰められた状態で、高金利のローンをさらに借りないでください。",
    "無料の法律相談、社会福祉センター（MOPSまたはOPS）、銀行、そしていちばん信頼できる人に連絡しましょう。",
    "借金を増やさずに最初の現金を取り戻すため、使っていないものを出品しましょう。",
  ],
  safety: {
    title: "まずは安全",
    body: "命や健康の危険、暴力、差し迫った危険があるときは112に電話してください。心の危機にあるときは、116 123の相談電話またはcentrumwsparcia.plを利用してください。",
    emergencyDetail: "緊急",
    mentalDetail: "心の危機",
    onlineDetail: "オンライン",
  },
  tokens: {
    title: "行動でトークン獲得",
    description: "SOSのステップを1つ完了するごとに +{reward} Coach FI Tokens がもらえます。",
    readPlan: "SOSプランを読み上げる",
  },
  emotional: {
    eyebrow: "まず人、それから借金",
    title: "借金が原因で心が折れそうなとき、うつ状態や自殺を考えてしまうとき",
    description:
      "このモジュールは大人向けです。もう耐えられないと感じたら、ひとりで抱え込まないでください。電話する、信頼できる人に連絡する、誰かにそばにいてもらう。借金は解決できる問題ですが、まず安全を守ることが先です。",
    voiceText:
      "借金が原因で心が折れそうなとき、うつ状態や自殺を考えてしまうときは、まず安全を守ってください。自分を傷つけてしまいそうなら112に電話してください。今すぐ誰かと話したいなら116 123または800 70 2222に電話してください。ひとりで抱える必要はありません。",
    voiceLabel: "今すぐ支援を読み上げる",
    mentalHealthCentre: "精神保健センター（CZP）",
    contacts: [
      {
        subtitle: "命や健康に差し迫った危険",
        body: "自分を傷つけてしまいそうなとき、差し迫った危険があるとき、近くの人が危険なときは、すぐに電話してください。",
        cta: "112に電話",
      },
      {
        subtitle: "大人のための相談電話",
        body: "心や感情の危機にある大人のための、無料で匿名の支援です。",
        cta: "116 123に電話",
      },
      {
        subtitle: "大人のためのサポートセンター",
        body: "心の危機にある大人のための24時間の心理サポートです。",
        cta: "800 70 2222に電話",
      },
      {
        subtitle: "オンラインの支援",
        body: "大人向けのプラットフォーム：電話、情報、オンライン支援、支援先の一覧。",
        cta: "116sos.plを開く",
      },
      {
        subtitle: "紹介状なしの無料支援",
        body: "大人は、緊急のときも含め、住んでいる地域の精神保健センターで支援を求めることができます。",
        cta: "センターを探す",
      },
    ],
    steps: [
      {
        title: "1. 誰かに伝える",
        body: "短いメッセージを送りましょう：今つらい状態です。連絡を取り続けてほしいです。",
      },
      {
        title: "2. 危険を遠ざける",
        body: "自分を傷つけるおそれのあるものを遠ざけましょう。ほかの人がいる場所へ移動しましょう。",
      },
      {
        title: "3. 電話を1本かける",
        body: "すべてを説明できなくて大丈夫です。「危機にあります。今すぐ助けが必要です」とだけ伝えてください。緊急のときは999に電話するか、病院の救急外来に行くこともできます。",
      },
    ],
  },
  city: {
    title: "あなたの街で支援を探す",
    description:
      "街の名前を入力してください。Coach FIが、危機介入センター、社会福祉センター、無料の法律相談、ローン利用者への支援の探し方を案内します。",
    label: "あなたの街",
    placeholder: "例：ワルシャワ、クラクフ、グダンスク",
    fallback: "私の街",
  },
  resources: {
    source: "出典",
    oikPhone: "地域の危機センターの番号",
    items: {
      oik: {
        title: "危機介入センター（OIK）",
        body: "危機のときの支援、相談、介入、場合によっては一時的な住まいや心理サポート。地域のセンターを探しましょう。",
        cta: "OIKを探す：{city}",
      },
      legal: {
        title: "無料の法律相談",
        body: "ポーランド各地にある公的な窓口です。法律相談、市民相談、調停を受けられます。",
        cta: "相談を予約",
      },
      mops: {
        title: "社会福祉センター（MOPS / OPS）",
        body: "目的別の給付、食料、薬、暖房用の燃料、家賃、ソーシャルワーカーへの連絡について相談しましょう。",
        cta: "MOPS/OPSを探す：{city}",
      },
      zus: {
        title: "社会保険（ZUS）",
        body: "事業をしている、または保険料を滞納している場合は、猶予、分割、支払いの軽減を確認しましょう。",
        cta: "ZUSの軽減措置を確認",
      },
      alimony: {
        title: "養育費と養育費基金",
        body: "子どもや家族の生活費を負担すべき人がいる場合は、養育費と給付を確認しましょう。",
        cta: "基金を確認",
      },
      credit: {
        title: "住宅ローンと返済",
        body: "銀行に、返済猶予、条件変更、元金据え置き、借り手支援基金について確認しましょう。",
        cta: "基金を確認（FWK）",
      },
      cityOffice: {
        title: "市役所・町村役場",
        body: "地域のサイトには、危機センター、社会福祉センター、法律相談窓口、食料支援の最新の番号がよく掲載されています。",
        cta: "地域で探す",
      },
    },
  },
  firstDay: {
    title: "最初の24時間",
    description: "正しい順番で小さな一歩を。すべてを一度に解決しようとしないでください。",
    done: "完了",
    reward: "+{reward} トークン",
    steps: [
      {
        title: "いちばん身近な人に連絡する",
        body: "基本的な生活のためだけの短期の借り入れをお願いしましょう。返す日を決め、簡単な取り決めを書面にします。",
      },
      {
        title: "銀行や債権者に連絡する",
        body: "条件変更、元金据え置き、分割、利用できる返済猶予について相談しましょう。",
      },
      {
        title: "無料の法律相談を予約する",
        body: "裁判所、執行官、銀行からの書類を無視しないでください。法律の専門家が対応の順番を整理してくれます。",
      },
      {
        title: "社会福祉センターに相談する",
        body: "目的別の給付、食料、薬、暖房用の燃料、家賃、その他の生活支援について相談しましょう。",
      },
      {
        title: "使っていないものを3つ出品する",
        body: "新しい借金をせずに最初の現金を取り戻しましょう。服、電子機器、家電から始めます。",
      },
    ],
  },
  avoid: {
    title: "パニックのときにしてはいけないこと",
    items: [
      "別の小口ローンを返すためだけに、小口ローンを借りないでください。",
      "銀行、裁判所、執行官、社会保険（ZUS）からの書類を無視しないでください。",
      "日付、金額、簡単な条件を決めずに、家族に返済を約束しないでください。",
      "仕事や健康に必要なものを売らないでください。",
      "費用を理解できない和解書に署名しないでください。",
    ],
  },
  templates: {
    title: "メッセージと申請書のひな形",
    description: "調整して使うための学習用の下書きです。法律に関することは無料の法律相談を利用してください。",
    copy: "コピー",
    copied: "コピーしました",
    polishDocumentNote: "ひな形はポーランド語です。ポーランドの機関にはこの形で提出します。",
    titles: {
      emotional: "心が折れそうなときに身近な人へ送るメッセージ",
      request: "身近な人への借り入れのお願い",
      loan: "簡単な金銭貸借契約のひな形",
      bank: "銀行への返済軽減の申請",
      mops: "社会福祉センターへの支援の申請",
    },
    emotionalText:
      "[名前]さん、\n\n今、とてもつらい状態です。借金とストレスに押しつぶされそうです。今すぐすべてを解決してほしいわけではありません。\n\nこれからの1時間、誰かに連絡を取り続けてほしいです。\n電話か返信をもらえますか？\n\nもし返事がなかったら、もう一度連絡するか、助けを呼んでください。\nこの時間を安全に乗り越えたいです。",
    requestText:
      "[名前]さん、\n\n急ぎでお金に困っていて、基本的な出費のために助けが必要なので連絡しました：[食費/薬/家賃/交通費]。\n\n[返済日]までに返すので、[金額]を貸してもらえませんか？\n誠実に、はっきりとした形にしたいので、返済日を書いた簡単な借用書をすぐに送れます。\n\nもらいたいわけではありません。約束した日に返す、短い間の助けをお願いしています。\n読んでくれてありがとう。",
  },
  resale: {
    title: "不用品を売って現金を取り戻す",
    description: "いちばん早い小さな現金は、もう使っていないものの中にあることが多いです。",
    voiceText:
      "使っていないものを3つ出品しましょう。服や小物はVintedを見てください。地元で売る大きなものはOLXやFacebook Marketplaceを使いましょう。電子機器や価値の高いものはAllegro Lokalnieで比べましょう。",
    voiceLabel: "出品のコツを読み上げる",
    platforms: [
      { bestFor: "服、靴、小物、ライフスタイル用品。", tip: "まずは90日間使っていないものから出品しましょう。" },
      {
        bestFor: "家具、家電、電子機器、自転車など、地元で売る大きなもの。",
        tip: "きれいな写真と手渡しは、売れるまでの時間を短くすることが多いです。",
      },
      {
        bestFor: "電子機器、本、趣味のもの、価値の高い品物。",
        tip: "似た出品中の商品と価格を比べるとよいでしょう。",
      },
      {
        bestFor: "地元での素早い販売と地域のグループ。",
        tip: "買い手から届く怪しいリンクは開かないでください。支払いは安全な方法で行いましょう。",
      },
      {
        bestFor: "コレクション、電子機器、海外でも需要のある珍しいもの。",
        tip: "手数料、送料、対応にかかる時間を考えに入れましょう。",
      },
    ],
  },
};

const hi: CrisisCopy = {
  regionNotice: "इस पेज पर दिए गए फ़ोन नंबर, संस्थान और दस्तावेज़ों के नमूने पोलैंड के लिए हैं।",
  eyebrow: "वित्तीय संकट",
  title: "जब पैसे खत्म होने लगें, तब के लिए आपातकालीन योजना।",
  description:
    "Coach FI घबराहट रोकने, मुफ़्त मदद ढूंढने, संस्थानों से संपर्क करने और कर्ज़ बढ़ाए बिना पहली नकदी वापस पाने में आपकी मदद करता है।",
  voiceText: [
    "Coach FI की वित्तीय संकट योजना।",
    "सबसे पहले जीवन, सेहत, खाना, दवाइयां, सिर पर छत और किसी दूसरे इंसान से संपर्क को सुरक्षित करें।",
    "अगर आपके मन में आत्महत्या के विचार हैं या आपको डर है कि आप खुद को नुकसान पहुंचा सकते हैं, तो 112 या 116 123 पर कॉल करें।",
    "कर्ज़ को कदम-दर-कदम सुलझाया जा सकता है। आपको यह सब अकेले नहीं झेलना है।",
    "दबाव में एक और महंगा लोन न लें।",
    "मुफ़्त कानूनी सहायता, सामाजिक सहायता केंद्र (MOPS या OPS), अपने बैंक और सबसे भरोसेमंद व्यक्ति से संपर्क करें।",
    "कर्ज़ बढ़ाए बिना पहली नकदी वापस पाने के लिए बेकार पड़ी चीज़ें बिक्री के लिए लगाएं।",
  ],
  safety: {
    title: "पहले सुरक्षा",
    body: "अगर जीवन या सेहत को खतरा है, हिंसा है या तुरंत का खतरा है, तो 112 पर कॉल करें। अगर आप मानसिक संकट में हैं, तो 116 123 हेल्पलाइन या centrumwsparcia.pl का उपयोग करें।",
    emergencyDetail: "आपातकाल",
    mentalDetail: "मानसिक संकट",
    onlineDetail: "ऑनलाइन",
  },
  tokens: {
    title: "कदम उठाने पर टोकन",
    description: "हर पूरा किया गया SOS कदम +{reward} Coach FI Tokens देता है।",
    readPlan: "SOS योजना पढ़ें",
  },
  emotional: {
    eyebrow: "पहले इंसान, फिर कर्ज़",
    title: "जब कर्ज़ के कारण टूटन, अवसाद या आत्महत्या के विचार आएं",
    description:
      "यह मॉड्यूल वयस्कों के लिए है। अगर आपको लगता है कि आप सह नहीं पाएंगे, तो इस हालत में अकेले न रहें। कॉल करें, किसी भरोसेमंद को लिखें, किसी से अपने साथ रहने को कहें। कर्ज़ एक सुलझाई जा सकने वाली समस्या है, लेकिन पहले सुरक्षा का ध्यान रखना ज़रूरी है।",
    voiceText:
      "अगर कर्ज़ के कारण टूटन, अवसाद या आत्महत्या के विचार आ रहे हैं, तो पहले अपनी सुरक्षा का ध्यान रखें। अगर आप खुद को नुकसान पहुंचा सकते हैं तो 112 पर कॉल करें। अगर आपको अभी किसी से बात करनी है तो 116 123 या 800 70 2222 पर कॉल करें। आपको यह सब अकेले नहीं झेलना है।",
    voiceLabel: "मदद अभी पढ़ें",
    mentalHealthCentre: "मानसिक स्वास्थ्य केंद्र (CZP)",
    contacts: [
      {
        subtitle: "जीवन या सेहत को तुरंत खतरा",
        body: "अगर आप खुद को नुकसान पहुंचा सकते हैं, तुरंत खतरे में हैं या आपके पास कोई खतरे में है, तो तुरंत कॉल करें।",
        cta: "112 पर कॉल करें",
      },
      {
        subtitle: "वयस्कों के लिए हेल्पलाइन",
        body: "मानसिक और भावनात्मक संकट में वयस्कों के लिए मुफ़्त, गुमनाम मदद।",
        cta: "116 123 पर कॉल करें",
      },
      {
        subtitle: "वयस्कों के लिए सहायता केंद्र",
        body: "मानसिक संकट में वयस्कों के लिए चौबीसों घंटे मनोवैज्ञानिक सहायता।",
        cta: "800 70 2222 पर कॉल करें",
      },
      {
        subtitle: "ऑनलाइन मदद",
        body: "वयस्कों के लिए प्लेटफ़ॉर्म: फ़ोन, जानकारी, ऑनलाइन मदद और सहायता स्थलों की सूची।",
        cta: "116sos.pl खोलें",
      },
      {
        subtitle: "बिना रेफ़रल के मुफ़्त मदद",
        body: "कोई भी वयस्क अपने निवास स्थान के मानसिक स्वास्थ्य केंद्र से मदद ले सकता है, आपात स्थिति में भी।",
        cta: "केंद्र खोजें",
      },
    ],
    steps: [
      {
        title: "1. किसी को बताएं",
        body: "एक छोटा संदेश भेजें: मैं संकट में हूं और चाहता/चाहती हूं कि आप मेरे संपर्क में रहें।",
      },
      {
        title: "2. खतरे को दूर करें",
        body: "जिन चीज़ों से आप खुद को नुकसान पहुंचा सकते हैं, उन्हें अपने से दूर रखें। ऐसी जगह जाएं जहां दूसरे लोग हों।",
      },
      {
        title: "3. एक कॉल करें",
        body: "आपको सब कुछ समझाना ज़रूरी नहीं है। बस कहें: मैं संकट में हूं, मुझे अभी मदद चाहिए। आपात स्थिति में आप 999 पर भी कॉल कर सकते हैं या अस्पताल के आपातकालीन विभाग जा सकते हैं।",
      },
    ],
  },
  city: {
    title: "अपने शहर में मदद खोजें",
    description:
      "अपना शहर लिखें। Coach FI बताएगा कि संकट हस्तक्षेप केंद्र, सामाजिक सहायता केंद्र, मुफ़्त कानूनी सहायता और कर्ज़दारों के लिए सहायता कहां खोजें।",
    label: "आपका शहर",
    placeholder: "जैसे वारसॉ, क्राकोव, ग्दान्स्क",
    fallback: "मेरा शहर",
  },
  resources: {
    source: "स्रोत",
    oikPhone: "स्थानीय संकट केंद्र का नंबर",
    items: {
      oik: {
        title: "संकट हस्तक्षेप केंद्र (OIK)",
        body: "संकट में मदद, बातचीत, हस्तक्षेप, कभी-कभी आश्रय या मनोवैज्ञानिक सहायता। अपने इलाके का केंद्र खोजें।",
        cta: "OIK खोजें: {city}",
      },
      legal: {
        title: "मुफ़्त कानूनी सहायता",
        body: "पूरे पोलैंड में सार्वजनिक केंद्र। यहां कानूनी सलाह, नागरिक सलाह या मध्यस्थता मिल सकती है।",
        cta: "सलाह का समय लें",
      },
      mops: {
        title: "सामाजिक सहायता केंद्र (MOPS / OPS)",
        body: "विशेष सहायता राशि, खाना, दवाइयां, ईंधन, किराया और सामाजिक कार्यकर्ता से संपर्क के बारे में पूछें।",
        cta: "MOPS/OPS खोजें: {city}",
      },
      zus: {
        title: "सामाजिक बीमा (ZUS)",
        body: "अगर आपका कारोबार है या अंशदान बकाया है, तो स्थगन, किस्तों या भुगतान में राहत के बारे में देखें।",
        cta: "ZUS की राहत देखें",
      },
      alimony: {
        title: "गुज़ारा भत्ता और भरण-पोषण कोष",
        body: "अगर किसी को बच्चे या परिवार के खर्च में हिस्सा देना चाहिए, तो गुज़ारा भत्ते और लाभों के बारे में देखें।",
        cta: "कोष देखें",
      },
      credit: {
        title: "होम लोन और किस्तें",
        body: "अपने बैंक से किस्तों में छूट, पुनर्गठन, मोहलत की अवधि और कर्ज़दार सहायता कोष के बारे में पूछें।",
        cta: "कोष देखें (FWK)",
      },
      cityOffice: {
        title: "नगर या ग्राम कार्यालय",
        body: "स्थानीय वेबसाइटें अक्सर संकट केंद्रों, सामाजिक सहायता केंद्रों, कानूनी सलाह केंद्रों और भोजन सहायता के ताज़ा नंबर प्रकाशित करती हैं।",
        cta: "स्थानीय स्तर पर खोजें",
      },
    },
  },
  firstDay: {
    title: "पहले 24 घंटे",
    description: "सही क्रम में छोटे कदम उठाएं। सब कुछ एक साथ हल करने की कोशिश न करें।",
    done: "हो गया",
    reward: "+{reward} टोकन",
    steps: [
      {
        title: "अपने सबसे करीबी व्यक्ति को लिखें",
        body: "सिर्फ़ बुनियादी ज़रूरतों के लिए थोड़े समय का उधार मांगें। लौटाने की तारीख तय करें और एक सरल समझौता लिखें।",
      },
      {
        title: "बैंक या लेनदार से संपर्क करें",
        body: "पुनर्गठन, मोहलत की अवधि, किस्तों या उपलब्ध किस्त-छूट की जानकारी मांगें।",
      },
      {
        title: "मुफ़्त कानूनी सहायता का समय लें",
        body: "अदालत, वसूली अधिकारी या बैंक के पत्रों को अनदेखा न करें। वकील कदमों का क्रम तय करने में मदद करेगा।",
      },
      {
        title: "सामाजिक सहायता केंद्र से पूछें",
        body: "विशेष सहायता राशि, खाना, दवाइयां, ईंधन, किराया या अन्य गुज़ारे की मदद के बारे में पूछें।",
      },
      {
        title: "बेकार पड़ी 3 चीज़ें बिक्री के लिए लगाएं",
        body: "नया कर्ज़ लिए बिना पहली नकदी वापस पाएं। कपड़ों, इलेक्ट्रॉनिक्स और उपकरणों से शुरू करें।",
      },
    ],
  },
  avoid: {
    title: "घबराहट में क्या न करें",
    items: [
      "सिर्फ़ एक तुरंत-लोन चुकाने के लिए दूसरा तुरंत-लोन न लें।",
      "बैंक, अदालत, वसूली अधिकारी या सामाजिक बीमा (ZUS) के पत्रों को अनदेखा न करें।",
      "तारीख, रकम और सरल शर्तों के बिना परिवार से लौटाने का वादा न करें।",
      "काम या सेहत के लिए ज़रूरी चीज़ें न बेचें।",
      "ऐसे समझौते पर हस्ताक्षर न करें जिसकी लागत आप नहीं समझते।",
    ],
  },
  templates: {
    title: "संदेशों और आवेदनों के नमूने",
    description: "ये अपने अनुसार बदलने के लिए शैक्षिक मसौदे हैं। कानूनी मामलों में मुफ़्त कानूनी सहायता लें।",
    copy: "कॉपी करें",
    copied: "कॉपी हो गया",
    polishDocumentNote: "नमूना पोलिश में है: पोलैंड के संस्थानों में इसे इसी रूप में जमा किया जाता है।",
    titles: {
      emotional: "टूटन की घड़ी में करीबी व्यक्ति को संदेश",
      request: "करीबी व्यक्ति से उधार का अनुरोध",
      loan: "उधार के समझौते का सरल नमूना",
      bank: "बैंक से भुगतान में राहत का आवेदन",
      mops: "सामाजिक सहायता केंद्र से मदद का आवेदन",
    },
    emotionalText:
      "नमस्ते [नाम],\n\nमैं बहुत मुश्किल दौर से गुज़र रहा/रही हूं। कर्ज़ और तनाव मुझ पर भारी पड़ रहे हैं। मैं अभी तुमसे सब कुछ सुलझाने को नहीं कह रहा/रही।\n\nमुझे चाहिए कि अगले एक घंटे तक कोई मेरे संपर्क में रहे।\nक्या तुम मुझे कॉल कर सकते हो या जवाब लिख सकते हो?\n\nअगर मैं जवाब न दूं, तो कृपया फिर कोशिश करना या मदद के लिए कॉल करना।\nमैं इस घड़ी से सुरक्षित निकलना चाहता/चाहती हूं।",
    requestText:
      "नमस्ते [नाम],\n\nमैं इसलिए लिख रहा/रही हूं क्योंकि मेरी आर्थिक स्थिति बहुत गंभीर है और मुझे बुनियादी खर्चों के लिए मदद चाहिए: [खाना/दवाइयां/किराया/आना-जाना]।\n\nक्या तुम मुझे [लौटाने की तारीख] तक के लिए [रकम] उधार दे सकते हो?\nमैं यह ईमानदारी और साफ़ तरीके से करना चाहता/चाहती हूं, इसलिए लौटाने की तारीख वाला सरल उधार समझौता अभी भेज सकता/सकती हूं।\n\nमैं उपहार नहीं मांग रहा/रही। मैं थोड़े समय की मदद मांग रहा/रही हूं, जिसे तय तारीख पर लौटा दूंगा/दूंगी।\nपढ़ने के लिए धन्यवाद।",
  },
  resale: {
    title: "पुरानी चीज़ें बेचकर नकदी वापस पाएं",
    description: "सबसे तेज़ छोटी नकदी अक्सर उन चीज़ों में होती है जिन्हें आप अब इस्तेमाल नहीं करते।",
    voiceText:
      "बेकार पड़ी तीन चीज़ें बिक्री के लिए लगाएं। कपड़ों और एक्सेसरीज़ के लिए Vinted देखें। स्थानीय स्तर पर बिकने वाली बड़ी चीज़ों के लिए OLX या Facebook Marketplace का उपयोग करें। इलेक्ट्रॉनिक्स और ज़्यादा कीमत वाली चीज़ों की तुलना Allegro Lokalnie पर करें।",
    voiceLabel: "बिक्री के सुझाव पढ़ें",
    platforms: [
      { bestFor: "कपड़े, जूते, एक्सेसरीज़ और लाइफ़स्टाइल की चीज़ें।", tip: "पहले वे चीज़ें लगाएं जो आपने 90 दिनों से इस्तेमाल नहीं कीं।" },
      {
        bestFor: "फ़र्नीचर, घरेलू उपकरण, इलेक्ट्रॉनिक्स, साइकिलें और स्थानीय स्तर पर बिकने वाली बड़ी चीज़ें।",
        tip: "अच्छी तस्वीरें और खुद आकर ले जाने की सुविधा अक्सर बिक्री तेज़ कर देती है।",
      },
      {
        bestFor: "इलेक्ट्रॉनिक्स, किताबें, शौक की चीज़ें और ज़्यादा कीमत वाली वस्तुएं।",
        tip: "कीमत की तुलना मिलते-जुलते चालू विज्ञापनों से करना फ़ायदेमंद है।",
      },
      {
        bestFor: "तेज़ स्थानीय बिक्री और मोहल्ले के समूह।",
        tip: "खरीदारों के भेजे संदिग्ध लिंक पर क्लिक न करें। भुगतान को सुरक्षित माध्यम में रखें।",
      },
      {
        bestFor: "संग्रह की चीज़ें, इलेक्ट्रॉनिक्स और अंतरराष्ट्रीय संभावना वाली खास चीज़ें।",
        tip: "कमीशन, शिपिंग और ऑर्डर संभालने के समय का ध्यान रखें।",
      },
    ],
  },
};

const ptBR: CrisisCopy = {
  regionNotice: "Os telefones, as instituições e os modelos de documentos desta página valem para a Polônia.",
  eyebrow: "Crise financeira",
  title: "Um plano de emergência para quando o dinheiro acaba.",
  description:
    "O Coach FI ajuda você a frear o pânico, encontrar ajuda gratuita, falar com as instituições e recuperar o primeiro dinheiro sem aumentar a dívida.",
  voiceText: [
    "Plano de crise financeira do Coach FI.",
    "Primeiro, proteja a vida, a saúde, a comida, os remédios, um teto e o contato com outra pessoa.",
    "Se você tem pensamentos suicidas ou medo de se machucar, ligue para 112 ou 116 123.",
    "As dívidas podem ser organizadas passo a passo. Você não precisa passar por isso sozinho.",
    "Não pegue outro empréstimo caro sob pressão.",
    "Procure a assistência jurídica gratuita, o centro de assistência social (MOPS ou OPS), o seu banco e a pessoa em quem você mais confia.",
    "Coloque à venda coisas sem uso para recuperar o primeiro dinheiro sem aumentar a dívida.",
  ],
  safety: {
    title: "Segurança em primeiro lugar",
    body: "Se houver risco à vida ou à saúde, violência ou perigo imediato, ligue para 112. Se você está em uma crise de saúde mental, use a linha 116 123 ou o centrumwsparcia.pl.",
    emergencyDetail: "emergência",
    mentalDetail: "crise de saúde mental",
    onlineDetail: "online",
  },
  tokens: {
    title: "Tokens por agir",
    description: "Cada passo SOS concluído dá +{reward} Coach FI Tokens.",
    readPlan: "Ler o plano SOS",
  },
  emotional: {
    eyebrow: "Primeiro a pessoa, depois a dívida",
    title: "Quando as dívidas causam colapso, depressão ou pensamentos suicidas",
    description:
      "Este módulo é para adultos. Se você sente que não aguenta mais, não fique sozinho com isso. Ligue, escreva para alguém de confiança, peça para alguém ficar com você. A dívida é um problema que tem solução, mas primeiro é preciso cuidar da segurança.",
    voiceText:
      "Se as dívidas estão causando colapso, depressão ou pensamentos suicidas, cuide primeiro da sua segurança. Ligue para 112 se você pode se machucar. Ligue para 116 123 ou 800 70 2222 se precisa conversar com alguém agora. Você não precisa passar por isso sozinho.",
    voiceLabel: "Ler a ajuda agora",
    mentalHealthCentre: "Centro de Saúde Mental (CZP)",
    contacts: [
      {
        subtitle: "Risco imediato à vida ou à saúde",
        body: "Ligue imediatamente se você pode se machucar, está em perigo imediato ou alguém ao seu lado corre risco.",
        cta: "Ligar 112",
      },
      {
        subtitle: "Linha de apoio para adultos",
        body: "Ajuda gratuita e anônima para adultos em crise psicológica ou emocional.",
        cta: "Ligar 116 123",
      },
      {
        subtitle: "Centro de Apoio para adultos",
        body: "Apoio psicológico 24 horas para adultos em crise de saúde mental.",
        cta: "Ligar 800 70 2222",
      },
      {
        subtitle: "Ajuda online",
        body: "Plataforma para adultos: telefone, informações, ajuda online e um cadastro de locais de apoio.",
        cta: "Abrir 116sos.pl",
      },
      {
        subtitle: "Ajuda gratuita sem encaminhamento",
        body: "Um adulto pode buscar apoio no Centro de Saúde Mental do local onde mora, inclusive em uma emergência.",
        cta: "Encontrar um centro",
      },
    ],
    steps: [
      {
        title: "1. Conte para alguém",
        body: "Mande uma mensagem curta: estou em crise e preciso que você fique em contato comigo.",
      },
      {
        title: "2. Afaste o risco",
        body: "Tire de perto as coisas com que você poderia se machucar. Vá para um lugar onde haja outras pessoas.",
      },
      {
        title: "3. Faça uma ligação",
        body: "Você não precisa saber explicar tudo. Diga só: estou em crise, preciso de ajuda agora. Em uma emergência você também pode ligar para 999 ou ir ao pronto-socorro de um hospital.",
      },
    ],
  },
  city: {
    title: "Encontre ajuda na sua cidade",
    description:
      "Digite a sua cidade. O Coach FI indica onde procurar um centro de intervenção em crise, a assistência social, assistência jurídica gratuita e apoio a quem tem financiamento.",
    label: "Sua cidade",
    placeholder: "ex.: Varsóvia, Cracóvia, Gdansk",
    fallback: "minha cidade",
  },
  resources: {
    source: "Fonte",
    oikPhone: "telefone local do centro de crise",
    items: {
      oik: {
        title: "Centro de Intervenção em Crise (OIK)",
        body: "Ajuda na crise, conversa, intervenção e, às vezes, abrigo ou apoio psicológico. Procure o centro da sua região.",
        cta: "Buscar OIK: {city}",
      },
      legal: {
        title: "Assistência jurídica gratuita",
        body: "Pontos públicos em toda a Polônia. É possível obter orientação jurídica, orientação ao cidadão ou mediação.",
        cta: "Agendar orientação",
      },
      mops: {
        title: "Assistência social (MOPS / OPS)",
        body: "Pergunte sobre o auxílio pontual, comida, remédios, aquecimento, aluguel e o contato com um assistente social.",
        cta: "Buscar MOPS/OPS: {city}",
      },
      zus: {
        title: "Previdência social (ZUS)",
        body: "Se você tem empresa ou contribuições em atraso, veja o adiamento, o parcelamento ou as facilidades de pagamento.",
        cta: "Ver facilidades do ZUS",
      },
      alimony: {
        title: "Pensão alimentícia e fundo de alimentos",
        body: "Se alguém deve contribuir para o sustento de um filho ou da família, veja a pensão alimentícia e os benefícios.",
        cta: "Ver o fundo",
      },
      credit: {
        title: "Financiamento imobiliário e parcelas",
        body: "Pergunte ao banco sobre pausa nas parcelas, renegociação, carência e o Fundo de Apoio aos Mutuários.",
        cta: "Ver o fundo (FWK)",
      },
      cityOffice: {
        title: "Prefeitura",
        body: "Os sites locais costumam publicar os telefones atualizados de centros de crise, assistência social, pontos de orientação jurídica e ajuda alimentar.",
        cta: "Buscar na sua região",
      },
    },
  },
  firstDay: {
    title: "As primeiras 24 horas",
    description: "Dê passos pequenos na ordem certa. Não tente resolver tudo de uma vez.",
    done: "Feito",
    reward: "+{reward} tokens",
    steps: [
      {
        title: "Escreva para a pessoa mais próxima",
        body: "Peça um empréstimo curto só para necessidades básicas. Combine a data de devolução e faça um acordo simples por escrito.",
      },
      {
        title: "Fale com o banco ou o credor",
        body: "Peça renegociação, carência, parcelamento ou a verificação das pausas de pagamento disponíveis.",
      },
      {
        title: "Agende a assistência jurídica gratuita",
        body: "Não ignore cartas da justiça, do oficial de execução ou do banco. Um advogado ajuda a definir a ordem das ações.",
      },
      {
        title: "Procure a assistência social",
        body: "Pergunte sobre o auxílio pontual, comida, remédios, aquecimento, aluguel ou outra ajuda para o básico.",
      },
      {
        title: "Coloque à venda 3 coisas sem uso",
        body: "Recupere o primeiro dinheiro sem dívida nova. Comece por roupas, eletrônicos e aparelhos.",
      },
    ],
  },
  avoid: {
    title: "O que não fazer em pânico",
    items: [
      "Não pegue um empréstimo rápido só para pagar outro empréstimo rápido.",
      "Não ignore cartas do banco, da justiça, do oficial de execução nem da previdência (ZUS).",
      "Não prometa à família uma devolução sem data, valor e condições simples.",
      "Não venda coisas de que você precisa para trabalhar ou para a saúde.",
      "Não assine um acordo cujos custos você não entende.",
    ],
  },
  templates: {
    title: "Modelos de mensagens e pedidos",
    description: "São rascunhos educacionais para adaptar. Em questões legais, use a assistência jurídica gratuita.",
    copy: "Copiar",
    copied: "Copiado",
    polishDocumentNote: "Modelo em polonês: é nessa forma que ele é entregue nas instituições polonesas.",
    titles: {
      emotional: "Mensagem para alguém próximo em um momento de colapso",
      request: "Pedido de empréstimo a alguém próximo",
      loan: "Modelo simples de contrato de empréstimo",
      bank: "Pedido ao banco de alívio no pagamento",
      mops: "Pedido de ajuda à assistência social",
    },
    emotionalText:
      "Oi, [NOME],\n\nestou em um momento muito difícil. As dívidas e o estresse estão maiores do que eu consigo aguentar. Não estou pedindo que você resolva tudo agora.\n\nPreciso que alguém fique em contato comigo na próxima hora.\nVocê pode me ligar ou responder?\n\nSe eu não responder, por favor tente de novo ou chame ajuda.\nQuero passar por este momento em segurança.",
    requestText:
      "Oi, [NOME],\n\nestou escrevendo porque tenho uma situação financeira urgente e preciso de ajuda com despesas básicas: [comida/remédios/aluguel/transporte].\n\nVocê pode me emprestar [VALOR] até [DATA DE DEVOLUÇÃO]?\nQuero fazer isso de forma honesta e clara, então posso mandar agora mesmo um contrato de empréstimo simples com a data de devolução.\n\nNão estou pedindo um presente. Estou pedindo uma ajuda de curto prazo que vou devolver na data combinada.\nObrigado por ler.",
  },
  resale: {
    title: "Recupere dinheiro revendendo",
    description: "O pequeno reforço de caixa mais rápido costuma estar nas coisas que você já não usa.",
    voiceText:
      "Coloque à venda três coisas sem uso. Veja roupas e acessórios na Vinted. Use a OLX ou o Facebook Marketplace para coisas maiores vendidas localmente. Compare eletrônicos e itens de maior valor no Allegro Lokalnie.",
    voiceLabel: "Ler dicas de revenda",
    platforms: [
      { bestFor: "Roupas, calçados, acessórios e itens de estilo de vida.", tip: "Comece pelo que você não usa há 90 dias." },
      {
        bestFor: "Móveis, eletrodomésticos, eletrônicos, bicicletas e coisas maiores vendidas localmente.",
        tip: "Boas fotos e retirada em mãos costumam acelerar a venda.",
      },
      {
        bestFor: "Eletrônicos, livros, hobbies e itens de maior valor.",
        tip: "Vale comparar o preço com anúncios ativos parecidos.",
      },
      {
        bestFor: "Venda local rápida e grupos do bairro.",
        tip: "Não clique em links suspeitos de compradores. Mantenha o pagamento em um canal seguro.",
      },
      {
        bestFor: "Coleções, eletrônicos e itens de nicho com potencial internacional.",
        tip: "Considere as taxas, o frete e o tempo de processamento.",
      },
    ],
  },
};

const tr: CrisisCopy = {
  regionNotice: "Bu sayfadaki telefon numaraları, kurumlar ve belge şablonları Polonya için geçerlidir.",
  eyebrow: "Finansal kriz",
  title: "Para bittiğinde uygulanacak acil durum planı.",
  description:
    "Coach FI paniği durdurmana, ücretsiz yardım bulmana, kurumlarla iletişime geçmene ve borcu derinleştirmeden ilk nakdi geri kazanmana yardım eder.",
  voiceText: [
    "Coach FI finansal kriz planı.",
    "Önce hayatı, sağlığı, yiyeceği, ilaçları, başını sokacak bir yeri ve başka bir insanla teması güvenceye al.",
    "İntihar düşüncelerin varsa ya da kendine zarar vermekten korkuyorsan 112'yi veya 116 123'ü ara.",
    "Borçlar adım adım düzene sokulabilir. Bunu tek başına yaşamak zorunda değilsin.",
    "Baskı altında pahalı bir kredi daha çekme.",
    "Ücretsiz hukuki yardımla, sosyal yardım merkeziyle (MOPS veya OPS), bankanla ve en güvendiğin kişiyle iletişime geç.",
    "Borcu artırmadan ilk nakdi geri kazanmak için kullanmadığın eşyaları satışa çıkar.",
  ],
  safety: {
    title: "Önce güvenlik",
    body: "Hayati tehlike, sağlık riski, şiddet ya da doğrudan tehlike varsa 112'yi ara. Ruhsal bir kriz yaşıyorsan 116 123 hattını veya centrumwsparcia.pl adresini kullan.",
    emergencyDetail: "acil",
    mentalDetail: "ruhsal kriz",
    onlineDetail: "çevrimiçi",
  },
  tokens: {
    title: "Harekete geçene token",
    description: "Tamamlanan her SOS adımı +{reward} Coach FI Tokens kazandırır.",
    readPlan: "SOS planını oku",
  },
  emotional: {
    eyebrow: "Önce insan, sonra borç",
    title: "Borçlar çöküşe, depresyona ya da intihar düşüncelerine yol açtığında",
    description:
      "Bu modül yetişkinler içindir. Dayanamayacağını hissediyorsan bu durumla yalnız kalma. Ara, güvendiğin birine yaz, birinin yanında kalmasını iste. Borç çözülebilir bir sorundur, ama önce güvenliğini sağlamak gerekir.",
    voiceText:
      "Borçlar çöküşe, depresyona ya da intihar düşüncelerine yol açıyorsa önce güvenliğini sağla. Kendine zarar verebileceksen 112'yi ara. Şu anda biriyle konuşmaya ihtiyacın varsa 116 123'ü veya 800 70 2222'yi ara. Bunu tek başına yaşamak zorunda değilsin.",
    voiceLabel: "Yardımı şimdi oku",
    mentalHealthCentre: "Ruh Sağlığı Merkezi (CZP)",
    contacts: [
      {
        subtitle: "Hayati veya sağlık açısından acil tehlike",
        body: "Kendine zarar verebileceksen, doğrudan tehlikedeysen ya da yanındaki biri tehlikedeyse hemen ara.",
        cta: "112'yi ara",
      },
      {
        subtitle: "Yetişkinler için destek hattı",
        body: "Ruhsal ve duygusal kriz yaşayan yetişkinler için ücretsiz, anonim yardım.",
        cta: "116 123'ü ara",
      },
      {
        subtitle: "Yetişkinler için Destek Merkezi",
        body: "Ruhsal kriz yaşayan yetişkinler için 24 saat psikolojik destek.",
        cta: "800 70 2222'yi ara",
      },
      {
        subtitle: "Çevrimiçi yardım",
        body: "Yetişkinler için platform: telefon, bilgi, çevrimiçi yardım ve destek yerleri rehberi.",
        cta: "116sos.pl'yi aç",
      },
      {
        subtitle: "Sevksiz ücretsiz yardım",
        body: "Bir yetişkin, acil durumda da, yaşadığı yere bağlı Ruh Sağlığı Merkezi'nden destek arayabilir.",
        cta: "Merkez bul",
      },
    ],
    steps: [
      {
        title: "1. Birine söyle",
        body: "Kısa bir mesaj gönder: kriz yaşıyorum ve benimle iletişimde kalmana ihtiyacım var.",
      },
      {
        title: "2. Riski uzaklaştır",
        body: "Kendine zarar verebileceğin şeyleri yanından uzaklaştır. Başka insanların olduğu bir yere geç.",
      },
      {
        title: "3. Tek bir telefon et",
        body: "Her şeyi açıklamak zorunda değilsin. Sadece şunu söyle: kriz yaşıyorum, şimdi yardıma ihtiyacım var. Acil bir durumda 999'u da arayabilir veya bir hastanenin acil servisine gidebilirsin.",
      },
    ],
  },
  city: {
    title: "Şehrinde yardım bul",
    description:
      "Şehrini yaz. Coach FI kriz müdahale merkezini, sosyal yardım merkezini, ücretsiz hukuki yardımı ve kredi borçlularına desteği nerede arayacağını gösterir.",
    label: "Şehrin",
    placeholder: "örn. Varşova, Krakov, Gdansk",
    fallback: "şehrim",
  },
  resources: {
    source: "Kaynak",
    oikPhone: "yerel kriz merkezi numarası",
    items: {
      oik: {
        title: "Kriz Müdahale Merkezi (OIK)",
        body: "Krizde yardım, görüşme, müdahale, bazen barınma veya psikolojik destek. Bölgendeki merkezi ara.",
        cta: "OIK ara: {city}",
      },
      legal: {
        title: "Ücretsiz hukuki yardım",
        body: "Polonya genelinde kamu noktaları. Hukuki danışmanlık, yurttaşlık danışmanlığı veya arabuluculuk alabilirsin.",
        cta: "Randevu al",
      },
      mops: {
        title: "Sosyal yardım merkezi (MOPS / OPS)",
        body: "Amaca yönelik yardımı, gıdayı, ilaçları, yakacağı, kirayı ve bir sosyal hizmet uzmanıyla görüşmeyi sor.",
        cta: "MOPS/OPS ara: {city}",
      },
      zus: {
        title: "Sosyal güvenlik (ZUS)",
        body: "Bir işletmen varsa veya prim borcun birikmişse erteleme, taksit ya da ödeme kolaylığı seçeneklerine bak.",
        cta: "ZUS kolaylıklarına bak",
      },
      alimony: {
        title: "Nafaka ve nafaka fonu",
        body: "Biri çocuğun ya da ailenin geçimine katkıda bulunmak zorundaysa nafaka ve ödenekleri kontrol et.",
        cta: "Fona bak",
      },
      credit: {
        title: "Konut kredisi ve taksitler",
        body: "Bankana ödeme tatilini, yeniden yapılandırmayı, ödemesiz dönemi ve Kredi Borçlularını Destekleme Fonu'nu sor.",
        cta: "Fona bak (FWK)",
      },
      cityOffice: {
        title: "Belediye",
        body: "Yerel siteler genellikle kriz merkezlerinin, sosyal yardım merkezlerinin, hukuki danışma noktalarının ve gıda yardımının güncel numaralarını yayımlar.",
        cta: "Yerelde ara",
      },
    },
  },
  firstDay: {
    title: "İlk 24 saat",
    description: "Doğru sırayla küçük adımlar at. Her şeyi bir anda çözmeye çalışma.",
    done: "Tamamlandı",
    reward: "+{reward} token",
    steps: [
      {
        title: "En yakınındaki kişiye yaz",
        body: "Yalnızca temel ihtiyaçlar için kısa vadeli borç iste. Geri ödeme tarihini belirleyin ve basit bir sözleşme yazın.",
      },
      {
        title: "Bankanla veya alacaklıyla iletişime geç",
        body: "Yeniden yapılandırma, ödemesiz dönem, taksit ya da mevcut ödeme tatillerinin kontrol edilmesini iste.",
      },
      {
        title: "Ücretsiz hukuki yardım için randevu al",
        body: "Mahkemeden, icra memurundan veya bankadan gelen yazıları görmezden gelme. Bir avukat adımların sırasını belirlemene yardım eder.",
      },
      {
        title: "Sosyal yardım merkezine sor",
        body: "Amaca yönelik yardımı, gıdayı, ilaçları, yakacağı, kirayı veya diğer geçim desteğini sor.",
      },
      {
        title: "Kullanmadığın 3 eşyayı satışa çıkar",
        body: "Yeni borç almadan ilk nakdi geri kazan. Giysilerle, elektronikle ve ev aletleriyle başla.",
      },
    ],
  },
  avoid: {
    title: "Panik halinde yapılmaması gerekenler",
    items: [
      "Yalnızca başka bir hızlı krediyi ödemek için hızlı kredi çekme.",
      "Bankadan, mahkemeden, icra memurundan veya sosyal güvenlikten (ZUS) gelen yazıları görmezden gelme.",
      "Tarih, tutar ve basit koşullar olmadan ailene geri ödeme sözü verme.",
      "İşin veya sağlığın için gerekli olan eşyaları satma.",
      "Maliyetlerini anlamadığın bir uzlaşmayı imzalama.",
    ],
  },
  templates: {
    title: "Mesaj ve başvuru şablonları",
    description: "Bunlar uyarlaman için eğitim amaçlı taslaklardır. Hukuki konularda ücretsiz hukuki yardımdan yararlan.",
    copy: "Kopyala",
    copied: "Kopyalandı",
    polishDocumentNote: "Şablon Lehçedir: Polonya'daki kurumlara bu biçimde verilir.",
    titles: {
      emotional: "Çöküş anında yakınına mesaj",
      request: "Yakınından borç isteme",
      loan: "Basit borç sözleşmesi şablonu",
      bank: "Bankaya ödeme kolaylığı başvurusu",
      mops: "Sosyal yardım merkezine yardım başvurusu",
    },
    emotionalText:
      "Merhaba [İSİM],\n\nçok zor bir dönemden geçiyorum. Borçlar ve stres beni aşıyor. Şu anda her şeyi çözmeni istemiyorum.\n\nÖnümüzdeki bir saat boyunca birinin benimle iletişimde kalmasına ihtiyacım var.\nBeni arayabilir ya da yanıt yazabilir misin?\n\nYanıt vermezsem lütfen tekrar dene ya da yardım çağır.\nBu anı güvenle atlatmak istiyorum.",
    requestText:
      "Merhaba [İSİM],\n\nacil bir maddi durumum olduğu ve temel giderler için yardıma ihtiyacım olduğu için yazıyorum: [yiyecek/ilaç/kira/ulaşım].\n\nBana [GERİ ÖDEME TARİHİ] tarihine kadar [TUTAR] borç verebilir misin?\nBunu dürüst ve açık biçimde yapmak istiyorum; bu yüzden geri ödeme tarihini içeren basit bir borç sözleşmesini hemen gönderebilirim.\n\nHediye istemiyorum. Kararlaştırdığımız tarihte geri ödeyeceğim kısa süreli bir yardım istiyorum.\nOkuduğun için teşekkür ederim.",
  },
  resale: {
    title: "İkinci el satışla nakit geri kazan",
    description: "En hızlı küçük nakit desteği çoğu zaman artık kullanmadığın eşyalardadır.",
    voiceText:
      "Kullanmadığın üç eşyayı satışa çıkar. Giysi ve aksesuarlar için Vinted'e bak. Yerelde satılacak büyük eşyalar için OLX'i veya Facebook Marketplace'i kullan. Elektroniği ve daha değerli eşyaları Allegro Lokalnie'de karşılaştır.",
    voiceLabel: "Satış ipuçlarını oku",
    platforms: [
      { bestFor: "Giysi, ayakkabı, aksesuar ve yaşam tarzı ürünleri.", tip: "90 gündür kullanmadığın eşyalarla başla." },
      {
        bestFor: "Mobilya, beyaz eşya, elektronik, bisiklet ve yerelde satılan büyük eşyalar.",
        tip: "İyi fotoğraflar ve elden teslim satışı çoğu zaman hızlandırır.",
      },
      {
        bestFor: "Elektronik, kitap, hobi ve daha değerli eşyalar.",
        tip: "Fiyatı benzer güncel ilanlarla karşılaştırmakta fayda var.",
      },
      {
        bestFor: "Hızlı yerel satış ve mahalle grupları.",
        tip: "Alıcılardan gelen şüpheli bağlantılara tıklama. Ödemeyi güvenli bir kanalda tut.",
      },
      {
        bestFor: "Koleksiyon, elektronik ve uluslararası potansiyeli olan niş eşyalar.",
        tip: "Komisyonları, kargoyu ve sipariş hazırlama süresini hesaba kat.",
      },
    ],
  },
};

export const CRISIS_COPY: LocalizedMap<CrisisCopy> = {
  en,
  pl,
  es,
  fr,
  zh,
  ja,
  hi,
  "pt-BR": ptBR,
  tr,
};
