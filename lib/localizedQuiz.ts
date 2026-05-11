import type { QuizQuestion } from "@/data/quizQuestions";
import type { Locale } from "@/lib/i18n";

const en: QuizQuestion[] = [
  {
    id: "inflation-basics",
    question: "What does inflation mean?",
    answers: [
      { id: "A", text: "Money buys more over time" },
      { id: "B", text: "Money loses purchasing power over time" },
      { id: "C", text: "Banks give out free money" },
      { id: "D", text: "Prices always go down" },
    ],
    correctAnswer: "B",
    reward: 25,
    successMessage: "Inflation is the silent enemy of unmanaged cash. +25 tokens!",
    retryMessage: "Inflation means money loses purchasing power. The same amount buys less over time.",
    category: "Inflation",
  },
  {
    id: "emergency-fund",
    question: "How many months of expenses should an emergency fund cover?",
    answers: [
      { id: "A", text: "1 week" },
      { id: "B", text: "1 month" },
      { id: "C", text: "3 to 6 months" },
      { id: "D", text: "10 years" },
    ],
    correctAnswer: "C",
    reward: 25,
    successMessage: "3 to 6 months is a safe cushion for job loss or unexpected expenses. +25 tokens!",
    retryMessage: "A practical emergency fund usually covers 3 to 6 months of essential expenses.",
    category: "Emergency Fund",
  },
  {
    id: "saving-habit",
    question: "Which saving habit is most effective?",
    answers: [
      { id: "A", text: "Save whatever is left at the end of the month" },
      { id: "B", text: "Save only when you earn more" },
      { id: "C", text: "Transfer a fixed amount automatically after your paycheck arrives" },
      { id: "D", text: "Keep everything as cash at home" },
    ],
    correctAnswer: "C",
    reward: 25,
    successMessage: "Automatic saving after payday is the strongest habit. +25 tokens!",
    retryMessage: "The most effective habit is an automatic transfer right after income arrives.",
    category: "Saving Habit",
  },
  {
    id: "interest-rates",
    question: "What happens to a variable-rate loan when interest rates rise?",
    answers: [
      { id: "A", text: "Monthly payments go down" },
      { id: "B", text: "Nothing changes" },
      { id: "C", text: "Monthly payments usually go up" },
      { id: "D", text: "The loan disappears" },
    ],
    correctAnswer: "C",
    reward: 25,
    successMessage: "Variable-rate loans usually become more expensive when rates rise. +25 tokens!",
    retryMessage: "Variable-rate loans are linked to market rates, so payments can rise.",
    category: "Credit",
  },
];

const pl: QuizQuestion[] = [
  {
    ...en[0],
    question: "Co oznacza inflacja?",
    answers: [
      { id: "A", text: "Pieniądze kupują więcej z czasem" },
      { id: "B", text: "Pieniądze tracą siłę nabywczą z czasem" },
      { id: "C", text: "Banki rozdają darmowe pieniądze" },
      { id: "D", text: "Ceny zawsze spadają" },
    ],
    successMessage: "Inflacja to cichy przeciwnik gotówki bez planu. +25 tokenów!",
    retryMessage: "Inflacja oznacza, że ta sama kwota kupuje z czasem mniej.",
    category: "Inflacja",
  },
  {
    ...en[1],
    question: "Ile miesięcy wydatków powinien obejmować fundusz awaryjny?",
    answers: [
      { id: "A", text: "1 tydzień" },
      { id: "B", text: "1 miesiąc" },
      { id: "C", text: "3 do 6 miesięcy" },
      { id: "D", text: "10 lat" },
    ],
    successMessage: "3 do 6 miesięcy to rozsądna poduszka na utratę dochodu lub nagłe koszty. +25 tokenów!",
    retryMessage: "Fundusz awaryjny powinien zwykle pokrywać 3 do 6 miesięcy podstawowych wydatków.",
    category: "Fundusz awaryjny",
  },
  {
    ...en[2],
    question: "Który nawyk oszczędzania jest najskuteczniejszy?",
    answers: [
      { id: "A", text: "Odkładać to, co zostanie na koniec miesiąca" },
      { id: "B", text: "Oszczędzać tylko wtedy, gdy zarabiasz więcej" },
      { id: "C", text: "Automatycznie przelewać stałą kwotę po wypłacie" },
      { id: "D", text: "Trzymać wszystko w gotówce w domu" },
    ],
    successMessage: "Automatyczne oszczędzanie po wypłacie to najmocniejszy nawyk. +25 tokenów!",
    retryMessage: "Najskuteczniejszy jest automatyczny przelew zaraz po wpływie dochodu.",
    category: "Nawyk oszczędzania",
  },
  {
    ...en[3],
    question: "Co zwykle dzieje się z kredytem o zmiennej stopie, gdy stopy procentowe rosną?",
    answers: [
      { id: "A", text: "Rata spada" },
      { id: "B", text: "Nic się nie zmienia" },
      { id: "C", text: "Rata zwykle rośnie" },
      { id: "D", text: "Kredyt znika" },
    ],
    successMessage: "Kredyt o zmiennej stopie zwykle robi się droższy, gdy stopy rosną. +25 tokenów!",
    retryMessage: "Kredyty zmienne są powiązane ze stopami rynkowymi, więc rata może wzrosnąć.",
    category: "Kredyt",
  },
];

