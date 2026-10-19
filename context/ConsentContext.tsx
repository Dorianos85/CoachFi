"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import { useProductStorage } from "@/lib/use-product-storage";

import {
  announceConsentChange,
  CONSENT_CHANGED_EVENT,
  createConsentRecord,
  hasConsentFor,
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
  acceptRequired: (optional: Record<OptionalConsentKey, boolean>, expectedStorage?: PersonalStorageHandle) => void;
  updateOptional: (optional: Record<OptionalConsentKey, boolean>, expectedStorage?: PersonalStorageHandle) => void;
  hasOptionalConsent: (key: OptionalConsentKey) => boolean;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: null, loaded: false, requiredAccepted: false, settingsOpen: false,
  openSettings: () => {}, closeSettings: () => {},
  acceptRequired: () => {}, updateOptional: () => {}, hasOptionalConsent: () => false,
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { storage } = useProductStorage();
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let previous = "";
    const read = () => {
      if (!storage.isCurrent()) return false;
      const next = readStoredConsent(storage);
      const serialized = JSON.stringify(next);
      const changed = serialized !== previous;
      previous = serialized;
      setConsent(next);
      return changed;
    };
    // Physical keys are namespaced. Compare the scoped record rather than
    // treating another account's StorageEvent as a current consent change.
    const onStorage = () => { if (read()) announceConsentChange(); };
    const onCloud = onStorage;
    read();
    setLoaded(true);
    window.addEventListener(CONSENT_CHANGED_EVENT, read);
    window.addEventListener("storage", onStorage);
    window.addEventListener("coachfi-cloud-synced", onCloud);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, read);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("coachfi-cloud-synced", onCloud);
    };
  }, [storage]);

  const requiredAccepted = storage.isCurrent() && hasConsentFor(consent, []);
  const value = useMemo<ConsentContextValue>(() => ({
    consent, loaded, requiredAccepted, settingsOpen,
    openSettings: () => { if (storage.isCurrent()) setSettingsOpen(true); },
    closeSettings: () => setSettingsOpen(false),
    acceptRequired: (optional, expectedStorage = storage) => {
      if (!storage.isCurrent() || !expectedStorage.isCurrent()) throw new Error("Personal storage scope changed");
      const record = createConsentRecord(optional);
      writeStoredConsent(record, expectedStorage);
      if (!expectedStorage.isCurrent() || !storage.isCurrent()) return;
      setConsent(record);
      setSettingsOpen(false);
    },
    updateOptional: (optional, expectedStorage = storage) => {
      if (!storage.isCurrent() || !expectedStorage.isCurrent()) throw new Error("Personal storage scope changed");
      // Editing optional settings cannot silently accept previously unaccepted terms.
      if (!hasConsentFor(readStoredConsent(expectedStorage), [])) return;
      const record = createConsentRecord(optional);
      writeStoredConsent(record, expectedStorage);
      if (!expectedStorage.isCurrent() || !storage.isCurrent()) return;
      setConsent(record);
      setSettingsOpen(false);
    },
    hasOptionalConsent: (key) => storage.isCurrent() && hasConsentFor(consent, [key]),
  }), [consent, loaded, requiredAccepted, settingsOpen, storage]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() { return useContext(ConsentContext); }
