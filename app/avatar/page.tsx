"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, User, Volume2 } from "lucide-react";

import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useVoice } from "@/context/VoiceContext";
import { AVATAR_STYLES, type AvatarGender, type AvatarStyle, getAvatar, saveAvatar } from "@/lib/avatar";
import { useProductStorage } from "@/lib/use-product-storage";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const AVATAR_COPY: LocalizedMap<
  {
    eyebrow: string;
    title: string;
    description: string;
    readText: string;
    livePreview: string;
    save: string;
    saved: string;
    chooseCharacter: string;
    female: string;
    male: string;
    archetype: string;
    milaVoice: string;
    voiceDescription: string;
    poweredBy: string;
    preview: string;
    stopPreview: string;
    testVoiceText: string;
  }
> = {
  en: {
    eyebrow: "Personalization",
    title: "Your Financial Avatar",
    description: "Choose your character, build your financial shield and meet your AI coach Mila.",
    readText: "Create your personalized financial avatar and hear Mila's voice.",
    livePreview: "Appearance preview",
    save: "Save avatar",
    saved: "Saved!",
    chooseCharacter: "Choose character",
    female: "Female",
    male: "Male",
    archetype: "Financial archetype",
    milaVoice: "Mila's Voice",
    voiceDescription:
      "Mila uses the same voice for her introduction, lessons and conversations. If audio is unavailable, you can continue with text.",
    poweredBy: "Powered by ElevenLabs",
    preview: "Preview voice",
    stopPreview: "Stop preview",
    testVoiceText: "Hello! I'm Mila, your financial coach. Together we'll build lasting money habits.",
  },
  pl: {
    eyebrow: "Personalizacja",
    title: "Twój finansowy avatar",
    description: "Wybierz postać, zbuduj tarczę finansową i poznaj coachkę AI Milę.",
    readText: "Stwórz swój finansowy avatar i posłuchaj głosu Mili.",
    livePreview: "Podgląd wyglądu",
    save: "Zapisz avatar",
    saved: "Zapisano!",
    chooseCharacter: "Wybierz postać",
    female: "Kobieta",
    male: "Mężczyzna",
    archetype: "Archetyp finansowy",
    milaVoice: "Głos Mili",
    voiceDescription:
      "Mila używa tego samego głosu w powitaniu, lekcjach i rozmowach. Gdy dźwięk jest niedostępny, możesz kontynuować tekstowo.",
    poweredBy: "Powered by ElevenLabs",
    preview: "Odsłuchaj głos",
    stopPreview: "Zatrzymaj podgląd",
    testVoiceText: "Cześć! Jestem Mila, Twoja coachka finansowa. Razem zbudujemy trwałe nawyki finansowe.",
  },
  ja: {
    eyebrow: "パーソナライズ",
    title: "あなたの金融アバター",
    description: "キャラクターと金融シールドを選んで、AI コーチの Mila と出会いましょう。",
    readText: "金融アバターを作成し、Mila の声を聞きます。",
    livePreview: "ライブプレビュー",
    save: "保存",
    saved: "保存しました",
    chooseCharacter: "キャラクターを選択",
    female: "女性",
    male: "男性",
    archetype: "金融タイプ",
    milaVoice: "Mila の声",
    voiceDescription: "Mila は挨拶、レッスン、会話で同じ声を使います。音声が利用できない場合はテキストで続けられます。",
    poweredBy: "ElevenLabs 提供",
    preview: "声を試す",
    stopPreview: "停止",
    testVoiceText: "こんにちは、Mila です。あなたの金融コーチとして、長く続くお金の習慣を一緒に作ります。",
  },
  es: {
    eyebrow: "Personalización",
    title: "Tu avatar financiero",
    description: "Elige tu personaje, construye tu escudo financiero y conoce a tu coach de IA Mila.",
    readText: "Crea tu avatar financiero personalizado y escucha la voz de Mila.",
    livePreview: "Vista previa en vivo",
    save: "Guardar avatar",
    saved: "¡Guardado!",
    chooseCharacter: "Elige personaje",
    female: "Mujer",
    male: "Hombre",
    archetype: "Arquetipo financiero",
    milaVoice: "La voz de Mila",
    voiceDescription:
      "Mila usa la misma voz para su presentación, las lecciones y las conversaciones. Si el audio no está disponible, puedes continuar con texto.",
    poweredBy: "Con tecnología de ElevenLabs",
    preview: "Escuchar la voz",
    stopPreview: "Detener",
    testVoiceText: "¡Hola! Soy Mila, tu coach financiera. Juntos crearemos hábitos de dinero duraderos.",
  },
  fr: {
    eyebrow: "Personnalisation",
    title: "Votre avatar financier",
    description: "Choisissez votre personnage, construisez votre bouclier financier et rencontrez votre coach IA Mila.",
    readText: "Créez votre avatar financier personnalisé et écoutez la voix de Mila.",
    livePreview: "Aperçu en direct",
    save: "Enregistrer l'avatar",
    saved: "Enregistré !",
    chooseCharacter: "Choisir un personnage",
    female: "Femme",
    male: "Homme",
    archetype: "Archétype financier",
    milaVoice: "La voix de Mila",
    voiceDescription:
      "Mila utilise la même voix pour sa présentation, les leçons et les conversations. Si l'audio n'est pas disponible, vous pouvez continuer en texte.",
    poweredBy: "Propulsé par ElevenLabs",
    preview: "Écouter la voix",
    stopPreview: "Arrêter",
    testVoiceText: "Bonjour ! Je suis Mila, votre coach financière. Ensemble, nous allons construire des habitudes d'argent durables.",
  },
  zh: {
    eyebrow: "个性化",
    title: "你的理财头像",
    description: "选择你的角色，打造你的财务护盾，认识你的 AI 教练 Mila。",
    readText: "创建你的个性化理财头像，听听 Mila 的声音。",
    livePreview: "实时预览",
    save: "保存头像",
    saved: "已保存！",
    chooseCharacter: "选择角色",
    female: "女性",
    male: "男性",
    archetype: "理财原型",
    milaVoice: "Mila 的声音",
    voiceDescription:
      "Mila 在自我介绍、课程和对话中使用同一种声音。如果音频不可用，你可以继续使用文字。",
    poweredBy: "由 ElevenLabs 提供支持",
    preview: "试听声音",
    stopPreview: "停止试听",
    testVoiceText: "你好！我是 Mila，你的财务教练。我们一起养成持久的理财习惯。",
  },
  hi: {
    eyebrow: "निजीकरण",
    title: "आपका वित्तीय अवतार",
    description: "अपना किरदार चुनें, अपनी वित्तीय ढाल बनाएं और अपनी AI कोच Mila से मिलें।",
    readText: "अपना निजी वित्तीय अवतार बनाएं और Mila की आवाज़ सुनें।",
    livePreview: "लाइव प्रीव्यू",
    save: "अवतार सहेजें",
    saved: "सहेजा गया!",
    chooseCharacter: "किरदार चुनें",
    female: "महिला",
    male: "पुरुष",
    archetype: "वित्तीय आर्कटाइप",
    milaVoice: "Mila की आवाज़",
    voiceDescription:
      "Mila अपने परिचय, पाठों और बातचीत में एक ही आवाज़ का उपयोग करती है। अगर ऑडियो उपलब्ध नहीं है, तो आप टेक्स्ट के साथ जारी रख सकते हैं।",
    poweredBy: "ElevenLabs द्वारा संचालित",
    preview: "आवाज़ सुनें",
    stopPreview: "रोकें",
    testVoiceText: "नमस्ते! मैं Mila हूं, आपकी वित्तीय कोच। हम साथ मिलकर पैसे की टिकाऊ आदतें बनाएंगे।",
  },
  "pt-BR": {
    eyebrow: "Personalização",
    title: "Seu avatar financeiro",
    description: "Escolha seu personagem, construa seu escudo financeiro e conheça a sua coach de IA Mila.",
    readText: "Crie seu avatar financeiro personalizado e ouça a voz da Mila.",
    livePreview: "Prévia ao vivo",
    save: "Salvar avatar",
    saved: "Salvo!",
    chooseCharacter: "Escolha o personagem",
    female: "Feminino",
    male: "Masculino",
    archetype: "Arquétipo financeiro",
    milaVoice: "A voz da Mila",
    voiceDescription:
      "A Mila usa a mesma voz na apresentação, nas aulas e nas conversas. Se o áudio não estiver disponível, você pode continuar por texto.",
    poweredBy: "Com tecnologia ElevenLabs",
    preview: "Ouvir a voz",
    stopPreview: "Parar",
    testVoiceText: "Olá! Eu sou a Mila, sua coach financeira. Juntos vamos criar hábitos financeiros duradouros.",
  },
  tr: {
    eyebrow: "Kişiselleştirme",
    title: "Finansal avatarın",
    description: "Karakterini seç, finansal kalkanını kur ve AI koçun Mila ile tanış.",
    readText: "Kişiselleştirilmiş finansal avatarını oluştur ve Mila'nın sesini dinle.",
    livePreview: "Canlı önizleme",
    save: "Avatarı kaydet",
    saved: "Kaydedildi!",
    chooseCharacter: "Karakter seç",
    female: "Kadın",
    male: "Erkek",
    archetype: "Finansal arketip",
    milaVoice: "Mila'nın sesi",
    voiceDescription:
      "Mila tanıtımında, derslerde ve konuşmalarda aynı sesi kullanır. Ses kullanılamıyorsa metinle devam edebilirsin.",
    poweredBy: "ElevenLabs altyapısıyla",
    preview: "Sesi dinle",
    stopPreview: "Durdur",
    testVoiceText: "Merhaba! Ben Mila, finans koçunum. Birlikte kalıcı para alışkanlıkları kuracağız.",
  },
};

