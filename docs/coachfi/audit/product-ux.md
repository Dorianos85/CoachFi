# Audyt publicznych ścieżek Coachfi.ai — UX, PL/EN i dostępność

Data: 14 października 2026, strefa Europe/Warsaw. Właściciel: rola 10, UX/design/dostępność. Recenzent: niezależny audytor jakości do przydziału przez koordynatora. Cel: ustalić, co istniejąca beta faktycznie pokazuje i robi w publicznej ścieżce dorosłych, zanim zostanie oceniona jako gotowa na użytkowników.

**Wniosek:** beta ma działające publiczne ekrany diagnozy, pierwszej lekcji i quizu oraz selektor PL/EN. Nie ma jeszcze dowodu przejścia całej ścieżki rejestracja → pierwsze przydatne działanie → trwały zapis → powrót. Potwierdzono błędy lokalizacji, niespójne dane/etykiety demonstracyjne i problemy dialogów. Dokumenty prawne jawnie pozostają roboczymi wzorami.

## Zakres i jakość dowodów

Audyt wykonano w CUA In-app Browser na [publicznej becie](https://coachfiai.com/). Odczytywano wyrenderowany DOM, obserwowano screenshoty i wykonywano odwracalne interakcje interfejsu: selektor języka, otwarcie/zamknięcie logowania i ustawień zgód, przejście kroków lekcji, obliczenie diagnozy na domyślnych danych, rozmiar tekstu i kontrast. Przetestowano także viewport 390 × 844.

Nie zalogowano się, nie zarejestrowano konta, nie złożono oświadczenia wieku, nie zaakceptowano dokumentów, nie zmieniono zgód, nie wysłano kodu/emaila/wiadomości do Mili, nie uruchomiono mikrofonu, płatności, walletu, mintowania/depozytu ani usuwania danych. Nie zmieniono wdrożenia. Obliczenie na danych domyślnych mogło zmienić lokalny stan demonstracyjny aplikacji; nie traktujemy go jako danych realnej osoby.

**Ograniczenie sesji:** nowa karta korzystała ze współdzielonego magazynu przeglądarki. Nie utworzono czystego profilu. Widoczne wcześniej zapisane zgody, ranking lub dane finansowe nie dowodzą ani nowych zgód, ani naruszenia prywatności. Przyczyny tych stanów wymagają powtórzenia na izolowanym profilu testowym.

Dialog wyboru trybu był otwarty podczas większości odczytów. Część danych w DOM leżała pod nakładką; screenshoty uczciwie zachowują tę nakładkę. Przejścia klawiaturą do publicznych treści nie są dowodem poprawnego standardowego onboardingu myszą. Sam wymóg wyboru trybu/oświadczenia wieku jest granicą tego testu, nie wykrytą wadą.

Statusy: **sprawdzone UI** oznacza odtwarzalny widok/interakcję, nie działanie zaplecza; **prawdopodobne** oznacza interpretację wymagającą testu przyczynowego; **niesprawdzone** oznacza brak testu; **niedostępne w tym audycie** oznacza brak wymaganej sesji lub zasobu. Rejestr 31 obserwacji zawiera route, akcję, rezultat i surowe snapshoty: [ux-observations.json](../../../evidence/ux-observations.json). Screenshoty: `evidence/ux/`.

Ważna korekta metodologiczna: początkowy HTML pokazywał disabled `Sign in`, liczniki lekcji `0/0` i komunikat fallback rankingu. Po załadowaniu aplikacji logowanie było aktywne, liczniki miały mianowniki, a ranking zmienił stan. Nie wolno uznawać samych początkowych odpowiedzi HTML za stałe awarie logowania, pusty bank pytań ani brak konfiguracji Supabase.

## Mapa produktu i rzeczywistego działania

| Funkcja / route | Faktycznie zaobserwowane działanie | Status i dowód |
|---|---|---|
| Start `/` | Początkowo jawne demo `62/100`, sample data, 7/24. Po załadowaniu w badanej sesji `YOUR SCORE 36`, poduszka 10%, nadwyżka 800, lekcje 0/82; sąsiadująca mapa nadal 3.2/6 i 840. Trzy mikrolekcje prowadzą do ogólnego `/learn`. | Sprawdzone UI EN/PL; pochodzenie zapisanego stanu nieustalone. UX-001, 024, 031. |
| Wybór trybu | Adult/guardian checkbox i disabled wejście do Adult do jego zaznaczenia; osobne wejście Kids. Escape nie zamyka. Tab po przycisku Kids wychodzi do stopki. | Sprawdzone dialog/fokus, bez zatwierdzenia wieku. UX-004. |
| Język | PL/EN tłumaczą nawigację, formularze i pierwszą lekcję; wybór jest zachowany przy kolejnych routes. Selektor oferuje 9 języków. Zmiana PL/EN zmienia symbol waluty zł/$ przy tych samych liczbach. | Sprawdzone PL/EN; inne języki niesprawdzone. UX-003, 025–028. |
| Diagnoza `/health-check` | 5 pól kwot, 3 pytania tak/nie, tekst celu. Domyślne wartości: 6000, 5200, 3000, 8000, 20000. `Oblicz wynik` pokazuje 3 wstępne wnioski; pełny score i plan wymagają emaila/logowania oraz terms/privacy, z osobną dobrowolną zgodą marketingową. | Sprawdzone UI na danych domyślnych; wzór, walidacja skrajnych wartości, odblokowanie niesprawdzone. UX-002, 009, 025. |
| Logowanie | Aktywny po załadowaniu przycisk otwiera Google/Apple/X/Telegram oraz Email i `Wyślij kod`. Formularz można zamknąć. | Sprawdzone otwarcie PL; dostawcy, dostarczenie kodu, rejestracja i odzyskanie konta niesprawdzone. UX-008. |
| Nauka `/learn` | 8 etapów; suma mianowników pytań w UI 28 w obu językach: 3, 4, 4, 4, 3, 5, 2, 3. Pierwszy etap dostępny, pozostałe locked. Model 6 słoików 55/10/10/10/10/5. | Sprawdzone UI PL/EN. 28 nie jest zweryfikowaną liczbą unikalnych pytań. UX-005, 026. |
| Pierwsza lekcja `/learn/money-mindset` | Trzy kroki PL/EN: wartość netto, inflacja stylu życia, najpierw zapłać sobie. `Dalej/Next` zmienia krok; finał prowadzi do `/quiz?topic=mindset`. | Sprawdzone przejścia klawiaturą i teksty. Ukończenie/odblokowanie kolejnego etapu niesprawdzone. UX-006, 027. |
| Quiz `/quiz?topic=mindset` | Licznik 1 z 3; radio odpowiedzi i zatwierdzenie. W PL pytanie `What is 'net worth'?` i wszystkie odpowiedzi pozostają EN. EN opis mówi 4 pytania przy liczniku 3. Widoczny demo punktów i ranking. | Sprawdzone pierwszy widok PL/EN. Nie zatwierdzono odpowiedzi; naliczanie, objaśnienia i zapis niesprawdzone. UX-007, 028. |
| Wyzwanie `/challenge` | Pytanie o regułę 72 po PL, +50 punktów, odliczanie i `Utrzymaj serię`. | Sprawdzone UI; nagroda, strefa czasu i rotacja niesprawdzone. UX-015. |
| Powtórki `/review` | 1 z 5, pytanie o inflację po PL, deklaracja algorytmu SM-2. | Sprawdzone UI; planowanie, jakość algorytmu i retencja niesprawdzone. UX-017. |
| Karty `/cards` | Pierwsza karta finansowa po PL, licznik 1/16, kopiowanie/udostępnianie; wstęp mówi 10 faktów. | Sprawdzone pierwszy widok; poprawność źródeł i eksport niesprawdzone. UX-018. |
| Mila `/coach` | Cztery wstępne komunikaty, tekst/mikrofon, sześć szybkich akcji i intro głosowe. UI mówi, że fallback głosu może korzystać z przeglądarki. | Sprawdzone UI PL; odpowiedź modelu, źródła, zgody i awarie AI/audio niesprawdzone. UX-010. |
| Demo głosu `/voice-demo` | Pięć skryptów w sekcji demo i 9 języków: m.in. score 42/100, opowieść dla dzieci i gratulacje za certyfikat Solana. | Sprawdzone skrypty PL; audio nieodtwarzane. UX-011. |
| Kalkulator `/inflation` | Pola kwoty/lat/inflacji, wynik realnej wartości, straty i wykres. | Sprawdzone UI PL; formuła i wartości skrajne niesprawdzone. UX-019. |
| Higiena zakupowa `/shopping` | Formularz zakupu, wynik impulsu i potencjalnego zwrotu, audyt rzeczy, działania typu pauza 24 h i warunek sprawdzenia kraju/regulaminu. | Sprawdzone UI PL; zapis, obliczenia, reguły prawne niesprawdzone. UX-020. |
| Nagrody `/rewards` | Jawne demo salda, portfel Solana Devnet, przyciski mintowania, karty certyfikatów. | Sprawdzone UI PL; uprawnienia, ukończenie, mintowanie niesprawdzone. UX-016. |
| Yield Vault `/vault` | Punkty edukacyjne, symulacja Kamino i APY w trybie offline; trzy strategie, w tym dźwignia. | Sprawdzone UI PL; dane APY i jakikolwiek depozyt niesprawdzone. Poza obecnym zakresem Foundera. UX-021. |
| Kids `/kids` | Route w głównej/mobilnej nawigacji, słoiki, 6 modułów, gwiazdki i postęp. | Sprawdzone UI PL; nie przełączono trybu i nie testowano izolacji. Poza obecnym etapem. UX-023. |
| Dostępność `/accessibility` | Kontrast, tekst, przykładowe skrypty i lista deklarowanych cech. `Mój wynik` to statyczne 42/100; quiz/postęp mają niedopasowane narracje. Jest numerologia z datą urodzenia. | Sprawdzone UI PL; WCAG i zasadność profilowania niesprawdzone. UX-022. |
| Prywatność `/privacy` | Roboczy wzór; lokalny eksport/usuwanie, opis danych i dostawców. Wprost wymaga uzupełnienia administratora, kontaktu privacy i procedur RODO. | Sprawdzone dokument PL; eksport/usuwanie lokalne i zewnętrzne niesprawdzone. UX-012. |
| Regulamin `/terms` | Roboczy wzór z 10 maja 2026; brak finalnego kontaktu/jurysdykcji/reklamacji; podstawowa nauka ma działać bez zgód zewnętrznych. | Sprawdzone dokument PL; finalna ocena prawna niedostępna. UX-014. |
| Zgody | Otwierany ze stopki dialog: wymagany terms/privacy checkbox zaznaczony i disabled; opcjonalne AI/głos/ranking/certyfikaty bez programowo opisanej wartości on/off. | Sprawdzone UI PL; źródło zapisanego stanu oraz skutki zgód niesprawdzone. UX-013. |
| Pomoc / wsparcie | Nie znaleziono publicznego wejścia kontakt/pomoc/zgłoszenie błędu w zbadanej nawigacji, stopkach i dokumentach. | Sprawdzone ograniczenie obserwowanych powierzchni; nie dowodzi nieistnienia osobnego kanału poza nimi. |

Nawigacja desktop: Start/Home, Health Check/Diagnoza, Daily Challenge/Wyzwanie dnia, AI Coach/Coach AI, Rewards/Nagrody, Kids/Dzieci. Sekcja More/Więcej: Quiz, Learn/Nauka, Review/Powtórki, Knowledge Cards/Karty wiedzy, Inflation/Inflacja, Shopping Hygiene/Higiena zakupowa, Yield Vault, Accessibility/Dostępność. Mobilny pasek ma tylko Start, Diagnozę, Wyzwanie, Coach AI, Dzieci; do pierwszej lekcji dociera się z planu/landing page. Brakuje bezpośredniego wejścia pomoc.

## Najważniejsze blokady i priorytety

P0 oznacza brak koniecznego dowodu/przygotowania przed przyjmowaniem realnych użytkowników; nie jest oceną wykrytej podatności krytycznej. P1 oznacza błąd podstawowej ścieżki, zaufania lub dostępności. P2 oznacza poprawę spójności.

| Priorytet | Problem / dowód | Właściciel i zależności | Kryterium przyjęcia / recenzent |
|---|---|---|---|
| P0 | Niezweryfikowana cała ścieżka konto → lekcja → quiz → małe działanie → zapis → powrót. Sam ekran logowania nie daje tego dowodu. | Frontend + backend; repo, staging, izolowane konta testowe, konfiguracja auth. | Niezależny QA odtwarza PL/EN po przeładowaniu i ponownym logowaniu; zachowuje dowody zapisu/izolacji i błędów dostawcy. |
| P0 | Polityka/regulamin jawnie robocze, brak finalnego administratora, kontaktu i reklamacji; brak łatwego publicznego wsparcia. UX-012, 014. | Prywatność + support; decyzje o rynkach/dostawcach; ocena prawnika. | Finalne dokumenty PL/EN, działający kontakt i procedura żądania/usunięcia danych; niezależna recenzja prywatności i QA. |
| P1 | PL quiz pierwszej lekcji ma pytanie i odpowiedzi EN. UX-007. | Lokalizacja + curriculum; źródłowy bank pytań. | Cały quiz, poprawna/błędna odpowiedź i objaśnienia w wybranym języku; recenzent treści i QA. |
| P1 | Modal bez focus trap; na mobile bottom nav nad dialogiem i aktywny przy jego otwarciu. UX-004, 024. | UX + frontend; komponent dialogu/nawigacji. | Tab/Shift+Tab ograniczone do aktywnego dialogu, tło niedostępne, widoczny fokus, jednoznaczna strategia zamknięcia i brak nakładającego się paska; ręczny QA klawiaturą i czytnikiem. |
| P1 | Statyczne narracje na `/accessibility` nazywane moim wynikiem/postępem, niewłaściwy tekst pod akcją quizu; mapa home ma wartości różne od podsumowania, brak lokalnych etykiet demo po załadowaniu. UX-022, 031. | UX + frontend + autor score; czysty profil i źródło każdego wskaźnika. | Każda liczba ma pochodzenie/data/stan brak danych; demo oznaczone przy wartości i w głosie; akcje używają faktycznego stanu lub jasno oznaczonego przykładu; niezależny QA i recenzent finansowy. |
| P1 | Opcjonalne zgody jako przyciski bez aria-pressed/aria-checked. UX-013. | Frontend + prywatność. | Czytnik oznajmia nazwę i stan zgody; zmiana i wycofanie sprawdzone; backend respektuje stan. |
| P1 | Język automatycznie zmienia walutę $/zł, zachowując kwoty; EN rynek nieokreślony, domyślny cel nadal EN w PL. UX-003, 025. | Lokalizacja + produkt; decyzja kraju/waluty. | Wybór języka niezależny od kraju i waluty; brak pozornej konwersji; domyślne treści PL/EN; QA scenariusza zmiany języka. |
| P1 | Kids i DeFi w bieżącej głównej ścieżce; dźwignia/APY/„przewidywalny zwrot” w Vault sprzeczne z obecnym zakresem i stopką; data urodzenia do numerologii bez korzyści dla głównego celu. UX-021–023. | Koordynator + produkt; decyzje zakresu Foundera. | Wydanie dla dorosłych PL/EN ma ustalony zakres; późniejsze moduły nie dominują onboardingu; twierdzenia finansowe zrecenzowane; zbieranie danych ma uzasadniony cel. |
| P2 | Diagnoza EN: 10 pytań vs 9 pól; quiz EN: 4 pytania vs 3 w liczniku; karty: 10 faktów vs 16. Home nazywa mianownik 82 `Lessons/sprint`, podczas gdy kod liczy cały bank pytań, a `/learn` ma 28 pytań przypisanych do etapów — różne zakresy, z niejasną etykietą jednostki. UX-002, 018, 028, 031. | Frontend + curriculum. | Liczniki mają jasny zakres i znaczenie lekcja/pytanie/karta; recenzent treści i QA. |
| P2 | Seria i podwójne punkty eksponowane przed użytecznym działaniem; brak sprawdzonego powrotu po przerwie. UX-015. | Projektant nawyków + produkt. | Pierwszy cel to małe realne działanie; opcjonalne przypomnienia/tempo oraz spokojny powrót po przerwie; test z użytkownikami. |

## Plan głównej ścieżki dla dorosłych PL/EN

| Krok | Proponowane zachowanie | Dowód wymagany przed wydaniem |
|---|---|---|
| 1. Pierwszy ekran | Krótka konkretna wartość: lekcja, quiz i jedno małe działanie dziennie. Jedno główne CTA `Zacznij bezpłatnie / Start free`; demo jawne, bez przypisywania fikcyjnego postępu. | Desktop i 390 px PL/EN; osoba początkująca identyfikuje następny krok; screen reader odczytuje dane przykładowe jako przykładowe. |
| 2. Zakres i preferencje | Dorosły w obecnym wydaniu; język osobno od kraju/waluty. Krótkie wyjaśnienie danych i możliwości korzystania bez funkcji zewnętrznych. | Dostępny dialog, testy Tab/Shift+Tab, poprawne domyślne języki/liczby, brak zbędnej daty urodzenia. |
| 3. Konto i dokumenty | Jasno pokazać, co daje konto i co można zobaczyć wcześniej; spójny proces z login modal oraz diagnozą, finalne linki prawne i dobrowolny marketing. | Staging: email/OTP i wybrani dostawcy, wygasły kod, błędny email, błąd sieci, powrót z auth; bez wpisywania prawdziwych danych podczas testu. |
| 4. Pierwszy rezultat free | Krótka pierwsza lekcja → 3 sensowne pytania z wyjaśnieniem → wybór jednego działania, np. sprawdzenie jednego stałego wydatku. Rozróżnić rozpoczęcie, odpowiedź i rozumienie. | Treści PL/EN zatwierdzone; test błędnej odpowiedzi i ponownej próby; brak presji na odkładanie kosztem podstawowych potrzeb. |
| 5. Plan i score | Wstępne wskazówki z jawnych, opcjonalnych danych. Score ma opis, założenia i ograniczenia; brak danych nie daje fałszywego wyniku. Nie łączyć wiedzy, sytuacji i poczucia bezpieczeństwa bez wyjaśnienia. | Testy kalkulatora: zera/braki/dług/nieregularny dochód; niezależna recenzja wzoru; rozróżnienie demo/stan rzeczywisty w widoku i audio. |
| 6. Małe działanie i zapis | Użytkownik wybiera krok, termin i plan „jeśli–to”; oznaczenie `zadeklarowane` do czasu rzeczywistego potwierdzenia. Czytelne potwierdzenie zapisu. | Backend/local fallback: zapis, reload, zmiana urządzenia zgodnie z obietnicą, izolacja kont, utrata połączenia i duplikat żądania. |
| 7. Powrót i utrwalenie | Ekran kontynuacji, powtórka po czasie, możliwość zmiany tempa i wyłączenia przypomnień; powrót bez zawstydzania po przerwie. | Powrót następnego dnia i po dłuższej przerwie; test harmonogramu, języka, strefy czasu i retencji wiedzy. |
| 8. Pomoc i kontrola danych | Publiczny kontakt/zgłoszenie z potwierdzeniem i oczekiwaniem czasu odpowiedzi; export/delete z rozróżnieniem lokalne/serwerowe/dostawcy. | Dostarczenie zgłoszenia i eskalacja do człowieka; test eksportu/usuwania na danych testowych; niezależna recenzja prywatności. |

Sekwencja wykonania: (1) wykorzystać potwierdzone powiązanie commitu z produkcją, udostępnić staging i zdefiniować wydanie dla dorosłych, (2) naprawić lokalizację/dialogi/demo oraz przygotować support/dokumenty, (3) zintegrować konto i trwały postęp, (4) niezależnie przetestować pełną ścieżkę w PL/EN, (5) dopiero potem zapraszać kohortę do badania aktywacji i powrotów. Repo jest dostępne w `source/CoachFi`; A24/A25 w [architecture.json](../../../evidence/architecture.json) potwierdziły production deployment, alias coachfiai.com i zgodny commit. To nie jest test kont, bazy ani aktywnej konfiguracji dostawców. Ten audyt nie daje potwierdzonej daty wydania.

## Dostępność i testy pozostające do wykonania

Sprawdzone: nazwy/etykiety formularza, semantyczne radio i progressbar, obecny skip link w DOM, konkretny błąd Tab w dialogu, zmiana fontu 16 → 20 px przez A++, `aria-pressed=true` kontrolki kontrastu po aktywacji oraz wąski viewport bez poziomego overflow startu. Nie potwierdzono zmiany kolorów od toggle kontrastu. Ponownie aktywowano kontrolkę w celu przywrócenia, przywrócono rozmiar tekstu i viewport; język przywrócono do EN.

Niesprawdzone: rzeczywisty czytnik ekranu NVDA/VoiceOver/TalkBack, współczynniki kontrastu, 200%/400% zoom i reflow, touch/klawiatura ekranowa na telefonie, wielkość celów dotykowych, komunikaty błędów formularzy, porządek fokusu całej ścieżki po rejestracji, accessible announcements AI/wyniku oraz reduced motion. Deklaracja „w duchu WCAG” na stronie nie stanowi potwierdzenia WCAG 2.2 AA.

Proponowany pakiet QA: świeży profil i konto testowe, desktop PL/EN, 390 px i 320 px, klawiatura, NVDA + Chrome lub równoważny zestaw, VoiceOver/TalkBack na jednym fizycznym urządzeniu, automat dostępności dla głównej ścieżki i ręczna kontrola problemów, których automat nie rozstrzyga. Autor zmian nie zatwierdza tego pakietu samodzielnie.

Przykład potwierdzonego problemu warstw w mobile:

![Dialog wyboru trybu i dolna nawigacja w oknie 390 × 844](../../../evidence/ux/20-mobile-home-mode-pl.jpg)

