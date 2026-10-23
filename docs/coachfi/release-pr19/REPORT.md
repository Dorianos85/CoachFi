# PR19 — poprawki po audycie, 19.10.2026

Stan: lokalne poprawki, testy i ograniczone recenzje zakończone; publikacja aktualizacji PR w przygotowaniu. Produkcja **NO-GO**. Pętla pozostaje wstrzymana.

Praca odbywa się w izolowanej kopii `source/CoachFi-pr19` (kopia w workspace Foundera), na bazie PR19 `15de7163a39a1cfc2cce1eb241ff2c9d14de1b86`, z dołączeniem main `810c3d93ea0aeb2b363afad7a3c00fd9b461d626`. Oryginalne zmiany w `source/CoachFi`, jego HEAD, gałąź i indeks zachowano. Trzech specjalistów miało rozłączne pliki; autorzy nie przyjmowali własnych rezultatów.

| Temat audytu | Wynik i granica dowodu |
| --- | --- |
| SEC-01, certyfikat WWW | Naprawiono rzeczywiste powiązanie domeny w Vercel. HTTPS www przekierowuje 308 na apex z zachowaniem `/`, `/privacy`, `/terms`. Normalne TLS GET roota i niezależne HEAD specjalisty przeszły; apex 200. Bez deployu aplikacji i bez zmian DNS/MX. |
| SEC-02, tylko wymagane zgody | Zachowano poprawkę już obecną w PR19. Cztery opcjonalne wybory pozostają false; testy odrzucają starsze/uszkodzone rekordy i sprawdzają brak aktywacji wyłączonych dostawców. 11 nowych testów lokalnych PASS. |
| SEC-03, eksport sesji | Zachowano poprawkę PR19: schemat i allowlista wybranych danych bieżącego właściciela. 7 nowych testów PASS, w tym dokładny klucz `coachfi-auth`, nieznane i zagnieżdżone pola. Wybrane dane lokalne nie są pełnym eksportem konta. |
| CONTENT-01, oszczędność 24 192 | Usunięto nieuzasadniony wzór, suwak i kafel nadpłaty. Symulacja oszczędzania jawnie podaje PLN, nominalne 5,5%, kapitalizację miesięczną i wpłaty na koniec miesiąca oraz pominięte koszty, podatek i inflację. |
| CONTENT-02, pozorny wynik 42/100 | Dostępność odczytuje sprawdzoną lokalną diagnozę bieżącego właściciela albo pokazuje brak wyniku. Przykłady są oznaczone w tekście i odczycie. Wskaźnik ma rzeczywisty limit 98. |
| UX-LIVE-01 / CONTENT-05, PL/EN waluta | Angielskie etykiety rynku Polski używają PLN. Zmiana języka nie przelicza ani nie zmienia jednostki kwoty. Łącznie 12 lokalnych testów finansów/dostępności PASS; bez potwierdzenia rzeczywistego głosu systemowego. |
| SEC-04, prywatność | Częściowo: PL/EN opisuje rzeczywiste granice lokalnego zapisu, odczytu konta, serwera, eksportu i usuwania. Potwierdzony właściciel jest wskazany. Kontakt, pełne dane administratora, podstawy prawne, retencja, ustalenia z dostawcami i obsługa praw nadal wymagają faktów oraz niezależnej recenzji. Brak zatwierdzenia prawnego i produkcyjnego. |

## Integracja i testy

Sześć konfliktów rozwiązano z zachowaniem dorosłego zakresu, potwierdzenia wieku, ochrony właściciela i wyłączenia automatycznych zapisów chmurowych. Zachowano aktualne PL/EN banki pytań, identyfikatory, punktację i prawidłowe odpowiedzi; dopuszczenie nowych tłumaczeń z main ma ścisłe odwzorowanie i testy odrzucające nieoczekiwane zmiany. Wycofano wyłącznie cztery nowe testy E2E odroczonych Kids/Teen i niezamontowanego paska trybów; oryginał zarchiwizowano, przypadków nie uruchomiono i nie liczono jako PASS. Dotychczasowe testy ograniczenia zakresu pozostają.