const STYLE_COPY: LocalizedMap<Record<AvatarStyle, { title: string; desc: string }>> = {
  en: {
    warrior: { title: "Warrior", desc: "Fights debt head-on, disciplined and determined." },
    explorer: { title: "Explorer", desc: "Curious investor, discovers new opportunities." },
    builder: { title: "Builder", desc: "Methodical, builds wealth brick by brick." },
  },
  pl: {
    warrior: { title: "Wojownik", desc: "Walczysz z długiem wprost, z dyscypliną i determinacją." },
    explorer: { title: "Badacz", desc: "Ciekawy inwestor, który odkrywa nowe możliwości." },
    builder: { title: "Budowniczy", desc: "Metodycznie budujesz majątek krok po kroku." },
  },
  ja: {
    warrior: { title: "戦士", desc: "負債に正面から向き合うタイプ。" },
    explorer: { title: "探検家", desc: "新しい機会を探す好奇心型。" },
    builder: { title: "ビルダー", desc: "一歩ずつ資産を作るタイプ。" },
  },
  es: {
    warrior: { title: "Guerrero", desc: "Se enfrenta a la deuda de frente, con disciplina y determinación." },
    explorer: { title: "Explorador", desc: "Inversor curioso que descubre nuevas oportunidades." },
    builder: { title: "Constructor", desc: "Metódico: construye su patrimonio ladrillo a ladrillo." },
  },
  fr: {
    warrior: { title: "Guerrier", desc: "Affronte la dette de face, avec discipline et détermination." },
    explorer: { title: "Explorateur", desc: "Investisseur curieux, découvre de nouvelles opportunités." },
    builder: { title: "Bâtisseur", desc: "Méthodique, construit son patrimoine brique après brique." },
  },
  zh: {
    warrior: { title: "战士", desc: "直面债务，自律而坚定。" },
    explorer: { title: "探索者", desc: "充满好奇的投资者，善于发现新机会。" },
    builder: { title: "建设者", desc: "有条不紊，一砖一瓦地积累财富。" },
  },
  hi: {
    warrior: { title: "योद्धा", desc: "कर्ज़ से सीधे लड़ता है, अनुशासित और दृढ़।" },
    explorer: { title: "खोजी", desc: "जिज्ञासु निवेशक, नए अवसर खोजता है।" },
    builder: { title: "निर्माता", desc: "व्यवस्थित, ईंट-दर-ईंट संपत्ति बनाता है।" },
  },
  "pt-BR": {
    warrior: { title: "Guerreiro", desc: "Enfrenta as dívidas de frente, com disciplina e determinação." },
    explorer: { title: "Explorador", desc: "Investidor curioso, descobre novas oportunidades." },
    builder: { title: "Construtor", desc: "Metódico, constrói patrimônio tijolo por tijolo." },
  },
  tr: {
    warrior: { title: "Savaşçı", desc: "Borçla doğrudan mücadele eder; disiplinli ve kararlıdır." },
    explorer: { title: "Kâşif", desc: "Meraklı yatırımcı, yeni fırsatlar keşfeder." },
    builder: { title: "Kurucu", desc: "Yöntemlidir; serveti tuğla tuğla inşa eder." },
  },
};

