import type { LocalizedMap } from "@/lib/i18n";

export interface LessonStep {
  title: string;
  body: string;
}

export interface LessonCopy {
  title: string;
  stepLabel: (current: number, total: number) => string;
  next: string;
  quiz: string;
  steps: LessonStep[];
}

export const moneyMindsetLesson: LocalizedMap<LessonCopy> = {
  en: {
    title: "Money Mindset",
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    next: "Next",
    quiz: "Take the quiz",
    steps: [
      {
        title: "Net worth",
        body: "Net worth is the value of your assets (what you own) minus your liabilities (what you owe), measured on the same date. Income and expenses are flows over a period; net worth is a balance at one point in time. Assets of PLN 5,000 minus liabilities of PLN 2,000 give a net worth of PLN 3,000. A home can be an asset, but its value is not immediately available to pay a bill. Net worth is not your value as a person or a full picture of liquidity — whether money is available for current payments.",
      },
      {
        title: "Lifestyle inflation",
        body: "Lifestyle inflation means choosing more discretionary spending on a higher standard of living as income rises, for example an extra entertainment subscription. Higher food prices, necessary healthcare or changes in essential housing costs are different: more spending does not always mean a lifestyle choice. After a raise, review needs, commitments and optional spending. If a surplus remains, you can choose to save part of it. You do not have to save the entire raise.",
      },
      {
        title: "Pay yourself first",
        body: "Pay yourself first means planning savings before discretionary spending, not before basic needs. First reserve money for rent, food, essential bills and required minimum debt payments until your next reasonably expected income. Only then choose an amount to save from the available surplus. With irregular income, review this after each payment; with no surplus, do not make a transfer. That is not a failure. An automatic transfer is an option with stable income and a checked balance, not a requirement.",
      },
    ],
  },
  pl: {
    title: "Nastawienie do pieniędzy",
    stepLabel: (current, total) => `Krok ${current} z ${total}`,
    next: "Dalej",
    quiz: "Rozwiąż quiz",
    steps: [
      {
        title: "Wartość netto",
        body: "Wartość netto to wartość aktywów (tego, co posiadasz) minus zobowiązania (to, co jesteś winien), policzona na ten sam dzień. Dochody i wydatki są przepływami za okres, a wartość netto jest stanem na dany dzień. Aktywa 5 000 zł minus zobowiązania 2 000 zł dają wartość netto 3 000 zł. Mieszkanie może być aktywem, ale jego wartości nie da się od razu użyć do zapłaty rachunku. Wartość netto nie jest oceną człowieka ani pełnym obrazem płynności — tego, czy masz środki na bieżące płatności.",
      },
      {
        title: "Inflacja stylu życia",
        body: "Inflacja stylu życia to dobrowolne zwiększanie wydatków na wyższy standard życia wraz ze wzrostem dochodu, np. dodatkowa subskrypcja rozrywkowa. Wyższe ceny jedzenia, konieczne leczenie lub zmiana niezbędnych kosztów mieszkania to co innego: większe wydatki nie zawsze są wyborem stylu życia. Po podwyżce sprawdź potrzeby, zobowiązania i wydatki uznaniowe. Jeśli zostaje nadwyżka, możesz zdecydować o odłożeniu jej części. Nie musisz oszczędzać całej podwyżki.",
      },
      {
        title: "Najpierw zapłać sobie",
        body: "Najpierw zapłać sobie oznacza planowanie oszczędności przed wydatkami uznaniowymi, nie przed podstawowymi potrzebami. Najpierw zabezpiecz pieniądze na czynsz, jedzenie, konieczne rachunki i wymagane minimalne spłaty długu do kolejnego realnie oczekiwanego wpływu. Dopiero z dostępnej nadwyżki wybierz kwotę do odłożenia. Przy nieregularnym dochodzie sprawdzaj ją po każdym wpływie; przy zerowej nadwyżce nie rób przelewu. To nie porażka. Przelew automatyczny jest opcją przy stabilnych wpływach i sprawdzonym saldzie, nie obowiązkiem.",
      },
    ],
  },
  ja: {
    title: "お金の考え方",
    stepLabel: (current, total) => `ステップ ${current} / ${total}`,
    next: "次へ",
    quiz: "クイズへ進む",
    steps: [
      {
        title: "純資産",
        body: "純資産は、持っているものから借りているものを引いた額です。給料は入ってくるお金を示します。純資産は、前に進んでいるかを示します。貯金や家は資産で、ローンやカードの残高は借金です。",
      },
      {
        title: "生活水準のインフレ",
        body: "生活水準のインフレは、収入が増えるほど支出も増え、貯金が変わらないことです。昇給は、高い家賃や良い食事や新しい契約に消えます。増えたお金は入ってきても、増えた支出が使い切ります。慣れる前に昇給分を先に貯めると、その分が残ります。",
      },
      {
        title: "先に自分へ払う",
        body: "先に自分へ払うとは、給料が入ったら決めた額を先に貯金へ移すことです。家賃や食費より前にします。残りを貯めようと待つと、たいてい何も残りません。給料日の自動振込なら、毎月決め直さなくても習慣になります。",
      },
    ],
  },
  es: {
    title: "Mentalidad financiera",
    stepLabel: (current, total) => `Paso ${current} de ${total}`,
    next: "Siguiente",
    quiz: "Hacer el quiz",
    steps: [
      {
        title: "Patrimonio neto",
        body: "El patrimonio neto es lo que tienes menos lo que debes. La nómina muestra el dinero que entra. El patrimonio neto muestra si estás avanzando. Los ahorros y una vivienda cuentan como activos; los préstamos y los saldos de las tarjetas cuentan como deudas.",
      },
      {
        title: "Inflación del estilo de vida",
        body: "La inflación del estilo de vida significa que gastas más a medida que ganas más, así que tus ahorros no crecen. Un aumento de sueldo puede esfumarse en un alquiler más alto, mejores comidas o una nueva suscripción. Llega el dinero extra y el gasto extra se lo come. Ahorrar el aumento antes de acostumbrarte a él conserva la ganancia.",
      },
      {
        title: "Págate primero",
        body: "Pagarte primero significa mover una cantidad fija al ahorro en cuanto cobras. Hazlo antes del alquiler, la comida y todo lo demás. Esperar a ahorrar lo que sobre suele dejar nada. Una transferencia automática el día de cobro hace que el hábito ocurra sin tener que decidirlo cada vez.",
      },
    ],
  },
  fr: {
    title: "État d'esprit financier",
    stepLabel: (current, total) => `Étape ${current} sur ${total}`,
    next: "Suivant",
    quiz: "Passer le quiz",
    steps: [
      {
        title: "Patrimoine net",
        body: "Le patrimoine net, c'est ce que vous possédez moins ce que vous devez. Un salaire montre l'argent qui entre. Le patrimoine net montre si vous avancez. L'épargne et un logement comptent comme des actifs ; les prêts et les soldes de carte comptent comme des dettes.",
      },
      {
        title: "Inflation du train de vie",
        body: "L'inflation du train de vie signifie que vous dépensez plus à mesure que vous gagnez plus, si bien que l'épargne stagne. Une augmentation peut disparaître dans un loyer plus élevé, de meilleurs repas ou un nouvel abonnement. L'argent supplémentaire arrive, puis les dépenses supplémentaires l'absorbent. Épargner l'augmentation avant de vous y habituer préserve le gain.",
      },
      {
        title: "Se payer en premier",
        body: "Se payer en premier, c'est transférer un montant fixe vers l'épargne dès que vous êtes payé. Faites-le avant le loyer, la nourriture et tout le reste. Attendre d'épargner ce qui reste ne laisse généralement rien. Un virement automatique le jour de la paie installe l'habitude sans nouvelle décision à prendre.",
      },
    ],
  },
  zh: {
    title: "金钱心态",
    stepLabel: (current, total) => `第 ${current} 步，共 ${total} 步`,
    next: "下一步",
    quiz: "参加测验",
    steps: [
      {
        title: "净资产",
        body: "净资产是你拥有的减去你欠下的。工资显示的是进来的钱。净资产显示的是你是否在向前走。储蓄和房产算资产，贷款和信用卡欠款算负债。",
      },
      {
        title: "生活方式膨胀",
        body: "生活方式膨胀是指赚得越多花得越多，所以储蓄原地不动。加薪可能消失在更高的房租、更好的餐食或新的订阅里。多出来的钱到账，多出来的开销又把它花掉。在习惯加薪之前先把它存起来，才能留住这份增长。",
      },
      {
        title: "先付给自己",
        body: "先付给自己，就是一发工资就把固定金额转入储蓄。在付房租、买食物和其他一切之前先做这件事。等着存“剩下的钱”，通常什么都剩不下。发薪日的自动转账让这个习惯自动发生，不需要每次重新做决定。",
      },
    ],
  },
  hi: {
    title: "पैसे की सोच",
    stepLabel: (current, total) => `चरण ${current} / ${total}`,
    next: "अगला",
    quiz: "क्विज़ दें",
    steps: [
      {
        title: "नेट वर्थ",
        body: "नेट वर्थ वह है जो आपके पास है, उसमें से जो आप पर बकाया है उसे घटाकर। वेतन आने वाला पैसा दिखाता है। नेट वर्थ दिखाता है कि आप आगे बढ़ रहे हैं या नहीं। बचत और घर संपत्ति गिने जाते हैं; लोन और कार्ड का बकाया कर्ज़ गिना जाता है।",
      },
      {
        title: "जीवनशैली की महंगाई",
        body: "जीवनशैली की महंगाई का मतलब है कि कमाई बढ़ने के साथ खर्च भी बढ़ता है, इसलिए बचत वहीं की वहीं रहती है। वेतन वृद्धि ज़्यादा किराये, बेहतर खाने या नए सब्सक्रिप्शन में गुम हो सकती है। अतिरिक्त पैसा आता है और अतिरिक्त खर्च उसे खा जाता है। वृद्धि की आदत पड़ने से पहले उसे बचा लेना बढ़त को बचाए रखता है।",
      },
      {
        title: "पहले खुद को भुगतान करें",
        body: "पहले खुद को भुगतान करने का मतलब है वेतन मिलते ही एक तय रकम बचत में डाल देना। यह किराये, खाने और बाकी सब से पहले करें। जो बचेगा उसे बचाने का इंतज़ार करने पर अक्सर कुछ नहीं बचता। वेतन के दिन का स्वचालित ट्रांसफ़र बिना नए फ़ैसले के आदत बना देता है।",
      },
    ],
  },
  "pt-BR": {
    title: "Mentalidade financeira",
    stepLabel: (current, total) => `Passo ${current} de ${total}`,
    next: "Próximo",
    quiz: "Fazer o quiz",
    steps: [
      {
        title: "Patrimônio líquido",
        body: "Patrimônio líquido é o que você tem menos o que você deve. O salário mostra o dinheiro que entra. O patrimônio líquido mostra se você está avançando. Poupança e imóvel contam como ativos; empréstimos e faturas de cartão contam como dívidas.",
      },
      {
        title: "Inflação do estilo de vida",
        body: "Inflação do estilo de vida é gastar mais à medida que você ganha mais, de modo que a poupança não cresce. Um aumento pode sumir em um aluguel mais caro, refeições melhores ou uma nova assinatura. O dinheiro extra chega e o gasto extra o consome. Poupar o aumento antes de se acostumar com ele preserva o ganho.",
      },
      {
        title: "Pague-se primeiro",
        body: "Pagar-se primeiro é transferir um valor fixo para a poupança assim que você recebe. Faça isso antes do aluguel, da comida e de todo o resto. Esperar para poupar o que sobrar costuma não deixar nada. Uma transferência automática no dia do pagamento faz o hábito acontecer sem uma nova decisão.",
      },
    ],
  },
  tr: {
    title: "Para Zihniyeti",
    stepLabel: (current, total) => `Adım ${current} / ${total}`,
    next: "Sonraki",
    quiz: "Quize geç",
    steps: [
      {
        title: "Net varlık",
        body: "Net varlık, sahip oldukların eksi borçlarındır. Maaş, gelen parayı gösterir. Net varlık ise ilerleyip ilerlemediğini gösterir. Birikimler ve ev varlık sayılır; krediler ve kart borçları borç sayılır.",
      },
      {
        title: "Yaşam tarzı enflasyonu",
        body: "Yaşam tarzı enflasyonu, kazandıkça daha fazla harcaman ve birikimin yerinde sayması demektir. Bir zam; daha yüksek kiraya, daha iyi yemeklere veya yeni bir aboneliğe gidebilir. Ek para gelir, ek harcama onu tüketir. Zamma alışmadan önce onu biriktirmek kazancı korur.",
      },
      {
        title: "Önce kendine öde",
        body: "Önce kendine ödemek, maaşını alır almaz belirli bir tutarı birikime aktarmaktır. Bunu kiradan, yemekten ve diğer her şeyden önce yap. Kalanı biriktirmeyi beklemek genellikle geriye bir şey bırakmaz. Maaş gününde otomatik transfer, alışkanlığın her seferinde yeniden karar vermeden gerçekleşmesini sağlar.",
      },
    ],
  },
};

export const MONEY_MINDSET_QUIZ = "/quiz?topic=mindset";
