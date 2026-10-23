# Publiczne cenniki odniesienia — nie aktywne rachunki Coachfi

Odczyt14.10.2026. Kod `/api/chat` ma domyślny `claude-haiku-4-5-20251001`. Rzeczywisty runtime może go nadpisywać; brak potwierdzenia aktywnego modelu, regionu, umowy i zużycia. Nie zmieniono dostawcy ani modelu.

| Dostawca | Publiczny punkt odniesienia | Znaczenie dla planu |
|---|---|---|
| Anthropic | Haiku4.5:1USD input,5USD output za milion tokenów, bez cache | Przy1500input/500output daje0,004USD/odpowiedź. Źródło: [oficjalny cennik](https://platform.claude.com/docs/en/about-claude/pricing). |
| Supabase | Pro25USD/mies., z kredytem compute10USD na jedną instancjęMicro; dodatkowe użycie/projekty może podnosić koszt | Istnienie taryfy nie oznacza jej aktywacji ani wystarczalności dlaCoachfi. Źródło: [pricing](https://supabase.com/pricing). |
| ElevenLabs | Starter6USD/mies./30tys.kredytów; Creator22USD/121tys.; odczytana strona zawiera promocje pierwszego miesiąca | Nie budżetować ciągłej pracy ceną promocyjną. TTS i agent mają różne koszty produktów; nie utożsamiać kredytów z rozmowami. Źródło: [pricing iFAQ](https://elevenlabs.io/pricing). |
| Stripe Polska | Karty standardoweEEA:1,5%+1PLN; premiumEEA1,9%+1PLN; dodatkowe warunki dla walut/innych kart | To odrębne źródło od syntetycznego2,9%+0,30USD. Waluta, konwersja oraz usługowe Billing wymagają pełnej taryfy. Nie wybrano Stripe dla produktu. Źródło: [pricingPL](https://stripe.com/en-pl/pricing). |

Nie przeliczamy PLN naUSD bez datowanego kursu, a cena5USD nie ustanawia waluty rozliczeniaPL. Te punkty służą sprawdzeniu rzędu kosztów, nie wyborowi planu ani kompletnej wycenie. Opłaty/podatki i warunki mogą się zmieniać. Przed zakupem ponownie sprawdzić aktualny cennik, region i kontrakt.

W modelu syntetycznym1/4USD perMTok niezależnie przeliczono27 scenariuszy. Zastosowanie1/5 dla potwierdzonej taryfy Haiku4.5 zmieniłoby średni koszt odpowiedzi o0,0005USD. Przy1000MAU/100premium i typowym20/200 replies:900×20+100×200=38000odpowiedzi, więc miesięczny koszt wzrasta o19USD względem modelu, do501,50USD przy jego pozostałych założeniach. Nie jest to rzeczywisty rachunek Coachfi; context, retries i voice mogą zwiększyć wynik. Plan finansowy powinien oprzeć się na metrykach runtime i fakturach przed zatwierdzeniem budżetu.
