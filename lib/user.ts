import { notifyCloud } from "@/lib/sync/syncQueue";

const USER_KEY = "coachfi-user";

export interface UserProfile {
  name: string;
  goal: string;
  setupDone: boolean;
}

const EMPTY: UserProfile = { name: "", goal: "", setupDone: false };

export function getUser(): UserProfile {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return EMPTY;
  }
}

export function saveUser(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
  notifyCloud("profile");
  window.dispatchEvent(new Event("coachfi-user"));
}

export function clearUserName(): void {
  const profile = getUser();
  saveUser({ ...profile, name: "" });
}

export function getDisplayName(profile: UserProfile): string {
  return profile.name.trim() || "Your";
}
