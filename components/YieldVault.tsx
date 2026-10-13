"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { addTokens, getTokenBalance, spendTokens } from "@/lib/tokens";
import {
  daysInVault,
  deposit,
  getVault,
  projectGrowth,
  syncYield,
  withdrawAll,
} from "@/lib/vault";
import type { VaultState, VaultStrategy } from "@/lib/vault";
import { cn } from "@/lib/utils";

const RISK_BADGE: Record<VaultStrategy["risk"], string> = {
  low: "border-success/40 bg-success/10 text-success",
  medium: "border-warning/40 bg-warning/10 text-warning",
  high: "border-attention bg-warning text-text",
};

const VAULT_COPY: LocalizedMap<
  {
    risk: Record<VaultStrategy["risk"], string>;
    strategies: string;
    strategyDescriptions: string[];
    sourceKamino: string;
    sourceFallback: string;
    sourceLoading: string;
    position: string;
    depositTitle: string;
    tokens: string;
    placeholder: string;
    insufficient: string;
    max: string;
    sending: string;
    depositButton: string;
    simulationNotice: string;
    stats: { deposit: string; yield: string; apy: string; days: string };
    lessThanDay: string;
    daysValue: (days: number) => string;
    totalWithdraw: string;
    withdrawing: string;
    withdrawAll: string;
    withdrawComplete: string;
    withdrawMessage: (principal: number, yieldValue: string) => string;
    chartTitle: string;
    currentPosition: string;
    preview: (amount: number) => string;
    noValue: string;
    monthTick: (month: number) => string;
    tooltipValue: string;
    monthLabel: (month: number) => string;
    education: Array<{ title: string; body: string }>;
    poweredTitle: string;
    poweredBody: string;
    openKamino: string;
  }
