# Coachfi.ai — cykl2 lokalnych poprawek

14.10.2026. Polecenie Foundera: kontynuować w `/loop`. Włączono kontynuację tego czatu co10min; automatyzacja `coachfi-ai-kontynuacja-poprawek`. Lokalna gałąź `codex/p0-security-consent-export`, bez push/deploy, zmian produkcji, rzeczywistych sesji lub płatnych provider calls. Zachowano [pierwszą paczkę P0](../p0/REPORT.md).

## Przygotowane poprawki

| Problem | Zmiana i dowód | Granica |
|---|---|---|
| Pozostałe podatne zależności | Usunięto4 nieużywane wallet adapters i jedyny CSS import. Scoped ws7.5.11/ws8.22.0, Browserslist4.28.7, baseline2.11.0, Vitest4.1.11 z odświeżonym zgodnym toolchain. Własny Node range odpowiada przecięciu wymagań: `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0`. | Bieżący audit42→18, high19→5, critical0; production omit-dev12moderate/0high/0critical. Pięć high w build tooling bez wskazanej poprawionej wersji pozostaje otwarte. To wpisy pakietów, nie liczba exploitów. |
| Dodatkowy publiczny status | `/api/status` zwraca wyłącznie lokalną stałą politykę, bez probes/SDK/RPC/keypair/env i danych agent/voice/table/authority. | Poprzednia droga wynikała z odczytu kodu; nie wykonywano rzeczywistych wywołań. Nie oceniamy dostępności dostawców. |
| Pozorne logowanie i trial | Diagnoza nie zbiera e-maila/marketingu, nie tworzy konta i nie aktywuje triala. Pokazuje prawdziwy zapis lokalny oraz następny krok do lekcji. | To naprawa lokalnego demo, nie test logowania/synchronizacji kont. |
| Wynik i demo | Zachowano dotychczasowe wagi: maksimum98, wersja i9 składników, jawne grupy60/32/6. Wszystkie kwoty i deklaracje są edytowalne, nowe pola puste. Home/shell pokazują zapisany `/98` i proporcjonalny ring; przykład42/100 jest odrębny. | Heurystyka bez walidacji naukowej. Deklaracja wiedzy nie jest jej pomiarem; normatywny sens starych wag nadal wymaga projektu/badania. |
| Walidacja i zapis | Missing nie staje się0; negative, nonfinite, wrong types i>1e12 są odrzucane. Zero jest dozwolone, undefined ratios są null. Storage failure nie ogłasza sukcesu i zachowuje poprzedni zapis. Required withdrawal ukrywa cached wynik. | Magazyn urządzenia nie stanowi dowodu izolacji kont ani backupu. |
| Migracja jednostek | Stare kompletne answers przeliczane bez wiary w cachedscore i bez autowrite; incomplete/future schema są pomijane. Nowe wpisy mają PLN. Legacy currency jest nieznana, kwoty nie wypełniają formularza PLN, brak FX. | Historyczne EN używało$, bez currency w rekordzie. Nie wywnioskowano USD/PLN na podstawie obecnego języka. |
| Wybrany eksport i brak wysyłki | Schema2 ma strict source/currency, recomputed score/breakdown, tylko znane pola; goal i credentials pominięte. Legacy partial jest osobnym dumpem z unknown-unit marker. Stary health event jest odrzucany przed DB/payload w cloud bridge. | Eksport nie jest pełną kopią do reimportu; cel pominięto. Brak procesu pełnych praw danych konta/dostawców. |

## Testy i recenzje

[Zapis kontroli koordynatora](../../../evidence/cycle-2/verification.json): Vitest **313/313 PASS** w 22 plikach, Node fixture/dependency checks **11/11 PASS**, E2E **20/20 PASS** PL/EN w izolowanym Chrome. Finalny build zakończył się kodem 0 i wygenerował **34/34 strony statyczne**; osobny `npm run typecheck` jest **PASS**. Kontrola repo po lokalnym stagingu: **PASS**, 516 wpisów, 234 sprawdzone pliki tekstowe, 1 pominięty duży plik, 0 findings. Pozostały wcześniejsze ostrzeżenia opcjonalnych importów Coinbase (`x402-fetch`, `@base-org/account`).

E2E obejmuje wycofanie, brak/negative/zero kwot, fokus pierwszego błędu, quota/storage failure, editable investing weight i reload, legacy units, denominator home/shell, local read-aloud oraz cały poprzedni P0 i lokalny status. Nie liczymy odroczonych aktywnych widget/Kids/TTS testów jako PASS.

Niezależne [dependency review](dependencies-review.md), [health/UI review](health-ui-review.md) i [recenzję integracji](integration-review.md) wykonał ux_audit: ograniczone ACCEPT lokalnych zmian. Architecture_audit jest autorem dependencies/status, a niezależnym recenzentem [health/data](health-data-review.md), którego autorami są curriculum_pilot i koordynator: ograniczone ACCEPT. Jego 9 testów obejmuje również 96 osobnych scenariuszy racjonalnego oracle, nie 96 osobno raportowanych testów Vitest. Własne wyniki recenzentów, źródła, findings i hashes są rozdzielone od kontroli koordynatora.

W toku review poprawiono Node/toolchain range oraz jednostki legacy. Po zmianie waluty zaktualizowano ścisły eksport i testy; wcześniejszy zielony run bez currency nie zastępuje finalnego313PASS. Pojedyncze timeouty automatycznej oceny uprawnień wystąpiły przed uruchomieniem poleceń; dopuszczone ponowienia przeszły. Nie oznaczają awarii aplikacji lub wykonanych testów.

Pierwszy osobny typecheck wykrył niezgodną składnię BigInt i typ mocka w dwóch nowych testach recenzentów. Ich autorzy poprawili wyłącznie testy; celowane retesty **9/9** i **106/106 PASS**, a końcowy typecheck **PASS**. Nie zmieniono kodu aplikacji ani konfiguracji TypeScript. Zbiorczy wynik 313/313 dotyczy wykonania przed tymi korektami typów; późniejsze retesty potwierdzają dotknięte testy.

## Dalsza praca pętli

Następne zadanie: B13 — oczekujące callbacki/timery/hydration podczas zmiany sesji. Znaleziono kodową drogę w istniejącym AuthContext, bez live cross-user próby. Wymagane osobne epoch/cancellation tests; obecna blokada health upload nie zatwierdza całej synchronizacji. Backlog B10, publiczna historia profili, staging/RLS, prawa do danych i operacyjny budżet pozostają otwarte. Produkcyjne wydanie nadal **NO-GO**; zewnętrzna Mila jest wyłączona.

Lokalne pętle wymagają włączonego komputera i aplikacji: [OpenAI Docs — scheduled tasks](https://learn.chatgpt.com/docs/automations?surface=app). Pętla nie wprowadza uprawnień do produkcji, wydatków ani kontaktu z ludźmi.
