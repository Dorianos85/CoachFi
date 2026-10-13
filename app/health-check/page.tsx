"use client";

import { useState } from "react";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

import { CheckCircle2, LifeBuoy, LockKeyhole, Mail, Share2, Sparkles, Trophy } from "lucide-react";
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
import { useStreak } from "@/context/StreakContext";
import { mockUser } from "@/data/mockUser";
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

const inputClass =
  "min-h-12 rounded-input border-2 border-border bg-white px-3 text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const GATE_COPY: LocalizedMap<Record<"previewReady" | "previewBody" | "emailLabel" | "acceptTerms" | "marketing" | "unlock" | "trialActiveTitle" | "trialBody" | "trialActive" | "trialStart" | "pressure" | "freeHelp" | "locked" | "lockedBody", string>> = {
  en: {
    previewReady: "Your preview diagnosis is ready",
    previewBody: "The full score and family plan unlock after login and Terms/Privacy acceptance.",
    emailLabel: "Login email",
    acceptTerms: "I accept Terms, Privacy Policy and understand Coach FI is educational.",
    marketing: "I want educational launch emails. This consent is optional.",
    unlock: "Unlock score and plan",
    trialActiveTitle: "Mila trial active",
    trialBody: "7-day test with limits for voice sessions, analyses and family lessons. Premium has full access with fair-use.",
    trialActive: "Trial active",
    trialStart: "Start trial",
    pressure: "The score suggests financial pressure. Free help is available, but it is not the main Coach FI product.",
    freeHelp: "Show free help",
    locked: "Score is locked",
    lockedBody: "Run the free analysis. Full score and solution unlock after login and terms acceptance.",
  },
  pl: {
    previewReady: "Wstępna diagnoza jest gotowa",
    previewBody: "Pełny wynik i plan rodzinny pokażemy po logowaniu oraz akceptacji regulaminu i polityki prywatności.",
    emailLabel: "Email do logowania",
    acceptTerms: "Akceptuję regulamin, politykę prywatności i rozumiem, że Coach FI ma charakter edukacyjny.",
    marketing: "Chcę otrzymywać edukacyjne materiały i informacje o premierze. To zgoda dobrowolna.",
    unlock: "Odblokuj wynik i plan",
    trialActiveTitle: "Trial Mili aktywny",
    trialBody: "7 dni testu z limitami rozmów głosowych, analiz i lekcji rodzinnych. Premium ma pełny dostęp z zasadami fair-use.",
    trialActive: "Trial aktywny",
    trialStart: "Włącz trial",
    pressure: "Wynik wskazuje napięcie finansowe. Ścieżka bezpłatnej pomocy jest dostępna, ale nie jest głównym produktem Coach FI.",
    freeHelp: "Pokaż bezpłatną pomoc",
    locked: "Wynik jest zablokowany",
    lockedBody: "Zrób darmową analizę. Pełny wynik i rozwiązanie pokażemy po logowaniu oraz akceptacji zasad.",
  },
  es: {
    previewReady: "Tu diagnóstico preliminar está listo",
    previewBody: "La puntuación completa y el plan familiar se desbloquean al iniciar sesión y aceptar los Términos y la Privacidad.",
    emailLabel: "Correo para iniciar sesión",
    acceptTerms: "Acepto los Términos y la Política de privacidad, y entiendo que Coach FI es educativo.",
    marketing: "Quiero recibir correos educativos sobre el lanzamiento. Este consentimiento es opcional.",
    unlock: "Desbloquear puntuación y plan",
    trialActiveTitle: "Prueba de Mila activa",
    trialBody: "Prueba de 7 días con límites en sesiones de voz, análisis y lecciones familiares. Premium ofrece acceso completo con uso razonable.",
    trialActive: "Prueba activa",
    trialStart: "Iniciar prueba",
    pressure: "La puntuación indica presión financiera. Hay ayuda gratuita disponible, aunque no es el producto principal de Coach FI.",
    freeHelp: "Ver ayuda gratuita",
    locked: "La puntuación está bloqueada",
    lockedBody: "Haz el análisis gratuito. La puntuación completa y la solución se desbloquean al iniciar sesión y aceptar las condiciones.",
  },
  fr: {
    previewReady: "Votre diagnostic préliminaire est prêt",
    previewBody: "Le score complet et le plan familial se débloquent après connexion et acceptation des Conditions et de la Confidentialité.",
    emailLabel: "E-mail de connexion",
    acceptTerms: "J'accepte les Conditions et la Politique de confidentialité, et je comprends que Coach FI est éducatif.",
    marketing: "Je souhaite recevoir des e-mails éducatifs sur le lancement. Ce consentement est facultatif.",
    unlock: "Débloquer le score et le plan",
    trialActiveTitle: "Essai de Mila actif",
    trialBody: "Essai de 7 jours avec des limites pour les sessions vocales, les analyses et les leçons en famille. Premium offre un accès complet avec usage raisonnable.",
    trialActive: "Essai actif",
    trialStart: "Démarrer l'essai",
    pressure: "Le score suggère une pression financière. Une aide gratuite est disponible, mais ce n'est pas le produit principal de Coach FI.",
    freeHelp: "Voir l'aide gratuite",
    locked: "Le score est verrouillé",
    lockedBody: "Lancez l'analyse gratuite. Le score complet et la solution se débloquent après connexion et acceptation des conditions.",
  },
  zh: {
    previewReady: "你的初步诊断已准备好",
    previewBody: "登录并接受条款和隐私政策后，即可解锁完整得分和家庭计划。",
    emailLabel: "登录邮箱",
    acceptTerms: "我接受条款和隐私政策，并理解 Coach FI 属于教育性质。",
    marketing: "我希望收到有关上线的教育类邮件。此授权为可选。",
    unlock: "解锁得分和计划",
    trialActiveTitle: "Mila 试用中",
    trialBody: "7 天试用，语音会话、分析和家庭课程有次数限制。高级版在合理使用规则下提供完整访问。",
    trialActive: "试用中",
    trialStart: "开始试用",
    pressure: "得分显示存在财务压力。可以获得免费帮助，但这不是 Coach FI 的主要产品。",
    freeHelp: "查看免费帮助",
    locked: "得分已锁定",
    lockedBody: "完成免费分析。登录并接受条款后，即可解锁完整得分和解决方案。",
  },
  ja: {
    previewReady: "仮の診断ができました",
    previewBody: "ログインして利用規約とプライバシーに同意すると、スコア全体と家族プランが表示されます。",
    emailLabel: "ログイン用メールアドレス",
    acceptTerms: "利用規約とプライバシーポリシーに同意し、Coach FIが教育目的であることを理解しました。",
    marketing: "公開に関する学習用メールを受け取りたいです。この同意は任意です。",
    unlock: "スコアとプランを表示",
    trialActiveTitle: "Milaのトライアル実施中",
    trialBody: "音声セッション、分析、家族レッスンに上限のある7日間のトライアルです。Premiumは適正利用の範囲で制限なく使えます。",
    trialActive: "トライアル実施中",
    trialStart: "トライアルを開始",
    pressure: "スコアは家計への負担を示しています。無料のサポートもありますが、Coach FIの主な機能ではありません。",
    freeHelp: "無料サポートを見る",
    locked: "スコアはロックされています",
    lockedBody: "無料の分析を行ってください。ログインして規約に同意すると、スコア全体と解決策が表示されます。",
  },
  hi: {
    previewReady: "आपकी शुरुआती जांच तैयार है",
    previewBody: "लॉगिन करने और शर्तें व गोपनीयता स्वीकार करने के बाद पूरा स्कोर और पारिवारिक योजना खुलते हैं।",
    emailLabel: "लॉगिन ईमेल",
    acceptTerms: "मैं शर्तें और गोपनीयता नीति स्वीकार करता/करती हूं और समझता/समझती हूं कि Coach FI शैक्षिक है।",
    marketing: "मुझे लॉन्च से जुड़े शैक्षिक ईमेल चाहिए। यह सहमति वैकल्पिक है।",
    unlock: "स्कोर और योजना अनलॉक करें",
    trialActiveTitle: "Mila ट्रायल चालू है",
    trialBody: "वॉइस सत्रों, विश्लेषणों और पारिवारिक पाठों की सीमाओं के साथ 7 दिन का ट्रायल। Premium में उचित उपयोग के साथ पूरी पहुंच मिलती है।",
    trialActive: "ट्रायल चालू है",
    trialStart: "ट्रायल शुरू करें",
    pressure: "स्कोर वित्तीय दबाव का संकेत देता है। मुफ़्त मदद उपलब्ध है, लेकिन यह Coach FI का मुख्य उत्पाद नहीं है।",
    freeHelp: "मुफ़्त मदद देखें",
    locked: "स्कोर लॉक है",
    lockedBody: "मुफ़्त विश्लेषण करें। लॉगिन करने और शर्तें स्वीकार करने के बाद पूरा स्कोर और समाधान खुलते हैं।",
  },
  "pt-BR": {
    previewReady: "Seu diagnóstico preliminar está pronto",
    previewBody: "A pontuação completa e o plano familiar são liberados após o login e a aceitação dos Termos e da Privacidade.",
    emailLabel: "E-mail de login",
    acceptTerms: "Aceito os Termos e a Política de Privacidade e entendo que o Coach FI é educacional.",
    marketing: "Quero receber e-mails educacionais sobre o lançamento. Este consentimento é opcional.",
    unlock: "Desbloquear pontuação e plano",
    trialActiveTitle: "Teste da Mila ativo",
    trialBody: "Teste de 7 dias com limites para sessões de voz, análises e aulas em família. O Premium tem acesso completo com uso justo.",
    trialActive: "Teste ativo",
    trialStart: "Começar teste",
    pressure: "A pontuação indica pressão financeira. Há ajuda gratuita disponível, mas ela não é o produto principal do Coach FI.",
    freeHelp: "Ver ajuda gratuita",
    locked: "A pontuação está bloqueada",
    lockedBody: "Faça a análise gratuita. A pontuação completa e a solução são liberadas após o login e a aceitação dos termos.",
  },
  tr: {
    previewReady: "Ön teşhisin hazır",
    previewBody: "Tam puan ve aile planı, giriş yapıp Koşulları ve Gizliliği kabul ettikten sonra açılır.",
    emailLabel: "Giriş e-postası",
    acceptTerms: "Koşulları ve Gizlilik Politikası'nı kabul ediyorum ve Coach FI'ın eğitim amaçlı olduğunu anlıyorum.",
    marketing: "Lansmanla ilgili eğitici e-postalar almak istiyorum. Bu onay isteğe bağlıdır.",
    unlock: "Puanı ve planı aç",
    trialActiveTitle: "Mila denemesi etkin",
    trialBody: "Sesli oturumlar, analizler ve aile dersleri için sınırları olan 7 günlük deneme. Premium, adil kullanım kurallarıyla tam erişim sunar.",
    trialActive: "Deneme etkin",
    trialStart: "Denemeyi başlat",
    pressure: "Puan finansal baskıya işaret ediyor. Ücretsiz yardım mevcut, ancak bu Coach FI'ın ana ürünü değil.",
    freeHelp: "Ücretsiz yardımı göster",
    locked: "Puan kilitli",
    lockedBody: "Ücretsiz analizi yap. Tam puan ve çözüm, giriş yapıp koşulları kabul ettikten sonra açılır.",
  },
};

