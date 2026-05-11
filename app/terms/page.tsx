"use client";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

type LegalPageCopy = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  notice: string;
  blocks: Array<{ title: string; items: string[] }>;
};

const TERMS_COPY: Record<Locale, LegalPageCopy> = {
  en: {
    eyebrow: "Terms",
    title: "Coach FI Terms of Use",
    updatedAt: "May 10, 2026",
    notice:
      "Draft MVP terms, not final legal advice. Before production, add administrator details, contact, jurisdiction and complaint process.",
    blocks: [
      {
        title: "1. Nature of the app",
        items: [
          "Coach FI is an educational app for financial literacy and habit building.",
          "The app does not provide investment, tax, legal or credit advice.",
          "Mila AI can explain concepts, but does not replace a licensed advisor.",
        ],
      },
      {
        title: "2. User rules",
        items: [
          "Use the app lawfully and do not enter third-party personal data without a valid basis.",
          "Do not enter passwords, card numbers, ID numbers or bank login data.",
          "Educational content may include simplifications; financial decisions remain your responsibility.",
        ],
      },
      {
        title: "3. AI, voice and leaderboard",
        items: [
          "AI, ElevenLabs voice, global leaderboard and blockchain features require separate optional consent.",
          "Without consent, core learning remains available through local replies and local storage.",
          "The global leaderboard may show your display name, score and streak to other users.",
        ],
      },
      {
        title: "4. NFT certificates",
        items: [
          "NFT certificates prove completion of educational elements; they are not investment products.",
          "Public blockchain data can be visible, permanent and difficult to delete.",
          "The MVP uses Solana Devnet, a test network with no guaranteed economic value.",
        ],
      },
      {
        title: "5. Liability",
        items: [
          "Coach FI is provided as an MVP and may contain bugs, interruptions or limited features.",
          "We do not guarantee financial outcomes, profits, savings or user decisions.",
          "Users should verify information before making financial decisions.",
        ],
      },
      {
        title: "6. Data and privacy",
        items: [
          "Data processing rules are described in the Privacy Policy.",
          "Most app data is stored locally in the browser.",
          "Users can change optional consents and remove local app data.",
        ],
      },
    ],
  },
  pl: {
    eyebrow: "Regulamin",
    title: "Regulamin korzystania z Coach FI",
    updatedAt: "10 maja 2026",
    notice:
      "To roboczy regulamin MVP, nie finalna opinia prawna. Przed publikacją produkcyjną uzupełnij dane administratora, kontakt, jurysdykcję i proces reklamacji.",
    blocks: [
      {
        title: "1. Charakter aplikacji",
        items: [
          "Coach FI jest aplikacją edukacji finansowej i budowania nawyków.",
          "Aplikacja nie świadczy doradztwa inwestycyjnego, podatkowego, prawnego ani kredytowego.",
          "Mila AI może pomagać wyjaśniać pojęcia, ale nie zastąpi licencjonowanego doradcy.",
        ],
      },
      {
        title: "2. Zasady korzystania",
        items: [
          "Użytkownik korzysta z aplikacji zgodnie z prawem i nie wprowadza danych osób trzecich bez podstawy.",
          "Nie należy wpisywać haseł, danych kart płatniczych, numerów dokumentów, PESEL ani danych bankowych.",
          "Treści edukacyjne mogą zawierać uproszczenia i przykłady; decyzje finansowe podejmujesz samodzielnie.",
        ],
      },
      {
        title: "3. AI, głos i ranking",
        items: [
          "Funkcje AI, głosu ElevenLabs, rankingu globalnego i blockchaina wymagają osobnych zgód opcjonalnych.",
          "Brak zgody nie blokuje podstawowej nauki; aplikacja korzysta wtedy z lokalnych odpowiedzi i lokalnego zapisu.",
          "Ranking globalny może pokazać Twój pseudonim, wynik i serię innym użytkownikom.",
        ],
      },
      {
        title: "4. Certyfikaty NFT",
        items: [
          "Certyfikaty NFT są dowodem ukończenia elementów edukacyjnych, nie produktem inwestycyjnym.",
          "Dane zapisane na publicznym blockchainie mogą być jawne, trwałe i trudne do usunięcia.",
          "Wersja MVP korzysta z Solana Devnet, czyli sieci testowej, bez gwarancji wartości ekonomicznej.",
        ],
      },
      {
        title: "5. Odpowiedzialność",
        items: [
          "Coach FI jest dostarczany jako MVP i może zawierać błędy, przerwy lub ograniczenia funkcji.",
          "Nie gwarantujemy wyników finansowych, zysków, oszczędności ani skutków decyzji użytkownika.",
          "Użytkownik powinien weryfikować informacje przed podjęciem decyzji finansowych.",
        ],
      },
      {
        title: "6. Dane i prywatność",
        items: [
          "Zasady przetwarzania danych opisuje Polityka prywatności.",
          "Większość danych aplikacji jest przechowywana lokalnie w przeglądarce.",
          "Użytkownik może zmienić zgody opcjonalne oraz usunąć lokalne dane aplikacji.",
        ],
      },
    ],
  },
  ja: {
    eyebrow: "規約",
    title: "Coach FI 利用規約",
    updatedAt: "2026年5月10日",
    notice: "MVP 用の草案であり、最終的な法的助言ではありません。本番前に確認が必要です。",
    blocks: [
      { title: "1. アプリの性質", items: ["Coach FI は金融教育と習慣作りのアプリです。", "投資、税務、法律、信用の助言は提供しません。", "Mila AI は概念を説明しますが、専門家の代替ではありません。"] },
      { title: "2. 利用ルール", items: ["合法的に利用し、第三者データを無断で入力しないでください。", "パスワード、カード、身分証、銀行ログイン情報を入力しないでください。", "金融判断は利用者の責任です。"] },
      { title: "3. AI、音声、ランキング", items: ["AI、ElevenLabs、ランキング、ブロックチェーンは任意同意が必要です。", "同意がなくても基本学習はローカルで使えます。", "ランキングに名前、スコア、連続記録が表示される場合があります。"] },
      { title: "4. NFT 証明書", items: ["NFT は学習完了の証明であり投資商品ではありません。", "公開ブロックチェーンのデータは永続的な場合があります。", "MVP は Solana Devnet を使用します。"] },
      { title: "5. 責任", items: ["Coach FI は MVP であり制限があります。", "金融結果や利益は保証しません。", "判断前に情報を確認してください。"] },
      { title: "6. データとプライバシー", items: ["データ処理はプライバシーポリシーに記載されています。", "多くのデータはブラウザに保存されます。", "同意変更とローカルデータ削除が可能です。"] },
    ],
  },
};

export default function TermsPage() {
  const { locale } = useLanguage();
  const copy = TERMS_COPY[locale];
  const readText = [copy.title, ...copy.blocks.map((b) => `${b.title}. ${b.items.join(". ")}`)].join(". ");

  return (
    <section className="space-y-6" aria-labelledby="terms-title">
      <div className="focus-card rounded-lg p-6 md:p-8">
        <p className="text-sm font-black uppercase text-primary">{copy.eyebrow}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 id="terms-title" className="text-3xl font-black text-text">
            {copy.title}
          </h1>
          <VoiceButton text={readText} locale={locale} variant="pill" className="shrink-0" />
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          {copy.updatedAt}. {copy.notice}
        </p>
      </div>

      <div className="grid gap-4">
        {copy.blocks.map((block) => (
          <TermsBlock key={block.title} title={block.title} items={block.items} />
        ))}
      </div>
    </section>
  );
}

function TermsBlock({ title, items }: { title: string; items: string[] }) {
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
