"use client";

import { useEffect, useState } from "react";
import { pickLocalized, type Locale, type LocalizedMap } from "@/lib/i18n";

import { CheckCircle2, LifeBuoy, LockKeyhole, Mail, MessageCircle, Share2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { FamilyActionPlan } from "@/components/FamilyActionPlan";
import { FinancialScoreCard } from "@/components/FinancialScoreCard";
import { ShareScoreCard } from "@/components/ShareScoreCard";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { getDisplayName, getUser } from "@/lib/user";
import { getStreak } from "@/lib/streak";
import { useLanguage } from "@/context/LanguageContext";
import { scoreBand } from "@/context/progressHooks";
import { useStreak } from "@/context/StreakContext";
import { getHealthCheck, saveHealthCheck } from "@/lib/healthCheck";
import { getLocalizedContent } from "@/lib/localizedContent";

interface HealthForm {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  debt: number;
  cashHeld: number;
  hasEmergencyFund: boolean;
  understandsInflation: boolean;
  hasRetirementPlan: boolean;
  investsAlready: boolean;
  mainFinancialGoal: string;
}

type NumberKey = "monthlyIncome" | "monthlyExpenses" | "savings" | "debt" | "cashHeld";
type NumberDraft = Record<NumberKey, string>;

const EMPTY_NUMBERS: NumberDraft = { monthlyIncome: "", monthlyExpenses: "", savings: "", debt: "", cashHeld: "" };

/** Unlock state for the score gate; survives reloads on this device. */
const UNLOCK_KEY = "coachfi-health-unlocked";

function readUnlocked(): boolean {
  try {
    return window.localStorage.getItem(UNLOCK_KEY) !== null;
  } catch {
    return false;
  }
}

function writeUnlocked(savedRemotely: boolean) {
  try {
    window.localStorage.setItem(UNLOCK_KEY, JSON.stringify({ unlockedAt: new Date().toISOString(), savedRemotely }));
  } catch {
    // Storage blocked: the result stays unlocked for this visit only.
  }
}

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formFromSaved(answers: Record<string, unknown>): { numbers: NumberDraft; rest: Omit<HealthForm, NumberKey> } {
  const str = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? String(value) : "");
  return {
    numbers: {
      monthlyIncome: str(answers.monthlyIncome),
      monthlyExpenses: str(answers.monthlyExpenses),
      savings: str(answers.savings),
      debt: str(answers.debt),
      cashHeld: str(answers.cashHeld),
    },
    rest: {
      hasEmergencyFund: answers.hasEmergencyFund === true,
      understandsInflation: answers.understandsInflation === true,
      hasRetirementPlan: answers.hasRetirementPlan === true,
      investsAlready: answers.investsAlready === true,
      mainFinancialGoal: typeof answers.mainFinancialGoal === "string" ? answers.mainFinancialGoal : "",
    },
  };
}

const inputClass =
  "min-h-12 rounded-input border-2 border-border bg-white px-3 text-text shadow-sm placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

type GateCopy = Record<
  | "previewReady"
  | "previewBody"
  | "emailLabel"
  | "acceptTerms"
  | "marketing"
  | "unlock"
  | "saving"
  | "invalidEmail"
  | "offlineNote"
  | "earlyAccessTitle"
  | "earlyAccessBody"
  | "askMila"
  | "pressure"
  | "freeHelp"
  | "locked"
  | "lockedBody"
  | "goalPlaceholder"
  | "amountPlaceholder",
  string
>;

