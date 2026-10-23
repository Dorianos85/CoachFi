import { describe, expect, it, vi } from "vitest";
import { assertSameOrigin, rateLimit, readJsonWithLimit } from "@/lib/api-security";

function request(headers: HeadersInit = {}, body?: string) {
  return new Request("https://coachfi.example/api/test", { method: "POST", headers, body });
}

describe("canonical origin", () => {
  it("uses the URL origin instead of spoofable host/forwarding headers", () => {
    expect(() => assertSameOrigin(request({ origin: "https://evil.example", host: "evil.example", "x-forwarded-host": "evil.example" }))).toThrow("Cross-origin");
    expect(() => assertSameOrigin(request({ origin: "https://coachfi.example", host: "evil.example" }))).not.toThrow();
  });
  it.each(["http://coachfi.example", "https://coachfi.example:444", "null", "malformed", "https://coachfi.example/path"])("rejects noncanonical origin %s", (origin) => {
    expect(() => assertSameOrigin(request({ origin }))).toThrow("Cross-origin");
  });
  it("rejects a cross-site fetch even when origin is absent", () => {
    expect(() => assertSameOrigin(request({ "sec-fetch-site": "cross-site" }))).toThrow("Cross-origin");
  });
  it("allows an originless request without treating it as authentication", () => {
    expect(() => assertSameOrigin(request())).not.toThrow();
  });
});

describe("streaming JSON byte cap", () => {
  it("accepts exactly the UTF-8 byte limit and rejects the same JSON one byte below it", async () => {
    const json = JSON.stringify({ text: "ą🙂" });
    const bytes = new TextEncoder().encode(json).byteLength;
    await expect(readJsonWithLimit(request({}, json), bytes)).resolves.toEqual({ text: "ą🙂" });
    await expect(readJsonWithLimit(request({}, json), bytes - 1)).rejects.toThrow("Payload too large");
  });
  it("handles Unicode split across chunks and stops before reading an oversized tail", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ text: "🙂" }));
    const chunks = [bytes.slice(0, 10), bytes.slice(10)];
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); },
      cancel,
    });
    const req = new Request("https://coachfi.example", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    await expect(readJsonWithLimit(req, bytes.length)).resolves.toEqual({ text: "🙂" });
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(20)); },
      cancel,
    });
    await expect(readJsonWithLimit(new Request("https://coachfi.example", { method: "POST", body: oversized, duplex: "half" } as RequestInit), 10)).rejects.toThrow("Payload too large");
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("does not trust a small declared Content-Length over streamed bytes", async () => {
    await expect(readJsonWithLimit(request({ "content-length": "1" }, '{"text":"ąąą"}'), 8)).rejects.toThrow("Payload too large");
  });
  it("preserves the overflow error even when stream cancellation fails", async () => {
    const cancel = vi.fn(() => { throw new Error("synthetic cancellation error"); });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(20)); },
      cancel,
    });
    const req = new Request("https://coachfi.example", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    await expect(readJsonWithLimit(req, 10)).rejects.toThrow("Payload too large");
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("rejects a declared oversized body before consuming it", async () => {
    await expect(readJsonWithLimit(request({ "content-length": "10000" }, "{}"), 10)).rejects.toThrow("Payload too large");
  });
  it("rejects malformed JSON and invalid UTF-8", async () => {
    await expect(readJsonWithLimit(request({}, "{"), 10)).rejects.toThrow();
    const body = new Uint8Array([0xff]);
    await expect(readJsonWithLimit(new Request("https://coachfi.example", { method: "POST", body }), 10)).rejects.toThrow();
  });
});

describe("local load shedding", () => {
  it("spoofed IP headers cannot create fresh rate buckets", () => {
    rateLimit(request({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "1.1.1.1" }), "test-spoof", 1);
    expect(() => rateLimit(request({ "x-forwarded-for": "2.2.2.2", "x-real-ip": "2.2.2.2" }), "test-spoof", 1)).toThrow("Too many requests");
  });
});
