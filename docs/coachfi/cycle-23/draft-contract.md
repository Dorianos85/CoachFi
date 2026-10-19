# C23 — draft jednego istniejącego pytania

Status: DRAFT READY, bez implementacji lub własnego ACCEPT. Pełne zamrożone słowa PL/EN i trzy rationale są w `content-metadata.json`. Draft wykorzystuje dosłownie tekst odroczonej propozycji C18, która nigdy nie została przyjęta lub opublikowana. Fresh baseline i niezależna recenzja finansowa są nadal konieczne.

Zakres: tylko EN record w `data/quizQuestions.ts` i PL override w `lib/allQuestions.ts`, ID `emergency-first-milestone`, klucz B, nagroda25, bank82 bez zmian. `lib/localizedQuiz.ts` ma własny target wyłącznie ES/FR; nie zmieniamy go. PL/EN default plain pools i etapy nie zawierają tego ID, więc nie dodajemy modułu, lekcji ani trasy.

Przykład: po potrzebach i wymaganych minimum zostaje20PLN; można dobrowolnie wybrać5PLN, a przy braku nadwyżki zrobić pauzę. Kwoty w feedbacku1200−1080−100=20 i20−5=15 dotyczą jednego hipotetycznego okresu. Minimum liczymy raz. Miesiąc nie jest obowiązkowym pierwszym progiem; nie pożyczamy na oszczędzanie. Nie obiecujemy określonej redukcji zaległości.

Autor świeżo odczytał pierwotny [przewodnik CFPB](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/),15.10.2026. Źródło wspiera zależny od sytuacji cel, mały start i uwzględnienie zmiennego cash flow. Nie przypisujemy mu liczbPLN, obowiązkowych minimum lub ilościowego efektu miesiąca; to założenia ćwiczenia.

Wholevoice347PL/326EN mieści pytanie i4opcje w obecnym limicie500; Review czyta wyjaśnienie osobno. To pomiar draftu, nie actualUI/audio PASS. HistoriaSRS pozostaje pod tym samym ID, bez resetu lub reinterpretacji dawnych odpowiedzi jako rozumienia nowego tekstu. Inne7locale sourceblocks pozostają literalne; pięć canonical fallbacków może dziedziczyć EN bez osobnego localization ACCEPT.
