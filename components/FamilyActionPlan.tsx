"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Coins,
  LockKeyhole,
  Mic,
  PiggyBank,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { addTokens } from "@/lib/tokens";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import { useProductStorage } from "@/lib/use-product-storage";
import { cn, formatCurrency, LOCALE_INTL } from "@/lib/utils";

type PlanVariant = "stabilize" | "build" | "optimize";

type PlanStep = {
  id: string;
  day: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  reward: number;
  icon: typeof ShieldCheck;
};

type FamilyActionPlanProps = {
  score: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  goal: string;
  trialActive: boolean;
  onStartTrial: () => void;
};

type PlanCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  scoreBand: Record<PlanVariant, { title: string; description: string }>;
  metrics: {
    surplus: string;
    cushion: string;
    firstJar: string;
  };
  trial: {
    title: string;
    description: string;
    active: string;
    inactive: string;
    fairUse: string;
  };
  readPlan: string;
  checklist: string;
  completed: string;
  earned: string;
  disclaimer: string;
  steps: Record<PlanVariant, Array<Omit<PlanStep, "icon">>>;
};

const PLAN_KEY = "coachfi-family-plan-actions-v1";

const PLAN_COPY: LocalizedMap<PlanCopy> = {
  en: {
    eyebrow: "Family plan",
    title: "Your first 30 days with Coach FI",
    subtitle: "A simple path from awareness to a calmer family money system.",
    scoreBand: {
      stabilize: {
        title: "First: stabilize cash pressure",
        description: "Do not add complexity yet. Protect cash flow, reduce pressure and use the free support path if needed.",
      },
      build: {
        title: "First: build the system",
        description: "Your income can start working better. Focus on automatic saving, fewer leaks and one family routine.",
      },
      optimize: {
        title: "First: optimize and teach",
        description: "You have a base. Now turn it into a family operating system: investing education, kids habits and shareable progress.",
      },
    },
    metrics: {
      surplus: "Estimated monthly surplus",
      cushion: "Safety cushion",
      firstJar: "First 10% education/investing jar",
    },
    trial: {
      title: "Mila Voice Coach trial",
      description: "Use Mila for score narration, daily learning and family money conversations for 7 days.",
      active: "Trial active",
      inactive: "Start 7-day trial",
      fairUse: "Premium removes daily learning limits and keeps fair-use protection for AI, voice and OCR.",
    },
    readPlan: "Read my family plan",
    checklist: "30-day checklist",
    completed: "Completed",
    earned: "Earned",
    disclaimer: "Educational plan only. Coach FI does not provide personalized investment, legal or tax advice.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Day 1",
          title: "Map income, bills and the biggest leak",
          description: "Write the three expenses that create the most pressure and choose one to reduce this week.",
          href: "/health-check",
          cta: "Review diagnosis",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Day 3",
          title: "Run a 24-hour buying pause",
          description: "Use Shopping Hygiene before the next non-essential purchase. Return or sell one thing if it no longer makes sense.",
          href: "/shopping",
          cta: "Open shopping hygiene",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Day 7",
          title: "Start with the smallest safe jar",
          description: "Split money manually first. Even a small automatic transfer builds the habit.",
          href: "/learn",
          cta: "Open jars",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Day 14",
          title: "Have one family money conversation",
          description: "Talk about needs, wants and the next shared goal without blame or pressure.",
          href: "/kids",
          cta: "Open Kids Mode",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Day 1",
          title: "Plan the 6-jar payday split",
          description: "Use 55% needs, 10% education, 10% long-term spending, 10% fun, 10% investing and 5% generosity.",
          href: "/learn",
          cta: "Open jars",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Day 7",
          title: "Check receipts against your list",
          description: "Paste one receipt or invoice and mark what was planned, needed or impulsive.",
          href: "/shopping",
          cta: "Analyze shopping",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Day 14",
          title: "Complete one daily lesson streak",
          description: "Let Mila explain one concept and finish the daily challenge for a reward loop.",
          href: "/challenge",
          cta: "Do challenge",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Day 21",
          title: "Create a child-safe money routine",
          description: "Use Kids Mode for needs vs wants, saving jar and stars.",
          href: "/kids",
          cta: "Open Kids Mode",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Day 1",
          title: "Turn surplus into a learning system",
          description: "Before adding risk, review inflation, emergency fund and long-term investing basics.",
          href: "/learn",
          cta: "Open learning path",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Day 7",
          title: "Audit subscriptions and impulse triggers",
          description: "Cancel, pause or unfollow anything that drains money or attention without real value.",
          href: "/shopping",
          cta: "Open shopping hygiene",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Day 14",
          title: "Share progress, not private numbers",
          description: "Use a score or certificate card to celebrate learning without exposing sensitive financial data.",
          href: "/rewards",
          cta: "Open rewards",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Day 21",
          title: "Use Mila for one family lesson",
          description: "Let Mila read a short lesson aloud and turn it into a family conversation.",
          href: "/coach",
          cta: "Ask Mila",
          reward: 45,
        },
      ],
    },
  },
  pl: {
    eyebrow: "Plan rodzinny",
    title: "Pierwsze 30 dni z Coach FI",
    subtitle: "Prosta droga od diagnozy do spokojniejszego systemu pieniędzy w rodzinie.",
    scoreBand: {
      stabilize: {
        title: "Najpierw: stabilizacja presji na gotówkę",
        description: "Nie dokładaj jeszcze złożoności. Zabezpiecz przepływ pieniędzy, zmniejsz presję i użyj bezpłatnej ścieżki pomocy, jeśli jest potrzebna.",
      },
      build: {
        title: "Najpierw: budowa systemu",
        description: "Dochód może pracować lepiej. Skup się na automatycznym odkładaniu, mniejszych wyciekach i jednej rodzinnej rutynie.",
      },
      optimize: {
        title: "Najpierw: optymalizacja i nauka rodziny",
        description: "Masz bazę. Teraz zamień ją w rodzinny system: edukacja inwestycyjna, nawyki dzieci i postęp, którym można się pochwalić.",
      },
    },
    metrics: {
      surplus: "Szacowana nadwyżka miesięczna",
      cushion: "Poduszka bezpieczeństwa",
      firstJar: "Pierwszy słoik 10% edukacja/inwestycje",
    },
    trial: {
      title: "Trial głosowej Mili",
      description: "Użyj Mili przez 7 dni do odczytu wyniku, nauki dziennej i rodzinnych rozmów o pieniądzach.",
      active: "Trial aktywny",
      inactive: "Włącz 7-dniowy trial",
      fairUse: "Premium usuwa dzienne limity nauki i zachowuje fair-use dla AI, głosu i OCR.",
    },
    readPlan: "Odczytaj mój plan rodzinny",
    checklist: "Checklist 30 dni",
    completed: "Ukończono",
    earned: "Zdobyto",
    disclaimer: "Plan edukacyjny. Coach FI nie świadczy indywidualnego doradztwa inwestycyjnego, prawnego ani podatkowego.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Dzień 1",
          title: "Rozpisz dochód, rachunki i największy wyciek",
          description: "Wypisz trzy wydatki, które tworzą największą presję, i wybierz jeden do ograniczenia w tym tygodniu.",
          href: "/health-check",
          cta: "Wróć do diagnozy",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Dzień 3",
          title: "Zrób 24-godzinną pauzę zakupową",
          description: "Użyj Higieny zakupowej przed kolejnym niekoniecznym zakupem. Zwróć albo sprzedaj jedną rzecz, jeśli nie ma sensu.",
          href: "/shopping",
          cta: "Otwórz higienę zakupową",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Dzień 7",
          title: "Zacznij od najmniejszego bezpiecznego słoika",
          description: "Najpierw podziel pieniądze ręcznie. Nawet mały automatyczny przelew buduje nawyk.",
          href: "/learn",
          cta: "Otwórz słoiki",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Dzień 14",
          title: "Zrób jedną rodzinną rozmowę o pieniądzach",
          description: "Porozmawiaj o potrzebach, zachciankach i wspólnym celu bez oceniania i presji.",
          href: "/kids",
          cta: "Otwórz Kids Mode",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Dzień 1",
          title: "Zaplanuj podział wypłaty na 6 słoików",
          description: "Użyj modelu: 55% potrzeby, 10% edukacja, 10% większe cele, 10% przyjemności, 10% inwestycje i 5% hojność.",
          href: "/learn",
          cta: "Otwórz słoiki",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Dzień 7",
          title: "Sprawdź paragon względem listy",
          description: "Wklej jeden paragon albo fakturę i oznacz, co było zaplanowane, potrzebne albo impulsywne.",
          href: "/shopping",
          cta: "Analizuj zakupy",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Dzień 14",
          title: "Zrób jedną serię dziennej nauki",
          description: "Niech Mila wyjaśni jedno pojęcie, a potem ukończ wyzwanie dnia za nagrodę.",
          href: "/challenge",
          cta: "Zrób wyzwanie",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Dzień 21",
          title: "Stwórz bezpieczną rutynę dla dziecka",
          description: "Użyj Kids Mode do potrzeb, zachcianek, słoika i gwiazdek.",
          href: "/kids",
          cta: "Otwórz Kids Mode",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Dzień 1",
          title: "Zamień nadwyżkę w system nauki",
          description: "Zanim zwiększysz ryzyko, przejdź inflację, fundusz awaryjny i podstawy inwestowania długoterminowego.",
          href: "/learn",
          cta: "Otwórz ścieżkę nauki",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Dzień 7",
          title: "Przejrzyj subskrypcje i bodźce zakupowe",
          description: "Anuluj, zatrzymaj albo wycisz to, co zabiera pieniądze lub uwagę bez realnej wartości.",
          href: "/shopping",
          cta: "Otwórz higienę zakupową",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Dzień 14",
          title: "Pochwal się postępem, nie prywatnymi liczbami",
          description: "Użyj karty wyniku albo certyfikatu, żeby pokazać naukę bez ujawniania wrażliwych danych.",
          href: "/rewards",
          cta: "Otwórz nagrody",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Dzień 21",
          title: "Użyj Mili do jednej lekcji rodzinnej",
          description: "Niech Mila odczyta krótką lekcję i zamieni ją w rozmowę w rodzinie.",
          href: "/coach",
          cta: "Zapytaj Milę",
          reward: 45,
        },
      ],
    },
  },
  es: {
    eyebrow: "Plan familiar",
    title: "Tus primeros 30 días con Coach FI",
    subtitle: "Un camino sencillo de la conciencia a un sistema familiar de dinero más tranquilo.",
    scoreBand: {
      stabilize: {
        title: "Primero: aliviar la presión de liquidez",
        description: "No añadas complejidad todavía. Protege el flujo de caja, reduce la presión y usa la vía de apoyo gratuita si la necesitas.",
      },
      build: {
        title: "Primero: construir el sistema",
        description: "Tus ingresos pueden empezar a rendir más. Céntrate en el ahorro automático, menos fugas y una rutina familiar.",
      },
      optimize: {
        title: "Primero: optimizar y enseñar",
        description: "Ya tienes una base. Ahora conviértela en un sistema familiar: educación sobre inversión, hábitos para los niños y progreso que se puede compartir.",
      },
    },
    metrics: {
      surplus: "Excedente mensual estimado",
      cushion: "Colchón de seguridad",
      firstJar: "Primer bote del 10% para educación/inversión",
    },
    trial: {
      title: "Prueba de Mila Voice Coach",
      description: "Usa a Mila para escuchar tu puntuación, aprender cada día y tener conversaciones familiares sobre el dinero durante 7 días.",
      active: "Prueba activa",
      inactive: "Empezar prueba de 7 días",
      fairUse: "Premium elimina los límites diarios de aprendizaje y mantiene la protección de uso razonable para IA, voz y OCR.",
    },
    readPlan: "Leer mi plan familiar",
    checklist: "Lista de 30 días",
    completed: "Completado",
    earned: "Ganado",
    disclaimer: "Plan únicamente educativo. Coach FI no ofrece asesoramiento personalizado de inversión, legal ni fiscal.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Día 1",
          title: "Mapea ingresos, facturas y la mayor fuga",
          description: "Anota los tres gastos que más presión generan y elige uno para reducir esta semana.",
          href: "/health-check",
          cta: "Revisar diagnóstico",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Día 3",
          title: "Haz una pausa de compra de 24 horas",
          description: "Usa la Higiene de compras antes de la próxima compra no esencial. Devuelve o vende algo si ya no tiene sentido.",
          href: "/shopping",
          cta: "Abrir higiene de compras",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Día 7",
          title: "Empieza con el bote seguro más pequeño",
          description: "Primero reparte el dinero a mano. Incluso una pequeña transferencia automática crea el hábito.",
          href: "/learn",
          cta: "Abrir botes",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Día 14",
          title: "Ten una conversación familiar sobre el dinero",
          description: "Hablad de necesidades, deseos y la próxima meta común, sin culpas ni presión.",
          href: "/kids",
          cta: "Abrir Modo niños",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Día 1",
          title: "Planifica el reparto en 6 botes el día de cobro",
          description: "Usa 55% necesidades, 10% educación, 10% gastos a largo plazo, 10% diversión, 10% inversión y 5% generosidad.",
          href: "/learn",
          cta: "Abrir botes",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Día 7",
          title: "Compara los tickets con tu lista",
          description: "Pega un ticket o una factura y marca qué estaba planificado, qué era necesario y qué fue impulsivo.",
          href: "/shopping",
          cta: "Analizar compras",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Día 14",
          title: "Completa una racha de lección diaria",
          description: "Deja que Mila te explique un concepto y termina el reto diario para cerrar el ciclo de recompensa.",
          href: "/challenge",
          cta: "Hacer el reto",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Día 21",
          title: "Crea una rutina de dinero segura para los niños",
          description: "Usa el Modo niños para necesidades frente a deseos, la hucha y las estrellas.",
          href: "/kids",
          cta: "Abrir Modo niños",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Día 1",
          title: "Convierte el excedente en un sistema de aprendizaje",
          description: "Antes de añadir riesgo, repasa la inflación, el fondo de emergencia y los fundamentos de la inversión a largo plazo.",
          href: "/learn",
          cta: "Abrir ruta de aprendizaje",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Día 7",
          title: "Audita suscripciones y disparadores de impulso",
          description: "Cancela, pausa o deja de seguir todo lo que drene dinero o atención sin aportar valor real.",
          href: "/shopping",
          cta: "Abrir higiene de compras",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Día 14",
          title: "Comparte el progreso, no las cifras privadas",
          description: "Usa una tarjeta de puntuación o de certificado para celebrar el aprendizaje sin exponer datos financieros sensibles.",
          href: "/rewards",
          cta: "Abrir recompensas",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Día 21",
          title: "Usa a Mila para una lección en familia",
          description: "Deja que Mila lea una lección corta en voz alta y conviértela en una conversación familiar.",
          href: "/coach",
          cta: "Preguntar a Mila",
          reward: 45,
        },
      ],
    },
  },
  fr: {
    eyebrow: "Plan familial",
    title: "Vos 30 premiers jours avec Coach FI",
    subtitle: "Un chemin simple, de la prise de conscience à un système d'argent familial plus serein.",
    scoreBand: {
      stabilize: {
        title: "D'abord : soulager la pression de trésorerie",
        description: "N'ajoutez pas de complexité pour l'instant. Protégez votre trésorerie, réduisez la pression et utilisez le parcours d'aide gratuit si besoin.",
      },
      build: {
        title: "D'abord : construire le système",
        description: "Vos revenus peuvent commencer à mieux travailler. Concentrez-vous sur l'épargne automatique, moins de fuites et une routine familiale.",
      },
      optimize: {
        title: "D'abord : optimiser et transmettre",
        description: "Vous avez une base. Faites-en maintenant un système familial : éducation à l'investissement, habitudes pour les enfants et progrès à partager.",
      },
    },
    metrics: {
      surplus: "Excédent mensuel estimé",
      cushion: "Matelas de sécurité",
      firstJar: "Première enveloppe de 10 % éducation/investissement",
    },
    trial: {
      title: "Essai de Mila Voice Coach",
      description: "Utilisez Mila pendant 7 jours pour écouter votre score, apprendre chaque jour et parler d'argent en famille.",
      active: "Essai actif",
      inactive: "Démarrer l'essai de 7 jours",
      fairUse: "Premium supprime les limites quotidiennes d'apprentissage et conserve une protection d'usage raisonnable pour l'IA, la voix et l'OCR.",
    },
    readPlan: "Lire mon plan familial",
    checklist: "Liste des 30 jours",
    completed: "Terminé",
    earned: "Gagné",
    disclaimer: "Plan uniquement éducatif. Coach FI ne fournit pas de conseil personnalisé en investissement, en droit ou en fiscalité.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Jour 1",
          title: "Cartographiez revenus, factures et la plus grosse fuite",
          description: "Notez les trois dépenses qui créent le plus de pression et choisissez-en une à réduire cette semaine.",
          href: "/health-check",
          cta: "Revoir le diagnostic",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Jour 3",
          title: "Faites une pause d'achat de 24 heures",
          description: "Utilisez l'Hygiène d'achat avant le prochain achat non essentiel. Rendez ou revendez un objet s'il n'a plus de sens.",
          href: "/shopping",
          cta: "Ouvrir l'hygiène d'achat",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Jour 7",
          title: "Commencez par la plus petite enveloppe sûre",
          description: "Répartissez d'abord l'argent à la main. Même un petit virement automatique installe l'habitude.",
          href: "/learn",
          cta: "Ouvrir les enveloppes",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Jour 14",
          title: "Ayez une conversation familiale sur l'argent",
          description: "Parlez des besoins, des envies et du prochain objectif commun, sans reproche ni pression.",
          href: "/kids",
          cta: "Ouvrir le Mode enfants",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Jour 1",
          title: "Planifiez la répartition en 6 enveloppes le jour de paie",
          description: "Utilisez 55 % besoins, 10 % éducation, 10 % dépenses à long terme, 10 % plaisir, 10 % investissement et 5 % générosité.",
          href: "/learn",
          cta: "Ouvrir les enveloppes",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Jour 7",
          title: "Comparez les tickets à votre liste",
          description: "Collez un ticket ou une facture et indiquez ce qui était prévu, nécessaire ou impulsif.",
          href: "/shopping",
          cta: "Analyser les achats",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Jour 14",
          title: "Réalisez une série de leçons quotidiennes",
          description: "Laissez Mila expliquer une notion et terminez le défi du jour pour boucler la boucle de récompense.",
          href: "/challenge",
          cta: "Faire le défi",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Jour 21",
          title: "Créez une routine d'argent adaptée aux enfants",
          description: "Utilisez le Mode enfants pour les besoins et les envies, la tirelire et les étoiles.",
          href: "/kids",
          cta: "Ouvrir le Mode enfants",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Jour 1",
          title: "Transformez l'excédent en système d'apprentissage",
          description: "Avant d'ajouter du risque, revoyez l'inflation, l'épargne de précaution et les bases de l'investissement à long terme.",
          href: "/learn",
          cta: "Ouvrir le parcours d'apprentissage",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Jour 7",
          title: "Auditez abonnements et déclencheurs d'achats impulsifs",
          description: "Résiliez, suspendez ou ne suivez plus ce qui vide votre argent ou votre attention sans valeur réelle.",
          href: "/shopping",
          cta: "Ouvrir l'hygiène d'achat",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Jour 14",
          title: "Partagez vos progrès, pas vos chiffres privés",
          description: "Utilisez une carte de score ou de certificat pour célébrer l'apprentissage sans exposer de données financières sensibles.",
          href: "/rewards",
          cta: "Ouvrir les récompenses",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Jour 21",
          title: "Utilisez Mila pour une leçon en famille",
          description: "Laissez Mila lire une courte leçon à voix haute et faites-en une conversation familiale.",
          href: "/coach",
          cta: "Demander à Mila",
          reward: 45,
        },
      ],
    },
  },
  zh: {
    eyebrow: "家庭计划",
    title: "与 Coach FI 的前 30 天",
    subtitle: "从有所觉察到更从容的家庭财务系统，一条简单的路径。",
    scoreBand: {
      stabilize: {
        title: "第一步：缓解现金压力",
        description: "暂时不要增加复杂度。保护现金流、减轻压力，需要时使用免费的支持路径。",
      },
      build: {
        title: "第一步：建立系统",
        description: "你的收入可以开始更好地为你工作。专注于自动储蓄、减少漏洞和一个家庭习惯。",
      },
      optimize: {
        title: "第一步：优化并传授",
        description: "你已经有了基础。现在把它变成家庭运作系统：投资教育、孩子的习惯和可分享的进步。",
      },
    },
    metrics: {
      surplus: "预计每月结余",
      cushion: "安全缓冲",
      firstJar: "第一个 10% 教育/投资罐",
    },
    trial: {
      title: "Mila 语音教练试用",
      description: "在 7 天内使用 Mila 来讲解得分、每日学习和开展家庭金钱对话。",
      active: "试用中",
      inactive: "开始 7 天试用",
      fairUse: "高级版取消每日学习上限，并对 AI、语音和 OCR 保留合理使用保护。",
    },
    readPlan: "朗读我的家庭计划",
    checklist: "30 天清单",
    completed: "已完成",
    earned: "已获得",
    disclaimer: "仅为教育计划。Coach FI 不提供个性化的投资、法律或税务建议。",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "第 1 天",
          title: "梳理收入、账单和最大的漏洞",
          description: "写下压力最大的三项支出，选一项在本周减少。",
          href: "/health-check",
          cta: "查看诊断",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "第 3 天",
          title: "执行 24 小时购买冷静期",
          description: "在下一次非必需消费前使用“购物卫生”。如果某样东西已不再合适，就退货或卖掉。",
          href: "/shopping",
          cta: "打开购物卫生",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "第 7 天",
          title: "从最小的安全罐开始",
          description: "先手动分配金钱。即使是一笔小额自动转账也能养成习惯。",
          href: "/learn",
          cta: "打开存钱罐",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "第 14 天",
          title: "进行一次家庭金钱对话",
          description: "聊聊需要、想要和下一个共同目标，不指责、不施压。",
          href: "/kids",
          cta: "打开儿童模式",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "第 1 天",
          title: "规划发薪日的 6 罐分配",
          description: "按 55% 必需、10% 教育、10% 长期支出、10% 娱乐、10% 投资和 5% 奉献来分配。",
          href: "/learn",
          cta: "打开存钱罐",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "第 7 天",
          title: "对照清单检查小票",
          description: "粘贴一张小票或发票，标出哪些是计划内、必需或冲动消费。",
          href: "/shopping",
          cta: "分析购物",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "第 14 天",
          title: "完成一次每日课程连胜",
          description: "让 Mila 讲解一个概念，并完成每日挑战，形成奖励闭环。",
          href: "/challenge",
          cta: "去挑战",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "第 21 天",
          title: "建立适合孩子的金钱习惯",
          description: "用儿童模式学习需要与想要、存钱罐和星星。",
          href: "/kids",
          cta: "打开儿童模式",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "第 1 天",
          title: "把结余变成学习系统",
          description: "在增加风险之前，先复习通胀、应急基金和长期投资基础。",
          href: "/learn",
          cta: "打开学习路径",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "第 7 天",
          title: "审查订阅和冲动消费诱因",
          description: "取消、暂停或取关任何消耗金钱或注意力却没有实际价值的东西。",
          href: "/shopping",
          cta: "打开购物卫生",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "第 14 天",
          title: "分享进步，而不是私人数字",
          description: "用得分卡或证书卡庆祝学习成果，同时不暴露敏感的财务数据。",
          href: "/rewards",
          cta: "打开奖励",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "第 21 天",
          title: "用 Mila 上一堂家庭课",
          description: "让 Mila 朗读一节短课，并把它变成一次家庭对话。",
          href: "/coach",
          cta: "问问 Mila",
          reward: 45,
        },
      ],
    },
  },
  hi: {
    eyebrow: "पारिवारिक योजना",
    title: "Coach FI के साथ आपके पहले 30 दिन",
    subtitle: "जागरूकता से एक शांत पारिवारिक पैसा-प्रणाली तक का सरल रास्ता।",
    scoreBand: {
      stabilize: {
        title: "पहले: नकदी का दबाव संभालें",
        description: "अभी जटिलता न बढ़ाएं। कैश फ़्लो बचाएं, दबाव घटाएं और ज़रूरत हो तो मुफ़्त सहायता वाला रास्ता अपनाएं।",
      },
      build: {
        title: "पहले: सिस्टम बनाएं",
        description: "आपकी आय बेहतर काम करना शुरू कर सकती है। स्वचालित बचत, कम रिसाव और एक पारिवारिक रूटीन पर ध्यान दें।",
      },
      optimize: {
        title: "पहले: बेहतर बनाएं और सिखाएं",
        description: "आपके पास आधार है। अब इसे पारिवारिक सिस्टम में बदलें: निवेश की शिक्षा, बच्चों की आदतें और साझा करने लायक प्रगति।",
      },
    },
    metrics: {
      surplus: "अनुमानित मासिक बचत",
      cushion: "सुरक्षा कुशन",
      firstJar: "पहला 10% शिक्षा/निवेश जार",
    },
    trial: {
      title: "Mila वॉइस कोच ट्रायल",
      description: "7 दिन तक स्कोर सुनने, रोज़ सीखने और परिवार में पैसे पर बातचीत के लिए Mila का उपयोग करें।",
      active: "ट्रायल चालू है",
      inactive: "7 दिन का ट्रायल शुरू करें",
      fairUse: "Premium रोज़ाना सीखने की सीमाएं हटाता है और AI, आवाज़ और OCR के लिए उचित उपयोग सुरक्षा बनाए रखता है।",
    },
    readPlan: "मेरी पारिवारिक योजना पढ़ें",
    checklist: "30 दिन की चेकलिस्ट",
    completed: "पूरा हुआ",
    earned: "कमाया",
    disclaimer: "सिर्फ़ शैक्षिक योजना। Coach FI व्यक्तिगत निवेश, कानूनी या टैक्स सलाह नहीं देता।",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "दिन 1",
          title: "आय, बिल और सबसे बड़े रिसाव का नक्शा बनाएं",
          description: "सबसे ज़्यादा दबाव बनाने वाले तीन खर्च लिखें और इस हफ़्ते घटाने के लिए एक चुनें।",
          href: "/health-check",
          cta: "जांच देखें",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "दिन 3",
          title: "24 घंटे का खरीदारी विराम लें",
          description: "अगली गैर-ज़रूरी खरीद से पहले खरीदारी की समझ का उपयोग करें। जो चीज़ अब काम की नहीं, उसे लौटाएं या बेच दें।",
          href: "/shopping",
          cta: "खरीदारी की समझ खोलें",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "दिन 7",
          title: "सबसे छोटे सुरक्षित जार से शुरू करें",
          description: "पहले पैसे हाथ से बांटें। एक छोटा स्वचालित ट्रांसफ़र भी आदत बना देता है।",
          href: "/learn",
          cta: "जार खोलें",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "दिन 14",
          title: "परिवार के साथ पैसे पर एक बातचीत करें",
          description: "बिना दोष या दबाव के ज़रूरतों, चाहतों और अगले साझा लक्ष्य पर बात करें।",
          href: "/kids",
          cta: "किड्स मोड खोलें",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "दिन 1",
          title: "वेतन के दिन 6-जार बंटवारे की योजना बनाएं",
          description: "55% ज़रूरतें, 10% शिक्षा, 10% लंबी अवधि के खर्च, 10% मनोरंजन, 10% निवेश और 5% उदारता रखें।",
          href: "/learn",
          cta: "जार खोलें",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "दिन 7",
          title: "रसीदों को अपनी सूची से मिलाएं",
          description: "एक रसीद या इनवॉइस पेस्ट करें और चिह्नित करें कि क्या योजनाबद्ध, ज़रूरी या आवेग में था।",
          href: "/shopping",
          cta: "खरीदारी का विश्लेषण करें",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "दिन 14",
          title: "रोज़ के पाठ की एक स्ट्रीक पूरी करें",
          description: "Mila से एक अवधारणा समझें और इनाम के चक्र के लिए दैनिक चुनौती पूरी करें।",
          href: "/challenge",
          cta: "चुनौती करें",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "दिन 21",
          title: "बच्चों के लिए सुरक्षित पैसा-रूटीन बनाएं",
          description: "ज़रूरत बनाम चाहत, गुल्लक और स्टार के लिए किड्स मोड का उपयोग करें।",
          href: "/kids",
          cta: "किड्स मोड खोलें",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "दिन 1",
          title: "बचत को सीखने के सिस्टम में बदलें",
          description: "जोखिम बढ़ाने से पहले महंगाई, आपातकालीन फंड और लंबी अवधि के निवेश की बुनियाद दोहराएं।",
          href: "/learn",
          cta: "सीखने का रास्ता खोलें",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "दिन 7",
          title: "सब्सक्रिप्शन और आवेग के कारणों की जांच करें",
          description: "जो भी चीज़ असली मूल्य के बिना पैसा या ध्यान खींचती है, उसे रद्द करें, रोकें या अनफ़ॉलो करें।",
          href: "/shopping",
          cta: "खरीदारी की समझ खोलें",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "दिन 14",
          title: "प्रगति शेयर करें, निजी आंकड़े नहीं",
          description: "संवेदनशील वित्तीय डेटा उजागर किए बिना सीखने का जश्न मनाने के लिए स्कोर या सर्टिफ़िकेट कार्ड का उपयोग करें।",
          href: "/rewards",
          cta: "इनाम खोलें",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "दिन 21",
          title: "एक पारिवारिक पाठ के लिए Mila का उपयोग करें",
          description: "Mila से एक छोटा पाठ ज़ोर से पढ़वाएं और उसे पारिवारिक बातचीत में बदलें।",
          href: "/coach",
          cta: "Mila से पूछें",
          reward: 45,
        },
      ],
    },
  },
  "pt-BR": {
    eyebrow: "Plano familiar",
    title: "Seus primeiros 30 dias com o Coach FI",
    subtitle: "Um caminho simples da consciência até um sistema de dinheiro familiar mais tranquilo.",
    scoreBand: {
      stabilize: {
        title: "Primeiro: aliviar a pressão no caixa",
        description: "Não adicione complexidade ainda. Proteja o fluxo de caixa, reduza a pressão e use o caminho de apoio gratuito se precisar.",
      },
      build: {
        title: "Primeiro: construir o sistema",
        description: "Sua renda pode começar a trabalhar melhor. Foque em poupança automática, menos vazamentos e uma rotina familiar.",
      },
      optimize: {
        title: "Primeiro: otimizar e ensinar",
        description: "Você já tem uma base. Agora transforme-a em um sistema familiar: educação sobre investimentos, hábitos para as crianças e progresso que dá para compartilhar.",
      },
    },
    metrics: {
      surplus: "Sobra mensal estimada",
      cushion: "Colchão de segurança",
      firstJar: "Primeiro pote de 10% para educação/investimento",
    },
    trial: {
      title: "Teste da Mila Voice Coach",
      description: "Use a Mila por 7 dias para ouvir sua pontuação, aprender todo dia e conversar sobre dinheiro em família.",
      active: "Teste ativo",
      inactive: "Começar teste de 7 dias",
      fairUse: "O Premium remove os limites diários de aprendizado e mantém a proteção de uso justo para IA, voz e OCR.",
    },
    readPlan: "Ler meu plano familiar",
    checklist: "Checklist de 30 dias",
    completed: "Concluído",
    earned: "Ganho",
    disclaimer: "Plano apenas educacional. O Coach FI não oferece consultoria personalizada de investimentos, jurídica ou tributária.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Dia 1",
          title: "Mapeie renda, contas e o maior vazamento",
          description: "Anote as três despesas que mais pressionam e escolha uma para reduzir nesta semana.",
          href: "/health-check",
          cta: "Rever diagnóstico",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Dia 3",
          title: "Faça uma pausa de 24 horas antes de comprar",
          description: "Use a Higiene de compras antes da próxima compra não essencial. Devolva ou venda algo que já não faz sentido.",
          href: "/shopping",
          cta: "Abrir higiene de compras",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Dia 7",
          title: "Comece pelo menor pote seguro",
          description: "Primeiro divida o dinheiro manualmente. Até uma pequena transferência automática cria o hábito.",
          href: "/learn",
          cta: "Abrir potes",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Dia 14",
          title: "Tenha uma conversa em família sobre dinheiro",
          description: "Falem sobre necessidades, desejos e a próxima meta em comum, sem culpa nem pressão.",
          href: "/kids",
          cta: "Abrir Modo infantil",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Dia 1",
          title: "Planeje a divisão em 6 potes no dia do pagamento",
          description: "Use 55% necessidades, 10% educação, 10% gastos de longo prazo, 10% diversão, 10% investimento e 5% generosidade.",
          href: "/learn",
          cta: "Abrir potes",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Dia 7",
          title: "Confira os recibos com a sua lista",
          description: "Cole um recibo ou nota fiscal e marque o que foi planejado, necessário ou por impulso.",
          href: "/shopping",
          cta: "Analisar compras",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Dia 14",
          title: "Complete uma sequência de aula diária",
          description: "Deixe a Mila explicar um conceito e termine o desafio diário para fechar o ciclo de recompensa.",
          href: "/challenge",
          cta: "Fazer o desafio",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Dia 21",
          title: "Crie uma rotina de dinheiro segura para crianças",
          description: "Use o Modo infantil para necessidades e desejos, cofrinho e estrelas.",
          href: "/kids",
          cta: "Abrir Modo infantil",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Dia 1",
          title: "Transforme a sobra em um sistema de aprendizado",
          description: "Antes de aumentar o risco, revise inflação, reserva de emergência e fundamentos do investimento de longo prazo.",
          href: "/learn",
          cta: "Abrir trilha de aprendizado",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Dia 7",
          title: "Audite assinaturas e gatilhos de impulso",
          description: "Cancele, pause ou deixe de seguir tudo o que drena dinheiro ou atenção sem valor real.",
          href: "/shopping",
          cta: "Abrir higiene de compras",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Dia 14",
          title: "Compartilhe o progresso, não os números privados",
          description: "Use um cartão de pontuação ou de certificado para celebrar o aprendizado sem expor dados financeiros sensíveis.",
          href: "/rewards",
          cta: "Abrir recompensas",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Dia 21",
          title: "Use a Mila para uma aula em família",
          description: "Deixe a Mila ler uma aula curta em voz alta e transforme isso em uma conversa em família.",
          href: "/coach",
          cta: "Perguntar à Mila",
          reward: 45,
        },
      ],
    },
  },
  tr: {
    eyebrow: "Aile planı",
    title: "Coach FI ile ilk 30 günün",
    subtitle: "Farkındalıktan daha sakin bir aile para sistemine uzanan basit bir yol.",
    scoreBand: {
      stabilize: {
        title: "Önce: nakit baskısını dengele",
        description: "Henüz karmaşıklık ekleme. Nakit akışını koru, baskıyı azalt ve gerekirse ücretsiz destek yolunu kullan.",
      },
      build: {
        title: "Önce: sistemi kur",
        description: "Gelirin daha iyi çalışmaya başlayabilir. Otomatik birikime, daha az sızıntıya ve tek bir aile rutinine odaklan.",
      },
      optimize: {
        title: "Önce: iyileştir ve öğret",
        description: "Bir temelin var. Şimdi bunu bir aile sistemine dönüştür: yatırım eğitimi, çocuk alışkanlıkları ve paylaşılabilir ilerleme.",
      },
    },
    metrics: {
      surplus: "Tahmini aylık fazla",
      cushion: "Güvenlik yastığı",
      firstJar: "İlk %10'luk eğitim/yatırım kavanozu",
    },
    trial: {
      title: "Mila Sesli Koç denemesi",
      description: "7 gün boyunca puan anlatımı, günlük öğrenme ve aile içi para sohbetleri için Mila'yı kullan.",
      active: "Deneme etkin",
      inactive: "7 günlük denemeyi başlat",
      fairUse: "Premium günlük öğrenme sınırlarını kaldırır ve AI, ses ve OCR için adil kullanım korumasını sürdürür.",
    },
    readPlan: "Aile planımı oku",
    checklist: "30 günlük kontrol listesi",
    completed: "Tamamlandı",
    earned: "Kazanıldı",
    disclaimer: "Yalnızca eğitim amaçlı plan. Coach FI kişiye özel yatırım, hukuk veya vergi tavsiyesi vermez.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "1. gün",
          title: "Geliri, faturaları ve en büyük sızıntıyı haritala",
          description: "En çok baskı yaratan üç gideri yaz ve bu hafta azaltmak için birini seç.",
          href: "/health-check",
          cta: "Teşhisi gözden geçir",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "3. gün",
          title: "24 saatlik satın alma molası ver",
          description: "Bir sonraki zorunlu olmayan alışverişten önce Alışveriş Hijyeni'ni kullan. Artık anlamlı olmayan bir şeyi iade et veya sat.",
          href: "/shopping",
          cta: "Alışveriş hijyenini aç",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "7. gün",
          title: "En küçük güvenli kavanozla başla",
          description: "Parayı önce elle böl. Küçük bir otomatik transfer bile alışkanlığı kurar.",
          href: "/learn",
          cta: "Kavanozları aç",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "14. gün",
          title: "Ailece bir para sohbeti yapın",
          description: "Suçlama ve baskı olmadan ihtiyaçları, istekleri ve bir sonraki ortak hedefi konuşun.",
          href: "/kids",
          cta: "Çocuk modunu aç",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "1. gün",
          title: "Maaş gününde 6 kavanozluk dağılımı planla",
          description: "%55 ihtiyaçlar, %10 eğitim, %10 uzun vadeli harcama, %10 eğlence, %10 yatırım ve %5 cömertlik kullan.",
          href: "/learn",
          cta: "Kavanozları aç",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "7. gün",
          title: "Fişleri listenle karşılaştır",
          description: "Bir fiş veya fatura yapıştır; neyin planlı, gerekli veya anlık olduğunu işaretle.",
          href: "/shopping",
          cta: "Alışverişi analiz et",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "14. gün",
          title: "Bir günlük ders serisini tamamla",
          description: "Mila'nın bir kavramı açıklamasına izin ver ve ödül döngüsü için günlük görevi bitir.",
          href: "/challenge",
          cta: "Görevi yap",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "21. gün",
          title: "Çocuğa uygun bir para rutini oluştur",
          description: "İhtiyaç-istek ayrımı, kumbara ve yıldızlar için Çocuk Modu'nu kullan.",
          href: "/kids",
          cta: "Çocuk modunu aç",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "1. gün",
          title: "Fazlayı bir öğrenme sistemine dönüştür",
          description: "Risk eklemeden önce enflasyonu, acil durum fonunu ve uzun vadeli yatırımın temellerini gözden geçir.",
          href: "/learn",
          cta: "Öğrenme yolunu aç",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "7. gün",
          title: "Abonelikleri ve dürtü tetikleyicilerini denetle",
          description: "Gerçek bir değer katmadan paranı veya dikkatini tüketen her şeyi iptal et, duraklat veya takipten çık.",
          href: "/shopping",
          cta: "Alışveriş hijyenini aç",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "14. gün",
          title: "Özel rakamları değil, ilerlemeyi paylaş",
          description: "Hassas finansal verileri açığa çıkarmadan öğrenmeyi kutlamak için bir puan veya sertifika kartı kullan.",
          href: "/rewards",
          cta: "Ödülleri aç",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "21. gün",
          title: "Bir aile dersi için Mila'yı kullan",
          description: "Mila kısa bir dersi sesli okusun, sonra bunu bir aile sohbetine dönüştür.",
          href: "/coach",
          cta: "Mila'ya sor",
          reward: 45,
        },
      ],
    },
  },
  ja: {
    eyebrow: "家族プラン",
    title: "Coach FIとの最初の30日",
    subtitle: "気づきから、落ち着いた家族のお金の仕組みへ進むシンプルな道筋です。",
    scoreBand: {
      stabilize: {
        title: "まずは：資金繰りの負担を落ち着かせる",
        description: "まだ複雑にしないでください。お金の流れを守り、負担を減らし、必要なら無料のサポートを使いましょう。",
      },
      build: {
        title: "まずは：仕組みを作る",
        description: "収入をもっと上手に働かせられます。自動の貯蓄、ムダの削減、家族の習慣1つに集中しましょう。",
      },
      optimize: {
        title: "まずは：最適化して教える",
        description: "土台はできています。これを家族の運営の仕組みにしましょう。投資の学び、子どもの習慣、共有できる成果です。",
      },
    },
    metrics: {
      surplus: "毎月の余剰の目安",
      cushion: "安全のためのクッション",
      firstJar: "最初の10%の教育・投資用の瓶",
    },
    trial: {
      title: "Milaボイスコーチのトライアル",
      description: "7日間、スコアの読み上げ、毎日の学習、家族でのお金の会話にMilaを使えます。",
      active: "トライアル実施中",
      inactive: "7日間のトライアルを開始",
      fairUse: "Premiumは毎日の学習の上限をなくし、AI・音声・OCRには適正利用の保護を保ちます。",
    },
    readPlan: "家族プランを読み上げる",
    checklist: "30日チェックリスト",
    completed: "完了",
    earned: "獲得",
    disclaimer: "学習用のプランです。Coach FIは個別の投資・法律・税務のアドバイスは行いません。",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "1日目",
          title: "収入、請求、いちばん大きな漏れを書き出す",
          description: "負担の大きい支出を3つ書き出し、今週減らすものを1つ選びます。",
          href: "/health-check",
          cta: "診断を見直す",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "3日目",
          title: "24時間の購入休止をする",
          description: "次の必需品以外の買い物の前に「買い物の衛生習慣」を使いましょう。意味のなくなったものは返品するか売りましょう。",
          href: "/shopping",
          cta: "買い物の衛生習慣を開く",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "7日目",
          title: "いちばん小さな安全な瓶から始める",
          description: "まずは手作業でお金を分けます。小さな自動振替でも習慣になります。",
          href: "/learn",
          cta: "瓶を開く",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "14日目",
          title: "家族でお金の話を1回する",
          description: "責めたり急かしたりせずに、必要なもの、ほしいもの、次の共通の目標について話しましょう。",
          href: "/kids",
          cta: "キッズモードを開く",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "1日目",
          title: "給料日の6つの瓶への配分を決める",
          description: "必要55%、教育10%、長期の支出10%、楽しみ10%、投資10%、分かち合い5%で分けます。",
          href: "/learn",
          cta: "瓶を開く",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "7日目",
          title: "レシートをリストと照らし合わせる",
          description: "レシートや請求書を1枚貼り付け、計画していたもの、必要だったもの、衝動的だったものに印を付けます。",
          href: "/shopping",
          cta: "買い物を分析",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "14日目",
          title: "毎日のレッスンを続けて達成する",
          description: "Milaに1つの考え方を説明してもらい、今日のチャレンジを終えてごほうびのサイクルを完成させます。",
          href: "/challenge",
          cta: "チャレンジに挑戦",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "21日目",
          title: "子どもに合ったお金の習慣を作る",
          description: "必要なものとほしいもの、貯金箱、星のためにキッズモードを使いましょう。",
          href: "/kids",
          cta: "キッズモードを開く",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "1日目",
          title: "余剰を学びの仕組みに変える",
          description: "リスクを増やす前に、インフレ、緊急資金、長期投資の基礎を復習しましょう。",
          href: "/learn",
          cta: "学習パスを開く",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "7日目",
          title: "サブスクと衝動のきっかけを見直す",
          description: "本当の価値がないのにお金や注意力を奪うものは、解約、一時停止、フォロー解除しましょう。",
          href: "/shopping",
          cta: "買い物の衛生習慣を開く",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "14日目",
          title: "個人の数字ではなく、成果を共有する",
          description: "スコアや証明書のカードで、大切なお金の情報を見せずに学びを祝いましょう。",
          href: "/rewards",
          cta: "リワードを開く",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "21日目",
          title: "Milaと家族レッスンを1回する",
          description: "Milaに短いレッスンを読み上げてもらい、家族の会話につなげましょう。",
          href: "/coach",
          cta: "Milaに聞く",
          reward: 45,
        },
      ],
    },
  },
};

