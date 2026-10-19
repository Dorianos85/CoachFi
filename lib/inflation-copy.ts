import type { Locale } from "@/lib/i18n";

type SpokenResult = {
  amount: string; years: number; inflation: string; realValue: string;
  change: string; contribution: string; nominalReturn: string;
};

const pl = {
  title: "Inflacja i siła nabywcza",
  description: "Sprawdź zmianę siły nabywczej przy zadanych założeniach. To przykład edukacyjny w PLN. Wpisane stopy są hipotetyczne, bez bieżących danych i prognozy.",
  amount: "Kwota początkowa (PLN)",
  years: "Liczba pełnych lat",
  rate: "Hipotetyczna roczna inflacja (%)",
  contribution: "Hipotetyczna roczna dopłata (PLN)",
  nominalReturn: "Hipotetyczna roczna zmiana nominalna (%)",
  decimalHint: "Kropka lub przecinek oznacza część dziesiętną. Bez separatorów tysięcy i zapisu wykładniczego.",
  moneyHint: "Kwota i dopłata: od 0 do 1 000 000 000 000 PLN.",
  yearsHint: "Od 0 do 100 pełnych lat.",
  inflationHint: "Od −99% do 100%; wartość ujemna modeluje deflację.",
  returnHint: "Od −100% do 100%; wartość ujemna modeluje stratę nominalną.",
  realValue: (years: number) => "Siła nabywcza kwoty początkowej po " + years + " latach",
  change: "Zmiana siły nabywczej kwoty początkowej",
  changeHint: "Wartość dodatnia oznacza wzrost, ujemna — spadek. Kwota początkowa nie otrzymuje dopłat ani odsetek.",
  chartTitle: "Trzy modele w cenach roku początkowego",
  chartDescription: "Wszystkie wartości wykresu i tabeli wyrażamy w sile nabywczej PLN z początku przykładu. Kwoty wyświetlamy z zaokrągleniem do dwóch miejsc dziesiętnych.",
  assumptions: "Model bez dopłat zachowuje stałą kwotę nominalną. Pozostałe dwa otrzymują tę samą dopłatę na koniec każdego roku. W modelu ze zmianą nominalną wcześniejsze środki zmieniają się przed kolejną dopłatą. Dopłata to stała kwota nominalna, bez indeksacji.",
  activeAssumptions: (contribution: string, rate: string) => "Wspólna dopłata: " + contribution + " na koniec roku. Zadana roczna zmiana nominalna w trzecim modelu: " + rate + ".",
  limits: "Stałe stopy upraszczają model. Pomijamy opłaty i podatki. Realne wyniki są zmienne; inwestycje mogą przynieść straty. Porównanie nie wskazuje produktu ani najlepszego wyboru. Założenia pozostają tylko w tym widoku.",
  error: "Nie można obliczyć wyniku. Uzupełnij wszystkie pola poprawnymi liczbami w podanych zakresach; okres wymaga pełnych lat.",
  resultError: "Założenia przekraczają zakres obliczeń tego modelu. Zmniejsz kwotę, dopłatę, okres lub stopę. Wynik nie jest dostępny.",
  summary: "Wartości na koniec wybranego okresu",
  model: "Model",
  value: "Siła nabywcza (PLN)",
  voiceCta: "Odczytaj założenia",
  voiceIntro: "To hipotetyczny przykład w PLN, bez prognozy i gwarancji. Pokazuje siłę nabywczą przy stałych stopach oraz jednakowych dopłatach na koniec roku. Rzeczywiste wyniki są zmienne, a inwestycje mogą przynieść straty.",
  voiceResult: "Odczytaj wynik przykładu",
  chartLabels: {
    aria: "Hipotetyczny wykres siły nabywczej: kwota bez dopłat, dopłaty bez zmiany nominalnej oraz dopłaty z zadaną zmianą nominalną.",
    cash: "Bez dopłat i zmiany nominalnej",
    habit: "Dopłaty, bez zmiany nominalnej",
    investing: "Dopłaty i zadana zmiana nominalna",
  },
  voiceText: (v: SpokenResult) => [
    "Hipotetyczny przykład w PLN, bez prognozy.",
    "Kwota " + v.amount + ", okres " + v.years + " lat, inflacja " + v.inflation + ".",
    "Siła nabywcza kwoty początkowej: " + v.realValue + "; zmiana: " + v.change + ".",
    "Modele z dopłatami: " + v.contribution + " na koniec roku; zadana zmiana nominalna " + v.nominalReturn + ".",
    "Pomijamy opłaty i podatki. Realny wynik nie jest gwarantowany.",
  ].join(" "),
};