const es: QuizQuestion[] = [
  {
    ...en[0],
    question: "¿Qué significa inflación?",
    answers: [
      { id: "A", text: "El dinero compra más con el tiempo" },
      { id: "B", text: "El dinero pierde poder adquisitivo con el tiempo" },
      { id: "C", text: "Los bancos regalan dinero" },
      { id: "D", text: "Los precios siempre bajan" },
    ],
    successMessage: "La inflación es el enemigo silencioso del efectivo sin plan. +25 tokens!",
    retryMessage: "Inflación significa que la misma cantidad compra menos con el tiempo.",
    category: "Inflación",
  },
  {
    ...en[1],
    question: "¿Cuántos meses de gastos debería cubrir un fondo de emergencia?",
    answers: [
      { id: "A", text: "1 semana" },
      { id: "B", text: "1 mes" },
      { id: "C", text: "3 a 6 meses" },
      { id: "D", text: "10 años" },
    ],
    successMessage: "3 a 6 meses es una buena protección ante pérdida de ingresos o gastos inesperados. +25 tokens!",
    retryMessage: "Un fondo de emergencia suele cubrir 3 a 6 meses de gastos esenciales.",
    category: "Fondo de emergencia",
  },
  {
    ...en[2],
    question: "¿Qué hábito de ahorro es más eficaz?",
    answers: [
      { id: "A", text: "Ahorrar lo que queda al final del mes" },
      { id: "B", text: "Ahorrar solo cuando ganas más" },
      { id: "C", text: "Transferir una cantidad fija automáticamente al cobrar" },
      { id: "D", text: "Guardar todo en efectivo en casa" },
    ],
    successMessage: "Ahorrar automáticamente al cobrar es el hábito más fuerte. +25 tokens!",
    retryMessage: "El hábito más eficaz es una transferencia automática justo después de recibir ingresos.",
    category: "Ahorro",
  },
  {
    ...en[3],
    question: "¿Qué pasa con un préstamo a tasa variable cuando suben las tasas?",
    answers: [
      { id: "A", text: "La cuota baja" },
      { id: "B", text: "No cambia nada" },
      { id: "C", text: "La cuota normalmente sube" },
      { id: "D", text: "El préstamo desaparece" },
    ],
    successMessage: "Los préstamos variables suelen encarecerse cuando suben las tasas. +25 tokens!",
    retryMessage: "Los préstamos variables dependen de tasas de mercado, por eso la cuota puede subir.",
    category: "Crédito",
  },
];

const fr: QuizQuestion[] = [
  {
    ...es[0],
    question: "Que signifie l'inflation ?",
    answers: [
      { id: "A", text: "L'argent achète plus avec le temps" },
      { id: "B", text: "L'argent perd du pouvoir d'achat avec le temps" },
      { id: "C", text: "Les banques donnent de l'argent gratuit" },
      { id: "D", text: "Les prix baissent toujours" },
    ],
    successMessage: "L'inflation est l'ennemi silencieux de l'argent sans plan. +25 tokens !",
    retryMessage: "L'inflation signifie que la même somme achète moins avec le temps.",
    category: "Inflation",
  },
  {
    ...es[1],
    question: "Combien de mois de dépenses un fonds d'urgence doit-il couvrir ?",
    answers: [
      { id: "A", text: "1 semaine" },
      { id: "B", text: "1 mois" },
      { id: "C", text: "3 à 6 mois" },
      { id: "D", text: "10 ans" },
    ],
    successMessage: "3 à 6 mois est une protection solide contre les imprévus. +25 tokens !",
    retryMessage: "Un fonds d'urgence couvre généralement 3 à 6 mois de dépenses essentielles.",
    category: "Fonds d'urgence",
  },
  {
    ...es[2],
    question: "Quelle habitude d'épargne est la plus efficace ?",
    answers: [
      { id: "A", text: "Épargner ce qui reste à la fin du mois" },
      { id: "B", text: "Épargner seulement quand on gagne plus" },
      { id: "C", text: "Virer automatiquement un montant fixe après le salaire" },
      { id: "D", text: "Garder tout en espèces à la maison" },
    ],
    successMessage: "L'épargne automatique après le salaire est l'habitude la plus forte. +25 tokens !",
    retryMessage: "Le plus efficace est un virement automatique juste après le revenu.",
    category: "Épargne",
  },
  {
    ...es[3],
    question: "Que se passe-t-il pour un prêt à taux variable quand les taux montent ?",
    answers: [
      { id: "A", text: "La mensualité baisse" },
      { id: "B", text: "Rien ne change" },
      { id: "C", text: "La mensualité augmente généralement" },
      { id: "D", text: "Le prêt disparaît" },
    ],
    successMessage: "Les prêts à taux variable deviennent souvent plus chers quand les taux montent. +25 tokens !",
    retryMessage: "Les prêts variables suivent les taux du marché, donc la mensualité peut augmenter.",
    category: "Crédit",
  },
];

