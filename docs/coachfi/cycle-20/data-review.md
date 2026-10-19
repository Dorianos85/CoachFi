# Cykl 20 — niezależna recenzja danych postępu

15.10.2026, daily_data_review, coachfi-data-integrity. Zakres B26 dotyczy nowego niemutującego odczytu postępu, z oddzielnym actual UI review Home/ProgressPath. Shared learningProgress/SRS/signIn/auth/export pozostają poza zmianą.

Sześć actual old-helper obserwacji przeszło6/6: zdrowa historia/manualne started/completed dały niezależnie policzone osiem statusów; malformedSRS i odmowaSRS dały ciche zero; parseable nonarraySRS rzucił TypeError; malformedmanual i odmowamanual zostały potraktowane jak brak override. W każdym przypadku dokładne raw pozostało i wykonano zero set/remove. Trzy źródła i fixture miały cztery zgodne SHA przed/po. To dowód obecnego zachowania, nie acceptance naprawy.

Zgodnie z jawnie zatwierdzonym zakresem baseline przeniesiono natywnym Move-Item po sprawdzeniu absolutnych ścieżek do tests/cycle20-progress-data-baseline.baseline.ts. SHA67caadd8… jest identyczne; raw6PASS/0FAIL i pełne before zachowano, niczego nie osłabiono. Archiwum jest poza domyślnym odkrywaniem .test/.spec i nie usuwa żadnego z2453 wcześniej przyjętych przypadków. Przyszła tests/cycle20-progress-data-review.test.ts będzie dotyczyła nowego readera.

Przyjęto ograniczony projekt autora1218e236…: synchroniczne readStageProgress rzuca przy unavailable, korzysta z immutable readReviewCards i własnego strict manual parsera, deleguje zdrowe obliczenia na dwa zachowane raw przez readonly snapshot. Jeden actualread/key, brak normalizacji, unknownstagekeys legalne tylko z prawidłowymi own values. Sticky current/browser/access faults nie mogą zniknąć w catch shared helpera. Native Promise odmowy obserwowane bez await, bez wykonywania arbitrarythenables. Formalny design verdict: evidence/cycle-20/data-design-review.json.

Client start preflight przyjęto kierunkowo po osobnym actualUI latebadmanualclick baseline. Może sprawdzać strict reader przed dotychczasowym markStageStarted i blokować nawigację po read/write fault; nie jest to CAS, rollback lub naprawa wszystkich stagewriterów. Root sam wydaje SOURCEGO. Implementacja, nowe independent acceptance i końcowe gates są oczekujące; brak PASS produkcji/realAuth/staging.

## Nowy reader i niezależne przyjęcie

lib/learning-progress-read.ts981d84b… przeszedł44/44 w pierwszym i jedynym własnym przebiegu, po peer review fixture7c82133c… przez roota. Dziesięć before/after SHA pozostało zgodnych.38 przypadków bada rzeczywisty funkcjonalny reader i granice odmowy;6 jawnie oznaczonych probes instrumentuje granicę computation, aby przechwycić readonly błąd, chwilowy owner loss lub utratę owner po obliczeniu. Te mockowane probes nie są przedstawiane jako actual UI.

Niezależna pełna ośmiostopniowa oracle potwierdziła counts,5%started,100%manual completion i stare zaokrąglenia/próg. Poprawne unknownhistory131/extra fields i manual shadow keys pozostają. Invalid raw/read denied/nonstring/Promise/SSR/current fault nie tworzą pozornego postępu. Snapshot czyta każdy cache rzeczywiście raz, nie zapisuje i nie wykonuje ponownego live read podczas obliczenia. Sticky error pozostaje nawet po odtworzeniu owner i po catch w rzeczywistym starym helperze.

Statycznie odczytano dwa root callsites i niezależnie odwrócono obie delty do źródeł before. Home używa strictSRS bez zależności od manual; brak odczytu nie jest osobistym zerem. ProgressPath pokazuje loading/unavailable przed siatką i posiada live active/issue view, który blokuje stare/duplikowane retry. Start ma strict preflight przed dotychczasowym writerem, catch i preventDefault po odmowie; nie daje CAS/rollback lub gwarancji wszystkich współbieżnych odczytów sharedwritera. Root health helper/feature nadal bez zmian; unit health fixtures są syntetyczne.

Werdykt ACCEPTED_LIMITED_DATA_AND_STATIC_CALLSITE_REVIEW, brak nowych otwartych findings. evidence/cycle-20/data-review-final.json zawiera10 lowercase fingerprints, raw44 i historyczną kwalifikację6obserwacji. Nie powtarzano archiwalnych6,30autora ani44green. Peer UI i root gates pozostają osobnymi dowodami. Shared oldhelper nadal jest niechroniony poza nowymi callerami; brak globalnej naprawy, Auth/RLS/staging/production PASS lub przyjęcia odroczonej treści.