export default function HealthCheckPage() {
  const { locale, t } = useLanguage();
  const gate = pickLocalized(GATE_COPY, locale);
  const copy = getLocalizedContent(locale);
  const { markActive } = useStreak();
  const [shareOpen, setShareOpen] = useState(false);
  const [form, setForm] = useState<HealthForm>({
    monthlyIncome: mockUser.monthlyIncome,
    monthlyExpenses: mockUser.monthlyExpenses,
    savings: mockUser.savings,
    debt: mockUser.debt,
    cashHeld: mockUser.cashHeld,
    hasEmergencyFund: false,
    understandsInflation: false,
    hasRetirementPlan: false,
    investsAlready: mockUser.investsAlready,
    mainFinancialGoal: mockUser.mainFinancialGoal,
  });
  // Start from the last saved result on this device (falls back to the demo value).
  const [score, setScore] = useState(() => getHealthCheck()?.score ?? mockUser.financialHealthScore);
  const [submitted, setSubmitted] = useState(false);
  const [scoreUnlocked, setScoreUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [trialActive, setTrialActive] = useState(false);

  const diagnosis =
    score < 40
      ? t.healthCheck.interpretation.poor
      : score < 65
        ? t.healthCheck.interpretation.fair
        : score < 82
          ? t.healthCheck.interpretation.good
          : t.healthCheck.interpretation.excellent;
  const scoreVoiceText = copy.health.scoreVoice(score);
  const previewInsights = getPreviewInsights(form, locale);
  const canUnlock = submitted && loginEmail.includes("@") && termsAccepted;
  const showEmergencyPath = scoreUnlocked && score < 40;

  function updateBool(field: keyof HealthForm, val: string) {
    setForm((f) => ({ ...f, [field]: val === "yes" }));
  }

  function updateNum(field: keyof HealthForm, val: string) {
    setForm((f) => ({ ...f, [field]: Number(val) }));
  }

  return (
    <section aria-labelledby="health-title">
      <SectionHeader
        eyebrow={t.healthCheck.eyebrow}
        title={t.healthCheck.title}
        description={t.healthCheck.description}
        readText={`${t.healthCheck.scoreTitle}: ${score} ${t.healthCheck.scoreLabel}. ${diagnosis}`}
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
            setScoreUnlocked(false);
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
              value={form.monthlyIncome}
              onChange={(v) => updateNum("monthlyIncome", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelExpenses}
              value={form.monthlyExpenses}
              onChange={(v) => updateNum("monthlyExpenses", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelSavings}
              value={form.savings}
              onChange={(v) => updateNum("savings", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelDebt}
              value={form.debt}
              onChange={(v) => updateNum("debt", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelCash}
              value={form.cashHeld}
              onChange={(v) => updateNum("cashHeld", v)}
              currency={t.currencySymbol}
            />

            <YesNoField
              label={t.healthCheck.labelHasEmergencyFund}
              value={form.hasEmergencyFund}
              onChange={(v) => updateBool("hasEmergencyFund", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />
            <YesNoField
              label={t.healthCheck.labelUnderstandsInflation}
              value={form.understandsInflation}
              onChange={(v) => updateBool("understandsInflation", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />
            <YesNoField
              label={t.healthCheck.labelHasRetirementPlan}
              value={form.hasRetirementPlan}
              onChange={(v) => updateBool("hasRetirementPlan", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />

            <label className="grid gap-1.5 text-sm font-bold text-text md:col-span-2">
              {t.healthCheck.labelGoal}
              <input
                value={form.mainFinancialGoal}
                onChange={(e) => setForm((f) => ({ ...f, mainFinancialGoal: e.target.value }))}
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
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${inputClass} pl-10`}
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

                <Button
                  type="button"
                  size="lg"
                  disabled={!canUnlock}
                  onClick={() => setScoreUnlocked(true)}
                >
                  {gate.unlock}
                </Button>
              </div>
            </div>
          )}

          {submitted && scoreUnlocked && (
            <div className="mt-4 flex flex-col gap-2">
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
                  href={`/achievement?name=${encodeURIComponent(getDisplayName(getUser()))}&score=${score}&streak=${getStreak().currentStreak}`}
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
          {scoreUnlocked ? (
            <>
              <FinancialScoreCard score={score} diagnosis={diagnosis} />
              <VoiceButton text={scoreVoiceText} label={copy.voice.readScore} variant="pill" className="justify-center py-2.5" />
              <div className="rounded-lg border border-accent/40 bg-accent/35 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#7A5A00]" aria-hidden="true" />
                  <div>
                    <p className="font-black text-text">
                      {trialActive
                        ? gate.trialActiveTitle
                        : "Mila Voice Coach Trial"}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                      {gate.trialBody}
                    </p>
                    <Button type="button" size="sm" className="mt-3" onClick={() => setTrialActive(true)}>
                      {trialActive
                        ? gate.trialActive
                        : gate.trialStart}
                    </Button>
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

      {submitted && scoreUnlocked && (
        <div className="mt-6">
          <FamilyActionPlan
            score={score}
            monthlyIncome={form.monthlyIncome}
            monthlyExpenses={form.monthlyExpenses}
            savings={form.savings}
            goal={form.mainFinancialGoal}
            trialActive={trialActive}
            onStartTrial={() => setTrialActive(true)}
          />
        </div>
      )}

      <ShareScoreCard score={score} open={shareOpen} onClose={() => setShareOpen(false)} />
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  currency,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  currency: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-text">
      {label} <span className="font-semibold text-muted">({currency})</span>
      <input
        type="number"
        min="0"
        value={value}
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

function getPreviewInsights(form: HealthForm, locale: string) {
  const isPolish = locale === "pl";
  const spendingRatio = form.monthlyIncome > 0 ? form.monthlyExpenses / form.monthlyIncome : 1;
  const cushionMonths = form.monthlyExpenses > 0 ? form.savings / form.monthlyExpenses : 0;
  const insights: string[] = [];

  insights.push(
    spendingRatio > 0.75
      ? isPolish
        ? "Wydatki są wysokie względem dochodu. To pierwszy obszar do sprawdzenia."
        : "Spending is high compared with income. This is the first area to check."
      : isPolish
        ? "Masz przestrzeń do zbudowania systemu i regularnego planu."
        : "You have room to build a system and a regular plan."
  );

  insights.push(
    cushionMonths < 3
      ? isPolish
        ? "Poduszka finansowa wymaga wzmocnienia, zanim zwiększysz ryzyko."
        : "Your safety cushion needs strengthening before taking more risk."
      : isPolish
        ? "Poduszka finansowa daje dobry start do kolejnych nawyków."
        : "Your financial cushion gives you a good base for the next habits."
  );

  if (!form.investsAlready || !form.hasRetirementPlan) {
    insights.push(
      isPolish
        ? "Brakuje regularnego planu przyszłości: edukacja, inwestowanie lub emerytura."
        : "A regular future plan is missing: education, investing or retirement."
    );
  }

  return insights.slice(0, 3);
}
