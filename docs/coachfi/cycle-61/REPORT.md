# C61 — informacja o wyniku wylogowania

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. Zakres: dorośli w Polsce, PL/EN, warunkowa ścieżka Supabase bez CDP. Produkcja **NO_GO**, zewnętrzne AI i zapisy do chmury **HARD_OFF**.

Po błędzie usługi aplikacja pokazywała zwykły przycisk logowania, bez informacji o niepotwierdzonym wylogowaniu i bez ponowienia. Teraz pokazuje oczekiwanie, ogólny komunikat błędu PL/EN i przycisk ponowienia. Podwójne wywołanie tego samego handlera rozpoczyna jedną próbę SDK. Szczegóły błędu dostawcy nie trafiają do komunikatu.

Lokalne odłączenie konta nadal następuje przed oczekiwaniem na SDK. Błąd nie przywraca poprzedniego właściciela. Późna odpowiedź nie zmienia nowego zalogowania A/B, stanu po unmount ani wyłączonego providera. Prawidłowe zdarzenie SIGNED_OUT w trakcie własnej próby nie zostawia oczekiwania na zawsze po zakończeniu mocka. Zachowano signin, cały istniejący bank komunikatów i domyślny zakres wylogowania. Kontrakt wyniku sprawdzono w [oficjalnej dokumentacji signOut](https://supabase.com/docs/reference/javascript/auth-signout) oraz źródłach zainstalowanego SDK; nie zmieniano konfiguracji usługi.

| Kontrola | Wynik lokalny |
| --- | --- |
| Baseline | 0 PASS / 18 FAIL, 18 obserwacji |
| Te same przypadki po zmianie | 18 PASS / 0 FAIL / 0 SKIP, bez korekty fixture |
| TypeScript | 1 PASS, 573 wejścia, bez driftu |
| Izolowany TEMP build | 1 PASS, 34 strony / 35 tras; 573 przed / 572 po, bez driftu |
| Chrome / rzeczywisty provider | Nie wykonywano |

18 odrębnych przypadków daje 36 wykonanych instancji w dwóch przebiegach. Nowe pola wyniku i statusu stanowią kontrakt; 18 błędów baseline nie oznacza 18 dawnych luk. Raw potwierdza konkretny brak błędu/ponowienia PL/EN i dwa wywołania mocka przy zachowanym handlerze. Dotychczasowa synchroniczna ochrona właściciela działała już przed zmianą.

Testy wywołują rzeczywisty AuthProvider, useAuth, AccountButton, kontroler i lokalny mechanizm właściciela. React, cykl efektów i kontekst mają jawny emulator, cały moduł klienta SDK jest zastąpiony emitterem oraz kontrolowanymi obietnicami. Obserwator zwraca tę samą obietnicę i zapisuje odrzucenie starego handlera bez podmiany wyniku. Ponowienie wykonano tylko przez istniejący nowy przycisk; brak przycisku w baseline nie został uznany za wykonane ponowienie.

Osobne syntetyczne local/session Maps i wartości 125/251 oraz 321/432 pozostały bez zmian: zero zapisów, usunięć i fetch; dopuszczono tylko zdarzenia cyklu właściciela. Pokryto nowe zalogowanie A/B i trzy późne wyniki oraz unmount, wyłączenie, brak klienta i prawidłowy null-event. Nie potwierdzono prawdziwego SDK, konfiguracji wdrożenia, unieważnienia sesji/JWT, chmury, stagingu, natywnej klawiatury/AT/pełnego AA ani innych języków. Nowe komunikaty oceniono w PL/EN; siedem innych locale ma angielski fallback i nie otrzymuje PASS.

Naprawiono jeden finding narzędziowy przed pierwszym capture: bootstrap sprawdza teraz odziedziczone receipts przed ich ponownym przypięciem. Nie zaobserwowano zmiany dawnych dowodów. Pełny stderr C60 jest równy po jedynej zmianie czasu 28.8s→32.0s; ostrzeżenia x402-fetch/@base-org/account pozostają. Historyczny dependency deferral C50 bez nowego pollu lub instalacji.

Recenzje: dwie niezależne, bez otwartych uwag tej delty; finalny ledger osobnym addendum.

[Freeze 245](../../../evidence/cycle-61/source-freeze.json) zawiera 238 wcześniejszych literalnych ścieżek, 13 preserve, 22 receipts i 11 pinów kontraktu SDK (6 dawnych + 5 publicznych Supabase). Z 572 dawnych aktualnych wejść 570 jest literalnych, dwa pliki produktu jawnie zmienione. Dokładna historyczna korekta fixture C60 została przejęta w bootstrapie; jej oryginalny manifest jest niezmienny. Następny bootstrap używa kompletnego C61 source-freeze.json wprost, bez suplementu.

Autor produktu: c49_advisories. Autor fixture: c49_validation. Root: narzędzia, wykonanie, metadata i niezależny peer fixture. Primary: c49_dependency_review. PRODUCT: c49_validation z wyłączeniem własnej fixture. Osobny ledger review po zapisach. Wszystkie 40 tasks i ich statusy obu backlogów pozostają bez szerszego zamknięcia. HEAD/branch/index zachowane; bez nowego add/commit/push/deploy, produkcyjnych zapisów lub kontaktów. [Dowody](../../../evidence/cycle-61/verification.json).