> = {
  pl: {
    risk: { low: "Niskie ryzyko", medium: "Średnie ryzyko", high: "Wysokie ryzyko" },
    strategies: "Strategie Kamino",
    strategyDescriptions: ["Zysk ze stablecoinów — najniższe ryzyko, przewidywalny zwrot.","Skoncentrowana płynność (LP) — wyższy zysk, ryzyko nietrwałej straty.","LST + dźwignia — najwyższe APY z ryzykiem likwidacji."],
    sourceKamino: "Dane live z Kamino Finance (mainnet)",
    sourceFallback: "Realistyczne przykłady APY (tryb offline)",
    sourceLoading: "Ładowanie danych...",
    position: "Twoja pozycja",
    depositTitle: "Złóż depozyt",
    tokens: "punktów",
    placeholder: "Liczba punktów",
    insufficient: "Niewystarczające saldo",
    max: "MAX",
    sending: "Wysyłanie...",
    depositButton: "Deponuj punkty",
    simulationNotice: "Symulacja DeFi na Solanie. Punkty Coach FI to waluta edukacyjna, nie kryptowaluta.",
    stats: { deposit: "Depozyt", yield: "Yield", apy: "APY", days: "Dni w vault" },
    lessThanDay: "<1 dzień",
    daysValue: (days) => `${days.toFixed(1)} dni`,
    totalWithdraw: "Razem do wypłaty",
    withdrawing: "Wypłacanie...",
    withdrawAll: "Wypłać wszystko",
    withdrawComplete: "Wypłata zakończona",
    withdrawMessage: (principal, yieldValue) => `${principal} CFI (depozyt) + ${yieldValue} CFI (yield) wróciło na saldo.`,
    chartTitle: "Projekcja wzrostu (12 miesięcy)",
    currentPosition: "aktualna pozycja",
    preview: (amount) => `${amount} CFI podgląd`,
    noValue: "-",
    monthTick: (month) => `M${month}`,
    tooltipValue: "Wartość",
    monthLabel: (month) => `Miesiąc ${month}`,
    education: [
      {
        title: "Czym jest APY?",
        body: "Annual Percentage Yield to roczna stopa zwrotu uwzględniająca procent składany. Vault generuje yield codziennie.",
      },
      {
        title: "Procent składany",
        body: "Zarobiony yield trafia z powrotem do depozytu i sam generuje kolejny yield. Każdy dzień to niewielki, ale kumulujący się efekt.",
      },
      {
        title: "Ryzyko DeFi",
        body: "Vaulty mogą tracić wartość przez zmienność aktywów, błędy smart kontraktów lub nietrwałą stratę.",
      },
    ],
    poweredTitle: "Powered by Kamino Finance",
    poweredBody:
      "Kamino to wiodący protokół yield na Solanie z $1B+ TVL. Coach FI symuluje mechanikę vault w celach edukacyjnych.",
    openKamino: "Otwórz Kamino Finance",
  },
  en: {
    risk: { low: "Low risk", medium: "Medium risk", high: "High risk" },
    strategies: "Kamino strategies",
    strategyDescriptions: ["Stablecoin yield — lowest risk, predictable return.","Concentrated LP — higher yield, risk of impermanent loss.","LST + leverage — highest APY, with liquidation risk."],
    sourceKamino: "Live data from Kamino Finance (mainnet)",
    sourceFallback: "Realistic APY examples (offline mode)",
    sourceLoading: "Loading data...",
    position: "Your position",
    depositTitle: "Make a deposit",
    tokens: "points",
    placeholder: "Point amount",
    insufficient: "Insufficient balance",
    max: "MAX",
    sending: "Sending...",
    depositButton: "Deposit points",
    simulationNotice: "Solana DeFi simulation. Coach FI points are an educational currency, not cryptocurrency.",
    stats: { deposit: "Deposit", yield: "Yield", apy: "APY", days: "Days in vault" },
    lessThanDay: "<1 day",
    daysValue: (days) => `${days.toFixed(1)} days`,
    totalWithdraw: "Total to withdraw",
    withdrawing: "Withdrawing...",
    withdrawAll: "Withdraw all",
    withdrawComplete: "Withdrawal complete",
    withdrawMessage: (principal, yieldValue) => `${principal} CFI deposit + ${yieldValue} CFI yield returned to your balance.`,
    chartTitle: "Growth projection (12 months)",
    currentPosition: "current position",
    preview: (amount) => `${amount} CFI preview`,
    noValue: "-",
    monthTick: (month) => `M${month}`,
    tooltipValue: "Value",
    monthLabel: (month) => `Month ${month}`,
    education: [
      {
        title: "What is APY?",
        body: "Annual Percentage Yield is the yearly return rate including compound interest. The vault generates yield every day.",
      },
      {
        title: "Compound interest",
        body: "Earned yield goes back into the deposit and can generate more yield. Small daily effects can accumulate over time.",
      },
      {
        title: "DeFi risk",
        body: "Vaults can lose value through asset volatility, smart contract bugs or impermanent loss.",
      },
    ],
    poweredTitle: "Powered by Kamino Finance",
    poweredBody:
      "Kamino is a leading Solana yield protocol with $1B+ TVL. Coach FI simulates vault mechanics for education.",
    openKamino: "Open Kamino Finance",
  },
  ja: {
    risk: { low: "低リスク", medium: "中リスク", high: "高リスク" },
    strategies: "Kamino戦略",
    strategyDescriptions: ["ステーブルコインの利回り：最も低いリスクで、見通しやすいリターン。","集中流動性LP：利回りは高めですが、インパーマネントロスのリスクがあります。","LST＋レバレッジ：APYは最も高いものの、清算リスクがあります。"],
    sourceKamino: "Kamino Financeのライブデータ (mainnet)",
    sourceFallback: "現実的なAPY例 (オフライン)",
    sourceLoading: "データを読み込み中...",
    position: "あなたのポジション",
    depositTitle: "入金する",
    tokens: "ポイント",
    placeholder: "ポイント数",
    insufficient: "残高が不足しています",
    max: "最大",
    sending: "送信中...",
    depositButton: "ポイントを入金",
    simulationNotice: "Solana DeFiのシミュレーションです。Coach FIポイントは教育用通貨であり、暗号資産ではありません。",
    stats: { deposit: "入金", yield: "利回り", apy: "APY", days: "vault日数" },
    lessThanDay: "<1日",
    daysValue: (days) => `${days.toFixed(1)}日`,
    totalWithdraw: "引き出し合計",
    withdrawing: "引き出し中...",
    withdrawAll: "すべて引き出す",
    withdrawComplete: "引き出し完了",
    withdrawMessage: (principal, yieldValue) => `${principal} CFI (入金) + ${yieldValue} CFI (利回り) が残高に戻りました。`,
    chartTitle: "成長予測 (12か月)",
    currentPosition: "現在のポジション",
    preview: (amount) => `${amount} CFIプレビュー`,
    noValue: "-",
    monthTick: (month) => `M${month}`,
    tooltipValue: "価値",
    monthLabel: (month) => `${month}か月目`,
    education: [
      {
        title: "APYとは?",
        body: "Annual Percentage Yieldは複利を含む年間利回りです。vaultは毎日yieldを発生させます。",
      },
      {
        title: "複利",
        body: "得られたyieldは入金額に戻り、さらにyieldを生みます。小さな日次効果が積み上がります。",
      },
      {
        title: "DeFiリスク",
        body: "vaultは資産価格の変動、スマートコントラクトのバグ、インパーマネントロスで価値を失う可能性があります。",
      },
    ],
    poweredTitle: "Powered by Kamino Finance",
    poweredBody:
      "KaminoはSolanaの主要yieldプロトコルです。Coach FIは教育目的でvaultの仕組みをシミュレーションします。",
    openKamino: "Kamino Financeを開く",
  },
  es: {
    risk: { low: "Riesgo bajo", medium: "Riesgo medio", high: "Riesgo alto" },
    strategies: "Estrategias de Kamino",
    strategyDescriptions: ["Rendimiento con stablecoins: el riesgo más bajo y un retorno predecible.","LP concentrado: mayor rendimiento, con riesgo de pérdida impermanente.","LST + apalancamiento: el APY más alto, con riesgo de liquidación."],
    sourceKamino: "Datos en vivo de Kamino Finance (mainnet)",
    sourceFallback: "Ejemplos realistas de APY (modo sin conexión)",
    sourceLoading: "Cargando datos...",
    position: "Tu posición",
    depositTitle: "Haz un depósito",
    tokens: "puntos",
    placeholder: "Cantidad de puntos",
    insufficient: "Saldo insuficiente",
    max: "MÁX",
    sending: "Enviando...",
    depositButton: "Depositar puntos",
    simulationNotice: "Simulación de DeFi en Solana. Los puntos Coach FI son una moneda educativa, no una criptomoneda.",
    stats: { deposit: "Depósito", yield: "Rendimiento", apy: "APY", days: "Días en la bóveda" },
    lessThanDay: "<1 día",
    daysValue: (days) => `${days.toFixed(1)} días`,
    totalWithdraw: "Total a retirar",
    withdrawing: "Retirando...",
    withdrawAll: "Retirar todo",
    withdrawComplete: "Retirada completada",
    withdrawMessage: (principal, yieldValue) => `Depósito de ${principal} CFI + ${yieldValue} CFI de rendimiento devueltos a tu saldo.`,
    chartTitle: "Proyección de crecimiento (12 meses)",
    currentPosition: "posición actual",
    preview: (amount) => `Vista previa de ${amount} CFI`,
    noValue: "-",
    monthTick: (month) => `M${month}`,
    tooltipValue: "Valor",
    monthLabel: (month) => `Mes ${month}`,
    education: [
      {
        title: "¿Qué es el APY?",
        body: "El rendimiento porcentual anual (APY) es la tasa de retorno anual incluyendo el interés compuesto. La bóveda genera rendimiento cada día.",
      },
      {
        title: "Interés compuesto",
        body: "El rendimiento ganado vuelve al depósito y puede generar más rendimiento. Los pequeños efectos diarios pueden acumularse con el tiempo.",
      },
      {
        title: "Riesgo DeFi",
        body: "Las bóvedas pueden perder valor por la volatilidad de los activos, errores en los contratos inteligentes o pérdidas impermanentes.",
      },
    ],
    poweredTitle: "Con tecnología de Kamino Finance",
    poweredBody:
      "Kamino es un protocolo de rendimiento líder en Solana con más de 1.000 millones de dólares en TVL. Coach FI simula la mecánica de las bóvedas con fines educativos.",
    openKamino: "Abrir Kamino Finance",
  },
  fr: {
    risk: { low: "Risque faible", medium: "Risque moyen", high: "Risque élevé" },
    strategies: "Stratégies Kamino",
    strategyDescriptions: ["Rendement en stablecoins : le risque le plus faible, un rendement prévisible.","LP concentré : rendement plus élevé, risque de perte impermanente.","LST + effet de levier : l'APY le plus élevé, avec un risque de liquidation."],
    sourceKamino: "Données en direct de Kamino Finance (mainnet)",
    sourceFallback: "Exemples d'APY réalistes (mode hors ligne)",
    sourceLoading: "Chargement des données...",
    position: "Votre position",
    depositTitle: "Effectuer un dépôt",
    tokens: "points",
    placeholder: "Nombre de points",
    insufficient: "Solde insuffisant",
    max: "MAX",
    sending: "Envoi...",
    depositButton: "Déposer des points",
    simulationNotice: "Simulation de DeFi sur Solana. Les points Coach FI sont une monnaie éducative, pas une cryptomonnaie.",
    stats: { deposit: "Dépôt", yield: "Rendement", apy: "APY", days: "Jours dans le coffre" },
    lessThanDay: "<1 jour",
    daysValue: (days) => `${days.toFixed(1)} jours`,
    totalWithdraw: "Total à retirer",
    withdrawing: "Retrait en cours...",
    withdrawAll: "Tout retirer",
    withdrawComplete: "Retrait terminé",
    withdrawMessage: (principal, yieldValue) => `Dépôt de ${principal} CFI + ${yieldValue} CFI de rendement reversés sur votre solde.`,
    chartTitle: "Projection de croissance (12 mois)",
    currentPosition: "position actuelle",
    preview: (amount) => `Aperçu pour ${amount} CFI`,
    noValue: "-",
    monthTick: (month) => `M${month}`,
    tooltipValue: "Valeur",
    monthLabel: (month) => `Mois ${month}`,
    education: [
      {
        title: "Qu'est-ce que l'APY ?",
        body: "Le rendement annuel en pourcentage (APY) est le taux de rendement annuel, intérêts composés inclus. Le coffre génère du rendement chaque jour.",
      },
      {
        title: "Intérêts composés",
        body: "Le rendement gagné revient dans le dépôt et peut générer davantage de rendement. De petits effets quotidiens peuvent s'accumuler avec le temps.",
      },
      {
        title: "Risque DeFi",
        body: "Les coffres peuvent perdre de la valeur en raison de la volatilité des actifs, de bugs dans les contrats intelligents ou de pertes impermanentes.",
      },
    ],
    poweredTitle: "Propulsé par Kamino Finance",
    poweredBody:
      "Kamino est un protocole de rendement majeur sur Solana, avec plus d'un milliard de dollars de TVL. Coach FI simule le fonctionnement des coffres à des fins éducatives.",
    openKamino: "Ouvrir Kamino Finance",
  },
  zh: {
    risk: { low: "低风险", medium: "中等风险", high: "高风险" },
    strategies: "Kamino 策略",
    strategyDescriptions: ["稳定币收益：风险最低，回报可预期。","集中流动性 LP：收益更高，但有无常损失风险。","LST + 杠杆：APY 最高，但有清算风险。"],
    sourceKamino: "来自 Kamino Finance 的实时数据（主网）",
    sourceFallback: "贴近实际的 APY 示例（离线模式）",
    sourceLoading: "正在加载数据...",
    position: "你的持仓",
    depositTitle: "存入",
    tokens: "积分",
    placeholder: "积分数量",
    insufficient: "余额不足",
    max: "最大",
    sending: "发送中...",
    depositButton: "存入积分",
    simulationNotice: "Solana DeFi 模拟。Coach FI 积分是教育用途的货币，不是加密货币。",
    stats: { deposit: "存入", yield: "收益", apy: "APY", days: "在金库中的天数" },
    lessThanDay: "<1 天",
    daysValue: (days) => `${days.toFixed(1)} 天`,
    totalWithdraw: "可取出总额",
    withdrawing: "取出中...",
    withdrawAll: "全部取出",
    withdrawComplete: "取出完成",
    withdrawMessage: (principal, yieldValue) => `已将 ${principal} CFI 本金和 ${yieldValue} CFI 收益退回你的余额。`,
    chartTitle: "增长预测（12 个月）",
    currentPosition: "当前持仓",
    preview: (amount) => `${amount} CFI 预览`,
    noValue: "-",
    monthTick: (month) => `${month}月`,
    tooltipValue: "数值",
    monthLabel: (month) => `第 ${month} 个月`,
    education: [
      {
        title: "什么是 APY？",
        body: "年化收益率（APY）是包含复利在内的年回报率。金库每天都会产生收益。",
      },
      {
        title: "复利",
        body: "获得的收益会回到本金中，并可以产生更多收益。每天的小变化会随时间累积。",
      },
      {
        title: "DeFi 风险",
        body: "金库可能因资产波动、智能合约漏洞或无常损失而贬值。",
      },
    ],
    poweredTitle: "由 Kamino Finance 提供支持",
    poweredBody:
      "Kamino 是 Solana 上领先的收益协议，TVL 超过 10 亿美元。Coach FI 出于教育目的模拟金库的运作机制。",
    openKamino: "打开 Kamino Finance",
  },
  hi: {
    risk: { low: "कम जोखिम", medium: "मध्यम जोखिम", high: "ज़्यादा जोखिम" },
    strategies: "Kamino रणनीतियां",
    strategyDescriptions: ["स्टेबलकॉइन यील्ड: सबसे कम जोखिम, अनुमानित रिटर्न।","कंसन्ट्रेटेड LP: ज़्यादा यील्ड, इम्पर्मानेंट लॉस का जोखिम।","LST + लीवरेज: सबसे ज़्यादा APY, लिक्विडेशन के जोखिम के साथ।"],
    sourceKamino: "Kamino Finance से लाइव डेटा (मेननेट)",
    sourceFallback: "वास्तविक जैसे APY उदाहरण (ऑफ़लाइन मोड)",
    sourceLoading: "डेटा लोड हो रहा है...",
    position: "आपकी पोज़िशन",
    depositTitle: "जमा करें",
    tokens: "पॉइंट",
    placeholder: "पॉइंट की मात्रा",
    insufficient: "अपर्याप्त बैलेंस",
    max: "अधिकतम",
    sending: "भेजा जा रहा है...",
    depositButton: "पॉइंट जमा करें",
    simulationNotice: "Solana DeFi सिमुलेशन। Coach FI पॉइंट एक शैक्षिक मुद्रा हैं, क्रिप्टोकरेंसी नहीं।",
    stats: { deposit: "जमा", yield: "यील्ड", apy: "APY", days: "वॉल्ट में दिन" },
    lessThanDay: "<1 दिन",
    daysValue: (days) => `${days.toFixed(1)} दिन`,
    totalWithdraw: "निकालने के लिए कुल",
    withdrawing: "निकाला जा रहा है...",
    withdrawAll: "सब निकालें",
    withdrawComplete: "निकासी पूरी हुई",
    withdrawMessage: (principal, yieldValue) => `${principal} CFI जमा + ${yieldValue} CFI यील्ड आपके बैलेंस में लौटा दी गई।`,
    chartTitle: "वृद्धि का अनुमान (12 महीने)",
    currentPosition: "मौजूदा पोज़िशन",
    preview: (amount) => `${amount} CFI का प्रीव्यू`,
    noValue: "-",
    monthTick: (month) => `म${month}`,
    tooltipValue: "मूल्य",
    monthLabel: (month) => `महीना ${month}`,
    education: [
      {
        title: "APY क्या है?",
        body: "वार्षिक प्रतिशत यील्ड (APY) चक्रवृद्धि ब्याज सहित सालाना रिटर्न की दर है। वॉल्ट हर दिन यील्ड पैदा करता है।",
      },
      {
        title: "चक्रवृद्धि ब्याज",
        body: "कमाई गई यील्ड वापस जमा में जुड़ती है और आगे और यील्ड पैदा कर सकती है। रोज़ के छोटे असर समय के साथ जमा होते जाते हैं।",
      },
      {
        title: "DeFi जोखिम",
        body: "एसेट की अस्थिरता, स्मार्ट कॉन्ट्रैक्ट की खामियों या इम्पर्मानेंट लॉस की वजह से वॉल्ट का मूल्य घट सकता है।",
      },
    ],
    poweredTitle: "Kamino Finance द्वारा संचालित",
    poweredBody:
      "Kamino Solana का एक अग्रणी यील्ड प्रोटोकॉल है जिसका TVL 1 अरब डॉलर से ज़्यादा है। Coach FI शिक्षा के लिए वॉल्ट के काम करने के तरीके का सिमुलेशन करता है।",
    openKamino: "Kamino Finance खोलें",
  },
  "pt-BR": {
    risk: { low: "Risco baixo", medium: "Risco médio", high: "Risco alto" },
    strategies: "Estratégias da Kamino",
    strategyDescriptions: ["Rendimento em stablecoins: o menor risco, retorno previsível.","LP concentrado: rendimento maior, com risco de perda impermanente.","LST + alavancagem: o maior APY, com risco de liquidação."],
    sourceKamino: "Dados ao vivo da Kamino Finance (mainnet)",
    sourceFallback: "Exemplos realistas de APY (modo offline)",
    sourceLoading: "Carregando dados...",
    position: "Sua posição",
    depositTitle: "Fazer um depósito",
    tokens: "pontos",
    placeholder: "Quantidade de pontos",
    insufficient: "Saldo insuficiente",
    max: "MÁX",
    sending: "Enviando...",
    depositButton: "Depositar pontos",
    simulationNotice: "Simulação de DeFi na Solana. Os pontos Coach FI são uma moeda educacional, não uma criptomoeda.",
    stats: { deposit: "Depósito", yield: "Rendimento", apy: "APY", days: "Dias no cofre" },
    lessThanDay: "<1 dia",
    daysValue: (days) => `${days.toFixed(1)} dias`,
    totalWithdraw: "Total a sacar",
    withdrawing: "Sacando...",
    withdrawAll: "Sacar tudo",
    withdrawComplete: "Saque concluído",
    withdrawMessage: (principal, yieldValue) => `Depósito de ${principal} CFI + ${yieldValue} CFI de rendimento devolvidos ao seu saldo.`,
    chartTitle: "Projeção de crescimento (12 meses)",
    currentPosition: "posição atual",
    preview: (amount) => `Prévia de ${amount} CFI`,
    noValue: "-",
    monthTick: (month) => `M${month}`,
    tooltipValue: "Valor",
    monthLabel: (month) => `Mês ${month}`,
    education: [
      {
        title: "O que é APY?",
        body: "O rendimento percentual anual (APY) é a taxa de retorno anual incluindo os juros compostos. O cofre gera rendimento todos os dias.",
      },
      {
        title: "Juros compostos",
        body: "O rendimento ganho volta para o depósito e pode gerar mais rendimento. Pequenos efeitos diários podem se acumular com o tempo.",
      },
      {
        title: "Risco DeFi",
        body: "Os cofres podem perder valor por causa da volatilidade dos ativos, de falhas em contratos inteligentes ou de perda impermanente.",
      },
    ],
    poweredTitle: "Com tecnologia Kamino Finance",
    poweredBody:
      "A Kamino é um dos principais protocolos de rendimento da Solana, com mais de US$ 1 bilhão em TVL. O Coach FI simula a mecânica dos cofres para fins educacionais.",
    openKamino: "Abrir a Kamino Finance",
  },
  tr: {
    risk: { low: "Düşük risk", medium: "Orta risk", high: "Yüksek risk" },
    strategies: "Kamino stratejileri",
    strategyDescriptions: ["Stablecoin getirisi: en düşük risk, öngörülebilir getiri.","Yoğunlaştırılmış LP: daha yüksek getiri, kalıcı olmayan kayıp riski.","LST + kaldıraç: en yüksek APY, likidasyon riskiyle."],
    sourceKamino: "Kamino Finance'ten canlı veri (mainnet)",
    sourceFallback: "Gerçekçi APY örnekleri (çevrimdışı mod)",
    sourceLoading: "Veriler yükleniyor...",
    position: "Pozisyonun",
    depositTitle: "Yatırım yap",
    tokens: "puan",
    placeholder: "Puan miktarı",
    insufficient: "Yetersiz bakiye",
    max: "MAKS",
    sending: "Gönderiliyor...",
    depositButton: "Puan yatır",
    simulationNotice: "Solana DeFi simülasyonu. Coach FI puanları bir eğitim para birimidir, kripto para değildir.",
    stats: { deposit: "Yatırılan", yield: "Getiri", apy: "APY", days: "Kasadaki gün" },
    lessThanDay: "<1 gün",
    daysValue: (days) => `${days.toFixed(1)} gün`,
    totalWithdraw: "Çekilecek toplam",
    withdrawing: "Çekiliyor...",
    withdrawAll: "Tümünü çek",
    withdrawComplete: "Çekim tamamlandı",
    withdrawMessage: (principal, yieldValue) => `${principal} CFI yatırım + ${yieldValue} CFI getiri bakiyene iade edildi.`,
    chartTitle: "Büyüme projeksiyonu (12 ay)",
    currentPosition: "mevcut pozisyon",
    preview: (amount) => `${amount} CFI önizlemesi`,
    noValue: "-",
    monthTick: (month) => `${month}. ay`,
    tooltipValue: "Değer",
    monthLabel: (month) => `${month}. ay`,
    education: [
      {
        title: "APY nedir?",
        body: "Yıllık Yüzde Getiri (APY), bileşik getiri dahil yıllık getiri oranıdır. Kasa her gün getiri üretir.",
      },
      {
        title: "Bileşik getiri",
        body: "Kazanılan getiri yatırıma geri eklenir ve daha fazla getiri üretebilir. Küçük günlük etkiler zamanla birikebilir.",
      },
      {
        title: "DeFi riski",
        body: "Kasalar varlık oynaklığı, akıllı sözleşme hataları veya kalıcı olmayan kayıp nedeniyle değer kaybedebilir.",
      },
    ],
    poweredTitle: "Kamino Finance altyapısıyla",
    poweredBody:
      "Kamino, 1 milyar doların üzerinde TVL'ye sahip önde gelen bir Solana getiri protokolüdür. Coach FI, kasa mekaniğini eğitim amacıyla simüle eder.",
    openKamino: "Kamino Finance'i aç",
  },
};

