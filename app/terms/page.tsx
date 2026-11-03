"use client";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

type LegalPageCopy = {
  eyebrow: string;
  title: string;
  /** Visible "draft" label until the text has been reviewed by a lawyer. */
  draftBadge?: string;
  updatedAt: string;
  notice: string;
  blocks: Array<{ title: string; items: string[] }>;
};

const FALLBACK_BADGE = "Draft — pending legal review";

const TERMS_COPY: LocalizedMap<LegalPageCopy> = {
  en: {
    eyebrow: "Terms",
    title: "CoachfiAI Terms of Use",
    draftBadge: "Draft — pending legal review",
    updatedAt: "Last updated November 3, 2026",
    notice:
      "These are beta terms. They haven't been reviewed by a lawyer yet. Items in [brackets] are still to be completed.",
    blocks: [
      {
        title: "1. Who we are",
        items: [
          "CoachfiAI is operated by [Company name, address — to be completed].",
          "Contact: [contact email — to be completed].",
        ],
      },
      {
        title: "2. Education only",
        items: [
          "CoachfiAI is an educational app for financial literacy and money habits.",
          "We are not a registered investment adviser, broker-dealer, financial planner, tax preparer, credit counselor or law firm. Nothing in the app is investment, tax, legal or credit advice, and using the app doesn't create a fiduciary or advisory relationship.",
          "Content is general and may simplify things. Check important information and talk to a qualified professional before you make financial decisions. Your decisions are your own.",
          "Examples with returns are hypothetical. Investments can lose value.",
        ],
      },
      {
        title: "3. Mila is an AI",
        items: [
          "Mila is an AI system, not a person. Her text and voice replies are generated automatically and can be wrong or incomplete.",
          "Mila won't tell you what to buy or sell, or how to split your money.",
          "CoachfiAI is not a crisis service. If you're thinking about suicide or might hurt yourself, call or text 988 (U.S.). In an emergency, call 911. Outside the U.S., call your local emergency number.",
        ],
      },
      {
        title: "4. Who can use the app",
        items: [
          "You must be 18 or older to create an account. Teens 13–17 may use the app only with a parent's or guardian's permission.",
          "Kids Mode is for children using the app together with a parent or guardian, who is responsible for that use.",
        ],
      },
      {
        title: "5. Your responsibilities",
        items: [
          "Use the app lawfully and don't enter other people's personal data without permission.",
          "Never enter passwords, card numbers, Social Security numbers or bank logins.",
          "Don't misuse the service (for example by trying to break security limits or by automated scraping).",
        ],
      },
      {
        title: "6. Optional features",
        items: [
          "AI chat, ElevenLabs voice, the global leaderboard and blockchain certificates each need your separate, optional consent. You can turn them off at any time.",
          "Without them, lessons, quizzes and the Health Check still work with local data.",
          "If you join the leaderboard, other users can see your display name, score and streak.",
        ],
      },
      {
        title: "7. Points and certificates",
        items: [
          "Points are a learning reward. They have no cash value and can't be sold, exchanged or withdrawn.",
          "Certificates show that you completed lessons. They are not investment products. During the beta they are recorded on a Solana test network, which can be reset.",
          "Data written to a public blockchain may be visible and permanent.",
        ],
      },
      {
        title: "8. Beta service and pricing",
        items: [
          "The app is in beta. It may have bugs, change or be interrupted, and is provided \"as is\" to the extent the law allows.",
          "The beta is free. If we introduce paid plans or a trial that turns into a paid plan, we'll show the price, how renewal works and how to cancel before you pay anything.",
        ],
      },
      {
        title: "9. Liability",
        items: [
          "We don't guarantee any financial outcome, savings or returns.",
          "To the extent the law allows, we're not liable for decisions you make based on the app's content. Nothing in these terms limits rights you have under consumer protection laws that can't be waived.",
        ],
      },
      {
        title: "10. Privacy, law and changes",
        items: [
          "How we handle data is explained in the Privacy Policy.",
          "Governing law and how disputes are resolved: [to be completed after legal review].",
          "If we change these terms, we'll update the date above and tell you in the app about important changes.",
        ],
      },
    ],
  },
  pl: {
    eyebrow: "Regulamin",
    title: "Regulamin korzystania z Coach FI",
    draftBadge: "Wersja robocza — czeka na weryfikację prawną",
    updatedAt: "Aktualizacja: 3 listopada 2026",
    notice:
      "To roboczy regulamin MVP, nie finalna opinia prawna. Przed publikacją produkcyjną uzupełnij dane administratora, kontakt, jurysdykcję i proces reklamacji.",
    blocks: [
      {
        title: "1. Charakter aplikacji",
        items: [
          "Coach FI jest aplikacją edukacji finansowej i budowania nawyków.",
          "Aplikacja nie świadczy doradztwa inwestycyjnego, podatkowego, prawnego ani kredytowego.",
          "Mila AI może pomagać wyjaśniać pojęcia, ale nie zastąpi licencjonowanego doradcy.",
          "Mila to system sztucznej inteligencji, nie człowiek. Jej odpowiedzi mogą zawierać błędy.",
          "Aplikacja nie jest usługą kryzysową. Jeśli myślisz o samobójstwie lub zrobieniu sobie krzywdy, zadzwoń pod 116 123 lub 800 70 2222, a w sytuacji zagrożenia życia pod 112.",
          "Administrator: [Nazwa firmy, adres — do uzupełnienia]. Kontakt: [e-mail — do uzupełnienia].",
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
    title: "Términos de uso de CoachfiAI",
    draftBadge: "Borrador — pendiente de revisión legal",
    updatedAt: "Última actualización: 3 de noviembre de 2026",
    notice:
      "Estos son los términos de la beta. Todavía no los ha revisado un abogado. Lo que aparece entre [corchetes] está pendiente de completar.",
    blocks: [
      {
        title: "1. Quiénes somos",
        items: [
          "CoachfiAI está operada por [Nombre de la empresa, dirección — pendiente de completar].",
          "Contacto: [correo de contacto — pendiente de completar].",
        ],
      },
      {
        title: "2. Solo educación",
        items: [
          "CoachfiAI es una app educativa de finanzas personales y hábitos con el dinero.",
          "No somos asesores de inversión registrados, corredores de bolsa, planificadores financieros, preparadores de impuestos, consejeros de crédito ni un bufete de abogados. Nada en la app es asesoría de inversión, fiscal, legal ni de crédito, y usar la app no crea una relación fiduciaria ni de asesoría.",
          "El contenido es general y puede simplificar las cosas. Verifica la información importante y consulta a un profesional calificado antes de tomar decisiones financieras. Tus decisiones son tuyas.",
          "Los ejemplos con rendimientos son hipotéticos. Las inversiones pueden perder valor.",
        ],
      },
      {
        title: "3. Mila es una IA",
        items: [
          "Mila es un sistema de inteligencia artificial, no una persona. Sus respuestas de texto y voz se generan automáticamente y pueden ser incorrectas o incompletas.",
          "Mila no te dirá qué comprar o vender ni cómo repartir tu dinero.",
          "CoachfiAI no es un servicio de crisis. Si piensas en el suicidio o temes hacerte daño, llama o envía un mensaje de texto al 988 (EE. UU.; marca 2 para español). En una emergencia, llama al 911. Fuera de EE. UU., llama al número de emergencias local.",
        ],
      },
      {
        title: "4. Quién puede usar la app",
        items: [
          "Debes tener 18 años o más para crear una cuenta. Los adolescentes de 13 a 17 años solo pueden usar la app con permiso de su padre, madre o tutor.",
          "El Modo niños es para niños que usan la app junto con un padre, una madre o un tutor, que es responsable de ese uso.",
        ],
      },
      {
        title: "5. Tus responsabilidades",
        items: [
          "Usa la app de forma legal y no escribas datos personales de otras personas sin su permiso.",
          "Nunca escribas contraseñas, números de tarjeta, números de Seguro Social ni accesos a tu banco.",
          "No hagas un mal uso del servicio (por ejemplo, intentando saltarte los límites de seguridad o extrayendo datos de forma automática).",
        ],
      },
      {
        title: "6. Funciones opcionales",
        items: [
          "El chat con IA, la voz de ElevenLabs, la clasificación global y los certificados en blockchain necesitan cada uno tu consentimiento opcional por separado. Puedes desactivarlos cuando quieras.",
          "Sin ellos, las lecciones, los quizzes y el Chequeo de salud financiera siguen funcionando con datos locales.",
          "Si te unes a la clasificación, otros usuarios pueden ver tu nombre visible, tu puntuación y tu racha.",
        ],
      },
      {
        title: "7. Puntos y certificados",
        items: [
          "Los puntos son una recompensa por aprender. No tienen valor en dinero y no se pueden vender, intercambiar ni retirar.",
          "Los certificados muestran que completaste lecciones. No son productos de inversión. Durante la beta se registran en una red de prueba de Solana, que puede reiniciarse.",
          "Los datos escritos en una blockchain pública pueden ser visibles y permanentes.",
        ],
      },
      {
        title: "8. Servicio beta y precios",
        items: [
          "La app está en beta. Puede tener errores, cambiar o interrumpirse, y se ofrece «tal cual» en la medida que permita la ley.",
          "La beta es gratuita. Si añadimos planes de pago o una prueba que se convierta en un plan de pago, te mostraremos el precio, cómo funciona la renovación y cómo cancelar antes de que pagues nada.",
        ],
      },
      {
        title: "9. Responsabilidad",
        items: [
          "No garantizamos ningún resultado financiero, ahorro ni rendimiento.",
          "En la medida que permita la ley, no somos responsables de las decisiones que tomes según el contenido de la app. Nada en estos términos limita los derechos irrenunciables que te dan las leyes de protección al consumidor.",
        ],
      },
      {
        title: "10. Privacidad, ley aplicable y cambios",
        items: [
          "Cómo tratamos los datos se explica en la Política de privacidad.",
          "Ley aplicable y resolución de disputas: [pendiente de completar tras la revisión legal].",
          "Si cambiamos estos términos, actualizaremos la fecha de arriba y te avisaremos en la app de los cambios importantes.",
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
        <p className="mb-3 inline-flex items-center rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-black uppercase text-warning" data-testid="legal-draft-badge">
          {copy.draftBadge ?? FALLBACK_BADGE}
        </p>
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
