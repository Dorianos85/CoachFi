"use client";

import { Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";

// What the balance is, in plain words — earned points only, no demo balance.
const DESCRIPTION: LocalizedMap<string> = {
  en: "Points you earned on this device by finishing lessons, quizzes and challenges.",
  pl: "Punkty zdobyte na tym urządzeniu za lekcje, quizy i wyzwania.",
  es: "Puntos que ganaste en este dispositivo al completar lecciones, cuestionarios y retos.",
  fr: "Points gagnés sur cet appareil en terminant des leçons, quiz et défis.",
  zh: "你在此设备上完成课程、测验和挑战获得的积分。",
  ja: "この端末でレッスン、クイズ、チャレンジを終えて獲得したポイントです。",
  hi: "इस डिवाइस पर पाठ, क्विज़ और चुनौतियां पूरी करके कमाए गए पॉइंट।",
  "pt-BR": "Pontos que você ganhou neste dispositivo ao concluir aulas, quizzes e desafios.",
  tr: "Bu cihazda dersleri, testleri ve görevleri tamamlayarak kazandığın puanlar.",
};

export function TokenRewardCard({
  balance,
  status
}: {
  balance: number;
  status?: string;
}) {
  const { locale } = useLanguage();
  const copy = getLocalizedContent(locale);
  const visibleStatus = status ?? copy.common.rewardAvailable;

  return (
    <Card className="border-primary/10 bg-white/90">
      <CardHeader>
        <CardTitle>{copy.common.tokens}</CardTitle>
        <CardDescription>{pickLocalized(DESCRIPTION, locale)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid place-items-center rounded-lg bg-primary p-6 text-center text-on-primary shadow-glow">
          <Coins className="h-10 w-10 text-accent" aria-hidden="true" />
          <p className="mt-3 text-5xl font-black leading-none">{balance}</p>
          <p className="font-bold text-on-primary/80">{copy.common.tokens}</p>
        </div>
        <Badge className="mt-4" variant={visibleStatus === "Quiz completed" ? "success" : "warning"}>
          {visibleStatus}
        </Badge>
      </CardContent>
    </Card>
  );
}
