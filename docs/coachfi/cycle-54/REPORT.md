# C54 — ulga podatkowa i ryzyko inwestycji

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 18.10.2026. Root: autor treści i narzędzi; c49_validation: autor fixture; root i c49_advisories: peer fixture; c49_advisories: niezależny financial/PLEN/raw reviewer; c49_dependency_review: niezależny source/tools/raw reviewer. Lokalny zakres B06, produkcja NO-GO.

Doprecyzowano istniejące porównanie ISA/NISA/IKE. Pięć pól PL/EN odróżnia ulgę podatkową od gwarancji zysku lub ochrony przed stratą. Wyjaśnienie wiąże zwolnienie dochodu z IKE z ustawowymi warunkami wypłaty i zaznacza, że wcześniejszy zwrot może oznaczać podatek od dochodu. Wskazuje też różnice krajowych zasad i dostępu do kont. Wspólny rdzeń poprzedniej odpowiedzi był poprawny: to uściślenie warunków i znaczenia, bez zmiany klucza lub kwoty.

Zmieniono tylko EN B/success/retry i PL B/explanation dla tax-advantaged-wrapper. Pytania, opcje A/C/D, klucz B, metadata30, kategoria, ID/order82 i pule pozostają literalne. A z gwarantowanym10% jest zachowanym błędnym dystraktorem. Nie dodano stawki podatku, wieku, limitu, konta, kraju rynku ani indywidualnej rekomendacji. PL/EN nadal dotyczy dorosłych w Polsce.

| Bramka lokalna | Wynik |
|---|---|
| Baseline tych samych9przypadków | 5 PASS / 4 FAIL semantyczne; UI4 i preservation1 były zielone |
| Po zmianie pięciu pól | 9/9 PASS; te same fixture i tytuły,4wcześniejsze FAIL zamknięte |
| Rzeczywisty bank PL/EN | oba82ID/order/key/reward,81pozostałych obiektów, pytania/ACD/kategorie i pule zgodne z baseline |
| Jeden TypeScript / jeden TEMP build | TS0/560pins; build PASS z zachowanymi ostrzeżeniami,34strony/35tras,560pre/559post,0driftu |
| Jeden Chrome | 2 PASS, worker1/retry0: PLwrongA→2stycznia; ENcorrectB→7stycznia |
| Niezależne końcowe recenzje | dwie niezależne recenzje PASS; 0 otwartych uwag do tej delty |

9różnych Node cases obejmuje4semantyczne,1preservation i4actualReview PL/EN×B/A. Z2Chrome daje to11różnych zaliczonych przypadków; baseline nie jest dodatkowym kompletem. Obydwa feedbackpola EN są obserwowane przed asercjami. Pierwszy fałszywy zestaw guards przerywa przypadek; nie liczymy guards ani obserwacji jako nowych testów. Nie powtarzano historycznych zielonych bez zmiany.

Node używa rzeczywistego Review, SRS, save/readback i owner handles oraz jawnego emulatora state/memo/effects i wejściowych kontekstów. StreakContext activity oraz downstream notify/persist są mockowane. Cztery handlery potwierdzają canonical pytanie/ABCD/voiceprops/feedback, physicalwrite→readback i datę. Zapis dotyczy tylko lokalnegoSRS; pozostałe81kart, inne lokalne pola i osobna sessionMapa są literalne. Metadata30 nie jest nagrodą Review:125punktów pozostaje125. Bez hydration/nativeReact/audio lub rzeczywistego bonusu providera.

Chrome działa na tej samej builtTEMPkopii w świeżych syntetycznych profilach,375×812 i stałym UTC. Sprawdza shell/Review, klawiaturę, feedback, acknowledgement, niezmienione81kart i ukończenie/reload. Rzeczywisty provider ma serię aktywną już dziś, więc nie dodaje innego bonusu. Tylko PLwrongA i ENcorrectB, bez pełnej macierzy2×2. Probe obejmuje4nazwane lokalne klucze postępu;125punktów/steps/streak są zachowane. API0/pageErrors0, externalblocked bez totalnetwork0; głos nie jest wywoływany.

