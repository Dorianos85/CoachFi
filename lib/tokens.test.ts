import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __resetProgressVisibilityForTests,
  claimProgressForAccount,
  hideSavedProgress,
  isProgressVisible,
  PROGRESS_OWNER_KEY,
  releaseAccountProgress,
} from "@/lib/progress-visibility";
import { addTokens, getTokenBalance, spendTokens } from "@/lib/tokens";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const storage = new MemoryStorage();
const g = globalThis as Record<string, unknown>;

beforeEach(() => {
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID = "test-project";
  storage.clear();
  g.localStorage = storage;
  g.window = {
    localStorage: storage,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  __resetProgressVisibilityForTests();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
  delete g.window;
  delete g.localStorage;
});

describe("token balance", () => {
  it("starts new users at zero (no free demo points)", () => {
    expect(getTokenBalance()).toBe(0);
  });

  it("accumulates rewards: 50 + 25 = 75", () => {
    expect(addTokens(50)).toBe(50);
    expect(addTokens(25)).toBe(75);
    expect(getTokenBalance()).toBe(75);
    expect(storage.getItem("coachfi-tokens")).toBe("75");
  });

  it("never overwrites a hidden balance with 0 + delta", () => {
    storage.setItem("coachfi-tokens", "50");
    hideSavedProgress();
    expect(getTokenBalance()).toBe(0);
    expect(addTokens(25)).toBe(75);
    expect(storage.getItem("coachfi-tokens")).toBe("75");
  });

  it("ignores negative and invalid rewards", () => {
    addTokens(10);
    expect(addTokens(-5)).toBe(10);
    expect(addTokens(Number.NaN)).toBe(10);
  });

  it("recovers from a corrupt stored value", () => {
    storage.setItem("coachfi-tokens", "abc");
    expect(getTokenBalance()).toBe(0);
    expect(addTokens(25)).toBe(25);
  });

  it("spends only what is available", () => {
    addTokens(30);
    expect(spendTokens(40)).toBe(false);
    expect(spendTokens(20)).toBe(true);
    expect(getTokenBalance()).toBe(10);
  });
});

describe("progress visibility", () => {
  it("shows anonymous local progress (CDP enabled or not)", () => {
    storage.setItem("coachfi-tokens", "120");
    expect(isProgressVisible()).toBe(true);
    expect(getTokenBalance()).toBe(120);
  });

  it("hides progress synced from an account until the session is confirmed", () => {
    storage.setItem("coachfi-tokens", "300");
    storage.setItem(PROGRESS_OWNER_KEY, "account");
    expect(isProgressVisible()).toBe(false);
    expect(getTokenBalance()).toBe(0);

    claimProgressForAccount();
    expect(isProgressVisible()).toBe(true);
    expect(getTokenBalance()).toBe(300);
  });

  it("never hides progress when accounts (CDP) are not configured", () => {
    delete process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
    storage.setItem("coachfi-tokens", "40");
    storage.setItem(PROGRESS_OWNER_KEY, "account");
    expect(isProgressVisible()).toBe(true);
    expect(getTokenBalance()).toBe(40);
  });

  it("is visible again once account progress is released", () => {
    storage.setItem(PROGRESS_OWNER_KEY, "account");
    releaseAccountProgress();
    expect(storage.getItem(PROGRESS_OWNER_KEY)).toBeNull();
    expect(isProgressVisible()).toBe(true);
  });
});
