# Niezależna recenzja audytu UX i dowodów

Data: 2026-10-14, Europe/Warsaw. Recenzent: curriculum_pilot, role 7/8 wykonujące niezależną kontrolę tego nieautorskiego rezultatu. Autor audytu: ux_audit, rola10. Zakres: zgodność raportu z rejestrem obserwacji, demo/live/cache/storage, liczniki i PL/EN przez źródła. **Nie jest to zatwierdzenie mojego pilota ani wydania/WCAG.**

**Wynik po ponownym odczycie: accept w ograniczonym zakresie metodologii, spójności dowodów i głównych ustaleń; UXR-01–03 zamknięte po korekcie opisów.** Ocena gotowości pozostaje niepotwierdzona. Nie zmieniono plików autora UX, nie wykonywano nowych akcji na publicznej aplikacji.

## Przeczytane materiały i metoda

Przeczytano `docs/coachfi/audit/product-ux.md`, 31 opisów obserwacji i zarejestrowane ograniczenia w `evidence/ux-observations.json`. Do kontroli porównań policzono statyczne źródła pytań, lekcji i mapy stage ID oraz odczytano QuizCard/allQuestions, srs, home, ModeGate, AppNavigation i ConsentManager z commitu **86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b**. Obejrzano screenshoty `20-mobile-home-mode-pl.jpg` i `22-quiz-mindset-en.jpg`: nakładki są widoczne, więc nie można uznać screenshotów za normalny odblokowany onboarding.

Metadane niezależnego audytora w evidence/architecture.json A25 powiązały repo z publiczną produkcją: dpl_AaEiWV85rietTuq3Z5GqogCu3DuN, READY/production, alias coachfiai.com i githubCommitSha86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b; deployment ID odpowiada publicznemu DOM z UX. To wzmacnia wyjaśnienie przez kod, lecz nie testuje wszystkich konfiguracji/chmurowych przepływów. Recenzja nie uruchamia auth, backendu, płatności, zgód, mintowania ani realnego score.

## Ustalenia przyjęte w ograniczonym zakresie

| Zakres / obserwacje | Wynik niezależnej kontroli | Granica wniosku |
|---|---|---|
| Hydratacja/cache, UX-001/005/007/008/031 | Raport poprawnie odróżnia początkowy HTML (disabled sign-in,0/0,fallback) od późniejszego UI. Nasza ekstrakcja web również nie dała pełnego banku. | Początkowy HTML nie jest stałą awarią ani dowodem braku konfiguracji auth. |
| Współdzielony storage, UX-001/013/016/024/031 | Jawnie wskazano brak izolacji i nie przypisano istniejącego score/rankingu/zgód do nowego konta lub incydentu. | Potrzebny czysty profil/staging; nie można z tego wywieść automatycznej zgody lub wycieku danych. |
| PL quiz mindset, UX-007/028 | Objaw PL UI/EN pytanie potwierdzony w rejestrze. Kod: getQuizQuestions(pl) ma4 początkowe ID; topic mindset ma inne3 i trafia do EN fallback w QuizCard. | Live przetestowano tylko pierwszy widok; feedback i zapis niesprawdzone. Kod sugeruje ten sam problem24/28 stage ID. |
| Liczniki Learn, UX-005/026 | Kod STAGE_QUESTION_IDS:3+4+4+4+3+5+2+3=28. Są8 lekcji i28 kroków. Raport słusznie nie uznaje liczników za pełny bank. | Cały source bank ma82ID; występują duplikaty. Nie dodawać ich jako82 unikalnych lekcji. |
| Lekcja PL/EN, UX-006/027 | Trzy kroki pasują do moneyMindsetLesson; końcowe linki do topic=mindset zgodne. | Klawiatura pod modalem nie dowodzi standardowego działania myszy ani ukończenia konta. Treść „oszczędzaj przed czynszem/jedzeniem” ma osobny problem merytoryczny w content-inventory FIN-01. |
| Zmiana waluty przez język, UX-003/025 | health-check renderuje pola z t.currencySymbol; home z t.currency i locale. Obserwacja tych samych kwot przy nowym symbolu uzasadnia rozdzielenie języka/rynku/waluty. | To nie dowód wykonanej konwersji waluty; raport jej nie zakłada. |
| ModeGate fokus/mobile, UX-004/024 | Rejestr ma konkretny Tab z Kids do stopki. ModeGate ma aria-modal, lecz brak własnego focus trap/inert tła. Screenshot pokazuje bottom navigation ponad nakładką. Kod ma nav z1100 i ModeGate z85, ConsentManager z90. | Potwierdzony objaw z jednej sekwencji i wąskiego okna; pełny porządek fokusu/NVDA/fizyczny telefon pozostają niesprawdzone. |
| Opcjonalne zgody, UX-013 | W kodzie przyciski ustawień mają stan wizualny, brak aria-pressed/aria-checked. | Nie sprawdzono faktycznego respektowania zgody przez serwery/dostawców. |
| Font, UX-029 | Zapisane wartości16→20px i klasa text-scale-xlarge potwierdzają zmianę rozmiaru. | To nie test200%/400% zoom lub reflow. |
| Karty, UX-018 |16source rekordów w storyCards, UI1/16 i tekst10faktów są rozbieżnym opisem zakresu. | Sam source label nie weryfikuje statystyk; osobny przegląd finansowy potrzebny. |
| Review, UX-017 | Istnieje uproszczony SRS i ścieżka5nowych na pojedynczy getDueIds. Raport uczciwie mówi, że live harmonogramu/retencji nie testowano. | Kod algorytmu nie jest badaniem skuteczności; MAX_NEW_PER_DAY nie egzekwuje globalnego limitu5/dzień. |
| Publiczne auth/legal/help/Mila, UX-008–014 | Raport nie zamienia widoku na dowód logowania, działającego modelu, prawnej zgodności lub usuwania danych; dokumenty określone jako robocze. | Nie jest to finalny audyt prywatności/prawa/backendu. Nieznalezienie publicznej pomocy ograniczone do przeglądanych powierzchni. |
| Demo skrypty, Kids, DeFi i accessibility, UX-011/016/021–023 | Rozróżniono treści skryptów/demo od score osoby, oraz obecne ekranowe rozszerzenia od decyzji Foundera o późniejszym etapie. | Nie zweryfikowano izolacji Kids, mintowania, depozytów, odpowiedzi Mili ani zasad numerologii. |

