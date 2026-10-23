# C22 — actual baseline treści logowania

15.10.2026. daily_ui_review. Fixture przygotowany; pierwszy runtime czeka na peer review i zwolnienie slotu przez root. Źródła produktu bez zmian.

10 zaplanowanych przypadków: manual OFF PL/EN, zdrowy required ON PL/EN, ręczne PL→EN i EN→PL z zachowaniem otwartego żądania i niesłanego syntetycznego draftu, zachowanie dotychczasowych ja/es, zdrowe ON poniżej progów z opcjonalnym dialogiem PL/EN. Dokładne title/body oraz flow, close, raw bytes i zero writes mają osobne oczekiwania. Wstępne przewidywanie 6 FAIL/4 PASS nie jest wynikiem testów.

Kontrakt manual: „Zaloguj się do Coach FI” / „Wypełnij formularz logowania.” oraz „Sign in to Coach FI” / „Complete the sign-in form.” Wcześniejszy niewykonany draft z obietnicą zamknięcia/powrotu zachowano w dowodzie korekty kontraktu; nie jest baseline ani przyjęciem.

Actual SignInGate i real gate/storage/SRS, jawne modułowe mocki CDP, wyłącznie syntetyczny ready guest. Brak wywołań SDK/email/OAuth/OTP/fetch. Harness nie bada DOM, fokusu, przeglądarki ani rzeczywistego Auth. Bez nowej required-policy, konfiguracji, treści innych produktów i zapisów produkcyjnych.

## Pierwszy actual baseline

Wykonano dokładnie raz 10 nowych przypadków: **4 PASS / 6 FAIL**. Wszystkie sześć porażek dotyczy oczekiwanej neutralnej treści manual PL/EN; obie dokładne asercje title/body zostały osiągnięte dzięki zaplanowanym soft assertions. Dwa locale cases porównują dwa widoki, więc raw zawiera 16 wiadomości o asercjach, nie 16 przypadków. Finding **C22-UI-01** odtworzony; retest oczekuje na niezależnie recenzowaną poprawkę autora.

Actual request, otwarcie i zamknięcie działały przed asercjami treści, obie zmiany języka zachowały otwarte żądanie i niesłany syntetyczny draft. Zdrowy required PL/EN zachował dokładne dawne title/body i brak close; ja/es zachowały własne dawne teksty. Wszystkie 10 obserwacji: zero native writes i email/OAuth/OTP calls, fetch trap niewywołany. 12 fingerprintów przed/po bez różnic, C21 fixture nieedytowany. Źródło testowane cf3041f0…, nowy fixture 9c4a57c1….

Pełne baseline raw i structured telemetry pozostają w ui-baseline-tests.json i ui-baseline-run.json. Nie wykonano powtórek ani zmian produktu.

## Niezależny retest po poprawce

**10/10 PASS** w pierwszym i jedynym wykonaniu tej samej literalnej fixture po zmianie prezentacji. Finding **C22-UI-01 CLOSED**: wszystkie sześć wcześniejszych nazw porażek jest teraz PASS, a cztery wymagane controls zachowują oryginalne title/body. Brak zmian asercji, nowych przypadków lub ich doliczania. Bazowe 4 PASS/6 FAIL i 16 komunikatów porażek pozostają bez zmian.

PL/EN manual pokazuje neutralną nazwę logowania i instrukcję wypełnienia formularza; zdrowy required nadal ma dawny tekst i brak zamknięcia. Zdrowe ON poniżej progów korzysta z ręcznej treści zgodnie z faktyczną opcjonalnością, a nie samą konfiguracją OFF. Obie zmiany języka zachowały otwarte żądanie oraz własny niesłany draft. Ja/es nie przechodzą na nowy angielski fallback. Wszystkie 10 obserwacji: native writes0 i SDK/email/OAuth/OTP/fetch0.

Bieżący freeze to 7 plików: component51c42405…, jawnie zaktualizowana C21fixture6f81e041…, własna literalna9c4a57c1… oraz cztery granice; przed/po bez różnic. Historyczne baseline12 ze starym cf304/83394 nie są bieżącym freeze. Root4spans forward/inverse zostały niezależnie odczytane; bez zmian pozostałych bytes źródła, handlers/hooków/polityki/progów/providerów. Source peer daily_author oraz root fixture peer są oddzielne.

Legacy adapter ma trzy jawnie zmienione manual title argument sites/sześć istniejących runtime instances, 55/58 expect expressions literalnych. Jego odrębny targeted retest nie jest częścią nowych 10 i nie zwiększa ich liczby. C21 historyczne raw zachowane; całych legacy bodies nie nazywamy literalnymi.

Limited actualcomponent acceptance dotyczy tylko prezentacji. Brak nowego Chrome/DOM/fokus/Auth/provider/RLS/staging/CI/fresh-checkout/produkcja PASS. Nie zmieniono polityki dla nieznanego postępu aktywnych reguł ani funkcji/synchronizacji konta. Produkcja NO-GO. Nie wykonujemy ponownie zielonych testów.