const zh: QuizQuestion[] = [
  {
    ...en[0],
    question: "通货膨胀是什么意思？",
    answers: [
      { id: "A", text: "钱会随着时间买到更多东西" },
      { id: "B", text: "钱会随着时间失去购买力" },
      { id: "C", text: "银行免费送钱" },
      { id: "D", text: "价格总是下降" },
    ],
    successMessage: "通货膨胀是没有计划的现金的隐形敌人。+25 代币！",
    retryMessage: "通货膨胀意味着同样的钱随着时间能买到的东西更少。",
    category: "通胀",
  },
  {
    ...en[1],
    question: "应急基金应该覆盖几个月的支出？",
    answers: [
      { id: "A", text: "1 周" },
      { id: "B", text: "1 个月" },
      { id: "C", text: "3 到 6 个月" },
      { id: "D", text: "10 年" },
    ],
    successMessage: "3 到 6 个月可以应对失业或意外支出。+25 代币！",
    retryMessage: "实用的应急基金通常覆盖 3 到 6 个月的必要支出。",
    category: "应急基金",
  },
  {
    ...en[2],
    question: "哪种储蓄习惯最有效？",
    answers: [
      { id: "A", text: "月底剩多少存多少" },
      { id: "B", text: "只有收入更高时才存钱" },
      { id: "C", text: "工资到账后自动转入固定金额" },
      { id: "D", text: "把所有钱都放在家里现金保存" },
    ],
    successMessage: "发薪后自动储蓄是最强的习惯。+25 代币！",
    retryMessage: "最有效的习惯是在收入到账后立即自动储蓄。",
    category: "储蓄习惯",
  },
  {
    ...en[3],
    question: "当利率上升时，浮动利率贷款通常会怎样？",
    answers: [
      { id: "A", text: "月供下降" },
      { id: "B", text: "没有变化" },
      { id: "C", text: "月供通常上升" },
      { id: "D", text: "贷款消失" },
    ],
    successMessage: "利率上升时，浮动利率贷款通常会更贵。+25 代币！",
    retryMessage: "浮动利率贷款与市场利率相关，因此月供可能上升。",
    category: "信贷",
  },
];

const ja: QuizQuestion[] = [
  {
    ...en[0],
    question: "インフレとは何ですか？",
    answers: [
      { id: "A", text: "時間とともにお金で買えるものが増える" },
      { id: "B", text: "時間とともにお金の購買力が下がる" },
      { id: "C", text: "銀行がお金を無料で配る" },
      { id: "D", text: "価格は常に下がる" },
    ],
    successMessage: "インフレは、計画のない現金の静かな敵です。+25 トークン！",
    retryMessage: "インフレとは、同じ金額で買えるものが時間とともに減ることです。",
    category: "インフレ",
  },
  {
    ...en[1],
    question: "緊急資金は何か月分の支出をカバーすべきですか？",
    answers: [
      { id: "A", text: "1 週間" },
      { id: "B", text: "1 か月" },
      { id: "C", text: "3 から 6 か月" },
      { id: "D", text: "10 年" },
    ],
    successMessage: "3 から 6 か月分は、収入減や予期せぬ支出への安全な備えです。+25 トークン！",
    retryMessage: "実用的な緊急資金は通常、3 から 6 か月分の必要支出をカバーします。",
    category: "緊急資金",
  },
  {
    ...en[2],
    question: "最も効果的な貯蓄習慣はどれですか？",
    answers: [
      { id: "A", text: "月末に残った分だけ貯める" },
      { id: "B", text: "収入が増えた時だけ貯める" },
      { id: "C", text: "給料後に固定額を自動で移す" },
      { id: "D", text: "すべて現金で家に置く" },
    ],
    successMessage: "給料後の自動貯蓄が最も強い習慣です。+25 トークン！",
    retryMessage: "最も効果的なのは、収入が入った直後の自動振替です。",
    category: "貯蓄習慣",
  },
  {
    ...en[3],
    question: "金利が上がると変動金利ローンは通常どうなりますか？",
    answers: [
      { id: "A", text: "月々の支払いが下がる" },
      { id: "B", text: "何も変わらない" },
      { id: "C", text: "月々の支払いが上がりやすい" },
      { id: "D", text: "ローンが消える" },
    ],
    successMessage: "金利が上がると、変動金利ローンは通常高くなります。+25 トークン！",
    retryMessage: "変動金利ローンは市場金利に連動するため、支払いが増えることがあります。",
    category: "信用",
  },
];

