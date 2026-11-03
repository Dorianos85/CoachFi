import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertSameOrigin, readJsonWithLimit } from "./api-security";

function req(headers: Record<string, string>, url = "https://coachfiai.com/api/chat") {
  return new Request(url, { method: "POST", headers });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://coachfiai.com");
  vi.stubEnv("VERCEL_URL", "");
  vi.stubEnv("VERCEL_BRANCH_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  vi.stubEnv("COACHFI_ALLOWED_ORIGINS", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("assertSameOrigin", () => {
  it("allows same-origin and configured app origins", () => {
    expect(() => assertSameOrigin(req({ origin: "https://coachfiai.com", host: "coachfiai.com" }))).not.toThrow();
    expect(() => assertSameOrigin(req({ origin: "https://www.coachfiai.com", host: "coachfiai.com" }))).not.toThrow();
    expect(() =>
      assertSameOrigin(req({ origin: "http://localhost:3301", host: "localhost:3301" }, "http://localhost:3301/api/tts")),
    ).not.toThrow();
  });

  it("allows Vercel preview hosts (same origin and VERCEL_* system URLs)", () => {
    const preview = "coachfi-git-fix-abc-dorian.vercel.app";
    expect(() =>
      assertSameOrigin(req({ origin: `https://${preview}`, host: preview }, `https://${preview}/api/chat`)),
    ).not.toThrow();
    vi.stubEnv("VERCEL_BRANCH_URL", "coachfi-git-main-dorian.vercel.app");
    expect(() =>
      assertSameOrigin(req({ origin: "https://coachfi-git-main-dorian.vercel.app", host: "coachfiai.com" })),
    ).not.toThrow();
  });

  it("allows extra origins from COACHFI_ALLOWED_ORIGINS", () => {
    vi.stubEnv("COACHFI_ALLOWED_ORIGINS", "https://beta.example.org, staging.example.org");
    expect(() => assertSameOrigin(req({ origin: "https://beta.example.org", host: "coachfiai.com" }))).not.toThrow();
    expect(() => assertSameOrigin(req({ origin: "https://staging.example.org", host: "coachfiai.com" }))).not.toThrow();
  });

  it("blocks foreign, look-alike and null origins", () => {
    expect(() => assertSameOrigin(req({ origin: "https://evil.example", host: "coachfiai.com" }))).toThrow();
    expect(() => assertSameOrigin(req({ origin: "https://coachfiai.com.evil.example", host: "coachfiai.com" }))).toThrow();
    expect(() => assertSameOrigin(req({ origin: "https://other-project.vercel.app", host: "coachfiai.com" }))).toThrow();
    expect(() => assertSameOrigin(req({ origin: "null", host: "coachfiai.com" }))).toThrow();
  });

  it("does not let requests without Origin bypass the check", () => {
    // curl / scripts: no Origin, no Fetch Metadata, no Referer.
    expect(() => assertSameOrigin(req({ host: "coachfiai.com" }))).toThrow("Cross-origin request blocked");
    // Cross-site navigation or no-cors request without Origin.
    expect(() => assertSameOrigin(req({ host: "coachfiai.com", "sec-fetch-site": "cross-site" }))).toThrow();
    expect(() => assertSameOrigin(req({ host: "coachfiai.com", "sec-fetch-site": "none" }))).toThrow();
    expect(() =>
      assertSameOrigin(req({ host: "coachfiai.com", referer: "https://evil.example/page" })),
    ).toThrow();
  });

  it("accepts same-origin GETs that browsers send without Origin", () => {
    expect(() => assertSameOrigin(req({ host: "coachfiai.com", "sec-fetch-site": "same-origin" }))).not.toThrow();
    // Older Safari: no Fetch Metadata, but a same-origin Referer.
    expect(() =>
      assertSameOrigin(req({ host: "coachfiai.com", referer: "https://coachfiai.com/coach" })),
    ).not.toThrow();
  });
});

describe("readJsonWithLimit", () => {
  it("counts bytes, not characters, and honours Content-Length", async () => {
    const body = JSON.stringify({ text: "ż".repeat(30) }); // 30 chars of 2 bytes each
    await expect(readJsonWithLimit(new Request("http://x", { method: "POST", body }), 50)).rejects.toThrow("Payload too large");
    await expect(readJsonWithLimit(new Request("http://x", { method: "POST", body }), 200)).resolves.toEqual({ text: "ż".repeat(30) });
    const declared = new Request("http://x", { method: "POST", body: "{}", headers: { "content-length": "999999" } });
    await expect(readJsonWithLimit(declared, 100)).rejects.toThrow("Payload too large");
  });
});
