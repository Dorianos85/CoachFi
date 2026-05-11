"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  createConsentRecord,
  DEFAULT_OPTIONAL_CONSENTS,
  readStoredConsent,
  writeStoredConsent,
  type ConsentRecord,
  type OptionalConsentKey,
} from "@/lib/consent";

interface ConsentContextValue {
  consent: ConsentRecord | null;
  loaded: boolean;
  requiredAccepted: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  acceptRequired: (optional: Record<OptionalConsentKey, boolean>) => void;
  updateOptional: (optional: Record<OptionalConsentKey, boolean>) => void;
  hasOptionalConsent: (key: OptionalConsentKey) => boolean;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: null,
  loaded: false,
  requiredAccepted: false,
  settingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
  acceptRequired: () => {},
  updateOptional: () => {},
  hasOptionalConsent: () => false,
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setLoaded(true);
  }, []);

  const requiredAccepted = !!consent?.termsAccepted && !!consent?.privacyAccepted;

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      loaded,
      requiredAccepted,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      acceptRequired: (optional) => {
        const record = createConsentRecord({ ...DEFAULT_OPTIONAL_CONSENTS, ...optional });
        writeStoredConsent(record);
        setConsent(record);
        setSettingsOpen(false);
      },
      updateOptional: (optional) => {
        const record = createConsentRecord({ ...DEFAULT_OPTIONAL_CONSENTS, ...optional });
        writeStoredConsent(record);
        setConsent(record);
        setSettingsOpen(false);
      },
      hasOptionalConsent: (key) => consent?.optional[key] === true,
    }),
    [consent, loaded, requiredAccepted, settingsOpen]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  return useContext(ConsentContext);
}