const STEP_ICONS = [ShieldCheck, ShoppingBasket, PiggyBank, Users] as const;

function getVariant(score: number): PlanVariant {
  if (score < 40) return "stabilize";
  if (score < 70) return "build";
  return "optimize";
}

function readCompleted(storage: PersonalStorageHandle): Record<string, boolean> {
  if (!storage.isCurrent()) return {};
  try {
    const raw = storage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeCompleted(next: Record<string, boolean>, storage: PersonalStorageHandle) {
  if (!storage.isCurrent() || !storage.setItem(PLAN_KEY, JSON.stringify(next)) || !storage.isCurrent()) throw new Error("Personal storage scope changed");
}

export function FamilyActionPlan({
  score,
  monthlyIncome,
  monthlyExpenses,
  savings,
  goal,
  trialActive,
  onStartTrial,
}: FamilyActionPlanProps) {
  const { storage } = useProductStorage();
  const { locale, t } = useLanguage();
  const copy = pickLocalized(PLAN_COPY, locale);
  const intlLocale = LOCALE_INTL[locale] ?? "en-US";
  const variant = getVariant(score);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [earnedThisSession, setEarnedThisSession] = useState(0);

  useEffect(() => {
    setCompleted(readCompleted(storage)); setEarnedThisSession(0);
  }, [storage]);

  const steps = useMemo(
    () =>
      copy.steps[variant].map((step, index) => ({
        ...step,
        icon: STEP_ICONS[index] ?? ShieldCheck,
      })),
    [copy.steps, variant]
  );

  const completedCount = steps.filter((step) => completed[step.id]).length;
  const surplus = Math.max(0, monthlyIncome - monthlyExpenses);
  const cushionMonths = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const firstJar = Math.max(0, monthlyIncome * 0.1);

  const planVoice = [
    copy.title,
    copy.scoreBand[variant].title,
    copy.scoreBand[variant].description,
    ...steps.map((step) => `${step.day}. ${step.title}. ${step.description}`),
    copy.trial.fairUse,
  ].join(". ");

  function toggleStep(step: PlanStep) {
    if (!storage.isCurrent()) return;
    const alreadyDone = Boolean(completed[step.id]);
    const next = { ...completed, [step.id]: !alreadyDone };
    writeCompleted(next, storage);
    if (!storage.isCurrent()) return;
    setCompleted(next);

    if (!alreadyDone) {
      addTokens(step.reward, step.title, "family_action_plan", storage);
      if (!storage.isCurrent()) return;
      setEarnedThisSession((value) => value + step.reward);
    }
  }

  return (
    <section className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft md:p-6" aria-labelledby="family-plan-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 id="family-plan-title" className="mt-1 text-2xl font-black leading-tight text-text">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">{copy.subtitle}</p>
        </div>
        <VoiceButton text={planVoice} label={copy.readPlan} variant="pill" locale={locale} className="justify-center" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-black text-text">{copy.scoreBand[variant].title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted">{copy.scoreBand[variant].description}</p>
              {goal.trim() && <p className="mt-3 rounded-lg bg-white/80 p-3 text-sm font-bold text-text">{goal}</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Metric label={copy.metrics.surplus} value={formatCurrency(surplus, t.currency, intlLocale)} />
          <Metric label={copy.metrics.cushion} value={`${cushionMonths.toFixed(1)} m`} />
          <Metric label={copy.metrics.firstJar} value={formatCurrency(firstJar, t.currency, intlLocale)} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Mic className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="font-black text-text">{copy.trial.title}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-muted">{copy.trial.description}</p>
            <p className="mt-1 text-xs font-bold text-amber-800">{copy.trial.fairUse}</p>
          </div>
        </div>
        <Button type="button" variant={trialActive ? "success" : "default"} onClick={onStartTrial}>
          {trialActive ? copy.trial.active : copy.trial.inactive}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-primary">{copy.checklist}</p>
          <p className="text-sm font-semibold text-muted">
            {completedCount}/{steps.length} {copy.completed}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-sm font-black text-primary">
          <Coins className="h-4 w-4" aria-hidden="true" />
          {copy.earned}: +{earnedThisSession}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const checked = Boolean(completed[step.id]);

          return (
            <article
              key={step.id}
              className={cn(
                "rounded-lg border p-4 transition",
                checked ? "border-success/30 bg-success/10" : "border-primary/10 bg-background/35"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(step)}
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    checked ? "border-success bg-success text-text" : "border-primary/15 bg-white text-primary hover:bg-primary/5"
                  )}
                  aria-label={`${checked ? copy.completed : "Complete"}: ${step.title}`}
                >
                  {checked ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-black uppercase text-primary">{step.day}</span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-accent/55 px-2 py-1 text-xs font-black text-[#6D5216]">
                      <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                      +{step.reward}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black leading-tight text-text">{step.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-muted">{step.description}</p>
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-black text-primary transition hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {step.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/10 bg-white/70 p-3 text-xs font-bold leading-5 text-muted">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {copy.disclaimer}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-white/85 p-3">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-text">{value}</p>
    </div>
  );
}
