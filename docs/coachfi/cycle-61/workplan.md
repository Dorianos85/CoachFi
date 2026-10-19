# C61 — jawny wynik wylogowania Supabase

Status: SOURCE_CONFIRMED_BASELINE_PENDING. Dorośli w Polsce, PL/EN, wyłącznie lokalne moki. Ścieżka AccountButton jest warunkowa: skonfigurowany Supabase i brak CDP. Nie odczytujemy konfiguracji wdrożenia ani prawdziwych sesji. C59 wskazał ignorowany wynik SDK {error} po prawidłowym odłączeniu lokalnego właściciela; baseline ma sprawdzić rzeczywisty provider i komponent przed zmianą.

Autor c49_advisories ma wyłącznie context/AuthContext.tsx, components/AccountButton.tsx i nowe proposal/design/change. Kontrakt: typowany wynik oraz stan idle/pending/error, ogólny komunikat PL/EN i ponowienie. Stan przeżywa własne A→guest, ale kończy się po nowym zalogowaniu, unmount lub wyłączeniu. Domyślny scope SDK i synchroniczny fence pozostają. Błąd nie przywraca starego właściciela; późny wynik A nie zmienia B. Brak zmian CDP, polityki auth, serwera/API/RLS lub danych sesji.

Fixture c49_validation ma tylko nowy tests/cycle61-logout-outcome.test.ts i design. Planowane18 przypadków rzeczywistego provider/controller/owner i AccountButton PL/EN z kompletnym mockiem granicy SDK, jawnym emulatorem React i syntetycznymi danymi. Bez importu/uruchomienia SDK, sieci, głosu albo native browser. Pierwotny voidhandler wymaga obserwatora odrzucenia zwracającego ten sam Promise, aby nie wywołać fałszywego błędu setupu. Nowy typ/status to kontrakt, nie18 odrębnych dawnych usterek.

Niezależny primary c49_dependency_review recenzuje źródła, kontrakt, fixtures, narzędzia i raw; root osobno peeruje fixtures, wykonuje kontrole oraz metadata. Autor nie zatwierdza własnego kodu. Maksymalnie root+3, rozłączne pliki; PRODUCT review może wykonać fixtureauthor z wyłączeniem własnej fixture.

C60 current238 przejmujemy wprost. Snapshot C60 miał572 wejścia; jedyna późniejsza różnica to jawna korekta Node oracle 1b1d→df6a. Bootstrap kwalifikuje ten dokładny plik i zapisuje aktualne572 hash, bez zmiany historycznego manifestu. Wszystkie stare dowody,13 preserve,22 receipts i6 wcześniejszych SDK pinów są literalne; dodajemy publiczne piny kontraktu zainstalowanego Supabase.

Baseline przed produktem, acceptance bez zmiany oracles, odpowiednie historyczne kontrole tylko z uzasadnieniem, TypeScript i jeden izolowany TEMP build. Brak native/real-provider/staging PASS. Nie ponawiamy zielonych testów bez zmiany lub uzasadnionej obawy. Dependencydeferral C50 pozostaje historyczny bez kolejnego pollu.

Bez git add/commit/push/deploy, produkcyjnych zapisów/migracji/history rewrite, prawdziwych sesji/profili/sekretów, płatnych wywołań i kontaktów. Zewnętrzne AI i cloud writes HARD_OFF; produkcja NO_GO.
