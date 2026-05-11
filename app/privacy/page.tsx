"use client";

import { VoiceButton } from "@/components/VoiceButton";
import { DataSafetyPanel } from "@/components/DataSafetyPanel";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

type PrivacyCopy = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  notice: string;
  blocks: Array<{ title: string; items: string[] }>;
  providersTitle: string;
  providersText: string;
};

const PRIVACY_COPY: Record<Locale, PrivacyCopy> = {
  en: {
    eyebrow: "Privacy and data",
    title: "Coach FI Privacy Policy",
    updatedAt: "May 10, 2026",
    notice: "This is an MVP draft and should be reviewed by a lawyer before production launch.",
    blocks: [
      {
        title: "What data we process",
        items: [
          "Local data: name or nickname, goal, progress, streak, voice settings, language and consents.",
          "Educational form data: amounts entered in the financial check are calculated in the browser.",
          "AI data: question text and short chat history are sent to the AI provider only with consent.",
          "Voice data: short text snippets are sent to ElevenLabs only after you click a read-aloud button.",
          "Leaderboard data: display name, score and streak are sent to Supabase only with consent.",
          "Blockchain data: wallet address and certificate metadata can be public and difficult to delete.",
        ],
      },
      {
        title: "Why we process data",
        items: [
          "To save progress and settings on this device.",
          "To personalize Mila's educational replies.",
          "To read answers aloud when voice is enabled.",
          "To show leaderboard and education certificates.",
          "To secure API endpoints, rate limits and configuration diagnostics.",
        ],
      },
      {
        title: "Legal basis and consents",
        items: [
          "Using the app requires acceptance of terms and privacy information.",
          "External features are optional and can be enabled or disabled in consent settings.",
          "Withdrawing consent does not affect processing that happened before withdrawal.",
          "We do not ask for bank passwords, card numbers, national IDs or financial institution login data.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "You can delete local app data from this device.",
          "You can export local data stored by Coach FI.",
          "You can change optional consents in the footer.",
          "Production deployment must add controller details, privacy contact and GDPR request handling.",
        ],
      },
    ],
    providersTitle: "External providers",
    providersText:
      "The app can integrate with Anthropic, ElevenLabs, Supabase and Solana Devnet. Before production, confirm processing regions, data processing agreements, retention and international transfers for each provider.",
  },
  pl: {
    eyebrow: "Prywatność i dane",
    title: "Polityka prywatności Coach FI",
    updatedAt: "10 maja 2026",
    notice: "Ten dokument jest roboczym wzorem dla MVP i powinien zostać sprawdzony przez prawnika przed produkcyjnym wdrożeniem.",
    blocks: [
      {
        title: "Jakie dane przetwarzamy",
        items: [
          "Dane lokalne: imię lub pseudonim, cel finansowy, postępy, seria, ustawienia głosu, język i zgody.",
          "Dane formularzy edukacyjnych: kwoty wpisane w diagnozie finansowej są liczone w przeglądarce.",
          "Dane AI: treść pytania i krótka historia rozmowy są wysyłane do modelu AI tylko po wyrażeniu zgody.",
          "Dane głosowe: krótkie fragmenty tekstu są wysyłane do ElevenLabs tylko po kliknięciu przycisku odczytu.",
          "Ranking: nazwa wyświetlana, wynik i seria są wysyłane do Supabase tylko po wyrażeniu zgody.",
          "Blockchain: adres portfela i metadane certyfikatu mogą być publiczne i trudne do usunięcia.",
        ],
      },
      {
        title: "Po co przetwarzamy dane",
        items: [
          "Aby zapisać postępy i ustawienia aplikacji na tym urządzeniu.",
          "Aby personalizować edukacyjne odpowiedzi Miły.",
          "Aby odczytywać odpowiedzi głosowo, jeśli włączysz funkcję głosu.",
          "Aby pokazać ranking globalny i certyfikaty edukacyjne.",
          "Aby zapewnić bezpieczeństwo endpointów, limit zapytań i diagnostykę konfiguracji.",
        ],
      },
      {
        title: "Podstawy i zgody",
        items: [
          "Korzystanie z aplikacji wymaga akceptacji regulaminu i informacji o prywatności.",
          "Funkcje zewnętrzne są opcjonalne i można je włączyć lub wyłączyć w ustawieniach zgód.",
          "Wycofanie zgody nie wpływa na zgodność przetwarzania, które odbyło się przed jej wycofaniem.",
          "Nie prosimy o hasła bankowe, numery kart, PESEL ani dane logowania do instytucji finansowych.",
        ],
      },
      {
        title: "Twoje prawa",
        items: [
          "Możesz usunąć lokalne dane aplikacji z tego urządzenia.",
          "Możesz wyeksportować lokalne dane zapisane przez Coach FI.",
          "Możesz zmienić zgody opcjonalne w stopce aplikacji.",
          "W produkcji trzeba uzupełnić dane administratora, kontakt privacy oraz procedury obsługi żądań RODO.",
        ],
      },
    ],
    providersTitle: "Dostawcy zewnętrzni",
    providersText:
      "Aplikacja może integrować się z Anthropic, ElevenLabs, Supabase i Solana Devnet. Przed wersją produkcyjną należy potwierdzić region przetwarzania, umowy powierzenia, retencję danych oraz transfery poza EOG dla każdego dostawcy.",
  },
  ja: {
    eyebrow: "プライバシーとデータ",
    title: "Coach FI プライバシーポリシー",
    updatedAt: "2026年5月10日",
    notice: "MVP 草案であり、本番前に法的確認が必要です。",
    blocks: [
      { title: "処理するデータ", items: ["ローカルデータ：名前、目標、進捗、連続記録、音声、言語、同意。", "AI、音声、ランキング、ブロックチェーンは同意後のみ外部サービスを使います。", "銀行パスワードやカード情報は求めません。"] },
      { title: "目的", items: ["進捗と設定の保存。", "Mila の教育回答の個別化。", "音声読み上げ。", "ランキングと証明書表示。"] },
      { title: "同意", items: ["アプリ利用には規約とプライバシー情報の承認が必要です。", "外部機能は任意です。", "フッターで同意を変更できます。"] },
      { title: "権利", items: ["ローカルデータをエクスポートできます。", "ローカルデータを削除できます。", "本番前に管理者情報と手続きを追加します。"] },
    ],
    providersTitle: "外部プロバイダー",
    providersText: "Anthropic、ElevenLabs、Supabase、Solana Devnet と統合できます。本番前に契約、地域、保存期間を確認してください。",
  },
};

