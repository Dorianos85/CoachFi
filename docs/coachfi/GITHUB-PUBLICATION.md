# Coachfi — paczka do przeglądu na GitHub

Zakres: dorośli w Polsce, PL/EN. Poprawki przygotowane lokalnie do C73 obejmują bezpieczeństwo repo i API, uczciwe stany konta/wyników, zgody, wybrany eksport i integralność danych oraz treści i formatowanie PL/EN. Zewnętrzne AI i zapisy cloud pozostają wyłączone. Gotowość produkcji: **NO_GO**.

Postcss-selector-parser zaktualizowano lokalnie do 7.1.6 dla Tailwind i postcss-nested. C73 zaliczył 21 istniejących testów parsera/CSS, TypeScript i build Next z dwoma syntetycznymi odpowiedziami fontów. To weryfikacja istniejącego runtime; czysta instalacja C74 nie została wykonana. Historyczny normalny zestaw C69 miał 3534 zaliczone przypadki na wcześniejszym runtime. Wynik osobnej kontroli dokładnej paczki publikacyjnej należy czytać w opisie pull requestu, bez dodawania historycznych przebiegów do nowego licznika.

Test C63 zachowuje niezależną kontrolę trzech usuniętych deklaracji i 20 wpisów locka. Jego oczekiwania uwzględniają teraz wyłącznie zatwierdzone dwa overrides C73 i trzy pola parsera; pozostały graf i asercje pozostają ścisłe.

Publikacja jest snapshotem lokalnej gałęzi `codex/p0-security-consent-export`. Nowszy `main` zawiera odrębną pracę; pull request wymaga integracji i ponownej oceny przed scaleniem. Konfiguracja `vercel.json` wyłącza automatyczne deploymenty tej konkretnej gałęzi, zgodnie z [dokumentacją Vercel](https://vercel.com/docs/project-configuration/git-configuration).

Usunięcia dawnych profili przeglądarki i lokalnej konfiguracji dotyczą nowego drzewa Git. Historia repo nie została przepisana; nie jest to dowód usunięcia wcześniejszych kopii ani rotacji dostępów. Do paczki trafiają wymagane dane testowe i dokumentacja; zainstalowane zależności, vendor/quarantine, niedokończone C74 oraz niepotrzebne surowe logi pozostają lokalne. Część historycznych raportów odwołuje się do lokalnych dowodów, których ta paczka nie publikuje.

Pozostają: kontrola czystej instalacji, residual advisories narzędzi, ścieżki rzeczywistych kont/Auth/RLS i praw do danych w kontrolowanym środowisku oraz pozostałe bramki wydania. Build lub publikacja na GitHub nie zamyka tych wymagań.
