"use client";

import {
  BadgeCheck,
  BookOpen,
  Building2,
  GraduationCap,
  Landmark,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { LOCALE_INTL, cn } from "@/lib/utils";

type SegmentId = "bank" | "broker" | "investment" | "exchange" | "school" | "university";

const partnerSegmentMeta = [
  { id: "bank", icon: Landmark },
  { id: "broker", icon: TrendingUp },
  { id: "investment", icon: Wallet },
  { id: "exchange", icon: BadgeCheck },
  { id: "school", icon: GraduationCap },
  { id: "university", icon: BookOpen },
] satisfies Array<{ id: SegmentId; icon: typeof Landmark }>;

const mockPartners: Record<
  SegmentId,
  {
    institution: string;
    enrolled: number;
    avgProgress: number;
    completedMindset: number;
    completedInflation: number;
    certificatesMinted: number;
    accessibilityUsers: number;
    color: string;
  }
> = {
  bank: {
    institution: "Demo Bank S.A.",
    enrolled: 1240,
    avgProgress: 38,
    completedMindset: 620,
    completedInflation: 430,
    certificatesMinted: 215,
    accessibilityUsers: 74,
    color: "text-primary",
  },
  broker: {
    institution: "Demo Broker Group",
    enrolled: 860,
    avgProgress: 44,
    completedMindset: 480,
    completedInflation: 390,
    certificatesMinted: 178,
    accessibilityUsers: 31,
    color: "text-secondary",
  },
  investment: {
    institution: "Demo Investment House",
    enrolled: 540,
    avgProgress: 52,
    completedMindset: 390,
    completedInflation: 310,
    certificatesMinted: 204,
    accessibilityUsers: 18,
    color: "text-accent",
  },
  exchange: {
    institution: "Demo Crypto Exchange",
    enrolled: 2100,
    avgProgress: 29,
    completedMindset: 840,
    completedInflation: 510,
    certificatesMinted: 320,
    accessibilityUsers: 95,
    color: "text-warning",
  },
  school: {
    institution: "Demo High School",
    enrolled: 380,
    avgProgress: 61,
    completedMindset: 310,
    completedInflation: 260,
    certificatesMinted: 195,
    accessibilityUsers: 42,
    color: "text-success",
  },
  university: {
    institution: "Demo University",
    enrolled: 910,
    avgProgress: 47,
    completedMindset: 560,
    completedInflation: 440,
    certificatesMinted: 287,
    accessibilityUsers: 56,
    color: "text-primary",
  },
};

const partnerCopy: Record<
  Locale,
  {
    header: { eyebrow: string; title: string; description: string; readText: string };
    segmentAria: string;
    segments: Record<SegmentId, string>;
    kpis: string[];
    moduleTitle: string;
    mockData: (institution: string) => string;
    modules: string[];
    healthTitle: string;
    healthDescription: string;
    avgProgress: string;
    stats: string[];
    valueTitle: string;
    valueCards: Array<{ title: string; body: string }>;
    demoBadge: string;
    ctaTitle: string;
    ctaBody: string;
    hackathon: string;
    submission: string;
  }
> = {
  pl: {
    header: {
      eyebrow: "Portal partnerski",
      title: "Skaluj edukację finansową wśród swoich użytkowników.",
      description:
        "Podgląd dashboardu B2B dla banków, brokerów, szkół i instytucji. Wszystkie liczby są danymi demo na potrzeby hackathonu.",
      readText:
        "Podgląd portalu partnerskiego. Wybierz segment, aby zobaczyć przykładowe dane zaangażowania.",
    },
    segmentAria: "Segmenty partnerskie",
    segments: {
      bank: "Banki",
      broker: "Brokerzy",
      investment: "Domy inwestycyjne",
      exchange: "Giełdy crypto",
      school: "Szkoły",
      university: "Uczelnie",
    },
    kpis: ["Instytucja", "Użytkownicy", "Średni postęp", "Ukończyli Mindset", "Certyfikaty", "Dostępność"],
    moduleTitle: "Ukończenie modułów",
    mockData: (institution) => `Dane demo - ${institution}`,
    modules: ["Money Mindset", "Inflacja i siła nabywcza", "Certyfikaty na Solanie", "Użytkownicy trybu dostępności"],
    healthTitle: "Zdrowie platformy",
    healthDescription: "Średni postęp nauki i sygnały zaangażowania",
    avgProgress: "średni postęp",
    stats: ["Konwersja do quizu", "Zdawalność quizu", "Mint NFT", "Powroty po 7 dniach"],
    valueTitle: "Dlaczego wdrożyć Coach FI?",
    valueCards: [
      {
        title: "Warstwa edukacji finansowej",
        body: "Osadź Coach FI w onboardingu, aplikacji lub oddziale. Użytkownicy uczą się, a Ty budujesz zaufanie.",
      },
      {
        title: "Dowód na Solanie",
        body: "Certyfikaty NFT dają użytkownikom własność postępu nauki. Bez spekulacji i bez handlu.",
      },
      {
        title: "Dostępność od początku",
        body: "WCAG-minded, tryb dzieci i tryb dostępności. Docierasz do osób wykluczonych i pomijanych.",
      },
      {
        title: "Gotowe pod white-label",
        body: "Twoja marka i kolory. Silnik Coach FI można osadzić w produkcie cyfrowym lub portalu klienta.",
      },
    ],
    demoBadge: "Demo hackathonowe",
    ctaTitle: "Chcesz zostać partnerem?",
    ctaBody:
      "Coach FI szuka partnerstw z instytucjami finansowymi, szkołami i fundacjami, które chcą dostarczać edukację finansową swoim użytkownikom.",
    hackathon: "Solana Frontier Hackathon",
    submission: "Zgłoszenie MVP",
  },
  en: {
    header: {
      eyebrow: "Partner Portal",
      title: "Scale financial education across your user base.",
      description:
        "A B2B dashboard preview for banks, brokers, schools and institutions. All numbers are mock data for the hackathon demo.",
      readText:
        "Partner Portal preview. Select a segment to see mock engagement data for banks, brokers, schools and universities.",
    },
    segmentAria: "Partner segments",
    segments: {
      bank: "Banks",
      broker: "Brokers",
      investment: "Investment Houses",
      exchange: "Crypto Exchanges",
      school: "Schools",
      university: "Universities",
    },
    kpis: ["Institution", "Users enrolled", "Avg progress", "Completed Mindset", "Certificates minted", "Accessibility users"],
    moduleTitle: "Module completion",
    mockData: (institution) => `Mock engagement data - ${institution}`,
    modules: ["Money Mindset", "Inflation & Purchasing Power", "Certificates on Solana", "Accessibility Mode users"],
    healthTitle: "Platform health",
    healthDescription: "Average learning progress and engagement signals",
    avgProgress: "avg progress",
    stats: ["Conversion to quiz", "Quiz pass rate", "NFT mint rate", "Return rate (7-day)"],
    valueTitle: "Why embed Coach FI?",
    valueCards: [
      {
        title: "Financial education layer",
        body: "Embed Coach FI in your onboarding, app or branch experience. Users learn while you build trust.",
      },
      {
        title: "Proof on Solana",
        body: "NFT certificates give users ownership of their learning progress. Non-speculative, non-tradeable proof.",
      },
      {
        title: "Accessible by design",
        body: "WCAG-minded, Kids Mode and Accessibility Mode included. Reach excluded and underserved users.",
      },
      {
        title: "White-label ready",
        body: "Your brand, your colours. Coach FI engine embedded in your digital product or customer portal.",
      },
    ],
    demoBadge: "Hackathon demo",
    ctaTitle: "Interested in partnering?",
    ctaBody:
      "Coach FI is seeking partnerships with financial institutions, schools and foundations that want to bring evidence-based financial education to their users.",
    hackathon: "Solana Frontier Hackathon",
    submission: "MVP submission",
  },
  ja: {
    header: {
      eyebrow: "パートナーポータル",
      title: "ユーザーベース全体に金融教育を広げます。",
      description:
        "銀行、ブローカー、学校、機関向けのB2Bダッシュボードプレビューです。数値はすべてハッカソンデモ用のモックデータです。",
      readText:
        "パートナーポータルのプレビュー。セグメントを選択して、エンゲージメントのモックデータを確認します。",
    },
    segmentAria: "パートナーセグメント",
    segments: {
      bank: "銀行",
      broker: "ブローカー",
      investment: "投資会社",
      exchange: "暗号資産取引所",
      school: "学校",
      university: "大学",
    },
    kpis: ["機関", "登録ユーザー", "平均進捗", "Mindset完了", "証明書ミント", "アクセシビリティユーザー"],
    moduleTitle: "モジュール完了",
    mockData: (institution) => `モックデータ - ${institution}`,
    modules: ["Money Mindset", "インフレと購買力", "Solana証明書", "アクセシビリティモードユーザー"],
    healthTitle: "プラットフォーム状態",
    healthDescription: "平均学習進捗とエンゲージメント指標",
    avgProgress: "平均進捗",
    stats: ["クイズ転換率", "クイズ合格率", "NFTミント率", "7日後の再訪率"],
    valueTitle: "なぜCoach FIを組み込むのか?",
    valueCards: [
      {
        title: "金融教育レイヤー",
        body: "オンボーディング、アプリ、店舗体験にCoach FIを組み込み、信頼を築きながら学習を提供します。",
      },
      {
        title: "Solana上の証明",
        body: "NFT証明書により、ユーザーは学習進捗を所有できます。投機的でも取引目的でもありません。",
      },
      {
        title: "アクセシブル設計",
        body: "WCAGを意識し、キッズモードとアクセシビリティモードを含みます。",
      },
      {
        title: "White-label対応",
        body: "あなたのブランドと色で、Coach FIエンジンをデジタル製品や顧客ポータルに組み込めます。",
      },
    ],
    demoBadge: "ハッカソンデモ",
    ctaTitle: "パートナーに興味がありますか?",
    ctaBody:
      "Coach FIは、ユーザーに根拠ある金融教育を届けたい金融機関、学校、財団との提携を探しています。",
    hackathon: "Solana Frontier Hackathon",
    submission: "MVP提出",
  },
};

const valueIcons = [GraduationCap, BadgeCheck, Users, Building2];

export default function PartnerPage() {
  const { locale } = useLanguage();
  const copy = partnerCopy[locale];
  const intlLocale = LOCALE_INTL[locale] ?? "en-US";
  const [activeSegment, setActiveSegment] = useState<SegmentId>("bank");
  const data = mockPartners[activeSegment];
  const nf = (value: number) => value.toLocaleString(intlLocale);

  return (
    <section aria-labelledby="partner-title">
      <SectionHeader
        eyebrow={copy.header.eyebrow}
        title={copy.header.title}
        description={copy.header.description}
        readText={copy.header.readText}
      />

      <div className="mb-7 flex flex-wrap gap-2" role="tablist" aria-label={copy.segmentAria}>
        {partnerSegmentMeta.map((seg) => {
          const Icon = seg.icon;
          const active = activeSegment === seg.id;
          return (
            <button
              key={seg.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setActiveSegment(seg.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "border-primary bg-primary text-white shadow-glow"
                  : "border-primary/15 bg-white/85 text-muted hover:border-primary/35 hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {copy.segments[seg.id]}
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={copy.kpis[0]} value={data.institution} wide />
        <KpiCard label={copy.kpis[1]} value={nf(data.enrolled)} />
        <KpiCard label={copy.kpis[2]} value={`${data.avgProgress}%`} />
        <KpiCard label={copy.kpis[3]} value={nf(data.completedMindset)} />
        <KpiCard label={copy.kpis[4]} value={nf(data.certificatesMinted)} />
        <KpiCard label={copy.kpis[5]} value={nf(data.accessibilityUsers)} />
      </div>

      <div className="mb-7 grid gap-5 xl:grid-cols-2">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>{copy.moduleTitle}</CardTitle>
            <CardDescription>{copy.mockData(data.institution)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <ModuleBar label={copy.modules[0]} value={data.completedMindset} total={data.enrolled} locale={intlLocale} />
            <ModuleBar label={copy.modules[1]} value={data.completedInflation} total={data.enrolled} locale={intlLocale} />
            <ModuleBar label={copy.modules[2]} value={data.certificatesMinted} total={data.enrolled} locale={intlLocale} />
            <ModuleBar label={copy.modules[3]} value={data.accessibilityUsers} total={data.enrolled} locale={intlLocale} />
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>{copy.healthTitle}</CardTitle>
            <CardDescription>{copy.healthDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid place-items-center rounded-lg bg-primary/5 p-8 text-center">
              <div
                className="grid h-44 w-44 place-items-center rounded-full p-3"
                style={{
                  background: `conic-gradient(#7C6FF6 ${data.avgProgress}%, rgba(124, 111, 246, 0.12) 0)`,
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-white">
                  <div>
                    <div className="text-6xl font-black leading-none text-primary">{data.avgProgress}%</div>
                    <div className="text-sm font-black text-muted">{copy.avgProgress}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatBadge label={copy.stats[0]} value="68%" variant="success" />
              <StatBadge label={copy.stats[1]} value="81%" variant="success" />
              <StatBadge label={copy.stats[2]} value={`${Math.round((data.certificatesMinted / data.enrolled) * 100)}%`} variant="accent" />
              <StatBadge label={copy.stats[3]} value="54%" variant="default" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-7">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-black text-text">{copy.valueTitle}</h2>
          <VoiceButton
            text={[copy.valueTitle, ...copy.valueCards.map((c) => `${c.title}. ${c.body}`)].join(". ")}
            locale={locale}
            variant="icon"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {copy.valueCards.map((card, index) => {
            const Icon = valueIcons[index] ?? GraduationCap;
            return (
              <Card key={card.title} className="border-primary/10 bg-white/90">
                <CardHeader>
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.body}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-primary/15 bg-white/90 p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="default" className="mb-3">
              {copy.demoBadge}
            </Badge>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-text">{copy.ctaTitle}</h2>
              <VoiceButton
                text={`${copy.ctaTitle}. ${copy.ctaBody}`}
                locale={locale}
                variant="icon"
              />
            </div>
            <p className="mt-2 max-w-lg text-base leading-7 text-muted">{copy.ctaBody}</p>
          </div>
          <div className="shrink-0 rounded-lg bg-primary/5 p-5 text-center">
            <p className="text-sm font-black uppercase text-primary">{copy.hackathon}</p>
            <p className="mt-2 text-4xl font-black text-text">2026</p>
            <p className="mt-1 text-sm font-bold text-muted">{copy.submission}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-primary/10 bg-white/90 p-4",
        wide && "sm:col-span-2 lg:col-span-3 xl:col-span-2"
      )}
    >
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black leading-tight text-text">{value}</p>
    </div>
  );
}

function ModuleBar({
  label,
  value,
  total,
  locale,
}: {
  label: string;
  value: number;
  total: number;
  locale: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-sm font-bold text-muted">
        <span>{label}</span>
        <span>
          {value.toLocaleString(locale)} ({pct}%)
        </span>
      </div>
      <Progress value={pct} valueLabel={`${label}: ${pct}%`} />
    </div>
  );
}

function StatBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "success" | "accent" | "default" | "warning";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
      <span className="text-sm font-bold text-muted">{label}</span>
      <Badge variant={variant}>{value}</Badge>
    </div>
  );
}
