# Coach FI - analiza dokumentacji

## Znalezione pliki z dokumentacja

Oryginalne pliki znalezione w:

```text
C:\Users\doria\Downloads\CoachFI.pptx
C:\Users\doria\Downloads\coachfi_pitch_deck.pptx
C:\Users\doria\Downloads\coachfi_pitch_online_final_7slides (1).pptx
```

`CoachFI.pptx` i `coachfi_pitch_online_final_7slides (1).pptx` sa tym samym finalnym deckiem 7-slajdowym. `coachfi_pitch_deck.pptx` to starszy/szerszy wariant 9-slajdowy.

Kopie robocze zostaly uporzadkowane w:

```text
C:\Users\doria\Documents\CoachFI\docs\source
```

## Esencja produktu

Coach FI to AI-powered financial education coach dla doroslych, dzieci i osob niedowidzacych. Produkt nie jest aplikacja tradingowa ani aplikacja z poradami finansowymi. Jego rola to budowac pewnosc, zdrowe nawyki i dlugoterminowa swiadomosc finansowa.

Obecny core MVP obejmuje money mindset, saving habit, inflation and purchasing power, credit, interest and WIBOR, emergency fund, long-term investing basics, retirement and family financial planning.

Core MVP nie uczy tradingu, leverage, futures ani spekulacji. Crypto moze pojawic sie pozniej jako modul edukacyjny, ale nie jest czescia core MVP. Solana w MVP sluzy jako proof-of-progress layer dla tokenow i certyfikatow NFT.

Glowne haslo z dokumentacji:

```text
People need a coach before they need another trading app.
```

## Problem

Decki powtarzaja cztery bariery:

- uzytkownicy mysla, ze potrzebuja duzego kapitalu, zeby zaczac,
- boja sie straty i czesto nie rozumieja ryzyka,
- nie maja realnej edukacji finansowej,
- maja slabe nawyki i potrzebuja struktury, powtarzalnosci oraz odpowiedzialnosci.

## Proponowane rozwiazanie

Rdzen produktu:

- assessment finansowej gotowosci,
- personalizowana sciezka nauki,
- AI avatar coach,
- mikro-lekcje i quizy,
- streaki, XP, readiness score i milestone'y,
- Coach FI Tokens za ukonczone lekcje i quizy,
- NFT certificate na Solana jako dowod postepu edukacyjnego.

Dokumentacja bardzo jasno rozdziela edukacje od doradztwa finansowego: Coach FI ma nie mowic uzytkownikom co kupic, tylko budowac confidence, healthy habits i long-term awareness.

## MVP z dokumentacji

W decku wskazany jest 30-dniowy MVP:

- onboarding + readiness assessment,
- AI avatar intro flow,
- jedna prowadzona sciezka: mindset, saving, inflation, credit, emergency fund, retirement i long-term basics,
- quizy + streaki + przypomnienia,
- on-chain badge za ukonczony postep.

Na tej podstawie obecny frontend implementuje demo loop: start aplikacji, health check, inflation reality check, learning path, coach chat, quiz, token reward i mock Solana NFT certificate.

## Model biznesowy

Deck zaklada:

- B2C freemium: podstawy za darmo, platne sciezki i glebszy coaching,
- B2B2C: partnerstwa z fintechami, edukatorami, szkolami, pracodawcami i spolecznosciami,
- utility token/reputation layer: dostep, status, challenge entry i proof-of-progress.

## Dlaczego Solana

Solana jest uzasadniona jako warstwa mikro-nagrod i widocznego postepu: tanie, szybkie transakcje, badge, XP i konsumencka skala.

W obecnym core MVP Solana nie sluzy do spekulacji, tradingu ani instrumentow finansowych. Sluzy wylacznie jako infrastruktura dla proof-of-learning: token reward i NFT certificate.

## Decyzje w lokalnym projekcie

Poniewaz w systemie nie znaleziono gotowego kodu aplikacji Coach FI, zostal utworzony uporzadkowany lokalny projekt w `Documents\CoachFI`.

Obecna wersja:

- jest Next.js frontendem,
- uzywa TypeScript i Tailwind CSS,
- ma osobne trasy dla core ekranow,
- uzywa mock data,
- symuluje AI coacha,
- symuluje Solana NFT certificate mint flow,
- pokazuje pelny core loop MVP do prezentacji/demo.

## Braki do wersji produkcyjnej

- prawdziwe konta uzytkownikow,
- backend i baza danych,
- integracja z modelem AI,
- wallet Solana,
- realny mint badge/reward,
- tracking retencji,
- panel B2B dla partnerow.

Poza zakresem core MVP pozostaja trading, leverage, futures, spekulacja i rekomendacje inwestycyjne.
