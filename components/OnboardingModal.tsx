"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { getUser, saveUser } from "@/lib/user";
import { useProductStorage } from "@/lib/use-product-storage";

function suitableFocusTarget(target: HTMLElement | null, content: HTMLElement | null): target is HTMLElement {
  if (!target || !target.isConnected || content?.contains(target)) return false;
  const doc = target.ownerDocument;
  const style = doc.defaultView?.getComputedStyle(target);
  return target !== doc.body && target !== doc.documentElement && !target.matches(":disabled") &&
    target.getAttribute("aria-disabled") !== "true" && !target.closest('[inert], [hidden], [aria-hidden="true"]') &&
    style?.visibility !== "hidden" && style?.visibility !== "collapse" && target.getClientRects().length > 0;
}

export function OnboardingModal({ enabled = true, onDone, returnFocusRef }: {
  enabled?: boolean; onDone?: () => void; returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const { storage } = useProductStorage();
  const [saveFailed, setSaveFailed] = useState(false);
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const nameId = useId();
  const descriptionId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const savedClose = useRef(false);
  const eligibility = useRef(enabled);

  useLayoutEffect(() => {
    eligibility.current = enabled;
    return () => { eligibility.current = false; };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !storage.isCurrent()) { setOpen(false); return; }
    const user = getUser(storage);
    if (!user.setupDone) {
      const active = document.activeElement;
      previousFocus.current = active instanceof HTMLElement && suitableFocusTarget(active, contentRef.current) ? active : null;
      savedClose.current = false;
    }
    setOpen(!user.setupDone); setName(""); setGoal(""); setStep(1); setSaveFailed(false);
  }, [enabled, storage]);

  function handleNext() {
    if (!eligibility.current) return;
    if (!storage.isCurrent()) return;
    if (step === 1) { setStep(2); return; }
    try { saveUser({ name: name.trim(), goal, setupDone: true }, storage); }
    catch { if (storage.isCurrent()) setSaveFailed(true); return; }
    if (!storage.isCurrent()) return;
    savedClose.current = true;
    setOpen(false);
    onDone?.();
  }

  function handleSkip() {
    if (!eligibility.current) return;
    if (!storage.isCurrent()) return;
    try { saveUser({ name: "", goal: "", setupDone: true }, storage); }
    catch { if (storage.isCurrent()) setSaveFailed(true); return; }
    if (!storage.isCurrent()) return;
    savedClose.current = true;
    setOpen(false);
    onDone?.();
  }

  function dismiss() {
    if (!eligibility.current || !storage.isCurrent()) return;
    savedClose.current = false;
    setOpen(false);
  }

  const canProceed = step === 1 ? name.trim().length > 0 : goal.length > 0;
  const closeLabel = locale === "pl" ? "Zamknij wprowadzenie" : "Close onboarding";

  return (
    <Dialog.Root open={open && enabled && storage.isCurrent()} onOpenChange={(nextOpen) => { if (!nextOpen) dismiss(); }}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-text/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <Dialog.Content
            asChild
            aria-modal="true"
            aria-describedby={step === 1 ? descriptionId : undefined}
            onInteractOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              if (eligibility.current && storage.isCurrent()) nameRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!eligibility.current || !storage.isCurrent() || contentRef.current?.isConnected) return;
              const fallback = returnFocusRef?.current ?? null;
              const targets = savedClose.current ? [fallback, previousFocus.current] : [previousFocus.current, fallback];
              targets.find(target => suitableFocusTarget(target, contentRef.current))?.focus();
            }}
          >
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, scale: 0.88, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="relative w-full max-w-md focus:outline-none"
            >
              <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Progress dots */}
                <div className="shrink-0 flex items-center gap-2 bg-primary/5 px-6 pt-5">
                  {([1, 2] as const).map((s) => (
                    <motion.div
                      key={s}
                      animate={{ width: step === s ? 28 : 8, backgroundColor: step >= s ? "var(--cf-grape)" : "var(--cf-border-subtle)" }}
                      transition={{ duration: 0.3 }}
                      className="h-2 rounded-full"
                    />
                  ))}
                  <Dialog.Close asChild>
                    <button type="button" className="ml-auto min-h-11 rounded-lg px-3 py-2 text-sm font-bold text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      {closeLabel}
                    </button>
                  </Dialog.Close>
                </div>

                <div className="min-h-0 overflow-y-auto p-6">
                  <Dialog.Title asChild>
                    <p className={`break-words font-black leading-tight text-text ${step === 1 ? "text-2xl" : "text-xl"}`}>
                      {step === 1 ? t.onboarding.step1Title : t.onboarding.step2Title}
                    </p>
                  </Dialog.Title>
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
                      <p id={descriptionId} className="mt-2 break-words text-sm leading-6 text-muted">{t.onboarding.step1Desc}</p>
                      <label htmlFor={nameId} className="mt-5 block text-sm font-bold text-text">{t.onboarding.step1Placeholder}</label>
                      <input
                        ref={nameRef}
                        id={nameId}
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canProceed) {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        placeholder={t.onboarding.step1Placeholder}
                        maxLength={32}
                        className="mt-2 min-h-14 w-full rounded-input border-2 border-border bg-white px-4 py-3 text-lg font-bold leading-snug text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
                      <div className="mt-4 grid gap-2">
                        {t.onboarding.goals.map((g, index) => (
                          <button
                            key={g}
                            type="button"
                            autoFocus={index === 0}
                            aria-pressed={goal === g}
                            onClick={() => setGoal(g)}
                            className={`min-h-12 w-full whitespace-normal break-words rounded-xl border-2 px-4 py-3 text-left text-sm font-bold leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              goal === g
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-primary/10 bg-white text-text hover:border-primary/30"
                            }`}
                          >
                            {goal === g && <span aria-hidden="true" className="mr-2">✓</span>}
                            {g}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {saveFailed ? <p role="alert" className="mt-4 text-sm text-attention">{locale === "pl" ? "Nie udało się zapisać danych lokalnych. Spróbuj ponownie." : "Local data could not be saved. Please try again."}</p> : null}
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="min-h-11 rounded-lg px-3 py-2 text-sm font-bold leading-snug text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {t.onboarding.skip}
                    </button>
                    <Button
                      type="button"
                      size="lg"
                      className="ml-auto"
                      disabled={!canProceed}
                      onClick={handleNext}
                    >
                      {step === 2 ? t.onboarding.finish : t.onboarding.next}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
