"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clipboard,
  Coins,
  FileText,
  Gavel,
  Home,
  Landmark,
  LifeBuoy,
  Link as LinkIcon,
  MessageCircleHeart,
  Phone,
  Scale,
  Search,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { CRISIS_COPY, type CrisisCopy } from "@/lib/crisisCopy";
import { pickLocalized } from "@/lib/i18n";
import { getTokenBalance } from "@/lib/tokens";
import {
  CRISIS_ACTION_IDS as actionStepIds,
  CRISIS_ACTION_REWARD as ACTION_REWARD,
  createCrisisActionSaveController,
  readCrisisActions,
  type CrisisActionId,
} from "@/lib/crisis-action-save";
import { useProductStorage } from "@/lib/use-product-storage";
import { cn } from "@/lib/utils";

const actionSaveCopy = {
  pl: {
    unavailable: "Nie można odczytać zapisanych działań. Nowe oznaczenia i punkty są zablokowane. Sprawdź odczyt ponownie.",
    check: "Sprawdź odczyt ponownie",
    retryable: "Nie udało się zapisać działania. Nie przyznano nowych punktów. Możesz spróbować ponownie.",
    uncertain: "Nie udało się potwierdzić pełnego zapisu. Oznaczenie działania lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tego działania. Pozostałe oznaczenia są zablokowane w tym widoku.",
  },
  en: {
    unavailable: "Saved actions could not be read. New action marks and points are blocked. Check the data again.",
    check: "Check the data again",
    retryable: "The action could not be saved. No new points were awarded. You can try again.",
    uncertain: "The full save could not be confirmed. The action mark or points may have been partially saved. Do not retry this action. Other action marks are blocked in this view.",
  },
};

type Resource = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  source?: string;
  phone?: string;
};

// Names, links and phone numbers are the same in every language; the texts come from CRISIS_COPY by position.
const resalePlatforms = [
  { name: "Vinted", href: "https://www.vinted.pl/" },
  { name: "OLX", href: "https://www.olx.pl/" },
  { name: "Allegro Lokalnie", href: "https://allegrolokalnie.pl/" },
  { name: "Facebook Marketplace", href: "https://www.facebook.com/marketplace/" },
  { name: "eBay", href: "https://www.ebay.pl/" },
];

const emotionalSupportContacts: { title?: string; href: string; urgent?: boolean }[] = [
  { title: "112", href: "tel:112", urgent: true },
  { title: "116 123", href: "tel:116123" },
  { title: "800 70 2222", href: "tel:800702222" },
  { title: "116sos.pl", href: "https://116sos.pl/otrzymaj-pomoc/telefon" },
  { href: "https://www.gov.pl/web/zdrowie/centra-zdrowia-psychicznego" },
];

// Formal documents for Polish institutions stay in Polish in every locale.
const loanAgreementTemplate = `UMOWA POŻYCZKI

Zawarta w dniu [DATA] w [MIASTO] pomiędzy:
Pożyczkodawcą: [IMIĘ, NAZWISKO, ADRES, PESEL]
a
Pożyczkobiorcą: [IMIĘ, NAZWISKO, ADRES, PESEL].

1. Pożyczkodawca przekazuje Pożyczkobiorcy kwotę [KWOTA] zł.
2. Pożyczkobiorca zobowiązuje się zwrócić pełną kwotę do dnia [DATA ZWROTU].
3. Zwrot nastąpi przelewem na rachunek: [NUMER KONTA] lub gotówką za pokwitowaniem.
4. Pożyczka jest nieoprocentowana, chyba że strony wpiszą inaczej: [WARUNKI].
5. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.

Podpis Pożyczkodawcy: ____________________
Podpis Pożyczkobiorcy: ____________________`;

const bankRequestTemplate = `WNIOSEK DO BANKU O CZASOWE OBNIŻENIE LUB ZAWIESZENIE RAT

Dane kredytobiorcy: [IMIĘ, NAZWISKO, PESEL]
Numer umowy kredytu: [NUMER UMOWY]

Zwracam się z prośbą o pilny kontakt i rozpatrzenie możliwości:
- zawieszenia spłaty rat lub skorzystania z dostępnych wakacji kredytowych,
- czasowego obniżenia rat,
- karencji w spłacie kapitału,
- restrukturyzacji zadłużenia,
- informacji o Funduszu Wsparcia Kredytobiorców, jeśli dotyczy.

Uzasadnienie:
Moja sytuacja finansowa pogorszyła się z powodu [UTRATA PRACY/CHOROBA/SPADEK DOCHODÓW/INNE].
Chcę uniknąć zaległości i ustalić realny plan spłaty.

Proszę o odpowiedź pisemną oraz wskazanie dokumentów potrzebnych do rozpatrzenia wniosku.

Data i podpis: ____________________`;

