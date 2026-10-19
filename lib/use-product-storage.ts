"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  captureCurrentPersonalStorage,
  getStorageOwnershipServerSnapshot,
  getStorageOwnershipSnapshot,
  subscribeStorageOwnership,
} from "@/lib/product-storage";

/** A render captures its owner; an old callback cannot acquire a later owner's data. */
export function useProductStorage() {
  const snapshot = useSyncExternalStore(subscribeStorageOwnership,
    getStorageOwnershipSnapshot, getStorageOwnershipServerSnapshot);
  const handles = useMemo(() => ({ storage: captureCurrentPersonalStorage(),
    sessionStorage: captureCurrentPersonalStorage("session") }), [snapshot.revision, snapshot.status]);
  return { snapshot, ...handles };
}
