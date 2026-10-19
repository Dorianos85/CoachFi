import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as chat } from "@/app/api/chat/route";
import { POST as tts } from "@/app/api/tts/route";
import { POST as token } from "@/app/api/mila-token/route";

const auth = vi.hoisted(() => ({
  configured: vi.fn(() => true),
  verify: vi.fn(async () => { throw new Error("Synthetic verifier rejects a forged token."); }),
}));
vi.mock("@/lib/cdp-server", () => ({ cdpAuthConfigured: auth.configured, verifyCdpUser: auth.verify }));

let outbound: ReturnType<typeof vi.fn>;
beforeEach(() => {
  auth.configured.mockClear();
  auth.verify.mockClear();
  outbound = vi.fn(() => { throw new Error("No external call is authorized in this review test."); });
  vi.stubGlobal("fetch", outbound);
});
afterEach(() => {
  expect(outbound).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("independent review: hard-off precedes the configured auth SDK", () => {
  const handlers: Array<[string, (req: Request) => Promise<Response>, unknown]> = [
    ["chat", chat, { mode: "external", message: "saving" }],
    ["TTS", tts, { text: "Synthetic educational text" }],
    ["conversation token", token, {}],
  ];
  it.each(handlers)("%s rejects a syntactically valid forged token without SDK validation", async (_, handler, body) => {
    const req = new Request("https://coachfi.example/api/review", {
      method: "POST",
      headers: { authorization: "Bearer forged.payload.signature", "x-coachfi-consent": "voice", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const response = await handler(req);
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("EXTERNAL_AI_DISABLED");
    expect(auth.configured).not.toHaveBeenCalled();
    expect(auth.verify).not.toHaveBeenCalled();
  });
});
