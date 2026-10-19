import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostgrestClient } from "@supabase/postgrest-js";
import { syncOnLogin } from "@/lib/sync/cloudSync";
import { beginStorageOwner } from "@/lib/product-storage";

const rows: Record<string, unknown[]> = {
  profiles: [{ name: "Synthetic cloud profile", goal: "education", onboarding_done: true,
    avatar_gender: "female", avatar_style: "warrior", voice_id: "synthetic-voice" }],
  srs_cards: [{ question_id: "synthetic-question", interval_days: 1, repetitions: 2, ease_factor: 2.5,
    next_review: "2026-10-15T00:00:00.000Z" }],
  stage_progress: [{ stage_id: "synthetic-stage", status: "started" }], streaks: [], reward_balances: [{ balance: 88 }],
};
beforeEach(() => { vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Native fetch is forbidden in SDK contract review."); })); });
afterEach(() => { vi.unstubAllGlobals(); });

function client(signal: AbortSignal) {
  const transport = vi.fn<typeof fetch>(async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.origin).toBe("https://synthetic.invalid"); expect(options?.method).toBe("GET");
    expect(options?.signal).toBe(signal);
    const table = url.pathname.split("/").at(-1)!; expect(Object.keys(rows)).toContain(table);
    return new Response(JSON.stringify(rows[table]), { status: 200, headers: { "content-type": "application/json" } });
  });
  // Real installed PostgREST query builders, synthetic transport only. No
  // Supabase auth client, refresh timers, credentials or real endpoints.
  return { db: new PostgrestClient("https://synthetic.invalid", { fetch: transport }), transport };
}

describe("independent installed PostgREST SDK contract", () => {
  it("signal-before-maybeSingle uses supported types and returns the same runtime builder", async () => {
    const abort = new AbortController(), state = client(abort.signal);
    const builder = state.db.from("profiles").select().abortSignal(abort.signal);
    const terminal = builder.maybeSingle();
    expect(terminal).toBe(builder);
    // The declaration narrows to PostgrestBuilder, while installed runtime
    // retains this object. A TS failure was not a demonstrated TypeError.
    expect(typeof Reflect.get(terminal, "abortSignal")).toBe("function");
    const result = await terminal;
    expect(result.error).toBeNull(); expect(result.data).toEqual(rows.profiles[0]);
    expect(state.transport).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled();
  });

  it("actual cloud hydration executes all five installed SDK read builders through mock transport", async () => {
    const storage = new Map([["coachfi-health-check", "synthetic health"], ["coachfi-consent-v1", "synthetic consent"]]);
    const localStorage = { getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } };
    vi.stubGlobal("window", { localStorage, sessionStorage: localStorage, dispatchEvent: vi.fn() }); vi.stubGlobal("localStorage", localStorage);
    const abort = new AbortController(), state = client(abort.signal);
    const owned = beginStorageOwner({ kind: "account", provider: "supabase", userId: "synthetic-A" });
    const guard = { userId: "synthetic-A", signal: abort.signal, storage: owned.storage,
      isCurrent: () => !abort.signal.aborted && owned.isCurrent() };
    expect(await syncOnLogin(state.db as unknown as Parameters<typeof syncOnLogin>[0], "synthetic-A", guard)).toBe(true);
    expect(state.transport).toHaveBeenCalledTimes(5);
    expect(JSON.parse(guard.storage.getItem("coachfi-user")!).name).toBe("Synthetic cloud profile");
    expect(guard.storage.getItem("coachfi-tokens")).toBe("88");
    expect(JSON.parse(guard.storage.getItem("coachfi-srs")!)[0].id).toBe("synthetic-question");
    expect(JSON.parse(guard.storage.getItem("coachfi-learn-manual")!)).toEqual({ "synthetic-stage": "started" });
    expect(storage.has("coachfi-user")).toBe(false); expect(storage.has("coachfi-tokens")).toBe(false);
    expect(storage.get("coachfi-health-check")).toBe("synthetic health"); expect(storage.get("coachfi-consent-v1")).toBe("synthetic consent");
    expect(fetch).not.toHaveBeenCalled();
  });
});