export default function PrivacyPage() {
  const { locale } = useLanguage();
  const copy = PRIVACY_COPY[locale];
  const readText = [copy.title, ...copy.blocks.map((b) => `${b.title}. ${b.items.join(". ")}`), copy.providersTitle + ". " + copy.providersText].join(". ");

  return (
    <section className="space-y-6" aria-labelledby="privacy-title">
      <div className="focus-card rounded-lg p-6 md:p-8">
        <p className="text-sm font-black uppercase text-primary">{copy.eyebrow}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 id="privacy-title" className="text-3xl font-black text-text">
            {copy.title}
          </h1>
          <VoiceButton text={readText} locale={locale} variant="pill" className="shrink-0" />
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          {copy.updatedAt}. {copy.notice}
        </p>
      </div>

      <DataSafetyPanel />

      <div className="grid gap-4 md:grid-cols-2">
        {copy.blocks.map((block) => (
          <LegalBlock key={block.title} title={block.title} items={block.items} />
        ))}
      </div>

      <div className="rounded-lg border border-primary/10 bg-white p-5 text-sm leading-6 text-muted shadow-soft">
        <h2 className="text-xl font-black text-text">{copy.providersTitle}</h2>
        <p className="mt-2">{copy.providersText}</p>
      </div>
    </section>
  );
}

function LegalBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black text-text">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-muted">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </section>
  );
}
