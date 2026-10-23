# C51 — bezpieczny odczyt avatara

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED.18.10.2026. Root autor lib/avatar.ts i narzędzi; c49_validation autor fixture; root peer fixture, c49_dependency_review source/tools/raw reviewer, c49_advisories niezależny fixture/raw/ledger reviewer. Lokalna paczka, produkcja NO-GO.

Przy JSONnull w cache aktywna strona /avatar przerywała efekt odczytu; przy {} lub nieobsługiwanym style przerywała kolejny render. getAvatar przepuszczał dowolny JSON jako AvatarData. Reader sprawdza teraz niepusty obiekt, obecne gender oraz identyfikator z istniejących AVATAR_STYLES. Pozostałe kształty dostają dotychczasowy DEFAULT_AVATAR. Zachowano sześć prawidłowych kombinacji, extras poprawnych rekordów, raw bajty, default reference, saveAvatar i całą stronę/copy. Jedna zamiana return na sześć linii, CRLF zachowane.

| Bramka lokalna | Wynik |
|---|---|
| Baseline tych samych 33 przypadków | 15 PASS / 18 FAIL: 12 getterów + 6 rzeczywistych stron po emulowanych efektach |
| Po poprawce, literalne fixture | 33/33 PASS; wszystkie 18 wcześniejszych FAIL zamknięte |
| Dotknięte historyczne | 22 PASS w jednej C4personal suite; 55 różnych Node/SSR przypadków w dwóch udanych przebiegach |
| Jeden TypeScript / jeden TEMP build | TS0/549pins; build PASS z ostrzeżeniami, 34 strony/35 tras, 549 wejść przed / 548 po, 0 driftu |
| Chrome, pierwsza próba | 5 PASS / 1 błąd uruchomienia Chrome przed body null PL; historyczny run nadal FAIL |
| Chrome, tylko niedoszła próba | 1 PASS; nie powtarzano pięciu zielonych. 6 różnych zaliczonych scenariuszy / 7 prób, retries0 |
| Niezależne końcowe recenzje | dwie niezależne recenzje PASS; 0 otwartych uwag do tej delty |

Node używa rzeczywistych getAvatar/owner leases/Map oraz AvatarPage/SectionHeader/Button/ReactDOMServer. State/effect lifecycle jest jawnym emulatorem; locale/voice/storage-hook inputs i motion.button są zastąpione, notify mock/fetch trap. Baseline odtworzył 2 TypeError.gender w effect oraz 4 TypeError.title w following-render. Po poprawce 8 actualPage cases dało 10 udanych ramek SSR, bez twierdzenia o hydration. Osobny Chrome sprawdził realny shell i stronę PL/EN, null/badstyle/healthy, mobile375×812, keyboard Space bez Save/voice i reload. Siedem kluczy w obu storage areas bez set/remove po seedowaniu; raw zachowane. API0/pageErrors0 w zaliczonych scenariuszach; external requests blokowane, bez osobnego totalnetwork0 claim. Tylko czyste konteksty i dane syntetyczne, bez rzeczywistych profili/sesji lub auth PASS.

Pierwszy Chrome zakończył się 5PASS/1startupFAIL. Ponowiono wyłącznie niedoszły null PL, na tym samym builtTEMP, bez zmian produktu/testów/config/runtime lub kolejnego buildu. Niezależny review narzędzia retestu znalazł dwie uwagi: wspólny katalog wyników i guard childreceipt dopiero po uruchomieniu. Obie poprawiono przed wykonaniem; oryginalne JSON/trace/error-context zachowane. Retest ma osobne wyniki, guard przed startem, rawchild przed parsowaniem i exact1case gate. Brak twierdzenia o naprawie stabilności Chrome.

Build ma pełny stderr C50 identyczny po samej normalizacji43s→26.5s; nadal ostrzeżenia x402-fetch i @base-org/account. Runtime istniejący, bez clean-install. 150 pierwotnych source/tool pins pozostają zamrożone; nowy helper retestu ma oddzielny source-freeze-addendum, który następny cykl musi dołączyć do historii (151łącznie). 141 wcześniejszych ścieżek literalnych, 545/546 wcześniejszych wejść literalnych + jawnie zmieniony avatar, 11preserve/12receipts C39–50 zachowane.

Pomysł health-postreadrace odrzucono: realny makeHandle zwraca null po zmianie właściciela; bez zmiany zdrowego kodu. C50 dependencydeferral zachowano bez kolejnego poll lub mutacji. Statyczne liczby Saving67%, Investing40%, Credit80% i FinancialShield62/100 na stronie avatara pozostają poza tą poprawką; [osobna obserwacja źródłowa](../../../evidence/cycle-51/follow-up-observations.json) wskazuje następne lokalne zadanie uczciwego oznaczenia demo. C51 nie potwierdza ich jako rzeczywistego wyniku.

B14 i wszystkie40tasks obu backlogów bez zmiany. HEAD/branch/index zachowane; bez nowych gitadd/commit/push/deploy, migracji/zapisów produkcyjnych, prawdziwych sesji/profili/sekretów/płatnych/provider calls. AI/cloud writes HARD_OFF; brak staging/produkcja PASS.

[Dowody i recenzje](../../../evidence/cycle-51).
