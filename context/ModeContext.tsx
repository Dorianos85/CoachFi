"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { notifyCloud } from "@/lib/sync/syncQueue";
import { hasAdultConfirmation, isFeatureEnabled } from "@/lib/product-scope";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import { useProductStorage } from "@/lib/use-product-storage";

export type CoachFiMode = "adult" | "kids";

export interface ModeRecord {
  mode: CoachFiMode;
  selectedAt: string;
  adultConfirmedAt?: string;
  adultAgeRequirement?: 18;
}

interface ModeContextValue {
  loaded: boolean;
  modeRecord: ModeRecord | null;
  mode: CoachFiMode | null;
  isKidsMode: boolean;
  settingsOpen: boolean;
  selectAdultMode: () => void;
  selectKidsMode: () => void;
  resetMode: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const MODE_STORAGE_KEY = "coachfi-mode-v1";

const ModeContext = createContext<ModeContextValue>({
  loaded: false,
  modeRecord: null,
  mode: null,
  isKidsMode: false,
  settingsOpen: false,
  selectAdultMode: () => {},
  selectKidsMode: () => {},
  resetMode: () => {},
  openSettings: () => {},
  closeSettings: () => {},
});

function readModeRecord(storage: PersonalStorageHandle): ModeRecord | null {
  if (!storage.isCurrent()) return null;
  try {
    const raw = storage.getItem(MODE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModeRecord;
    if (parsed.mode !== "adult" && parsed.mode !== "kids") return null;
    if (parsed.mode === "kids" && !isFeatureEnabled("kids")) return null;
    // The previous confirmation also allowed guardians. Ask again for 18+.
    if (parsed.mode === "adult" && !hasAdultConfirmation(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeModeRecord(record: ModeRecord, storage: PersonalStorageHandle) {
  if (!storage.isCurrent() || !storage.setItem(MODE_STORAGE_KEY, JSON.stringify(record)) || !storage.isCurrent()) throw new Error("Personal storage scope changed");
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const { storage } = useProductStorage();
  const [loaded, setLoaded] = useState(false);
  const [modeRecord, setModeRecord] = useState<ModeRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setModeRecord(readModeRecord(storage));
    setLoaded(true);
  }, [storage]);

  const value = useMemo<ModeContextValue>(
    () => ({
      loaded,
      modeRecord,
      mode: modeRecord?.mode ?? null,
      isKidsMode: isFeatureEnabled("kids") && modeRecord?.mode === "kids",
      settingsOpen,
      selectAdultMode: () => {
        if (!storage.isCurrent()) return;
        const now = new Date().toISOString();
        const record: ModeRecord = {
          mode: "adult",
          selectedAt: now,
          adultConfirmedAt: now,
          adultAgeRequirement: 18,
        };
        writeModeRecord(record, storage);
        if (!storage.isCurrent()) return;
        setModeRecord(record);
        setSettingsOpen(false);
        notifyCloud("profile");
      },
      selectKidsMode: () => {
        if (!storage.isCurrent() || !isFeatureEnabled("kids")) return;
        const record: ModeRecord = {
          mode: "kids",
          selectedAt: new Date().toISOString(),
        };
        writeModeRecord(record, storage);
        if (!storage.isCurrent()) return;
        setModeRecord(record);
        setSettingsOpen(false);
        notifyCloud("profile");
      },
      resetMode: () => {
        if (!storage.isCurrent() || !storage.removeItem(MODE_STORAGE_KEY) || !storage.isCurrent()) return;
        setModeRecord(null);
        setSettingsOpen(true);
      },
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [loaded, modeRecord, settingsOpen, storage]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  return useContext(ModeContext);
}
