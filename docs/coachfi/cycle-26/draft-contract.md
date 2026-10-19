# C26 — projekt interpretacji wyniku badania PL/EN

Status: DRAFT READY; produkt pozostaje bez zmian. Właściciel akceptacji: niezależny recenzent finansów/dowodów oraz root po świeżym baseline. Ten dokument nie zatwierdza własnej treści.

Istniejący `poland-compound-gap` ma klucz C,30 punktów i pozostaje jednym z82 kanonicznych IDs. Jest dostępny przez rzeczywisty Review/SRS; nie należy do żadnego STAGE ani dziewięciu plain pools. PL nie ma własnego override, więc potrzebna będzie jawna nowa właściwość, a nie zmiana istniejącego PL węzła. EN category zostaje `Financial Literacy`; nowa PL category to `Wiedza finansowa`.

Zastosowano coachfi-financial-review, coachfi-evidence-review, coachfi-quiz-quality i coachfi-localization. Źródła pierwotne: OECD2022, s.40/Table2.2 oraz OECD/INFE2023, s.19–20 i55–56. Pierwszy raport opisuje próbę1000 dorosłych18–79, dane2020 sprzedCOVID i36,5% łącznej poprawności odsetek prostych oraz składanych. Nie jest to dopasowany dowód dokładnego33% dla nieokreślonego roku/metody. To brak weryfikacji dawnego twierdzenia, nie wykazanie jego uniwersalnej fałszywości. Opisowy wynik lub związek statystyczny sam nie ustala bezpośredniej przyczyny zadłużenia ani niskich oszczędności emerytalnych.

Pełne zatwierdzane słowa, trzy rationale, źródła, daty i limity głosu zapisano w `content-metadata.json`. Projekt usuwa nową liczbę z pytania i uczy granic wnioskowania. Nie dodaje lekcji, tematu, poola ani zachęty do produktu.

Plan wdrożenia po osobnym GO: jeden EN rekord w `data/quizQuestions.ts` oraz nowa własna właściwość PL w `lib/allQuestions.ts`, z pełnym before/forward/inverse i jawną obsługą insertion/trailing comma. Wszystkie inne bajty pozostają literalne. `lib/localizedQuiz.ts`, stage/topic, challenge`c15` C50 i historyczne helpery są poza zmianą. Podobna treśćc15 to jawny kandydat następnego zakresu.

Brak testów/autorskiego runtime i brak product writes na tym etapie. Root prowadzi świeży actualReview baseline i niezależne acceptance.

Źródła:
- [OECD2022 — Financial Literacy in Poland](https://www.oecd.org/content/dam/oecd/en/publications/reports/2021/09/financial-literacy-in-poland_b03b02c0/f5f2adc3-en.pdf)
- [OECD/INFE2023 — Adult Financial Literacy](https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/12/oecd-infe-2023-international-survey-of-adult-financial-literacy_8ce94e2c/56003a32-en.pdf)
