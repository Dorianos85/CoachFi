# Pilne: profile przeglądarki w publicznym repo

Stan14.10.2026, źródła lokalnego klonu publicznego `Dorianos85/CoachFi`, commit86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b. W git śledzone są pliki profili przeglądarki pod `.codex-screenshots`, m.in. pliki o nazwach `Cookies`, `Login Data`, `History` i `Local Storage`. Metadane potwierdzają1421 śledzonych plików w tym katalogu według recenzenta. **Zawartości baz nie odczytano; aktywne poświadczenia i wyciek konkretnych danych nie są potwierdzone.** Ryzyko wymaga potraktowania jako podejrzenie incydentu do oceny człowieka.

Właściciel: Founder + rola14; niezależny recenzent4. Nie zmieniono widoczności repo, historii GitHub ani sesji/dostawców. Nie kopiować tych plików do raportów, nie otwierać cookies/password databases narzędziami ogólnymi i nie przesyłać do zewnętrznego modelu. Czytanie nazw z git nie jest testem zawartości.

## Konkretna propozycja zabezpieczenia

1. Founder/delegowany człowiek ocenia ograniczenie publicznej widoczności repo na czas przeglądu. Ograniczenie nie usuwa już pobranych kopii i może wpływać na istniejący deploy/integracje; sprawdzić zależności.
2. W kontrolowanym środowisku właściwa osoba sprawdza, czy profile były wyłącznie testowe i czy zawierają prawdziwe identyfikatory/sesje. Nie zapisywać wartości sekretów w findings. Jeśli potwierdzono aktywne sesje/klucze, unieważnić właściwe sesje i rotować dotknięte klucze, według mapy dostawców.
3. Przygotować usunięcie danych profilu z indeksu bieżącej gałęzi oraz regułę ignorowania profili/runtime/logów. `git rm --cached` usuwa z indeksu, nie z historii ani lokalnego dysku. Sam `.gitignore` nie usuwa danych już śledzonych.
4. Jeżeli ujawniono wrażliwe dane w historii, zaplanować rewrite history ze sprawdzonym narzędziem, kopią kontrolowaną i koordynacją współpracowników. Rewrite/force push wymaga konkretnej autoryzacji; nie jest wykonywany w audycie.
5. Niezależnie sprawdzić nową gałąź, pełną historię, artefaktyCI i politykę generowania screenshotów. Trzymać screenshoty produktu odrębnie od katalogu profilu. Nie wracać do publicznego statusu bez oceny.

Proponowane wpisy `.gitignore` do zatwierdzonej zmiany: `.codex-screenshots/**/user-data*/`, `.codex-screenshots/**/chrome-profile*/` lub dokładnie wykryte katalogi profili. Nie ignorować całego katalogu dowodów bez rozróżnienia screenshotów od profilu; dobrać regułę do realnej struktury. Pełna lista do przygotowania po kontrolowanym przeglądzie metadanych. Nie deklarować usunięcia incydentu przez dopisanie tych przykładów.

Decyzja Foundera potrzebna pilnie: osoba odpowiedzialna za przegląd i sposób ograniczenia ekspozycji publicznego repo. Kolejne kroki dotyczące danych/sesji i historii zależą od wyniku. Na produkcji nie przeprowadzono testu wykorzystania sesji ani innych ataków.
