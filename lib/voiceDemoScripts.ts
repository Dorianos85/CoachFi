export type VoiceDemoLocale = "pl" | "en" | "ja";

export type VoiceDemoScriptKey =
  | "milaIntro"
  | "financialScore"
  | "inflationWakeUp"
  | "kidsCoach"
  | "certificateUnlock";

export const voiceDemoLanguages = [
  { code: "pl", flag: "🇵🇱", label: "Polski", speechLang: "pl-PL" },
  { code: "en", flag: "🇺🇸", label: "English", speechLang: "en-US" },
  { code: "ja", flag: "🇯🇵", label: "日本語", speechLang: "ja-JP" },
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
};

export function getVoiceDemoLocale(locale: string | undefined): VoiceDemoLocale {
  return locale === "en" || locale === "ja" ? locale : "pl";
}

export function getVoiceDemoLanguage(locale: string | undefined) {
  const voiceLocale = getVoiceDemoLocale(locale);
  return voiceDemoLanguages.find((language) => language.code === voiceLocale) ?? voiceDemoLanguages[0];
}