Powiązania kodu: [source/CoachFi/components/QuizCard.tsx](../../../components/QuizCard.tsx#L35), [source/CoachFi/lib/localizedQuiz.ts](../../../lib/localizedQuiz.ts#L67), [source/CoachFi/lib/allQuestions.ts](../../../lib/allQuestions.ts#L817), [source/CoachFi/lib/learningProgress.ts](../../../lib/learningProgress.ts#L10), [source/CoachFi/app/page.tsx](../../../app/page.tsx#L148), [source/CoachFi/app/health-check/page.tsx](../../../app/health-check/page.tsx#L269), [source/CoachFi/components/ModeGate.tsx](../../../components/ModeGate.tsx#L183), [source/CoachFi/components/AppNavigation.tsx](../../../components/AppNavigation.tsx#L626), [source/CoachFi/components/ConsentManager.tsx](../../../components/ConsentManager.tsx#L545).

## Uwagi do autora

**UXR-01 / P2 / UX-030 / revise.** Zapisane on/off mają identyczne bodyBackground,bodyColor,rootAttrs. Nie zapisano wartości aria-pressed w tych obiektach ani konkretnej zmiennej, która się zmieniła. Stwierdzenie „zmienia aria-pressed i zmienne stylu” w takim brzmieniu nie ma odtwarzalnego dowodu w zapisanym pomiarze. Zawęzić do wykonanej interakcji i braku zmiany zmierzonych pól albo dodać konkretny dowód atrybutu/zmiennej. Nie wywodzić z tego pomiaru poprawy kontrastu. Przyjęcie: rejestr i opis odpowiadają tym samym rzeczywistym wartościom.

**UXR-02 / P2 / liczniki home vs Learn / revise opis przyczyny.**82 na home pochodzi z getAllQuestionIds,28 w Learn z STAGE_QUESTION_IDS. Są to różne zbiory. Ich nierówność sama w sobie nie jest błędem rachunku. Błąd dla użytkownika polega na niejasnej etykiecie „Lessons/sprint” dla liczby odpowiedzianych rekordów całego banku oraz niezdefiniowanym związku z etapami. Ustalić nazwy i zakres; nie wymuszać mechanicznie82→28. Przyjęcie: obie wartości mają jednoznaczny mianownik i źródło. Dodatkowo82 nie oznacza82niepowtarzalnych pytań.

**UXR-03 / P2 / status zasobów / revise.** Plan nadal zawiera „uzyskać repo”. Founder już udostępnił repo; aktualna zależność to identyfikacja commitu publicznego wdrożenia, staging/konta testowe oraz konfiguracja środowiska. Można zachować historię, że audyt UI rozpoczął się bez kodu, ale obecny następny krok nie ma ponownie żądać repo. Przyjęcie: aktualny dostęp jasno odróżniony od brakującego środowiska.

Autor otrzymał uwagi i sam poprawił raport/rejestr. Recenzent ponownie odczytał fragmenty 2026-10-14: UX-030 mówi tylko o obserwowanym aria-pressed=true oraz niezmienionych kolorach; nie obiecuje zmiany kolorów ani potwierdzonego przywrócenia atrybutu. P2 licznika rozróżnia bank82 i stage28 oraz etykietę Lessons/sprint. Sekwencja odwołuje się do dostępnego repo i staging. UXR-01–03 closed dla dokumentacji; nie wykonano nowego live testu. A25 potwierdził następnie commit produkcji, więc do aktualnego następnego kroku pozostaje staging/konta/testy. Brak dowodów całej ścieżki nadal uniemożliwia akceptację wydania.

## Pozostałe dowody potrzebne przed wydaniem

Izolowany profil i konto dorosłego; poprawiona lokalizacja całego quizu z błędną odpowiedzią/feedbackiem; trwały zapis i powrót w PL/EN; testy głównej ścieżki z NVDA/VoiceOver/TalkBack i klawiaturą; obliczenia/warunki źródłowo zrecenzowane; działający kontakt; export/delete po stronie wszystkich deklarowanych miejsc; prawa dostępu i respektowanie zgód. Istniejący audyt UI jest wartościową próbką, lecz nie dostarcza tych dowodów.

Nie wydaję rekomendacji „gotowe na realnych użytkowników” ani „zgodne WCAG2.2AA”. Ta recenzja przyjmuje ograniczone ustalenia po doprecyzowaniu opisów; ograniczenia testowania pozostają.