- Świeże `npm ci --ignore-scripts`: 548 pakietów, bez zmiany lockfile; Next 15.5.27, Vitest 4.1.11, React 19.2.6, TypeScript 5.9.3. Obaj konsumenci parsera używają 7.1.6. Wyłączone skrypty instalacyjne są jawnym ograniczeniem.
- Pierwszy pełny przebieg: 179 plików, 3586 przypadków, 3565 PASS / 21 FAIL / 0 pominiętych. Oryginalne wyniki zachowano.
- Po poprawkach zgodności fixture: 178 PASS w siedmiu powiązanych plikach, w tym 6 nowych testów ochronnych. Cztery nieudane testy finansowe i jeden CSS przeszły w dokładnym reteście; pozostałych zielonych nie powtarzano.
- Jeden test C14 dwukrotnie zawiódł w przygotowaniu async; potem ten sam niezmieniony przypadek przeszedł bez zmiany timeoutu. Przyczyna pozostaje niepotwierdzona. Nie jest to pojedynczy pełny zielony przebieg; niestabilność przygotowania testu pozostaje odnotowana.
- Łączne pokrycie po retestach obejmuje 3592 zarejestrowane przypadki w 180 plikach. Nazwy testów parametrycznych mogą się powtarzać; wszystkie 21 pierwotnych nieudanych tożsamości ma późniejszy PASS. Niezależnie sprawdzono mapowanie i dzienniki: 0 prób rzeczywistej sieci/bazy w workerach.
- Końcowy TypeScript: PASS, 460 przypiętych wejść, brak zmiany ich bajtów. Pierwotne cztery błędy typów mocków i oddzielny preflight bez uruchomienia kompilatora zachowano; korekta typów nie zmieniła emitowanego JavaScriptu testów bezpieczeństwa.
- Rzeczywisty Next production build w TEMP: PASS, 34/34 stron wygenerowanych, 35 tras. Dwie odpowiedzi fontów zastąpiono jawnym fontmockiem; nie testowano prawdziwych fontów ani przeglądarki. 817 wejść źródłowych zachowane, w kopii 816 oraz jawny generowany `next-env.d.ts`; 650 ograniczonych rekordów runtime bez zmian. To kontrola manifestów pakietów, locków, wybranych entrypointów i 37 plików parsera, nie pełny hash całego runtime. Dziennik: 50 wpisów, 25 gotowych kontekstów PID/wątek, 0 prób sieci. Zachowano dwa ostrzeżenia opcjonalnych modułów CDP (`x402-fetch`, `@base-org/account`). Pierwszy kosztowny preflight przerwano przed startem Next; jego wejścia i nota zachowane, bez zaliczenia jako test lub błąd aplikacji.

## Otwarte bramki

Jednorazowy aktualny audyt dokładnego lockfile zgłasza **5 high / 7 moderate / 0 critical**. Pięć wysokich węzłów pochodzi z jednego [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) w deweloperskim łańcuchu Tailwind/braces. Oficjalny advisory nie podaje poprawionej wersji braces. Sugerowana duża migracja Tailwind 4 wymaga osobnej poprawki i testów; nie wykonano `audit fix --force`. Nie potwierdzono wykorzystania luki ani zdalnej osiągalności wzorca przez użytkownika aplikacji. Brak zamknięcia audytu zależności.

Niezależna recenzja pozostawiła także niepotwierdzoną hipotezę przejściowego pokazania starego stanu zgód/diagnozy podczas zmiany właściciela przed efektami React (`OWNER-TRANSIENT-01`). Wymaga kontrolowanego odtworzenia; nie deklarujemy rzeczywistego wycieku ani PASS izolacji kont.

Brakuje testów dwóch kont, Auth/RLS, odtworzenia/cofnięcia wydania oraz procesów prywatności w stagingu. Aktualny helper prywatności zwraca `ready:false`, ale nie jest samodzielną blokadą CI. Automatyczne wdrożenie gałęzi PR jest wyłączone w `vercel.json`; nie należy łączyć PR do produkcyjnego main, dopóki bramki nie zostaną przyjęte. Zewnętrzne AI i zapisy chmurowe pozostają wyłączone.

## Bezpłatna poczta

Wstępne DNS nie miało MX. Zoho plan Free może zapewnić pełne skrzynki we własnej domenie, jeśli jest dostępny dla regionu/konta; potwierdzenie w panelu nadal oczekuje. Formularz Free jest otwarty. Founder sam ustawia hasło i przyjmuje warunki. Nie utworzono skrzynek, aliasów ani rekordów MX i nie aktywowano adresu w polityce. Przekierowanie Cloudflare jest inną usługą: nie daje pełnej skrzynki i wysyłania.

Źródła: [Zoho — plany i ograniczenia Free](https://www.zoho.com/mail/help/adminconsole/subscription.html), [Cloudflare Email Routing](https://www.cloudflare.com/products/email-routing/). Dostawca, dostarczalność, ewentualne umowy i faktyczne koszty muszą zostać potwierdzone; płatne usługi nie zostały uruchomione.

Dowody, raw, hashe, recenzje i ograniczenia: katalog workspace `evidence/release-pr19-2026-10-19/`. Publiczna aplikacja nadal nie jest tą paczką PR; zmiana powiązania WWW nie wdrożyła nowego kodu.
