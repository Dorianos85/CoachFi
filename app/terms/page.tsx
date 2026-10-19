"use client";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

type LegalPageCopy = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  notice: string;
  blocks: Array<{ title: string; items: string[] }>;
};

const TERMS_COPY: LocalizedMap<LegalPageCopy> = {
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
        title: "4. Certificates",
        items: [
          "Certificates prove completion of educational elements; they are not investment products.",
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
        title: "4. Certyfikaty",
        items: [
          "Certyfikaty są dowodem ukończenia elementów edukacyjnych, nie produktem inwestycyjnym.",
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
      { title: "4. 証明書", items: ["証明書は学習完了の証明であり投資商品ではありません。", "公開ブロックチェーンのデータは永続的な場合があります。", "MVP は Solana Devnet を使用します。"] },
      { title: "5. 責任", items: ["Coach FI は MVP であり制限があります。", "金融結果や利益は保証しません。", "判断前に情報を確認してください。"] },
      { title: "6. データとプライバシー", items: ["データ処理はプライバシーポリシーに記載されています。", "多くのデータはブラウザに保存されます。", "同意変更とローカルデータ削除が可能です。"] },
    ],
  },
  es: {
    eyebrow: "Términos",
    title: "Términos de uso de Coach FI",
    updatedAt: "10 de mayo de 2026",
    notice:
      "Borrador de términos del MVP, no es asesoramiento legal definitivo. Antes de producción, añade los datos del administrador, el contacto, la jurisdicción y el procedimiento de reclamaciones.",
    blocks: [
      {
        title: "1. Naturaleza de la app",
        items: [
          "Coach FI es una app educativa para la cultura financiera y la creación de hábitos.",
          "La app no ofrece asesoramiento de inversión, fiscal, legal ni de crédito.",
          "Mila IA puede explicar conceptos, pero no sustituye a un asesor autorizado.",
        ],
      },
      {
        title: "2. Normas para el usuario",
        items: [
          "Usa la app conforme a la ley y no introduzcas datos personales de terceros sin una base válida.",
          "No introduzcas contraseñas, números de tarjeta, números de identificación ni datos de acceso bancario.",
          "El contenido educativo puede incluir simplificaciones; las decisiones financieras siguen siendo tu responsabilidad.",
        ],
      },
      {
        title: "3. IA, voz y clasificación",
        items: [
          "La IA, la voz de ElevenLabs, la clasificación global y las funciones de blockchain requieren un consentimiento opcional aparte.",
          "Sin consentimiento, el aprendizaje básico sigue disponible mediante respuestas locales y almacenamiento local.",
          "La clasificación global puede mostrar tu nombre visible, puntuación y racha a otros usuarios.",
        ],
      },
      {
        title: "4. Certificados",
        items: [
          "Los certificados acreditan haber completado elementos educativos; no son productos de inversión.",
          "Los datos en una blockchain pública pueden ser visibles, permanentes y difíciles de eliminar.",
          "El MVP usa Solana Devnet, una red de pruebas sin valor económico garantizado.",
        ],
      },
      {
        title: "5. Responsabilidad",
        items: [
          "Coach FI se ofrece como MVP y puede contener errores, interrupciones o funciones limitadas.",
          "No garantizamos resultados financieros, beneficios, ahorros ni las decisiones de los usuarios.",
          "Los usuarios deben verificar la información antes de tomar decisiones financieras.",
        ],
      },
      {
        title: "6. Datos y privacidad",
        items: [
          "Las normas de tratamiento de datos se describen en la Política de privacidad.",
          "La mayoría de los datos de la app se guardan localmente en el navegador.",
          "Los usuarios pueden cambiar los consentimientos opcionales y eliminar los datos locales de la app.",
        ],
      },
    ],
  },
  fr: {
    eyebrow: "Conditions",
    title: "Conditions d'utilisation de Coach FI",
    updatedAt: "10 mai 2026",
    notice:
      "Projet de conditions pour le MVP, sans valeur d'avis juridique définitif. Avant la production, ajoutez les coordonnées de l'administrateur, un contact, la juridiction et la procédure de réclamation.",
    blocks: [
      {
        title: "1. Nature de l'application",
        items: [
          "Coach FI est une application éducative consacrée à la culture financière et à la construction d'habitudes.",
          "L'application ne fournit aucun conseil en investissement, fiscal, juridique ou en crédit.",
          "Mila IA peut expliquer des notions, mais ne remplace pas un conseiller agréé.",
        ],
      },
      {
        title: "2. Règles d'utilisation",
        items: [
          "Utilisez l'application dans le respect de la loi et ne saisissez pas de données personnelles de tiers sans base valable.",
          "Ne saisissez ni mots de passe, ni numéros de carte, ni numéros d'identité, ni identifiants bancaires.",
          "Le contenu éducatif peut comporter des simplifications ; les décisions financières restent de votre responsabilité.",
        ],
      },
      {
        title: "3. IA, voix et classement",
        items: [
          "L'IA, la voix ElevenLabs, le classement mondial et les fonctions blockchain nécessitent un consentement facultatif distinct.",
          "Sans consentement, l'apprentissage de base reste disponible grâce aux réponses locales et au stockage local.",
          "Le classement mondial peut afficher votre nom, votre score et votre série aux autres utilisateurs.",
        ],
      },
      {
        title: "4. Certificats",
        items: [
          "Les certificats attestent la réalisation d'éléments éducatifs ; ce ne sont pas des produits d'investissement.",
          "Les données d'une blockchain publique peuvent être visibles, permanentes et difficiles à supprimer.",
          "Le MVP utilise Solana Devnet, un réseau de test sans valeur économique garantie.",
        ],
      },
      {
        title: "5. Responsabilité",
        items: [
          "Coach FI est fourni en tant que MVP et peut comporter des bugs, des interruptions ou des fonctions limitées.",
          "Nous ne garantissons ni résultats financiers, ni profits, ni économies, ni les décisions des utilisateurs.",
          "Les utilisateurs doivent vérifier les informations avant de prendre des décisions financières.",
        ],
      },
      {
        title: "6. Données et confidentialité",
        items: [
          "Les règles de traitement des données sont décrites dans la Politique de confidentialité.",
          "La plupart des données de l'application sont stockées localement dans le navigateur.",
          "Les utilisateurs peuvent modifier les consentements facultatifs et supprimer les données locales de l'application.",
        ],
      },
    ],
  },
  zh: {
    eyebrow: "条款",
    title: "Coach FI 使用条款",
    updatedAt: "2026年5月10日",
    notice:
      "MVP 条款草案，并非最终法律意见。上线前请补充运营者信息、联系方式、管辖地和投诉流程。",
    blocks: [
      {
        title: "1. 应用性质",
        items: [
          "Coach FI 是一款用于提升金融素养和培养习惯的教育应用。",
          "本应用不提供投资、税务、法律或信贷建议。",
          "Mila AI 可以讲解概念，但不能替代持牌顾问。",
        ],
      },
      {
        title: "2. 用户规则",
        items: [
          "请依法使用本应用，没有正当依据时不要输入第三方的个人数据。",
          "不要输入密码、卡号、证件号或银行登录信息。",
          "教育内容可能有所简化；财务决策仍由你自己负责。",
        ],
      },
      {
        title: "3. AI、语音与排行榜",
        items: [
          "AI、ElevenLabs 语音、全球排行榜和区块链功能需要单独的可选授权。",
          "未授权时，仍可通过本地回复和本地存储使用核心学习功能。",
          "全球排行榜可能向其他用户显示你的显示名称、得分和连胜。",
        ],
      },
      {
        title: "4. 证书",
        items: [
          "证书证明你完成了教育内容；它们不是投资产品。",
          "公共区块链上的数据可能公开可见、永久存在且难以删除。",
          "MVP 使用 Solana Devnet，这是一个没有经济价值保证的测试网络。",
        ],
      },
      {
        title: "5. 责任",
        items: [
          "Coach FI 以 MVP 形式提供，可能存在错误、中断或功能受限。",
          "我们不保证财务结果、收益、储蓄或用户的决策。",
          "用户在做出财务决策前应自行核实信息。",
        ],
      },
      {
        title: "6. 数据与隐私",
        items: [
          "数据处理规则见《隐私政策》。",
          "大部分应用数据保存在本地浏览器中。",
          "用户可以更改可选授权并删除本地应用数据。",
        ],
      },
    ],
  },
  hi: {
    eyebrow: "शर्तें",
    title: "Coach FI उपयोग की शर्तें",
    updatedAt: "10 मई 2026",
    notice:
      "MVP की शर्तों का मसौदा, अंतिम कानूनी सलाह नहीं। प्रोडक्शन से पहले संचालक का विवरण, संपर्क, अधिकार क्षेत्र और शिकायत प्रक्रिया जोड़ें।",
    blocks: [
      {
        title: "1. ऐप का स्वरूप",
        items: [
          "Coach FI वित्तीय साक्षरता और आदत निर्माण के लिए एक शैक्षिक ऐप है।",
          "ऐप निवेश, टैक्स, कानूनी या क्रेडिट सलाह नहीं देता।",
          "Mila AI अवधारणाएं समझा सकती है, लेकिन लाइसेंस प्राप्त सलाहकार की जगह नहीं लेती।",
        ],
      },
      {
        title: "2. उपयोगकर्ता के नियम",
        items: [
          "ऐप का उपयोग कानून के अनुसार करें और वैध आधार के बिना किसी तीसरे व्यक्ति का निजी डेटा न डालें।",
          "पासवर्ड, कार्ड नंबर, पहचान संख्या या बैंक लॉगिन डेटा न डालें।",
          "शैक्षिक सामग्री में सरलीकरण हो सकता है; वित्तीय फ़ैसले आपकी अपनी ज़िम्मेदारी हैं।",
        ],
      },
      {
        title: "3. AI, आवाज़ और लीडरबोर्ड",
        items: [
          "AI, ElevenLabs आवाज़, ग्लोबल लीडरबोर्ड और ब्लॉकचेन सुविधाओं के लिए अलग वैकल्पिक सहमति ज़रूरी है।",
          "सहमति के बिना भी मुख्य सीख स्थानीय जवाबों और स्थानीय स्टोरेज के ज़रिए उपलब्ध रहती है।",
          "ग्लोबल लीडरबोर्ड आपका डिस्प्ले नाम, स्कोर और स्ट्रीक दूसरे उपयोगकर्ताओं को दिखा सकता है।",
        ],
      },
      {
        title: "4. सर्टिफ़िकेट",
        items: [
          "सर्टिफ़िकेट शैक्षिक हिस्से पूरे करने का प्रमाण हैं; ये निवेश उत्पाद नहीं हैं।",
          "सार्वजनिक ब्लॉकचेन का डेटा दिखाई दे सकता है, स्थायी हो सकता है और उसे हटाना मुश्किल हो सकता है।",
          "MVP Solana Devnet का उपयोग करता है, जो बिना किसी गारंटीड आर्थिक मूल्य वाला टेस्ट नेटवर्क है।",
        ],
      },
      {
        title: "5. ज़िम्मेदारी",
        items: [
          "Coach FI एक MVP के रूप में दिया जाता है और इसमें बग, रुकावटें या सीमित सुविधाएं हो सकती हैं।",
          "हम वित्तीय नतीजों, मुनाफ़े, बचत या उपयोगकर्ता के फ़ैसलों की गारंटी नहीं देते।",
          "उपयोगकर्ताओं को वित्तीय फ़ैसले लेने से पहले जानकारी की पुष्टि करनी चाहिए।",
        ],
      },
      {
        title: "6. डेटा और गोपनीयता",
        items: [
          "डेटा प्रोसेसिंग के नियम गोपनीयता नीति में बताए गए हैं।",
          "ऐप का ज़्यादातर डेटा ब्राउज़र में स्थानीय रूप से सहेजा जाता है।",
          "उपयोगकर्ता वैकल्पिक सहमतियां बदल सकते हैं और स्थानीय ऐप डेटा हटा सकते हैं।",
        ],
      },
    ],
  },
  "pt-BR": {
    eyebrow: "Termos",
    title: "Termos de Uso do Coach FI",
    updatedAt: "10 de maio de 2026",
    notice:
      "Rascunho de termos do MVP, não é aconselhamento jurídico final. Antes da produção, inclua os dados do administrador, o contato, a jurisdição e o processo de reclamações.",
    blocks: [
      {
        title: "1. Natureza do app",
        items: [
          "O Coach FI é um app educacional para educação financeira e criação de hábitos.",
          "O app não oferece consultoria de investimentos, tributária, jurídica ou de crédito.",
          "A Mila IA pode explicar conceitos, mas não substitui um profissional habilitado.",
        ],
      },
      {
        title: "2. Regras do usuário",
        items: [
          "Use o app de acordo com a lei e não insira dados pessoais de terceiros sem uma base válida.",
          "Não insira senhas, números de cartão, números de documentos nem dados de login bancário.",
          "O conteúdo educacional pode conter simplificações; as decisões financeiras continuam sendo de sua responsabilidade.",
        ],
      },
      {
        title: "3. IA, voz e ranking",
        items: [
          "A IA, a voz da ElevenLabs, o ranking global e os recursos de blockchain exigem consentimento opcional separado.",
          "Sem consentimento, o aprendizado essencial continua disponível por meio de respostas locais e armazenamento local.",
          "O ranking global pode mostrar seu nome de exibição, pontuação e sequência a outros usuários.",
        ],
      },
      {
        title: "4. Certificados",
        items: [
          "Os certificados comprovam a conclusão de elementos educacionais; não são produtos de investimento.",
          "Dados em blockchain pública podem ser visíveis, permanentes e difíceis de apagar.",
          "O MVP usa a Solana Devnet, uma rede de testes sem valor econômico garantido.",
        ],
      },
      {
        title: "5. Responsabilidade",
        items: [
          "O Coach FI é oferecido como MVP e pode conter falhas, interrupções ou recursos limitados.",
          "Não garantimos resultados financeiros, lucros, economias nem as decisões dos usuários.",
          "Os usuários devem verificar as informações antes de tomar decisões financeiras.",
        ],
      },
      {
        title: "6. Dados e privacidade",
        items: [
          "As regras de tratamento de dados estão descritas na Política de Privacidade.",
          "A maior parte dos dados do app é armazenada localmente no navegador.",
          "Os usuários podem alterar os consentimentos opcionais e remover os dados locais do app.",
        ],
      },
    ],
  },
  tr: {
    eyebrow: "Koşullar",
    title: "Coach FI Kullanım Koşulları",
    updatedAt: "10 Mayıs 2026",
    notice:
      "MVP için taslak koşullardır, nihai hukuki tavsiye değildir. Canlıya geçmeden önce yönetici bilgilerini, iletişimi, yetkili hukuku ve şikâyet sürecini ekle.",
    blocks: [
      {
        title: "1. Uygulamanın niteliği",
        items: [
          "Coach FI, finansal okuryazarlık ve alışkanlık oluşturma için bir eğitim uygulamasıdır.",
          "Uygulama yatırım, vergi, hukuk veya kredi tavsiyesi vermez.",
          "Mila AI kavramları açıklayabilir, ancak lisanslı bir danışmanın yerini tutmaz.",
        ],
      },
      {
        title: "2. Kullanıcı kuralları",
        items: [
          "Uygulamayı hukuka uygun kullan ve geçerli bir dayanak olmadan üçüncü kişilerin kişisel verilerini girme.",
          "Şifre, kart numarası, kimlik numarası veya banka giriş bilgisi girme.",
          "Eğitim içeriği sadeleştirmeler içerebilir; finansal kararlar senin sorumluluğundadır.",
        ],
      },
      {
        title: "3. AI, ses ve sıralama",
        items: [
          "AI, ElevenLabs sesi, küresel sıralama ve blokzincir özellikleri ayrı, isteğe bağlı onay gerektirir.",
          "Onay olmadan da temel öğrenme, yerel yanıtlar ve yerel depolama ile kullanılabilir.",
          "Küresel sıralama görünen adını, puanını ve serini diğer kullanıcılara gösterebilir.",
        ],
      },
      {
        title: "4. Sertifikalar",
        items: [
          "Sertifikalar eğitim adımlarının tamamlandığını kanıtlar; yatırım ürünü değildir.",
          "Herkese açık blokzincir verileri görünür, kalıcı ve silinmesi zor olabilir.",
          "MVP, garantili ekonomik değeri olmayan bir test ağı olan Solana Devnet'i kullanır.",
        ],
      },
      {
        title: "5. Sorumluluk",
        items: [
          "Coach FI bir MVP olarak sunulur; hata, kesinti veya sınırlı özellik içerebilir.",
          "Finansal sonuç, kâr, tasarruf veya kullanıcı kararları konusunda garanti vermeyiz.",
          "Kullanıcılar finansal karar vermeden önce bilgileri doğrulamalıdır.",
        ],
      },
      {
        title: "6. Veriler ve gizlilik",
        items: [
          "Veri işleme kuralları Gizlilik Politikası'nda açıklanır.",
          "Uygulama verilerinin çoğu tarayıcıda yerel olarak saklanır.",
          "Kullanıcılar isteğe bağlı onayları değiştirebilir ve yerel uygulama verilerini kaldırabilir.",
        ],
      },
    ],
  },
};

export default function TermsPage() {
  const { locale } = useLanguage();
  const copy = pickLocalized(TERMS_COPY, locale);
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
