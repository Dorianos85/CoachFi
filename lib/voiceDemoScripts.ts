export type VoiceDemoLocale = "pl" | "en" | "es" | "fr" | "zh" | "ja" | "hi" | "pt-BR" | "tr";

export type VoiceDemoScriptKey =
  | "milaIntro"
  | "financialScore"
  | "inflationWakeUp"
  | "kidsCoach"
  | "certificateUnlock";

export const voiceDemoLanguages = [
  { code: "pl", flag: "🇵🇱", label: "Polski", speechLang: "pl-PL" },
  { code: "en", flag: "🇺🇸", label: "English", speechLang: "en-US" },
  { code: "es", flag: "🇪🇸", label: "Español", speechLang: "es-ES" },
  { code: "fr", flag: "🇫🇷", label: "Français", speechLang: "fr-FR" },
  { code: "zh", flag: "🇨🇳", label: "中文", speechLang: "zh-CN" },
  { code: "ja", flag: "🇯🇵", label: "日本語", speechLang: "ja-JP" },
  { code: "hi", flag: "🇮🇳", label: "Hindi", speechLang: "hi-IN" },
  { code: "pt-BR", flag: "🇧🇷", label: "Português BR", speechLang: "pt-BR" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe", speechLang: "tr-TR" },
] as const;

export const voiceDemoScripts: Record<VoiceDemoLocale, Record<VoiceDemoScriptKey, string>> = {
  pl: {
    milaIntro:
      "Cześć, jestem Miła. Nie musisz być bogaty, żeby poprawić swoją przyszłość finansową. Potrzebujesz świadomości, prostego planu i pierwszego małego kroku.",
    financialScore:
      "Twój Financial Health Score wynosi 42 na 100. To nie jest ocena. To punkt startowy. Najpierw zbudujemy świadomość i pierwszy nawyk oszczędzania.",
    inflationWakeUp:
      "Inflacja po cichu zmniejsza wartość pieniędzy. Jeśli trzymasz wszystko w gotówce, możesz czuć się bezpiecznie, ale Twoja siła nabywcza może spadać każdego roku.",
    kidsCoach:
      "Cześć, jestem Miła. Każda złotówka ma swoją misję. Najpierw uczymy się różnicy między potrzebą a zachcianką, a potem odkładamy na pierwszy cel.",
    certificateUnlock:
      "Gratulacje. Ukończyłeś etap Money Mindset, zdobyłeś tokeny Coach FI i odblokowałeś pierwszy certyfikat edukacyjny na Solanie.",
  },
  en: {
    milaIntro:
      "Welcome to Coach FI. I am Mila. You do not need to be rich to improve your financial future. You need awareness, a simple plan, and the first small step.",
    financialScore:
      "Your Financial Health Score is 42 out of 100. This is not a judgment. It is a starting point. First, we will build your awareness and your first saving habit.",
    inflationWakeUp:
      "Inflation silently reduces the value of money. If you keep all your savings in cash, you may feel safe, but your purchasing power can fall every year.",
    kidsCoach:
      "Hi, I am Mila. Every coin has a mission. First, we learn the difference between needs and wants. Then, we save for the first goal.",
    certificateUnlock:
      "Congratulations. You completed the Money Mindset stage, earned Coach FI Tokens, and unlocked your first education certificate on Solana.",
  },
  es: {
    milaIntro:
      "Bienvenido a Coach FI. Soy Mila. No necesitas ser rico para mejorar tu futuro financiero. Necesitas conciencia, un plan simple y el primer paso pequeño.",
    financialScore:
      "Tu puntuación de salud financiera es 42 de 100. No es un juicio. Es un punto de partida. Primero construiremos tu conciencia y tu primer hábito de ahorro.",
    inflationWakeUp:
      "La inflación reduce silenciosamente el valor del dinero. Si guardas todo en efectivo, puedes sentirte seguro, pero tu poder de compra puede caer cada año.",
    kidsCoach:
      "Hola, soy Mila. Cada moneda tiene una misión. Primero aprendemos la diferencia entre necesidades y deseos. Luego ahorramos para el primer objetivo.",
    certificateUnlock:
      "Felicidades. Completaste la etapa Money Mindset, ganaste Coach FI Tokens y desbloqueaste tu primer certificado educativo en Solana.",
  },
  fr: {
    milaIntro:
      "Bienvenue dans Coach FI. Je suis Mila. Tu n'as pas besoin d'être riche pour améliorer ton avenir financier. Tu as besoin de clarté, d'un plan simple et d'un premier petit pas.",
    financialScore:
      "Ton score de santé financière est de 42 sur 100. Ce n'est pas un jugement. C'est un point de départ. Nous allons d'abord construire ta conscience financière et ton premier réflexe d'épargne.",
    inflationWakeUp:
      "L'inflation réduit silencieusement la valeur de l'argent. Si tu gardes tout en espèces, tu peux te sentir en sécurité, mais ton pouvoir d'achat peut baisser chaque année.",
    kidsCoach:
      "Bonjour, je suis Mila. Chaque pièce a une mission. D'abord, on apprend la différence entre les besoins et les envies. Ensuite, on épargne pour le premier objectif.",
    certificateUnlock:
      "Bravo. Tu as terminé l'étape Money Mindset, gagné des Coach FI Tokens et débloqué ton premier certificat éducatif sur Solana.",
  },
  zh: {
    milaIntro:
      "欢迎来到 Coach FI。我是 Mila。你不需要先变得富有，才能改善自己的财务未来。你需要的是意识、一个简单计划，以及第一个小步骤。",
    financialScore:
      "你的财务健康分数是 42 分，满分 100 分。这不是评价，而是起点。我们会先建立你的财务意识和第一个储蓄习惯。",
    inflationWakeUp:
      "通货膨胀会悄悄降低金钱的价值。如果你把所有储蓄都放在现金里，可能会觉得安全，但购买力可能每年下降。",
    kidsCoach:
      "你好，我是 Mila。每一枚硬币都有任务。我们先学习需要和想要的区别，然后为第一个目标储蓄。",
    certificateUnlock:
      "恭喜你。你完成了 Money Mindset 阶段，获得了 Coach FI Tokens，并解锁了你在 Solana 上的第一个教育证书。",
  },
  ja: {
    milaIntro:
      "Coach FIへようこそ。私はMilaです。お金の未来を良くするために、最初から裕福である必要はありません。必要なのは気づき、シンプルな計画、そして最初の小さな一歩です。",
    financialScore:
      "あなたのファイナンシャルヘルススコアは100点中42点です。これは評価ではなく出発点です。まずはお金への理解と貯蓄の習慣を作ります。",
    inflationWakeUp:
      "インフレはお金の価値を静かに下げます。すべてを現金で持つと安心に感じますが、購買力は毎年下がる可能性があります。",
    kidsCoach:
      "こんにちは、Milaです。すべてのコインにはミッションがあります。まず必要なものと欲しいものの違いを学び、最初の目標のために貯金します。",
    certificateUnlock:
      "おめでとうございます。Money Mindsetステージを完了し、Coach FIトークンを獲得し、Solana上の最初の教育証明書を解除しました。",
  },
  hi: {
    milaIntro:
      "Coach FI में आपका स्वागत है। मैं Mila हूं। अपने वित्तीय भविष्य को बेहतर बनाने के लिए अमीर होना जरूरी नहीं है। आपको जागरूकता, एक सरल योजना और पहला छोटा कदम चाहिए।",
    financialScore:
      "आपका वित्तीय स्वास्थ्य स्कोर 100 में से 42 है। यह निर्णय नहीं है। यह शुरुआत है। पहले हम आपकी जागरूकता और पहली बचत की आदत बनाएंगे।",
    inflationWakeUp:
      "महंगाई चुपचाप पैसे की कीमत घटाती है। अगर आप सारी बचत नकद रखते हैं, तो आप सुरक्षित महसूस कर सकते हैं, लेकिन आपकी खरीद शक्ति हर साल कम हो सकती है।",
    kidsCoach:
      "नमस्ते, मैं Mila हूं। हर सिक्के का एक मिशन होता है। पहले हम जरूरत और इच्छा में अंतर सीखते हैं। फिर पहले लक्ष्य के लिए बचत करते हैं।",
    certificateUnlock:
      "बधाई हो। आपने Money Mindset चरण पूरा किया, Coach FI Tokens कमाए और Solana पर अपना पहला शिक्षा प्रमाणपत्र अनलॉक किया।",
  },
  "pt-BR": {
    milaIntro:
      "Bem-vindo ao Coach FI. Eu sou a Mila. Você não precisa ser rico para melhorar seu futuro financeiro. Você precisa de consciência, um plano simples e o primeiro pequeno passo.",
    financialScore:
      "Seu score de saúde financeira é 42 de 100. Isso não é um julgamento. É um ponto de partida. Primeiro vamos construir sua consciência e seu primeiro hábito de poupança.",
    inflationWakeUp:
      "A inflação reduz silenciosamente o valor do dinheiro. Se você guarda tudo em dinheiro parado, pode se sentir seguro, mas seu poder de compra pode cair todos os anos.",
    kidsCoach:
      "Oi, eu sou a Mila. Toda moeda tem uma missão. Primeiro aprendemos a diferença entre necessidades e vontades. Depois poupamos para o primeiro objetivo.",
    certificateUnlock:
      "Parabéns. Você concluiu a etapa Money Mindset, ganhou Coach FI Tokens e desbloqueou seu primeiro certificado educacional na Solana.",
  },
  tr: {
    milaIntro:
      "Coach FI'ya hoş geldin. Ben Mila. Finansal geleceğini iyileştirmek için zengin olman gerekmez. Farkındalık, basit bir plan ve ilk küçük adım gerekir.",
    financialScore:
      "Finansal sağlık skorun 100 üzerinden 42. Bu bir yargı değil. Bir başlangıç noktası. Önce finansal farkındalığını ve ilk tasarruf alışkanlığını kuracağız.",
    inflationWakeUp:
      "Enflasyon paranın değerini sessizce azaltır. Tüm birikimini nakitte tutarsan güvende hissedebilirsin, ama satın alma gücün her yıl düşebilir.",
    kidsCoach:
      "Merhaba, ben Mila. Her paranın bir görevi vardır. Önce ihtiyaçlar ile istekler arasındaki farkı öğreniriz. Sonra ilk hedef için biriktiririz.",
    certificateUnlock:
      "Tebrikler. Money Mindset aşamasını tamamladın, Coach FI Tokens kazandın ve Solana üzerindeki ilk eğitim sertifikanı açtın.",
  },
};

export function getVoiceDemoLocale(locale: string | undefined): VoiceDemoLocale {
  return voiceDemoLanguages.some((language) => language.code === locale) ? (locale as VoiceDemoLocale) : "pl";
}

export function getVoiceDemoLanguage(locale: string | undefined) {
  const voiceLocale = getVoiceDemoLocale(locale);
  return voiceDemoLanguages.find((language) => language.code === voiceLocale) ?? voiceDemoLanguages[0];
}
