import { notifyCloud } from "@/lib/sync/syncQueue";
import { captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";

const USER_KEY = "coachfi-user";

export interface UserProfile {
  name: string;
  goal: string;
  setupDone: boolean;
}

const EMPTY: UserProfile = { name: "", goal: "", setupDone: false };

export function getUser(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): UserProfile {
  if (!storage.isCurrent()) return EMPTY;
  try {
    const raw = storage.getItem(USER_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return EMPTY;
  }
}

export function saveUser(profile: UserProfile, storage: PersonalStorageHandle = captureCurrentPersonalStorage()): void {
  if (!storage.isCurrent() || !storage.setItem(USER_KEY, JSON.stringify(profile))) throw new Error("Personal storage scope changed");
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  notifyCloud("profile");
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  window.dispatchEvent(new Event("coachfi-user"));
}

export function clearUserName(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): void {
  const profile = getUser(storage);
  saveUser({ ...profile, name: "" }, storage);
}

export function getDisplayName(profile: UserProfile): string {
  return typeof profile.name === "string" ? profile.name.trim() || "Your" : "Your";
}
