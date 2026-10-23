# Cykl 8 — B18: status po niepowodzeniu lokalnego zapisu quizu

14.10.2026. ZAKOŃCZONY, LIMITED ACCEPT w [REPORT](REPORT.md) i verification. B17 walidacja/preflight przyjęte w cyklu7; B18 nie zakłada atomowej transakcji SRS/punktów/streak. Istniejąca gałąź i staged patch zachowane. Dzisiejsze B10 dependency advisory bez kompatybilnego patcha pozostają otwarte; nie ponawiamy niezmienionego audytu ani instalacji.

Kontrakt: wynik sukcesu dopiero po synchronicznym zakończeniu zapisu SRS i wymaganej nagrody. Strict read probe przed akcjami. Ponowienie dopuszczalne tylko przy błędzie przed wywołaniem jakiejkolwiek metody mutacji. Każde wywołanie setItem/removeItem oznacza próbę mutacji przed delegacją: false, throw, połknięty błąd lub późny błąd nie dają pewności braku zapisu. Niepewny wynik blokuje automatyczne ponowienie dla bieżącej odpowiedzi i pokazuje PL/EN alert. Odczyt salda odświeża widok bez replay reward. Captured owner/ticket, reentry i duplicate są ograniczone kontrolerem jednego komponentu; reset nie zwalnia starego aktywnego run przed finally. Bez durable journal, nowego formatu danych, rollbacku lub exactly-once między kartami/urządzeniami/remountem.

Rozłączne pliki i role:

- architecture_audit autor lib/quiz-save.ts, tests/cycle8-save-author.test.ts, własny save-author report/evidence. Synthetic baseline rzeczywistych helpers oddzielnie od acceptance.
- root autor components/QuizCard.tsx i app/quiz/page.tsx, config/snapshot/parity/gates/rejestry. C7 własny mocked author fixture aktualizowany wyłącznie do nowego traced storage contract; brak zmiany jego oracles. Nie zatwierdza własnego UI.
- curriculum_pilot niezależny reviewer kontrolera, tests/cycle8-save-review.test.ts i własny report/evidence. Każdy finding odtworzony, naprawa autora i niezależny retest. Nie powtarza niezmienionych C7 numeric cases osobno.
- ux_audit niezależny UI/React reviewer, tests/cycle8-quiz-review.test.ts i tests/e2e/quiz-save-failure.spec.ts oraz własny report/evidence. Real helpers na synthetic Map/hook slots nie są ReactDOM; prawdziwy browser osobną bramką. Root recenzuje E2E oracles przed wykonaniem.

Po source freeze: targeted właścicieli i reviewerów, niezależne verdicts/retest; pełne unit i standaloneTS oraz build w hash-verified TEMP. Browser12: cztery nowe PL/EN read-failure/retry i write-then-throw/quarantine/readonly reload; sześć C6 i dwa C7 bezpośrednio dotknięte wspólnym QuizCard/Page. Poprzednich22 innych green nie powtarzać. Fresh synthetics, localhost browser, klucze auth/provider blank; bez realnych sesji/audio/AI/DB. Evidence zawiera rzeczywiste failures i ograniczenia.

Bez commit/push/deploy, produkcyjnych zapisów/migracji, sekretów/profili, historii, paid calls i kontaktów z ludźmi. Automatic cloud writes, external AI, health upload/Kids/Web3/afiliacja pozostają off. Brak stagingu nie blokuje lokalnej pracy i nie daje PASS. B06 pozostałe moduły, B02/B09/B16 oraz produkcja pozostają poza acceptance tej paczki.
