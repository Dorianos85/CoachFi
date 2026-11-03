"use client";

import { VoiceButton } from "@/components/VoiceButton";
import { DataSafetyPanel } from "@/components/DataSafetyPanel";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

type PrivacyCopy = {
  eyebrow: string;
  title: string;
  /** Visible "draft" label until the text has been reviewed by a lawyer. */
  draftBadge?: string;
  updatedAt: string;
  notice: string;
  blocks: Array<{ title: string; items: string[] }>;
  providersTitle: string;
  providersText: string;
};

const FALLBACK_BADGE = "Draft — pending legal review";

const PRIVACY_COPY: LocalizedMap<PrivacyCopy> = {
  en: {
    eyebrow: "Privacy and data",
    title: "CoachfiAI Privacy Policy",
    draftBadge: "Draft — pending legal review",
    updatedAt: "Last updated November 3, 2026",
    notice:
      "This is a beta draft. It describes what the app actually does today, but it has not been reviewed by a lawyer yet. Items in [brackets] are still to be completed.",
    blocks: [
      {
        title: "Who we are",
        items: [
          "CoachfiAI is operated by [Company name, address — to be completed] (\"we\", \"us\").",
          "Privacy questions and requests: [privacy contact email — to be completed].",
        ],
      },
      {
        title: "Data stored on your device",
        items: [
          "Your name or nickname, goal, lesson progress, streak, points, review cards, settings, language and consent choices are saved in your browser's storage.",
          "Health Check answers (income, expenses, savings, debt, cash, your goal) and your score are calculated in your browser and saved on this device.",
          "You can export or delete this data at any time in the data panel on this page.",
        ],
      },
      {
        title: "Data sent to our service providers",
        items: [
          "Account (if you sign in): sign-in by email is handled by Coinbase Developer Platform, which also creates an embedded wallet for you. We store your email, display name and wallet addresses with your account in our database (Supabase).",
          "Health Check (if you're signed in): your answers — income, expenses, savings, debt, cash and goal — and your score are saved to your account in Supabase so you can see your progress on other devices.",
          "Progress sync (if you're signed in): lesson progress, streaks, review cards, points, certificates and your consent history are saved in Supabase.",
          "AI chat (only with the AI coach consent on): the text you type and up to six recent messages are sent to Anthropic to generate Mila's reply. If Anthropic is unavailable, the same text may be sent through OpenRouter, which passes it to another AI model provider.",
          "Voice conversations (only with the AI coach and voice consents on): when you talk to Mila, your microphone audio and the conversation transcript are streamed to ElevenLabs to run the conversation. [ElevenLabs retention period — to be confirmed in the ElevenLabs settings.]",
          "Read-aloud: when you use a read-aloud button, that text is sent to ElevenLabs to create audio.",
          "Leaderboard (only if you opt in): your display name, score and streak are saved in Supabase and shown to other users.",
          "Certificates (only if you opt in): your wallet address and certificate details are written to a public Solana test network. Blockchain records can be public and permanent.",
          "Hosting and security: the app runs on Vercel, which processes technical data such as IP address, browser type and request logs. Upstash (Redis) may be used to count beta invite codes; it stores codes and counters, not your answers.",
        ],
      },
      {
        title: "What we don't do",
        items: [
          "We don't sell your personal information, and we don't share it for cross-context behavioral (targeted) advertising.",
          "We don't show ads.",
          "We never ask for bank passwords, card numbers, Social Security numbers or bank logins. Please don't type them into the chat.",
        ],
      },
      {
        title: "Why we use data",
        items: [
          "To run the app, save your progress and sync it across your devices.",
          "To generate Mila's educational replies and voice.",
          "To show the leaderboard and certificates if you opt in.",
          "To keep the service secure, prevent abuse (for example with rate limits) and fix errors.",
        ],
      },
      {
        title: "How long we keep it",
        items: [
          "On your device: until you delete it or clear your browser data.",
          "Account data in Supabase: while your account is active, and deleted within [retention period — to be completed] after you ask us to delete your account.",
          "AI and voice providers keep data according to their own retention settings: [Anthropic, OpenRouter and ElevenLabs retention — to be confirmed].",
          "Data written to a blockchain can't be deleted.",
        ],
      },
      {
        title: "Your choices and rights",
        items: [
          "Turn AI, voice, leaderboard and certificate features on or off at any time in the consent settings (footer).",
          "Export or delete the data on this device with the data panel on this page.",
          "Ask for a copy of your account data, or ask us to correct or delete it, by emailing [privacy contact email — to be completed].",
          "U.S. residents: depending on your state (for example California under the CCPA/CPRA), you may have the right to know what personal information we collect, to access, correct and delete it, and to opt out of its sale or sharing. We don't sell or share personal information. You can use an authorized agent, and we won't treat you differently for using your rights.",
          "Users in the EU, EEA or UK (including Poland): under the GDPR you can access, correct, delete, restrict or port your data, object to processing and withdraw consent at any time. You can also complain to your data protection authority (in Poland: UODO).",
        ],
      },
      {
        title: "Children and Kids Mode",
        items: [
          "Kids Mode is meant to be set up and used by a parent or guardian together with their child. It has no wallet, no leaderboard and no ads.",
          "Mila's voice assistant and AI chat stay available in Kids Mode. If a child talks or types to Mila, their voice and words are processed by ElevenLabs and our AI providers in the same way as for adults.",
          "A parent or guardian should decide whether to keep AI and voice on, and can turn them off in the consent settings. Children shouldn't create an account or enter personal information.",
          "[Parental consent process for children under 13 (COPPA) — to be completed after legal review.] If you think a child gave us personal information, contact [privacy contact email — to be completed] and we'll delete it.",
        ],
      },
      {
        title: "Transfers and changes",
        items: [
          "Our providers may process data in the United States and other countries.",
          "If we change this policy, we'll update the date at the top and, for important changes, tell you in the app.",
        ],
      },
    ],
    providersTitle: "Service providers",
    providersText:
      "Supabase (database), Coinbase Developer Platform (sign-in and embedded wallets), Anthropic (AI chat), OpenRouter (AI chat fallback), ElevenLabs (voice conversations and read-aloud), Vercel (hosting), Upstash (beta invite-code counters) and the Solana test network (public certificates). [Data processing agreements, processing regions and retention for each provider — to be confirmed.]",
  },
  pl: {
    eyebrow: "Prywatność i dane",
    title: "Polityka prywatności Coach FI",
    draftBadge: "Wersja robocza — czeka na weryfikację prawną",
    updatedAt: "Aktualizacja: 3 listopada 2026",
    notice: "Ten dokument jest roboczym wzorem dla MVP i powinien zostać sprawdzony przez prawnika przed produkcyjnym wdrożeniem.",
    blocks: [
      {
        title: "Jakie dane przetwarzamy",
        items: [
          "Dane lokalne: imię lub pseudonim, cel finansowy, postępy, seria, ustawienia głosu, język i zgody.",
          "Diagnoza finansowa: kwoty (dochód, wydatki, oszczędności, dług, gotówka, cel) i wynik są liczone w przeglądarce, a po zalogowaniu zapisywane na Twoim koncie w bazie danych (Supabase).",
          "Konto i synchronizacja (po zalogowaniu): logowanie e-mailem obsługuje Coinbase Developer Platform, który tworzy też portfel. W Supabase zapisujemy e-mail, nazwę, adresy portfela, postępy, serie, punkty, certyfikaty i historię zgód.",
          "Czat AI (tylko ze zgodą na AI): treść pytania i do sześciu ostatnich wiadomości trafiają do Anthropic, a gdy Anthropic jest niedostępny — przez OpenRouter do innego dostawcy modelu.",
          "Rozmowa głosowa (tylko ze zgodą na AI i głos): dźwięk z mikrofonu i transkrypcja rozmowy są przesyłane do ElevenLabs. Odczyt na głos: tekst z ekranu trafia do ElevenLabs po kliknięciu przycisku odczytu.",
          "Hosting: aplikacja działa na Vercel (adres IP, typ przeglądarki, logi). Upstash (Redis) może liczyć kody zaproszeń do bety.",
          "Ranking: nazwa wyświetlana, wynik i seria są wysyłane do Supabase tylko po wyrażeniu zgody.",
          "Blockchain: adres portfela i metadane certyfikatu mogą być publiczne i trudne do usunięcia.",
        ],
      },
      {
        title: "Po co przetwarzamy dane",
        items: [
          "Aby zapisać postępy i ustawienia aplikacji na tym urządzeniu.",
          "Aby personalizować edukacyjne odpowiedzi Mili.",
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
          "Na podstawie RODO masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia, sprzeciwu i wycofania zgody, a także prawo skargi do Prezesa UODO.",
          "Administrator: [Nazwa firmy, adres — do uzupełnienia]. Kontakt w sprawach prywatności: [e-mail — do uzupełnienia].",
          "Tryb dla dzieci: asystent głosowy i czat z Milą działają także w trybie dla dzieci. Jeśli dziecko rozmawia z Milą, jego głos i wypowiedzi przetwarzają ElevenLabs i dostawcy AI tak jak w przypadku dorosłych. Rodzic lub opiekun może wyłączyć AI i głos w ustawieniach zgód.",
        ],
      },
    ],
    providersTitle: "Dostawcy zewnętrzni",
    providersText:
      "Supabase (baza danych), Coinbase Developer Platform (logowanie i portfele), Anthropic (czat AI), OpenRouter (zapasowy czat AI), ElevenLabs (rozmowy głosowe i odczyt), Vercel (hosting), Upstash (liczniki kodów zaproszeń) i sieć testowa Solana (publiczne certyfikaty). [Umowy powierzenia, regiony przetwarzania i okresy retencji — do potwierdzenia.] Nie sprzedajemy danych osobowych i nie wyświetlamy reklam.",
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
    title: "Política de privacidad de CoachfiAI",
    draftBadge: "Borrador — pendiente de revisión legal",
    updatedAt: "Última actualización: 3 de noviembre de 2026",
    notice:
      "Este es un borrador de la beta. Describe lo que la app hace hoy, pero todavía no lo ha revisado un abogado. Lo que aparece entre [corchetes] está pendiente de completar.",
    blocks: [
      {
        title: "Quiénes somos",
        items: [
          "CoachfiAI está operada por [Nombre de la empresa, dirección — pendiente de completar] («nosotros»).",
          "Preguntas y solicitudes de privacidad: [correo de contacto de privacidad — pendiente de completar].",
        ],
      },
      {
        title: "Datos guardados en tu dispositivo",
        items: [
          "Tu nombre o apodo, tu meta, el progreso de las lecciones, la racha, los puntos, las tarjetas de repaso, los ajustes, el idioma y tus consentimientos se guardan en el almacenamiento de tu navegador.",
          "Las respuestas del Chequeo de salud financiera (ingresos, gastos, ahorros, deudas, efectivo, tu meta) y tu puntuación se calculan en tu navegador y se guardan en este dispositivo.",
          "Puedes exportar o borrar estos datos cuando quieras en el panel de datos de esta página.",
        ],
      },
      {
        title: "Datos que enviamos a nuestros proveedores",
        items: [
          "Cuenta (si inicias sesión): el inicio de sesión por correo lo gestiona Coinbase Developer Platform, que también crea una billetera integrada para ti. Guardamos tu correo, tu nombre visible y las direcciones de tu billetera con tu cuenta en nuestra base de datos (Supabase).",
          "Chequeo de salud financiera (si iniciaste sesión): tus respuestas —ingresos, gastos, ahorros, deudas, efectivo y meta— y tu puntuación se guardan en tu cuenta en Supabase para que veas tu progreso en otros dispositivos.",
          "Sincronización del progreso (si iniciaste sesión): el progreso de las lecciones, las rachas, las tarjetas de repaso, los puntos, los certificados y tu historial de consentimientos se guardan en Supabase.",
          "Chat con IA (solo con el consentimiento del coach de IA activado): el texto que escribes y hasta seis mensajes recientes se envían a Anthropic para generar la respuesta de Mila. Si Anthropic no está disponible, el mismo texto puede enviarse a través de OpenRouter, que lo pasa a otro proveedor de modelos de IA.",
          "Conversaciones de voz (solo con los consentimientos de coach de IA y de voz activados): cuando hablas con Mila, el audio de tu micrófono y la transcripción se transmiten a ElevenLabs para mantener la conversación. [Plazo de conservación de ElevenLabs — pendiente de confirmar en su configuración.]",
          "Lectura en voz alta: cuando usas un botón de lectura, ese texto se envía a ElevenLabs para crear el audio.",
          "Clasificación (solo si la activas): tu nombre visible, tu puntuación y tu racha se guardan en Supabase y otros usuarios pueden verlos.",
          "Certificados (solo si los activas): la dirección de tu billetera y los datos del certificado se escriben en una red de prueba pública de Solana. Los registros en blockchain pueden ser públicos y permanentes.",
          "Alojamiento y seguridad: la app funciona en Vercel, que procesa datos técnicos como la dirección IP, el tipo de navegador y los registros de solicitudes. Upstash (Redis) puede usarse para contar códigos de invitación de la beta; guarda códigos y contadores, no tus respuestas.",
        ],
      },
      {
        title: "Lo que no hacemos",
        items: [
          "No vendemos tu información personal ni la compartimos para publicidad dirigida.",
          "No mostramos anuncios.",
          "Nunca te pedimos contraseñas del banco, números de tarjeta, números de Seguro Social ni accesos a tu banco. Por favor, no los escribas en el chat.",
        ],
      },
      {
        title: "Para qué usamos los datos",
        items: [
          "Para que la app funcione, guardar tu progreso y sincronizarlo entre tus dispositivos.",
          "Para generar las respuestas educativas y la voz de Mila.",
          "Para mostrar la clasificación y los certificados si los activas.",
          "Para mantener el servicio seguro, evitar abusos (por ejemplo, con límites de uso) y corregir errores.",
        ],
      },
      {
        title: "Cuánto tiempo los guardamos",
        items: [
          "En tu dispositivo: hasta que los borres o limpies los datos del navegador.",
          "Datos de la cuenta en Supabase: mientras tu cuenta esté activa, y se borran en un plazo de [plazo — pendiente de completar] después de que nos pidas eliminar tu cuenta.",
          "Los proveedores de IA y voz conservan los datos según su propia configuración: [conservación de Anthropic, OpenRouter y ElevenLabs — pendiente de confirmar].",
          "Los datos escritos en una blockchain no se pueden borrar.",
        ],
      },
      {
        title: "Tus opciones y derechos",
        items: [
          "Activa o desactiva cuando quieras la IA, la voz, la clasificación y los certificados en la configuración de consentimientos (pie de página).",
          "Exporta o borra los datos de este dispositivo con el panel de datos de esta página.",
          "Pide una copia de los datos de tu cuenta, o que los corrijamos o borremos, escribiendo a [correo de contacto de privacidad — pendiente de completar].",
          "Residentes de EE. UU.: según tu estado (por ejemplo, California con la CCPA/CPRA), puedes tener derecho a saber qué información personal recopilamos, a acceder a ella, corregirla y borrarla, y a excluirte de su venta o intercambio. No vendemos ni compartimos información personal. Puedes usar un agente autorizado y no te trataremos de forma distinta por ejercer tus derechos.",
          "Usuarios de la UE, el EEE o el Reino Unido: según el RGPD puedes acceder a tus datos, corregirlos, borrarlos, limitar su uso o llevártelos, oponerte al tratamiento y retirar tu consentimiento en cualquier momento. También puedes reclamar ante tu autoridad de protección de datos.",
        ],
      },
      {
        title: "Niños y Modo niños",
        items: [
          "El Modo niños está pensado para que lo configure y use un padre, madre o tutor junto con su hijo o hija. No tiene billetera, clasificación ni anuncios.",
          "El asistente de voz de Mila y el chat con IA siguen disponibles en el Modo niños. Si un niño habla o escribe a Mila, su voz y sus palabras las procesan ElevenLabs y nuestros proveedores de IA igual que las de un adulto.",
          "El padre, la madre o el tutor debe decidir si mantiene activadas la IA y la voz, y puede desactivarlas en la configuración de consentimientos. Los niños no deben crear una cuenta ni escribir información personal.",
          "[Proceso de consentimiento parental para menores de 13 años (COPPA) — pendiente de completar tras la revisión legal.] Si crees que un niño nos dio información personal, escríbenos a [correo de contacto de privacidad — pendiente de completar] y la borraremos.",
        ],
      },
      {
        title: "Transferencias y cambios",
        items: [
          "Nuestros proveedores pueden tratar datos en Estados Unidos y en otros países.",
          "Si cambiamos esta política, actualizaremos la fecha de arriba y, si el cambio es importante, te avisaremos en la app.",
        ],
      },
    ],
    providersTitle: "Proveedores de servicios",
    providersText:
      "Supabase (base de datos), Coinbase Developer Platform (inicio de sesión y billeteras integradas), Anthropic (chat con IA), OpenRouter (respaldo del chat con IA), ElevenLabs (conversaciones de voz y lectura en voz alta), Vercel (alojamiento), Upstash (contadores de códigos de invitación de la beta) y la red de prueba de Solana (certificados públicos). [Acuerdos de tratamiento de datos, regiones y conservación de cada proveedor — pendientes de confirmar.]",
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
  const copy = pickLocalized(PRIVACY_COPY, locale);
  const readText = [copy.title, ...copy.blocks.map((b) => `${b.title}. ${b.items.join(". ")}`), copy.providersTitle + ". " + copy.providersText].join(". ");

  return (
    <section className="space-y-6" aria-labelledby="privacy-title">
      <div className="focus-card rounded-lg p-6 md:p-8">
        <p className="mb-3 inline-flex items-center rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-black uppercase text-warning" data-testid="legal-draft-badge">
          {copy.draftBadge ?? FALLBACK_BADGE}
        </p>
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