const GATE_COPY: LocalizedMap<GateCopy> = {
  en: {
    previewReady: "Your preview diagnosis is ready",
    previewBody: "Add your email to see your full score and family plan. We store only your email, language, consent choice and score range — never your amounts.",
    emailLabel: "Email",
    acceptTerms: "I accept the Terms and Privacy Policy and understand Coach FI is educational.",
    marketing: "I want educational launch emails. This consent is optional.",
    unlock: "Unlock score and plan",
    saving: "Saving...",
    invalidEmail: "Please enter a valid email address.",
    offlineNote: "We couldn't save your email right now, but your result is unlocked on this device.",
    earlyAccessTitle: "Free during early access",
    earlyAccessBody: "Mila's voice coaching, analyses and family lessons are free while Coach FI is in early access.",
    askMila: "Ask Mila about my score",
    pressure: "The score suggests financial pressure. Free help is available, but it is not the main Coach FI product.",
    freeHelp: "Show free help",
    locked: "Score is locked",
    lockedBody: "Run the free analysis. Your full score and plan unlock once you add your email.",
    goalPlaceholder: "e.g. Build an emergency fund",
    amountPlaceholder: "0",
  },
  pl: {
    previewReady: "Wstępna diagnoza jest gotowa",
    previewBody: "Podaj email, aby zobaczyć pełny wynik i plan rodzinny. Zapisujemy tylko email, język, zgodę i przedział wyniku — nigdy Twoje kwoty.",
    emailLabel: "Email",
    acceptTerms: "Akceptuję regulamin i politykę prywatności oraz rozumiem, że Coach FI ma charakter edukacyjny.",
    marketing: "Chcę otrzymywać edukacyjne materiały i informacje o premierze. To zgoda dobrowolna.",
    unlock: "Odblokuj wynik i plan",
    saving: "Zapisywanie...",
    invalidEmail: "Wpisz poprawny adres email.",
    offlineNote: "Nie udało się teraz zapisać emaila, ale wynik jest odblokowany na tym urządzeniu.",
    earlyAccessTitle: "Bezpłatnie we wczesnym dostępie",
    earlyAccessBody: "Głosowe prowadzenie Mili, analizy i lekcje rodzinne są bezpłatne, dopóki Coach FI jest we wczesnym dostępie.",
    askMila: "Zapytaj Milę o mój wynik",
    pressure: "Wynik wskazuje napięcie finansowe. Ścieżka bezpłatnej pomocy jest dostępna, ale nie jest głównym produktem Coach FI.",
    freeHelp: "Pokaż bezpłatną pomoc",
    locked: "Wynik jest zablokowany",
    lockedBody: "Zrób darmową analizę. Pełny wynik i plan odblokujesz, podając email.",
    goalPlaceholder: "np. Zbudować poduszkę bezpieczeństwa",
    amountPlaceholder: "0",
  },
  es: {
    previewReady: "Tu diagnóstico preliminar está listo",
    previewBody: "Añade tu correo para ver tu puntuación completa y el plan familiar. Solo guardamos tu correo, idioma, consentimiento y rango de puntuación, nunca tus importes.",
    emailLabel: "Correo electrónico",
    acceptTerms: "Acepto los Términos y la Política de privacidad, y entiendo que Coach FI es educativo.",
    marketing: "Quiero recibir correos educativos sobre el lanzamiento. Este consentimiento es opcional.",
    unlock: "Desbloquear puntuación y plan",
    saving: "Guardando...",
    invalidEmail: "Introduce un correo electrónico válido.",
    offlineNote: "No pudimos guardar tu correo ahora, pero tu resultado está desbloqueado en este dispositivo.",
    earlyAccessTitle: "Gratis durante el acceso anticipado",
    earlyAccessBody: "El coaching por voz de Mila, los análisis y las lecciones familiares son gratis mientras Coach FI esté en acceso anticipado.",
    askMila: "Preguntar a Mila por mi puntuación",
    pressure: "La puntuación indica presión financiera. Hay ayuda gratuita disponible, aunque no es el producto principal de Coach FI.",
    freeHelp: "Ver ayuda gratuita",
    locked: "La puntuación está bloqueada",
    lockedBody: "Haz el análisis gratuito. Tu puntuación completa y tu plan se desbloquean al añadir tu correo.",
    goalPlaceholder: "p. ej. Crear un fondo de emergencia",
    amountPlaceholder: "0",
  },
  fr: {
    previewReady: "Votre diagnostic préliminaire est prêt",
    previewBody: "Ajoutez votre e-mail pour voir votre score complet et le plan familial. Nous ne conservons que votre e-mail, votre langue, votre consentement et la tranche de score — jamais vos montants.",
    emailLabel: "E-mail",
    acceptTerms: "J'accepte les Conditions et la Politique de confidentialité, et je comprends que Coach FI est éducatif.",
    marketing: "Je souhaite recevoir des e-mails éducatifs sur le lancement. Ce consentement est facultatif.",
    unlock: "Débloquer le score et le plan",
    saving: "Enregistrement...",
    invalidEmail: "Saisissez une adresse e-mail valide.",
    offlineNote: "Impossible d'enregistrer votre e-mail pour le moment, mais votre résultat est débloqué sur cet appareil.",
    earlyAccessTitle: "Gratuit pendant l'accès anticipé",
    earlyAccessBody: "Le coaching vocal de Mila, les analyses et les leçons en famille sont gratuits tant que Coach FI est en accès anticipé.",
    askMila: "Demander à Mila à propos de mon score",
    pressure: "Le score suggère une pression financière. Une aide gratuite est disponible, mais ce n'est pas le produit principal de Coach FI.",
    freeHelp: "Voir l'aide gratuite",
    locked: "Le score est verrouillé",
    lockedBody: "Lancez l'analyse gratuite. Votre score complet et votre plan se débloquent avec votre e-mail.",
    goalPlaceholder: "ex. Constituer une épargne de précaution",
    amountPlaceholder: "0",
  },
  zh: {
    previewReady: "你的初步诊断已准备好",
    previewBody: "填写邮箱即可查看完整得分和家庭计划。我们只保存你的邮箱、语言、授权选择和得分区间，绝不保存你的金额。",
    emailLabel: "邮箱",
    acceptTerms: "我接受条款和隐私政策，并理解 Coach FI 属于教育性质。",
    marketing: "我希望收到有关上线的教育类邮件。此授权为可选。",
    unlock: "解锁得分和计划",
    saving: "正在保存...",
    invalidEmail: "请输入有效的邮箱地址。",
    offlineNote: "暂时无法保存你的邮箱，但你的结果已在此设备上解锁。",
    earlyAccessTitle: "抢先体验期间免费",
    earlyAccessBody: "在 Coach FI 抢先体验期间，Mila 的语音辅导、分析和家庭课程均免费。",
    askMila: "向 Mila 询问我的得分",
    pressure: "得分显示存在财务压力。可以获得免费帮助，但这不是 Coach FI 的主要产品。",
    freeHelp: "查看免费帮助",
    locked: "得分已锁定",
    lockedBody: "完成免费分析。填写邮箱后即可解锁完整得分和计划。",
    goalPlaceholder: "例如：建立应急基金",
    amountPlaceholder: "0",
  },
  ja: {
    previewReady: "仮の診断ができました",
    previewBody: "メールアドレスを入力すると、スコア全体と家族プランが表示されます。保存するのはメール、言語、同意の選択、スコアの範囲だけで、金額は保存しません。",
    emailLabel: "メールアドレス",
    acceptTerms: "利用規約とプライバシーポリシーに同意し、Coach FIが教育目的であることを理解しました。",
    marketing: "公開に関する学習用メールを受け取りたいです。この同意は任意です。",
    unlock: "スコアとプランを表示",
    saving: "保存中...",
    invalidEmail: "有効なメールアドレスを入力してください。",
    offlineNote: "現在メールを保存できませんでしたが、結果はこの端末で表示できます。",
    earlyAccessTitle: "アーリーアクセス期間中は無料",
    earlyAccessBody: "Coach FIのアーリーアクセス期間中、Milaの音声コーチング、分析、家族レッスンは無料です。",
    askMila: "スコアについてMilaに聞く",
    pressure: "スコアは家計への負担を示しています。無料のサポートもありますが、Coach FIの主な機能ではありません。",
    freeHelp: "無料サポートを見る",
    locked: "スコアはロックされています",
    lockedBody: "無料の分析を行ってください。メールアドレスを入力すると、スコア全体とプランが表示されます。",
    goalPlaceholder: "例：緊急資金をつくる",
    amountPlaceholder: "0",
  },
  hi: {
    previewReady: "आपकी शुरुआती जांच तैयार है",
    previewBody: "पूरा स्कोर और पारिवारिक योजना देखने के लिए अपना ईमेल दें। हम सिर्फ़ ईमेल, भाषा, सहमति और स्कोर की सीमा सहेजते हैं — आपकी रकम कभी नहीं।",
    emailLabel: "ईमेल",
    acceptTerms: "मैं शर्तें और गोपनीयता नीति स्वीकार करता/करती हूं और समझता/समझती हूं कि Coach FI शैक्षिक है।",
    marketing: "मुझे लॉन्च से जुड़े शैक्षिक ईमेल चाहिए। यह सहमति वैकल्पिक है।",
    unlock: "स्कोर और योजना अनलॉक करें",
    saving: "सहेजा जा रहा है...",
    invalidEmail: "कृपया सही ईमेल पता दर्ज करें।",
    offlineNote: "अभी आपका ईमेल सहेजा नहीं जा सका, लेकिन आपका नतीजा इस डिवाइस पर अनलॉक है।",
    earlyAccessTitle: "अर्ली एक्सेस के दौरान मुफ़्त",
    earlyAccessBody: "जब तक Coach FI अर्ली एक्सेस में है, Mila की वॉइस कोचिंग, विश्लेषण और पारिवारिक पाठ मुफ़्त हैं।",
    askMila: "अपने स्कोर के बारे में Mila से पूछें",
    pressure: "स्कोर वित्तीय दबाव का संकेत देता है। मुफ़्त मदद उपलब्ध है, लेकिन यह Coach FI का मुख्य उत्पाद नहीं है।",
    freeHelp: "मुफ़्त मदद देखें",
    locked: "स्कोर लॉक है",
    lockedBody: "मुफ़्त विश्लेषण करें। ईमेल देने पर पूरा स्कोर और योजना खुल जाते हैं।",
    goalPlaceholder: "जैसे: इमरजेंसी फ़ंड बनाना",
    amountPlaceholder: "0",
  },
  "pt-BR": {
    previewReady: "Seu diagnóstico preliminar está pronto",
    previewBody: "Informe seu e-mail para ver a pontuação completa e o plano familiar. Guardamos apenas e-mail, idioma, consentimento e faixa de pontuação — nunca seus valores.",
    emailLabel: "E-mail",
    acceptTerms: "Aceito os Termos e a Política de Privacidade e entendo que o Coach FI é educacional.",
    marketing: "Quero receber e-mails educacionais sobre o lançamento. Este consentimento é opcional.",
    unlock: "Desbloquear pontuação e plano",
    saving: "Salvando...",
    invalidEmail: "Digite um endereço de e-mail válido.",
    offlineNote: "Não conseguimos salvar seu e-mail agora, mas seu resultado está desbloqueado neste dispositivo.",
    earlyAccessTitle: "Grátis durante o acesso antecipado",
    earlyAccessBody: "O coaching por voz da Mila, as análises e as aulas em família são gratuitos enquanto o Coach FI estiver em acesso antecipado.",
    askMila: "Perguntar à Mila sobre minha pontuação",
    pressure: "A pontuação indica pressão financeira. Há ajuda gratuita disponível, mas ela não é o produto principal do Coach FI.",
    freeHelp: "Ver ajuda gratuita",
    locked: "A pontuação está bloqueada",
    lockedBody: "Faça a análise gratuita. A pontuação completa e o plano são liberados com seu e-mail.",
    goalPlaceholder: "ex.: Montar uma reserva de emergência",
    amountPlaceholder: "0",
  },
  tr: {
    previewReady: "Ön teşhisin hazır",
    previewBody: "Tam puanını ve aile planını görmek için e-postanı ekle. Yalnızca e-posta, dil, onay seçimi ve puan aralığını saklarız — tutarlarını asla.",
    emailLabel: "E-posta",
    acceptTerms: "Koşulları ve Gizlilik Politikası'nı kabul ediyorum ve Coach FI'ın eğitim amaçlı olduğunu anlıyorum.",
    marketing: "Lansmanla ilgili eğitici e-postalar almak istiyorum. Bu onay isteğe bağlıdır.",
    unlock: "Puanı ve planı aç",
    saving: "Kaydediliyor...",
    invalidEmail: "Lütfen geçerli bir e-posta adresi gir.",
    offlineNote: "E-postanı şu anda kaydedemedik, ancak sonucun bu cihazda açık.",
    earlyAccessTitle: "Erken erişim süresince ücretsiz",
    earlyAccessBody: "Coach FI erken erişimdeyken Mila'nın sesli koçluğu, analizler ve aile dersleri ücretsizdir.",
    askMila: "Puanımı Mila'ya sor",
    pressure: "Puan finansal baskıya işaret ediyor. Ücretsiz yardım mevcut, ancak bu Coach FI'ın ana ürünü değil.",
    freeHelp: "Ücretsiz yardımı göster",
    locked: "Puan kilitli",
    lockedBody: "Ücretsiz analizi yap. Tam puanın ve planın e-postanı eklediğinde açılır.",
    goalPlaceholder: "örn. Acil durum fonu oluşturmak",
    amountPlaceholder: "0",
  },
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function HealthCheckPage() {
  const { locale, t } = useLanguage();
  const gate = pickLocalized(GATE_COPY, locale);
  const copy = getLocalizedContent(locale);
  const { markActive } = useStreak();
  const [shareOpen, setShareOpen] = useState(false);
  // The form starts empty: placeholders only, never demo numbers.
  const [numbers, setNumbers] = useState<NumberDraft>(EMPTY_NUMBERS);
  const [answers, setAnswers] = useState<Omit<HealthForm, NumberKey>>({
    hasEmergencyFund: false,
    understandsInflation: false,
    hasRetirementPlan: false,
    investsAlready: false,
    mainFinancialGoal: "",
  });
  const [score, setScore] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scoreUnlocked, setScoreUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [gateError, setGateError] = useState("");
  const [leadNote, setLeadNote] = useState("");

  const form: HealthForm = {
    monthlyIncome: toNumber(numbers.monthlyIncome),
    monthlyExpenses: toNumber(numbers.monthlyExpenses),
    savings: toNumber(numbers.savings),
    debt: toNumber(numbers.debt),
    cashHeld: toNumber(numbers.cashHeld),
    ...answers,
  };

  // Restore the last result on this device (and whether it was unlocked).
  useEffect(() => {
    const saved = getHealthCheck();
    if (!saved) return;
    const restored = formFromSaved(saved.answers as Record<string, unknown>);
    setNumbers(restored.numbers);
    setAnswers(restored.rest);
    setScore(saved.score);
    setSubmitted(true);
    setScoreUnlocked(readUnlocked());
  }, []);

  const shownScore = score ?? 0;
  const diagnosis =
    shownScore < 40
      ? t.healthCheck.interpretation.poor
      : shownScore < 65
        ? t.healthCheck.interpretation.fair
        : shownScore < 82
          ? t.healthCheck.interpretation.good
          : t.healthCheck.interpretation.excellent;
  const scoreVoiceText = copy.health.scoreVoice(shownScore);
  const previewInsights = getPreviewInsights(form, locale);
  const canUnlock = submitted && EMAIL_PATTERN.test(loginEmail.trim()) && termsAccepted && !unlocking;
  const showEmergencyPath = scoreUnlocked && shownScore < 40;
  const showResult = submitted && scoreUnlocked && score !== null;

  function updateBool(field: keyof Omit<HealthForm, NumberKey>, val: string) {
    setAnswers((f) => ({ ...f, [field]: val === "yes" }));
  }

  function updateNum(field: NumberKey, val: string) {
    setNumbers((f) => ({ ...f, [field]: val }));
  }

  async function unlock() {
    if (!canUnlock || score === null) return;
    const email = loginEmail.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setGateError(gate.invalidEmail);
      return;
    }
    setGateError("");
    setUnlocking(true);
    let savedRemotely = false;
    let note = "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          marketingConsent,
          scoreBand: scoreBand(score),
          source: "health-check",
        }),
      });
      if (res.status === 400) {
        setGateError(gate.invalidEmail);
        setUnlocking(false);
        return;
      }
      savedRemotely = res.ok;
      if (!res.ok) note = gate.offlineNote;
    } catch {
      note = gate.offlineNote;
    }
    // The result unlocks locally even when lead storage is unavailable.
    writeUnlocked(savedRemotely);
    setLeadNote(note);
    setScoreUnlocked(true);
    setUnlocking(false);
  }

  return (
    <section aria-labelledby="health-title">
      <SectionHeader
        eyebrow={t.healthCheck.eyebrow}
        title={t.healthCheck.title}
        description={t.healthCheck.description}
        readText={
          showResult
            ? `${t.healthCheck.scoreTitle}: ${shownScore} ${t.healthCheck.scoreLabel}. ${diagnosis}`
            : `${t.healthCheck.title}. ${t.healthCheck.description}`
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const nextScore = calculateHealthScore(form);
            setScore(nextScore);
            // Persist locally (+ push to health_checks when signed in) so the
            // result survives navigation and feeds the home dashboard.
            saveHealthCheck(nextScore, { ...form });
            setSubmitted(true);
            // Someone who already unlocked keeps seeing their (new) result.
            setScoreUnlocked(readUnlocked());
            markActive();
          }}
          className="focus-card rounded-lg p-5 md:p-6"
        >
          <div className="mb-5">
            <p className="text-sm font-black uppercase text-primary">{t.healthCheck.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black text-text">{t.healthCheck.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t.healthCheck.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <NumberField
              label={t.healthCheck.labelIncome}
              value={numbers.monthlyIncome}
              onChange={(v) => updateNum("monthlyIncome", v)}
              currency={t.currencySymbol}
              placeholder={gate.amountPlaceholder}
              required
            />
            <NumberField
              label={t.healthCheck.labelExpenses}
              value={numbers.monthlyExpenses}
              onChange={(v) => updateNum("monthlyExpenses", v)}
              currency={t.currencySymbol}
              placeholder={gate.amountPlaceholder}
              required
            />
            <NumberField
              label={t.healthCheck.labelSavings}
              value={numbers.savings}
              onChange={(v) => updateNum("savings", v)}
              currency={t.currencySymbol}
              placeholder={gate.amountPlaceholder}
            />
            <NumberField
              label={t.healthCheck.labelDebt}
              value={numbers.debt}
              onChange={(v) => updateNum("debt", v)}
              currency={t.currencySymbol}
              placeholder={gate.amountPlaceholder}
            />
            <NumberField
              label={t.healthCheck.labelCash}
              value={numbers.cashHeld}
              onChange={(v) => updateNum("cashHeld", v)}
              currency={t.currencySymbol}
              placeholder={gate.amountPlaceholder}
            />

            <YesNoField
              label={t.healthCheck.labelHasEmergencyFund}
              value={answers.hasEmergencyFund}
              onChange={(v) => updateBool("hasEmergencyFund", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />
            <YesNoField
              label={t.healthCheck.labelUnderstandsInflation}
              value={answers.understandsInflation}
              onChange={(v) => updateBool("understandsInflation", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />
            <YesNoField
              label={t.healthCheck.labelHasRetirementPlan}
              value={answers.hasRetirementPlan}
              onChange={(v) => updateBool("hasRetirementPlan", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />

            <label className="grid gap-1.5 text-sm font-bold text-text md:col-span-2">
              {t.healthCheck.labelGoal}
              <input
                value={answers.mainFinancialGoal}
                onChange={(e) => setAnswers((f) => ({ ...f, mainFinancialGoal: e.target.value }))}
                placeholder={gate.goalPlaceholder}
                className={inputClass}
              />
            </label>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full">
            {t.healthCheck.submit}
          </Button>

          {submitted && !scoreUnlocked && (
            <div className="mt-5 rounded-lg border border-primary/15 bg-primary/5 p-4" aria-live="polite">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-black text-text">
                    {gate.previewReady}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                    {gate.previewBody}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {previewInsights.map((insight) => (
                  <p key={insight} className="rounded-lg bg-white/80 p-3 text-sm font-bold text-text">
                    {insight}
                  </p>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5 text-sm font-bold text-text">
                  {gate.emailLabel}
                  <span className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${inputClass} w-full pl-10`}
                    />
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg bg-white/80 p-3 text-sm font-bold text-text">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    {gate.acceptTerms}
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg bg-white/80 p-3 text-sm font-bold text-text">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    {gate.marketing}
                  </span>
                </label>

                {gateError && (
                  <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-text">
                    {gateError}
                  </p>
                )}

                <Button
                  type="button"
                  size="lg"
                  disabled={!canUnlock}
                  onClick={() => void unlock()}
                >
                  {unlocking ? gate.saving : gate.unlock}
                </Button>
              </div>
            </div>
          )}

          {showResult && (
            <div className="mt-4 flex flex-col gap-2">
              {leadNote && (
                <p role="status" className="rounded-lg bg-primary/5 p-3 text-sm font-semibold text-muted">
                  {leadNote}
                </p>
              )}
              <p
                className="rounded-lg bg-success/20 p-3 text-center text-sm font-bold text-text"
                aria-live="polite"
              >
                <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
                {t.healthCheck.nextStep}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t.healthCheck.shareScore}
                </Button>
                <Link
                  href={`/achievement?name=${encodeURIComponent(getDisplayName(getUser()))}&score=${shownScore}&streak=${getStreak().currentStreak}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  {copy.health.achievement}
                </Link>
              </div>
            </div>
          )}
        </form>

        <div className="grid content-start gap-3">
          {showResult ? (
            <>
              <FinancialScoreCard score={shownScore} diagnosis={diagnosis} />
              <VoiceButton text={scoreVoiceText} label={copy.voice.readScore} variant="pill" className="justify-center py-2.5" />
              <div className="rounded-lg border border-accent/40 bg-accent/35 p-4" data-testid="early-access-note">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#7A5A00]" aria-hidden="true" />
                  <div>
                    <p className="font-black text-text">{gate.earlyAccessTitle}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                      {gate.earlyAccessBody}
                    </p>
                    <Link
                      href="/coach"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-black text-on-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {gate.askMila}
                    </Link>
                  </div>
                </div>
              </div>
              {showEmergencyPath && (
                <div className="rounded-lg border border-warning/30 bg-warning/15 p-4">
                  <p className="text-sm font-bold leading-6 text-text">
                    {gate.pressure}
                  </p>
                  <Link
                    href="/crisis"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border-2 border-primary-border bg-surface px-4 py-2 text-sm font-black text-grape transition hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus"
                  >
                    <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                    {gate.freeHelp}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-primary/15 bg-white p-5 shadow-soft">
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-primary/10 text-primary">
                <LockKeyhole className="h-9 w-9" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-text">
                {gate.locked}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                {gate.lockedBody}
              </p>
            </div>
          )}
        </div>
      </div>

      {showResult && (
        <div className="mt-6">
          <FamilyActionPlan
            score={shownScore}
            monthlyIncome={form.monthlyIncome}
            monthlyExpenses={form.monthlyExpenses}
            savings={form.savings}
            goal={form.mainFinancialGoal}
          />
        </div>
      )}

      <ShareScoreCard score={shownScore} open={shareOpen} onClose={() => setShareOpen(false)} />
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  currency,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  currency: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-text">
      <span>
        {label} <span className="whitespace-nowrap font-semibold text-muted">({currency})</span>
      </span>
      <input
        type="number"
        min="0"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  value: boolean;
  onChange: (v: string) => void;
  yes: string;
  no: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-text">
      {label}
      <select
        value={value ? "yes" : "no"}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="no">{no}</option>
        <option value="yes">{yes}</option>
      </select>
    </label>
  );
}

function calculateHealthScore(form: HealthForm) {
  const monthlyFree = Math.max(form.monthlyIncome - form.monthlyExpenses, 0);
  const savingsRate = form.monthlyIncome > 0 ? monthlyFree / form.monthlyIncome : 0;
  const emergencyCoverage =
    form.monthlyExpenses > 0 ? form.savings / (form.monthlyExpenses * 3) : 0;
  const debtPressure =
    form.monthlyIncome > 0 ? form.debt / (form.monthlyIncome * 4) : 1;

  const savingsRateScore = Math.min(savingsRate / 0.25, 1) * 18;
  const emergencyScore = Math.min(emergencyCoverage, 1) * 18;
  const debtScore = Math.max(0, 1 - debtPressure) * 16;
  const cashAwarenessScore =
    form.cashHeld > form.monthlyIncome * 2 && !form.investsAlready ? 4 : 8;
  const investingScore = form.investsAlready ? 10 : 2;
  const goalScore = form.mainFinancialGoal.trim().length > 8 ? 6 : 0;
  const awarenessScore =
    (form.hasEmergencyFund ? 8 : 0) +
    (form.understandsInflation ? 6 : 0) +
    (form.hasRetirementPlan ? 8 : 0);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        savingsRateScore +
          emergencyScore +
          debtScore +
          cashAwarenessScore +
          investingScore +
          goalScore +
          awarenessScore
      )
    )
  );
}

const INSIGHT_COPY: LocalizedMap<Record<"highSpending" | "roomToPlan" | "weakCushion" | "goodCushion" | "noFuturePlan", string>> = {
  en: {
    highSpending: "Spending is high compared with income. This is the first area to check.",
    roomToPlan: "You have room to build a system and a regular plan.",
    weakCushion: "Your safety cushion needs strengthening before taking more risk.",
    goodCushion: "Your financial cushion gives you a good base for the next habits.",
    noFuturePlan: "A regular future plan is missing: education, investing or retirement.",
  },
  pl: {
    highSpending: "Wydatki są wysokie względem dochodu. To pierwszy obszar do sprawdzenia.",
    roomToPlan: "Masz przestrzeń do zbudowania systemu i regularnego planu.",
    weakCushion: "Poduszka finansowa wymaga wzmocnienia, zanim zwiększysz ryzyko.",
    goodCushion: "Poduszka finansowa daje dobry start do kolejnych nawyków.",
    noFuturePlan: "Brakuje regularnego planu przyszłości: edukacja, inwestowanie lub emerytura.",
  },
  es: {
    highSpending: "El gasto es alto en relación con los ingresos. Es lo primero que conviene revisar.",
    roomToPlan: "Tienes margen para construir un sistema y un plan regular.",
    weakCushion: "Tu colchón de seguridad necesita reforzarse antes de asumir más riesgo.",
    goodCushion: "Tu colchón financiero te da una buena base para los siguientes hábitos.",
    noFuturePlan: "Falta un plan regular para el futuro: educación, inversión o jubilación.",
  },
  fr: {
    highSpending: "Les dépenses sont élevées par rapport aux revenus. C'est le premier point à vérifier.",
    roomToPlan: "Vous avez de la marge pour mettre en place un système et un plan régulier.",
    weakCushion: "Votre matelas de sécurité doit être renforcé avant de prendre plus de risques.",
    goodCushion: "Votre matelas financier vous donne une bonne base pour les prochaines habitudes.",
    noFuturePlan: "Il manque un plan régulier pour l'avenir : éducation, investissement ou retraite.",
  },
  zh: {
    highSpending: "支出相对于收入偏高。这是首先要检查的地方。",
    roomToPlan: "你有空间建立一套系统和定期计划。",
    weakCushion: "在承担更多风险之前，你的安全缓冲需要加强。",
    goodCushion: "你的财务缓冲为接下来的习惯打下了良好基础。",
    noFuturePlan: "缺少面向未来的定期计划：教育、投资或退休。",
  },
  ja: {
    highSpending: "収入に対して支出が多めです。最初に確認すべきポイントです。",
    roomToPlan: "仕組みと定期的なプランをつくる余裕があります。",
    weakCushion: "リスクを増やす前に、お金のクッションを厚くする必要があります。",
    goodCushion: "お金のクッションが、次の習慣づくりの良い土台になっています。",
    noFuturePlan: "将来に向けた定期的なプランが足りていません：教育、投資、老後の備え。",
  },
  hi: {
    highSpending: "आय की तुलना में खर्च ज़्यादा है। सबसे पहले इसी पर ध्यान दें।",
    roomToPlan: "आपके पास एक व्यवस्था और नियमित योजना बनाने की गुंजाइश है।",
    weakCushion: "ज़्यादा जोखिम लेने से पहले आपकी सुरक्षा गद्दी को मज़बूत करना ज़रूरी है।",
    goodCushion: "आपकी वित्तीय गद्दी अगली आदतों के लिए अच्छा आधार देती है।",
    noFuturePlan: "भविष्य की नियमित योजना की कमी है: शिक्षा, निवेश या सेवानिवृत्ति।",
  },
  "pt-BR": {
    highSpending: "Os gastos estão altos em relação à renda. Essa é a primeira área a verificar.",
    roomToPlan: "Você tem espaço para montar um sistema e um plano regular.",
    weakCushion: "Sua reserva de segurança precisa ser reforçada antes de assumir mais risco.",
    goodCushion: "Sua reserva financeira dá uma boa base para os próximos hábitos.",
    noFuturePlan: "Falta um plano regular para o futuro: educação, investimentos ou aposentadoria.",
  },
  tr: {
    highSpending: "Harcamalar gelire göre yüksek. İlk bakılması gereken alan bu.",
    roomToPlan: "Bir sistem ve düzenli bir plan kurmak için alanın var.",
    weakCushion: "Daha fazla risk almadan önce güvenlik yastığını güçlendirmen gerekiyor.",
    goodCushion: "Finansal yastığın sonraki alışkanlıklar için iyi bir temel sağlıyor.",
    noFuturePlan: "Geleceğe yönelik düzenli bir plan eksik: eğitim, yatırım veya emeklilik.",
  },
};

function getPreviewInsights(form: HealthForm, locale: Locale) {
  const copy = pickLocalized(INSIGHT_COPY, locale);
  const spendingRatio = form.monthlyIncome > 0 ? form.monthlyExpenses / form.monthlyIncome : 1;
  const cushionMonths = form.monthlyExpenses > 0 ? form.savings / form.monthlyExpenses : 0;
  const insights: string[] = [];

  insights.push(spendingRatio > 0.75 ? copy.highSpending : copy.roomToPlan);
  insights.push(cushionMonths < 3 ? copy.weakCushion : copy.goodCushion);

  if (!form.investsAlready || !form.hasRetirementPlan) {
    insights.push(copy.noFuturePlan);
  }

  return insights.slice(0, 3);
}
