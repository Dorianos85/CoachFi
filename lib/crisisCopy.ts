import type { LocalizedMap } from "@/lib/i18n";

/** Text of the financial crisis page. Phone numbers, institutions and links stay Polish in every locale. */
export interface CrisisCopy {
  polandNotice: string;
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
    mentalHealthCentre: string;
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
    oikPhone: string;
    items: Record<"oik" | "legal" | "mops" | "zus" | "alimony" | "credit" | "cityOffice", { title: string; body: string; cta: string }>;
  };
  firstDay: {
    title: string;
    description: string;
    done: string;
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
    polishDocumentNote: string;
    titles: Record<"emotional" | "request" | "loan" | "bank" | "mops", string>;
    emotionalText: string;
    requestText: string;
  };
  resale: {
    title: string;
    description: string;
    voiceText: string;
    voiceLabel: string;
    platforms: { bestFor: string; tip: string }[];
  };
}

const pl: CrisisCopy = {
  polandNotice: "Numery telefonów, instytucje i wzory pism na tej stronie dotyczą Polski.",
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
  polandNotice: "The phone numbers, institutions and document templates on this page apply to Poland.",
  eyebrow: "Financial crisis",
  title: "An emergency plan for when the money runs out.",
  description:
    "Coach FI helps you stop the panic, find free help, contact institutions and recover the first cash without going deeper into debt.",
  voiceText: [
    "Coach FI financial crisis plan.",
    "First, protect life, health, food, medicine, a roof over your head and contact with another person.",
    "If you have suicidal thoughts or fear you may hurt yourself, call 112 or 116 123.",
    "Debts can be sorted out step by step. You do not have to go through this alone.",
    "Do not take another expensive loan under pressure.",
    "Contact free legal aid, the social welfare centre (MOPS or OPS), your bank and the person you trust most.",
    "List unused things for sale to recover the first cash without adding debt.",
  ],
  safety: {
    title: "Safety first",
    body: "If there is a threat to life or health, violence or immediate danger, call 112. If you are in a mental health crisis, use the 116 123 helpline or centrumwsparcia.pl.",
    emergencyDetail: "emergency",
    mentalDetail: "mental health crisis",
    onlineDetail: "online",
  },
  tokens: {
    title: "Tokens for action",
    description: "Every completed SOS step gives +{reward} Coach FI Tokens.",
    readPlan: "Read the SOS plan",
  },
  emotional: {
    eyebrow: "The person first, the debt second",
    title: "When debt causes a breakdown, depression or suicidal thoughts",
    description:
      "This module is for adults. If you feel you cannot cope, do not stay alone with it. Call, write to someone you trust, ask someone to stay with you. Debt is a problem that can be solved, but safety has to come first.",
    voiceText:
      "If debt is causing a breakdown, depression or suicidal thoughts, take care of safety first. Call 112 if you might hurt yourself. Call 116 123 or 800 70 2222 if you need to talk to someone now. You do not have to go through this alone.",
    voiceLabel: "Read help now",
    mentalHealthCentre: "Mental Health Centre (CZP)",
    contacts: [
      {
        subtitle: "Immediate threat to life or health",
        body: "Call right away if you might hurt yourself, you are in immediate danger or someone near you is at risk.",
        cta: "Call 112",
      },
      {
        subtitle: "Helpline for adults",
        body: "Free, anonymous help for adults in a mental or emotional crisis.",
        cta: "Call 116 123",
      },
      {
        subtitle: "Support Centre for adults",
        body: "Round-the-clock psychological support for adults in a mental health crisis.",
        cta: "Call 800 70 2222",
      },
      {
        subtitle: "Online help",
        body: "A platform for adults: phone, information, online help and a directory of support places.",
        cta: "Open 116sos.pl",
      },
      {
        subtitle: "Free help without a referral",
        body: "An adult can seek support at the Mental Health Centre for their place of residence, also in an emergency.",
        cta: "Find a centre",
      },
    ],
    steps: [
      {
        title: "1. Tell someone",
        body: "Send a short message: I am in a crisis and I need you to stay in touch with me.",
      },
      {
        title: "2. Move the risk away",
        body: "Put away things you could hurt yourself with. Go to a place where other people are.",
      },
      {
        title: "3. Make one call",
        body: "You do not have to explain everything. Just say: I am in a crisis, I need help now. In an emergency you can also call 999 or go to a hospital emergency department.",
      },
    ],
  },
  city: {
    title: "Find help in your city",
    description:
      "Enter your city. Coach FI will suggest where to look for a crisis intervention centre, the social welfare centre, free legal aid and support for borrowers.",
    label: "Your city",
    placeholder: "e.g. Warsaw, Kraków, Gdańsk",
    fallback: "my city",
  },
  resources: {
    source: "Source",
    oikPhone: "local crisis centre number",
    items: {
      oik: {
        title: "Crisis Intervention Centre (OIK)",
        body: "Help in a crisis, a conversation, intervention, sometimes shelter or psychological support. Look for your local centre.",
        cta: "Search OIK: {city}",
      },
      legal: {
        title: "Free legal aid",
        body: "Public points across Poland. You can get legal advice, civic advice or mediation.",
        cta: "Book advice",
      },
      mops: {
        title: "Social welfare centre (MOPS / OPS)",
        body: "Ask about a special-purpose benefit, food, medicine, fuel, rent and contact with a social worker.",
        cta: "Search MOPS/OPS: {city}",
      },
      zus: {
        title: "Social insurance (ZUS)",
        body: "If you run a business or have overdue contributions, check deferral, instalments or relief in repayment.",
        cta: "Check ZUS relief",
      },
      alimony: {
        title: "Child support and the maintenance fund",
        body: "If someone should contribute to supporting a child or family, check child support and benefits.",
        cta: "Check the fund",
      },
      credit: {
        title: "Mortgage and instalments",
        body: "Ask your bank about payment holidays, restructuring, a grace period and the Borrowers' Support Fund.",
        cta: "Check the fund (FWK)",
      },
      cityOffice: {
        title: "City or municipal office",
        body: "Local websites often publish current numbers for crisis centres, welfare centres, legal aid points and food help.",
        cta: "Search locally",
      },
    },
  },
  firstDay: {
    title: "The first 24 hours",
    description: "Take small steps in the right order. Do not solve everything at once.",
    done: "Done",
    reward: "+{reward} tokens",
    steps: [
      {
        title: "Write to the person closest to you",
        body: "Ask for a short loan for basic needs only. Agree a repayment date and write a simple agreement.",
      },
      {
        title: "Contact your bank or creditor",
        body: "Ask about restructuring, a grace period, instalments or available payment holidays.",
      },
      {
        title: "Book free legal aid",
        body: "Do not ignore letters from the court, a bailiff or the bank. A lawyer will help set the order of actions.",
      },
      {
        title: "Check the social welfare centre",
        body: "Ask about a special-purpose benefit, food, medicine, fuel, rent or other living support.",
      },
      {
        title: "List 3 unused things",
        body: "Recover the first cash without new debt. Start with clothes, electronics and appliances.",
      },
    ],
  },
  avoid: {
    title: "What not to do in a panic",
    items: [
      "Do not take a payday loan just to repay another payday loan.",
      "Do not ignore letters from the bank, the court, a bailiff or ZUS.",
      "Do not promise family a repayment without a date, an amount and simple terms.",
      "Do not sell things you need for work or health.",
      "Do not sign a settlement whose costs you do not understand.",
    ],
  },
  templates: {
    title: "Message and request templates",
    description: "These are educational drafts to adapt. For legal matters, use free legal aid.",
    copy: "Copy",
    copied: "Copied",
    polishDocumentNote: "Template in Polish: this is the form submitted to Polish institutions.",
    titles: {
      emotional: "Message to someone close when you are breaking down",
      request: "Loan request to someone close",
      loan: "Simple loan agreement template",
      bank: "Request to the bank for repayment relief",
      mops: "Request to the social welfare centre for help",
    },
    emotionalText:
      "Hi [NAME],\n\nI am in a very hard place. The debts and the stress are too much for me. I am not asking you to fix everything right now.\n\nI need someone to stay in touch with me for the next hour.\nCan you call me or write back?\n\nIf I do not answer, please try again or call for help.\nI want to get through this moment safely.",
    requestText:
      "Hi [NAME],\n\nI am writing because I have an urgent financial situation and I need help with basic expenses: [food/medicine/rent/transport].\n\nCould you lend me [AMOUNT] until [REPAYMENT DATE]?\nI want to do this fairly and clearly, so I can send a simple loan agreement with the repayment date right away.\n\nI am not asking for a gift. I am asking for short-term help that I will pay back on the agreed date.\nThank you for reading this.",
  },
  resale: {
    title: "Recover cash through reselling",
    description: "The fastest small cash boost is often in things you no longer use.",
    voiceText:
      "List three unused things. Check Vinted for clothes and accessories. Use OLX or Facebook Marketplace for bigger local items. Compare electronics and higher-value items on Allegro Lokalnie.",
    voiceLabel: "Read reselling tips",
    platforms: [
      { bestFor: "Clothes, shoes, accessories, lifestyle items.", tip: "Start with things you have not used for 90 days." },
      {
        bestFor: "Furniture, appliances, electronics, bikes, bigger items sold locally.",
        tip: "Good photos and local pickup often speed up the sale.",
      },
      {
        bestFor: "Electronics, books, hobby items, higher-value things.",
        tip: "It is worth comparing the price with similar active listings.",
      },
      {
        bestFor: "Fast local sales and neighbourhood groups.",
        tip: "Do not click suspicious links from buyers. Keep payment in a safe channel.",
      },
      {
        bestFor: "Collectibles, electronics, niche items with international potential.",
        tip: "Factor in fees, shipping and handling time.",
      },
    ],
  },
};