export default function AvatarPage() {
  const { locale } = useLanguage();
  const copy = pickLocalized(AVATAR_COPY, locale);
  const styleCopy = pickLocalized(STYLE_COPY, locale);
  const { storage } = useProductStorage();
  const [saveFailed, setSaveFailed] = useState(false);
  const [gender, setGender] = useState<AvatarGender>("female");
  const [style, setStyle] = useState<AvatarStyle>("warrior");
  const [saved, setSaved] = useState(false);
  const { isPlaying, speak, stop } = useVoice();

  useEffect(() => {
    const storedAvatar = getAvatar(storage);
    setGender(storedAvatar.gender);
    setStyle(storedAvatar.style);
    setSaved(false); setSaveFailed(false);
  }, [storage]);

  function handleSave() {
    if (!storage.isCurrent()) return;
    try { saveAvatar({ gender, style }, storage); }
    catch { if (storage.isCurrent()) setSaveFailed(true); return; }
    if (!storage.isCurrent()) return;
    setSaveFailed(false);
    setSaved(true);
    setTimeout(() => { if (storage.isCurrent()) setSaved(false); }, 2000);
  }

  return (
    <section aria-labelledby="avatar-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {/* Profile card — replaces cartoon avatar */}
          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <p className="mb-4 text-sm font-black text-text">{copy.livePreview}</p>
            <div className="flex flex-col items-center gap-4">
              {/* Avatar icon */}
              <div
                className="relative grid h-24 w-24 place-items-center rounded-2xl shadow-glow"
                style={{
                  background: style === "warrior"
                    ? "var(--cf-area-mila)"
                    : style === "explorer"
                    ? "var(--cf-area-progress)"
                    : "var(--cf-area-rewards)",
                }}
              >
                <User className="h-12 w-12 text-text" aria-hidden="true" />
                <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-base shadow-sm">
                  {gender === "female" ? "👩" : "👨"}
                </span>
              </div>

              {/* Archetype badge */}
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-muted">
                  {styleCopy[style].title}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {styleCopy[style].desc}
                </p>
              </div>

            </div>
          </div>

          {saveFailed ? <p role="alert" className="text-sm text-attention">{locale === "pl" ? "Nie udało się zapisać danych lokalnych. Spróbuj ponownie." : "Local data could not be saved. Please try again."}</p> : null}
          <Button type="button" size="lg" className="w-full gap-2" onClick={handleSave}>
            {saved ? (
              <>
                <Check className="h-5 w-5" />
                {copy.saved}
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                {copy.save}
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <h2 className="mb-3 text-base font-black text-text">{copy.chooseCharacter}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "female" as const, label: copy.female },
                { id: "male" as const, label: copy.male },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGender(item.id)}
                  className={cn(
                    "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition",
                    gender === item.id ? "border-primary bg-primary/5" : "border-primary/10 hover:border-primary/30"
                  )}
                >
                  <span className="text-sm font-black text-text">{item.label}</span>
                  {gender === item.id && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <h2 className="mb-3 text-base font-black text-text">{copy.archetype}</h2>
            <div className="grid gap-3">
              {AVATAR_STYLES.map((avatarStyle) => {
                const styleText = styleCopy[avatarStyle.id];
                return (
                  <motion.button
                    key={avatarStyle.id}
                    type="button"
                    onClick={() => setStyle(avatarStyle.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border-2 p-4 text-left transition",
                      style === avatarStyle.id
                        ? "border-primary bg-primary/5"
                        : "border-primary/10 hover:border-primary/30"
                    )}
                  >
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${avatarStyle.from}, ${avatarStyle.to})` }}
                    >
                      {avatarStyle.emoji}
                    </span>
                    <div className="flex-1">
                      <p className="font-black text-text">{styleText.title}</p>
                      <p className="text-xs font-semibold text-muted">{styleText.desc}</p>
                    </div>
                    {style === avatarStyle.id && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-text">{copy.milaVoice}</h2>
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary-border bg-white px-3 py-1 text-[10px] font-black text-text transition hover:bg-primary/10"
                aria-label={copy.poweredBy}
              >
                <Volume2 className="h-3 w-3" aria-hidden="true" />
                {copy.poweredBy}
              </a>
            </div>
            <p className="mb-4 text-xs font-semibold text-muted">{copy.voiceDescription}</p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full gap-2"
              onClick={() => (
                isPlaying ? stop() : void speak(copy.testVoiceText, { locale }).catch(() => {})
              )}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {isPlaying ? copy.stopPreview : copy.preview}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
