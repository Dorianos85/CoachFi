"use client";

import {
  BookOpenCheck,
  Gift,
  Heart,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { FINANCIAL_AMOUNT_MAX } from "@/lib/financial-score";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { allocateIncomeCents } from "@/lib/income-allocation";
import { cn, formatCurrency, LOCALE_INTL } from "@/lib/utils";

type PlannerMode = "adult" | "kids";
type JarKey = "necessities" | "education" | "longTerm" | "fun" | "investing" | "giving";

type PlannerCopy = {
  eyebrow: string;
  title: string;
  description: string;
  incomeLabel: string;
  incomeHelp: string;
  readLabel: string;
  totalLabel: string;
  jars: Record<JarKey, { title: string; description: string }>;
  voiceIntro: (amount: string) => string;
};

const JARS: Array<{ key: JarKey; percent: number; icon: LucideIcon; color: string }> = [
  { key: "necessities", percent: 55, icon: WalletCards, color: "#7DD3DC" },
  { key: "education", percent: 10, icon: BookOpenCheck, color: "#A89CF6" },
  { key: "longTerm", percent: 10, icon: PiggyBank, color: "#F7DFA6" },
  { key: "fun", percent: 10, icon: Gift, color: "#F59E0B" },
  { key: "investing", percent: 10, icon: TrendingUp, color: "#10B981" },
  { key: "giving", percent: 5, icon: Heart, color: "#F472B6" },
];

const ADULT_PL: PlannerCopy = {
  eyebrow: "Podział dochodu",
  title: "Model 6 słoików Ekera",
  description:
    "Wpisz miesięczny dochód i zobacz prosty podział na utrzymanie, edukację, większe wydatki, przyjemności, inwestycje i hojność.",
  incomeLabel: "Miesięczny dochód",
  incomeHelp: "To narzędzie edukacyjne. Dostosuj procenty do swojej sytuacji, ale zacznij od jasnego systemu.",
  readLabel: "Odczytaj podział dochodu",
  totalLabel: "Razem",
  jars: {
    necessities: {
      title: "Wydatki konieczne",
      description: "Rachunki, czynsz, jedzenie, transport, kredyty i ubezpieczenia.",
    },
    education: {
      title: "Edukacja",
      description: "Książki, kursy, szkolenia, konferencje oraz edukacja dzieci.",
    },
    longTerm: {
      title: "Długoterminowe wydatki",
      description: "Większe planowane zakupy: AGD, wakacje, naprawa samochodu.",
    },
    fun: {
      title: "Przyjemności",
      description: "Restauracja, hobby, kino, masaż i rzeczy, które dają radość bez poczucia winy.",
    },
    investing: {
      title: "Inwestycje",
      description: "Kapitał na giełdę, nieruchomości, fundusze, biznes lub inne aktywa.",
    },
    giving: {
      title: "Pomoc innym",
      description: "Prezenty, fundacje, akcje charytatywne, schroniska i wsparcie potrzebujących.",
    },
  },
  voiceIntro: (amount) => `Podział dochodu według modelu 6 słoików dla kwoty ${amount}.`,
};

const KIDS_PL: PlannerCopy = {
  ...ADULT_PL,
  eyebrow: "Słoiki na kieszonkowe",
  title: "Podziel pieniądze na 6 misji",
  description:
    "Wpisz kieszonkowe albo prezent i zobacz, ile pieniędzy trafia do każdego słoika.",
  incomeLabel: "Kieszonkowe lub prezent",
  incomeHelp: "Dziecko widzi prosty system: wydaj, ucz się, odkładaj, baw się, inwestuj i pomagaj.",
  readLabel: "Odczytaj moje słoiki",
  jars: {
    necessities: {
      title: "Potrzebne rzeczy",
      description: "Jedzenie w szkole, bilet, zeszyty albo coś naprawdę potrzebnego.",
    },
    education: {
      title: "Nauka",
      description: "Książki, kursy, języki, zajęcia albo edukacyjne gry.",
    },
    longTerm: {
      title: "Duży cel",
      description: "Rower, konsola, wakacje albo większe marzenie, na które trzeba poczekać.",
    },
    fun: {
      title: "Przyjemności",
      description: "Małe radości: kino, lody, zabawka albo hobby.",
    },
    investing: {
      title: "Rośnij",
      description: "Pieniądze, których nie ruszamy, żeby uczyć się budowania przyszłości.",
    },
    giving: {
      title: "Pomaganie",
      description: "Prezent, pomoc komuś bliskiemu albo wsparcie dobrej sprawy.",
    },
  },
  voiceIntro: (amount) => `Podział kieszonkowego na 6 słoików dla kwoty ${amount}.`,
};

const COPY: LocalizedMap<Record<PlannerMode, PlannerCopy>> = {
  en: {
    adult: {
      eyebrow: "Income split",
      title: "Eker 6 jar model",
      description:
        "Enter monthly income and split it into necessities, education, long-term spending, fun, investing and giving.",
      incomeLabel: "Monthly income",
      incomeHelp: "Educational model only. Adjust it to your situation, but start with a clear system.",
      readLabel: "Read income split",
      totalLabel: "Total",
      jars: {
        necessities: { title: "Necessities", description: "Bills, rent, food, transport, loans and insurance." },
        education: { title: "Education", description: "Books, courses, training, conferences and children's education." },
        longTerm: { title: "Long-term spending", description: "Larger planned purchases, holidays or car repairs without debt." },
        fun: { title: "Fun", description: "Money you intentionally spend on joy, hobbies and healthy rewards." },
        investing: { title: "Investing", description: "Capital for stocks, real estate, funds, business or other assets." },
        giving: { title: "Giving", description: "Gifts, charities, foundations, shelters and support for people in need." },
      },
      voiceIntro: (amount) => `Income split using the 6 jar model for ${amount}.`,
    },
    kids: {
      eyebrow: "Pocket money jars",
      title: "Split money into 6 missions",
      description: "Enter pocket money or a gift and see how much goes into each jar.",
      incomeLabel: "Pocket money or gift",
      incomeHelp: "A simple system for kids: spend, learn, save, enjoy, grow and give.",
      readLabel: "Read my jars",
      totalLabel: "Total",
      jars: {
        necessities: { title: "Needs", description: "School food, tickets, notebooks or something truly needed." },
        education: { title: "Learning", description: "Books, courses, languages, classes or educational games." },
        longTerm: { title: "Big goal", description: "A bike, console, holiday or a bigger dream that takes time." },
        fun: { title: "Fun", description: "Small joys like cinema, ice cream, toys or hobbies." },
        investing: { title: "Grow", description: "Money you do not touch, so you learn to build the future." },
        giving: { title: "Helping", description: "A gift, helping someone close or supporting a good cause." },
      },
      voiceIntro: (amount) => `Pocket money split into 6 jars for ${amount}.`,
    },
  },
  pl: { adult: ADULT_PL, kids: KIDS_PL },
  es: {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "Necesidades", description: "Facturas, alquiler, comida, transporte, préstamos y seguros." },
        education: { title: "Educación", description: "Libros, cursos, formación, conferencias y la educación de los hijos." },
        longTerm: { title: "Gastos a largo plazo", description: "Compras grandes planificadas, vacaciones o reparaciones del coche sin deuda." },
        fun: { title: "Diversión", description: "Dinero que gastas a propósito en alegría, aficiones y recompensas sanas." },
        investing: { title: "Inversión", description: "Capital para bolsa, inmuebles, fondos, negocio u otros activos." },
        giving: { title: "Generosidad", description: "Regalos, ONG, fundaciones, refugios y apoyo a quien lo necesita." },
      },
      eyebrow: "Division de ingresos",
      title: "Modelo de 6 frascos",
      description: "Divide tus ingresos en necesidades, educacion, gastos planificados, placer, inversion y ayuda.",
      incomeLabel: "Ingreso mensual",
      incomeHelp: "Modelo educativo. Ajustalo a tu situacion, pero empieza con un sistema claro.",
      readLabel: "Leer division de ingresos",
      totalLabel: "Total",
      voiceIntro: (amount) => `Division de ingresos con el modelo de 6 frascos para ${amount}.`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "Necesidades", description: "Comida del cole, billetes, cuadernos o algo que de verdad hace falta." },
        education: { title: "Aprender", description: "Libros, cursos, idiomas, clases o juegos educativos." },
        longTerm: { title: "Gran meta", description: "Una bici, una consola, unas vacaciones o un sueño más grande que requiere tiempo." },
        fun: { title: "Diversión", description: "Pequeñas alegrías: cine, helado, juguetes o aficiones." },
        investing: { title: "Crecer", description: "Dinero que no tocas, para aprender a construir el futuro." },
        giving: { title: "Ayudar", description: "Un regalo, ayudar a alguien cercano o apoyar una buena causa." },
      },
      eyebrow: "Frascos de dinero",
      title: "Divide el dinero en 6 misiones",
      description: "Introduce tu mesada o regalo y mira cuanto va a cada frasco.",
      incomeLabel: "Mesada o regalo",
      incomeHelp: "Sistema simple: gastar, aprender, ahorrar, disfrutar, crecer y ayudar.",
      readLabel: "Leer mis frascos",
      totalLabel: "Total",
      voiceIntro: (amount) => `Division de mesada en 6 frascos para ${amount}.`,
    },
  },
  fr: {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "Besoins", description: "Factures, loyer, alimentation, transport, prêts et assurances." },
        education: { title: "Éducation", description: "Livres, cours, formations, conférences et éducation des enfants." },
        longTerm: { title: "Dépenses à long terme", description: "Gros achats prévus, vacances ou réparations de voiture sans dette." },
        fun: { title: "Plaisir", description: "L'argent que vous dépensez volontairement pour la joie, les loisirs et de saines récompenses." },
        investing: { title: "Investissement", description: "Capital pour la bourse, l'immobilier, les fonds, une entreprise ou d'autres actifs." },
        giving: { title: "Générosité", description: "Cadeaux, associations, fondations, refuges et soutien aux personnes dans le besoin." },
      },
      eyebrow: "Repartition du revenu",
      title: "Modele des 6 bocaux",
      description: "Repartissez le revenu entre besoins, education, depenses planifiees, plaisir, investissement et generosite.",
      incomeLabel: "Revenu mensuel",
      incomeHelp: "Modele educatif. Adaptez-le a votre situation.",
      readLabel: "Lire la repartition",
      totalLabel: "Total",
      voiceIntro: (amount) => `Repartition du revenu en 6 bocaux pour ${amount}.`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "Besoins", description: "Repas à l'école, tickets, cahiers ou une chose vraiment nécessaire." },
        education: { title: "Apprendre", description: "Livres, cours, langues, activités ou jeux éducatifs." },
        longTerm: { title: "Grand objectif", description: "Un vélo, une console, des vacances ou un plus grand rêve qui demande du temps." },
        fun: { title: "Plaisir", description: "Petits bonheurs : cinéma, glace, jouets ou loisirs." },
        investing: { title: "Faire grandir", description: "L'argent auquel on ne touche pas, pour apprendre à construire l'avenir." },
        giving: { title: "Aider", description: "Un cadeau, aider un proche ou soutenir une bonne cause." },
      },
      eyebrow: "Bocaux d'argent",
      title: "6 missions pour ton argent",
      description: "Entre ton argent de poche ou un cadeau et vois la repartition.",
      incomeLabel: "Argent de poche ou cadeau",
      incomeHelp: "Un systeme simple: depenser, apprendre, economiser, profiter, grandir et aider.",
      readLabel: "Lire mes bocaux",
      totalLabel: "Total",
      voiceIntro: (amount) => `Argent de poche reparti en 6 bocaux pour ${amount}.`,
    },
  },
  zh: {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "必需开支", description: "账单、房租、食物、交通、贷款和保险。" },
        education: { title: "教育", description: "书籍、课程、培训、会议以及孩子的教育。" },
        longTerm: { title: "长期支出", description: "有计划的大额消费、假期或修车，而不必借债。" },
        fun: { title: "娱乐", description: "你有意花在快乐、爱好和健康奖励上的钱。" },
        investing: { title: "投资", description: "用于股票、房产、基金、生意或其他资产的本金。" },
        giving: { title: "奉献", description: "礼物、慈善机构、基金会、收容所以及对有需要的人的支持。" },
      },
      eyebrow: "收入分配",
      title: "6 个罐子模型",
      description: "把收入分配到必要支出、教育、长期支出、快乐、投资和帮助他人。",
      incomeLabel: "月收入",
      incomeHelp: "这是教育模型，可按个人情况调整。",
      readLabel: "朗读收入分配",
      totalLabel: "总计",
      voiceIntro: (amount) => `按 6 个罐子模型分配 ${amount}。`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "需要", description: "学校午餐、车票、本子，或者真正需要的东西。" },
        education: { title: "学习", description: "书、课程、语言、兴趣班或益智游戏。" },
        longTerm: { title: "大目标", description: "自行车、游戏机、假期，或需要时间的更大梦想。" },
        fun: { title: "娱乐", description: "小小的快乐：电影、冰淇淋、玩具或爱好。" },
        investing: { title: "成长", description: "不去动用的钱，用来学习如何打造未来。" },
        giving: { title: "帮助", description: "一份礼物、帮助身边的人，或支持一件好事。" },
      },
      eyebrow: "零花钱罐子",
      title: "把钱分成 6 个任务",
      description: "输入零花钱或礼物金额，看看每个罐子有多少。",
      incomeLabel: "零花钱或礼物",
      incomeHelp: "简单系统：花、学、存、玩、成长、帮助。",
      readLabel: "朗读我的罐子",
      totalLabel: "总计",
      voiceIntro: (amount) => `把 ${amount} 零花钱分成 6 个罐子。`,
    },
  },
  ja: {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "必要な支出", description: "公共料金、家賃、食費、交通費、ローン、保険。" },
        education: { title: "教育", description: "本、講座、研修、カンファレンス、子どもの教育。" },
        longTerm: { title: "長期の支出", description: "計画的な大きな買い物、旅行、車の修理を借金なしで。" },
        fun: { title: "楽しみ", description: "喜び、趣味、健やかなご褒美のために意識して使うお金。" },
        investing: { title: "投資", description: "株式、不動産、ファンド、事業、その他の資産のための元手。" },
        giving: { title: "分かち合い", description: "贈り物、慈善団体、財団、保護施設、困っている人への支援。" },
      },
      eyebrow: "収入の分配",
      title: "6つのジャーモデル",
      description: "収入を生活費、教育、長期支出、楽しみ、投資、寄付に分けます。",
      incomeLabel: "月収",
      incomeHelp: "教育用モデルです。状況に合わせて調整できます。",
      readLabel: "収入配分を読み上げる",
      totalLabel: "合計",
      voiceIntro: (amount) => `${amount} を6つのジャーで分配します。`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "必要なもの", description: "学校の食事、切符、ノートなど、本当に必要なもの。" },
        education: { title: "学び", description: "本、講座、語学、習い事、学べるゲーム。" },
        longTerm: { title: "大きな目標", description: "自転車、ゲーム機、旅行など、時間のかかる大きな夢。" },
        fun: { title: "楽しみ", description: "映画、アイス、おもちゃ、趣味などの小さな喜び。" },
        investing: { title: "育てる", description: "手をつけないお金。未来を作ることを学ぶために。" },
        giving: { title: "助け合い", description: "プレゼント、身近な人の手助け、良い活動への応援。" },
      },
      eyebrow: "おこづかいジャー",
      title: "お金を6つのミッションに分けよう",
      description: "おこづかいやプレゼントを入力して、配分を見ます。",
      incomeLabel: "おこづかい・プレゼント",
      incomeHelp: "使う、学ぶ、貯める、楽しむ、育てる、助ける。",
      readLabel: "ジャーを読み上げる",
      totalLabel: "合計",
      voiceIntro: (amount) => `${amount} のおこづかいを6つのジャーに分けます。`,
    },
  },
  hi: {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "ज़रूरतें", description: "बिल, किराया, खाना, यातायात, लोन और बीमा।" },
        education: { title: "शिक्षा", description: "किताबें, कोर्स, प्रशिक्षण, सम्मेलन और बच्चों की शिक्षा।" },
        longTerm: { title: "लंबी अवधि के खर्च", description: "बिना कर्ज़ के बड़ी नियोजित खरीदारी, छुट्टियां या गाड़ी की मरम्मत।" },
        fun: { title: "मनोरंजन", description: "वह पैसा जो आप सोच-समझकर खुशी, शौक और अच्छे इनामों पर खर्च करते हैं।" },
        investing: { title: "निवेश", description: "शेयर, संपत्ति, फंड, कारोबार या दूसरी संपत्तियों के लिए पूंजी।" },
        giving: { title: "दान", description: "उपहार, चैरिटी, फ़ाउंडेशन, आश्रय और ज़रूरतमंदों की मदद।" },
      },
      eyebrow: "आय विभाजन",
      title: "6 जार मॉडल",
      description: "आय को जरूरत, शिक्षा, बड़े खर्च, आनंद, निवेश और मदद में बांटें।",
      incomeLabel: "मासिक आय",
      incomeHelp: "यह शैक्षणिक मॉडल है। अपनी स्थिति के अनुसार बदलें।",
      readLabel: "आय विभाजन सुनें",
      totalLabel: "कुल",
      voiceIntro: (amount) => `${amount} को 6 जार मॉडल से बांटा गया।`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "ज़रूरतें", description: "स्कूल का खाना, टिकट, कॉपियां या कोई सचमुच ज़रूरी चीज़।" },
        education: { title: "सीखना", description: "किताबें, कोर्स, भाषाएं, कक्षाएं या शैक्षिक खेल।" },
        longTerm: { title: "बड़ा लक्ष्य", description: "साइकिल, गेम कंसोल, छुट्टियां या कोई बड़ा सपना जिसमें समय लगता है।" },
        fun: { title: "मज़ा", description: "छोटी खुशियां: सिनेमा, आइसक्रीम, खिलौने या शौक।" },
        investing: { title: "बढ़ाना", description: "वह पैसा जिसे हम नहीं छूते, ताकि भविष्य बनाना सीखें।" },
        giving: { title: "मदद", description: "कोई उपहार, किसी अपने की मदद या किसी अच्छे काम में सहयोग।" },
      },
      eyebrow: "पॉकेट मनी जार",
      title: "पैसे को 6 मिशन में बांटें",
      description: "पॉकेट मनी या उपहार लिखें और हर जार की राशि देखें।",
      incomeLabel: "पॉकेट मनी या उपहार",
      incomeHelp: "सरल सिस्टम: खर्च, सीखना, बचत, आनंद, बढ़ना और मदद।",
      readLabel: "मेरे जार सुनें",
      totalLabel: "कुल",
      voiceIntro: (amount) => `${amount} पॉकेट मनी को 6 जार में बांटा गया।`,
    },
  },
  "pt-BR": {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "Necessidades", description: "Contas, aluguel, comida, transporte, empréstimos e seguros." },
        education: { title: "Educação", description: "Livros, cursos, treinamentos, conferências e a educação dos filhos." },
        longTerm: { title: "Gastos de longo prazo", description: "Compras maiores planejadas, férias ou conserto do carro sem dívida." },
        fun: { title: "Diversão", description: "Dinheiro que você gasta de propósito com alegria, hobbies e recompensas saudáveis." },
        investing: { title: "Investimentos", description: "Capital para ações, imóveis, fundos, negócio ou outros ativos." },
        giving: { title: "Doação", description: "Presentes, instituições de caridade, fundações, abrigos e apoio a quem precisa." },
      },
      eyebrow: "Divisao da renda",
      title: "Modelo dos 6 potes",
      description: "Divida a renda em necessidades, educacao, gastos planejados, prazer, investimento e generosidade.",
      incomeLabel: "Renda mensal",
      incomeHelp: "Modelo educativo. Ajuste para sua situacao.",
      readLabel: "Ler divisao da renda",
      totalLabel: "Total",
      voiceIntro: (amount) => `Divisao da renda em 6 potes para ${amount}.`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "Necessidades", description: "Lanche da escola, passagem, cadernos ou algo realmente necessário." },
        education: { title: "Aprender", description: "Livros, cursos, idiomas, aulas ou jogos educativos." },
        longTerm: { title: "Grande meta", description: "Uma bicicleta, um videogame, férias ou um sonho maior que leva tempo." },
        fun: { title: "Diversão", description: "Pequenas alegrias: cinema, sorvete, brinquedos ou hobbies." },
        investing: { title: "Crescer", description: "Dinheiro em que não mexemos, para aprender a construir o futuro." },
        giving: { title: "Ajudar", description: "Um presente, ajudar alguém próximo ou apoiar uma boa causa." },
      },
      eyebrow: "Potes da mesada",
      title: "Divida o dinheiro em 6 missoes",
      description: "Digite a mesada ou presente e veja quanto vai para cada pote.",
      incomeLabel: "Mesada ou presente",
      incomeHelp: "Sistema simples: gastar, aprender, poupar, curtir, crescer e ajudar.",
      readLabel: "Ler meus potes",
      totalLabel: "Total",
      voiceIntro: (amount) => `Mesada dividida em 6 potes para ${amount}.`,
    },
  },
  tr: {
    adult: {
      ...ADULT_PL,
      jars: {
        necessities: { title: "İhtiyaçlar", description: "Faturalar, kira, yemek, ulaşım, krediler ve sigorta." },
        education: { title: "Eğitim", description: "Kitaplar, kurslar, eğitimler, konferanslar ve çocukların eğitimi." },
        longTerm: { title: "Uzun vadeli harcamalar", description: "Borçsuz, planlı büyük alışverişler, tatil veya araba tamiri." },
        fun: { title: "Eğlence", description: "Keyfe, hobilere ve sağlıklı ödüllere bilinçli olarak harcadığın para." },
        investing: { title: "Yatırım", description: "Hisse, gayrimenkul, fon, iş veya diğer varlıklar için sermaye." },
        giving: { title: "Paylaşma", description: "Hediyeler, hayır kurumları, vakıflar, barınaklar ve ihtiyaç sahiplerine destek." },
      },
      eyebrow: "Gelir bolumu",
      title: "6 kavanoz modeli",
      description: "Geliri zorunlu gider, egitim, uzun vadeli harcama, keyif, yatirim ve yardim olarak bol.",
      incomeLabel: "Aylik gelir",
      incomeHelp: "Egitim modeli. Kendi durumuna gore ayarla.",
      readLabel: "Gelir bolumunu oku",
      totalLabel: "Toplam",
      voiceIntro: (amount) => `${amount} icin 6 kavanoz gelir bolumu.`,
    },
    kids: {
      ...KIDS_PL,
      jars: {
        necessities: { title: "İhtiyaçlar", description: "Okul yemeği, bilet, defter ya da gerçekten gerekli bir şey." },
        education: { title: "Öğrenme", description: "Kitaplar, kurslar, diller, dersler veya eğitici oyunlar." },
        longTerm: { title: "Büyük hedef", description: "Bisiklet, oyun konsolu, tatil ya da zaman isteyen daha büyük bir hayal." },
        fun: { title: "Eğlence", description: "Küçük mutluluklar: sinema, dondurma, oyuncak veya hobi." },
        investing: { title: "Büyüt", description: "Dokunmadığımız para; geleceği kurmayı öğrenmek için." },
        giving: { title: "Yardım", description: "Bir hediye, yakınına yardım etmek ya da iyi bir amaca destek olmak." },
      },
      eyebrow: "Harclik kavanozlari",
      title: "Parayi 6 goreve bol",
      description: "Harclik veya hediye miktarini yaz ve her kavanozu gor.",
      incomeLabel: "Harclik veya hediye",
      incomeHelp: "Basit sistem: harca, ogren, biriktir, eglen, buyut ve yardim et.",
      readLabel: "Kavanozlarimi oku",
      totalLabel: "Toplam",
      voiceIntro: (amount) => `${amount} harclik 6 kavanoza bolundu.`,
    },
  },
};

