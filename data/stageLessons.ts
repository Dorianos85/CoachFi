import type { Locale, LocalizedMap } from "@/lib/i18n";

export interface StageLessonStep {
  title: string;
  body: string;
}

export interface StageLessonCopy {
  title: string;
  stepLabel: (current: number, total: number) => string;
  next: string;
  quiz: string;
  steps: StageLessonStep[];
}

type WrittenLocale = Locale;

export interface StageLesson {
  quizHref: string;
  copy: LocalizedMap<StageLessonCopy>;
}

const chrome: Record<WrittenLocale, Pick<StageLessonCopy, "stepLabel" | "next" | "quiz">> = {
  en: {
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    next: "Next",
    quiz: "Take the quiz",
  },
  pl: {
    stepLabel: (current, total) => `Krok ${current} z ${total}`,
    next: "Dalej",
    quiz: "Rozwiąż quiz",
  },
  ja: {
    stepLabel: (current, total) => `ステップ ${current} / ${total}`,
    next: "次へ",
    quiz: "クイズへ進む",
  },
  es: {
    stepLabel: (current, total) => `Paso ${current} de ${total}`,
    next: "Siguiente",
    quiz: "Hacer el quiz",
  },
  fr: {
    stepLabel: (current, total) => `Étape ${current} sur ${total}`,
    next: "Suivant",
    quiz: "Passer le quiz",
  },
  zh: {
    stepLabel: (current, total) => `第 ${current} 步，共 ${total} 步`,
    next: "下一步",
    quiz: "参加测验",
  },
  hi: {
    stepLabel: (current, total) => `चरण ${current} / ${total}`,
    next: "अगला",
    quiz: "क्विज़ दें",
  },
  "pt-BR": {
    stepLabel: (current, total) => `Passo ${current} de ${total}`,
    next: "Próximo",
    quiz: "Fazer o quiz",
  },
  tr: {
    stepLabel: (current, total) => `Adım ${current} / ${total}`,
    next: "Sonraki",
    quiz: "Quize geç",
  },
};

function lesson(
  titles: Record<WrittenLocale, string>,
  steps: Record<WrittenLocale, StageLessonStep[]>,
  quizHref: string,
): StageLesson {
  return {
    quizHref,
    copy: Object.fromEntries(
      (Object.keys(chrome) as WrittenLocale[]).map((locale) => [
        locale,
        { ...chrome[locale], title: titles[locale], steps: steps[locale] },
      ]),
    ) as Record<WrittenLocale, StageLessonCopy>,
  };
}

