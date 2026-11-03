import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ upsert }) }),
}));

let ipCounter = 0;

function request(body: unknown, init: { ip?: string; origin?: string; host?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  headers.set("x-forwarded-for", init.ip ?? `10.0.0.${++ipCounter}`);
  headers.set("host", init.host ?? "coachfiai.com");
  if (init.origin) headers.set("origin", init.origin);
  return new Request("https://coachfiai.com/api/leads", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/leads/route");
}

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  upsert.mockReset();
  upsert.mockResolvedValue({ error: null });
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("POST /api/leads", () => {
  it("stores email, locale, consent and score band only", async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      request({
        email: "  Alex@Example.org ",
        locale: "pl",
        marketingConsent: true,
        scoreBand: "0-39",
        source: "health-check",
        monthlyIncome: 4200,
        score: 28,
      }),
    );
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
    const [row, options] = upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "email" });
    expect(Object.keys(row).sort()).toEqual(
      ["email", "locale", "marketing_consent", "marketing_consent_at", "score_band", "source", "updated_at"].sort(),
    );
    expect(row.email).toBe("alex@example.org");
    expect(row.locale).toBe("pl");
    expect(row.marketing_consent).toBe(true);
    expect(typeof row.marketing_consent_at).toBe("string");
    expect(row.score_band).toBe("0-39");
    expect(JSON.stringify(row)).not.toContain("4200");
  });

  it("defaults marketing consent to false and drops unknown bands", async () => {
    const { POST } = await loadRoute();
    await POST(request({ email: "a@b.co", locale: "xx-yy-zz", scoreBand: "28" }));
    const [row] = upsert.mock.calls[0];
    expect(row.marketing_consent).toBe(false);
    expect(row.score_band).toBeNull();
    expect(row.locale).toBe("en");
  });

  it("rejects an invalid email", async () => {
    const { POST } = await loadRoute();
    const res = await POST(request({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const { POST } = await loadRoute();
    const res = await POST(request("{nope"));
    expect(res.status).toBe(400);
  });

  it("answers 503 when Supabase is not configured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { POST } = await loadRoute();
    const res = await POST(request({ email: "a@b.co" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, configured: false });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("blocks cross-origin posts", async () => {
    const { POST } = await loadRoute();
    const res = await POST(request({ email: "a@b.co" }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("rate-limits by IP", async () => {
    const { POST } = await loadRoute();
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      statuses.push((await POST(request({ email: `u${i}@b.co` }, { ip: "203.0.113.9" }))).status);
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
    expect((await POST(request({ email: "other@b.co" }, { ip: "203.0.113.10" }))).status).toBe(200);
  });

  it("returns a generic 500 when the insert fails", async () => {
    upsert.mockResolvedValue({ error: { code: "42P01", message: "relation leads does not exist" } });
    const { POST } = await loadRoute();
    const res = await POST(request({ email: "a@b.co" }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("relation");
  });
});