Osobno zakończono źródłową ocenę dwóch niezmienionych przykładów. FDIC250000USD i struktura deponent/bank/kategoria są zgodne z tekstem indeksowanym źródeł FDIC. RBI4%±2pp, zakres2–6% i okres1kwietnia2026–31marca2031 odpowiadają indeksowanemu tekstowi oficjalnej noty S.O.1580(E) z25marca2026. Bezpośrednie strony FDIC/PDF RBI były niedostępne: nie otrzymują pełnego statutory/PDF lub nowego runtime/UI PASS. Nie zmieniano ich liczb, odpowiedzi, kluczy lub tekstów. Ich obecność w81nietargetowych obiektach jest dowodem zachowania, nie nowym testem semantyki finansowej.

Lista6nieocenionych ID z historycznego C47 ma teraz jawne rozstrzygnięcia: us-401k-match przyjęty ograniczenie w C53; wrapper w tej paczce; FDIC/RBI źródłowo z powyższymi ograniczeniami; joint-finances i teaching-kids-money nadal odroczone i nieocenione. Brak kolejnego pozarodzinnego ID bez tego wąskiego triage nie oznacza nowego przyjęcia80pozycji, zamknięcia B06 lub walidacji całej aplikacji. Historyczny C47 i40tasks obu backlogów nie są przepisywane. Osiągalne adult family-plan ma jawny test allow; nie wykazano podstawy do automatycznego utożsamienia tej lekcji z wyłączonym Kids Mode lub zmiany polityki.

Źródła sprawdzone18.10.2026: [gov.pl o IKE](https://www.gov.pl/web/rodzina/co-trzeba-wiedziec-o-ike), [GOV.UK o ISA](https://www.gov.uk/individual-savings-accounts/how-isas-work), [GOV.UK o dostępie](https://www.gov.uk/individual-savings-accounts), [FSA o NISA](https://www.fsa.go.jp/policy/nisa2/know/index.html), [FSA o ryzyku](https://www.fsa.go.jp/policy/nisa2/invest/). Źródłowe oceny bez mutacji: [FDIC](https://www.fdic.gov/resources/deposit-insurance/understanding-deposit-insurance), [oficjalna nota Indii](https://egazette.gov.in/WriteReadData/2026/271285.pdf) — wartości odczytano z indeksu, bez pobrania PDF. Pełne rozróżnienie dostępności jest w financial-triage.json. Nie importowano nowych stawek, limitów lub pełnych krajowych zasad.

Zachowano mieszane CRLF/LF: data1306/208, allQuestions1603/176. Dokładnie5spans odtwarza cały wynik.554/556dawnych wejść literalnych+2kwalifikowane źródła;167/169priorpaths literalnych+2kwalifikowane.13preserve/15receipts zachowane. Obecny freeze ma178kompletnych unique pins, w tym odziedziczony helper C51, bez suplementu. Pełny stderr C53 jest identyczny po jedynej normalizacji26.5s→27.2s; ostrzeżenia x402-fetch/@base-org/account pozostają.

Chronologia jest jawna: statyczny komunikat GO peer fixture poprzedzał baseline; finalny plik peer został zapisany już po zmianie produktu i kwalifikuje2historyczne before-source piny spośród13designpins. Fixture/config pozostały literalne; nie zmieniano wstecz testów lub timestampów. Nowa ocena znaczenia obejmuje wyłącznie PL/EN; stare osobne ES/FR są literalne, a5locale dziedziczy istniejący ENfallback. Nie ma9locale PASS.

HEAD/branch/index zachowane. Bez nowychgitadd/commit/push/deploy, migracji/produkcyjnych zapisów, rzeczywistych sesji/profili/sekretów, płatnych/provider calls lub kontaktów. AI/cloudwrites HARD_OFF. Istniejący runtime, bez cleaninstall/auth/cloud/staging/production PASS. Dependency deferral C50 pozostaje historyczny bez nowego poll lub advisory closure. [Dowody](../../../evidence/cycle-54).
