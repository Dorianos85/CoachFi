export function chatErrorMessage(kind: "configuration" | "unavailable" | "interrupted", locale?: string) {
  const messages = {
    en: {
      configuration: "AI chat is not configured yet. Please contact support.",
      unavailable: "Mila is temporarily unavailable. Please try again in a moment.",
      interrupted: "The reply was interrupted and may be incomplete. Please try again.",
    },
    pl: {
      configuration: "Czat AI nie jest jeszcze skonfigurowany. Skontaktuj się z obsługą.",
      unavailable: "Mila jest chwilowo niedostępna. Spróbuj ponownie za chwilę.",
      interrupted: "Odpowiedź została przerwana i może być niepełna. Spróbuj ponownie.",
    },
    ja: {
      configuration: "AIチャットはまだ設定されていません。サポートにお問い合わせください。",
      unavailable: "現在ミラを利用できません。しばらくしてからもう一度お試しください。",
      interrupted: "回答が中断され、不完全な可能性があります。もう一度お試しください。",
    },
  };
  return messages[locale === "pl" || locale === "ja" ? locale : "en"][kind];
}
