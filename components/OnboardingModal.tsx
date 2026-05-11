"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { getUser, saveUser } from "@/lib/user";

export function OnboardingModal({ enabled = true, onDone }: { enabled?: boolean; onDone?: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const user = getUser();
    if (!user.setupDone) setOpen(true);
  }, [enabled]);

  function handleNext() {
    if (step === 1) { setStep(2); return; }
    saveUser({ name: name.trim(), goal, setupDone: true });
    setOpen(false);
    onDone?.();
  }

  function handleSkip() {
    saveUser({ name: "", goal: "", setupDone: true });
    setOpen(false);
    onDone?.();
  }

  const canProceed = step === 1 ? name.trim().length > 0 : goal.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md"
          >
            <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Progress dots */}
              <div className="shrink-0 flex gap-2 bg-primary/5 px-6 pt-5">
                {([1, 2] as const).map((s) => (
                  <motion.div
                    key={s}
                    animate={{ width: step === s ? 28 : 8, backgroundColor: step >= s ? "#6C47FF" : "#e5e7eb" }}
                    transition={{ duration: 0.3 }}
                    className="h-2 rounded-full"
                  />
                ))}
              </div>

              <div className="min-h-0 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22 }}
                    >
                      <p className="break-words text-2xl font-black leading-tight text-text">{t.onboarding.step1Title}</p>
                      <p className="mt-2 break-words text-sm leading-6 text-muted">{t.onboarding.step1Desc}</p>
                      <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && canProceed && handleNext()}
                        placeholder={t.onboarding.step1Placeholder}
                        maxLength={32}
                        className="mt-5 min-h-14 w-full rounded-xl border border-primary/20 bg-white px-4 py-3 text-lg font-bold leading-snug text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22 }}
                    >
                      <p className="break-words text-xl font-black leading-tight text-text">{t.onboarding.step2Title}</p>
                      <div className="mt-4 grid gap-2">
                        {t.onboarding.goals.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGoal(g)}
                            className={`min-h-12 w-full whitespace-normal break-words rounded-xl border-2 px-4 py-3 text-left text-sm font-bold leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              goal === g
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-primary/10 bg-white text-text hover:border-primary/30"
                            }`}
                          >
                            {goal === g && <span className="mr-2">✓</span>}
                            {g}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
