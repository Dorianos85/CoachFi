import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChallengeSaveController, readDailyChallengeState, type ChallengeSaveCommand } from "@/lib/challenge-save";
import * as tokens from "@/lib/tokens";
import * as challenge from "@/data/challengeQuestions";
import { getStreak, markActiveToday, reachedMilestone } from "@/lib/streak";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const effects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: effects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: effects.notify }));
const command: ChallengeSaveCommand = Object.freeze({ questionId: "FIXTURE_B19", selectedAnswer: "B", correctAnswer: "B", reward: 50 });
const today = '{"date":"2026-10-14"}';
function fixture() {
  let current = true;
  const bytes = new Map<string, string>([["coachfi-tokens", "125"]]);
  const dispatch = vi.fn(); vi.stubGlobal("window", { dispatchEvent: dispatch });
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 1, area: "local", isCurrent: () => current,
    getItem: vi.fn((key: string) => bytes.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); return true; }),
    removeItem: vi.fn((key: string) => { bytes.delete(key); return true; }),
    release: vi.fn(() => { current = false; }),
  };
  return { storage, bytes, dispatch, invalidate: () => { current = false; } };
}
function noEffects(h: ReturnType<typeof fixture>) {
  expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.storage.removeItem).not.toHaveBeenCalled();
  expect(h.dispatch).not.toHaveBeenCalled(); expect(effects.notify).not.toHaveBeenCalled(); expect(effects.persist).not.toHaveBeenCalled();
}
beforeEach(() => { vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-14T12:00:00Z")); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("B19 strict readonly daily marker", () => {
  it.each([
    [null, "available"], [today, "completed"], ['{"date":"2026-10-13"}', "available"],
    ['{"date":"2024-02-29"}', "available"], ['{"date":"2026-10-15"}', "unavailable"],
    ["", "unavailable"], ["{", "unavailable"], ["null", "unavailable"], ["[]", "unavailable"],
    ['"2026-10-14"', "unavailable"], ['{}', "unavailable"], ['{"date":null}', "unavailable"],
    ['{"date":20261014}', "unavailable"], ['{"date":"2026-02-29"}', "unavailable"],
    ['{"date":"2026-04-31"}', "unavailable"], ['{"date":"2026-00-14"}', "unavailable"],
    ['{"date":"2026-10-00"}', "unavailable"], ['{"date":"2026-1-14"}', "unavailable"],
    ['{"date":"2026-10-14\\n"}', "unavailable"], ['{"date":"2026-10-14T00:00:00Z"}', "unavailable"],
    ['{"date":"2026-10-13","other":true}', "unavailable"], ['{"__proto__":{"date":"2026-10-14"}}', "unavailable"],
  ] as const)("preserves %s -> %s", (raw, expected) => {
    const h = fixture(); if (raw !== null) h.bytes.set("coachfi-challenge", raw);
    expect(readDailyChallengeState(h.storage)).toBe(expected); expect(h.bytes.get("coachfi-challenge") ?? null).toBe(raw); noEffects(h);
  });
  it("UTC day remains unchanged near midnight", () => {
    const h = fixture(); h.bytes.set("coachfi-challenge", today);
    vi.setSystemTime(new Date("2026-10-14T23:59:59Z")); expect(readDailyChallengeState(h.storage)).toBe("completed");
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z")); expect(readDailyChallengeState(h.storage)).toBe("available"); noEffects(h);
  });
  it.each(["stale", "owner-throw", "read-throw", "lost-during-read", "no-browser"])("unavailable %s never repairs", mode => {
    const h = fixture();
    if (mode === "stale") h.invalidate();
    if (mode === "owner-throw") h.storage.isCurrent = () => { throw new Error("FIXTURE_OWNER"); };
    if (mode === "read-throw") vi.mocked(h.storage.getItem).mockImplementation(() => { throw new Error("FIXTURE_READ"); });
    if (mode === "lost-during-read") vi.mocked(h.storage.getItem).mockImplementation(() => { h.invalidate(); return null; });
    if (mode === "no-browser") vi.stubGlobal("window", undefined);
    expect(readDailyChallengeState(h.storage)).toBe("unavailable"); noEffects(h);
  });
});