export const stageLessons: Record<string, StageLesson> = {
  "saving-habit": lesson(
    { en: "Saving Habit", pl: "Nawyk oszczędzania", ja: "貯蓄の習慣",
    es: "Hábito de ahorro",
    fr: "Habitude d'épargne",
    zh: "储蓄习惯",
    hi: "बचत की आदत",
    "pt-BR": "Hábito de poupar",
    tr: "Birikim Alışkanlığı" },
    {
      en: [
  {
    "title": "Choose an affordable saving step",
    "body": "First reserve essential costs and required minimum debt payments until the next income arrives. Example: PLN 2,500 available, PLN 2,100 for essentials, PLN 300 for minimum payments leaves PLN 100. Choosing PLN 50 to save is optional, not a target for everyone. With irregular income, recheck cash flow after each payment. An automatic transfer can help only when its amount and timing fit your balance; adjust or pause it when needed. No surplus means no transfer, without blame. Action: check upcoming bills before choosing an amount."
  },
  {
    "title": "50/30/20 is a flexible guide",
    "body": "For PLN 4,000 monthly take-home income, an illustrative split is PLN 2,000 needs, PLN 1,200 wants, PLN 800 savings and extra debt repayment. In this example only, required minimum debt payments are included once in needs, not again in the 20% bucket. This is our budgeting convention, not a universal definition. If essentials and minimum payments need more than half, adjust wants and saving; do not skip bills to hit a percentage. Exercise: calculate your essential costs first and choose a realistic split."
  },
  {
    "title": "Compare deposit account conditions",
    "body": "A savings account is a deposit account, not a stock investment. A higher advertised rate alone does not show the outcome. Compare how long it applies, qualifying conditions, amount limits, fees and access to withdrawals. Check the institution and applicable deposit guarantee scheme, including BFG coverage where relevant; protection has limits and exclusions. Interest does not guarantee that your purchasing power keeps pace with inflation. Action: read the current terms before choosing an account. This lesson recommends no provider or current rate."
  },
  {
    "title": "DCA: equal amounts, different unit counts",
    "body": "DCA means investing the same amount at regular intervals, without choosing dates based on price forecasts. Example: PLN 100 at PLN 10 per unit buys 10 units; PLN 100 at PLN 20 buys 5. You have 15 units after investing PLN 200. If their price falls to PLN 8, they are worth PLN 120: a PLN 80 loss, ignoring fees and taxes. DCA does not guarantee profit or the best buying time. Money needed soon should not rely on volatile investments. Exercise: explain why equal amounts buy different unit counts."
  }
],
      pl: [
  {
    "title": "Wybierz dostępną kwotę oszczędności",
    "body": "Najpierw zabezpiecz podstawowe koszty i wymagane minimalne spłaty długu do kolejnego wpływu. Przykład: dostępne 2 500 zł, potrzeby 2 100 zł i minimalne spłaty 300 zł pozostawiają 100 zł. Odłożenie 50 zł jest opcjonalne, nie jest celem dla każdego. Przy nieregularnym dochodzie sprawdzaj przepływy po każdym wpływie. Automatyczny przelew może pomóc tylko wtedy, gdy kwota i termin pasują do salda; zmień go lub wstrzymaj w razie potrzeby. Bez nadwyżki nie rób przelewu, bez poczucia winy. Działanie: sprawdź przyszłe rachunki przed wyborem kwoty."
  },
  {
    "title": "50/30/20 to elastyczna wskazówka",
    "body": "Przy miesięcznym dochodzie 4 000 zł na rękę przykładowy podział to 2 000 zł na potrzeby, 1 200 zł na zachcianki i 800 zł na oszczędności oraz dodatkowe spłaty długu. Tylko w tym przykładzie wymagane minimalne spłaty liczymy raz w potrzebach, nie ponownie w części 20%. To nasza konwencja budżetowa, nie uniwersalna definicja. Jeśli potrzeby i minimalne spłaty wymagają ponad połowy, dostosuj zachcianki i oszczędności; nie pomijaj rachunków dla osiągnięcia procentu. Ćwiczenie: najpierw policz podstawowe koszty i wybierz realny podział."
  },
  {
    "title": "Porównuj warunki kont depozytowych",
    "body": "Konto oszczędnościowe jest kontem depozytowym, nie inwestycją w akcje. Sama wyższa reklamowana stawka nie opisuje wyniku. Porównaj czas jej obowiązywania, warunki, limity kwot, opłaty i dostęp do wypłat. Sprawdź instytucję i właściwy system gwarantowania depozytów, w tym ochronę BFG, jeśli ma zastosowanie; ochrona ma limity i wyłączenia. Odsetki nie gwarantują utrzymania siły nabywczej przy inflacji. Działanie: przed wyborem konta przeczytaj aktualne warunki. Lekcja nie poleca dostawcy ani bieżącej stawki."
  },
  {
    "title": "DCA: równe kwoty, różne liczby jednostek",
    "body": "DCA oznacza inwestowanie tej samej kwoty w regularnych odstępach, bez wybierania dat na podstawie prognoz cen. Przykład: 100 zł przy cenie 10 zł za jednostkę kupuje 10 jednostek; 100 zł przy cenie 20 zł kupuje 5. Masz 15 jednostek po wpłatach 200 zł. Jeśli cena spadnie do 8 zł, są warte 120 zł: strata 80 zł, bez opłat i podatków. DCA nie gwarantuje zysku ani najlepszego momentu zakupu. Pieniądze potrzebne wkrótce nie powinny zależeć od zmiennych inwestycji. Ćwiczenie: wyjaśnij, dlaczego równe kwoty kupują różne liczby jednostek."
  }
],
      ja: [
        {
          title: "給料日に貯める",
          body: "いちばん強い習慣は、給料が入ったらすぐ定額を移すことです。残りを貯めようと待つと、たいてい何も残りません。使う前に移します。その月の残りは、残ったお金で回します。",
        },
        {
          title: "50/30/20のルール",
          body: "50/30/20は、手取りを必要、欲しいもの、貯金に分ける目安です。およそ半分は家賃や食費などの必要です。およそ30%は欲しいものに使います。およそ20%は貯金と借金の返済です。",
        },
        {
          title: "高金利の貯金口座",
          body: "高金利の貯金口座は、普通の口座よりずっと高い利息を払います。それでも株ではなく、貯金口座です。利息が多いぶん、現金が少し追いつきやすくなります。すぐ使うかもしれないお金の置き場です。",
        },
        {
          title: "ドルコスト平均法",
          body: "ドルコスト平均法は、値段に関係なく、決めた額を決めた間隔で投資することです。安いときは多く、高いときは少なく買います。完璧な日を待ちません。習慣が当てずっぽうを減らします。",
        },
      ],
      es: [
        {
          title: "Ahorra el día de cobro",
          body: "El hábito más sólido es una transferencia fija justo después de cobrar. Esperar a ahorrar lo que sobre suele dejar nada. La transferencia ocurre antes de que empiece el gasto. El resto del mes funciona con lo que queda.",
        },
        {
          title: "La regla 50/30/20",
          body: "La regla 50/30/20 divide el sueldo neto en necesidades, deseos y ahorro. Aproximadamente la mitad cubre necesidades como el alquiler y la comida. Alrededor del 30% cubre deseos. Alrededor del 20% va al ahorro y a reducir deudas.",
        },
        {
          title: "Una cuenta de ahorro de alto rendimiento",
          body: "Una cuenta de ahorro de alto rendimiento paga mucho más interés que una cuenta estándar. Sigue siendo una cuenta de ahorro, no una inversión en bolsa. El interés extra ayuda a que el efectivo aguante un poco mejor. Es un lugar para el dinero que quizá necesites pronto.",
        },
        {
          title: "Inversión periódica constante",
          body: "Invertir de forma periódica significa aportar una cantidad fija con una frecuencia regular, sea cual sea el precio. Compras más cuando los precios están bajos y menos cuando están altos. No esperas al día perfecto. El hábito elimina las conjeturas.",
        },
      ],
      fr: [
        {
          title: "Épargner le jour de la paie",
          body: "L'habitude la plus solide est un virement fixe juste après la paie. Attendre d'épargner ce qui reste ne laisse généralement rien. Le virement a lieu avant que les dépenses ne commencent. Le reste du mois fonctionne avec ce qui reste.",
        },
        {
          title: "La règle 50/30/20",
          body: "La règle 50/30/20 répartit le salaire net entre besoins, envies et épargne. Environ la moitié couvre les besoins comme le loyer et la nourriture. Environ 30 % couvrent les envies. Environ 20 % vont à l'épargne et au remboursement des dettes.",
        },
        {
          title: "Un compte d'épargne à haut rendement",
          body: "Un compte d'épargne à haut rendement rapporte bien plus d'intérêts qu'un compte classique. Cela reste un compte d'épargne, pas un placement en actions. Les intérêts supplémentaires aident vos liquidités à mieux tenir. C'est un endroit pour l'argent dont vous pourriez avoir besoin bientôt.",
        },
        {
          title: "L'investissement programmé",
          body: "L'investissement programmé consiste à investir un montant fixe à intervalles réguliers, quel que soit le prix. Vous achetez plus quand les prix sont bas et moins quand ils sont hauts. Vous n'attendez pas le jour parfait. L'habitude supprime les devinettes.",
        },
      ],
      zh: [
        {
          title: "发薪日就存钱",
          body: "最牢固的习惯是发薪后立即进行固定转账。等着存剩下的钱，通常什么都剩不下。转账发生在消费开始之前。这个月剩下的日子就用余下的钱过。",
        },
        {
          title: "50/30/20 法则",
          body: "50/30/20 法则把到手收入分成必需、想要和储蓄。大约一半用于房租和食物等必需开支。大约 30% 用于想要的东西。大约 20% 用于储蓄和偿还债务。",
        },
        {
          title: "高收益储蓄账户",
          body: "高收益储蓄账户的利息远高于普通账户。它仍然是储蓄账户，不是股票投资。多出来的利息能让现金更好地跟上物价。它适合存放你近期可能要用的钱。",
        },
        {
          title: "定期定额投资",
          body: "定期定额投资是指无论价格如何，都按固定周期投入固定金额。价格低时买得多，价格高时买得少。你不用等待完美的一天。这个习惯省去了猜测。",
        },
      ],
      hi: [
        {
          title: "वेतन के दिन बचत करें",
          body: "सबसे मज़बूत आदत है वेतन मिलते ही एक तय ट्रांसफ़र। जो बचेगा उसे बचाने का इंतज़ार करने पर अक्सर कुछ नहीं बचता। ट्रांसफ़र खर्च शुरू होने से पहले हो जाता है। महीने का बाकी हिस्सा बची हुई रकम से चलता है।",
        },
        {
          title: "50/30/20 नियम",
          body: "50/30/20 नियम हाथ में आने वाली आय को ज़रूरतों, चाहतों और बचत में बांटता है। लगभग आधा किराये और खाने जैसी ज़रूरतों पर जाता है। लगभग 30% चाहतों पर। लगभग 20% बचत और कर्ज़ चुकाने में जाता है।",
        },
        {
          title: "ज़्यादा ब्याज वाला बचत खाता",
          body: "ज़्यादा ब्याज वाला बचत खाता सामान्य खाते से काफ़ी अधिक ब्याज देता है। यह फिर भी बचत खाता है, शेयरों में निवेश नहीं। अतिरिक्त ब्याज नकदी को कीमतों के साथ थोड़ा बेहतर चलने में मदद करता है। यह उस पैसे की जगह है जिसकी आपको जल्द ज़रूरत पड़ सकती है।",
        },
        {
          title: "नियमित निवेश (SIP)",
          body: "नियमित निवेश का मतलब है कीमत चाहे जो हो, तय अंतराल पर तय रकम निवेश करना। कीमतें कम होने पर आप ज़्यादा और ऊंची होने पर कम खरीदते हैं। आप किसी सही दिन का इंतज़ार नहीं करते। यह आदत अंदाज़ा लगाने की ज़रूरत खत्म कर देती है।",
        },
      ],
      "pt-BR": [
        {
          title: "Poupe no dia do pagamento",
          body: "O hábito mais forte é uma transferência fixa logo depois de receber. Esperar para poupar o que sobrar costuma não deixar nada. A transferência acontece antes de os gastos começarem. O resto do mês funciona com o que fica.",
        },
        {
          title: "A regra 50/30/20",
          body: "A regra 50/30/20 divide a renda líquida em necessidades, desejos e poupança. Cerca de metade cobre necessidades como aluguel e comida. Cerca de 30% cobre desejos. Cerca de 20% vai para a poupança e para quitar dívidas.",
        },
        {
          title: "Uma conta que rende mais",
          body: "Uma conta de alta rentabilidade paga bem mais juros do que uma conta comum. Ainda é uma conta de reserva, não um investimento em ações. Os juros extras ajudam o dinheiro a acompanhar um pouco melhor os preços. É um lugar para o dinheiro de que você pode precisar em breve.",
        },
        {
          title: "Aportes regulares",
          body: "Fazer aportes regulares é investir um valor fixo em intervalos regulares, seja qual for o preço. Você compra mais quando os preços estão baixos e menos quando estão altos. Você não espera o dia perfeito. O hábito elimina a adivinhação.",
        },
      ],
      tr: [
        {
          title: "Maaş gününde biriktir",
          body: "En güçlü alışkanlık, maaşını aldıktan hemen sonra yapılan sabit bir transferdir. Kalanı biriktirmeyi beklemek genellikle geriye bir şey bırakmaz. Transfer, harcama başlamadan önce gerçekleşir. Ayın geri kalanı kalan parayla döner.",
        },
        {
          title: "50/30/20 kuralı",
          body: "50/30/20 kuralı net geliri ihtiyaçlar, istekler ve birikim olarak böler. Yaklaşık yarısı kira ve yemek gibi ihtiyaçları karşılar. Yaklaşık %30'u isteklere gider. Yaklaşık %20'si birikime ve borç ödemeye ayrılır.",
        },
        {
          title: "Yüksek getirili birikim hesabı",
          body: "Yüksek getirili birikim hesabı, standart hesaptan çok daha fazla faiz öder. Yine de bir birikim hesabıdır, hisse senedi yatırımı değildir. Ek faiz, nakdin fiyatlara biraz daha iyi yetişmesine yardım eder. Yakında ihtiyaç duyabileceğin para için bir yerdir.",
        },
        {
          title: "Düzenli yatırım",
          body: "Düzenli yatırım, fiyat ne olursa olsun belirli aralıklarla sabit bir tutar yatırmaktır. Fiyatlar düşükken daha çok, yüksekken daha az alırsın. Mükemmel günü beklemezsin. Alışkanlık, tahmin yürütmeyi ortadan kaldırır.",
        },
      ],
    },
    "/quiz?topic=saving",
  ),
  inflation: lesson(
    { en: "Inflation and Purchasing Power", pl: "Inflacja i siła nabywcza", ja: "インフレと購買力",
    es: "Inflación y poder adquisitivo",
    fr: "Inflation et pouvoir d'achat",
    zh: "通胀与购买力",
    hi: "महंगाई और क्रय शक्ति",
    "pt-BR": "Inflação e poder de compra",
    tr: "Enflasyon ve Alım Gücü" },
    {
      en: [
        {
          "title": "Basket prices, not one price",
          "body": "Inflation is a broad increase in prices of a weighted basket of goods and services, not every individual price rise. Some prices can fall, and each household's basket differs. Example: the same hypothetical basket costs PLN 1,000, then PLN 1,050 — a 5% rise; the same cash buys less of that basket. Try: does one dearer item prove general inflation? No. Action: optionally compare two prices for the same products. After a break, return to one comparison; no catching up is needed."
        },
        {
          "title": "More nominal cash, less real value",
          "body": "Nominal change concerns the PLN balance; real change accounts for prices. One-year example with no deposits, withdrawals, fees or taxes: a hypothetical 2% turns PLN 1,000 into PLN 1,020. At 5% inflation, value in the example's starting prices is 1,020 ÷ 1.05 ≈ PLN 971.43. Real return: (1.02 ÷ 1.05 − 1) × 100% ≈ −2.86%. Subtracting 2% − 5% gives only the approximation −3%. Try: which grew — the balance or purchasing power? The balance. Action: distinguish both values in the example. After a break, repeat one division, without pressure."
        },
        {
          "title": "Rule of 72 is an estimate",
          "body": "Rule of 72 estimates time to double nominal capital: 72 ÷ a positive annual rate in percent. Example: at a hypothetical fixed 6%, annual compounding and reinvestment, with no deposits or withdrawals, 72 ÷ 6 ≈ 12 years. We omit fees, taxes and inflation in this nominal example. This is an estimate, not an offer or guarantee; changing rates or losses alter the result. Try: estimate time at an assumed 8% — about 9 years. Action: add the assumptions to your calculation. After a break, return to 72 ÷ 6 alone; you do not have to invest."
        },
        {
          "title": "Assess risk, not a promise",
          "body": "No single investment guarantees beating inflation. Check possible loss, costs and access to money; diversification does not remove all risk. Example without fees or taxes: a hypothetical PLN 1,000 value falls to PLN 900 — a PLN 100 loss, or 10%. Try: does a long period or a good past result guarantee profit? No. Action: protect essential spending and required minimum repayments; with irregular income, you can postpone investing. After a break, return to one risk question. This step does not require a purchase."
        }
      ],
      pl: [
        {
          "title": "Ceny koszyka, nie jedna cena",
          "body": "Inflacja to ogólny wzrost cen ważonego koszyka towarów i usług, nie każda pojedyncza podwyżka. Niektóre ceny mogą spadać, a koszyk każdego gospodarstwa jest inny. Przykład: ten sam hipotetyczny koszyk kosztuje 1 000 zł, potem 1 050 zł — wzrost o 5%; ta sama gotówka kupuje mniej tego koszyka. Ćwiczenie: czy jedna droższa rzecz dowodzi ogólnej inflacji? Nie. Działanie: opcjonalnie porównaj dwie ceny tych samych produktów. Po przerwie wróć do jednego porównania; nie trzeba nadrabiać."
        },
        {
          "title": "Nominalnie więcej, realnie mniej",
          "body": "Nominalna zmiana dotyczy salda w złotych; realna uwzględnia ceny. Przykład na jeden rok, bez dopłat, wypłat, opłat i podatków: hipotetyczne 2% zmienia 1 000 zł w 1 020 zł. Przy inflacji 5% wartość w cenach początku przykładu to 1 020 ÷ 1,05 ≈ 971,43 zł. Realna stopa: (1,02 ÷ 1,05 − 1) × 100% ≈ −2,86%. Odejmowanie 2% − 5% daje tylko przybliżenie −3%. Ćwiczenie: co wzrosło — saldo czy siła nabywcza? Saldo. Działanie: odróżnij obie wartości w przykładzie. Po przerwie powtórz jedno dzielenie, bez presji."
        },
        {
          "title": "Reguła 72 jest przybliżeniem",
          "body": "Reguła 72 szacuje czas nominalnego podwojenia kapitału: 72 ÷ dodatnia roczna stopa w procentach. Przykład: przy hipotetycznych stałych 6%, rocznej kapitalizacji i reinwestowaniu, bez dopłat i wypłat, 72 ÷ 6 ≈ 12 lat. Pomijamy opłaty, podatki i inflację w tym nominalnym przykładzie. To przybliżenie, nie oferta ani gwarancja; zmienne stopy lub straty zmieniają wynik. Ćwiczenie: oszacuj czas przy założonych 8% — około 9 lat. Działanie: dopisz założenia do obliczenia. Po przerwie wróć do samego 72 ÷ 6; nie musisz inwestować."
        },
        {
          "title": "Oceń ryzyko, nie obietnicę",
          "body": "Nie ma jednej inwestycji gwarantującej pokonanie inflacji. Sprawdź możliwość straty, koszty i dostęp do pieniędzy; dywersyfikacja nie usuwa całego ryzyka. Przykład bez opłat i podatków: hipotetyczna wartość 1 000 zł spada do 900 zł — strata 100 zł, czyli 10%. Ćwiczenie: czy długi czas lub dobry wynik z przeszłości gwarantują zysk? Nie. Działanie: chroń niezbędne wydatki i wymagane minimalne spłaty; przy nieregularnym dochodzie możesz odłożyć inwestowanie. Po przerwie wróć do jednego pytania o ryzyko. Ten krok nie wymaga zakupu."
        }
      ],
      ja: [
        {
          title: "インフレとは",
          body: "インフレは、お金が時間とともに少なく買えることです。同じ金額で買える食料は減り、同じ家賃は高くなります。値段が上がるのがいつもの兆しです。置いたままの現金は購買力を失います。",
        },
        {
          title: "実質リターン",
          body: "実質リターンは、受け取った利息からインフレを引いたものです。インフレが5%で銀行が2%なら、実質はおよそ−3%です。残高は増えても、買える量は減ることがあります。口座の利率だけでは足りません。",
        },
        {
          title: "72の法則",
          body: "72の法則は、お金が2倍になる年数の目安です。72を年ごとのリターンで割ります。年8%ならおよそ9年で2倍です。年6%ならおよそ12年です。",
        },
        {
          title: "長い目での備え",
          body: "備えとは、値段より速く増えてきたものです。広い株の指数ファンドは、長い年数でそうでした。布団の下の現金や利率1%の貯金は違います。狙いは長い期間であり、短い賭けではありません。",
        },
      ],
      es: [
        {
          title: "Qué significa la inflación",
          body: "La inflación significa que el dinero compra menos con el tiempo. La misma cantidad alcanza para menos compra, o el mismo alquiler cuesta más. La subida de precios es la señal habitual. El efectivo parado pierde poder adquisitivo.",
        },
        {
          title: "Rentabilidad real",
          body: "La rentabilidad real es el interés que ganas menos la inflación. Si la inflación es del 5% y el banco paga el 2%, la rentabilidad real es de aproximadamente −3%. El saldo puede subir mientras su poder de compra baja. El tipo de la cuenta no lo cuenta todo.",
        },
        {
          title: "La regla del 72",
          body: "La regla del 72 estima cuánto tarda el dinero en duplicarse. Divide 72 entre la rentabilidad anual. Al 8% anual, el dinero se duplica en unos 9 años. Al 6%, tarda unos 12 años.",
        },
        {
          title: "Una cobertura a largo plazo",
          body: "Una cobertura es algo que ha tendido a crecer más rápido que los precios. Los fondos indexados amplios de renta variable lo han hecho durante muchos años. El efectivo bajo el colchón y una cuenta de ahorro al 1% no. La clave es un horizonte largo, no una apuesta rápida.",
        },
      ],
      fr: [
        {
          title: "Ce que signifie l'inflation",
          body: "L'inflation signifie que l'argent achète moins avec le temps. La même somme couvre moins de courses, ou le même loyer coûte plus cher. La hausse des prix en est le signe habituel. L'argent qui dort perd du pouvoir d'achat.",
        },
        {
          title: "Rendement réel",
          body: "Le rendement réel est l'intérêt gagné moins l'inflation. Si l'inflation est de 5 % et que la banque verse 2 %, le rendement réel est d'environ −3 %. Le solde peut augmenter alors que son pouvoir d'achat diminue. Le taux du compte ne dit pas tout.",
        },
        {
          title: "La règle des 72",
          body: "La règle des 72 estime le temps nécessaire pour doubler une somme. Divisez 72 par le rendement annuel. À 8 % par an, l'argent double en environ 9 ans. À 6 %, il faut environ 12 ans.",
        },
        {
          title: "Une couverture à long terme",
          body: "Une couverture est un actif qui a eu tendance à croître plus vite que les prix. Les fonds indiciels actions diversifiés l'ont fait sur de nombreuses années. L'argent sous le matelas et un livret à 1 % ne l'ont pas fait. L'idée est un horizon long, pas un pari rapide.",
        },
      ],
      zh: [
        {
          title: "通胀意味着什么",
          body: "通胀意味着钱随着时间能买到的东西变少。同样的金额买到的日用品更少，或者同样的房租变得更贵。物价上涨是常见的信号。放着不动的现金会失去购买力。",
        },
        {
          title: "实际回报",
          body: "实际回报是你赚到的利息减去通胀。如果通胀是 5%，银行付 2%，实际回报大约是 −3%。余额可以上涨，而购买力却在下降。账户利率并不是全部。",
        },
        {
          title: "72 法则",
          body: "72 法则用来估算钱翻倍需要多长时间。用 72 除以年回报率。年回报 8% 时，钱大约 9 年翻倍。6% 时大约需要 12 年。",
        },
        {
          title: "长期对冲",
          body: "对冲是指那些增长往往快于物价的东西。宽基股票指数基金在很多年里做到了这一点。床垫下的现金和 1% 的储蓄账户则没有。关键是长期持有，而不是快速下注。",
        },
      ],
      hi: [
        {
          title: "महंगाई का मतलब",
          body: "महंगाई का मतलब है कि समय के साथ पैसा कम चीज़ें खरीद पाता है। उतनी ही रकम में कम राशन आता है, या वही किराया महंगा हो जाता है। बढ़ती कीमतें इसका आम संकेत हैं। पड़ी हुई नकदी क्रय शक्ति खोती है।",
        },
        {
          title: "असली रिटर्न",
          body: "असली रिटर्न वह ब्याज है जो आप कमाते हैं, उसमें से महंगाई घटाकर। अगर महंगाई 5% है और बैंक 2% देता है, तो असली रिटर्न लगभग −3% है। बैलेंस बढ़ सकता है जबकि उसकी खरीदने की ताकत घटती है। खाते की ब्याज दर पूरी कहानी नहीं है।",
        },
        {
          title: "72 का नियम",
          body: "72 का नियम अंदाज़ा देता है कि पैसा दोगुना होने में कितना समय लगेगा। 72 को सालाना रिटर्न से भाग दें। सालाना 8% पर पैसा लगभग 9 साल में दोगुना होता है। 6% पर लगभग 12 साल लगते हैं।",
        },
        {
          title: "लंबी अवधि का बचाव",
          body: "बचाव वह चीज़ है जो कीमतों से तेज़ बढ़ती रही है। व्यापक शेयर इंडेक्स फंडों ने कई सालों में ऐसा किया है। गद्दे के नीचे रखी नकदी और 1% वाला बचत खाता ऐसा नहीं कर पाए। बात लंबी अवधि की है, जल्दी के दांव की नहीं।",
        },
      ],
      "pt-BR": [
        {
          title: "O que significa inflação",
          body: "Inflação significa que o dinheiro compra menos com o tempo. O mesmo valor paga menos compras, ou o mesmo aluguel custa mais. A alta dos preços é o sinal mais comum. Dinheiro parado perde poder de compra.",
        },
        {
          title: "Retorno real",
          body: "Retorno real é o juro que você ganha menos a inflação. Se a inflação é de 5% e o banco paga 2%, o retorno real é de cerca de −3%. O saldo pode subir enquanto o poder de compra cai. A taxa da conta não conta a história toda.",
        },
        {
          title: "A regra do 72",
          body: "A regra do 72 estima quanto tempo o dinheiro leva para dobrar. Divida 72 pelo retorno anual. A 8% ao ano, o dinheiro dobra em cerca de 9 anos. A 6%, leva cerca de 12 anos.",
        },
        {
          title: "Uma proteção de longo prazo",
          body: "Uma proteção é algo que tende a crescer mais rápido do que os preços. Fundos de índice amplos de ações fizeram isso ao longo de muitos anos. Dinheiro debaixo do colchão e uma conta que rende 1% não fizeram. O ponto é um horizonte longo, não uma aposta rápida.",
        },
      ],
      tr: [
        {
          title: "Enflasyon ne demek",
          body: "Enflasyon, paranın zamanla daha az şey satın alması demektir. Aynı tutar daha az markete yeter ya da aynı kira daha pahalı olur. Yükselen fiyatlar bunun olağan işaretidir. Yerinde duran nakit alım gücü kaybeder.",
        },
        {
          title: "Reel getiri",
          body: "Reel getiri, kazandığın faizden enflasyonun çıkarılmasıdır. Enflasyon %5 ve banka %2 veriyorsa reel getiri yaklaşık −%3'tür. Bakiye artarken alım gücü düşebilir. Hesaptaki oran hikâyenin tamamı değildir.",
        },
        {
          title: "72 kuralı",
          body: "72 kuralı, paranın ikiye katlanmasının ne kadar süreceğini tahmin eder. 72'yi yıllık getiriye böl. Yılda %8 ile para yaklaşık 9 yılda ikiye katlanır. %6 ile yaklaşık 12 yıl sürer.",
        },
        {
          title: "Uzun vadeli bir korunma",
          body: "Korunma, fiyatlardan daha hızlı büyüme eğiliminde olmuş bir şeydir. Geniş hisse senedi endeks fonları uzun yıllar boyunca bunu yaptı. Yastık altındaki nakit ve %1 faizli birikim hesabı yapmadı. Önemli olan hızlı bir bahis değil, uzun bir vadedir.",
        },
      ],
    },
    "/quiz?topic=inflation",
  ),
  "credit-rates": lesson(
    { en: "Credit, Interest and Rates", pl: "Kredyt, odsetki i stopy", ja: "信用、金利、利率",
    es: "Crédito, intereses y tipos",
    fr: "Crédit, intérêts et taux",
    zh: "信贷、利息与利率",
    hi: "क्रेडिट, ब्याज और दरें",
    "pt-BR": "Crédito, juros e taxas",
    tr: "Kredi, Faiz ve Oranlar" },
    {
      en: [
        {
          "title": "The contract sets the rate reset",
          "body": "A variable rate may use a reference rate and margin; the contract sets the reset date, not just the day of a central-bank decision. A rate can be fixed or periodically fixed. Check how long the agreed rate applies and the contractual terms after that period; it does not freeze every fee. Hypothetical example: a 3% reference rate + a 2 percentage-point margin = 5%; at the contractual reset, 4% + 2 points = 6%. On a constant PLN 1,000 principal, that is PLN 60 simple interest for one year, with no repayments, compounding or fees. Try: identify when the change applies. Action: optionally find the reset date in a sample contract. With irregular income, allow for a possible higher installment without taking new debt. After a break, return to one date."
        },
        {
          "title": "Avalanche after essentials and minimums",
          "body": "First protect essentials and all debts' required minimum payments. Avalanche directs only available extra money to the highest interest rate. Example: an optional PLN 100 remains; comparable debts of PLN 1,000 and PLN 500 have fixed annual rates of 20% and 10%, respectively, with no fees, penalties or arrears. Avalanche chooses 20%. Separate simple model: PLN 100 repaid at the start of a year, each balance at least PLN 100, no later cash flows or compounding — PLN 20 versus PLN 10 less interest. This is not a full schedule or guarantee. Try: may this replace another debt's minimum? No. Action: optionally compare rates and prepayment terms. With irregular income and no surplus, no extra payment is required. After a break, return to one payment date."
        },
        {
          "title": "Repayment history is not full capacity",
          "body": "In Poland, timely repayment history matters for credit-risk assessment. BIK scoring is not the same as repayment capacity: a lender also assesses income, expenses and other debts, then makes its own decision. This gives no approval promise or universal weight for one factor. Example: someone pays on time, but irregular income may not cover a new PLN 500 installment. Try: does timeliness guarantee a new loan? No. Action: optionally separate history from the budget in the example, without buying a report or taking new debt. Coachfi points are not a BIK score. After a break, return to one distinction."
        },
        {
          "title": "Sale price versus contractual redemption",
          "body": "For a tradable bond with fixed cash flows, a higher required market yield means a lower price, other factors unchanged. Example: in one year the contract provides PLN 1,000 principal + a PLN 100 coupon. Excluding fees, tax and default in the calculation: 1,100 ÷ 1.10 = PLN 1,000; at a required 20%: 1,100 ÷ 1.20 ≈ PLN 916.67. This compares the same one year to maturity; it is not a forecast. Try: did contractual principal fall? No, the sale price did. The issuer may fail to pay, and selling may be difficult. Action: optionally name those two risks. With irregular income, protect current essentials; no bond purchase is required. After a break, return to one cash flow."
        }
      ],
      pl: [
        {
          "title": "Stopa i termin zmiany w umowie",
          "body": "Zmienna stopa może wynikać ze wskaźnika i marży; termin aktualizacji określa umowa, nie sam dzień decyzji banku centralnego. Oprocentowanie może być stałe lub okresowo stałe. Sprawdź, jak długo obowiązuje uzgodniona stopa i jakie warunki umowy stosuje się po tym okresie; nie zamraża ona wszystkich opłat. Przykład hipotetyczny: wskaźnik 3% + marża 2 pkt proc. = 5%; przy umownej aktualizacji 4% + 2 pkt proc. = 6%. Dla stałego kapitału 1 000 zł to 60 zł prostych odsetek przez rok, bez spłat, kapitalizacji i opłat. Ćwiczenie: wskaż moment zmiany. Działanie: opcjonalnie znajdź termin aktualizacji w przykładowej umowie. Przy nieregularnym dochodzie uwzględnij możliwość wyższej raty, bez nowego kredytu. Po przerwie wróć do jednego terminu."
        },
        {
          "title": "Lawina dopiero po potrzebach i minimum",
          "body": "Najpierw zabezpiecz podstawowe potrzeby i wymagane minimalne spłaty wszystkich długów. Lawina kieruje dopiero dostępną nadwyżkę na najwyższe oprocentowanie. Przykład: zostaje opcjonalne 100 zł; porównywalne długi 1 000 zł i 500 zł mają odpowiednio stałe roczne 20% i 10%, bez opłat, kar i zaległości. Lawina wybiera 20%. Osobny prosty model: 100 zł spłacone na początku roku, każde saldo co najmniej 100 zł, bez dalszych przepływów i kapitalizacji — 20 zł wobec 10 zł mniej odsetek. To nie pełny harmonogram ani gwarancja. Ćwiczenie: czy wolno zastąpić minimum innego długu? Nie. Działanie: opcjonalnie porównaj stopy i warunki nadpłaty. Przy nieregularnym dochodzie i braku nadwyżki nie musisz nadpłacać. Po przerwie wróć do jednego terminu spłaty."
        },
        {
          "title": "Historia spłat to nie cała zdolność",
          "body": "W Polsce historia terminowych spłat jest istotna dla oceny ryzyka. Scoring BIK nie jest tym samym co zdolność kredytowa: bank ocenia też dochody, wydatki i inne zobowiązania oraz podejmuje własną decyzję. Nie ma tu obietnicy zgody ani uniwersalnej wagi jednego czynnika. Przykład: ktoś płaci na czas, ale nieregularne wpływy mogą nie wystarczać na nową ratę 500 zł. Ćwiczenie: czy terminowość gwarantuje nowy kredyt? Nie. Działanie: opcjonalnie odróżnij w przykładzie historię od budżetu, bez kupowania raportu lub nowego długu. Punkty Coachfi nie są oceną BIK. Po przerwie wróć do jednego rozróżnienia."
        },
        {
          "title": "Cena sprzedaży a umowny wykup",
          "body": "Dla zbywalnej obligacji o stałych przepływach wyższa wymagana rentowność rynkowa oznacza niższą cenę, przy innych czynnikach bez zmian. Przykład: za rok umowa przewiduje 1 000 zł nominału + 100 zł kuponu. Bez opłat, podatku i niewypłacalności w obliczeniu: 1 100 ÷ 1,10 = 1 000 zł; przy wymaganych 20%: 1 100 ÷ 1,20 ≈ 916,67 zł. To porównanie przy tym samym roku do wykupu, nie prognoza. Ćwiczenie: czy spadł umowny nominał? Nie, cena sprzedaży. Emitent może nie zapłacić, a sprzedaż może być trudna. Działanie: opcjonalnie nazwij te dwa ryzyka. Przy nieregularnym dochodzie chroń bieżące potrzeby; nie musisz kupować obligacji. Po przerwie wróć do jednego przepływu."
        }
      ],
      ja: [
        {
          title: "変動金利",
          body: "変動金利のローンは市場の利率に従います。中央銀行が利率を上げると、毎月の支払いはたいてい上がります。固定金利はそのままです。変動なら、利率が上がると請求も上がります。",
        },
        {
          title: "債務アバランチ",
          body: "債務アバランチは、利息がいちばん高い借金から先に返します。返す期間全体の利息が減ります。小さい残高から返す方が楽に感じても、たいてい高くつきます。古い借金を返すための新しい借金は、コストを消しません。",
        },
        {
          title: "信用スコアを動かすもの",
          body: "支払い履歴が信用スコアにいちばん効きます。期日どおりに払うことは、カードの枚数より重要です。収入が主な要因ではありません。期日を守った長い記録がいちばん強い合図です。",
        },
        {
          title: "債券価格と金利",
          body: "金利が上がると、債券の価格は下がります。古い債券は新しい債券より利息が少ないので、買い手は安くしか出しません。二つは逆に動きます。金利が上がっても、債券価格は元のままではありません。",
        },
      ],
      es: [
        {
          title: "Tipos variables",
          body: "Un préstamo a tipo variable sigue el tipo de mercado. Cuando el banco central sube los tipos, la cuota mensual suele subir. Un tipo fijo se mantiene. Con un préstamo variable, un tipo más alto significa una factura más alta.",
        },
        {
          title: "La avalancha de deudas",
          body: "El método avalancha paga primero la deuda con el interés más alto. Así se reducen los intereses pagados a lo largo de la vida de las deudas. Pagar primero el saldo más pequeño puede resultar más fácil, pero suele costar más. Un préstamo nuevo para pagar uno antiguo no elimina el coste.",
        },
        {
          title: "Qué mueve el historial crediticio",
          body: "El historial de pagos es lo que más influye en la puntuación crediticia. Pagar a tiempo importa más que cuántas tarjetas tengas. Los ingresos no son el factor principal. Un largo historial de pagos puntuales es la señal más fuerte.",
        },
        {
          title: "Precios de los bonos y tipos",
          body: "Los precios de los bonos bajan cuando suben los tipos de interés. Un bono antiguo paga menos que uno nuevo, así que los compradores ofrecen menos por él. Ambos se mueven en direcciones opuestas. Una subida de tipos no deja los precios de los bonos donde estaban.",
        },
      ],
      fr: [
        {
          title: "Taux variables",
          body: "Un prêt à taux variable suit le taux du marché. Quand la banque centrale relève ses taux, la mensualité augmente généralement. Un taux fixe ne bouge pas. Avec un prêt variable, un taux plus élevé signifie une facture plus élevée.",
        },
        {
          title: "La méthode avalanche",
          body: "La méthode avalanche rembourse d'abord la dette au taux le plus élevé. Cela réduit les intérêts payés sur la durée des dettes. Rembourser d'abord le plus petit solde peut sembler plus facile, mais coûte généralement plus cher. Un nouveau prêt pour rembourser l'ancien ne supprime pas le coût.",
        },
        {
          title: "Ce qui fait bouger la note de crédit",
          body: "L'historique de paiement a le plus d'effet sur une note de crédit. Payer à temps compte plus que le nombre de cartes détenues. Le revenu n'est pas le facteur principal. Un long historique de paiements ponctuels est le signal le plus fort.",
        },
        {
          title: "Prix des obligations et taux",
          body: "Les prix des obligations baissent quand les taux d'intérêt montent. Une obligation ancienne rapporte moins qu'une nouvelle, donc les acheteurs en offrent moins. Les deux évoluent en sens inverse. Une hausse des taux ne laisse pas les prix des obligations inchangés.",
        },
      ],
      zh: [
        {
          title: "浮动利率",
          body: "浮动利率贷款跟随市场利率。央行加息时，月供通常会上涨。固定利率则保持不变。对于浮动利率贷款，利率越高，账单越高。",
        },
        {
          title: "债务雪崩法",
          body: "债务雪崩法先偿还利率最高的债务。这能减少你在整个还款期内支付的利息。先还最小的欠款可能感觉更容易，但通常成本更高。借新贷还旧贷并不会消除成本。",
        },
        {
          title: "什么影响信用评分",
          body: "还款记录对信用评分的影响最大。按时还款比你持有多少张卡更重要。收入不是主要因素。长期的按时还款记录是最强的信号。",
        },
        {
          title: "债券价格与利率",
          body: "利率上升时，债券价格下跌。旧债券的收益低于新债券，所以买家出价更低。两者朝相反方向变动。加息不会让债券价格停在原地。",
        },
      ],
      hi: [
        {
          title: "फ़्लोटिंग दरें",
          body: "फ़्लोटिंग दर वाला लोन बाज़ार की दर के साथ चलता है। जब केंद्रीय बैंक दरें बढ़ाता है, तो मासिक किस्त आम तौर पर बढ़ जाती है। फ़िक्स्ड दर वहीं रहती है। फ़्लोटिंग लोन में ऊंची दर का मतलब है बड़ा बिल।",
        },
        {
          title: "डेट एवलांच तरीका",
          body: "डेट एवलांच तरीके में सबसे ज़्यादा ब्याज वाला कर्ज़ पहले चुकाया जाता है। इससे कर्ज़ों की पूरी अवधि में चुकाया जाने वाला ब्याज घटता है। सबसे छोटा बकाया पहले चुकाना आसान लग सकता है, पर आम तौर पर महंगा पड़ता है। पुराना लोन चुकाने के लिए नया लोन लेने से लागत खत्म नहीं होती।",
        },
        {
          title: "क्रेडिट स्कोर किससे बदलता है",
          body: "क्रेडिट स्कोर पर सबसे बड़ा असर भुगतान के इतिहास का होता है। समय पर भुगतान करना इस बात से ज़्यादा मायने रखता है कि आपके पास कितने कार्ड हैं। आय मुख्य कारक नहीं है। समय पर भुगतान का लंबा रिकॉर्ड सबसे मज़बूत संकेत है।",
        },
        {
          title: "बॉन्ड की कीमतें और दरें",
          body: "ब्याज दरें बढ़ने पर बॉन्ड की कीमतें गिरती हैं। पुराना बॉन्ड नए से कम देता है, इसलिए खरीदार उसके लिए कम कीमत लगाते हैं। दोनों उलटी दिशा में चलते हैं। दर बढ़ने पर बॉन्ड की कीमतें वहीं नहीं टिकतीं।",
        },
      ],
      "pt-BR": [
        {
          title: "Taxas variáveis",
          body: "Um empréstimo com taxa variável acompanha a taxa de mercado. Quando o banco central sobe os juros, a parcela mensal costuma subir. Uma taxa fixa não muda. Com um empréstimo variável, taxa maior significa conta maior.",
        },
        {
          title: "A avalanche de dívidas",
          body: "O método avalanche quita primeiro a dívida com os juros mais altos. Isso reduz os juros pagos ao longo da vida das dívidas. Quitar primeiro o menor saldo pode parecer mais fácil, mas costuma custar mais. Um empréstimo novo para pagar um antigo não elimina o custo.",
        },
        {
          title: "O que mexe com o score de crédito",
          body: "O histórico de pagamentos é o que mais pesa no score de crédito. Pagar em dia importa mais do que quantos cartões você tem. A renda não é o fator principal. Um longo histórico de pagamentos em dia é o sinal mais forte.",
        },
        {
          title: "Preços dos títulos e juros",
          body: "Os preços dos títulos caem quando os juros sobem. Um título antigo paga menos do que um novo, então os compradores oferecem menos por ele. Os dois se movem em direções opostas. Uma alta de juros não deixa os preços dos títulos onde estavam.",
        },
      ],
      tr: [
        {
          title: "Değişken faizler",
          body: "Değişken faizli kredi piyasa faizini izler. Merkez bankası faiz artırdığında aylık taksit genellikle yükselir. Sabit faiz yerinde kalır. Değişken kredide daha yüksek faiz, daha yüksek ödeme demektir.",
        },
        {
          title: "Borç çığı yöntemi",
          body: "Borç çığı yöntemi önce en yüksek faizli borcu öder. Bu, borçların ömrü boyunca ödediğin faizi azaltır. Önce en küçük bakiyeyi ödemek daha kolay gelebilir ama genellikle daha pahalıya gelir. Eski krediyi ödemek için alınan yeni kredi maliyeti ortadan kaldırmaz.",
        },
        {
          title: "Kredi notunu ne etkiler",
          body: "Kredi notu üzerinde en büyük etkiye ödeme geçmişi sahiptir. Zamanında ödemek, kaç kartın olduğundan daha önemlidir. Gelir ana etken değildir. Uzun süreli, zamanında ödeme geçmişi en güçlü sinyaldir.",
        },
        {
          title: "Tahvil fiyatları ve faizler",
          body: "Faizler yükseldiğinde tahvil fiyatları düşer. Eski bir tahvil yenisinden daha az getiri sağlar, bu yüzden alıcılar ona daha az teklif verir. İkisi ters yönde hareket eder. Faiz artışı tahvil fiyatlarını olduğu yerde bırakmaz.",
        },
      ],
    },
    "/quiz?topic=credit",
  ),
  "emergency-fund": lesson(
    { en: "Emergency Fund", pl: "Fundusz awaryjny", ja: "緊急資金",
    es: "Fondo de emergencia",
    fr: "Épargne de précaution",
    zh: "应急基金",
    hi: "आपातकालीन फंड",
    "pt-BR": "Reserva de emergência",
    tr: "Acil Durum Fonu" },
    {
      en: [
        {
          "title": "A goal that fits the situation",
          "body": "A reserve can help with unplanned costs or an income interruption, but does not remove every risk. The amount depends on needs, commitments and income uncertainty. A 3–6 month range can be an indicative choice, not a duty or guarantee. Example: we choose 3 months at PLN 2,000 of essential costs, already including required minimum repayments counted once. The goal is 3 × 2,000 = PLN 6,000, with constant costs and no interest or fees; this does not give a completion date. Try: what would a chosen 6 months mean? PLN 12,000. Action: optionally identify one number in the example without sharing personal data. With irregular income, the goal can change; no surplus means no required transfer. After a break, return to one multiplication."
        },
        {
          "title": "Access, costs and risk",
          "body": "A reserve should be accessible when needed, with limited volatility. Check withdrawal timing, fees and terms; lower risk does not mean no losses, costs or delays. Deposit protection depends on the institution and product; it does not automatically cover every investment. Example: a PLN 200 reserve, a PLN 150 unexpected cost and a hypothetical PLN 20 access fee leave PLN 30, if funds are available in time. Try: 200 − 150 − 20 = 30. Action: optionally check one condition in a sample description without buying or opening an account. With irregular income, protect current essentials and required minimums; shares may lose value just when money is needed. After a break, return to one access question."
        },
        {
          "title": "A small start is an option",
          "body": "One month of expenses is not a required first milestone. Choose a small achievable goal, then only available money after essentials and required minimum repayments. Example without fees: PLN 1,000 income, PLN 900 essentials and PLN 80 minimums leave PLN 20. You may optionally choose PLN 10 toward an illustrative PLN 50 goal, leaving the other PLN 10; this is not a duty or completion date. Try: what if income falls to PLN 980? Surplus is PLN 0, so transfer PLN 0. Action: optionally identify an amount in the example without making a transfer. With irregular income, check the amount and timing again; do not borrow to save. After using the reserve or taking a break, return to a small step without punishment or catching up."
        }
      ],
      pl: [
        {
          "title": "Cel dopasowany do sytuacji",
          "body": "Rezerwa pomaga przy nieplanowanych kosztach lub przerwie w dochodzie, lecz nie usuwa każdego ryzyka. Kwota zależy od potrzeb, zobowiązań i niepewności dochodów. Zakres 3–6 miesięcy można wybrać orientacyjnie; nie jest obowiązkiem ani gwarancją. Przykład: wybieramy 3 miesiące po 2 000 zł niezbędnych kosztów, już z wymaganymi minimalnymi spłatami liczonymi raz. Cel to 3 × 2 000 = 6 000 zł, przy stałych kosztach, bez odsetek i opłat; to nie termin zebrania kwoty. Ćwiczenie: ile dałby wybrany cel 6 miesięcy? 12 000 zł. Działanie: opcjonalnie wskaż jedną liczbę w przykładzie, bez podawania swoich danych. Przy nieregularnym dochodzie cel można zmieniać; bez nadwyżki nie ma obowiązku przelewu. Po przerwie wróć do jednego mnożenia."
        },
        {
          "title": "Dostępność, koszty i ryzyko",
          "body": "Rezerwa ma być dostępna, gdy jej potrzebujesz, z ograniczoną zmiennością. Sprawdź czas wypłaty, opłaty i warunki; niskie ryzyko nie oznacza braku strat, kosztów lub opóźnień. Ochrona depozytu zależy od podmiotu i produktu; nie obejmuje automatycznie każdej inwestycji. Przykład: masz 200 zł rezerwy, nagły koszt 150 zł i hipotetyczną opłatę dostępu 20 zł — zostaje 30 zł, jeśli środki są dostępne na czas. Ćwiczenie: 200 − 150 − 20 = 30. Działanie: opcjonalnie sprawdź jeden warunek w przykładowym opisie, bez zakupu lub otwierania konta. Przy nieregularnym dochodzie chroń bieżące potrzeby i wymagane minima; akcje mogą stracić wartość w chwili potrzeby. Po przerwie wróć do pytania o dostęp."
        },
        {
          "title": "Mały początek jest opcją",
          "body": "Nie trzeba zaczynać od miesiąca wydatków. Wybierz mały osiągalny cel i dopiero dostępną kwotę po potrzebach oraz wymaganych minimalnych spłatach. Przykład bez opłat: wpływ 1 000 zł, potrzeby 900 zł i minima 80 zł dają 20 zł nadwyżki. Możesz dobrowolnie wybrać 10 zł na przykładowy cel 50 zł, zostawiając pozostałe 10 zł; nie jest to obowiązek ani termin ukończenia. Ćwiczenie: co jeśli wpływ spadnie do 980 zł? Nadwyżka to 0 zł, więc przelew 0 zł. Działanie: opcjonalnie wskaż kwotę w przykładzie, bez wykonywania przelewu. Przy nieregularnym dochodzie sprawdź kwotę i termin od nowa; nie pożyczaj, żeby oszczędzać. Po wykorzystaniu rezerwy lub przerwie wróć do małego kroku, bez kary i nadrabiania."
        }
      ],
      ja: [
        {
          title: "いくら持つか",
          body: "緊急資金は、およそ3か月から6か月分の支出をカバーします。失業、修理、医療費のためです。1週間は始まりにすぎません。10年分の支出を置くためのものではありません。",
        },
        {
          title: "中身の条件",
          body: "良い緊急資金はすぐ取り出せて、毎日の支出とは別に置きます。数か月分の支出をカバーします。高リスクの株に置くものではありません。仕事は、必要なときにそこにあることで、できるだけ速く増やすことではありません。",
        },
        {
          title: "最初の目標",
          body: "3か月から6か月が大きく感じるなら、まず必要な支出の1か月分から始めます。それで多くのよくあるショックを賄えます。そのあと次の月を足します。実際の請求を無視した丸い金額は、最初の目標として弱いです。",
        },
      ],
      es: [
        {
          title: "Cuánto tener",
          body: "Un fondo de emergencia cubre entre 3 y 6 meses de gastos. Es para la pérdida del empleo, una reparación o una factura médica. Una semana es solo el comienzo. El fondo no está pensado para guardar diez años de gastos.",
        },
        {
          title: "Qué debe contener",
          body: "Un buen fondo de emergencia es fácil de alcanzar y está separado del gasto diario. Debe cubrir unos meses de gastos. No debería estar en acciones de alto riesgo. Su función es estar ahí cuando lo necesites, no crecer lo más rápido posible.",
        },
        {
          title: "El primer hito",
          body: "Si 3 a 6 meses te parece demasiado, empieza por un mes de gastos esenciales. Eso cubre muchos imprevistos habituales. Después añade el mes siguiente. Una cifra redonda que ignore tus facturas reales es un primer objetivo más débil.",
        },
      ],
      fr: [
        {
          title: "Combien garder",
          body: "Une épargne de précaution couvre environ 3 à 6 mois de dépenses. Elle sert en cas de perte d'emploi, de réparation ou de facture médicale. Une semaine n'est qu'un début. Elle n'est pas faite pour contenir dix ans de dépenses.",
        },
        {
          title: "Ce qu'elle doit contenir",
          body: "Une bonne épargne de précaution est facile d'accès et séparée des dépenses courantes. Elle doit couvrir quelques mois de dépenses. Elle ne doit pas être placée en actions à haut risque. Son rôle est d'être là quand vous en avez besoin, pas de croître le plus vite possible.",
        },
        {
          title: "Le premier palier",
          body: "Si 3 à 6 mois vous paraît trop, commencez par un mois de dépenses essentielles. Cela couvre de nombreux imprévus courants. Ajoutez ensuite le mois suivant. Un chiffre rond qui ignore vos vraies factures est un premier objectif plus fragile.",
        },
      ],
      zh: [
        {
          title: "该准备多少",
          body: "应急基金大约覆盖 3 到 6 个月的开支。它用于应对失业、维修或医疗账单。一周的量只是起步。这笔基金并不需要存下十年的开支。",
        },
        {
          title: "里面该放什么",
          body: "好的应急基金容易取用，并与日常开销分开存放。它应能覆盖几个月的开支。它不应放在高风险股票里。它的任务是在你需要时就在那里，而不是尽可能快地增长。",
        },
        {
          title: "第一个里程碑",
          body: "如果 3 到 6 个月感觉太多，就从一个月的必要开支开始。这能应对许多常见的冲击。之后再加上下一个月。一个忽略你实际账单的整数，是较弱的第一个目标。",
        },
      ],
      hi: [
        {
          title: "कितना रखें",
          body: "आपातकालीन फंड लगभग 3 से 6 महीने के खर्च को कवर करता है। यह नौकरी जाने, मरम्मत या मेडिकल बिल के लिए है। एक हफ़्ता सिर्फ़ शुरुआत है। यह फंड दस साल के खर्च रखने के लिए नहीं है।",
        },
        {
          title: "इसमें क्या होना चाहिए",
          body: "अच्छा आपातकालीन फंड आसानी से मिल जाता है और रोज़मर्रा के खर्च से अलग रखा जाता है। इसे कुछ महीनों के खर्च कवर करने चाहिए। इसे ऊंचे जोखिम वाले शेयरों में नहीं रखना चाहिए। इसका काम ज़रूरत पर मौजूद रहना है, सबसे तेज़ बढ़ना नहीं।",
        },
        {
          title: "पहला पड़ाव",
          body: "अगर 3 से 6 महीने बहुत बड़ा लगता है, तो ज़रूरी खर्चों के एक महीने से शुरू करें। यह कई आम झटकों को संभाल लेता है। उसके बाद अगला महीना जोड़ें। आपके असली बिलों को नज़रअंदाज़ करने वाला गोल आंकड़ा कमज़ोर पहला लक्ष्य है।",
        },
      ],
      "pt-BR": [
        {
          title: "Quanto manter",
          body: "Uma reserva de emergência cobre de 3 a 6 meses de despesas. Ela serve para a perda do emprego, um conserto ou uma conta médica. Uma semana é só o começo. A reserva não foi feita para guardar dez anos de despesas.",
        },
        {
          title: "O que deve estar nela",
          body: "Uma boa reserva de emergência é fácil de acessar e fica separada dos gastos do dia a dia. Ela deve cobrir alguns meses de despesas. Não deve ficar em ações de alto risco. O papel dela é estar lá quando você precisar, não crescer o mais rápido possível.",
        },
        {
          title: "O primeiro marco",
          body: "Se 3 a 6 meses parece muito, comece com um mês de despesas essenciais. Isso cobre muitos imprevistos comuns. Depois acrescente o mês seguinte. Um número redondo que ignora suas contas reais é uma primeira meta mais fraca.",
        },
      ],
      tr: [
        {
          title: "Ne kadar tutmalı",
          body: "Acil durum fonu yaklaşık 3 ila 6 aylık gideri karşılar. İş kaybı, onarım veya sağlık faturası içindir. Bir hafta yalnızca başlangıçtır. Fon, on yıllık gideri tutmak için tasarlanmamıştır.",
        },
        {
          title: "İçinde ne olmalı",
          body: "İyi bir acil durum fonu kolay erişilir ve günlük harcamalardan ayrı tutulur. Birkaç aylık gideri karşılamalıdır. Yüksek riskli hisselerde durmamalıdır. Görevi olabildiğince hızlı büyümek değil, ihtiyaç duyduğunda orada olmaktır.",
        },
        {
          title: "İlk hedef",
          body: "3 ila 6 ay fazla geliyorsa bir aylık temel giderle başla. Bu, sık rastlanan birçok sarsıntıyı karşılar. Ardından bir sonraki ayı ekle. Gerçek faturalarını göz ardı eden yuvarlak bir rakam daha zayıf bir ilk hedeftir.",
        },
      ],
    },
    "/quiz?topic=emergency",
  ),
  "long-term-investing": lesson(
    { en: "Long-Term Investing Basics", pl: "Podstawy długoterminowego inwestowania", ja: "長期投資の基本",
    es: "Fundamentos de la inversión a largo plazo",
    fr: "Les bases de l'investissement à long terme",
    zh: "长期投资基础",
    hi: "लंबी अवधि के निवेश की बुनियाद",
    "pt-BR": "Fundamentos do investimento de longo prazo",
    tr: "Uzun Vadeli Yatırımın Temelleri" },
    {
      en: [
        {
          "title": "Compounding in a model",
          "body": "Goal: recognize interest on interest. Example: PLN 1,000 at a hypothetical constant 5% a year becomes PLN 1,050 after one year and PLN 1,102.50 after two. Compounding is annual, interest stays; no contributions, withdrawals, fees or tax. This nominal model ignores inflation and is not an offer or guaranteed investment profit. Exercise: where does the extra PLN 2.50 come from? Optionally calculate on paper, without buying anything. Essentials, required minimums and reserves come first; with irregular income and no surplus, pause and return calmly later."
        },
        {
          "title": "Diversification and remaining risk",
          "body": "Goal: distinguish spreading risk from protection against every loss. Example: two companies in the same sector can fall together; the number of holdings does not prove independent risks. Exercise: can several funds own the same assets? Yes. Optionally compare fictional holdings on paper, without buying anything. Diversification can reduce concentration but cannot remove market losses. Essentials, required minimums and reserves come first; with irregular income and no surplus, pause. You can return to the exercise later."
        },
        {
          "title": "Index strategies and costs",
          "body": "Goal: identify a strategy, not a return promise. Example: fictional fund A states that it tracks an index, while B selects assets freely. Exercise: which has an index objective? A; the name alone does not establish a lower fee. Check risks, actual costs and possible differences from the index. An ETF can be index-based or active. Optionally list questions for the documents, without buying anything. Essentials, required minimums and reserves come first; with irregular income and no surplus, you can pause and return later."
        },
        {
          "title": "ETF as a fund form",
          "body": "Goal: recognize an exchange-traded fund. Example: an ETF can be actively managed and focus on one sector. Exercise: does the ETF label prove broad diversification? No. Check holdings, risks, fees and transaction costs, including the difference between buying and selling prices. Value can fall. Optionally write down these questions without buying anything. Essentials, required minimums and reserves come first; with irregular income and no surplus, pause. You can return to learning later."
        },
        {
          "title": "Horizon and reassessing a plan",
          "body": "Goal: connect a plan to needs, not a certain market bottom. Example: money needed in one year and money for a goal ten years away have different need dates. Exercise: do ten years guarantee profit? No. Consider reserves, possible losses and costs; a changed situation can call for reassessment. There is no always-hold or sell-after-a-drop rule. Optionally note a fictional goal date, without buying anything. Essentials, required minimums and reserves come first; no surplus with irregular income allows a pause and a later return."
        }
      ],
      pl: [
        {
          "title": "Procent składany w modelu",
          "body": "Cel: rozpoznaj odsetki od odsetek. Przykład: 1 000 zł przy hipotetycznych stałych 5% rocznie daje 1 050 zł po roku i 1 102,50 zł po dwóch. Kapitalizacja roczna, odsetki zostają; bez dopłat, wypłat, opłat i podatku. To nominalny model bez inflacji, nie oferta ani gwarancja zysku z inwestycji. Ćwiczenie: skąd dodatkowe 2,50 zł? Opcjonalnie przelicz na kartce, bez zakupu. Potrzeby, wymagane minimum i rezerwa są pierwsze; przy nieregularnym dochodzie bez nadwyżki zrób pauzę i wróć spokojnie później."
        },
        {
          "title": "Dywersyfikacja i pozostające ryzyko",
          "body": "Cel: odróżnij rozłożenie ryzyka od ochrony przed każdą stratą. Przykład: dwie spółki z tego samego sektora mogą spadać jednocześnie; liczba pozycji nie dowodzi niezależności ryzyka. Ćwiczenie: czy wiele funduszy może mieć te same aktywa? Tak. Opcjonalnie porównaj fikcyjne składy na kartce, bez zakupu. Dywersyfikacja może ograniczać koncentrację, lecz nie usuwa strat rynkowych. Potrzeby, wymagane minimum i rezerwa są pierwsze; przy nieregularnym dochodzie bez nadwyżki zrób pauzę. Do ćwiczenia możesz wrócić później."
        },
        {
          "title": "Strategia indeksowa i koszty",
          "body": "Cel: rozpoznaj strategię, nie obietnicę wyniku. Przykład: fikcyjny fundusz A deklaruje śledzenie indeksu, a B swobodny dobór aktywów. Ćwiczenie: który ma cel indeksowy? A; sama nazwa nie potwierdza niższej opłaty. Sprawdź ryzyko, faktyczne koszty i możliwość różnic względem indeksu. ETF może być indeksowy lub aktywny. Opcjonalnie wypisz pytania do dokumentów, bez zakupu. Potrzeby, wymagane minimum i rezerwa są pierwsze; przy nieregularnym dochodzie bez nadwyżki możesz zrobić pauzę i wrócić później."
        },
        {
          "title": "ETF jako forma funduszu",
          "body": "Cel: rozpoznaj fundusz notowany na giełdzie. Przykład: ETF może być aktywnie zarządzany i skupiać się na jednym sektorze. Ćwiczenie: czy skrót ETF dowodzi szerokiego rozłożenia ryzyka? Nie. Sprawdź skład, ryzyko, opłaty i koszty transakcji, także różnicę cen kupna i sprzedaży. Wartość może spaść. Opcjonalnie zapisz te pytania bez zakupu. Potrzeby, wymagane minimum i rezerwa są pierwsze; przy nieregularnym dochodzie bez nadwyżki zrób pauzę. Możesz wrócić do nauki później."
        },
        {
          "title": "Horyzont i ponowna ocena planu",
          "body": "Cel: powiąż plan z potrzebami, a nie pewnym dołkiem rynku. Przykład: pieniądze potrzebne za rok i odłożone na cel za dziesięć lat mają inne terminy potrzeby. Ćwiczenie: czy dziesięć lat gwarantuje zysk? Nie. Oceń rezerwę, możliwe straty i koszty; przy zmianie sytuacji można ponownie ocenić plan. Nie ma reguły zawsze trzymaj ani sprzedaj po spadku. Opcjonalnie zapisz termin fikcyjnego celu, bez zakupu. Potrzeby, wymagane minimum i rezerwa są pierwsze; brak nadwyżki przy nieregularnym dochodzie pozwala zrobić pauzę i wrócić później."
        }
      ],
      ja: [
        {
          title: "複利",
          body: "複利は、元本と、すでに付いた利息の両方に利息が付くことです。残高が増え、次の利息はその大きい残高で計算されます。銀行の手数料ではなく、クレジットカードだけのものでもありません。長い年数では、付いた利息が合計の大きな部分になります。",
        },
        {
          title: "分散",
          body: "分散は、一つの損失で計画が沈まないように、お金を違う資産に分けることです。強い株でも、一銘柄は一つの賭けです。債券だけでも十分な混ぜ方ではありません。狙いはリスクを下げることで、毎週ポートフォリオを替えることではありません。",
        },
        {
          title: "インデックスファンド",
          body: "インデックスファンドは市場のリストを自動で追い、手数料が低いです。ETFも同じことができます。ヘッジファンドやベンチャーファンドは別の商品で、コストが高いです。低い手数料は、払い出されずに投資へ残ります。",
        },
        {
          title: "ETFとは",
          body: "ETFは上場投資信託です。株のように売買できる資産のかごです。高金利の貯金口座でも、振込手数料でもありません。一度の購入で多くの会社や債券を持てます。一つずつ選ばなくても混ぜられます。",
        },
        {
          title: "市場にいる時間",
          body: "長期の投資家では、投資したままにする方が、正確な底で買って天井で売るより良かったことが多いです。下落のあと売ると、戻りを逃しがちです。金だけが、これらの研究の示す戦略ではありません。市場にいる時間とは、普通の上げ下げのあいだも投資したままでいることです。",
        },
      ],
      es: [
        {
          title: "Interés compuesto",
          body: "El interés compuesto es el interés ganado sobre la cantidad inicial y sobre los intereses ya añadidos. El saldo crece, y la siguiente ronda de intereses se calcula sobre ese saldo mayor. No es una comisión bancaria ni se limita a las tarjetas de crédito. Con los años, los intereses añadidos se convierten en gran parte del total.",
        },
        {
          title: "Diversificación",
          body: "Diversificar significa repartir el dinero entre distintos activos para que una pérdida no hunda el plan. Una sola acción, aunque sea sólida, es una única apuesta. Solo bonos no es una mezcla completa. El objetivo es menos riesgo, no una cartera nueva cada semana.",
        },
        {
          title: "Fondos indexados",
          body: "Un fondo indexado sigue automáticamente una lista del mercado y cobra una comisión baja. Un ETF puede hacer lo mismo. Un hedge fund y un fondo de capital riesgo son productos distintos con costes más altos. La comisión baja se queda invertida en lugar de irse en gastos.",
        },
        {
          title: "Qué es un ETF",
          body: "Un ETF es un fondo cotizado: una cesta de activos que puedes comprar y vender como una acción. No es una cuenta de ahorro ni una comisión por transferencia. Una sola compra puede contener muchas empresas o bonos. Obtienes una mezcla sin elegir cada pieza.",
        },
        {
          title: "Tiempo en el mercado",
          body: "Para los inversores a largo plazo, mantenerse invertido ha tendido a superar el intento de comprar en el mínimo exacto y vender en el máximo exacto. Vender tras una caída suele hacer que te pierdas la recuperación. Tener solo oro no es la estrategia que señalan estos estudios. Tiempo en el mercado significa seguir invertido durante las subidas y bajadas normales.",
        },
      ],
      fr: [
        {
          title: "Intérêts composés",
          body: "Les intérêts composés sont des intérêts gagnés sur le montant initial et sur les intérêts déjà ajoutés. Le solde grossit, et le prochain calcul d'intérêts porte sur ce solde plus élevé. Ce ne sont pas des frais bancaires, et cela ne se limite pas aux cartes de crédit. Sur de nombreuses années, les intérêts ajoutés deviennent une grande part du total.",
        },
        {
          title: "Diversification",
          body: "Diversifier, c'est répartir son argent entre différents actifs pour qu'une perte ne fasse pas couler le plan. Une seule action, même solide, reste un pari unique. Des obligations seules ne forment pas un ensemble complet. Le but est de réduire le risque, pas de changer de portefeuille chaque semaine.",
        },
        {
          title: "Fonds indiciels",
          body: "Un fonds indiciel suit automatiquement une liste de marché et facture des frais faibles. Un ETF peut faire de même. Un hedge fund et un fonds de capital-risque sont des produits différents, aux coûts plus élevés. Les frais économisés restent investis au lieu d'être versés.",
        },
        {
          title: "Ce qu'est un ETF",
          body: "Un ETF est un fonds coté en bourse : un panier d'actifs que vous pouvez acheter et vendre comme une action. Ce n'est ni un compte d'épargne ni des frais de virement. Un seul achat peut contenir de nombreuses entreprises ou obligations. Vous obtenez un ensemble sans choisir chaque élément vous-même.",
        },
        {
          title: "Le temps passé sur le marché",
          body: "Pour les investisseurs à long terme, rester investi a eu tendance à faire mieux que d'acheter au plus bas exact et de vendre au plus haut exact. Vendre après une baisse fait souvent manquer la reprise. L'or seul n'est pas la stratégie que désignent ces études. Le temps passé sur le marché, c'est rester investi à travers les hausses et les baisses ordinaires.",
        },
      ],
      zh: [
        {
          title: "复利",
          body: "复利是在本金和已加入的利息上共同赚取的利息。余额增长，下一轮利息按这个更大的余额计算。它不是银行手续费，也不只存在于信用卡。多年之后，累积的利息会成为总额中的一大部分。",
        },
        {
          title: "分散投资",
          body: "分散投资是把钱分散到不同资产上，这样一次亏损不会毁掉整个计划。一只股票再强，也只是一次下注。只有债券也不算完整的组合。目标是降低风险，而不是每周换一个新组合。",
        },
        {
          title: "指数基金",
          body: "指数基金自动跟踪一份市场名单，收费很低。ETF 也可以做到。对冲基金和风险投资基金是成本更高的不同产品。省下的费用会继续留在投资里，而不是被付出去。",
        },
        {
          title: "什么是 ETF",
          body: "ETF 是交易所交易基金：一篮子资产，可以像股票一样买卖。它不是储蓄账户，也不是转账手续费。一次买入就可以持有许多公司或债券。你不用自己逐个挑选，就能得到一个组合。",
        },
        {
          title: "在市场中的时间",
          body: "对长期投资者来说，保持投资往往胜过精确地买在最低点、卖在最高点。下跌后卖出常常会错过反弹。只持有黄金并不是这些研究指向的策略。在市场中的时间，意味着在正常的涨跌中保持投资。",
        },
      ],
      hi: [
        {
          title: "चक्रवृद्धि ब्याज",
          body: "चक्रवृद्धि ब्याज वह ब्याज है जो मूल रकम और पहले से जुड़े ब्याज दोनों पर मिलता है। बैलेंस बढ़ता है और ब्याज का अगला दौर उसी बड़े बैलेंस पर लगता है। यह बैंक का शुल्क नहीं है और सिर्फ़ क्रेडिट कार्ड तक सीमित नहीं है। कई सालों में जुड़ा हुआ ब्याज कुल रकम का बड़ा हिस्सा बन जाता है।",
        },
        {
          title: "विविधीकरण",
          body: "विविधीकरण का मतलब है पैसे को अलग-अलग एसेट में फैलाना ताकि एक नुकसान पूरी योजना न डुबो दे। एक शेयर, चाहे मज़बूत हो, एक ही दांव है। सिर्फ़ बॉन्ड भी पूरा मिश्रण नहीं हैं। लक्ष्य कम जोखिम है, हर हफ़्ते नया पोर्टफ़ोलियो नहीं।",
        },
        {
          title: "इंडेक्स फंड",
          body: "इंडेक्स फंड बाज़ार की एक सूची को अपने आप ट्रैक करता है और कम शुल्क लेता है। ETF भी यही कर सकता है। हेज फंड और वेंचर फंड ज़्यादा लागत वाले अलग उत्पाद हैं। कम शुल्क का पैसा चुकाए जाने के बजाय निवेश में बना रहता है।",
        },
        {
          title: "ETF क्या है",
          body: "ETF एक्सचेंज-ट्रेडेड फंड है: एसेट की एक टोकरी जिसे आप शेयर की तरह खरीद और बेच सकते हैं। यह बचत खाता नहीं है और न ही ट्रांसफ़र शुल्क। एक खरीद में कई कंपनियां या बॉन्ड हो सकते हैं। आपको हर हिस्सा खुद चुने बिना मिश्रण मिल जाता है।",
        },
        {
          title: "बाज़ार में बिताया समय",
          body: "लंबी अवधि के निवेशकों के लिए, निवेश में बने रहना अक्सर ठीक सबसे निचले स्तर पर खरीदने और ठीक सबसे ऊंचे स्तर पर बेचने से बेहतर रहा है। गिरावट के बाद बेचने से अक्सर रिकवरी छूट जाती है। सिर्फ़ सोना रखना वह रणनीति नहीं है जिसकी ओर ये अध्ययन इशारा करते हैं। बाज़ार में बिताया समय यानी सामान्य उतार-चढ़ाव में निवेश बनाए रखना।",
        },
      ],
      "pt-BR": [
        {
          title: "Juros compostos",
          body: "Juros compostos são juros ganhos sobre o valor inicial e sobre os juros já acumulados. O saldo cresce, e a próxima rodada de juros usa esse saldo maior. Não é uma tarifa bancária nem algo restrito a cartões de crédito. Ao longo de muitos anos, os juros acumulados viram grande parte do total.",
        },
        {
          title: "Diversificação",
          body: "Diversificar é distribuir o dinheiro entre ativos diferentes para que uma perda não afunde o plano. Uma única ação, mesmo que forte, é uma aposta só. Apenas títulos não formam uma carteira completa. O objetivo é reduzir o risco, não montar uma carteira nova toda semana.",
        },
        {
          title: "Fundos de índice",
          body: "Um fundo de índice acompanha automaticamente uma lista do mercado e cobra uma taxa baixa. Um ETF pode fazer o mesmo. Um hedge fund e um fundo de venture capital são produtos diferentes, com custos maiores. A taxa economizada continua investida em vez de ser paga.",
        },
        {
          title: "O que é um ETF",
          body: "Um ETF é um fundo negociado em bolsa: uma cesta de ativos que você pode comprar e vender como uma ação. Não é uma conta de poupança nem uma tarifa de transferência. Uma única compra pode conter muitas empresas ou títulos. Você obtém um conjunto sem escolher cada peça.",
        },
        {
          title: "Tempo no mercado",
          body: "Para investidores de longo prazo, permanecer investido tendeu a superar a tentativa de comprar na mínima exata e vender na máxima exata. Vender depois de uma queda muitas vezes faz perder a recuperação. Apenas ouro não é a estratégia que esses estudos apontam. Tempo no mercado significa continuar investido nas altas e baixas normais.",
        },
      ],
      tr: [
        {
          title: "Bileşik getiri",
          body: "Bileşik getiri, hem ana para hem de önceden eklenmiş getiri üzerinden kazanılan getiridir. Bakiye büyür ve bir sonraki getiri bu daha büyük bakiye üzerinden hesaplanır. Banka masrafı değildir ve kredi kartlarıyla sınırlı değildir. Uzun yıllar içinde eklenen getiri toplamın büyük bir kısmını oluşturur.",
        },
        {
          title: "Çeşitlendirme",
          body: "Çeşitlendirme, tek bir kaybın planı batırmaması için parayı farklı varlıklara yaymaktır. Güçlü olsa bile tek bir hisse tek bir bahistir. Yalnızca tahvil de tam bir karışım değildir. Amaç her hafta yeni bir portföy değil, daha düşük risktir.",
        },
        {
          title: "Endeks fonları",
          body: "Endeks fonu bir piyasa listesini otomatik olarak izler ve düşük ücret alır. Bir ETF de aynısını yapabilir. Hedge fon ve girişim sermayesi fonu, maliyeti daha yüksek farklı ürünlerdir. Düşük ücret sayesinde para ödenmek yerine yatırımda kalır.",
        },
        {
          title: "ETF nedir",
          body: "ETF borsada işlem gören bir fondur: hisse gibi alıp satabileceğin bir varlık sepetidir. Birikim hesabı ya da transfer ücreti değildir. Tek bir alım birçok şirketi veya tahvili içerebilir. Her parçayı tek tek seçmeden bir karışım elde edersin.",
        },
        {
          title: "Piyasada geçen süre",
          body: "Uzun vadeli yatırımcılar için yatırımda kalmak, tam dipten alıp tam tepeden satmaya çalışmaktan genellikle daha iyi sonuç vermiştir. Düşüşten sonra satmak çoğu zaman toparlanmayı kaçırmak demektir. Bu çalışmaların işaret ettiği strateji yalnızca altın tutmak değildir. Piyasada geçen süre, olağan iniş çıkışlar boyunca yatırımda kalmak demektir.",
        },
      ],
    },
    "/quiz?topic=investing",
  ),
  retirement: lesson(
    { en: "Retirement and Future Security", pl: "Emerytura i bezpieczeństwo przyszłości", ja: "退職と将来の安心",
    es: "Jubilación y seguridad futura",
    fr: "Retraite et sécurité future",
    zh: "退休与未来保障",
    hi: "रिटायरमेंट और भविष्य की सुरक्षा",
    "pt-BR": "Aposentadoria e segurança futura",
    tr: "Emeklilik ve Gelecek Güvencesi" },
    {
      en: [
        {
          "title": "Future needs, not an account promise",
          "body": "Goal: plan resources for future needs after work changes or ends. Example: a fictional person lists future expenses and possible income sources; the plan does not promise to replace today’s salary fully. Exercise: distinguish an urgent bill from an expense further in the future. Optionally write one question on paper, without buying anything, opening an account or giving personal details. Essentials, required minimum repayments and reserves come first. With irregular income and no surplus, you can pause and return calmly later."
        },
        {
          "title": "More time only under stated assumptions",
          "body": "Goal: distinguish compounding from a certain forecast. Example: PLN 1,000 once at a hypothetical constant 5% a year with annual compounding becomes PLN 1,050 after one year and PLN 1,102.50 after two. Interest stays; no later contributions, withdrawals, fees or tax, and inflation is ignored. Exercise: calculate the second interest payment, PLN 52.50. More time helps here because of the assumed positive rate; actual outcomes are not guaranteed and losses are possible. This is not a pension forecast. Optionally calculate without investing. Essentials, required minimum repayments and reserves come first; with irregular income and no surplus, pause and return later."
        }
      ],
      pl: [
        {
          "title": "Przyszłe potrzeby, nie obietnica konta",
          "body": "Cel: zaplanuj środki na przyszłe potrzeby po zmianie lub zakończeniu pracy. Przykład: fikcyjna osoba spisuje przyszłe wydatki i możliwe źródła dochodu; plan nie obiecuje pełnego zastąpienia dzisiejszej pensji. Ćwiczenie: odróżnij pilny rachunek od wydatku w dalszej przyszłości. Opcjonalnie zapisz jedno pytanie na kartce, bez zakupu, otwierania konta lub podawania własnych danych. Potrzeby, wymagane minimalne spłaty i rezerwa są pierwsze. Przy nieregularnym dochodzie bez nadwyżki możesz zrobić pauzę i wrócić spokojnie później."
        },
        {
          "title": "Więcej czasu tylko w jawnym modelu",
          "body": "Cel: odróżnij kapitalizację od pewnej prognozy. Przykład: jednorazowe 1 000 zł przy hipotetycznych stałych 5% rocznie i kapitalizacji rocznej daje 1 050 zł po roku i 1 102,50 zł po dwóch. Odsetki zostają; bez dopłat, wypłat, opłat i podatku, inflacja pominięta. Ćwiczenie: policz drugie odsetki, 52,50 zł. Więcej czasu pomaga tu dzięki założonej dodatniej stopie; rzeczywisty wynik nie jest gwarantowany i można stracić. To nie prognoza emerytury. Opcjonalnie przelicz model bez inwestowania. Potrzeby, wymagane minimalne spłaty i rezerwa są pierwsze; przy nieregularnym dochodzie bez nadwyżki zrób pauzę i wróć później."
        }
      ],
      ja: [
        {
          title: "口座の目的",
          body: "退職口座は、働かなくなったあとの収入を置き換えるためのものです。入れたお金は、使うまで何十年も複利で増えられます。休暇の資金でも、緊急の現金の置き場でもありません。長く待つことが、複利を役に立たせます。",
        },
        {
          title: "早く始める",
          body: "若いうちに始めれば、少ない毎月の額にも複利の時間が長くあります。年7%で毎月およそ200ドルを25歳から65歳まで続けると、およそ525,000ドルになります。同じ習慣をずっと後から始めると、追いつくにはずっと大きい支払いが要ります。早い年が仕事の大きな部分をします。",
        },
      ],
      es: [
        {
          title: "Para qué sirve la cuenta",
          body: "Una cuenta de jubilación está pensada para sustituir los ingresos cuando dejas de trabajar. El dinero aportado puede capitalizarse durante décadas antes de que lo gastes. No es un fondo para vacaciones ni un lugar para el dinero de emergencia. La larga espera es lo que hace útil el interés compuesto.",
        },
        {
          title: "Empezar pronto",
          body: "Una pequeña cantidad mensual tiene mucho tiempo para capitalizarse si empiezas joven. Unos 200 dólares al mes con una rentabilidad anual del 7%, de los 25 a los 65 años, crecen hasta unos 525.000 dólares. El mismo hábito iniciado mucho más tarde necesita una aportación mucho mayor para alcanzarlo. Los primeros años hacen gran parte del trabajo.",
        },
      ],
      fr: [
        {
          title: "Pourquoi ce compte existe",
          body: "Un compte retraite est destiné à remplacer vos revenus quand vous cessez de travailler. L'argent versé peut fructifier pendant des décennies avant d'être dépensé. Ce n'est ni un fonds pour les vacances ni un endroit pour l'argent d'urgence. C'est la longue attente qui rend la capitalisation utile.",
        },
        {
          title: "Commencer tôt",
          body: "Un petit montant mensuel a beaucoup de temps pour fructifier si vous commencez jeune. Environ 200 dollars par mois à un rendement annuel de 7 %, de 25 à 65 ans, deviennent environ 525 000 dollars. La même habitude commencée bien plus tard exige un versement bien plus élevé pour rattraper. Les premières années font une grande partie du travail.",
        },
      ],
      zh: [
        {
          title: "这个账户为何存在",
          body: "退休账户是为了在你停止工作后替代收入。投入的钱在你花掉之前可以复利增长几十年。它不是度假基金，也不是放应急现金的地方。漫长的等待正是让复利发挥作用的原因。",
        },
        {
          title: "尽早开始",
          body: "如果你从年轻时开始，每月一小笔钱就有很长的时间复利增长。从 25 岁到 65 岁，每月约 200 美元、年回报 7%，会增长到约 52.5 万美元。同样的习惯如果晚很多才开始，就需要大得多的投入才能赶上。最初的那些年承担了很大一部分工作。",
        },
      ],
      hi: [
        {
          title: "यह खाता क्यों है",
          body: "रिटायरमेंट खाता काम छोड़ने के बाद आय की जगह लेने के लिए होता है। जमा किया गया पैसा खर्च होने से पहले दशकों तक चक्रवृद्धि से बढ़ सकता है। यह छुट्टियों का फंड या आपातकालीन नकदी की जगह नहीं है। लंबा इंतज़ार ही चक्रवृद्धि को उपयोगी बनाता है।",
        },
        {
          title: "जल्दी शुरू करना",
          body: "अगर आप कम उम्र में शुरू करें, तो छोटी मासिक रकम के पास बढ़ने के लिए लंबा समय होता है। 25 से 65 की उम्र तक, 7% सालाना रिटर्न पर हर महीने लगभग 200 डॉलर बढ़कर करीब 5,25,000 डॉलर हो जाते हैं। यही आदत बहुत देर से शुरू करने पर बराबरी के लिए कहीं बड़ी रकम चाहिए। शुरुआती साल काम का बड़ा हिस्सा करते हैं।",
        },
      ],
      "pt-BR": [
        {
          title: "Por que a conta existe",
          body: "Uma conta de aposentadoria serve para substituir a renda depois que você para de trabalhar. O dinheiro aplicado pode render juros compostos por décadas antes de ser gasto. Não é um fundo para férias nem um lugar para o dinheiro de emergência. A longa espera é o que torna os juros compostos úteis.",
        },
        {
          title: "Começar cedo",
          body: "Um pequeno valor mensal tem muito tempo para render se você começa jovem. Cerca de US$ 200 por mês a um retorno anual de 7%, dos 25 aos 65 anos, viram cerca de US$ 525.000. O mesmo hábito iniciado bem mais tarde exige um aporte muito maior para alcançar. Os primeiros anos fazem boa parte do trabalho.",
        },
      ],
      tr: [
        {
          title: "Hesap neden var",
          body: "Emeklilik hesabı, çalışmayı bıraktıktan sonra gelirin yerini tutmak içindir. Yatırılan para, harcanmadan önce onlarca yıl bileşik getiriyle büyüyebilir. Tatil fonu ya da acil durum parası için bir yer değildir. Bileşik getiriyi işe yarar kılan şey uzun bekleyiştir.",
        },
        {
          title: "Erken başlamak",
          body: "Genç başlarsan küçük bir aylık tutarın büyümek için uzun zamanı olur. 25 yaşından 65'e kadar, yıllık %7 getiriyle ayda yaklaşık 200 dolar, yaklaşık 525.000 dolara ulaşır. Aynı alışkanlığa çok daha geç başlamak, arayı kapatmak için çok daha yüksek ödeme gerektirir. İşin büyük kısmını ilk yıllar yapar.",
        },
      ],
    },
    "/quiz?topic=retirement",
  ),
  "family-plan": lesson(
    { en: "Family Financial Plan", pl: "Rodzinny plan finansowy", ja: "家族の資金計画",
    es: "Plan financiero familiar",
    fr: "Plan financier familial",
    zh: "家庭财务计划",
    hi: "पारिवारिक वित्तीय योजना",
    "pt-BR": "Plano financeiro familiar",
    tr: "Aile Finans Planı" },
    {
      en: [
        {
          title: "Life insurance",
          body: "Life insurance replaces income for people who depend on you if you die. It is not a way to get rich, and it is not a stock-market shortcut. The payout is there so rent, food, and care can continue. The amount should match that need.",
        },
        {
          title: "Money as a couple",
          body: "Both partners should know the full picture and plan together. One person holding every decision leaves the other stuck if something happens. Keeping every account secret is not a shared plan. The higher earner does not have to be the only one who understands the bills.",
        },
        {
          title: "Teaching children",
          body: "A useful start is pocket money with a simple split, such as save some, spend some, and give some. Money with no rules teaches little. Waiting until 18 leaves the first real decisions unpracticed. A small rule they can follow beats a lecture.",
        },
      ],
      pl: [
        {
          title: "Ubezpieczenie na życie",
          body: "Ubezpieczenie na życie ma zastąpić dochód bliskim, jeśli zabraknie głównego żywiciela. Nie wzbogacisz się na czyjejś śmierci i nie jest to bezpieczna gra na giełdzie. Wypłata ma wystarczyć na czynsz, jedzenie i opiekę. Suma powinna odpowiadać tej potrzebie.",
        },
        {
          title: "Pieniądze we dwoje",
          body: "Oboje powinniście znać całość i planować razem. Jak jedna osoba trzyma wszystkie decyzje, druga nie wie, co robić, gdy coś się stanie. Chowenie każdego konta to nie wspólny plan. Ten, kto zarabia więcej, nie musi być jedyną osobą, która ogarnia rachunki.",
        },
        {
          title: "Jak uczyć dzieci",
          body: "Daj kieszonkowe z prostą zasadą: część odłóż, część wydaj, część podziel się. Pieniądze bez zasad uczą niewiele. Jak czekasz do 18. roku, pierwsze prawdziwe decyzje zostają bez wprawy. Mała zasada, której da się trzymać, działa lepiej niż wykład.",
        },
      ],
      ja: [
        {
          title: "生命保険",
          body: "生命保険は、あなたが亡くなったとき、頼っている人の収入を置き換えます。それで豊かになる方法でも、株式市場への近道でもありません。支払いは、家賃や食費や世話が続くためです。額はその必要に合わせます。",
        },
        {
          title: "二人のお金",
          body: "両方のパートナーが全体を知り、一緒に計画するのがよいです。一人がすべての決定を持つと、何かあったときもう一人が困ります。すべての口座を隠すことは、共有の計画ではありません。多く稼ぐ人が、請求を理解する唯一の人である必要はありません。",
        },
        {
          title: "子どもに教える",
          body: "役に立つ始まりは、一部を貯め、一部を使い、一部を渡す、という簡単な分け方の小遣いです。ルールのないお金はあまり教えません。18歳まで待つと、最初の本物の決定を練習できません。守れる小さいルールの方が、講義より良いです。",
        },
      ],
      es: [
        {
          title: "Seguro de vida",
          body: "El seguro de vida sustituye los ingresos para las personas que dependen de ti si falleces. No es una forma de hacerse rico ni un atajo a la bolsa. El pago existe para que el alquiler, la comida y los cuidados puedan continuar. El importe debe ajustarse a esa necesidad.",
        },
        {
          title: "El dinero en pareja",
          body: "Ambos miembros de la pareja deben conocer el panorama completo y planificar juntos. Si una sola persona toma todas las decisiones, la otra queda bloqueada si ocurre algo. Mantener todas las cuentas en secreto no es un plan compartido. Quien más gana no tiene por qué ser el único que entiende las facturas.",
        },
        {
          title: "Enseñar a los hijos",
          body: "Un buen comienzo es una paga con un reparto sencillo: ahorrar una parte, gastar otra y dar otra. El dinero sin reglas enseña poco. Esperar a los 18 deja sin practicar las primeras decisiones reales. Una regla pequeña que puedan seguir vale más que un sermón.",
        },
      ],
      fr: [
        {
          title: "Assurance vie",
          body: "L'assurance décès remplace les revenus pour les personnes qui dépendent de vous si vous décédez. Ce n'est pas un moyen de s'enrichir ni un raccourci vers la bourse. Le capital versé permet que le loyer, la nourriture et les soins continuent. Le montant doit correspondre à ce besoin.",
        },
        {
          title: "L'argent en couple",
          body: "Les deux partenaires doivent connaître la situation complète et planifier ensemble. Si une seule personne prend toutes les décisions, l'autre se retrouve démunie en cas de problème. Garder tous les comptes secrets n'est pas un plan commun. Celui qui gagne le plus n'a pas à être le seul à comprendre les factures.",
        },
        {
          title: "Apprendre aux enfants",
          body: "Un bon début est de l'argent de poche avec une répartition simple : épargner un peu, dépenser un peu, donner un peu. L'argent sans règles n'apprend pas grand-chose. Attendre 18 ans laisse les premières vraies décisions sans entraînement. Une petite règle qu'ils peuvent suivre vaut mieux qu'un sermon.",
        },
      ],
      zh: [
        {
          title: "人寿保险",
          body: "人寿保险在你身故时，为依靠你生活的人替代收入。它不是致富手段，也不是进入股市的捷径。赔付是为了让房租、食物和照护得以继续。保额应与这一需要相匹配。",
        },
        {
          title: "夫妻理财",
          body: "伴侣双方都应了解全貌并共同规划。如果所有决定都由一个人做，一旦出事，另一个人就会不知所措。每个账户都保密，不算共同计划。收入更高的那个人不必是唯一看得懂账单的人。",
        },
        {
          title: "教孩子理财",
          body: "一个有用的开始是带有简单分配规则的零花钱，比如存一些、花一些、给一些。没有规则的钱教不了什么。等到 18 岁，会让最初的真实决策缺乏练习。一条他们能遵守的小规则，胜过一番说教。",
        },
      ],
      hi: [
        {
          title: "जीवन बीमा",
          body: "जीवन बीमा आपकी मृत्यु होने पर आप पर निर्भर लोगों के लिए आय की जगह लेता है। यह अमीर बनने का तरीका नहीं है और न ही शेयर बाज़ार का शॉर्टकट। भुगतान इसलिए है ताकि किराया, खाना और देखभाल जारी रह सके। रकम उस ज़रूरत के अनुसार होनी चाहिए।",
        },
        {
          title: "जोड़े के रूप में पैसा",
          body: "दोनों साथियों को पूरी तस्वीर पता होनी चाहिए और मिलकर योजना बनानी चाहिए। अगर हर फ़ैसला एक ही व्यक्ति के पास हो, तो कुछ होने पर दूसरा अटक जाता है। हर खाते को छिपाकर रखना साझा योजना नहीं है। ज़्यादा कमाने वाले का ही बिलों को समझने वाला अकेला व्यक्ति होना ज़रूरी नहीं।",
        },
        {
          title: "बच्चों को सिखाना",
          body: "एक अच्छी शुरुआत है सरल बंटवारे वाला जेबखर्च, जैसे कुछ बचाओ, कुछ खर्च करो और कुछ दो। बिना नियम का पैसा कम सिखाता है। 18 साल तक इंतज़ार करने से पहले असली फ़ैसलों का अभ्यास नहीं हो पाता। एक छोटा नियम जिसे वे निभा सकें, भाषण से बेहतर है।",
        },
      ],
      "pt-BR": [
        {
          title: "Seguro de vida",
          body: "O seguro de vida substitui a renda para as pessoas que dependem de você caso você morra. Não é um jeito de enriquecer nem um atalho para a bolsa. A indenização existe para que aluguel, comida e cuidados possam continuar. O valor deve corresponder a essa necessidade.",
        },
        {
          title: "Dinheiro a dois",
          body: "Os dois parceiros devem conhecer o quadro completo e planejar juntos. Uma pessoa concentrando todas as decisões deixa a outra sem saída se algo acontecer. Manter todas as contas em segredo não é um plano compartilhado. Quem ganha mais não precisa ser o único a entender as contas.",
        },
        {
          title: "Ensinar as crianças",
          body: "Um bom começo é a mesada com uma divisão simples: poupar um pouco, gastar um pouco e doar um pouco. Dinheiro sem regras ensina pouco. Esperar até os 18 deixa as primeiras decisões reais sem prática. Uma regra pequena que elas conseguem seguir vale mais do que um sermão.",
        },
      ],
      tr: [
        {
          title: "Hayat sigortası",
          body: "Hayat sigortası, ölümün hâlinde sana bağımlı olan kişiler için gelirin yerini tutar. Zengin olmanın yolu ya da borsaya kısa yol değildir. Ödeme; kiranın, yemeğin ve bakımın sürebilmesi içindir. Tutar bu ihtiyaca uygun olmalıdır.",
        },
        {
          title: "Çift olarak para",
          body: "Her iki partner de tablonun tamamını bilmeli ve birlikte plan yapmalıdır. Tüm kararları tek kişinin vermesi, bir şey olursa diğerini çaresiz bırakır. Her hesabı gizli tutmak ortak bir plan değildir. Faturaları anlayan tek kişi daha çok kazanan olmak zorunda değildir.",
        },
        {
          title: "Çocuklara öğretmek",
          body: "İyi bir başlangıç, basit bir paylaşımı olan harçlıktır: biraz biriktir, biraz harca, biraz paylaş. Kuralsız para pek bir şey öğretmez. 18 yaşını beklemek ilk gerçek kararları pratiksiz bırakır. Uygulayabilecekleri küçük bir kural, uzun bir nutuktan iyidir.",
        },
      ],
    },
    "/quiz?topic=family",
  ),
};