const INTL_LOCALES: Record<string, string> = {
  ...LOCALE_INTL,
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
  hi: "hi-IN",
  "pt-BR": "pt-BR",
  tr: "tr-TR",
};

export function IncomeJarPlanner({
  mode,
  className,
}: {
  mode: PlannerMode;
  className?: string;
}) {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(COPY, locale)[mode];
  const [income, setIncome] = useState(mode === "kids" ? 100 : 5000);
  const [incomeInput, setIncomeInput] = useState("5000");
  const intlLocale = INTL_LOCALES[locale] ?? "en-US";
  const allocation = useMemo(() => {
    if (mode !== "adult") return null;
    const raw = incomeInput.trim();
    const value = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw) ? Number(raw) : NaN;
    return allocateIncomeCents(value, JARS.map((jar) => jar.percent));
  }, [incomeInput, mode]);
  const adultInvalid = mode === "adult" && allocation === null;
  const amountFormatter = useMemo(
    () => new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    [intlLocale]
  );
  const formatAmount = (amount: number) => mode === "adult"
    ? amountFormatter.format(amount)
    : formatCurrency(amount, t.currency, intlLocale);
  const formattedIncome = allocation
    ? formatAmount(allocation.totalCents / 100)
    : mode === "kids" ? formatAmount(income) : "";
  const maximumIncome = amountFormatter.format(FINANCIAL_AMOUNT_MAX);
  const incomeError = locale === "pl"
    ? `Wpisz kwotę od 0 do ${maximumIncome} z dokładnością do grosza.`
    : `Enter an amount from 0 to ${maximumIncome} in increments of PLN 0.01.`;

  const jarRows = useMemo(() => {
    if (mode === "adult" && allocation === null) return [];
    return JARS.map((jar, index) => ({
      ...jar,
      amount: allocation ? allocation.jarCents[index] / 100 : (income * jar.percent) / 100,
      copy: copy.jars[jar.key],
    }));
  }, [allocation, copy.jars, income, mode]);

  const voiceText = adultInvalid ? "" : [
    copy.voiceIntro(formattedIncome),
    ...jarRows.map((jar) => {
      const amount = formatAmount(jar.amount);
      return `${jar.copy.title}: ${jar.percent} percent, ${amount}. ${jar.copy.description}`;
    }),
  ].join(" ");

  return (
    <section className={cn("rounded-lg border border-primary/15 bg-card/88 p-5 shadow-soft", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-text md:text-3xl">{copy.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted md:text-base">{copy.description}</p>
        </div>
        {!adultInvalid ? (
          <VoiceButton text={voiceText} label={copy.readLabel} locale={locale} variant="pill" className="shrink-0" />
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-lg border border-primary/15 bg-background/55 p-4">
          <label className="grid gap-2 text-sm font-black text-text">
            {copy.incomeLabel}
            <input
              type="number"
              min={0}
              step={mode === "adult" ? 0.01 : 10}
              max={mode === "adult" ? FINANCIAL_AMOUNT_MAX : undefined}
              value={mode === "adult" ? incomeInput : income}
              aria-invalid={adultInvalid || undefined}
              onChange={(event) => {
                if (mode === "adult") {
                  setIncomeInput(event.target.value);
                  return;
                }
                setIncome(Math.max(0, Number(event.target.value) || 0));
              }}
              className="min-h-12 rounded-lg border border-primary/20 bg-background/70 px-3 text-xl font-black text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <div className="mt-4 rounded-lg bg-primary/10 p-4">
            <p className="text-xs font-black uppercase text-primary">{copy.totalLabel}</p>
            {adultInvalid ? (
              <p role="alert" className="mt-1 text-sm font-bold text-attention">{incomeError}</p>
            ) : (
              <p className="mt-1 text-3xl font-black text-text">{formattedIncome}</p>
            )}
            <p className="mt-2 text-xs font-bold leading-5 text-muted">{copy.incomeHelp}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {jarRows.map((jar) => {
            const Icon = jar.icon;
            const amount = formatAmount(jar.amount);

            return (
              <article key={jar.key} className="rounded-lg border border-primary/10 bg-background/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-background"
                    style={{ backgroundColor: jar.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent/18 px-2.5 py-1 text-xs font-black text-accent">
                    {jar.percent}%
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-tight text-text">{jar.copy.title}</h3>
                <p className="mt-1 text-2xl font-black text-text">{amount}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${jar.percent}%`, backgroundColor: jar.color }} />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{jar.copy.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm font-black text-accent">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        55% + 10% + 10% + 10% + 10% + 5% = 100%
      </div>
    </section>
  );
}
