import { notifyCloud } from "@/lib/sync/syncQueue";

const AVATAR_KEY = "coachfi-avatar";

export type AvatarGender = "male" | "female";
export type AvatarStyle = "warrior" | "explorer" | "builder";

export interface AvatarData {
  gender: AvatarGender;
  style: AvatarStyle;
}

export const AVATAR_STYLES = [
  {
    id: "warrior" as const,
    emoji: "⚔️",
    from: "var(--cf-area-mila)",
    to: "var(--cf-area-mila)",
  },
  {
    id: "explorer" as const,
    emoji: "🧭",
    from: "var(--cf-area-progress)",
    to: "var(--cf-area-progress)",
  },
  {
    id: "builder" as const,
    emoji: "🔨",
    from: "var(--cf-area-rewards)",
    to: "var(--cf-area-rewards)",
  },
] as const;

export const DEFAULT_AVATAR: AvatarData = { gender: "female", style: "warrior" };

export function getAvatar(): AvatarData {
  if (typeof window === "undefined") return DEFAULT_AVATAR;
  try {
    const raw = localStorage.getItem(AVATAR_KEY);
    return raw ? (JSON.parse(raw) as AvatarData) : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function saveAvatar(data: AvatarData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AVATAR_KEY, JSON.stringify(data));
  notifyCloud("profile");
}
