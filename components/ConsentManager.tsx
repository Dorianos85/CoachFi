"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Bot, Database, FileText, ShieldCheck, Trophy, Volume2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_OPTIONAL_CONSENTS, type OptionalConsentKey } from "@/lib/consent";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

const OPTION_ICONS: Record<OptionalConsentKey, typeof Bot> = {
  aiCoach: Bot,
  voice: Volume2,
  leaderboard: Trophy,
  blockchain: Database,
};

type ConsentCopy = {
  close: string;
  eyebrow: string;
  title: string;
  intro: string;
  bannerBody: string;
  reviewSettings: string;
  requiredTitle: string;
  requiredDesc: string;
  terms: string;
  privacy: string;
  optionalTitle: string;
  footer: string;
  requiredHint: string;
  save: string;
  acceptRequired: string;
  acceptAll: string;
  options: Record<OptionalConsentKey, { title: string; description: string }>;
};

const consentCopy: LocalizedMap<ConsentCopy> = {
  en: {
    close: "Close consent settings",
    eyebrow: "Data safety",
    title: "Coach FI terms of use",
    intro: "Minimum data stays on this device. External features are enabled with separate optional consent.",
    bannerBody:
      "You can browse the demo now. Accept the required terms when you want to unlock your full result, save progress or use external integrations.",
    reviewSettings: "Review settings",
    requiredTitle: "I accept the Terms and Privacy Policy",
    requiredDesc: "This consent is required to use the app. Documents are available here:",
    terms: "Terms",
    privacy: "Privacy",
    optionalTitle: "Optional consents",
    footer: "You can change consents in the app footer. Withdrawing consent does not automatically delete data already stored by external providers or on public blockchain.",
    requiredHint: "Select the required consent or choose Accept all.",
    save: "Save settings",
    acceptRequired: "Accept required",
    acceptAll: "Accept all",
    options: {
      aiCoach: {
        title: "AI Coach Mila",
        description: "Send coach chat text and Conversational AI agent context through secure server or widget integrations.",
      },
      voice: {
        title: "ElevenLabs voice",
        description: "Use ElevenLabs for click-to-play speech and the optional voice agent after you start it. Browser voice is used when TTS is unavailable.",
      },
      leaderboard: {
        title: "Global leaderboard",
        description: "Publish display name, score and streak in the Supabase leaderboard.",
      },
      blockchain: {
        title: "Certificates",
        description: "Store wallet address and certificate metadata on public Solana Devnet.",
      },
    },
  },
  pl: {
    close: "Zamknij ustawienia zgód",
    eyebrow: "Bezpieczeństwo danych",
    title: "Zasady korzystania z Coach FI",
    intro: "Minimum danych zostaje na tym urządzeniu. Funkcje zewnętrzne włączasz osobnymi zgodami.",
    bannerBody:
      "Możesz od razu obejrzeć demo. Wymagane zasady akceptujesz wtedy, gdy chcesz odblokować pełny wynik, zapisać postęp albo użyć integracji zewnętrznych.",
    reviewSettings: "Sprawdź ustawienia",
    requiredTitle: "Akceptuję Regulamin i Politykę prywatności",
    requiredDesc: "To jest wymagana zgoda na korzystanie z aplikacji. Dokumenty są dostępne tutaj:",
    terms: "Regulamin",
    privacy: "Prywatność",
    optionalTitle: "Zgody opcjonalne",
    footer: "Możesz zmienić zgody w stopce aplikacji. Wycofanie zgody nie usuwa automatycznie danych zapisanych już u zewnętrznych dostawców lub na publicznym blockchainie.",
    requiredHint: "Zaznacz wymaganą zgodę albo kliknij Akceptuj wszystko.",
    save: "Zapisz ustawienia",
    acceptRequired: "Akceptuj wymagane",
    acceptAll: "Akceptuj wszystko",
    options: {
      aiCoach: {
        title: "AI Coach Mila",
        description: "Wysyłanie tekstu czatu i kontekstu agenta głosowego przez bezpieczny endpoint lub widget.",
      },
      voice: {
        title: "Głos ElevenLabs",
        description: "Odczyt tekstu po kliknięciu i opcjonalny agent głosowy po jego uruchomieniu. Głos przeglądarki działa, gdy TTS jest niedostępny.",
      },
      leaderboard: {
        title: "Ranking globalny",
        description: "Publikacja nazwy wyświetlanej, wyniku i serii w tabeli wyników Supabase.",
      },
      blockchain: {
        title: "Certyfikaty",
        description: "Zapis adresu portfela i metadanych certyfikatu na publicznej sieci Solana Devnet.",
      },
    },
  },
  ja: {
    close: "同意設定を閉じる",
    eyebrow: "データ安全",
    title: "Coach FI 利用規約",
    intro: "最小限のデータはこの端末に残ります。外部機能には個別の同意が必要です。",
    bannerBody: "デモはすぐに閲覧できます。結果の保存や外部連携を使う場合は必須同意を承認してください。",
    reviewSettings: "設定を確認",
    requiredTitle: "利用規約とプライバシーポリシーに同意します",
    requiredDesc: "アプリ利用に必要な同意です。文書はこちら：",
    terms: "規約",
    privacy: "プライバシー",
    optionalTitle: "任意の同意",
    footer: "同意はフッターで変更できます。撤回しても外部サービスや公開ブロックチェーン上の既存データは自動削除されません。",
    requiredHint: "必須同意を選択するか、すべて承認してください。",
    save: "保存",
    acceptRequired: "必須を承認",
    acceptAll: "すべて承認",
    options: {
      aiCoach: { title: "AI コーチ Mila", description: "チャット本文と音声エージェントの文脈を安全なサーバーまたはウィジェット経由で送信します。" },
      voice: { title: "ElevenLabs 音声", description: "クリック後の読み上げと、ユーザーが開始した音声エージェントに ElevenLabs を使います。TTS が使えない場合はブラウザ音声を使います。" },
      leaderboard: { title: "グローバルランキング", description: "表示名、スコア、連続記録を Supabase に公開します。" },
      blockchain: { title: "証明書", description: "ウォレットと証明書メタデータを Solana Devnet に保存します。" },
    },
  },
  es: {
    close: "Cerrar la configuración de consentimientos",
    eyebrow: "Seguridad de los datos",
    title: "Condiciones de uso de Coach FI",
    intro: "Los datos mínimos se quedan en este dispositivo. Las funciones externas se activan con un consentimiento opcional aparte.",
    bannerBody:
      "Ya puedes explorar la demo. Acepta las condiciones obligatorias cuando quieras desbloquear tu resultado completo, guardar tu progreso o usar integraciones externas.",
    reviewSettings: "Revisar ajustes",
    requiredTitle: "Acepto los Términos y la Política de privacidad",
    requiredDesc: "Este consentimiento es necesario para usar la app. Los documentos están disponibles aquí:",
    terms: "Términos",
    privacy: "Privacidad",
    optionalTitle: "Consentimientos opcionales",
    footer: "Puedes cambiar los consentimientos en el pie de la app. Retirar el consentimiento no elimina automáticamente los datos ya almacenados por proveedores externos o en una blockchain pública.",
    requiredHint: "Marca el consentimiento obligatorio o elige Aceptar todo.",
    save: "Guardar ajustes",
    acceptRequired: "Aceptar lo obligatorio",
    acceptAll: "Aceptar todo",
    options: {
      aiCoach: {
        title: "Coach IA Mila",
        description: "Enviar el texto del chat con la coach y el contexto del agente de IA conversacional mediante integraciones seguras de servidor o widget.",
      },
      voice: {
        title: "Voz de ElevenLabs",
        description: "Usar ElevenLabs para la lectura en voz alta al hacer clic y para el agente de voz opcional cuando lo inicies. Se usa la voz del navegador cuando el TTS no está disponible.",
      },
      leaderboard: {
        title: "Clasificación global",
        description: "Publicar el nombre visible, la puntuación y la racha en la clasificación de Supabase.",
      },
      blockchain: {
        title: "Certificados",
        description: "Guardar la dirección del monedero y los metadatos del certificado en la red pública Solana Devnet.",
      },
    },
  },
  fr: {
    close: "Fermer les paramètres de consentement",
    eyebrow: "Sécurité des données",
    title: "Conditions d'utilisation de Coach FI",
    intro: "Le minimum de données reste sur cet appareil. Les fonctions externes sont activées par un consentement facultatif distinct.",
    bannerBody:
      "Vous pouvez parcourir la démo dès maintenant. Acceptez les conditions requises lorsque vous souhaitez débloquer votre résultat complet, enregistrer vos progrès ou utiliser des intégrations externes.",
    reviewSettings: "Revoir les paramètres",
    requiredTitle: "J'accepte les Conditions et la Politique de confidentialité",
    requiredDesc: "Ce consentement est nécessaire pour utiliser l'application. Les documents sont disponibles ici :",
    terms: "Conditions",
    privacy: "Confidentialité",
    optionalTitle: "Consentements facultatifs",
    footer: "Vous pouvez modifier vos consentements dans le pied de page de l'application. Le retrait du consentement ne supprime pas automatiquement les données déjà stockées par des fournisseurs externes ou sur une blockchain publique.",
    requiredHint: "Cochez le consentement requis ou choisissez Tout accepter.",
    save: "Enregistrer les paramètres",
    acceptRequired: "Accepter le nécessaire",
    acceptAll: "Tout accepter",
    options: {
      aiCoach: {
        title: "Coach IA Mila",
        description: "Envoyer le texte du chat avec la coach et le contexte de l'agent d'IA conversationnelle via des intégrations sécurisées (serveur ou widget).",
      },
      voice: {
        title: "Voix ElevenLabs",
        description: "Utiliser ElevenLabs pour la lecture à voix haute au clic et pour l'agent vocal facultatif une fois que vous le lancez. La voix du navigateur est utilisée lorsque la synthèse vocale n'est pas disponible.",
      },
      leaderboard: {
        title: "Classement mondial",
        description: "Publier le nom affiché, le score et la série dans le classement Supabase.",
      },
      blockchain: {
        title: "Certificats",
        description: "Enregistrer l'adresse du portefeuille et les métadonnées du certificat sur le réseau public Solana Devnet.",
      },
    },
  },
  zh: {
    close: "关闭授权设置",
    eyebrow: "数据安全",
    title: "Coach FI 使用条款",
    intro: "最少量的数据保留在本设备上。外部功能需单独的可选授权才会启用。",
    bannerBody:
      "你现在就可以浏览演示。当你想解锁完整结果、保存进度或使用外部集成时，再接受必需条款。",
    reviewSettings: "查看设置",
    requiredTitle: "我接受条款和隐私政策",
    requiredDesc: "使用本应用需要此授权。相关文件见此处：",
    terms: "条款",
    privacy: "隐私",
    optionalTitle: "可选授权",
    footer: "你可以在应用页脚更改授权。撤回授权不会自动删除已由外部服务商或公共区块链存储的数据。",
    requiredHint: "请勾选必需授权，或选择“全部接受”。",
    save: "保存设置",
    acceptRequired: "仅接受必需项",
    acceptAll: "全部接受",
    options: {
      aiCoach: {
        title: "AI 教练 Mila",
        description: "通过安全的服务器或小组件集成，发送教练聊天文本和对话式 AI 智能体的上下文。",
      },
      voice: {
        title: "ElevenLabs 语音",
        description: "使用 ElevenLabs 实现点击朗读，并在你启动后使用可选的语音智能体。TTS 不可用时会使用浏览器语音。",
      },
      leaderboard: {
        title: "全球排行榜",
        description: "在 Supabase 排行榜中公开显示名称、得分和连胜。",
      },
      blockchain: {
        title: "证书",
        description: "在公开的 Solana Devnet 上存储钱包地址和证书元数据。",
      },
    },
  },
  hi: {
    close: "सहमति सेटिंग बंद करें",
    eyebrow: "डेटा सुरक्षा",
    title: "Coach FI उपयोग की शर्तें",
    intro: "कम से कम डेटा इसी डिवाइस पर रहता है। बाहरी सुविधाएं अलग वैकल्पिक सहमति से चालू होती हैं।",
    bannerBody:
      "आप अभी डेमो देख सकते हैं। जब आप अपना पूरा नतीजा अनलॉक करना, प्रगति सहेजना या बाहरी इंटीग्रेशन इस्तेमाल करना चाहें, तब ज़रूरी शर्तें स्वीकार करें।",
    reviewSettings: "सेटिंग देखें",
    requiredTitle: "मैं शर्तें और गोपनीयता नीति स्वीकार करता/करती हूं",
    requiredDesc: "ऐप इस्तेमाल करने के लिए यह सहमति ज़रूरी है। दस्तावेज़ यहां उपलब्ध हैं:",
    terms: "शर्तें",
    privacy: "गोपनीयता",
    optionalTitle: "वैकल्पिक सहमतियां",
    footer: "आप ऐप के फ़ुटर में सहमतियां बदल सकते हैं। सहमति वापस लेने से बाहरी प्रदाताओं या सार्वजनिक ब्लॉकचेन पर पहले से सहेजा गया डेटा अपने आप नहीं हटता।",
    requiredHint: "ज़रूरी सहमति चुनें या सभी स्वीकार करें चुनें।",
    save: "सेटिंग सहेजें",
    acceptRequired: "ज़रूरी स्वीकार करें",
    acceptAll: "सभी स्वीकार करें",
    options: {
      aiCoach: {
        title: "AI कोच Mila",
        description: "कोच चैट का टेक्स्ट और कन्वर्सेशनल AI एजेंट का संदर्भ सुरक्षित सर्वर या विजेट इंटीग्रेशन के ज़रिए भेजें।",
      },
      voice: {
        title: "ElevenLabs आवाज़",
        description: "क्लिक करने पर बोलकर सुनाने के लिए और आपके शुरू करने पर वैकल्पिक वॉइस एजेंट के लिए ElevenLabs का उपयोग करें। TTS उपलब्ध न होने पर ब्राउज़र की आवाज़ इस्तेमाल होती है।",
      },
      leaderboard: {
        title: "ग्लोबल लीडरबोर्ड",
        description: "Supabase लीडरबोर्ड में डिस्प्ले नाम, स्कोर और स्ट्रीक प्रकाशित करें।",
      },
      blockchain: {
        title: "सर्टिफ़िकेट",
        description: "वॉलेट का पता और सर्टिफ़िकेट का मेटाडेटा सार्वजनिक Solana Devnet पर सहेजें।",
      },
    },
  },
  "pt-BR": {
    close: "Fechar as configurações de consentimento",
    eyebrow: "Segurança dos dados",
    title: "Termos de uso do Coach FI",
    intro: "O mínimo de dados fica neste dispositivo. Os recursos externos são ativados com um consentimento opcional separado.",
    bannerBody:
      "Você já pode explorar a demo. Aceite os termos obrigatórios quando quiser desbloquear seu resultado completo, salvar o progresso ou usar integrações externas.",
    reviewSettings: "Revisar configurações",
    requiredTitle: "Aceito os Termos e a Política de Privacidade",
    requiredDesc: "Este consentimento é necessário para usar o app. Os documentos estão disponíveis aqui:",
    terms: "Termos",
    privacy: "Privacidade",
    optionalTitle: "Consentimentos opcionais",
    footer: "Você pode alterar os consentimentos no rodapé do app. Retirar o consentimento não apaga automaticamente os dados já armazenados por provedores externos ou em blockchain pública.",
    requiredHint: "Marque o consentimento obrigatório ou escolha Aceitar tudo.",
    save: "Salvar configurações",
    acceptRequired: "Aceitar o obrigatório",
    acceptAll: "Aceitar tudo",
    options: {
      aiCoach: {
        title: "Coach IA Mila",
        description: "Enviar o texto do chat com a coach e o contexto do agente de IA conversacional por integrações seguras de servidor ou widget.",
      },
      voice: {
        title: "Voz ElevenLabs",
        description: "Usar a ElevenLabs para leitura em voz alta ao clicar e para o agente de voz opcional depois que você o iniciar. A voz do navegador é usada quando o TTS não está disponível.",
      },
      leaderboard: {
        title: "Ranking global",
        description: "Publicar nome de exibição, pontuação e sequência no ranking da Supabase.",
      },
      blockchain: {
        title: "Certificados",
        description: "Armazenar o endereço da carteira e os metadados do certificado na rede pública Solana Devnet.",
      },
    },
  },
  tr: {
    close: "Onay ayarlarını kapat",
    eyebrow: "Veri güvenliği",
    title: "Coach FI kullanım koşulları",
    intro: "Asgari veri bu cihazda kalır. Harici özellikler ayrı, isteğe bağlı onayla etkinleşir.",
    bannerBody:
      "Demoya şimdi göz atabilirsin. Tam sonucunu açmak, ilerlemeni kaydetmek veya harici entegrasyonları kullanmak istediğinde zorunlu koşulları kabul et.",
    reviewSettings: "Ayarları gözden geçir",
    requiredTitle: "Koşulları ve Gizlilik Politikası'nı kabul ediyorum",
    requiredDesc: "Uygulamayı kullanmak için bu onay gereklidir. Belgeler burada:",
    terms: "Koşullar",
    privacy: "Gizlilik",
    optionalTitle: "İsteğe bağlı onaylar",
    footer: "Onayları uygulamanın alt bilgisinden değiştirebilirsin. Onayı geri çekmek, harici sağlayıcılarda veya herkese açık blokzincirde zaten saklanan verileri otomatik olarak silmez.",
    requiredHint: "Zorunlu onayı işaretle veya Tümünü kabul et'i seç.",
    save: "Ayarları kaydet",
    acceptRequired: "Zorunluları kabul et",
    acceptAll: "Tümünü kabul et",
    options: {
      aiCoach: {
        title: "AI Koç Mila",
        description: "Koç sohbet metnini ve Konuşma Yapay Zekâsı ajanının bağlamını güvenli sunucu veya widget entegrasyonlarıyla gönder.",
      },
      voice: {
        title: "ElevenLabs sesi",
        description: "Tıkla-dinle seslendirme ve sen başlattıktan sonra isteğe bağlı sesli ajan için ElevenLabs'i kullan. TTS kullanılamadığında tarayıcı sesi kullanılır.",
      },
      leaderboard: {
        title: "Küresel sıralama",
        description: "Görünen adı, puanı ve seriyi Supabase sıralamasında yayımla.",
      },
      blockchain: {
        title: "Sertifikalar",
        description: "Cüzdan adresini ve sertifika meta verilerini herkese açık Solana Devnet'te sakla.",
      },
    },
  },
};

