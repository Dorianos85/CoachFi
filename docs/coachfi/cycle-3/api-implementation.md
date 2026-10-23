# B13 — warunek oczekiwanej tożsamości API konta

14.10.2026. Autor: root. Niezależny recenzent: ux_audit. Zmieniono wyłącznie `app/api/account/route.ts`; testy `tests/cycle3-account-api.test.ts` używają syntetycznej weryfikacji CDP i storage mocków, bez SDK, połączenia DB lub provider calls.

Nowy klient synchronizacji konta dołącza `x-coachfi-account-user-id` z przechwyconej generacji sesji. Po autorytatywnym `verifyCdpUser(token)` API porównuje ten opcjonalny warunek z zweryfikowanym `identity.userId`. Różnica daje 409 `Account session changed` przed każdym storage access — również GET i DELETE. To zabezpieczenie sytuacji, w której getter oddaje token B, zanim React cleanup zamknie sesję A.

Nagłówek nie uwierzytelnia ani nie wybiera właściciela danych. Bez ważnego Bearer nadal 401; konfiguracja i same-origin checks zachowują kolejność. Właściciel odczytu/zapisu zawsze pochodzi z weryfikacji serwerowej. Starsze wywołania bez nagłówka zachowują dotychczasowe zachowanie; nowa ścieżka account-sync wysyła go zawsze. Nie przebudowano historii, RLS, retencji ani autoryzacji dostawcy. Anulowanie klienta nie cofa operacji zaakceptowanej już przez serwer.

Autorskie testy API: 12/12 PASS na mockach, 14.10.2026, Vitest 4.1.11, Node 24.19.0. Pierwsze uruchomienie w sandboxie miało EPERM podczas zapisu cache i nie wykonało testów; dozwolone ponowienie zakończyło się PASS. Niezależny werdykt wymaga osobnego odbioru. To lokalny patch bez push/deploy.

Root zmienił też montowanie w `app/providers.tsx`: gdy skonfigurowano CDP, legacy AuthProvider dostaje `enabled=false`. Implementację disabled bez uruchamiania fabryki Supabase dostarcza architecture_audit. Testy wyboru gałęzi w `tests/cycle3-provider-selection.test.ts` używają stubów hooków/komponentów; nie renderują ani nie inicjalizują prawdziwego SDK. Osobne testy autora i recenzenta sprawdzają lifecycle AuthProvider. Wybór gałęzi ogranicza równoległych właścicieli zapisu; nie jest migracją danych ani dowodem izolacji wszystkich lokalnych kluczy.

Opis AccountButton w PL/EN informuje o zapisie nowego postępu po udanej synchronizacji i braku automatycznego importu wcześniejszych danych urządzenia. Zmieniono tylko dwa teksty description, bez auth flow. Pozostałe języki nie są objęte bieżącym zakresem produktu.
