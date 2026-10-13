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
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
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

const partnerCopy: LocalizedMap<
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
    stats: ["Konwersja do quizu", "Zdawalność quizu", "Mint certyfikatu", "Powroty po 7 dniach"],
    valueTitle: "Dlaczego wdrożyć Coach FI?",
    valueCards: [
      {
        title: "Warstwa edukacji finansowej",
        body: "Osadź Coach FI w onboardingu, aplikacji lub oddziale. Użytkownicy uczą się, a Ty budujesz zaufanie.",
      },
      {
        title: "Dowód na Solanie",
        body: "Certyfikaty dają użytkownikom własność postępu nauki. Bez spekulacji i bez handlu.",
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
    stats: ["Conversion to quiz", "Quiz pass rate", "Certificate mint rate", "Return rate (7-day)"],
    valueTitle: "Why embed Coach FI?",
    valueCards: [
      {
        title: "Financial education layer",
        body: "Embed Coach FI in your onboarding, app or branch experience. Users learn while you build trust.",
      },
      {
        title: "Proof on Solana",
        body: "Certificates give users ownership of their learning progress. Non-speculative, non-tradeable proof.",
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
    stats: ["クイズ転換率", "クイズ合格率", "証明書の発行率", "7日後の再訪率"],
    valueTitle: "なぜCoach FIを組み込むのか?",
    valueCards: [
      {
        title: "金融教育レイヤー",
        body: "オンボーディング、アプリ、店舗体験にCoach FIを組み込み、信頼を築きながら学習を提供します。",
      },
      {
        title: "Solana上の証明",
        body: "証明書により、ユーザーは学習進捗を所有できます。投機的でも取引目的でもありません。",
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
  es: {
    header: {
      eyebrow: "Portal de socios",
      title: "Lleva la educación financiera a toda tu base de usuarios.",
      description:
        "Vista previa de un panel B2B para bancos, brókeres, escuelas e instituciones. Todas las cifras son datos simulados para la demo del hackathon.",
      readText:
        "Vista previa del Portal de socios. Elige un segmento para ver datos de participación simulados de bancos, brókeres, escuelas y universidades.",
    },
    segmentAria: "Segmentos de socios",
    segments: {
      bank: "Bancos",
      broker: "Brókeres",
      investment: "Casas de inversión",
      exchange: "Exchanges de criptomonedas",
      school: "Escuelas",
      university: "Universidades",
    },
    kpis: ["Institución", "Usuarios inscritos", "Progreso medio", "Mentalidad completada", "Certificados emitidos", "Usuarios de accesibilidad"],
    moduleTitle: "Finalización de módulos",
    mockData: (institution) => `Datos de participación simulados - ${institution}`,
    modules: ["Mentalidad financiera", "Inflación y poder adquisitivo", "Certificados en Solana", "Usuarios del Modo accesibilidad"],
    healthTitle: "Salud de la plataforma",
    healthDescription: "Progreso medio de aprendizaje y señales de participación",
    avgProgress: "progreso medio",
    stats: ["Conversión al quiz", "Tasa de aprobados del quiz", "Tasa de emisión de certificados", "Tasa de retorno (7 días)"],
    valueTitle: "¿Por qué integrar Coach FI?",
    valueCards: [
      {
        title: "Capa de educación financiera",
        body: "Integra Coach FI en tu onboarding, tu app o tu experiencia en oficinas. Los usuarios aprenden mientras tú generas confianza.",
      },
      {
        title: "Prueba en Solana",
        body: "Los certificados dan a los usuarios la propiedad de su progreso de aprendizaje. Una prueba no especulativa y no negociable.",
      },
      {
        title: "Accesible por diseño",
        body: "Pensado con WCAG, con Modo niños y Modo accesibilidad incluidos. Llega a usuarios excluidos y desatendidos.",
      },
      {
        title: "Listo para marca blanca",
        body: "Tu marca, tus colores. El motor de Coach FI integrado en tu producto digital o portal de clientes.",
      },
    ],
    demoBadge: "Demo de hackathon",
    ctaTitle: "¿Te interesa colaborar?",
    ctaBody:
      "Coach FI busca alianzas con instituciones financieras, escuelas y fundaciones que quieran llevar a sus usuarios una educación financiera basada en la evidencia.",
    hackathon: "Solana Frontier Hackathon",
    submission: "Entrega del MVP",
  },
  fr: {
    header: {
      eyebrow: "Portail partenaires",
      title: "Déployez l'éducation financière auprès de tous vos utilisateurs.",
      description:
        "Aperçu d'un tableau de bord B2B pour les banques, courtiers, écoles et institutions. Tous les chiffres sont des données fictives pour la démo du hackathon.",
      readText:
        "Aperçu du Portail partenaires. Sélectionnez un segment pour voir des données d'engagement fictives pour les banques, courtiers, écoles et universités.",
    },
    segmentAria: "Segments partenaires",
    segments: {
      bank: "Banques",
      broker: "Courtiers",
      investment: "Sociétés d'investissement",
      exchange: "Plateformes crypto",
      school: "Écoles",
      university: "Universités",
    },
    kpis: ["Institution", "Utilisateurs inscrits", "Progression moyenne", "État d'esprit terminé", "Certificats émis", "Utilisateurs de l'accessibilité"],
    moduleTitle: "Achèvement des modules",
    mockData: (institution) => `Données d'engagement fictives - ${institution}`,
    modules: ["État d'esprit financier", "Inflation et pouvoir d'achat", "Certificats sur Solana", "Utilisateurs du Mode accessibilité"],
    healthTitle: "Santé de la plateforme",
    healthDescription: "Progression moyenne d'apprentissage et signaux d'engagement",
    avgProgress: "progression moyenne",
    stats: ["Conversion vers le quiz", "Taux de réussite au quiz", "Taux d'émission de certificats", "Taux de retour (7 jours)"],
    valueTitle: "Pourquoi intégrer Coach FI ?",
    valueCards: [
      {
        title: "Une couche d'éducation financière",
        body: "Intégrez Coach FI à votre parcours d'accueil, votre application ou votre expérience en agence. Les utilisateurs apprennent pendant que vous bâtissez la confiance.",
      },
      {
        title: "Une preuve sur Solana",
        body: "Les certificats donnent aux utilisateurs la propriété de leurs progrès. Une preuve non spéculative et non échangeable.",
      },
      {
        title: "Accessible dès la conception",
        body: "Pensé selon les WCAG, avec le Mode enfants et le Mode accessibilité inclus. Touchez les publics exclus et mal desservis.",
      },
      {
        title: "Prêt pour la marque blanche",
        body: "Votre marque, vos couleurs. Le moteur Coach FI intégré à votre produit numérique ou à votre portail client.",
      },
    ],
    demoBadge: "Démo de hackathon",
    ctaTitle: "Intéressé par un partenariat ?",
    ctaBody:
      "Coach FI recherche des partenariats avec des institutions financières, des écoles et des fondations qui souhaitent offrir à leurs utilisateurs une éducation financière fondée sur des données probantes.",
    hackathon: "Solana Frontier Hackathon",
    submission: "Soumission du MVP",
  },
  zh: {
    header: {
      eyebrow: "合作伙伴门户",
      title: "把财商教育推广到你的全部用户。",
      description:
        "面向银行、券商、学校和机构的 B2B 看板预览。所有数字均为黑客松演示用的模拟数据。",
      readText:
        "合作伙伴门户预览。选择一个细分领域，查看银行、券商、学校和大学的模拟参与数据。",
    },
    segmentAria: "合作伙伴细分",
    segments: {
      bank: "银行",
      broker: "券商",
      investment: "投资机构",
      exchange: "加密货币交易所",
      school: "学校",
      university: "大学",
    },
    kpis: ["机构", "注册用户", "平均进度", "已完成心态课", "已铸造证书", "无障碍用户"],
    moduleTitle: "模块完成情况",
    mockData: (institution) => `模拟参与数据 - ${institution}`,
    modules: ["金钱心态", "通胀与购买力", "Solana 上的证书", "无障碍模式用户"],
    healthTitle: "平台健康度",
    healthDescription: "平均学习进度与参与信号",
    avgProgress: "平均进度",
    stats: ["测验转化率", "测验通过率", "证书铸造率", "回访率（7 天）"],
    valueTitle: "为什么要嵌入 Coach FI？",
    valueCards: [
      {
        title: "财商教育层",
        body: "把 Coach FI 嵌入你的开户流程、应用或网点体验。用户在学习，你在建立信任。",
      },
      {
        title: "Solana 上的证明",
        body: "证书让用户真正拥有自己的学习进度。非投机、不可交易的证明。",
      },
      {
        title: "为无障碍而设计",
        body: "遵循 WCAG 理念，内置儿童模式和无障碍模式。触达被忽视和服务不足的用户。",
      },
      {
        title: "支持白标",
        body: "你的品牌，你的配色。Coach FI 引擎嵌入你的数字产品或客户门户。",
      },
    ],
    demoBadge: "黑客松演示",
    ctaTitle: "有兴趣合作吗？",
    ctaBody:
      "Coach FI 正在寻求与金融机构、学校和基金会合作，为其用户带来循证的财商教育。",
    hackathon: "Solana Frontier Hackathon",
    submission: "MVP 提交",
  },
  hi: {
    header: {
      eyebrow: "पार्टनर पोर्टल",
      title: "वित्तीय शिक्षा को अपने सभी उपयोगकर्ताओं तक पहुंचाएं।",
      description:
        "बैंकों, ब्रोकरों, स्कूलों और संस्थानों के लिए B2B डैशबोर्ड का प्रीव्यू। सभी आंकड़े हैकथॉन डेमो के लिए नमूना डेटा हैं।",
      readText:
        "पार्टनर पोर्टल का प्रीव्यू। बैंकों, ब्रोकरों, स्कूलों और विश्वविद्यालयों का नमूना एंगेजमेंट डेटा देखने के लिए एक सेगमेंट चुनें।",
    },
    segmentAria: "पार्टनर सेगमेंट",
    segments: {
      bank: "बैंक",
      broker: "ब्रोकर",
      investment: "निवेश संस्थान",
      exchange: "क्रिप्टो एक्सचेंज",
      school: "स्कूल",
      university: "विश्वविद्यालय",
    },
    kpis: ["संस्थान", "नामांकित उपयोगकर्ता", "औसत प्रगति", "सोच वाला पाठ पूरा", "जारी किए गए सर्टिफ़िकेट", "सुलभता उपयोगकर्ता"],
    moduleTitle: "मॉड्यूल पूर्णता",
    mockData: (institution) => `नमूना एंगेजमेंट डेटा - ${institution}`,
    modules: ["पैसे की सोच", "महंगाई और क्रय शक्ति", "Solana पर सर्टिफ़िकेट", "सुलभता मोड के उपयोगकर्ता"],
    healthTitle: "प्लेटफ़ॉर्म की सेहत",
    healthDescription: "औसत सीखने की प्रगति और एंगेजमेंट के संकेत",
    avgProgress: "औसत प्रगति",
    stats: ["क्विज़ में रूपांतरण", "क्विज़ पास दर", "सर्टिफ़िकेट जारी होने की दर", "वापसी दर (7 दिन)"],
    valueTitle: "Coach FI को क्यों जोड़ें?",
    valueCards: [
      {
        title: "वित्तीय शिक्षा की परत",
        body: "Coach FI को अपने ऑनबोर्डिंग, ऐप या शाखा के अनुभव में जोड़ें। उपयोगकर्ता सीखते हैं और आप भरोसा बनाते हैं।",
      },
      {
        title: "Solana पर प्रमाण",
        body: "सर्टिफ़िकेट उपयोगकर्ताओं को उनकी सीखने की प्रगति का स्वामित्व देते हैं। गैर-सट्टा, गैर-व्यापार योग्य प्रमाण।",
      },
      {
        title: "डिज़ाइन से ही सुलभ",
        body: "WCAG को ध्यान में रखकर बना, किड्स मोड और सुलभता मोड शामिल। वंचित और कम सेवा पाने वाले उपयोगकर्ताओं तक पहुंचें।",
      },
      {
        title: "व्हाइट-लेबल के लिए तैयार",
        body: "आपका ब्रांड, आपके रंग। Coach FI इंजन आपके डिजिटल उत्पाद या ग्राहक पोर्टल में जुड़ा हुआ।",
      },
    ],
    demoBadge: "हैकथॉन डेमो",
    ctaTitle: "साझेदारी में रुचि है?",
    ctaBody:
      "Coach FI ऐसे वित्तीय संस्थानों, स्कूलों और फ़ाउंडेशनों के साथ साझेदारी चाहता है जो अपने उपयोगकर्ताओं तक प्रमाण-आधारित वित्तीय शिक्षा पहुंचाना चाहते हैं।",
    hackathon: "Solana Frontier Hackathon",
    submission: "MVP सबमिशन",
  },
  "pt-BR": {
    header: {
      eyebrow: "Portal de parceiros",
      title: "Leve educação financeira a toda a sua base de usuários.",
      description:
        "Prévia de um painel B2B para bancos, corretoras, escolas e instituições. Todos os números são dados fictícios para a demo do hackathon.",
      readText:
        "Prévia do Portal de parceiros. Selecione um segmento para ver dados fictícios de engajamento de bancos, corretoras, escolas e universidades.",
    },
    segmentAria: "Segmentos de parceiros",
    segments: {
      bank: "Bancos",
      broker: "Corretoras",
      investment: "Gestoras de investimento",
      exchange: "Corretoras de cripto",
      school: "Escolas",
      university: "Universidades",
    },
    kpis: ["Instituição", "Usuários inscritos", "Progresso médio", "Mentalidade concluída", "Certificados emitidos", "Usuários de acessibilidade"],
    moduleTitle: "Conclusão de módulos",
    mockData: (institution) => `Dados fictícios de engajamento - ${institution}`,
    modules: ["Mentalidade financeira", "Inflação e poder de compra", "Certificados na Solana", "Usuários do Modo acessibilidade"],
    healthTitle: "Saúde da plataforma",
    healthDescription: "Progresso médio de aprendizado e sinais de engajamento",
    avgProgress: "progresso médio",
    stats: ["Conversão para o quiz", "Taxa de aprovação no quiz", "Taxa de emissão de certificados", "Taxa de retorno (7 dias)"],
    valueTitle: "Por que integrar o Coach FI?",
    valueCards: [
      {
        title: "Camada de educação financeira",
        body: "Integre o Coach FI ao seu onboarding, app ou atendimento na agência. Os usuários aprendem enquanto você constrói confiança.",
      },
      {
        title: "Prova na Solana",
        body: "Os certificados dão aos usuários a posse do próprio progresso de aprendizado. Uma prova não especulativa e não negociável.",
      },
      {
        title: "Acessível desde o projeto",
        body: "Pensado com base nas WCAG, com Modo infantil e Modo acessibilidade incluídos. Alcance usuários excluídos e pouco atendidos.",
      },
      {
        title: "Pronto para white label",
        body: "Sua marca, suas cores. O motor do Coach FI integrado ao seu produto digital ou portal do cliente.",
      },
    ],
    demoBadge: "Demo de hackathon",
    ctaTitle: "Interesse em parceria?",
    ctaBody:
      "O Coach FI busca parcerias com instituições financeiras, escolas e fundações que queiram levar educação financeira baseada em evidências aos seus usuários.",
    hackathon: "Solana Frontier Hackathon",
    submission: "Entrega do MVP",
  },
  tr: {
    header: {
      eyebrow: "İş ortağı portalı",
      title: "Finansal eğitimi tüm kullanıcı tabanına yay.",
      description:
        "Bankalar, aracı kurumlar, okullar ve kurumlar için B2B panel önizlemesi. Tüm rakamlar hackathon demosu için örnek veridir.",
      readText:
        "İş ortağı portalı önizlemesi. Bankalar, aracı kurumlar, okullar ve üniversiteler için örnek etkileşim verilerini görmek üzere bir segment seç.",
    },
    segmentAria: "İş ortağı segmentleri",
    segments: {
      bank: "Bankalar",
      broker: "Aracı kurumlar",
      investment: "Yatırım kuruluşları",
      exchange: "Kripto borsaları",
      school: "Okullar",
      university: "Üniversiteler",
    },
    kpis: ["Kurum", "Kayıtlı kullanıcılar", "Ort. ilerleme", "Zihniyeti tamamlayanlar", "Oluşturulan sertifikalar", "Erişilebilirlik kullanıcıları"],
    moduleTitle: "Modül tamamlama",
    mockData: (institution) => `Örnek etkileşim verileri - ${institution}`,
    modules: ["Para Zihniyeti", "Enflasyon ve Alım Gücü", "Solana'da sertifikalar", "Erişilebilirlik Modu kullanıcıları"],
    healthTitle: "Platform sağlığı",
    healthDescription: "Ortalama öğrenme ilerlemesi ve etkileşim sinyalleri",
    avgProgress: "ort. ilerleme",
    stats: ["Quize dönüşüm", "Quiz başarı oranı", "Sertifika oluşturma oranı", "Geri dönüş oranı (7 gün)"],
    valueTitle: "Neden Coach FI'ı entegre etmelisin?",
    valueCards: [
      {
        title: "Finansal eğitim katmanı",
        body: "Coach FI'ı karşılama sürecine, uygulamana veya şube deneyimine yerleştir. Sen güven inşa ederken kullanıcılar öğrenir.",
      },
      {
        title: "Solana'da kanıt",
        body: "Sertifikalar kullanıcılara öğrenme ilerlemelerinin sahipliğini verir. Spekülatif olmayan, alınıp satılamayan bir kanıt.",
      },
      {
        title: "Tasarımı gereği erişilebilir",
        body: "WCAG gözetilerek hazırlandı; Çocuk Modu ve Erişilebilirlik Modu dahil. Dışlanan ve yeterince hizmet almayan kullanıcılara ulaş.",
      },
      {
        title: "Kendi markana hazır",
        body: "Senin markan, senin renklerin. Coach FI motoru dijital ürününe veya müşteri portalına gömülü.",
      },
    ],
    demoBadge: "Hackathon demosu",
    ctaTitle: "İş ortaklığıyla ilgileniyor musun?",
    ctaBody:
      "Coach FI, kullanıcılarına kanıta dayalı finansal eğitim sunmak isteyen finans kurumları, okullar ve vakıflarla iş ortaklığı arıyor.",
    hackathon: "Solana Frontier Hackathon",
    submission: "MVP başvurusu",
  },
};

const valueIcons = [GraduationCap, BadgeCheck, Users, Building2];

export default function PartnerPage() {
  const { locale } = useLanguage();
  const copy = pickLocalized(partnerCopy, locale);
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
                  ? "border-primary bg-primary text-on-primary shadow-glow"
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
                  background: `conic-gradient(var(--cf-grape) ${data.avgProgress}%, var(--cf-area-learn) 0)`,
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
