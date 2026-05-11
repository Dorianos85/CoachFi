"use client";

import { Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedContent } from "@/lib/localizedContent";

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
        <CardDescription>{copy.common.tokenDemo}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid place-items-center rounded-lg bg-primary p-6 text-center text-white shadow-glow">
          <Coins className="h-10 w-10 text-accent" aria-hidden="true" />
          <p className="mt-3 text-5xl font-black leading-none">{balance}</p>
          <p className="font-bold text-white/82">{copy.common.tokens}</p>
        </div>
        <Badge className="mt-4" variant={visibleStatus === "Quiz completed" ? "success" : "warning"}>
          {visibleStatus}
        </Badge>
      </CardContent>
    </Card>
  );
}
