import { notifyCloud } from "@/lib/sync/syncQueue";
import { captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";

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

export function getAvatar(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): AvatarData {
  if (!storage.isCurrent()) return DEFAULT_AVATAR;
  try {
    const raw = storage.getItem(AVATAR_KEY);
    if (!raw) return DEFAULT_AVATAR;
    const avatar: unknown = JSON.parse(raw);
    if (!avatar || typeof avatar !== "object" || Array.isArray(avatar)) return DEFAULT_AVATAR;
    const { gender, style } = avatar as Record<string, unknown>;
    return (gender === "male" || gender === "female") && AVATAR_STYLES.some(({ id }) => id === style)
      ? avatar as AvatarData : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function saveAvatar(data: AvatarData, storage: PersonalStorageHandle = captureCurrentPersonalStorage()): void {
  if (!storage.isCurrent() || !storage.setItem(AVATAR_KEY, JSON.stringify(data))) throw new Error("Personal storage scope changed");
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  notifyCloud("profile");
}