const es: CrisisCopy = {
  polandNotice: "Los números de teléfono, las instituciones y los modelos de documentos de esta página corresponden a Polonia.",
  eyebrow: "Crisis financiera",
  title: "Un plan de emergencia para cuando se acaba el dinero.",
  description:
    "Coach FI te ayuda a frenar el pánico, encontrar ayuda gratuita, contactar con las instituciones y recuperar el primer dinero sin endeudarte más.",
  voiceText: [
    "Plan de crisis financiera de Coach FI.",
    "Primero, protege la vida, la salud, la comida, los medicamentos, un techo y el contacto con otra persona.",
    "Si tienes pensamientos suicidas o temes hacerte daño, llama al 112 o al 116 123.",
    "Las deudas se pueden ordenar paso a paso. No tienes que pasar por esto a solas.",
    "No pidas otro préstamo caro bajo presión.",
    "Contacta con la asistencia jurídica gratuita, el centro de servicios sociales (MOPS u OPS), tu banco y la persona de mayor confianza.",
    "Pon a la venta cosas que no usas para recuperar el primer dinero sin aumentar la deuda.",
  ],
  safety: {
    title: "Primero, la seguridad",
    body: "Si hay riesgo para la vida o la salud, violencia o peligro inmediato, llama al 112. Si estás en una crisis de salud mental, usa la línea 116 123 o centrumwsparcia.pl.",
    emergencyDetail: "emergencias",
    mentalDetail: "crisis de salud mental",
    onlineDetail: "en línea",
  },
  tokens: {
    title: "Tokens por actuar",
    description: "Cada paso SOS completado da +{reward} Coach FI Tokens.",
    readPlan: "Leer el plan SOS",
  },
  emotional: {
    eyebrow: "Primero la persona, después la deuda",
    title: "Cuando las deudas provocan un derrumbe, depresión o pensamientos suicidas",
    description:
      "Este módulo es para adultos. Si sientes que no puedes más, no te quedes a solas con ello. Llama, escribe a alguien de confianza, pide que alguien se quede contigo. La deuda es un problema que se puede resolver, pero primero hay que cuidar la seguridad.",
    voiceText:
      "Si las deudas te provocan un derrumbe, depresión o pensamientos suicidas, primero cuida tu seguridad. Llama al 112 si puedes hacerte daño. Llama al 116 123 o al 800 70 2222 si necesitas hablar con alguien ahora. No tienes que pasar por esto a solas.",
    voiceLabel: "Leer la ayuda ahora",
    mentalHealthCentre: "Centro de Salud Mental (CZP)",
    contacts: [
      {
        subtitle: "Riesgo inmediato para la vida o la salud",
        body: "Llama de inmediato si puedes hacerte daño, estás en peligro inmediato o alguien a tu lado corre riesgo.",
        cta: "Llamar al 112",
      },
      {
        subtitle: "Línea de apoyo para adultos",
        body: "Ayuda gratuita y anónima para adultos en crisis psicológica o emocional.",
        cta: "Llamar al 116 123",
      },
      {
        subtitle: "Centro de Apoyo para adultos",
        body: "Apoyo psicológico las 24 horas para adultos en crisis de salud mental.",
        cta: "Llamar al 800 70 2222",
      },
      {
        subtitle: "Ayuda en línea",
        body: "Plataforma para adultos: teléfono, información, ayuda en línea y un directorio de lugares de apoyo.",
        cta: "Abrir 116sos.pl",
      },
      {
        subtitle: "Ayuda gratuita sin derivación",
        body: "Una persona adulta puede buscar apoyo en el Centro de Salud Mental de su lugar de residencia, también en una urgencia.",
        cta: "Buscar un centro",
      },
    ],
    steps: [
      {
        title: "1. Díselo a alguien",
        body: "Envía un mensaje corto: estoy en crisis y necesito que sigas en contacto conmigo.",
      },
      {
        title: "2. Aleja el riesgo",
        body: "Aparta las cosas con las que podrías hacerte daño. Ve a un lugar donde haya otras personas.",
      },
      {
        title: "3. Haz una llamada",
        body: "No tienes que saber explicarlo todo. Di solo: estoy en crisis, necesito ayuda ahora. En una emergencia también puedes llamar al 999 o ir a urgencias de un hospital.",
      },
    ],
  },
  city: {
    title: "Busca ayuda en tu ciudad",
    description:
      "Escribe tu ciudad. Coach FI te indicará dónde buscar un centro de intervención en crisis, los servicios sociales, asistencia jurídica gratuita y apoyo para personas con hipoteca.",
    label: "Tu ciudad",
    placeholder: "p. ej., Varsovia, Cracovia, Gdansk",
    fallback: "mi ciudad",
  },
  resources: {
    source: "Fuente",
    oikPhone: "número local del centro de crisis",
    items: {
      oik: {
        title: "Centro de Intervención en Crisis (OIK)",
        body: "Ayuda en una crisis, conversación, intervención y, a veces, alojamiento o apoyo psicológico. Busca el centro de tu zona.",
        cta: "Buscar OIK: {city}",
      },
      legal: {
        title: "Asistencia jurídica gratuita",
        body: "Puntos públicos en toda Polonia. Puedes obtener asesoramiento jurídico, orientación ciudadana o mediación.",
        cta: "Pedir cita",
      },
      mops: {
        title: "Servicios sociales (MOPS / OPS)",
        body: "Pregunta por la ayuda puntual, alimentos, medicamentos, calefacción, alquiler y el contacto con un trabajador social.",
        cta: "Buscar MOPS/OPS: {city}",
      },
      zus: {
        title: "Seguridad social (ZUS)",
        body: "Si tienes un negocio o cotizaciones atrasadas, consulta el aplazamiento, el pago a plazos o las facilidades de pago.",
        cta: "Ver facilidades de ZUS",
      },
      alimony: {
        title: "Pensión alimenticia y fondo de alimentos",
        body: "Si alguien debe contribuir al sustento de un hijo o de la familia, consulta la pensión alimenticia y las prestaciones.",
        cta: "Consultar el fondo",
      },
      credit: {
        title: "Hipoteca y cuotas",
        body: "Pregunta en tu banco por la moratoria de pagos, la reestructuración, el periodo de carencia y el Fondo de Apoyo a los Prestatarios.",
        cta: "Consultar el fondo (FWK)",
      },
      cityOffice: {
        title: "Ayuntamiento",
        body: "Las webs locales suelen publicar los números actualizados de centros de crisis, servicios sociales, puntos de asesoría jurídica y ayuda alimentaria.",
        cta: "Buscar en tu zona",
      },
    },
  },
  firstDay: {
    title: "Las primeras 24 horas",
    description: "Da pasos pequeños en el orden correcto. No intentes resolverlo todo a la vez.",
    done: "Hecho",
    reward: "+{reward} tokens",
    steps: [
      {
        title: "Escribe a la persona más cercana",
        body: "Pide un préstamo breve solo para necesidades básicas. Acordad una fecha de devolución y redactad un acuerdo sencillo.",
      },
      {
        title: "Contacta con el banco o el acreedor",
        body: "Pide una reestructuración, un periodo de carencia, un pago a plazos o que revisen las moratorias disponibles.",
      },
      {
        title: "Pide cita en la asistencia jurídica gratuita",
        body: "No ignores las cartas del juzgado, del agente ejecutor o del banco. Un abogado te ayudará a ordenar los pasos.",
      },
      {
        title: "Consulta los servicios sociales",
        body: "Pregunta por la ayuda puntual, alimentos, medicamentos, calefacción, alquiler u otra ayuda para lo básico.",
      },
      {
        title: "Pon a la venta 3 cosas que no usas",
        body: "Recupera el primer dinero sin deuda nueva. Empieza por ropa, electrónica y aparatos.",
      },
    ],
  },
  avoid: {
    title: "Qué no hacer con pánico",
    items: [
      "No pidas un préstamo rápido solo para pagar otro préstamo rápido.",
      "No ignores las cartas del banco, del juzgado, del agente ejecutor ni de la seguridad social (ZUS).",
      "No prometas a la familia una devolución sin fecha, importe y condiciones sencillas.",
      "No vendas cosas que necesitas para trabajar o para tu salud.",
      "No firmes un acuerdo cuyos costes no entiendes.",
    ],
  },
  templates: {
    title: "Modelos de mensajes y solicitudes",
    description: "Son borradores educativos para adaptar. En asuntos legales, acude a la asistencia jurídica gratuita.",
    copy: "Copiar",
    copied: "Copiado",
    polishDocumentNote: "Modelo en polaco: así se presenta en las instituciones polacas.",
    titles: {
      emotional: "Mensaje a una persona cercana cuando te derrumbas",
      request: "Petición de préstamo a una persona cercana",
      loan: "Modelo sencillo de contrato de préstamo",
      bank: "Solicitud al banco de facilidades de pago",
      mops: "Solicitud de ayuda a los servicios sociales",
    },
    emotionalText:
      "Hola, [NOMBRE]:\n\nestoy pasando por un momento muy difícil. Las deudas y el estrés me superan. No te pido que lo resuelvas todo ahora.\n\nNecesito que alguien esté en contacto conmigo durante la próxima hora.\n¿Puedes llamarme o contestarme?\n\nSi no respondo, por favor inténtalo de nuevo o pide ayuda.\nQuiero pasar este momento de forma segura.",
    requestText:
      "Hola, [NOMBRE]:\n\nte escribo porque tengo una situación económica urgente y necesito ayuda para gastos básicos: [comida/medicamentos/alquiler/transporte].\n\n¿Podrías prestarme [IMPORTE] hasta el [FECHA DE DEVOLUCIÓN]?\nQuiero hacerlo de forma honesta y clara, así que puedo enviarte ya un contrato de préstamo sencillo con la fecha de devolución.\n\nNo te pido un regalo. Te pido una ayuda breve que devolveré en la fecha acordada.\nGracias por leer esto.",
  },
  resale: {
    title: "Recupera dinero revendiendo",
    description: "El pequeño ingreso más rápido suele estar en cosas que ya no usas.",
    voiceText:
      "Pon a la venta tres cosas que no usas. Mira Vinted para ropa y accesorios. Usa OLX o Facebook Marketplace para cosas grandes de venta local. Compara la electrónica y los artículos de más valor en Allegro Lokalnie.",
    voiceLabel: "Leer consejos de reventa",
    platforms: [
      { bestFor: "Ropa, calzado, accesorios y artículos de estilo de vida.", tip: "Empieza por lo que no has usado en 90 días." },
      {
        bestFor: "Muebles, electrodomésticos, electrónica, bicicletas y cosas grandes de venta local.",
        tip: "Unas buenas fotos y la recogida en persona suelen acelerar la venta.",
      },
      {
        bestFor: "Electrónica, libros, aficiones y artículos de más valor.",
        tip: "Conviene comparar el precio con anuncios activos parecidos.",
      },
      {
        bestFor: "Venta local rápida y grupos de barrio.",
        tip: "No hagas clic en enlaces sospechosos de compradores. Mantén el pago en un canal seguro.",
      },
      {
        bestFor: "Colecciones, electrónica y artículos de nicho con potencial internacional.",
        tip: "Ten en cuenta las comisiones, el envío y el tiempo de gestión.",
      },
    ],
  },
};

const fr: CrisisCopy = {
  polandNotice: "Les numéros de téléphone, les institutions et les modèles de documents de cette page concernent la Pologne.",
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
  polandNotice: "本页的电话号码、机构和文件模板均适用于波兰。",
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
  polandNotice: "このページの電話番号、機関、書類のひな形はポーランド向けのものです。",
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
  polandNotice: "इस पेज पर दिए गए फ़ोन नंबर, संस्थान और दस्तावेज़ों के नमूने पोलैंड के लिए हैं।",
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
  polandNotice: "Os telefones, as instituições e os modelos de documentos desta página valem para a Polônia.",
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
  polandNotice: "Bu sayfadaki telefon numaraları, kurumlar ve belge şablonları Polonya için geçerlidir.",
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
