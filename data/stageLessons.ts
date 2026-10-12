import type { Locale } from "@/lib/i18n";

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

export interface StageLesson {
  quizHref: string;
  copy: Record<Locale, StageLessonCopy>;
}

const chrome: Record<Locale, Pick<StageLessonCopy, "stepLabel" | "next" | "quiz">> = {
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
};

function lesson(
  titles: Record<Locale, string>,
  steps: Record<Locale, StageLessonStep[]>,
  quizHref: string,
): StageLesson {
  return {
    quizHref,
    copy: {
      en: { ...chrome.en, title: titles.en, steps: steps.en },
      pl: { ...chrome.pl, title: titles.pl, steps: steps.pl },
      ja: { ...chrome.ja, title: titles.ja, steps: steps.ja },
    },
  };
}

export const stageLessons: Record<string, StageLesson> = {
  "saving-habit": lesson(
    { en: "Saving Habit", pl: "Nawyk oszczędzania", ja: "貯蓄の習慣" },
    {
      en: [
        {
          title: "Save on payday",
          body: "The strongest habit is a fixed transfer right after you are paid. Waiting to save what is left usually leaves nothing. The transfer happens before spending starts. The rest of the month runs on what remains.",
        },
        {
          title: "The 50/30/20 rule",
          body: "The 50/30/20 rule splits take-home pay into needs, wants, and savings. About half covers needs such as rent and food. About 30% covers wants. About 20% goes to savings and paying down debt.",
        },
        {
          title: "A high-yield savings account",
          body: "A high-yield savings account pays much more interest than a standard account. It is still a savings account, not a stock investment. The extra interest helps cash keep up a little better. It is a place for money you may need soon.",
        },
        {
          title: "Dollar-cost averaging",
          body: "Dollar-cost averaging means investing a fixed amount on a regular schedule, whatever the price. You buy more when prices are low and less when they are high. You do not wait for a perfect day. The habit removes the guesswork.",
        },
      ],
      pl: [
        {
          title: "Oszczędzaj w dniu wypłaty",
          body: "Najmocniejszy nawyk to stały przelew zaraz po wypłacie. Jak odkładasz dopiero to, co zostanie, zwykle nie zostaje nic. Najpierw przelew, potem wydatki. Resztę miesiąca przeżywasz z tego, co zostało.",
        },
        {
          title: "Zasada 50/30/20",
          body: "Zasada 50/30/20 dzieli wypłatę na rękę na trzy części. Około połowy idzie na potrzeby: czynsz, jedzenie, rachunki. Około 30% na zachcianki. Około 20% na oszczędności i spłatę długów.",
        },
        {
          title: "Konto z wyższym oprocentowaniem",
          body: "To konto oszczędnościowe z wyraźnie wyższym oprocentowaniem niż zwykłe. To nadal konto, nie akcje. Wyższe odsetki sprawiają, że gotówka wolniej traci na wartości. Trzymaj tu pieniądze, których możesz potrzebować wkrótce.",
        },
        {
          title: "Uśrednianie ceny",
          body: "Uśrednianie ceny, czyli DCA, to wpłacanie stałej kwoty w stałym rytmie, bez patrzenia na cenę. Gdy jest tanio, kupujesz więcej. Gdy jest drogo, mniej. Nie czekasz na idealny moment i nie musisz zgadywać.",
        },
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
    },
    "/quiz?topic=saving",
  ),
  inflation: lesson(
    { en: "Inflation and Purchasing Power", pl: "Inflacja i siła nabywcza", ja: "インフレと購買力" },
    {
      en: [
        {
          title: "What inflation means",
          body: "Inflation means money buys less over time. The same amount covers fewer groceries, or the same rent costs more. Rising prices are the usual sign. Cash that sits still loses purchasing power.",
        },
        {
          title: "Real return",
          body: "Real return is the interest you earn minus inflation. If inflation is 5% and the bank pays 2%, the real return is about −3%. The balance can rise while its buying power falls. The rate on the account is not the whole story.",
        },
        {
          title: "The rule of 72",
          body: "The rule of 72 estimates how long money takes to double. Divide 72 by the yearly return. At 8% a year, money doubles in about 9 years. At 6%, it takes about 12 years.",
        },
        {
          title: "A long-term hedge",
          body: "A hedge is something that has tended to grow faster than prices. Broad stock index funds have done that over many years. Cash under a mattress and a 1% savings account have not. The point is a long horizon, not a quick bet.",
        },
      ],
      pl: [
        {
          title: "Co znaczy inflacja",
          body: "Inflacja znaczy, że z czasem za te same pieniądze kupisz mniej. Ta sama kwota starczy na mniej zakupów, a ten sam czynsz kosztuje więcej. Ceny idą w górę. Gotówka, która leży bez ruchu, traci siłę nabywczą.",
        },
        {
          title: "Realna stopa zwrotu",
          body: "Realna stopa zwrotu to oprocentowanie minus inflacja. Jak inflacja wynosi 5%, a bank daje 2%, wychodzi około −3%. Na koncie może przybywać złotówek, a i tak kupisz za nie mniej. Samo oprocentowanie nie mówi, czy naprawdę zarabiasz.",
        },
        {
          title: "Reguła 72",
          body: "Reguła 72 podpowiada, po ilu latach pieniądze się podwoją. Dzielisz 72 przez roczną stopę zwrotu. Przy 8% rocznie wychodzi około 9 lat. Przy 6% około 12 lat.",
        },
        {
          title: "Ochrona na lata",
          body: "Dobra ochrona przed inflacją to coś, co przez lata rosło szybciej niż ceny. Tak było z szerokimi funduszami indeksowymi akcji. Gotówka pod materacem i konto na 1% tak nie działają. Liczy się długi czas, nie szybki zysk.",
        },
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
    },
    "/quiz?topic=inflation",
  ),
  "credit-rates": lesson(
    { en: "Credit, Interest and Rates", pl: "Kredyt, odsetki i stopy", ja: "信用、金利、利率" },
    {
      en: [
        {
          title: "Variable rates",
          body: "A variable-rate loan follows the market rate. When the central bank raises rates, the monthly payment usually goes up. A fixed rate stays put. With a variable loan, a higher rate means a higher bill.",
        },
        {
          title: "The debt avalanche",
          body: "The debt avalanche pays the highest-interest debt first. That cuts the interest you pay over the life of the debts. Paying the smallest balance first can feel easier, but it usually costs more. A new loan to pay an old one does not remove the cost.",
        },
        {
          title: "What moves a credit score",
          body: "Payment history has the biggest effect on a credit score. Paying on time matters more than how many cards you hold. Income is not the main factor. A long record of on-time payments is the strongest signal.",
        },
        {
          title: "Bond prices and rates",
          body: "Bond prices fall when interest rates rise. An older bond pays less than a new one, so buyers offer less for it. The two move in opposite directions. A rate increase does not leave bond prices where they were.",
        },
      ],
      pl: [
        {
          title: "Oprocentowanie zmienne",
          body: "Kredyt ze zmienną stopą jest powiązany ze stopami na rynku. Gdy bank centralny je podnosi, rata zwykle rośnie. Przy stałej stopie rata zostaje taka sama. Wyższa stopa to wyższa rata.",
        },
        {
          title: "Lawina zadłużenia",
          body: "W lawinie zadłużenia najpierw spłacasz dług z najwyższym oprocentowaniem. W całym okresie oddajesz wtedy mniej odsetek. Spłata najmniejszego długu może być łatwiejsza, ale zwykle wychodzi drożej. Nowy kredyt na spłatę starego niczego nie załatwia.",
        },
        {
          title: "Ocena kredytowa",
          body: "Na ocenę kredytową najbardziej wpływa historia płatności. To, czy płacisz w terminie, liczy się bardziej niż liczba kart. Dochód nie jest tu najważniejszy. Najwięcej daje długa historia płatności na czas.",
        },
        {
          title: "Ceny obligacji i stopy",
          body: "Gdy stopy procentowe rosną, ceny obligacji spadają. Stara obligacja płaci mniej niż nowa, więc kupujący dają za nią mniej. Cena i stopa idą w przeciwne strony. Podwyżka stóp ściąga ceny w dół.",
        },
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
    },
    "/quiz?topic=credit",
  ),
  "emergency-fund": lesson(
    { en: "Emergency Fund", pl: "Fundusz awaryjny", ja: "緊急資金" },
    {
      en: [
        {
          title: "How much to hold",
          body: "An emergency fund covers about 3 to 6 months of expenses. It is for a job loss, a repair, or a medical bill. One week is only a start. The fund is not meant to hold ten years of expenses.",
        },
        {
          title: "What belongs in it",
          body: "A good emergency fund is easy to reach and kept apart from daily spending. It should cover a few months of expenses. It should not sit in high-risk stocks. The job is to be there when you need it, not to grow as fast as possible.",
        },
        {
          title: "The first milestone",
          body: "If 3 to 6 months feels too big, start with one month of essential expenses. That covers many common shocks. Add the next month after that. A round number that ignores your actual bills is a weaker first goal.",
        },
      ],
      pl: [
        {
          title: "Ile trzymać",
          body: "Fundusz awaryjny ma pokryć około 3 do 6 miesięcy wydatków. Przyda się, gdy stracisz pracę, coś się zepsuje albo przyjdzie rachunek za leczenie. Jeden tydzień to za mało. Dziesięć lat to nie ten fundusz.",
        },
        {
          title: "Co w nim trzymać",
          body: "Dobry fundusz da się szybko wyjąć i leży z dala od codziennych wydatków. Ma starczyć na kilka miesięcy. Nie trzymaj go w ryzykownych akcjach. Ma być pod ręką, a nie rosnąć jak najszybciej.",
        },
        {
          title: "Od czego zacząć",
          body: "Jak 3 do 6 miesięcy wydaje się za dużo, zacznij od jednego miesiąca niezbędnych wydatków. To już łapie sporo zwykłych niespodzianek. Potem dołóż kolejny miesiąc. Okrągła kwota z powietrza, bez Twoich prawdziwych rachunków, to słaby pierwszy cel.",
        },
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
    },
    "/quiz?topic=emergency",
  ),
  "long-term-investing": lesson(
    { en: "Long-Term Investing Basics", pl: "Podstawy długoterminowego inwestowania", ja: "長期投資の基本" },
    {
      en: [
        {
          title: "Compound interest",
          body: "Compound interest is interest earned on the original amount and on the interest already added. The balance grows, and the next round of interest uses that larger balance. It is not a bank fee, and it is not limited to credit cards. Over many years the added interest becomes a large part of the total.",
        },
        {
          title: "Diversification",
          body: "Diversification means spreading money across different assets so one loss does not sink the plan. One stock, even a strong one, is a single bet. Bonds alone are not a full mix. The aim is lower risk, not a new portfolio every week.",
        },
        {
          title: "Index funds",
          body: "An index fund tracks a market list automatically and charges a low fee. An ETF can do the same. A hedge fund and a venture fund are different products with higher costs. The low fee stays invested instead of being paid away.",
        },
        {
          title: "What an ETF is",
          body: "An ETF is an exchange-traded fund: a basket of assets you can buy and sell like a stock. It is not a savings account and not a transfer fee. One purchase can hold many companies or bonds. You get a mix without picking each piece yourself.",
        },
        {
          title: "Time in the market",
          body: "For long-term investors, staying invested has tended to beat buying the exact low and selling the exact high. Selling after a drop often misses the recovery. Gold alone is not the strategy these studies point to. Time in the market means remaining invested through ordinary ups and downs.",
        },
      ],
      pl: [
        {
          title: "Procent składany",
          body: "Procent składany to odsetki od kapitału i od odsetek, które już doszły. Saldo rośnie, więc kolejne odsetki liczą się od większej kwoty. To nie opłata banku za wcześniejszą wypłatę i nie chodzi tylko o karty. Po latach te dopisane odsetki robią sporą część całej sumy.",
        },
        {
          title: "Dywersyfikacja",
          body: "Dywersyfikacja to rozłożenie pieniędzy na różne aktywa, żeby jedna wpadka nie zniszczyła planu. Jedna akcja, nawet mocna, to jeden zakład. Same obligacje też nie wystarczą. Chodzi o mniejsze ryzyko, a nie o nowy portfel co tydzień.",
        },
        {
          title: "Fundusze indeksowe",
          body: "Fundusz indeksowy sam śledzi indeks rynkowy i bierze niską opłatę. ETF robi to samo. Fundusz hedgingowy i fundusz venture capital to co innego i kosztują więcej. Niska opłata zostaje w inwestycji, zamiast iść do pośrednika.",
        },
        {
          title: "Czym jest ETF",
          body: "ETF to fundusz notowany na giełdzie: koszyk aktywów, który kupujesz i sprzedajesz jak akcję. To nie konto oszczędnościowe i nie opłata za przelew. W jednym zakupie masz wiele firm albo obligacji. Nie musisz wybierać każdej z osobna.",
        },
        {
          title: "Czas na rynku",
          body: "Jak inwestujesz na lata, lepiej zostać na rynku niż zgadywać dokładny dołek i szczyt. Sprzedaż tuż po spadku często omija odbicie. Samo złoto nie jest tą strategią. Chodzi o to, żeby zostać w inwestycji przez zwykłe wzrosty i spadki.",
        },
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
    },
    "/quiz?topic=investing",
  ),
  retirement: lesson(
    { en: "Retirement and Future Security", pl: "Emerytura i bezpieczeństwo przyszłości", ja: "退職と将来の安心" },
    {
      en: [
        {
          title: "Why the account exists",
          body: "A retirement account is meant to replace income after you stop working. Money put in can compound for decades before you spend it. It is not a vacation fund or a place for emergency cash. The long wait is what makes the compounding useful.",
        },
        {
          title: "Starting early",
          body: "A small monthly amount has a long time to compound if you start young. About $200 a month at a 7% yearly return, from age 25 to 65, grows to around $525,000. The same habit started much later needs a much larger payment to catch up. The early years do a large share of the work.",
        },
      ],
      pl: [
        {
          title: "Po co jest to konto",
          body: "Konto emerytalne ma zastąpić dochód, gdy przestaniesz pracować. Pieniądze leżą tam latami i przez ten czas pracuje procent składany. To nie fundusz na wakacje i nie miejsce na gotówkę awaryjną. Właśnie ten długi czas daje procentowi składanemu szansę zadziałać.",
        },
        {
          title: "Wczesny start",
          body: "Jak zaczniesz młodo, nawet niewielka kwota co miesiąc ma dużo czasu, żeby rosnąć. Około 200 dolarów miesięcznie przy 7% rocznie, od 25. do 65. roku życia, daje około 525 tysięcy dolarów. Ten sam nawyk zaczęty dużo później wymaga dużo większej wpłaty, żeby to dogonić. Najwięcej robią właśnie pierwsze lata.",
        },
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
    },
    "/quiz?topic=retirement",
  ),
  "family-plan": lesson(
    { en: "Family Financial Plan", pl: "Rodzinny plan finansowy", ja: "家族の資金計画" },
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
    },
    "/quiz?topic=family",
  ),
};