const optionKeys: OptionalConsentKey[] = ["aiCoach", "voice", "leaderboard", "blockchain"];

export function ConsentManager() {
  const {
    consent,
    loaded,
    requiredAccepted,
    settingsOpen,
    openSettings,
    closeSettings,
    acceptRequired,
    updateOptional,
  } = useConsent();
  const { locale } = useLanguage();
  const copy = pickLocalized(consentCopy, locale);
  const mustShow = loaded && !requiredAccepted;
  const open = settingsOpen;
  const [requiredChecked, setRequiredChecked] = useState(false);
  const [optional, setOptional] = useState(DEFAULT_OPTIONAL_CONSENTS);

  useEffect(() => {
    if (!open) return;
    setRequiredChecked(requiredAccepted);
    setOptional(consent?.optional ?? DEFAULT_OPTIONAL_CONSENTS);
  }, [consent, open, requiredAccepted]);

  const allOptional = useMemo(
    () => ({
      aiCoach: true,
      voice: true,
      leaderboard: true,
      blockchain: true,
    }),
    []
  );

  function toggle(key: OptionalConsentKey) {
    setOptional((current) => ({ ...current, [key]: !current[key] }));
  }

  function saveCurrent() {
    if (!requiredAccepted && !requiredChecked) return;
    if (requiredAccepted) updateOptional(optional);
    else acceptRequired(optional);
  }

  function acceptAll() {
    if (requiredAccepted) updateOptional(allOptional);
    else acceptRequired(allOptional);
  }

  if (!loaded) return null;

  return (
    <AnimatePresence>
      {mustShow && !settingsOpen && (
        <motion.div
          className="fixed inset-x-3 bottom-20 z-[70] mx-auto max-w-4xl lg:bottom-5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
        >
          <section
            role="region"
            aria-label={copy.title}
            className="rounded-lg border border-primary/15 bg-white/96 p-4 text-text shadow-2xl backdrop-blur md:flex md:items-center md:justify-between md:gap-4"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
                <h2 className="mt-1 text-base font-black leading-tight text-text">{copy.title}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-muted">{copy.bannerBody}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row md:mt-0 md:shrink-0">
              <Button type="button" variant="outline" onClick={openSettings} className="w-full sm:w-auto">
                {copy.reviewSettings}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => acceptRequired(DEFAULT_OPTIONAL_CONSENTS)}
                className="w-full sm:w-auto"
              >
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                {copy.acceptRequired}
              </Button>
              <Button type="button" onClick={acceptAll} className="w-full sm:w-auto">
                {copy.acceptAll}
              </Button>
            </div>
          </section>
        </motion.div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-text/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-primary/15 bg-white text-text shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {settingsOpen && (
              <button
                type="button"
                onClick={closeSettings}
                className="absolute right-4 top-4 z-10 rounded-lg p-2 text-muted transition hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={copy.close}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            <div className="shrink-0 border-b border-primary/10 p-4 pr-12 md:p-5 md:pr-14">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
                  <h2 id="consent-title" className="mt-1 text-xl font-black leading-tight text-text md:text-2xl">
                    {copy.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.intro}</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={requiredChecked}
                    disabled={requiredAccepted}
                    onChange={(event) => setRequiredChecked(event.target.checked)}
                    className="mt-1 h-5 w-5 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-black text-text">{copy.requiredTitle}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-muted">
                      {copy.requiredDesc}{" "}
                      <Link href="/terms" className="font-black text-primary underline">
                        {copy.terms}
                      </Link>{" "}
                      /{" "}
                      <Link href="/privacy" className="font-black text-primary underline">
                        {copy.privacy}
                      </Link>
                      .
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-base font-black text-text">{copy.optionalTitle}</h3>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {optionKeys.map((key) => {
                    const Icon = OPTION_ICONS[key];
                    const option = copy.options[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggle(key)}
                        className="rounded-lg border border-primary/12 bg-white p-4 text-left transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="font-black text-text">{option.title}</span>
                              <span
                                className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${
                                  optional[key] ? "bg-grape" : "bg-border"
                                }`}
                                aria-hidden="true"
                              >
                                <span
                                  className={`block h-5 w-5 rounded-full bg-white transition ${
                                    optional[key] ? "translate-x-5" : ""
                                  }`}
                                />
                              </span>
                            </span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-muted">
                              {option.description}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-background p-4 text-xs font-semibold leading-5 text-muted">
                {copy.footer}
              </div>
            </div>

            <div className="shrink-0 border-t border-primary/10 bg-white p-3 md:p-4">
              {!requiredAccepted && !requiredChecked && (
                <p className="mb-2 text-xs font-semibold leading-5 text-muted">{copy.requiredHint}</p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveCurrent}
                  disabled={!requiredAccepted && !requiredChecked}
                  className="w-full sm:w-auto"
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  {requiredAccepted ? copy.save : copy.acceptRequired}
                </Button>
                <Button type="button" onClick={acceptAll} className="w-full sm:w-auto">
                  {copy.acceptAll}
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
