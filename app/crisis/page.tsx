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
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { CRISIS_COPY, getCrisisRegionData, type CrisisCopy, type CrisisRegionData, type CrisisTemplateId } from "@/lib/crisisCopy";
import { pickLocalized } from "@/lib/i18n";
import { addTokens, getTokenBalance } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const REWARD_KEY = "coachfi-crisis-actions";
const ACTION_REWARD = 15;

type Resource = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  source?: string;
  phone?: string;
};

// Step ids keep the progress saved in localStorage stable across locales.
const actionStepIds = ["write-close-person", "call-creditor", "book-free-legal", "contact-mops", "sell-unused"];

// Formal documents for Polish institutions stay in Polish. They are only shown in the Polish region.
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
  const { locale } = useLanguage();
  const copy = pickLocalized(CRISIS_COPY, locale);
  const region = useMemo(() => getCrisisRegionData(locale), [locale]);
  const [city, setCity] = useState(region.defaultCity);
  const [copied, setCopied] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tokenBalance, setTokenBalance] = useState(125);

  useEffect(() => {
    setTokenBalance(getTokenBalance());
    try {
      const raw = localStorage.getItem(REWARD_KEY);
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {
      setDone(new Set());
    }
  }, []);

  useEffect(() => {
    setCity(region.defaultCity);
  }, [region.defaultCity]);

  const resources = useMemo(() => buildResources(city, copy, region), [city, copy, region]);
  const voiceText = copy.voiceText.join(" ");
  const rewardLabel = copy.firstDay.reward.replace("{reward}", String(ACTION_REWARD));
  const templates = region.templateIds
    .map((id) => buildTemplate(id, copy, region))
    .filter((template): template is NonNullable<typeof template> => template !== null);

  function markDone(id: string) {
    if (done.has(id)) return;
    const nextDone = new Set(done).add(id);
    setDone(nextDone);
    try {
      localStorage.setItem(REWARD_KEY, JSON.stringify(Array.from(nextDone)));
    } catch {
      // Progress is a convenience; the page works without storage.
    }
    // Token rewards for SOS steps are only kept in the Polish community version.
    if (region.actionRewards) setTokenBalance(addTokens(ACTION_REWARD));
  }

  async function copyText(id: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    }
  }

  return (
    <section aria-labelledby="crisis-title">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} readText={voiceText} />

      {(region.region === "US" || locale !== "pl") && (
        <p className="mb-4 text-sm font-bold leading-6 text-muted">{copy.regionNotice}</p>
      )}

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
                {region.safetyLinks.map((link) => (
                  <EmergencyLink key={link.href} href={link.href} label={link.label} detail={copy.safety[link.detail]} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{copy.tokens.title}</CardTitle>
            <CardDescription>{copy.tokens.description.replace("{reward}", String(ACTION_REWARD))}</CardDescription>
          </CardHeader>
          <CardContent>
            {region.actionRewards && (
              <div className="mb-4 rounded-lg bg-primary p-5 text-center text-on-primary">
                <Coins className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
                <p className="mt-2 text-4xl font-black">{tokenBalance}</p>
                <p className="text-sm font-bold text-on-primary/80">Coach FI Tokens</p>
              </div>
            )}
            <VoiceButton text={voiceText} label={copy.tokens.readPlan} locale={locale} variant="pill" className="w-full justify-center" />
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
            {region.emotionalContacts.map((contact, index) => {
              const text = copy.emotional.contacts[index];
              const title = contact.title ?? copy.emotional.mentalHealthCentre ?? "";
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
              {template.polishDocument && locale !== "pl" && copy.templates.polishDocumentNote && (
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
          {region.resalePlatforms.map((platform, index) => (
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

function buildResources(city: string, copy: CrisisCopy, region: CrisisRegionData): Resource[] {
  const cleanCity = city.trim() || copy.city.fallback;
  const encodedCity = encodeURIComponent(city.trim());
  const withCity = (text: string) => text.replace("{city}", cleanCity);

  return region.resources.flatMap((link) => {
    const text = copy.resources.items[link.id];
    if (!text) return [];
    return [
      {
        id: link.id,
        title: text.title,
        body: withCity(text.body),
        cta: withCity(text.cta),
        href: link.href.replace("{city}", encodedCity),
        source: link.source,
        phone: link.phone ?? (link.id === "oik" ? copy.resources.oikPhone : undefined),
      },
    ];
  });
}

function buildTemplate(id: CrisisTemplateId, copy: CrisisCopy, region: CrisisRegionData) {
  const title = copy.templates.titles[id];
  if (!title) return null;
  if (id === "emotional") return { id, title, text: copy.templates.emotionalText, polishDocument: false };
  if (id === "request") return { id, title, text: copy.templates.requestText, polishDocument: false };
  if (region.region === "US") {
    const text = id === "loan" ? copy.templates.loanText : id === "bank" ? copy.templates.bankText : undefined;
    return text ? { id, title, text, polishDocument: false } : null;
  }
  const polishText = id === "loan" ? loanAgreementTemplate : id === "bank" ? bankRequestTemplate : mopsTemplate;
  return { id, title, text: polishText, polishDocument: true };
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

const RESOURCE_ICONS: Record<string, typeof Search> = {
  legal: Gavel,
  mops: Home,
  zus: Landmark,
  credit: Banknote,
  alimony: Scale,
  oik: LifeBuoy,
  nfcc: Banknote,
  cfpb: Scale,
  housing: Home,
  help211: LifeBuoy,
  utilities: Landmark,
};

function ResourceCard({ resource, sourceLabel }: { resource: Resource; sourceLabel: string }) {
  const Icon = RESOURCE_ICONS[resource.id] ?? Search;

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
  doneLabel,
  rewardLabel,
  onDone,
}: {
  step: { id: string; title: string; body: string };
  done: boolean;
  doneLabel: string;
  rewardLabel: string;
  onDone: () => void;
}) {
  return (
    <div
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
      <Button type="button" variant={done ? "success" : "outline"} size="sm" onClick={onDone} disabled={done}>
        {done ? doneLabel : rewardLabel}
      </Button>
    </div>
  );
}
