import type { Locale } from "@/lib/i18n";

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

export const moneyMindsetLesson: Record<Locale, LessonCopy> = {
  en: {
    title: "Money Mindset",
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    next: "Next",
    quiz: "Take the quiz",
    steps: [
      {
        title: "Net worth",
        body: "Net worth is what you own minus what you owe. A paycheck shows money coming in. Net worth shows whether you are getting ahead. Savings and a home count as assets, and loans and card balances count as debts.",
      },
      {
        title: "Lifestyle inflation",
        body: "Lifestyle inflation means you spend more as you earn more, so savings stay flat. A raise can vanish into higher rent, nicer meals, or a new subscription. The extra money arrives, then the extra spending uses it up. Saving the raise before you get used to it keeps the gain.",
      },
      {
        title: "Pay yourself first",
        body: "Pay yourself first means moving a set amount into savings as soon as you are paid. Do that before rent, food, and everything else. Waiting to save what is left usually leaves nothing. An automatic transfer on payday makes the habit happen without a fresh decision.",
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
        body: "Wartość netto to majątek minus długi. Pensja pokazuje, ile pieniędzy wpływa. Wartość netto pokazuje, czy naprawdę idziesz do przodu. Oszczędności i mieszkanie liczą się jako majątek, a kredyty i saldo karty jako długi.",
      },
      {
        title: "Inflacja stylu życia",
        body: "Inflacja stylu życia oznacza, że wydajesz więcej, gdy zarabiasz więcej, a oszczędności stoją w miejscu. Podwyżka znika w wyższym czynszu, lepszych posiłkach albo nowej subskrypcji. Dodatkowe pieniądze przychodzą, a dodatkowe wydatki je zjadają. Odkładanie podwyżki, zanim się do niej przyzwyczaisz, zatrzymuje ten zysk.",
      },
      {
        title: "Najpierw zapłać sobie",
        body: "Najpierw zapłać sobie znaczy, że stałą kwotę odkładasz zaraz po wypłacie. Robisz to przed czynszem, jedzeniem i resztą wydatków. Czekanie na to, co zostanie, zwykle zostawia zero. Automatyczny przelew w dniu wypłaty robi ten nawyk bez nowej decyzji.",
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
};

export const MONEY_MINDSET_QUIZ = "/quiz?topic=mindset";