describe("B19 bounded RAM challenge save", () => {
  it.each(["lying-writer", "activity-remove", "activity-malform", "activity-lower"])("C9-DATA-01 reward %s cannot claim saved", mode => {
    const h = fixture(), c = createChallengeSaveController();
    if (mode === "lying-writer") vi.mocked(h.storage.setItem).mockImplementation((key, value) => { if (key !== "coachfi-tokens") h.bytes.set(key, value); return true; });
    const activity = () => {
      if (mode === "activity-remove") h.bytes.delete("coachfi-tokens");
      if (mode === "activity-malform") h.bytes.set("coachfi-tokens", "175junk");
      if (mode === "activity-lower") h.bytes.set("coachfi-tokens", "174");
    };
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" });
    const bytes = new Map(h.bytes), writes = vi.mocked(h.storage.setItem).mock.calls.length;
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); expect(h.bytes).toEqual(bytes); expect(h.storage.setItem).toHaveBeenCalledTimes(writes);
  });
  it.each([3, 7, 14])("real streak helper milestone %i may add its legitimate bonus without a duplicate challenge", milestone => {
    const h = fixture(), c = createChallengeSaveController();
    h.bytes.set("coachfi-streak", JSON.stringify({ lastActiveDate: "2026-10-13", currentStreak: milestone - 1, longestStreak: milestone - 1 }));
    const activity = () => {
      const before = getStreak(h.storage), next = markActiveToday(h.storage);
      if (next.currentStreak !== before.currentStreak) {
        const reached = reachedMilestone(next.currentStreak);
        if (reached) tokens.addTokens(reached * 5, `Streak milestone: ${reached} days`, "streak_bonus", h.storage);
      }
    };
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "saved", earned: 50 });
    expect(h.bytes.get("coachfi-tokens")).toBe(String(175 + milestone * 5));
    expect(getStreak(h.storage).currentStreak).toBe(milestone); expect(h.bytes.get("coachfi-challenge")).toBe(today);
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "ignored" }); expect(h.bytes.get("coachfi-tokens")).toBe(String(175 + milestone * 5));
  });
  it("zero reward preserves missing token bytes without initializing points", () => {
    const h = fixture(), c = createChallengeSaveController(); h.bytes.delete("coachfi-tokens");
    expect(c.run(0, h.storage, { ...command, reward: 0 })).toEqual({ status: "saved", earned: 0 });
    expect(h.bytes.has("coachfi-tokens")).toBe(false); expect(vi.mocked(h.storage.setItem).mock.calls).toEqual([["coachfi-challenge", today]]);
  });
  it("isOpen is a pure stale/terminal/quarantine fence and retryable stays open", () => {
    const h = fixture(), c = createChallengeSaveController();
    expect(c.isOpen(0)).toBe(true); expect(c.isOpen(-1)).toBe(false); expect(h.storage.getItem).not.toHaveBeenCalled();
    h.bytes.set("coachfi-challenge", "FIXTURE_BAD_MARKER");
    expect(c.run(0, h.storage, command)).toEqual({ status: "retryable" }); expect(c.isOpen(0)).toBe(true);
    h.bytes.delete("coachfi-challenge"); vi.mocked(h.storage.setItem).mockReturnValue(false);
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(c.isOpen(0)).toBe(false);
    expect(c.reset()).toBe(1); expect(c.isOpen(0)).toBe(false); expect(c.isOpen(1)).toBe(true);
    expect(c.run(1, h.storage, { ...command, selectedAnswer: "A" })).toEqual({ status: "wrong" }); expect(c.isOpen(1)).toBe(false);
  });
  it("isOpen is false throughout in-flight reset and saved closes the ticket", () => {
    const h = fixture(), c = createChallengeSaveController();
    h.dispatch.mockImplementation(() => { expect(c.isOpen(0)).toBe(false); c.reset(); expect(c.isOpen(1)).toBe(false); });
    expect(c.run(0, h.storage, command)).toEqual({ status: "stopped" }); expect(c.isOpen(1)).toBe(true);
    h.dispatch.mockReset(); expect(c.run(1, h.storage, command)).toEqual({ status: "saved", earned: 50 }); expect(c.isOpen(1)).toBe(false);
  });
  it("frozen API and reset retire stale tickets before reads", () => {
    const h = fixture(), c = createChallengeSaveController(); expect(Object.isFrozen(c)).toBe(true);
    expect(c.version()).toBe(0); expect(c.reset()).toBe(1); const r = c.run(0, h.storage, command);
    expect(r).toEqual({ status: "ignored" }); expect(Object.isFrozen(r)).toBe(true); expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it("real helpers reward then marker then activity, with no duplicate ticket", () => {
    const h = fixture(), c = createChallengeSaveController(), calls: string[] = [];
    vi.mocked(h.storage.setItem).mockImplementation((key, value) => { calls.push(key); h.bytes.set(key, value); return true; });
    const activity = vi.fn(() => { calls.push("activity"); expect(h.bytes.get("coachfi-challenge")).toBe(today); });
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "saved", earned: 50 });
    expect(calls).toEqual(["coachfi-tokens", "coachfi-challenge", "activity"]); expect(h.bytes.get("coachfi-tokens")).toBe("175");
    vi.mocked(h.storage.getItem).mockClear(); expect(c.run(0, h.storage, command, activity)).toEqual({ status: "ignored" });
    expect(h.storage.getItem).not.toHaveBeenCalled(); expect(h.storage.setItem).toHaveBeenCalledTimes(2); expect(activity).toHaveBeenCalledOnce();
  });
  it("zero reward saves marker without token effects", () => {
    const h = fixture(), c = createChallengeSaveController(), activity = vi.fn();
    expect(c.run(0, h.storage, { ...command, reward: 0 }, activity)).toEqual({ status: "saved", earned: 0 });
    expect(vi.mocked(h.storage.setItem).mock.calls).toEqual([["coachfi-challenge", today]]);
    expect(h.bytes.get("coachfi-tokens")).toBe("125"); expect(activity).toHaveBeenCalledOnce(); expect(h.dispatch).not.toHaveBeenCalled();
  });
  it("wrong consumes ticket without token access or mutation", () => {
    const h = fixture(), c = createChallengeSaveController(), activity = vi.fn(); h.bytes.set("coachfi-tokens", "BAD");
    expect(c.run(0, h.storage, { ...command, selectedAnswer: "A" }, activity)).toEqual({ status: "wrong" });
    expect(vi.mocked(h.storage.getItem).mock.calls).toEqual([["coachfi-challenge"]]);
    expect(c.run(0, h.storage, command)).toEqual({ status: "ignored" }); expect(activity).not.toHaveBeenCalled(); noEffects(h);
  });
  it("completed blocks hostile command getters before token access", () => {
    const h = fixture(), c = createChallengeSaveController(); h.bytes.set("coachfi-challenge", today);
    const hostile = { get questionId() { throw new Error("FIXTURE_HOSTILE"); } } as unknown as ChallengeSaveCommand;
    expect(c.run(0, h.storage, hostile)).toEqual({ status: "completed" }); expect(c.run(0, h.storage, command)).toEqual({ status: "ignored" }); noEffects(h);
  });
  it.each([{ reward: -1 }, { reward: 0.5 }, { reward: NaN }, { reward: Infinity }, { reward: Number.MAX_SAFE_INTEGER + 1 },
    { reward: "50" }, { questionId: "" }, { questionId: "  " }, { questionId: null }, { selectedAnswer: "E" },
    { selectedAnswer: "B\n" }, { selectedAnswer: "BB" }, { selectedAnswer: null }, { correctAnswer: "b" }, { correctAnswer: "B\n" }])(
    "invalid command %j is pre-write retryable", delta => {
      const h = fixture(), c = createChallengeSaveController();
      expect(c.run(0, h.storage, { ...command, ...delta } as unknown as ChallengeSaveCommand)).toEqual({ status: "retryable" }); noEffects(h);
      expect(c.run(0, h.storage, command)).toEqual({ status: "saved", earned: 50 });
    });
  it.each(["125junk", " 125", "0125", "125\n", "-1", "9007199254740992", "9007199254740991"])("bad/overflow token bytes %s remain", raw => {
    const h = fixture(), c = createChallengeSaveController(); h.bytes.set("coachfi-tokens", raw);
    expect(c.run(0, h.storage, command)).toEqual({ status: "retryable" }); expect(h.bytes.get("coachfi-tokens")).toBe(raw); noEffects(h);
  });
  it.each(["coachfi-challenge", "coachfi-tokens"])("read denial %s can retry only before writes", key => {
    const h = fixture(), c = createChallengeSaveController();
    vi.mocked(h.storage.getItem).mockImplementation(k => { if (k === key) throw new Error("FIXTURE_READ"); return h.bytes.get(k) ?? null; });
    expect(c.run(0, h.storage, command)).toEqual({ status: "retryable" }); noEffects(h);
    vi.mocked(h.storage.getItem).mockImplementation(k => h.bytes.get(k) ?? null); expect(c.run(0, h.storage, command)).toEqual({ status: "saved", earned: 50 });
  });
  it.each(["coachfi-tokens", "coachfi-challenge"].flatMap(key => ["false", "throw", "write-then-throw"].map(mode => ({ key, mode })) ))(
    "$key setter $mode quarantines before any replay", ({ key, mode }) => {
      const h = fixture(), c = createChallengeSaveController(), activity = vi.fn();
      vi.mocked(h.storage.setItem).mockImplementation((k, value) => {
        if (k !== key) { h.bytes.set(k, value); return true; }
        if (mode === "false") return false; if (mode === "write-then-throw") h.bytes.set(k, value); throw new Error("FIXTURE_SET");
      });
      expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); const bytes = new Map(h.bytes), count = vi.mocked(h.storage.setItem).mock.calls.length;
      expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); expect(h.bytes).toEqual(bytes); expect(h.storage.setItem).toHaveBeenCalledTimes(count);
      expect(activity).not.toHaveBeenCalled(); expect(h.bytes.get("coachfi-tokens")).toBe(key === "coachfi-tokens" && mode !== "write-then-throw" ? "125" : "175");
      expect(h.bytes.get("coachfi-challenge") ?? null).toBe(key === "coachfi-challenge" && mode === "write-then-throw" ? today : null);
    });
  it.each(["event", "notify", "persist", "activity"])("late %s failure has no saved or replay", phase => {
    const h = fixture(), c = createChallengeSaveController(), activity = vi.fn(), fail = () => { throw new Error("FIXTURE_LATE"); };
    if (phase === "event") h.dispatch.mockImplementation(fail); if (phase === "notify") effects.notify.mockImplementation(fail);
    if (phase === "persist") effects.persist.mockImplementation(fail); if (phase === "activity") activity.mockImplementation(fail);
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); expect(h.bytes.get("coachfi-tokens")).toBe("175");
    expect(h.bytes.get("coachfi-challenge") ?? null).toBe(phase === "activity" ? today : null); const count = vi.mocked(h.storage.setItem).mock.calls.length;
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); expect(h.storage.setItem).toHaveBeenCalledTimes(count);
  });
  it("final read denial is uncertain after confirmed physical writes", () => {
    const h = fixture(), c = createChallengeSaveController(); let reads = 0;
    vi.mocked(h.storage.getItem).mockImplementation(key => { if (key === "coachfi-challenge" && ++reads === 2) throw new Error("FIXTURE_FINAL_READ"); return h.bytes.get(key) ?? null; });
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(h.bytes.get("coachfi-tokens")).toBe("175"); expect(h.bytes.get("coachfi-challenge")).toBe(today);
  });
  it("acknowledged marker setter with missing marker cannot claim saved", () => {
    const h = fixture(), c = createChallengeSaveController();
    vi.mocked(h.storage.setItem).mockImplementation((key, value) => { if (key !== "coachfi-challenge") h.bytes.set(key, value); return true; });
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(h.bytes.get("coachfi-tokens")).toBe("175");
  });
  it("event reentry is ignored while outer save commits", () => {
    const h = fixture(), c = createChallengeSaveController(), nested = vi.fn(); h.dispatch.mockImplementation(() => { nested(c.run(0, h.storage, command)); });
    expect(c.run(0, h.storage, command)).toEqual({ status: "saved", earned: 50 }); expect(nested).toHaveBeenCalledWith({ status: "ignored" }); expect(h.bytes.get("coachfi-tokens")).toBe("175");
  });
  it("reset inside event keeps in-flight until finally and stops old ticket", () => {
    const h = fixture(), c = createChallengeSaveController(), nested = vi.fn();
    h.dispatch.mockImplementation(() => { expect(c.reset()).toBe(1); nested(c.run(1, h.storage, command)); });
    expect(c.run(0, h.storage, command)).toEqual({ status: "stopped" }); expect(nested).toHaveBeenCalledWith({ status: "ignored" });
    expect(h.bytes.get("coachfi-tokens")).toBe("175"); expect(h.bytes.has("coachfi-challenge")).toBe(false); expect(c.run(0, h.storage, command)).toEqual({ status: "ignored" });
  });
  it.each(["initial", "read", "token-write", "marker-write", "activity"])("owner loss at %s suppresses old result", phase => {
    const h = fixture(), c = createChallengeSaveController(), activity = vi.fn(); if (phase === "initial") h.invalidate();
    if (phase === "read") vi.mocked(h.storage.getItem).mockImplementation(key => { h.invalidate(); return h.bytes.get(key) ?? null; });
    if (phase === "token-write" || phase === "marker-write") vi.mocked(h.storage.setItem).mockImplementation((key, value) => {
      h.bytes.set(key, value); if (key === (phase === "token-write" ? "coachfi-tokens" : "coachfi-challenge")) h.invalidate(); return true;
    });
    if (phase === "activity") activity.mockImplementation(h.invalidate);
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "stopped" }); if (phase !== "activity") expect(activity).not.toHaveBeenCalled();
    if (phase === "initial" || phase === "read") noEffects(h); if (phase === "token-write") expect(h.bytes.has("coachfi-challenge")).toBe(false);
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "stopped" });
  });
  it("unprovable owner is stopped before reads", () => {
    const h = fixture(), c = createChallengeSaveController(); h.storage.isCurrent = () => { throw new Error("FIXTURE_OWNER"); };
    expect(c.run(0, h.storage, command)).toEqual({ status: "stopped" }); expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it("non-browser boundary is retryable before reads", () => {
    const h = fixture(), c = createChallengeSaveController(); vi.stubGlobal("window", undefined);
    expect(c.run(0, h.storage, command)).toEqual({ status: "retryable" }); expect(h.storage.getItem).not.toHaveBeenCalled(); noEffects(h);
  });
  it("native activity promise is rejected without awaiting/replay", async () => {
    const h = fixture(), c = createChallengeSaveController(), activity = vi.fn(() => Promise.reject(new Error("FIXTURE_ASYNC")));
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); await Promise.resolve(); await Promise.resolve();
    expect(c.run(0, h.storage, command, activity)).toEqual({ status: "uncertain" }); expect(activity).toHaveBeenCalledOnce(); expect(h.bytes.get("coachfi-tokens")).toBe("175");
  });
  it("arbitrary thenable is rejected without invoking then", () => {
    const h = fixture(), c = createChallengeSaveController(), then = vi.fn();
    expect(c.run(0, h.storage, command, () => ({ then }))).toEqual({ status: "uncertain" }); expect(then).not.toHaveBeenCalled();
  });
  it("setter thenable is uncertain without next marker action", () => {
    const h = fixture(), c = createChallengeSaveController(), then = vi.fn(); vi.mocked(h.storage.setItem).mockReturnValue({ then } as unknown as boolean);
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(h.storage.setItem).toHaveBeenCalledOnce(); expect(then).not.toHaveBeenCalled();
  });
  it("async mocked reward cannot produce saved; retired trace fences late writes", async () => {
    const h = fixture(), c = createChallengeSaveController(); let retained: PersonalStorageHandle | undefined;
    vi.spyOn(tokens, "addTokens").mockImplementation((_amount, _reason, _source, traced) => { retained = traced; return Promise.resolve(175) as unknown as number; });
    expect(c.run(0, h.storage, command)).toEqual({ status: "retryable" }); await Promise.resolve();
    expect(() => retained!.setItem("coachfi-tokens", "175")).toThrow("Storage session changed"); noEffects(h);
  });
  it("swallowed read fault poisons later writer before physical mutation", () => {
    const h = fixture(), c = createChallengeSaveController();
    vi.spyOn(tokens, "addTokens").mockImplementation((_amount, _reason, _source, traced) => {
      vi.mocked(h.storage.getItem).mockImplementation(() => { throw new Error("FIXTURE_READ"); });
      try { traced!.getItem("coachfi-tokens"); } catch { /* sticky fault */ } try { traced!.setItem("coachfi-tokens", "175"); } catch { /* sticky fault */ } return 175;
    });
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(h.storage.setItem).not.toHaveBeenCalled(); expect(h.bytes.get("coachfi-tokens")).toBe("125");
  });
  it.each(["false", "throw", "remove-then-throw"])("traced remove %s also quarantines", mode => {
    const h = fixture(), c = createChallengeSaveController();
    vi.mocked(h.storage.removeItem).mockImplementation(key => { if (mode === "false") return false; if (mode === "remove-then-throw") h.bytes.delete(key); throw new Error("FIXTURE_REMOVE"); });
    vi.spyOn(challenge, "markChallengeCompleted").mockImplementation(traced => { try { traced!.removeItem("coachfi-tokens"); } catch { /* sticky fault */ } });
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(h.storage.removeItem).toHaveBeenCalledOnce();
    expect(h.bytes.get("coachfi-tokens") ?? null).toBe(mode === "remove-then-throw" ? null : "175");
    expect(c.run(0, h.storage, command)).toEqual({ status: "uncertain" }); expect(h.storage.removeItem).toHaveBeenCalledOnce();
  });
});
