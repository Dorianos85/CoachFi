# Źródła i aktualność

Data weryfikacji: 14.10.2026. Źródło wyznacza wymaganie lub wiedzę; nie dowodzi, że Coachfi je spełnia. Lokalny prompt Foundera jest źródłem decyzji, nie skuteczności produktu. Dane obserwacji: `evidence/architecture.json`, `evidence/ux-observations.json` oraz `evidence/content-sources.json`.

| ID | Źródło pierwotne | Zastosowanie / wersja | Aktualizacja |
|---|---|---|---|
| S01 | [OpenAI multi-agent](https://developers.openai.com/api/docs/guides/agents-api/multi-agent) | Delegacja niezależnych zadań i koordynacja plików; przeczytano | Przy zmianie runtime |
| S02 | [Build skills](https://learn.chatgpt.com/docs/build-skills) | Manifest name/description, repo `.agents/skills`; przeczytano | Przy zmianie formatu |
| S03 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Cel AA; Recommendation 12.12.2024 w odczytanej wersji | Przed oceną wydania |
| S04 | [OWASP ASVS](https://owasp.org/projects/asvs) | 5.0.0; zakres z mapowaniem wymagań, bez twierdzenia o zgodności | Przed testem bezpieczeństwa |
| S05 | [OWASP LLM Top10](https://genai.owasp.org/llm-top-10/) | Edycja2025; prompt injection, dane, uprawnienia, dezinformacja, konsumpcja | Przy zmianie AI/przed release |
| S06 | [EU/OECD adult competence](https://www.oecd.org/en/publications/financial-competence-framework-for-adults-in-the-european-union_510f133c-en.html) | Rama2022; mapowanie kompetencji, szczegóły odczytu w content-sources | Przy nowym module |
| S07 | [COM-B](https://pmc.ncbi.nlm.nih.gov/articles/PMC3096582/) | Model2011, nie dowód skuteczności Coachfi | Sprawdź ograniczenia badania |
| S08 | [Retrieval practice](https://doi.org/10.1126/science.1152408) | Badanie2008; propozycja odtwarzania i późniejszej powtórki | Przy twierdzeniu o efekcie |
| S09 | [CFPB scale](https://www.consumerfinance.gov/data-research/research-reports/financial-well-being-scale/) | Oddzielny konstrukt dobrostanu; nie waliduje własnego score ani tłumaczenia | Przed adaptacją |
| S10 | [EU/OECD youth competence](https://finance.ec.europa.eu/publications/commission-and-oecd-infe-publish-joint-framework-children-and-youth_en) | Źródło do późniejszego etapu; jeszcze nie wykorzystano do programu dzieci | Przed etapem dzieci |
| S11 | [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) | Odczyt 14.10.2026 w B14: stabilny snapshot/subscription, server snapshot i hydratacja; dowód lokalnej integracji osobno w cycle-4 | Przy zmianie boundary lub React |
| S12 | [HTML Web storage](https://html.spec.whatwg.org/multipage/webstorage.html) | Odczyt 14.10.2026 w B14: magazyn origin, błędy dostępu/pojemności; prefix aplikacji nie stanowi autoryzacji ani szyfrowania | Przy zmianie kontraktu persistence |
| P01 | [Coachfi Home](https://coachfiai.com/) | Demo i nawigacja; różnice SSR/live zachowane w dowodach | Przy retestach |
| P02 | [Privacy](https://coachfiai.com/privacy) / [Terms](https://coachfiai.com/terms) | Deklaracje i szkice MVP z10.05.2026 | Zweryfikować implementację przed release |

Dodatkowe finansowe źródła poszczególnych pytań są przy rekordach pilota i w `evidence/content-sources.json`. Prawo, podatki, produkty i cenniki wymagają aktualnego źródła dla kraju/dostawcy przy każdym wydaniu. Nie używaj cache web do oceny stanu po hydratacji. Lockfile i zainstalowane wersje lokalnego patcha odczytano: Next 15.5.27, Vitest 4.1.11, Vite 8.3.4, Supabase/Postgrest 2.105.4; referencje zależności w cyklu 2 i SDK w cyklu 3. To nie potwierdza zmiany zdalnego wdrożenia.

Źródła C11 saving-habit PL/EN, sprawdzone15.10.2026: [recenzja finansowa](cycle-11/financial-review.md), [metadata](cycle-11/content-metadata.json) oraz evidence/cycle-11/content-author-sources.json i root-primary-source-check.json. CFPB savings/budget, BFG/KNF deposit/product risk i Investor.gov DCA wspierają ograniczone definicje; konwencja minimum/extra debt jest adaptacją przykładu, bez nowej stawki, rekomendacji produktu lub walidacji skuteczności.

## Cykl14 — kalkulator inflacji

15.10.2026. Zweryfikowano ogólną definicję inflacji i różnicę między nominalną a realną wartością: [ECB: inflacja](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html), [ECB: stopy nominalne i realne](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/nominal_and_real_interest_rates.en.html). Nie użyto bieżącego CPI ani rynkowej stopy. Własny model używa dokładnego ilorazu, stałych hipotetycznych stóp i jednakowych dopłat na koniec roku.

[SEC: kalkulator procentu składanego](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator) wspiera jawne założenia, a [SEC: produkty inwestycyjne i ryzyko](https://www.investor.gov/introduction-investing/investing-basics/investment-products) — brak gwarancji i możliwą stratę. Nie przenoszono produktów lub prawa USA na rynek Polski. Pełne strony GUS nie były dostępne przez narzędzie; metadata wyszukiwania nie jest pełną weryfikacją. [Dokładne statusy źródeł](../../evidence/cycle-14/financial-review-primary-sources.json).

Z kodu/lockfile odczytano aktualny lokalny stos: Next15.5.27, React19.2.6, Vitest4.1.11/Vite8.3.4. Wcześniejszy wpis o braku wersji dotyczył początkowego audytu przed pobraniem kodu. Stan zależności produkcyjnego wdrożenia wymaga odrębnego dowodu.

## Cykl15 — lekcja i quiz inflation

15.10.2026. Dziewięć pełnych odczytów źródeł pierwotnych, w tym ponowne wykorzystanie dzisiejszych odczytów trzech ECB: definicja ważonego koszyka i nominalne/realne wartości. [SEC: procent składany i reguła72](https://www.investor.gov/additional-resources/information/youth/teachers-classroom-resources/what-compound-interest), [Federal Reserve: założenia reguły72](https://www.stlouisfed.org/open-vault/2018/september/how-compound-interest-works), [SEC: dywersyfikacja i ryzyko](https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments), [KNF: świadome inwestowanie](https://www.knf.gov.pl/dla_konsumenta/kampanie_informacyjne/Inwestuj_swiadomie). Pełny wykaz dziewięciu dostępnych źródeł i ograniczeń w evidence/cycle-15/financial-review-primary-sources.json w repo; wynik GUS pełnej strony unavailable, search metadata only. Własne dokładne rachunki w groszach/ilorazach; brak bieżącego CPI, produktu, stawki lub przeniesienia prawa USA do Polski.

## Cykl16 — kredyt i stopy dla Polski

15.10.2026. Dziesięć pełnych odczytów pierwotnych, dokładne statusy w repo evidence/cycle-16/financial-review-primary-sources.json i root-primary-source-check.json. [BIK: ocena punktowa](https://www.bik.pl/dla-ciebie/ocena-punktowa-bik), [BIK: scoring a zdolność](https://media.bik.pl/informacje-prasowe/859018/wnioskowanie-o-kredyt-a-scoring-bik), [KNF: stała i zmienna stopa](https://www.knf.gov.pl/dla_konsumenta/kampanie_informacyjne/stala_czy_zmienna_stopa_oprocentowania), [SEC: ryzyko obligacji o stałej stopie](https://www.sec.gov/files/ib_interestraterisk.pdf). Źródła BIK2025/current różnią się prezentacją liczby czynników; materiał nie uczy wag, liczby lub rankingu. Starsze KNF służy ogólnemu ryzyku, bez aktualnych limitów prawnych/stawek. CFPB wspiera zasadę nadwyżki po minimum, SEC stałe przepływy/cena i rentowność; bez transplantacji prawa lub produktów USA. Wszystkie przykłady hipotetyczne PLN, niezależne całkowite grosze w financial-review-independent-numbers.json.

## Cykl17 — fundusz awaryjny

15.10.2026. [CFPB: emergency fund](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/) wspiera cel zależny od sytuacji, mały start i nieregularne dochody; bez przenoszenia prawa lub produktów USA. [NBP: poduszka finansowa, PDF](https://edycja6.zloteszkoly.nbp.pl/images/do_pobrania/1_edycja/Poyczanie_pienidzy_a_poduszka_finansowa.pdf) podaje3miesięczne wynagrodzenia, nie3–6miesięcy wydatków; nie używamy go jako normy tego zakresu. BFG iKNF odczytano dla jakościowego rozróżnienia ochrony podmiotu/produktu i ryzyka, bez bieżących limitów/stawek. Pełne statusy w evidence/cycle-17/financial-review-primary-sources*.json w repo, root-primary-source-check.json i niezależne groszowe rachunki. Ochrona potrzeb/minimów przed opcjonalnym odkładaniem jest jawnym warunkiem projektu.

C23 (15.10.2026): [CFPB emergency fund](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/) odczytany świeżo niezależnie. Wspiera zależny od sytuacji cel i mały start; nie dowodzi gwarantowanej redukcji zaległości ani obowiązkowego miesiąca. Lokalny hipotetyczny przykład PLN jest założeniem ćwiczenia, nie prawem/produktem USA. Pełne granice i źródło w cycle-23/financial-review.md i evidence/cycle-23/financial-primary-sources.json repo.

C24 PL/EN long-term-investing:8primary sources in cycle-24/content-metadata.json; independent ESMA/KNF checks in evidence/cycle-24/financial-primary-sources.json. Hypothetical PLN, no current product/tax/legal recommendation. Fresh read2026-10-15; actual source review in financial-review.json.

C25 PL/EN retirement:5primary sources in cycle-25/content-metadata.json; independent ZUS/KNF/SEC checks in evidence/cycle-25/financial-primary-sources.json. Hypothetical PLN, no current product/tax/legal recommendation. Fresh read2026-10-15; actual source review in financial-review.json.

C26: twoOECDprimaryPDFs read2026-10-15, exactscope/year/sample/item/scoring andassociationvsoutcomes reviewed incycle-26/content-metadata.json andevidence/cycle-26/financial-primary-sources.json. No newproductpercentage; existing33% attributionunmatched, notuniversalfalse. Challengec15outsidefix.

C27 primary OECD historical scope and KNF/CFPB generic monthly-budget material checked2026-10-15; exact sources and limits in source/CoachFi/docs/coachfi/cycle-27/content-metadata.json and financial-primary-sources.json. No new current law/rate/product/statistic published.

C28 primary KNF/CFPB/SEC/ESMA basic finance material checked2026-10-15; exact sources and limits in source/CoachFi/docs/coachfi/cycle-28/content-metadata.json and financial-primary-sources.json. No new current law/rate/product/statistic published.


C29: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-29/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-15. Root focusedprimaryread evidence/cycle-29/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C30: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-30/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-30/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C31: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-31/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-31/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C32: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-32/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-32/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C33: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-33/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-33/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C34: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-34/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-34/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C35: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-35/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-35/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C36: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-36/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-36/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C37: primarysources i dokładne zastosowanie w source/CoachFi/docs/coachfi/cycle-37/content-metadata.json oraz niezależnym financial-review.json; checked2026-10-16 (Europe/Warsaw). Root focusedprimaryread evidence/cycle-37/root-primary-review.json. Bez przenoszenia prawa/podatków USA do Polski; bez aktualnych ofert/stawek i statystyk.


C38: checked2026-10-16. GHSA-w9m9-85wc-3x92, official postcss-selector-parser releases6.1.3/6.1.4, issue321/PR316 oraz publiczny registry; dokładny zakres i linki w root-primary-review.json/security-priority-triage.json. GHSA-rj75-hqrm-r3gf remainsopen; brak ogólnego securityPASS.