const en: typeof pl = {
  title: "Inflation and purchasing power",
  description: "Explore purchasing power under chosen assumptions. This is an educational example in PLN. Entered rates are hypothetical, with no current data or forecast.",
  amount: "Starting amount (PLN)",
  years: "Number of whole years",
  rate: "Hypothetical annual inflation (%)",
  contribution: "Hypothetical annual contribution (PLN)",
  nominalReturn: "Hypothetical annual nominal change (%)",
  decimalHint: "A dot or comma marks decimals. Do not use thousands separators or exponential notation.",
  moneyHint: "Amount and contribution: 0 to PLN 1,000,000,000,000.",
  yearsHint: "0 to 100 whole years.",
  inflationHint: "−99% to 100%; a negative value models deflation.",
  returnHint: "−100% to 100%; a negative value models a nominal loss.",
  realValue: (years) => "Purchasing power of the starting amount after " + years + " years",
  change: "Change in purchasing power of the starting amount",
  changeHint: "Positive means an increase; negative means a decrease. The starting amount receives no contributions or interest.",
  chartTitle: "Three models in starting-year prices",
  chartDescription: "All chart and table values express purchasing power in PLN at the beginning of the example. Displayed amounts are rounded to two decimal places.",
  assumptions: "The model without contributions keeps a fixed nominal amount. Both other models receive the same contribution at the end of each year. In the model with nominal change, earlier funds change before the next contribution. Contributions are fixed nominal amounts, with no inflation adjustment.",
  activeAssumptions: (contribution, rate) => "Shared contribution: " + contribution + " at year end. Chosen annual nominal change in the third model: " + rate + ".",
  limits: "Constant rates simplify the model. Fees and taxes are omitted. Real outcomes vary; investments can lose money. This comparison selects no product or best choice. Assumptions remain only in this view.",
  error: "A result cannot be calculated. Complete every field with valid numbers within the stated ranges; the period requires whole years.",
  resultError: "These assumptions exceed this model's calculation range. Reduce the amount, contribution, period or rate. A result is unavailable.",
  summary: "Values at the end of the selected period",
  model: "Model",
  value: "Purchasing power (PLN)",
  voiceCta: "Read the assumptions",
  voiceIntro: "This is a hypothetical example in PLN, with no forecast or guarantee. It shows purchasing power under constant rates and equal end-of-year contributions. Real outcomes vary, and investments can lose money.",
  voiceResult: "Read the example result",
  chartLabels: {
    aria: "Hypothetical purchasing power chart: amount without contributions, contributions without nominal change, and contributions with a chosen nominal change.",
    cash: "No contributions or nominal change",
    habit: "Contributions, no nominal change",
    investing: "Contributions and chosen nominal change",
  },
  voiceText: (v) => [
    "Hypothetical example in PLN, with no forecast.",
    "Amount " + v.amount + ", period " + v.years + " years, inflation " + v.inflation + ".",
    "Starting amount purchasing power: " + v.realValue + "; change: " + v.change + ".",
    "Models with contributions: " + v.contribution + " at year end; chosen nominal change " + v.nominalReturn + ".",
    "Fees and taxes omitted. Real outcomes are not guaranteed.",
  ].join(" "),
};

/** PL and EN describe the approved Poland scenario; other languages use this new copy in EN. */
export function getInflationCopy(locale: Locale) { return locale === "pl" ? pl : en; }

export function formatInflationMoney(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
