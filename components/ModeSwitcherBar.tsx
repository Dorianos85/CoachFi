"use client";

import { Baby, UserRoundCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { useMode, type CoachFiMode } from "@/context/ModeContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { nextBarState, type BarScrollState } from "@/lib/scrollVisibility";
import { isFeatureEnabled } from "@/lib/product-scope";

const COPY: LocalizedMap<{ group: string; option: string; kids: string; teen: string; adult: string }> = {
  en: { group: "Choose mode", option: "{label} mode", kids: "Kids", teen: "Teen", adult: "Adult" },
  pl: { group: "Wybierz tryb", option: "Tryb {label}", kids: "Kids", teen: "Teen", adult: "Dorosły" },
  es: { group: "Elige el modo", option: "Modo {label}", kids: "Niños", teen: "Jóvenes", adult: "Adultos" },
  fr: { group: "Choisir le mode", option: "Mode {label}", kids: "Enfants", teen: "Ados", adult: "Adultes" },
  zh: { group: "选择模式", option: "{label}模式", kids: "儿童", teen: "青少年", adult: "成人" },
  ja: { group: "モードを選択", option: "{label}モード", kids: "キッズ", teen: "ティーン", adult: "大人" },
  hi: { group: "मोड चुनें", option: "{label} मोड", kids: "बच्चे", teen: "किशोर", adult: "वयस्क" },
  "pt-BR": { group: "Escolha o modo", option: "Modo {label}", kids: "Crianças", teen: "Jovens", adult: "Adultos" },
  tr: { group: "Modu seç", option: "{label} modu", kids: "Çocuk", teen: "Genç", adult: "Yetişkin" },
};

const OPTIONS: Array<{ mode: CoachFiMode; icon: LucideIcon; home: string }> = [
  { mode: "kids", icon: Baby, home: "/kids" },
  { mode: "adult", icon: UserRoundCheck, home: "/" },
];

/** Mode switcher pinned to the bottom of the screen in every mode, hidden while scrolling down. */
export function ModeSwitcherBar({ highContrast = false }: { highContrast?: boolean }) {
  const { loaded, mode } = useMode();
  // The first-run mode selector handles the very first choice.
  if (!loaded || !mode) return null;
  return <ModeSwitcherDock mode={mode} highContrast={highContrast} />;
}

function ModeSwitcherDock({ mode, highContrast }: { mode: CoachFiMode; highContrast: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const copy = pickLocalized(COPY, locale);
  const { selectAdultMode, selectKidsMode } = useMode();
  const [visible, setVisible] = useState(true);
  const dockRef = useRef<HTMLDivElement | null>(null);

  useHideOnScroll(pathname, setVisible);
  useReservedSpace(dockRef);

  function choose(next: CoachFiMode, home: string) {
    if (next === mode) return;
    if (next === "kids") selectKidsMode();
    else selectAdultMode();
    router.push(home);
  }

  return (
    <div
      ref={dockRef}
      className="mode-switcher-dock pointer-events-none fixed inset-x-0 bottom-0 z-[60] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pl-3 pr-[calc(5.5rem+env(safe-area-inset-right,0px))] md:pr-[calc(6rem+env(safe-area-inset-right,0px))] lg:flex lg:justify-center lg:px-6 lg:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      data-hidden={visible ? undefined : "true"}
    >
      <div
        role="group"
        aria-label={copy.group}
        data-theme={highContrast || mode === "adult" ? undefined : mode}
        className="mode-switcher pointer-events-auto grid w-full max-w-md grid-cols-1 gap-1 p-1 lg:w-[26rem]"
        onFocus={() => setVisible(true)}
      >
        {OPTIONS.filter((option) => option.mode === "adult" || isFeatureEnabled("kids")).map((option) => {
          const label = copy[option.mode];
          const active = option.mode === mode;
          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={active}
              aria-label={copy.option.replace("{label}", label)}
              onClick={() => choose(option.mode, option.home)}
              className="mode-switcher__option flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1 text-xs leading-tight lg:flex-row lg:gap-1.5 lg:px-2 lg:text-sm"
            >
              <option.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hides the bar while the page scrolls down and brings it back on scroll up, at the top and at the
 * end of the page. Listens in the capture phase so it also follows a scrolling container inside a
 * layout, not only the window; dialogs and small scrolling widgets are ignored.
 */
function useHideOnScroll(resetKey: string, setVisible: (visible: boolean) => void) {
  useEffect(() => {
    setVisible(true);
    const states = new WeakMap<object, BarScrollState>([[document, { visible: true, anchorY: window.scrollY }]]);
    let frame = 0;
    let target: EventTarget | null = null;

    const sample = (source: EventTarget | null) => {
      if (source === document || source === document.documentElement || source === document.body) {
        const root = document.scrollingElement ?? document.documentElement;
        return { key: document, y: window.scrollY, max: root.scrollHeight - window.innerHeight };
      }
      if (!(source instanceof HTMLElement)) return null;
      if (source.clientHeight < window.innerHeight / 2 || source.closest('[role="dialog"]')) return null;
      return { key: source, y: source.scrollTop, max: source.scrollHeight - source.clientHeight };
    };

    const update = () => {
      frame = 0;
      const current = sample(target);
      target = null;
      if (!current) return;
      const previous = states.get(current.key) ?? { visible: true, anchorY: current.y };
      const next = nextBarState(previous, current);
      states.set(current.key, next);
      if (next !== previous) setVisible(next.visible);
    };

    const onScroll = (event: Event) => {
      target = event.target;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [resetKey, setVisible]);
}

/** Publishes the space the bar takes at the bottom of the screen so the page can leave room for it. */
function useReservedSpace(dockRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--cf-mode-bar-space", `${dock.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(dock);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--cf-mode-bar-space");
    };
  }, [dockRef]);
}
