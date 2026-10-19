# Poprawki P0 — zakres, autorzy i dowody

Autoryzacja Foundera z 14.10.2026: lokalne poprawki Coachfi.ai w obszarach bezpieczeństwa repo, API, zgód, eksportu i zakresu wersji dla dorosłych, z testami i niezależną recenzją, bez wdrożenia. Gałąź: `codex/p0-security-consent-export`. Bazowy commit produkcyjny: `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Nie wykonujemy push, deploy, zmian widoczności repo, rewrite publicznej historii, operacji na realnych danych ani płatnych wywołań.

| Pakiet / problem | Właściciel wykonania | Zależności | Rezultat i kryteria | Niezależny recenzent |
|---|---|---|---|---|
| API: kosztowne publiczne endpointy, nagłówki zgody, limity znaków | architecture_audit, role 12/14/16 | Kontrakt product-scope oraz bieżąca wersja zgód | Weryfikacja Bearer; bajtowy cap przed parsowaniem; domyślnie zamknięte zewnętrzne usługi do czasu trwałej quota, budżetu i authoritative consent; brak provider calls w testach | ux_audit |
| Zgody i eksport: default true, stare zgody, auth w eksporcie | curriculum_pilot, role 11/12/15 | API policy i AccountSync bridge | Opcjonalne false, required-only false, ponowny wybór dla starej wersji; allowlista i schema eksportu bez auth/SDK; wycofanie/cancellation; local chat i lokalny głos bez dostawcy | architecture_audit |
| Repo i adult scope: profile w Git, niegotowe Web3/Kids | ux_audit, role 10/11/14 | Root wykonuje index removal, API importuje scope | Guard metadata, ignorowanie runtime i prywatnych konfiguracji; adult navigation/routes, brak wallet init/mintu/rankingu; testy scope i repo | curriculum_pilot / root dla metadanych |
| Zależności i integracja klienta | root, role 1/2/11 | Publiczne advisory/registry i helper credentials | Pin Next15.5.27, shell-quote1.12.0, PostCSS8.5.30, Sharp0.35.5; lock, test/typecheck/build/audit; getter tylko dla zalogowanego konta | ux_audit dla zależności; architecture_audit dla bridge |

Każdy autor poprawia własny pakiet na podstawie uwag innego wykonawcy. Dopiero niezależny retest może przyjąć pakiet. Testy z mockami są dowodem lokalnych kontroli, nie produkcyjnego auth, RLS, backupu albo skuteczności Mili.

## Higiena indeksu wykonana przez koordynatora

Zweryfikowano dokładne ścieżki wewnątrz repo i użyto `git rm --cached`: `.codex-screenshots` (1421), `.codex-logs` (2), `.mcp.json` (1), `supabase/.temp` (3). Razem 1427 wpisów usunięto z bieżącego indeksu; liczba po operacji wynosi0. Lokalne pliki zachowano. `.env.example` pozostaje. Nie otwierano zawartości profili przeglądarki.

**To nie usuwa danych z istniejącej historii ani publicznego repo.** Ograniczenie ekspozycji, ocena aktywnych poświadczeń i ewentualna rotacja/rewrite wymagają osobnego działania. Utrzymujemy otwarte ryzyko incydentowe; bieżąca higiena nie może dostać etykiety „publiczny wyciek usunięty”.

Do przeglądu zmian używaj metadanych lub diff wybranych plików kodu. Pełny diff usuniętych profili/logów mógłby ujawnić ich zawartość w narzędziach i raportach.

## Aktualizacja zależności

Odczyt14.10.2026: [Next15.5.27 release](https://github.com/vercel/next.js/releases/tag/v15.5.27), [Next Windows RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36), [Next AVIF RCE](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), [shell-quote advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv). Npm registry potwierdził wersje i engines; Sharp0.35.5 wymaga Node>=20.9. Lokalny runtime Node24.19.0. PostCSS bezpośredni i override muszą mieć zgodną specyfikację; początkowy EOVERRIDE skorygowano do8.5.30. Instalacja bez install scripts zmieniła10pakietów i usunęła1. Nie uruchomiono `npm audit fix`.

Przed wydaniem sprawdzić także wersję Node w staging/production. W tym zadaniu nie zmieniamy runtime hostingu. Ewentualne pozostałe advisories wymagają jawnego triage; nie zamykamy ich samą zmianą Next.
