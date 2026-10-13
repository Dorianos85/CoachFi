"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { YieldVault } from "@/components/YieldVault";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

const vaultPageCopy: LocalizedMap<{ eyebrow: string; title: string; description: string; readText: string }> = {
  pl: {
    eyebrow: "Edukacja DeFi Yield",
    title: "Twoje punkty pracują dla Ciebie.",
    description:
      "Zdeponuj punkty Coach FI, wybierz strategię Kamino i obserwuj, jak yield rośnie w czasie. Tak działają vaulty DeFi na Solanie.",
    readText: "Yield vault na Solanie. Złóż depozyt, wybierz strategię i zobacz procent składany w akcji.",
  },
  en: {
    eyebrow: "DeFi Yield Education",
    title: "Your points work for you.",
    description:
      "Deposit Coach FI points, choose a Kamino strategy and watch yield grow over time. This is how DeFi vaults work on Solana.",
    readText: "Solana yield vault. Make a deposit, choose a strategy and see compound interest in action.",
  },
  ja: {
    eyebrow: "DeFi利回り教育",
    title: "あなたのポイントが働きます。",
    description:
      "Coach FIポイントを預け、Kamino戦略を選び、利回りが時間とともに増える様子を確認します。Solana上のDeFi vaultの仕組みです。",
    readText: "Solanaのyield vault。入金し、戦略を選び、複利の動きを確認します。",
  },
  es: {
    eyebrow: "Educación sobre rendimiento DeFi",
    title: "Tus puntos trabajan para ti.",
    description:
      "Deposita puntos Coach FI, elige una estrategia de Kamino y mira cómo crece el rendimiento con el tiempo. Así funcionan las bóvedas DeFi en Solana.",
    readText: "Bóveda de rendimiento en Solana. Haz un depósito, elige una estrategia y observa el interés compuesto en acción.",
  },
  fr: {
    eyebrow: "Éducation au rendement DeFi",
    title: "Vos points travaillent pour vous.",
    description:
      "Déposez des points Coach FI, choisissez une stratégie Kamino et regardez le rendement croître avec le temps. C'est ainsi que fonctionnent les coffres DeFi sur Solana.",
    readText: "Coffre de rendement Solana. Effectuez un dépôt, choisissez une stratégie et observez les intérêts composés à l'œuvre.",
  },
  zh: {
    eyebrow: "DeFi 收益教育",
    title: "让你的积分为你工作。",
    description:
      "存入 Coach FI 积分，选择一个 Kamino 策略，看收益随时间增长。这就是 Solana 上 DeFi 金库的运作方式。",
    readText: "Solana 收益金库。存入、选择策略，亲眼看看复利的作用。",
  },
  hi: {
    eyebrow: "DeFi यील्ड शिक्षा",
    title: "आपके पॉइंट आपके लिए काम करते हैं।",
    description:
      "Coach FI पॉइंट जमा करें, एक Kamino रणनीति चुनें और समय के साथ यील्ड बढ़ते हुए देखें। Solana पर DeFi वॉल्ट इसी तरह काम करते हैं।",
    readText: "Solana यील्ड वॉल्ट। जमा करें, रणनीति चुनें और चक्रवृद्धि ब्याज को काम करते देखें।",
  },
  "pt-BR": {
    eyebrow: "Educação sobre rendimento DeFi",
    title: "Seus pontos trabalham por você.",
    description:
      "Deposite pontos Coach FI, escolha uma estratégia da Kamino e veja o rendimento crescer com o tempo. É assim que funcionam os cofres DeFi na Solana.",
    readText: "Cofre de rendimento na Solana. Faça um depósito, escolha uma estratégia e veja os juros compostos em ação.",
  },
  tr: {
    eyebrow: "DeFi getiri eğitimi",
    title: "Puanların senin için çalışıyor.",
    description:
      "Coach FI puanlarını yatır, bir Kamino stratejisi seç ve getirinin zamanla büyümesini izle. Solana'daki DeFi kasaları böyle çalışır.",
    readText: "Solana getiri kasası. Yatırım yap, bir strateji seç ve bileşik getiriyi iş başında gör.",
  },
};

export default function VaultPage() {
  const { locale } = useLanguage();
  const copy = pickLocalized(vaultPageCopy, locale);

  return (
    <section aria-labelledby="vault-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />
      <YieldVault />
    </section>
  );
}
