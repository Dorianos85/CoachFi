# C24 — inwestowanie długoterminowe PL/EN

Status: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED

Poprawiono pięć istniejących pytań, ich feedback i pięć kroków lekcji w obu językach. W polskim quizie temat inwestowania używa teraz sprawdzonego polskiego banku zamiast angielskiego fallbacku. Zmiana obejmuje12węzłów danych i jeden warunek resolvera. ETF, indeks, dywersyfikacja, koszty i horyzont otrzymały warunkowe, edukacyjne wyjaśnienia; małe działanie jest dobrowolne, po potrzebach/minimum i rezerwie, z możliwością pauzy.

14 nowych przypadków PASS (7finanse+7actualUI) po zachowanym baseline5PASS/9FAIL. Osobno31dotkniętych historycznych przypadków PASS w6celowanych przebiegach2/1/4/8/8/8; wszystkie515literalnych expect i pełne6describe zachowano. Nie powtarzano zielonych testów bez zmiany źródeł lub uzasadnionej obawy. Metryka greenRepeats0 dotyczy nieuzasadnionych powtórek po zielonym wyniku; pięć baselinePASS zasadnie wróciło w14przypadkach po zmianie produktu. To nie45nowych ani globalna regresja. TS0/13pins; świeży TEMP build34/34pages35routes,413inputs/412po next-env, dualSHA0drift. Chrome4/4single/retry0: PL/EN mobile375px,5kroków,5kart,135punktów i tokeny125→260,5SRS, klawiatura/reload; osobno uszkodzone6/5z kontrolowanym błędem i zachowanym raw. API0/pageErrors0, port43191 wolny przed i po.

Recenzje są rozdzielone: daily_author napisał dane/adapter, daily_data_review ocenił finanse i adapter, daily_ui_review ocenił actualUI oraz rootresolver/tools. Root ocenił fixtures/E2E i wykonał runtime. Narzędzie legacy roota recenzował daily_author, bez zatwierdzania własnego adaptera. Otwarte findings0 w tych zakresach; finalny ledgerQA pozostaje osobną bramką.

Klucze C/B/B/C/B, nagrody30/25/25/25/30 i bank82 zachowane. Źródła405z C23:395literalnych,4produkty i6fixture jawnie kwalifikowane;4stare helpers i receiptC23 literalne. Nowy helper odwraca wyłącznie12węzłów i zachowuje obce pola. Korekta C17binding i katalogu outputChrome nastąpiła przed właściwym runtime. Źródła/wyliczenia: [draft](content-metadata.json), [niezależna recenzja](../../../evidence/cycle-24/financial-review.json). Model PLN1000przy stałych hipotetycznych5%rocznie/kapitalizacji rocznej/pozostawieniu odsetek daje1050a następnie1102,50; dodatkowe2,50 to odsetki od odsetek. To nominalny model bez przepływów/opłat/podatku/inflacji, bez oferty i gwarancji.

- Local synthetic checks only; actual components use explicit mocked provider/hooks/context; Chrome uses a synthetic adult guest with API/external blocked.
- No provider Auth, real audio, RLS, staging, CI, fresh-checkout or production PASS. Build retains known optional Coinbase x402/base-account warnings; no Auth closure.
- Five existing IDs, keys C/B/B/C/B, rewards30/25/25/25/30 (135), bank82; old SRS retained, new content version is not proof of historical comprehension.
- Other seven locales have no new localization acceptance; existing EN inheritance can reflect new EN copy.
- Immutable draft cb6e24 remains historical implementation_authorized:false; actual approved implementation is recorded here and in independent actual finance/UI reports.
- No commit/push/deploy, cloud writes, paid calls or external AI. Package/lock unchanged; no new dependency audit.
- Generic lesson5/5 counts steps; quiz completion uses5SRS records separately. Reload proof does not establish general reward exactly-once/remount guarantees.

Następny wykonalny kandydat: retirement (2istniejące IDs). Wymaga świeżego inventory/baseline i recenzji finansowej PL/EN. Brak stagingu nie daje PASS. ProdukcjaNO-GO.
