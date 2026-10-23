# C20 — kontrakt niemutującego odczytu postępu

Status: szkic. Przed implementacją wymagane są rzeczywisty baseline data/UI, niezależna recenzja projektu oraz SOURCE GO roota. Nie zmieniono produktu ani testów.

Publiczny API: `readStageProgress(storage: PersonalStorageHandle): StageProgress[]`. Funkcja synchronicznie zwraca wynik istniejącego `getAllStageProgress` dopiero po potwierdzonym odczycie obu cache. Odmowa, błędny schema, async, SSR i utrata ownera rzucają; brak danych (`null`) pozostaje zdrowym pustym cache. Brak fallback na pozorne zero. Stale zachowuje komunikat „Storage session changed”.

SRS jest walidowany przez niezmieniony `readReviewCards`, przy jednym rzeczywistym odczycie RAW. Manual musi być zwykłym obiektem JSON z własnymi wartościami `started` lub `completed`; nieznane klucze etapów są dozwolone. Błędne bytes pozostają nietknięte.

Dwa zachowane oryginalne RAW trafiają do frozen read-only snapshotu dla niezmienionego `getAllStageProgress`. Snapshot obsługuje tylko dwa klucze; mutacje, release i obce klucze rzucają. Nie powstaje druga mapa etapów, schema SRS ani kalkulacja statusów. Current sprawdzamy przed i po odczytach oraz po computation; wykryty fault pozostaje sticky w obrębie tego wywołania, także gdy shared helper złapie wyjątek.

Własne nowe przypadki obejmą healthy equivalence, strict schema, bytes/zero writes, async i przejścia ownera oraz capture bez dodatkowych live reads. Autor nie zatwierdza własnego helpera. Brak zmian auth, signIn, stage writes, cloud, danych, zależności lub produkcji.

## Implementacja i własne dowody

Nowy `lib/learning-progress-read.ts` ma SHA `981d84b5628d9153501c81b24f3ccb4ccd943bdd6b254e9da3cddf373e7bef27`. Źródło frozen po SOURCE READY. Pierwszy i jedyny własny targeted fixture przeszedł 30/30; siedem hashów przed/po zgodnych, zero writes/remove/release/cloud/network. Raw wyniki: `evidence/cycle-20/read-author-tests.json`; pełne polecenie, wyjście i hashe: `read-author-run.json`. Nie ponawiano starych zielonych testów.

Niezależny baseline starego helpera (6 obserwacji) i akceptację projektu przygotował data reviewer; nie są one nowym przyjęciem produktu. Niezależny acceptance nowego readera oraz bramki roota pozostają odrębne. Autor nie zatwierdza własnej zmiany.

Snapshot to dwa kolejne odczyty RAW, bez atomowej transakcji lub CAS. Błędne manual/SRS blokują odczyt bez migracji. Poprawne unknownstagekeys/fields i historyczne interval ponad90 pozostają zgodne ze schema Review. Stage write APIs i reguły logowania bez zmian.