const hi: QuizQuestion[] = [
  {
    ...en[0],
    question: "मुद्रास्फीति का क्या अर्थ है?",
    answers: [
      { id: "A", text: "समय के साथ पैसा अधिक चीजें खरीदता है" },
      { id: "B", text: "समय के साथ पैसे की क्रय शक्ति घटती है" },
      { id: "C", text: "बैंक मुफ्त पैसा देते हैं" },
      { id: "D", text: "कीमतें हमेशा घटती हैं" },
    ],
    successMessage: "मुद्रास्फीति बिना योजना वाली नकदी की शांत दुश्मन है। +25 टोकन!",
    retryMessage: "मुद्रास्फीति का मतलब है कि वही राशि समय के साथ कम खरीदती है।",
    category: "मुद्रास्फीति",
  },
  {
    ...en[1],
    question: "आपातकालीन फंड कितने महीनों के खर्च को कवर करना चाहिए?",
    answers: [
      { id: "A", text: "1 सप्ताह" },
      { id: "B", text: "1 महीना" },
      { id: "C", text: "3 से 6 महीने" },
      { id: "D", text: "10 साल" },
    ],
    successMessage: "3 से 6 महीने आय रुकने या अचानक खर्च के लिए अच्छा कवच है। +25 टोकन!",
    retryMessage: "आपातकालीन फंड आम तौर पर 3 से 6 महीने के जरूरी खर्च कवर करता है।",
    category: "आपातकालीन फंड",
  },
  {
    ...en[2],
    question: "कौन सी बचत आदत सबसे प्रभावी है?",
    answers: [
      { id: "A", text: "महीने के अंत में जो बचे उसे बचाना" },
      { id: "B", text: "केवल ज्यादा कमाने पर बचत करना" },
      { id: "C", text: "वेतन आते ही तय राशि अपने आप ट्रांसफर करना" },
      { id: "D", text: "सब कुछ घर में नकद रखना" },
    ],
    successMessage: "वेतन के बाद स्वचालित बचत सबसे मजबूत आदत है। +25 टोकन!",
    retryMessage: "सबसे प्रभावी आदत है आय आते ही स्वचालित बचत।",
    category: "बचत",
  },
  {
    ...en[3],
    question: "ब्याज दरें बढ़ने पर परिवर्ती दर वाले ऋण में क्या होता है?",
    answers: [
      { id: "A", text: "मासिक भुगतान घटता है" },
      { id: "B", text: "कुछ नहीं बदलता" },
      { id: "C", text: "मासिक भुगतान आम तौर पर बढ़ता है" },
      { id: "D", text: "ऋण खत्म हो जाता है" },
    ],
    successMessage: "दरें बढ़ने पर परिवर्ती दर वाले ऋण अक्सर महंगे हो जाते हैं। +25 टोकन!",
    retryMessage: "परिवर्ती दर वाले ऋण बाजार दरों से जुड़े होते हैं, इसलिए भुगतान बढ़ सकता है।",
    category: "ऋण",
  },
];