const mopsTemplate = `WNIOSEK DO MOPS/OPS O POMOC W SYTUACJI KRYZYSOWEJ

Dane: [IMIĘ, NAZWISKO, ADRES, TELEFON]

Proszę o pilny kontakt i informację o możliwych formach pomocy, w szczególności:
- zasiłek celowy na żywność, leki, opał, czynsz lub niezbędne potrzeby,
- pomoc rzeczowa lub żywnościowa,
- wsparcie pracownika socjalnego,
- wskazanie innych lokalnych form pomocy.

Opis sytuacji:
[KRÓTKO OPISZ: dochód, liczba osób w gospodarstwie, pilne wydatki, zadłużenie, choroba, utrata pracy].

Data i podpis: ____________________`;

export default function CrisisPage() {
  const { storage } = useProductStorage();
  const { locale } = useLanguage();
  const copy = pickLocalized(CRISIS_COPY, locale);
  const [city, setCity] = useState("Warszawa");
  const [copied, setCopied] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tokenBalance, setTokenBalance] = useState(0);
  const [saveController] = useState(createCrisisActionSaveController);
  const [saveTicket, setSaveTicket] = useState(() => saveController.version());
  const [saveIssue, setSaveIssue] = useState<"unavailable" | "retryable" | "uncertain" | null>("unavailable");
  const saveCopy = locale === "pl" ? actionSaveCopy.pl : actionSaveCopy.en;

  function isCurrentAttempt() {
    try { return storage.isCurrent() && saveTicket === saveController.version(); }
    catch { return false; }
  }

  useLayoutEffect(() => {
    const ticket = saveController.reset();
    const state = readCrisisActions(storage);
    const balance = getTokenBalance(storage);
    let current = false;
    try { current = storage.isCurrent() && ticket === saveController.version(); } catch { /* Leave unavailable. */ }
    if (!current) return () => { saveController.reset(); };
    setSaveTicket(ticket);
    setTokenBalance(balance);
    setDone(new Set(state.status === "ready" ? state.completed : []));
    setSaveIssue(state.status === "unavailable" ? "unavailable" : null);
    setCopied(null);
    return () => { saveController.reset(); };
  }, [storage, saveController]);

  const resources = useMemo(() => buildResources(city, copy), [city, copy]);
  const voiceText = copy.voiceText.join(" ");
  const rewardLabel = copy.firstDay.reward.replace("{reward}", String(ACTION_REWARD));
  const templates = [
    { id: "emotional", title: copy.templates.titles.emotional, text: copy.templates.emotionalText, polishDocument: false },
    { id: "request", title: copy.templates.titles.request, text: copy.templates.requestText, polishDocument: false },
    { id: "loan", title: copy.templates.titles.loan, text: loanAgreementTemplate, polishDocument: true },
    { id: "bank", title: copy.templates.titles.bank, text: bankRequestTemplate, polishDocument: true },
    { id: "mops", title: copy.templates.titles.mops, text: mopsTemplate, polishDocument: true },
  ];

  function markDone(id: CrisisActionId) {
    if (done.has(id) || saveIssue === "unavailable" || saveIssue === "uncertain" ||
      !isCurrentAttempt() || !saveController.isOpen(saveTicket, id)) return;
    const result = saveController.run(saveTicket, storage, id);
    if (!isCurrentAttempt() || result.status === "ignored" || result.status === "stopped") return;
    if (result.status === "retryable" || result.status === "uncertain") {
      setSaveIssue(result.status);
      const balance = getTokenBalance(storage);
      if (!isCurrentAttempt()) return;
      setTokenBalance(balance);
      try { window.dispatchEvent(new Event("coachfi-tokens")); } catch { /* Keep the save warning. */ }
      return;
    }
    const balance = result.balance ?? getTokenBalance(storage);
    if (!isCurrentAttempt()) return;
    setDone(new Set(result.completed));
    setTokenBalance(balance);
    setSaveIssue(null);
  }

  function handleCheckRead() {
    if (saveIssue !== "unavailable" || !isCurrentAttempt() || !saveController.isOpen(saveTicket)) return;
    const state = readCrisisActions(storage);
    if (!isCurrentAttempt()) return;
    setDone(new Set(state.status === "ready" ? state.completed : []));
    setSaveIssue(state.status === "unavailable" ? "unavailable" : null);
  }

  async function copyText(id: string, text: string) {
    if (!storage.isCurrent()) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      if (!storage.isCurrent()) return;
      setCopied(id);
      window.setTimeout(() => { if (storage.isCurrent()) setCopied(null); }, 1800);
    }
  }

  return (
    <section aria-labelledby="crisis-title">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} readText={voiceText} />

      {saveIssue && (
        <div role="alert" className="mb-4 rounded-lg border border-warning/40 bg-warning/15 p-4 text-sm text-text">
          <p>{saveCopy[saveIssue]}</p>
          {saveIssue === "unavailable" && <Button type="button" className="mt-3" onClick={handleCheckRead}>{saveCopy.check}</Button>}
        </div>
      )}
      {locale !== "pl" && <p className="mb-4 text-sm font-bold leading-6 text-muted">{copy.polandNotice}</p>}

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-warning/30 bg-warning/15 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-warning text-background">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text">{copy.safety.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{copy.safety.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <EmergencyLink href="tel:112" label="112" detail={copy.safety.emergencyDetail} />
                <EmergencyLink href="tel:116123" label="116 123" detail={copy.safety.mentalDetail} />
                <EmergencyLink href="https://116sos.pl/" label="116sos.pl" detail={copy.safety.onlineDetail} />
              </div>
            </div>
          </div>
        </div>

        <Card data-testid="crisis-balance">
          <CardHeader>
            <CardTitle>{copy.tokens.title}</CardTitle>
            <CardDescription>{copy.tokens.description.replace("{reward}", String(ACTION_REWARD))}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary p-5 text-center text-on-primary">
              <Coins className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
              <p className="mt-2 text-4xl font-black">{tokenBalance}</p>
              <p className="text-sm font-bold text-on-primary/80">Coach FI Tokens</p>
            </div>
            <VoiceButton text={voiceText} label={copy.tokens.readPlan} locale={locale} variant="pill" className="mt-4 w-full justify-center" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5 border-warning/30">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-warning">{copy.emotional.eyebrow}</p>
              <CardTitle className="mt-2 text-3xl">{copy.emotional.title}</CardTitle>
              <CardDescription className="mt-3 text-base">{copy.emotional.description}</CardDescription>
            </div>
            <VoiceButton
              text={copy.emotional.voiceText}
              label={copy.emotional.voiceLabel}
              locale={locale}
              variant="pill"
              className="shrink-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {emotionalSupportContacts.map((contact, index) => {
              const text = copy.emotional.contacts[index];
              const title = contact.title ?? copy.emotional.mentalHealthCentre;
              return (
                <a
                  key={contact.href}
                  href={contact.href}
                  target={contact.href.startsWith("http") ? "_blank" : undefined}
                  rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={cn(
                    "rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    contact.urgent
                      ? "border-warning/45 bg-warning/15"
                      : "border-primary/10 bg-background/45 hover:border-primary/35"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-lg",
                        contact.urgent ? "bg-warning text-background" : "bg-primary/12 text-primary"
                      )}
                    >
                      {contact.urgent ? (
                        <Phone className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <LinkIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-tight text-text">{title}</h3>
                  <p className="mt-1 text-xs font-black uppercase text-primary">{text?.subtitle}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-muted">{text?.body}</p>
                  <p className="mt-4 text-sm font-black text-accent">{text?.cta}</p>
                </a>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-primary/10 bg-background/45 p-4 md:grid-cols-3">
            {copy.emotional.steps.map((step) => (
              <SafetyStep key={step.title} title={step.title} body={step.body} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>{copy.city.title}</CardTitle>
          <CardDescription>{copy.city.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="grid gap-2 text-sm font-black text-text md:max-w-md">
            {copy.city.label}
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder={copy.city.placeholder}
              className="min-h-12 rounded-lg border border-primary/20 bg-background/70 px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} sourceLabel={copy.resources.source} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.firstDay.title}</CardTitle>
            <CardDescription>{copy.firstDay.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {actionStepIds.map((id, index) => (
              <ActionStep
                key={id}
                step={{ id, ...copy.firstDay.steps[index] }}
                done={done.has(id)}
                disabled={saveIssue === "unavailable" || saveIssue === "uncertain"}
                doneLabel={copy.firstDay.done}
                rewardLabel={rewardLabel}
                onDone={() => markDone(id)}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" aria-hidden="true" />
              <CardTitle>{copy.avoid.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm font-semibold leading-6 text-muted">
              {copy.avoid.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>{copy.templates.title}</CardTitle>
          <CardDescription>{copy.templates.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-primary/10 bg-background/45 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-black text-text">{template.title}</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyText(template.id, template.text)}>
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                  {copied === template.id ? copy.templates.copied : copy.templates.copy}
                </Button>
              </div>
              {template.polishDocument && locale !== "pl" && (
                <p className="mb-2 text-xs font-bold leading-5 text-muted">{copy.templates.polishDocumentNote}</p>
              )}
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-card/80 p-3 text-xs font-semibold leading-5 text-muted">
                {template.text}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{copy.resale.title}</CardTitle>
              <CardDescription>{copy.resale.description}</CardDescription>
            </div>
            <VoiceButton text={copy.resale.voiceText} label={copy.resale.voiceLabel} locale={locale} variant="pill" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {resalePlatforms.map((platform, index) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-primary/10 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ShoppingBag className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-black text-text">{platform.name}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{copy.resale.platforms[index]?.bestFor}</p>
              <p className="mt-3 text-xs font-bold leading-5 text-accent">{copy.resale.platforms[index]?.tip}</p>
            </a>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function buildResources(city: string, copy: CrisisCopy): Resource[] {
  const cleanCity = city.trim() || copy.city.fallback;
  const q = encodeURIComponent(cleanCity);
  // The institutions are Polish, so the search phrases stay in Polish.
  const search = (phrase: string) => `https://www.google.com/search?q=${encodeURIComponent(`${phrase} ${cleanCity}`)}`;
  const items = copy.resources.items;
  const withCity = (text: string) => text.replace("{city}", cleanCity);

  return [
    {
      id: "oik",
      ...items.oik,
      href: search("Ośrodek Interwencji Kryzysowej"),
      cta: withCity(items.oik.cta),
      phone: copy.resources.oikPhone,
    },
    {
      id: "legal",
      ...items.legal,
      href: "https://zapisy-np.ms.gov.pl/",
      source: "gov.pl",
    },
    {
      id: "mops",
      ...items.mops,
      href: search("MOPS OPS zasiłek celowy"),
      cta: withCity(items.mops.cta),
      source: "gov.pl",
    },
    {
      id: "zus",
      ...items.zus,
      href: "https://www.zus.pl/firmy/ulgi/ulgi-w-splacie-naleznosci",
    },
    {
      id: "alimony",
      ...items.alimony,
      href: "https://www.gov.pl/web/gov/uzyskaj-swiadczenia-z-funduszu-alimentacyjnego",
      source: "gov.pl",
    },
    {
      id: "credit",
      ...items.credit,
      href: "https://www.bgk.pl/produkty/fundusz-wsparcia-kredytobiorcow/",
      source: "BGK",
    },
    {
      id: "city-office",
      ...items.cityOffice,
      href: `https://www.google.com/search?q=${encodeURIComponent(`urząd miasta gminy pomoc kryzysowa ${cleanCity}`)}&near=${q}`,
    },
  ];
}

function EmergencyLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-background/70 px-4 py-2 text-sm font-black text-text transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Phone className="h-4 w-4 text-warning" aria-hidden="true" />
      <span>{label}</span>
      <span className="text-xs text-muted">{detail}</span>
    </a>
  );
}

function ResourceCard({ resource, sourceLabel }: { resource: Resource; sourceLabel: string }) {
  const icon = resource.id === "legal" ? Gavel : resource.id === "mops" ? Home : resource.id === "zus" ? Landmark : resource.id === "credit" ? Banknote : resource.id === "alimony" ? Scale : resource.id === "oik" ? LifeBuoy : Search;
  const Icon = icon;

  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-primary/10 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <LinkIcon className="h-4 w-4 text-muted" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-black leading-tight text-text">{resource.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">{resource.body}</p>
      {resource.phone && <p className="mt-3 text-xs font-black uppercase text-accent">{resource.phone}</p>}
      {resource.source && (
        <p className="mt-2 text-xs font-bold text-muted">
          {sourceLabel}: {resource.source}
        </p>
      )}
      <p className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">
        {resource.cta}
        <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </p>
    </a>
  );
}

function SafetyStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-background">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-black text-text">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-muted">{body}</p>
      </div>
    </div>
  );
}

function ActionStep({
  step,
  done,
  disabled,
  doneLabel,
  rewardLabel,
  onDone,
}: {
  step: { id: string; title: string; body: string };
  done: boolean;
  disabled: boolean;
  doneLabel: string;
  rewardLabel: string;
  onDone: () => void;
}) {
  return (
    <div
      data-testid={`crisis-action-${step.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center",
        done ? "border-success/35 bg-success/12" : "border-primary/10 bg-background/45"
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", done ? "bg-success text-background" : "bg-primary/12 text-primary")}>
        {done ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-black text-text">{step.title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-muted">{step.body}</p>
      </div>
      <Button type="button" variant={done ? "success" : "outline"} size="sm" onClick={onDone} disabled={done || disabled}>
        {done ? doneLabel : rewardLabel}
      </Button>
    </div>
  );
}
