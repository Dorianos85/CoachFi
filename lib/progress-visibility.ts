// Decides whether the learning progress stored on this device (points, streak,
// stage progress, SRS cards) may be shown.
//
// Anonymous progress is always visible: a tester who never signs in still sees
// the points, streak and stage progress they earned on this device. The only
// progress we hide is progress that was pulled from a signed-in account, while
// no account session is confirmed — e.g. after the CDP session expired on a
// shared device. AccountSync then clears it.
//
// The answer is synchronous from the first client render, so providers that
// read progress in their first effect (StreakContext, header points) never see
// a transient "hidden" state and never show 0 after a reload.

export const PROGRESS_OWNER_KEY = "coachfi-progress-owner";
const ACCOUNT_OWNER = "account";

let hiddenExplicitly = false;
let accountSession = false;

function readOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PROGRESS_OWNER_KEY);
  } catch {
    return null;
  }
}

function accountsEnabled() {
  // Read at call time (inlined by Next.js in the browser; settable in tests).
  return Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim());
}

/** True when the progress on this device was synced from a signed-in account. */
export function isAccountProgress() {
  // Without accounts (no CDP) nothing can be account-owned: never hide progress.
  return accountsEnabled() && readOwner() === ACCOUNT_OWNER;
}

export function isProgressVisible() {
  if (hiddenExplicitly) return false;
  if (!accountSession && isAccountProgress()) return false;
  return true;
}

/** Called once the signed-in account's progress has been pulled into this device. */
export function setProgressVisible(next: boolean) {
  hiddenExplicitly = !next;
  if (next) notifyProgressChanged();
}

/** Marks local progress as belonging to the signed-in account (session confirmed). */
export function claimProgressForAccount() {
  accountSession = true;
  hiddenExplicitly = false;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_OWNER_KEY, ACCOUNT_OWNER);
  } catch {
    // Storage blocked: progress simply stays anonymous.
  }
}

/** Local progress is anonymous again (after it was cleared on sign-out). */
export function releaseAccountProgress() {
  accountSession = false;
  hiddenExplicitly = false;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PROGRESS_OWNER_KEY);
    } catch {
      // ignore
    }
  }
  notifyProgressChanged();
}

/** Hide progress immediately (sign-out in progress) until it is cleared. */
export function hideSavedProgress() {
  hiddenExplicitly = true;
  accountSession = false;
  notifyProgressChanged();
}

function notifyProgressChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("coachfi-tokens"));
  window.dispatchEvent(new Event("coachfi-learning"));
}

/** Test helper: reset module state. */
export function __resetProgressVisibilityForTests() {
  hiddenExplicitly = false;
  accountSession = false;
}