const ptBR: QuizQuestion[] = [
  {
    ...es[0],
    question: "O que significa inflação?",
    answers: [
      { id: "A", text: "O dinheiro compra mais com o tempo" },
      { id: "B", text: "O dinheiro perde poder de compra com o tempo" },
      { id: "C", text: "Bancos dão dinheiro de graça" },
      { id: "D", text: "Os preços sempre caem" },
    ],
    successMessage: "A inflação é a inimiga silenciosa do dinheiro sem plano. +25 tokens!",
    retryMessage: "Inflação significa que a mesma quantia compra menos com o tempo.",
    category: "Inflação",
  },
  {
    ...es[1],
    question: "Quantos meses de despesas um fundo de emergência deve cobrir?",
    answers: [
      { id: "A", text: "1 semana" },
      { id: "B", text: "1 mês" },
      { id: "C", text: "3 a 6 meses" },
      { id: "D", text: "10 anos" },
    ],
    successMessage: "3 a 6 meses protegem contra perda de renda ou despesas inesperadas. +25 tokens!",
    retryMessage: "Um fundo de emergência costuma cobrir 3 a 6 meses de despesas essenciais.",
    category: "Fundo de emergência",
  },
  {
    ...es[2],
    question: "Qual hábito de poupança é mais eficaz?",
    answers: [
      { id: "A", text: "Guardar o que sobra no fim do mês" },
      { id: "B", text: "Guardar só quando ganhar mais" },
      { id: "C", text: "Transferir automaticamente um valor fixo ao receber" },
      { id: "D", text: "Manter tudo em dinheiro em casa" },
    ],
    successMessage: "Poupar automaticamente ao receber é o hábito mais forte. +25 tokens!",
    retryMessage: "O hábito mais eficaz é uma transferência automática logo após receber a renda.",
    category: "Poupança",
  },
  {
    ...es[3],
    question: "O que acontece com um empréstimo de taxa variável quando os juros sobem?",
    answers: [
      { id: "A", text: "A parcela diminui" },
      { id: "B", text: "Nada muda" },
      { id: "C", text: "A parcela geralmente aumenta" },
      { id: "D", text: "O empréstimo desaparece" },
    ],
    successMessage: "Empréstimos variáveis costumam ficar mais caros quando os juros sobem. +25 tokens!",
    retryMessage: "Eles acompanham taxas de mercado, então a parcela pode subir.",
    category: "Crédito",
  },
];

const tr: QuizQuestion[] = [
  {
    ...en[0],
    question: "Enflasyon ne demektir?",
    answers: [
      { id: "A", text: "Para zamanla daha fazla şey satın alır" },
      { id: "B", text: "Para zamanla satın alma gücünü kaybeder" },
      { id: "C", text: "Bankalar ücretsiz para verir" },
      { id: "D", text: "Fiyatlar her zaman düşer" },
    ],
    successMessage: "Enflasyon, plansız nakdin sessiz düşmanıdır. +25 token!",
    retryMessage: "Enflasyon aynı paranın zamanla daha az şey satın almasıdır.",
    category: "Enflasyon",
  },
  {
    ...en[1],
    question: "Acil durum fonu kaç aylık gideri karşılamalıdır?",
    answers: [
      { id: "A", text: "1 hafta" },
      { id: "B", text: "1 ay" },
      { id: "C", text: "3 ila 6 ay" },
      { id: "D", text: "10 yıl" },
    ],
    successMessage: "3 ila 6 ay, gelir kaybı veya beklenmeyen giderler için iyi bir tampondur. +25 token!",
    retryMessage: "Acil durum fonu genellikle 3 ila 6 aylık temel giderleri karşılar.",
    category: "Acil durum fonu",
  },
  {
    ...en[2],
    question: "Hangi tasarruf alışkanlığı en etkilidir?",
    answers: [
      { id: "A", text: "Ay sonunda kalan parayı biriktirmek" },
      { id: "B", text: "Sadece daha çok kazanınca biriktirmek" },
      { id: "C", text: "Maaş gelince sabit tutarı otomatik aktarmak" },
      { id: "D", text: "Her şeyi evde nakit tutmak" },
    ],
    successMessage: "Maaştan sonra otomatik tasarruf en güçlü alışkanlıktır. +25 token!",
    retryMessage: "En etkili alışkanlık, gelir gelir gelmez otomatik aktarım yapmaktır.",
    category: "Tasarruf",
  },
  {
    ...en[3],
    question: "Faizler yükselince değişken faizli kredide ne olur?",
    answers: [
      { id: "A", text: "Aylık ödeme düşer" },
      { id: "B", text: "Hiçbir şey değişmez" },
      { id: "C", text: "Aylık ödeme genelde artar" },
      { id: "D", text: "Kredi kaybolur" },
    ],
    successMessage: "Faizler yükselince değişken faizli krediler genelde pahalılaşır. +25 token!",
    retryMessage: "Değişken faizli krediler piyasa faizlerine bağlıdır; ödeme artabilir.",
    category: "Kredi",
  },
];

const questions: Record<Locale, QuizQuestion[]> = {
  en,
  pl,
  ja,
};

export function getQuizQuestions(locale: Locale) {
  return questions[locale] ?? en;
}
