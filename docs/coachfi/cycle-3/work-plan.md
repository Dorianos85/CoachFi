# Cykl 3 — B13, integralność przy zmianie sesji

14.10.2026, heartbeat `coachfi-ai-kontynuacja-poprawek`. Repo `source/CoachFi`, lokalna gałąź `codex/p0-security-consent-export`; zachować wcześniejszy indeks i pliki. Bez push, deploy, migracji, rzeczywistych kont, provider calls, profili lub sekretów. Polska, dorośli, PL/EN. Zewnętrzne AI i health upload pozostają wyłączone.

## Problem i kryteria

Odczyt bazowego kodu potwierdza brak anulowania timerów Supabase AuthContext oraz hydratację po asynchronicznym odczycie bez ponownej kontroli sesji. Ścieżka CDP ma globalny getter i wspólną kolejkę, spóźnione odpowiedzi oraz cleanup czekający na flush. To obserwacje kodu, bez testu cross-user na produkcji.

Przyjęcie lokalne wymaga syntetycznych reprodukcji: logout/user switch/unmount przed timerem, tokenem, GET i PUT; ponowne logowanie tego samego użytkownika; brak spóźnionych zapisów, hydratacji, sukcesu lub wyczyszczenia nowego dirty state. Błąd odczytu nie może oznaczać pustego konta i uruchamiać seed. Anulowanie requestu nie gwarantuje cofnięcia zapisu już przyjętego na serwerze. Pełna izolacja magazynu urządzenia, kontrolowane dwa konta oraz RLS w stagingu są osobnymi bramkami.

## Własność i niezależna recenzja

| Zakres | Autor / wyłączna własność | Recenzent |
|---|---|---|
| Supabase auth i legacy sync | architecture_audit: AuthContext, cloudSync, nowy session helper, własne testy i raport implementacji | ux_audit, root integracja |
| CDP konto i learning sync | curriculum_pilot: account-sync, AccountSync, wyłącznie logout handler AppNavigation, własne testy i raport | ux_audit, root integracja |
| Reprodukcje i adversarial retest | ux_audit: nowe cycle3 review tests, security-review, review evidence | root ocenia dowody, autorzy naprawiają findings |
| Kolejność kontroli i rejestry | root: current-cycle, backlog, REPORT, verification | ux_audit niezależny werdykt kodu |
| Precondition tożsamości API konta | root: account route i nowe cycle3-account-api tests; nagłówek oczekiwanej tożsamości porównany z verified bearer przed storage | ux_audit |
| Jeden aktywny backend konta | root: providers i cycle3-provider-selection tests; architecture_audit dodaje disabled prop w AuthContext | ux_audit |
| Wyjaśnienie zapisu PL/EN | root: wyłącznie description w AccountButton, bez zmian auth UI | ux_audit |

Nie uruchamiać równoległego install, serwera, pełnej suity, typecheck lub buildu. Właściciele mogą uruchamiać celowane testy na mokach bez sieci. Po zamrożeniu finalnego patcha koordynator wykona zbiorcze testy, osobny typecheck i build; dodatkowe E2E tylko gdy zmieniona ścieżka jest osiągalna i można ją sprawdzić bez realnego SDK/konta. Istniejących zielonych testów nie powtarzać bez uzasadnienia zmienionym wspólnym auth/sync.
