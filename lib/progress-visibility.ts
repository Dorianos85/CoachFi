let visible = false;

export function isProgressVisible() {
  return visible;
}

export function setProgressVisible(next: boolean) {
  visible = next;
}

export function hideSavedProgress() {
  visible = false;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("coachfi-tokens"));
  window.dispatchEvent(new Event("coachfi-learning"));
}