function fmtApy(apy: number) {
  return (apy * 100).toFixed(2) + "% APY";
}

function fmtTvl(tvl?: number) {
  if (!tvl) return "";
  if (tvl >= 1_000_000) return `TVL $${(tvl / 1_000_000).toFixed(1)}M`;
  return `TVL $${(tvl / 1_000).toFixed(0)}K`;
}

export function YieldVault() {
  const { locale } = useLanguage();
  const copy = pickLocalized(VAULT_COPY, locale);
  const [strategies, setStrategies] = useState<VaultStrategy[]>([]);
  const [source, setSource] = useState("loading");
  const [selected, setSelected] = useState<VaultStrategy | null>(null);
  const [vault, setVault] = useState<VaultState | null>(null);
  const [balance, setBalance] = useState(0);
  const [depositInput, setDepositInput] = useState("");
  const [busy, setBusy] = useState<"deposit" | "withdraw" | null>(null);
  const [withdrawResult, setWithdrawResult] = useState<{ principal: number; yield: number } | null>(null);

  const refreshBalance = useCallback(() => setBalance(getTokenBalance()), []);

  useEffect(() => {
    refreshBalance();
    const v = getVault();
    if (v) setVault(syncYield(v));

    const onTokens = () => refreshBalance();
    window.addEventListener("coachfi-tokens", onTokens);
    window.addEventListener("storage", onTokens);
    return () => {
      window.removeEventListener("coachfi-tokens", onTokens);
      window.removeEventListener("storage", onTokens);
    };
  }, [refreshBalance]);

  // Auto-sync yield every 30 s
  useEffect(() => {
    const id = setInterval(() => {
      setVault((prev) => (prev ? syncYield(prev) : prev));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/vault")
      .then((r) => r.json())
      .then((data: { strategies: VaultStrategy[]; source: string }) => {
        setStrategies(data.strategies);
        setSource(data.source);
        setSelected(data.strategies[0] ?? null);
      })
      .catch(() => setSource("error"));
  }, []);

  async function handleDeposit() {
    const amount = parseInt(depositInput, 10);
    if (!selected || isNaN(amount) || amount < 1 || amount > balance) return;
    setBusy("deposit");
    await new Promise((r) => setTimeout(r, 700));
    spendTokens(amount);
    const newVault = deposit(amount, selected);
    setVault(newVault);
    setBalance(getTokenBalance());
    setDepositInput("");
    setBusy(null);
  }

  async function handleWithdraw() {
    if (!vault) return;
    setBusy("withdraw");
    await new Promise((r) => setTimeout(r, 900));
    const synced = syncYield(vault);
    const result = withdrawAll(synced);
    addTokens(Math.floor(result.principal + result.yield));
    setVault(null);
    setBalance(getTokenBalance());
    setWithdrawResult(result);
    setBusy(null);
    setTimeout(() => setWithdrawResult(null), 7000);
  }

  const previewAmount = parseInt(depositInput, 10);
  const chartPrincipal = vault
    ? vault.depositedAmount + vault.accruedYield
    : isNaN(previewAmount)
      ? 100
      : previewAmount;
  const chartData = selected ? projectGrowth(chartPrincipal, selected.apy, 12) : [];

  const days = vault ? daysInVault(vault) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      {/* Left: strategies + position */}
      <div className="flex flex-col gap-4">
        {/* Strategy selector */}
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
          <h2 className="mb-1 flex items-center gap-2 text-base font-black text-text">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            {copy.strategies}
          </h2>
          <p className="mb-4 text-xs font-semibold text-muted">
            {source === "kamino"
              ? copy.sourceKamino
              : source === "fallback"
                ? copy.sourceFallback
                : copy.sourceLoading}
          </p>

          <div className="space-y-2">
            {source === "loading"
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-primary/5" />
                ))
              : strategies.map((s, index) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!!vault}
                    onClick={() => setSelected(s)}
                    className={cn(
                      "w-full rounded-xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      selected?.id === s.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-primary/12 bg-white hover:border-primary/30 hover:bg-primary/3",
                      vault && "cursor-default opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-text">{s.name}</span>
                      <span className="text-sm font-black text-primary">{fmtApy(s.apy)}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase",
                          RISK_BADGE[s.risk]
                        )}
                      >
                        {copy.risk[s.risk]}
                      </span>
                      <span className="text-[10px] font-semibold text-muted">{s.protocol}</span>
                      {s.tvl && (
                        <span className="text-[10px] font-semibold text-muted">{fmtTvl(s.tvl)}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs font-semibold leading-5 text-muted">{copy.strategyDescriptions[index] ?? s.description}</p>
                  </button>
                ))}
          </div>
        </div>

        {/* Deposit / Position */}
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-black text-text">
              {vault ? copy.position : copy.depositTitle}
            </h2>
            <span className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-black text-primary">
              {balance} {copy.tokens}
            </span>
          </div>

          {!vault ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={balance}
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  placeholder={copy.placeholder}
                  className="min-h-11 flex-1 rounded-input border-2 border-border bg-white px-4 text-sm font-bold text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-11 px-3 text-xs"
                  onClick={() => setDepositInput(String(balance))}
                >
                  {copy.max}
                </Button>
              </div>
              {depositInput && parseInt(depositInput) > balance && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {copy.insufficient}
                </p>
              )}
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={
                  busy === "deposit" ||
                  !selected ||
                  isNaN(parseInt(depositInput)) ||
                  parseInt(depositInput) < 1 ||
                  parseInt(depositInput) > balance
                }
                onClick={handleDeposit}
              >
                {busy === "deposit" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.sending}
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4" />
                    {copy.depositButton}
                  </>
                )}
              </Button>
              <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-5 text-muted">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {copy.simulationNotice}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Stat label={copy.stats.deposit} value={`${vault.depositedAmount} CFI`} />
                <Stat label={copy.stats.yield} value={`+${vault.accruedYield.toFixed(4)} CFI`} highlight />
                <Stat label={copy.stats.apy} value={fmtApy(vault.strategyApy)} />
                <Stat label={copy.stats.days} value={days < 1 ? copy.lessThanDay : copy.daysValue(days)} />
              </div>
              <div className="rounded-xl border border-success/20 bg-success/5 p-3">
                <p className="text-xs font-bold text-muted">{copy.totalWithdraw}</p>
                <p className="mt-0.5 text-2xl font-black text-text">
                  {(vault.depositedAmount + vault.accruedYield).toFixed(2)}{" "}
                  <span className="text-sm font-bold text-muted">CFI</span>
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full"
                disabled={busy === "withdraw"}
                onClick={handleWithdraw}
              >
                {busy === "withdraw" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.withdrawing}
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="h-4 w-4" />
                    {copy.withdrawAll}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Withdraw success */}
          <AnimatePresence>
            {withdrawResult && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-xs font-black text-text">{copy.withdrawComplete}</p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    {copy.withdrawMessage(withdrawResult.principal, withdrawResult.yield.toFixed(4))}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: chart + education */}
      <div className="flex flex-col gap-4">
        {/* Growth chart */}
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-text">{copy.chartTitle}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {selected ? fmtApy(selected.apy) : copy.noValue} ·{" "}
                {vault ? copy.currentPosition : copy.preview(isNaN(previewAmount) ? 100 : previewAmount)}
              </p>
            </div>
            {source === "kamino" && (
              <a
                href="https://app.kamino.finance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1.5 text-[10px] font-black text-primary transition hover:bg-primary/10"
              >
                Kamino Finance
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cf-chart-1)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--cf-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickFormatter={(m) => copy.monthTick(Number(m))}
                tick={{ fontSize: 10, fontWeight: 700, fill: "var(--cf-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontWeight: 700, fill: "var(--cf-text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} CFI`, copy.tooltipValue]}
                labelFormatter={(m) => copy.monthLabel(Number(m))}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid var(--cf-border-subtle)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--cf-chart-1)"
                strokeWidth={2.5}
                fill="url(#vaultGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Education cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {copy.education.map((card) => (
            <EducationCard key={card.title} title={card.title} body={card.body} />
          ))}
        </div>

        {/* Kamino attribution */}
        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/3 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-text">{copy.poweredTitle}</p>
            <p className="mt-0.5 text-[11px] font-semibold leading-5 text-muted">
              {copy.poweredBody}
            </p>
          </div>
          <a
            href="https://app.kamino.finance"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-primary/15 p-2 text-primary transition hover:bg-primary/10"
            aria-label={copy.openKamino}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-primary/3 p-2.5">
      <p className="text-[10px] font-bold uppercase text-muted">{label}</p>
      <p className={cn("mt-0.5 text-sm font-black", highlight ? "text-success" : "text-text")}>
        {value}
      </p>
    </div>
  );
}

function EducationCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-soft">
      <p className="text-xs font-black text-primary">{title}</p>
      <p className="mt-1.5 text-xs font-semibold leading-5 text-muted">{body}</p>
    </div>
  );
}
