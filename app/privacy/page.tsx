"use client";

import { VoiceButton } from "@/components/VoiceButton";
import { DataSafetyPanel } from "@/components/DataSafetyPanel";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getPublicPrivacyConfig, getPrivacyContactCopy } from "@/lib/privacy-config";

type PrivacyCopy = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  notice: string;
  blocks: Array<{ title: string; items: string[] }>;
  providersTitle: string;
  providersText: string;
};

const PRIVACY_COPY: LocalizedMap<PrivacyCopy> = {
  en: {
    "eyebrow": "Privacy and data",
    "title": "Coach FI Privacy Information",
    "updatedAt": "October 19, 2026",
    "notice": "Information is incomplete: the controller details, verified contact, retention rules, provider arrangements and rights process still require confirmation. Do not enter real personal or financial data while these details are incomplete.",
    "blocks": [
      {
        "title": "Data on this device",
        "items": [
          "Learning progress, profile name or nickname, goal, diagnosis answers, avatar, consents and settings can be stored in this browser. Guest data and account data use separate local scopes.",
          "Device preferences such as language are separate from personal progress. Authentication credentials and SDK sessions are not part of the selected product export.",
          "Browser storage is not a backup. Clearing it or losing this device can remove local progress."
        ]
      },
      {
        "title": "Account, hosting and messages",
        "items": [
          "If you choose an available sign-in method, authentication data is processed by the configured account provider, such as Coinbase CDP or Supabase. This is separate from saving progress locally.",
          "Signing in can read earlier account data from the server into an empty local account view. Automatic uploads of new learning changes are disabled in this release; a local save is not proof of a server save.",
          "A request to the local-text chat endpoint is still sent to the Coach FI application server. Local text means no external AI model is used for that response; it does not mean that the message never leaves the device.",
          "Loading the site and using server endpoints creates technical network requests. Hosting and account-provider log retention has not been confirmed here."
        ]
      },
      {
        "title": "External and deferred features",
        "items": [
          "External AI, ElevenLabs voice, global leaderboard and blockchain actions are unavailable in the current release. Changing an optional preference does not enable these disabled services.",
          "A browser read-aloud feature, where available, depends on the browser and operating system. We have not verified that every voice works offline or keeps all text on the device.",
          "Before any external service is enabled, its recipients, purposes, regions, retention, contracts and any international transfers must be confirmed and reflected in this information."
        ]
      },
      {
        "title": "Export, deletion and choices",
        "items": [
          "The data controls below export a selected, sanitized set for the current local guest or account. This is not a full account export or a copy of every stored field.",
          "Delete local data affects only the stated local product scope. It does not close the account, clear an SDK session, erase server records or delete data held by providers.",
          "Signing in again may read earlier account data into an empty local view. Removing local data does not request deletion of those earlier records.",
          "Changing optional preferences stops future optional work covered by that choice; it does not erase earlier processing. Acknowledging this notice is not blanket consent to every purpose."
        ]
      },
      {
        "title": "Details still to be confirmed",
        "items": [
          "The owner has been identified, but full controller details, legal bases, retention and backup periods, processor arrangements and the rights and complaints process have not yet been confirmed.",
          "No retention duration, processing region, complete deletion promise or GDPR compliance approval is asserted by this page. The production release must remain blocked until the missing information and procedures have been independently reviewed."
        ]
      }
    ],
    "providersTitle": "Providers and release limits",
    "providersText": "The site is hosted on Vercel. Account authentication and initial account reads may use the configured Coinbase CDP or Supabase path. External AI, ElevenLabs, leaderboard and Web3 actions remain disabled. Actual account, provider, region, contract and rights workflows require separate verification; this page does not certify them."
  },
  pl: {
    "eyebrow": "Prywatność i dane",
    "title": "Informacje o prywatności Coach FI",
    "updatedAt": "19 października 2026",
    "notice": "Informacje są niepełne: dane administratora, potwierdzony kontakt, zasady retencji, ustalenia z dostawcami i obsługa praw wymagają potwierdzenia. Dopóki tych informacji brakuje, nie wprowadzaj rzeczywistych danych osobowych ani finansowych.",
    "blocks": [
      {
        "title": "Dane na tym urządzeniu",
        "items": [
          "Postępy nauki, imię lub pseudonim, cel, odpowiedzi diagnozy, awatar, zgody i ustawienia mogą być zapisywane w tej przeglądarce. Dane gościa i konta mają oddzielne zakresy lokalne.",
          "Ustawienia urządzenia, np. język, są oddzielone od osobistych postępów. Poświadczenia i sesje SDK nie należą do wybranego eksportu danych produktu.",
          "Pamięć przeglądarki nie jest kopią zapasową. Jej wyczyszczenie lub utrata urządzenia może usunąć lokalne postępy."
        ]
      },
      {
        "title": "Konto, hosting i wiadomości",
        "items": [
          "Po wybraniu dostępnego logowania dane uwierzytelniania przetwarza skonfigurowany operator konta, np. Coinbase CDP lub Supabase. To inny proces niż lokalny zapis postępów.",
          "Logowanie może pobrać wcześniejsze dane konta z serwera do pustego lokalnego widoku konta. Automatyczne wysyłanie nowych zmian nauki jest w tej wersji wyłączone; zapis lokalny nie potwierdza zapisu na serwerze.",
          "Zapytanie do endpointu lokalnych odpowiedzi tekstowych jest nadal wysyłane do serwera aplikacji Coach FI. Lokalny tekst oznacza brak zewnętrznego modelu AI dla tej odpowiedzi, a nie brak opuszczania urządzenia przez wiadomość.",
          "Wczytanie strony i używanie endpointów serwera tworzy techniczne żądania sieciowe. Nie potwierdzono tutaj okresów przechowywania logów hostingu ani operatorów kont."
        ]
      },
      {
        "title": "Funkcje zewnętrzne i odroczone",
        "items": [
          "Zewnętrzne AI, głos ElevenLabs, globalny ranking i operacje blockchain są w tej wersji niedostępne. Zmiana ustawienia opcjonalnego nie włącza tych wyłączonych usług.",
          "Odczyt głosowy przeglądarki, jeśli dostępny, zależy od przeglądarki i systemu operacyjnego. Nie potwierdzono, że każdy głos działa offline lub zachowuje cały tekst na urządzeniu.",
          "Przed uruchomieniem usługi zewnętrznej trzeba potwierdzić jej odbiorców, cele, regiony, retencję, umowy i ewentualne transfery międzynarodowe oraz uwzględnić je w tych informacjach."
        ]
      },
      {
        "title": "Eksport, usuwanie i wybory",
        "items": [
          "Poniższe narzędzia eksportują wybrany, oczyszczony zestaw danych bieżącego lokalnego gościa lub konta. To nie jest pełny eksport konta ani kopia każdego zapisanego pola.",
          "Usunięcie danych lokalnych obejmuje tylko wskazany lokalny zakres produktu. Nie zamyka konta, nie czyści sesji SDK ani nie usuwa rekordów serwera lub danych u dostawców.",
          "Ponowne logowanie może pobrać wcześniejsze dane konta do pustego lokalnego widoku. Usunięcie danych lokalnych nie jest żądaniem usunięcia tych wcześniejszych rekordów.",
          "Zmiana ustawień opcjonalnych zatrzymuje przyszłe działania objęte danym wyborem; nie usuwa wcześniejszego przetwarzania. Potwierdzenie zapoznania się z tym dokumentem nie oznacza zgody na każdy cel."
        ]
      },
      {
        "title": "Informacje wymagające potwierdzenia",
        "items": [
          "Właściciel został wskazany, ale pełne dane administratora, podstawy prawne, okresy retencji i kopii zapasowych, ustalenia z podmiotami przetwarzającymi oraz obsługa praw i reklamacji nie zostały jeszcze potwierdzone.",
          "Ta strona nie potwierdza okresu retencji, regionu przetwarzania, kompletnego usunięcia danych ani zgodności z RODO. Wydanie produkcyjne musi pozostać zablokowane do niezależnej recenzji brakujących informacji i procedur."
        ]
      }
    ],
    "providersTitle": "Dostawcy i ograniczenia wydania",
    "providersText": "Strona jest hostowana w Vercel. Uwierzytelnianie i początkowy odczyt konta mogą korzystać ze skonfigurowanej ścieżki Coinbase CDP lub Supabase. Zewnętrzne AI, ElevenLabs, ranking i operacje Web3 pozostają wyłączone. Faktyczne procesy konta, dostawców, regionów, umów i obsługi praw wymagają oddzielnej weryfikacji; ta strona ich nie certyfikuje."
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
  es: {
    eyebrow: "Privacidad y datos",
    title: "Política de privacidad de Coach FI",
    updatedAt: "10 de mayo de 2026",
    notice: "Este es un borrador de MVP y debe revisarlo un abogado antes del lanzamiento en producción.",
    blocks: [
      {
        title: "Qué datos tratamos",
        items: [
          "Datos locales: nombre o apodo, objetivo, progreso, racha, ajustes de voz, idioma y consentimientos.",
          "Datos de formularios educativos: los importes introducidos en el chequeo financiero se calculan en el navegador.",
          "Datos de IA: el texto de la pregunta y un breve historial del chat se envían al proveedor de IA solo con consentimiento.",
          "Datos de voz: se envían fragmentos cortos de texto a ElevenLabs solo después de pulsar un botón de lectura en voz alta.",
          "Datos de clasificación: el nombre visible, la puntuación y la racha se envían a Supabase solo con consentimiento.",
          "Datos de blockchain: la dirección del monedero y los metadatos del certificado pueden ser públicos y difíciles de eliminar.",
        ],
      },
      {
        title: "Para qué tratamos los datos",
        items: [
          "Para guardar el progreso y los ajustes en este dispositivo.",
          "Para personalizar las respuestas educativas de Mila.",
          "Para leer las respuestas en voz alta cuando la voz está activada.",
          "Para mostrar la clasificación y los certificados educativos.",
          "Para proteger los endpoints de la API, aplicar límites de uso y diagnosticar la configuración.",
        ],
      },
      {
        title: "Base legal y consentimientos",
        items: [
          "Usar la app requiere aceptar las condiciones y la información de privacidad.",
          "Las funciones externas son opcionales y se pueden activar o desactivar en los ajustes de consentimiento.",
          "Retirar el consentimiento no afecta al tratamiento realizado antes de la retirada.",
          "No pedimos contraseñas bancarias, números de tarjeta, documentos de identidad ni datos de acceso a entidades financieras.",
        ],
      },
      {
        title: "Tus derechos",
        items: [
          "Puedes eliminar los datos locales de la app de este dispositivo.",
          "Puedes exportar los datos locales guardados por Coach FI.",
          "Puedes cambiar los consentimientos opcionales en el pie de página.",
          "La versión de producción debe añadir los datos del responsable, un contacto de privacidad y la gestión de solicitudes RGPD.",
        ],
      },
    ],
    providersTitle: "Proveedores externos",
    providersText:
      "La app puede integrarse con Anthropic, ElevenLabs, Supabase y Solana Devnet. Antes de pasar a producción, confirma con cada proveedor las regiones de tratamiento, los contratos de encargo de tratamiento, la conservación y las transferencias internacionales.",
  },
  fr: {
    eyebrow: "Confidentialité et données",
    title: "Politique de confidentialité de Coach FI",
    updatedAt: "10 mai 2026",
    notice: "Ceci est un projet de MVP et doit être relu par un juriste avant la mise en production.",
    blocks: [
      {
        title: "Quelles données nous traitons",
        items: [
          "Données locales : prénom ou pseudo, objectif, progression, série, réglages de voix, langue et consentements.",
          "Données des formulaires éducatifs : les montants saisis dans le bilan financier sont calculés dans le navigateur.",
          "Données d'IA : le texte de la question et un court historique de discussion ne sont envoyés au fournisseur d'IA qu'avec votre consentement.",
          "Données vocales : de courts extraits de texte ne sont envoyés à ElevenLabs qu'après un clic sur un bouton de lecture à voix haute.",
          "Données de classement : le nom affiché, le score et la série ne sont envoyés à Supabase qu'avec votre consentement.",
          "Données blockchain : l'adresse du portefeuille et les métadonnées du certificat peuvent être publiques et difficiles à supprimer.",
        ],
      },
      {
        title: "Pourquoi nous traitons les données",
        items: [
          "Pour enregistrer la progression et les réglages sur cet appareil.",
          "Pour personnaliser les réponses éducatives de Mila.",
          "Pour lire les réponses à voix haute lorsque la voix est activée.",
          "Pour afficher le classement et les certificats éducatifs.",
          "Pour sécuriser les points d'accès de l'API, appliquer des limites de débit et diagnostiquer la configuration.",
        ],
      },
      {
        title: "Base légale et consentements",
        items: [
          "L'utilisation de l'application nécessite l'acceptation des conditions et de l'information sur la confidentialité.",
          "Les fonctions externes sont facultatives et peuvent être activées ou désactivées dans les paramètres de consentement.",
          "Le retrait du consentement n'affecte pas les traitements effectués avant ce retrait.",
          "Nous ne demandons ni mots de passe bancaires, ni numéros de carte, ni pièces d'identité, ni identifiants d'établissements financiers.",
        ],
      },
      {
        title: "Vos droits",
        items: [
          "Vous pouvez supprimer les données locales de l'application sur cet appareil.",
          "Vous pouvez exporter les données locales stockées par Coach FI.",
          "Vous pouvez modifier les consentements facultatifs dans le pied de page.",
          "Le déploiement en production doit ajouter les coordonnées du responsable de traitement, un contact confidentialité et la gestion des demandes RGPD.",
        ],
      },
    ],
    providersTitle: "Fournisseurs externes",
    providersText:
      "L'application peut s'intégrer à Anthropic, ElevenLabs, Supabase et Solana Devnet. Avant la mise en production, confirmez pour chaque fournisseur les régions de traitement, les accords de sous-traitance, la durée de conservation et les transferts internationaux.",
  },
  zh: {
    eyebrow: "隐私与数据",
    title: "Coach FI 隐私政策",
    updatedAt: "2026年5月10日",
    notice: "这是 MVP 草案，正式上线前应由律师审阅。",
    blocks: [
      {
        title: "我们处理哪些数据",
        items: [
          "本地数据：姓名或昵称、目标、进度、连胜、语音设置、语言和授权。",
          "教育表单数据：在财务检查中输入的金额在浏览器中计算。",
          "AI 数据：只有在你授权后，问题文本和简短的聊天记录才会发送给 AI 服务商。",
          "语音数据：只有在你点击朗读按钮后，简短的文本片段才会发送给 ElevenLabs。",
          "排行榜数据：只有在你授权后，显示名称、得分和连胜才会发送到 Supabase。",
          "区块链数据：钱包地址和证书元数据可能是公开的，且难以删除。",
        ],
      },
      {
        title: "我们为什么处理数据",
        items: [
          "在本设备上保存进度和设置。",
          "个性化 Mila 的教育回复。",
          "在开启语音时朗读回答。",
          "显示排行榜和教育证书。",
          "保护 API 端点、实施速率限制并进行配置诊断。",
        ],
      },
      {
        title: "法律依据与授权",
        items: [
          "使用本应用需要接受条款和隐私说明。",
          "外部功能是可选的，可在授权设置中开启或关闭。",
          "撤回授权不影响撤回之前已进行的处理。",
          "我们不会索要银行密码、卡号、身份证件号或金融机构登录信息。",
        ],
      },
      {
        title: "你的权利",
        items: [
          "你可以从本设备删除本地应用数据。",
          "你可以导出 Coach FI 存储的本地数据。",
          "你可以在页脚更改可选授权。",
          "正式部署时必须补充数据控制者信息、隐私联系方式和数据主体请求的处理流程。",
        ],
      },
    ],
    providersTitle: "外部服务商",
    providersText:
      "本应用可与 Anthropic、ElevenLabs、Supabase 和 Solana Devnet 集成。上线前，请逐一确认各服务商的处理地区、数据处理协议、保留期限和跨境传输。",
  },
  hi: {
    eyebrow: "गोपनीयता और डेटा",
    title: "Coach FI गोपनीयता नीति",
    updatedAt: "10 मई 2026",
    notice: "यह MVP का मसौदा है और प्रोडक्शन लॉन्च से पहले किसी वकील से इसकी समीक्षा करानी चाहिए।",
    blocks: [
      {
        title: "हम कौन सा डेटा प्रोसेस करते हैं",
        items: [
          "स्थानीय डेटा: नाम या उपनाम, लक्ष्य, प्रगति, स्ट्रीक, आवाज़ की सेटिंग, भाषा और सहमतियां।",
          "शैक्षिक फ़ॉर्म का डेटा: वित्तीय जांच में डाली गई राशियों की गणना ब्राउज़र में होती है।",
          "AI डेटा: सवाल का टेक्स्ट और छोटा चैट इतिहास सिर्फ़ सहमति मिलने पर AI प्रदाता को भेजा जाता है।",
          "आवाज़ का डेटा: छोटे टेक्स्ट अंश ElevenLabs को तभी भेजे जाते हैं जब आप ज़ोर से पढ़ने वाला बटन दबाते हैं।",
          "लीडरबोर्ड डेटा: डिस्प्ले नाम, स्कोर और स्ट्रीक सिर्फ़ सहमति मिलने पर Supabase को भेजे जाते हैं।",
          "ब्लॉकचेन डेटा: वॉलेट का पता और सर्टिफ़िकेट का मेटाडेटा सार्वजनिक हो सकता है और उसे हटाना मुश्किल हो सकता है।",
        ],
      },
      {
        title: "हम डेटा क्यों प्रोसेस करते हैं",
        items: [
          "इस डिवाइस पर प्रगति और सेटिंग सहेजने के लिए।",
          "Mila के शैक्षिक जवाबों को आपके अनुसार ढालने के लिए।",
          "आवाज़ चालू होने पर जवाब ज़ोर से पढ़ने के लिए।",
          "लीडरबोर्ड और शिक्षा सर्टिफ़िकेट दिखाने के लिए।",
          "API एंडपॉइंट सुरक्षित रखने, रेट लिमिट लागू करने और कॉन्फ़िगरेशन की जांच के लिए।",
        ],
      },
      {
        title: "कानूनी आधार और सहमतियां",
        items: [
          "ऐप इस्तेमाल करने के लिए शर्तों और गोपनीयता जानकारी को स्वीकार करना ज़रूरी है।",
          "बाहरी सुविधाएं वैकल्पिक हैं और सहमति सेटिंग में चालू या बंद की जा सकती हैं।",
          "सहमति वापस लेने से वापसी से पहले हुई प्रोसेसिंग पर असर नहीं पड़ता।",
          "हम बैंक पासवर्ड, कार्ड नंबर, राष्ट्रीय पहचान संख्या या वित्तीय संस्थानों के लॉगिन डेटा नहीं मांगते।",
        ],
      },
      {
        title: "आपके अधिकार",
        items: [
          "आप इस डिवाइस से स्थानीय ऐप डेटा हटा सकते हैं।",
          "आप Coach FI द्वारा सहेजा गया स्थानीय डेटा एक्सपोर्ट कर सकते हैं।",
          "आप फ़ुटर में वैकल्पिक सहमतियां बदल सकते हैं।",
          "प्रोडक्शन संस्करण में डेटा नियंत्रक का विवरण, गोपनीयता संपर्क और डेटा अनुरोधों को संभालने की प्रक्रिया जोड़नी होगी।",
        ],
      },
    ],
    providersTitle: "बाहरी प्रदाता",
    providersText:
      "ऐप Anthropic, ElevenLabs, Supabase और Solana Devnet के साथ जुड़ सकता है। प्रोडक्शन से पहले हर प्रदाता के लिए प्रोसेसिंग क्षेत्र, डेटा प्रोसेसिंग समझौते, डेटा रखने की अवधि और अंतरराष्ट्रीय ट्रांसफ़र की पुष्टि करें।",
  },
  "pt-BR": {
    eyebrow: "Privacidade e dados",
    title: "Política de Privacidade do Coach FI",
    updatedAt: "10 de maio de 2026",
    notice: "Este é um rascunho de MVP e deve ser revisado por um advogado antes do lançamento em produção.",
    blocks: [
      {
        title: "Quais dados tratamos",
        items: [
          "Dados locais: nome ou apelido, meta, progresso, sequência, configurações de voz, idioma e consentimentos.",
          "Dados de formulários educacionais: os valores informados no check-up financeiro são calculados no navegador.",
          "Dados de IA: o texto da pergunta e um breve histórico do chat são enviados ao provedor de IA somente com consentimento.",
          "Dados de voz: trechos curtos de texto são enviados à ElevenLabs somente depois que você clica em um botão de leitura em voz alta.",
          "Dados do ranking: nome de exibição, pontuação e sequência são enviados à Supabase somente com consentimento.",
          "Dados de blockchain: o endereço da carteira e os metadados do certificado podem ser públicos e difíceis de apagar.",
        ],
      },
      {
        title: "Por que tratamos os dados",
        items: [
          "Para salvar o progresso e as configurações neste dispositivo.",
          "Para personalizar as respostas educacionais da Mila.",
          "Para ler as respostas em voz alta quando a voz está ativada.",
          "Para exibir o ranking e os certificados educacionais.",
          "Para proteger os endpoints da API, aplicar limites de uso e diagnosticar a configuração.",
        ],
      },
      {
        title: "Base legal e consentimentos",
        items: [
          "Usar o app exige aceitar os termos e as informações de privacidade.",
          "Os recursos externos são opcionais e podem ser ativados ou desativados nas configurações de consentimento.",
          "Retirar o consentimento não afeta o tratamento realizado antes da retirada.",
          "Não pedimos senhas bancárias, números de cartão, documentos de identidade nem dados de login de instituições financeiras.",
        ],
      },
      {
        title: "Seus direitos",
        items: [
          "Você pode apagar os dados locais do app deste dispositivo.",
          "Você pode exportar os dados locais armazenados pelo Coach FI.",
          "Você pode alterar os consentimentos opcionais no rodapé.",
          "A versão de produção deve incluir os dados do controlador, um contato de privacidade e o atendimento a solicitações da LGPD/GDPR.",
        ],
      },
    ],
    providersTitle: "Provedores externos",
    providersText:
      "O app pode se integrar à Anthropic, ElevenLabs, Supabase e Solana Devnet. Antes da produção, confirme com cada provedor as regiões de tratamento, os contratos de tratamento de dados, a retenção e as transferências internacionais.",
  },
  tr: {
    eyebrow: "Gizlilik ve veriler",
    title: "Coach FI Gizlilik Politikası",
    updatedAt: "10 Mayıs 2026",
    notice: "Bu bir MVP taslağıdır ve canlıya alınmadan önce bir avukat tarafından incelenmelidir.",
    blocks: [
      {
        title: "Hangi verileri işliyoruz",
        items: [
          "Yerel veriler: ad veya takma ad, hedef, ilerleme, seri, ses ayarları, dil ve onaylar.",
          "Eğitim formu verileri: finans kontrolüne girilen tutarlar tarayıcıda hesaplanır.",
          "AI verileri: soru metni ve kısa sohbet geçmişi yalnızca onayla AI sağlayıcısına gönderilir.",
          "Ses verileri: kısa metin parçaları yalnızca sesli okuma düğmesine tıkladıktan sonra ElevenLabs'e gönderilir.",
          "Sıralama verileri: görünen ad, puan ve seri yalnızca onayla Supabase'e gönderilir.",
          "Blokzincir verileri: cüzdan adresi ve sertifika meta verileri herkese açık olabilir ve silinmesi zor olabilir.",
        ],
      },
      {
        title: "Verileri neden işliyoruz",
        items: [
          "İlerlemeyi ve ayarları bu cihazda kaydetmek için.",
          "Mila'nın eğitici yanıtlarını kişiselleştirmek için.",
          "Ses açıkken yanıtları sesli okumak için.",
          "Sıralamayı ve eğitim sertifikalarını göstermek için.",
          "API uç noktalarını korumak, hız sınırlarını uygulamak ve yapılandırmayı teşhis etmek için.",
        ],
      },
      {
        title: "Hukuki dayanak ve onaylar",
        items: [
          "Uygulamayı kullanmak, koşulların ve gizlilik bilgilerinin kabul edilmesini gerektirir.",
          "Harici özellikler isteğe bağlıdır ve onay ayarlarından açılıp kapatılabilir.",
          "Onayın geri çekilmesi, geri çekmeden önce yapılan işlemeyi etkilemez.",
          "Banka şifresi, kart numarası, kimlik numarası veya finans kurumu giriş bilgisi istemeyiz.",
        ],
      },
      {
        title: "Hakların",
        items: [
          "Yerel uygulama verilerini bu cihazdan silebilirsin.",
          "Coach FI'ın sakladığı yerel verileri dışa aktarabilirsin.",
          "İsteğe bağlı onayları alt bilgiden değiştirebilirsin.",
          "Canlı sürümde veri sorumlusu bilgileri, gizlilik iletişim adresi ve KVKK/GDPR taleplerinin yönetimi eklenmelidir.",
        ],
      },
    ],
    providersTitle: "Harici sağlayıcılar",
    providersText:
      "Uygulama Anthropic, ElevenLabs, Supabase ve Solana Devnet ile entegre olabilir. Canlıya geçmeden önce her sağlayıcı için işleme bölgelerini, veri işleme sözleşmelerini, saklama sürelerini ve uluslararası aktarımları doğrula.",
  },
};

export default function PrivacyPage() {
  const { locale } = useLanguage();
  const legalLocale = locale === "pl" ? "pl" : "en";
  const copy = pickLocalized(PRIVACY_COPY, legalLocale);
  const publicDetails = getPublicPrivacyConfig();
  const contactCopy = getPrivacyContactCopy(legalLocale);
  const readText = [copy.title, copy.notice, contactCopy.ownerLabel + publicDetails.ownerName, publicDetails.contactEmail ?? contactCopy.pending, ...copy.blocks.map((b) => `${b.title}. ${b.items.join(". ")}`), copy.providersTitle + ". " + copy.providersText].join(". ");

  return (
    <section className="space-y-6" aria-labelledby="privacy-title">
      <div className="focus-card rounded-lg p-6 md:p-8">
        <p className="text-sm font-black uppercase text-primary">{copy.eyebrow}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 id="privacy-title" className="text-3xl font-black text-text">
            {copy.title}
          </h1>
          <VoiceButton text={readText} locale={legalLocale} variant="pill" className="shrink-0" />
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          {copy.updatedAt}. {copy.notice}
        </p>
      </div>

      <section className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft" aria-labelledby="privacy-contact-title">
        <h2 id="privacy-contact-title" className="text-xl font-black text-text">{contactCopy.title}</h2>
        <p className="mt-2 text-sm leading-6">{contactCopy.ownerLabel}{publicDetails.ownerName}</p>
        {publicDetails.contactEmail ? (
          <a className="mt-2 inline-block underline" href={`mailto:${publicDetails.contactEmail}`}>{publicDetails.contactEmail}</a>
        ) : <p role="status" className="mt-2 text-sm leading-6">{contactCopy.pending}</p>}
        {locale !== legalLocale ? <p className="mt-2 text-sm leading-6">{contactCopy.scope}</p> : null}
      </section>

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
