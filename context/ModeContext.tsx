"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { notifyCloud } from "@/lib/sync/syncQueue";

export type CoachFiMode = "adult" | "kids";

export interface ModeRecord {
  mode: CoachFiMode;
  selectedAt: string;
  adultConfirmedAt?: string;
  parentConsentAt?: string;
  parentName?: string;
}

interface ModeContextValue {
  loaded: boolean;
  modeRecord: ModeRecord | null;
  mode: CoachFiMode | null;
  isKidsMode: boolean;
  settingsOpen: boolean;
  selectAdultMode: () => void;
  selectKidsMode: (parentName: string) => void;
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

function readModeRecord(): ModeRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModeRecord;
    if (parsed.mode !== "adult" && parsed.mode !== "kids") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeModeRecord(record: ModeRecord) {
  window.localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(record));
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [modeRecord, setModeRecord] = useState<ModeRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setModeRecord(readModeRecord());
    setLoaded(true);
  }, []);

  const value = useMemo<ModeContextValue>(
    () => ({
      loaded,
      modeRecord,
      mode: modeRecord?.mode ?? null,
      isKidsMode: modeRecord?.mode === "kids" && !!modeRecord.parentConsentAt,
      settingsOpen,
      selectAdultMode: () => {
        const now = new Date().toISOString();
        const record: ModeRecord = {
          mode: "adult",
          selectedAt: now,
          adultConfirmedAt: now,
        };
        writeModeRecord(record);
        setModeRecord(record);
        setSettingsOpen(false);
        notifyCloud("profile");
      },
      selectKidsMode: (parentName) => {
        const now = new Date().toISOString();
        const record: ModeRecord = {
          mode: "kids",
          selectedAt: now,
          parentConsentAt: now,
          parentName: parentName.trim().slice(0, 48),
        };
        writeModeRecord(record);
        setModeRecord(record);
        setSettingsOpen(false);
        notifyCloud("profile");
      },
      resetMode: () => {
        window.localStorage.removeItem(MODE_STORAGE_KEY);
        setModeRecord(null);
        setSettingsOpen(true);
      },
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [loaded, modeRecord, settingsOpen]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  return useContext(ModeContext);
}
