import { captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";
export type NotifPermission = "default" | "granted" | "denied";

export function getPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission as NotifPermission;
}

export async function requestPermission(): Promise<NotifPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

export function sendNotification(title: string, body: string, icon = "/icon-192.png", storage: PersonalStorageHandle = captureCurrentPersonalStorage()) {
  if (!storage.isCurrent() || getPermission() !== "granted") return;
  try {
    new Notification(title, { body, icon, badge: icon });
  } catch {
    // some browsers require service worker — silently ignore
  }
}

const scheduledTimers = new Map<ReturnType<typeof setTimeout>, PersonalStorageHandle>();

/** A stale context cleanup may cancel only timers created for its own revision. */
export function cancelScheduledNotifications(storage?: PersonalStorageHandle) {
  for (const [timer, owner] of scheduledTimers) {
    if (storage && owner.revision !== storage.revision) continue;
    clearTimeout(timer); scheduledTimers.delete(timer);
  }
}

export function scheduleStreakReminder(currentStreak: number, storage: PersonalStorageHandle = captureCurrentPersonalStorage()) {
  if (!storage.isCurrent() || getPermission() !== "granted") return;
  // Clear previous timers
  cancelScheduledNotifications(storage);

  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0); // 20:00 today

  if (now >= target) return; // already past 20:00

  const delay = target.getTime() - now.getTime();
  const t = setTimeout(() => {
    scheduledTimers.delete(t);
    if (!storage.isCurrent()) return;
    sendNotification(
      `Don't lose your ${currentStreak}-day streak! 🔥`,
      "Complete a quick lesson or quiz today — it only takes 2 minutes.",
      "/icon-192.png", storage
    );
  }, delay);
  scheduledTimers.set(t, storage);
}

export function scheduleQuizReminder(storage: PersonalStorageHandle = captureCurrentPersonalStorage()) {
  if (!storage.isCurrent() || getPermission() !== "granted") return;
  const messages = [
    { title: "New quiz ready 🎯", body: "Test your knowledge — earn 25 Coach FI Points." },
    { title: "Mila has a question for you 🐷", body: "A 2-minute quiz is waiting. Don't let your score drop." },
    { title: "Your streak needs you 🔥", body: "One question. Two minutes. Keep the streak alive." },
  ];
  const pick = messages[Math.floor(Math.random() * messages.length)];

  // Remind after 24h (approximated with a shorter delay for demo: 30s)
  const DEMO_DELAY = 30_000; // in production: 86_400_000 (24h)
  const t = setTimeout(() => { scheduledTimers.delete(t); if (storage.isCurrent()) sendNotification(pick.title, pick.body, "/icon-192.png", storage); }, DEMO_DELAY);
  scheduledTimers.set(t, storage);
}
