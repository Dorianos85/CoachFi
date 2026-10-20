import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Connection, PublicKey } from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cn } from "@/lib/utils";

const projectRequire = createRequire(import.meta.url);
const solanaRequire = createRequire(projectRequire.resolve("@solana/web3.js"));
type RpcRequest = { jsonrpc: string; method: string; params?: unknown[]; id: string };
type RpcResponse = { jsonrpc: string; id: string; result?: unknown; error?: { code: number; message: string } };
type BrowserClient = { request(method: string, params: unknown[]): RpcRequest };
const RpcClient = solanaRequire("jayson/lib/client/browser") as new (
  send: (message: string, callback: (error: Error | null, response?: string) => void) => void,
  options?: { generator?: () => string },
) => BrowserClient;
const ADDRESS = "11111111111111111111111111111111";
const ENDPOINT = "https://synthetic.invalid/never-requested";
const LIMITS = "Actual installed Solana/Jayson JSON-RPC client with an explicitly injected in-memory fetch. No DNS/socket/provider/auth/session/config discovery. Version and lock observations are local metadata, not advisory closure or real CDP login acceptance.";

function observed(name: string, value: unknown) {
  console.log("DEPENDENCY_UPGRADE_OBSERVATION", JSON.stringify({ name, value, limits: LIMITS }));
}

function distributionVersion(name: "@tailwindcss/postcss" | "tailwind-merge"): string {
  // Both packages intentionally do not export package.json. Their documented
  // CJS entries are in dist/, so read this exact adjacent metadata location.
  const metadata = JSON.parse(readFileSync(resolve(dirname(projectRequire.resolve(name)), "../package.json"), "utf8"));
  expect(metadata.name).toBe(name);
  return metadata.version;
}

function client(respond: (request: RpcRequest | RpcRequest[]) => string) {
  const requests: Array<{ url: string; method: string; body: RpcRequest | RpcRequest[] }> = [];
  const fakeFetch = vi.fn(async (input: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as RpcRequest | RpcRequest[];
    requests.push({ url: String(input), method: String(init?.method), body });
    return new Response(respond(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const connection = new Connection(ENDPOINT, {
    commitment: "confirmed", fetch: fakeFetch as typeof fetch,
    disableRetryOnRateLimit: true, httpAgent: false,
  });
  return { connection, requests, fakeFetch };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected dependency test network"); }));
});
afterEach(() => {
  expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("reviewed dependency upgrade actual consumer contracts", () => {
  it("resolves the exact upgraded client from retained Solana without the vulnerable lock nodes", () => {
    const lock = JSON.parse(readFileSync(resolve("package-lock.json"), "utf8")) as {
      packages: Record<string, { version?: string }>;
    };
    const names = Object.keys(lock.packages);
    const rejected = names.filter(name => /(?:^|\/)node_modules\/(?:braces|micromatch|fast-glob|chokidar|stream-json)$/.test(name));
    const uuid = names.filter(name => name.endsWith("node_modules/uuid"))
      .map(name => ({ name, version: lock.packages[name].version }));
    const actual = {
      solana: projectRequire("@solana/web3.js/package.json").version,
      jayson: solanaRequire("jayson/package.json").version,
      parser: projectRequire("postcss-selector-parser/package.json").version,
      tailwind: projectRequire("tailwindcss/package.json").version,
      tailwindPostcss: distributionVersion("@tailwindcss/postcss"),
      merge: distributionVersion("tailwind-merge"),
      rejected, uuid,
    };
    observed("exact-consumer-and-graph", actual);
    expect(actual).toMatchObject({ solana: "1.98.4", jayson: "5.0.0", parser: "7.1.6", tailwind: "4.3.3", tailwindPostcss: "4.3.3", merge: "3.6.0" });
    expect(rejected).toEqual([]);
    expect(uuid.length).toBeGreaterThan(0);
    for (const entry of uuid) expect(entry.version).toBe("11.1.1");
  });

  it("uses actual Solana balance requests and distinct generated IDs with only the injected transport", async () => {
    const { connection, requests, fakeFetch } = client(input => {
      const request = input as RpcRequest;
      return JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { context: { slot: 7 }, value: 12345 } });
    });
    const result = await Promise.all([connection.getBalance(new PublicKey(ADDRESS)), connection.getBalance(new PublicKey(ADDRESS))]);
    observed("actual-solana-balance", { result, requests });
    expect(result).toEqual([12345, 12345]);
    expect(fakeFetch).toHaveBeenCalledTimes(2);
    const ids = requests.map(({ url, method, body }) => {
      expect([url, method]).toEqual([ENDPOINT, "POST"]);
      expect(body).toMatchObject({ jsonrpc: "2.0", method: "getBalance", params: [ADDRESS, { commitment: "confirmed" }] });
      expect(Array.isArray(body)).toBe(false);
      const id = (body as RpcRequest).id;
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      return id;
    });
    expect(new Set(ids).size).toBe(2);
  });

  it("retains the actual Solana batch client IDs and callbacks without assuming response order", async () => {
    const { connection, requests } = client(input => JSON.stringify((input as RpcRequest[]).map(request => ({
      jsonrpc: "2.0", id: request.id, result: request.method === "getBlockHeight" ? 42 : 7,
    })).reverse()));
    // Erased access to the retained consumer's own batch adapter: this calls its
    // implementation, not a copied JSON-RPC client or a live Solana endpoint.
    const batch = connection as unknown as {
      _rpcBatchRequest(values: Array<{ methodName: string; args: unknown[] }>): Promise<RpcResponse[]>;
    };
    const result = await batch._rpcBatchRequest([
      { methodName: "getBlockHeight", args: [] }, { methodName: "getSlot", args: [] },
    ]);
    observed("actual-solana-batch", { requests, result });
    expect(requests).toHaveLength(1);
    const sent = requests[0].body as RpcRequest[];
    expect(sent.map(request => [request.jsonrpc, request.method, request.params])).toEqual([
      ["2.0", "getBlockHeight", []], ["2.0", "getSlot", []],
    ]);
    expect(new Set(sent.map(request => request.id)).size).toBe(2);
    expect(result).toEqual([
      { jsonrpc: "2.0", id: sent[1].id, result: 7 }, { jsonrpc: "2.0", id: sent[0].id, result: 42 },
    ]);
  });

  it("propagates a JSON-RPC refusal through the actual Solana API", async () => {
    const { connection, requests } = client(input => JSON.stringify({
      jsonrpc: "2.0", id: (input as RpcRequest).id, error: { code: -32000, message: "synthetic refusal" },
    }));
    let failure: unknown;
    try { await connection.getBalance(new PublicKey(ADDRESS)); } catch (error) { failure = error; }
    observed("actual-solana-error", { requests, failure: failure instanceof Error ? failure.message : null });
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain("synthetic refusal");
    expect(requests).toHaveLength(1);
  });

  it("rejects malformed response JSON through the actual consumer callback", async () => {
    const { connection, requests } = client(() => "{not JSON");
    let failure: unknown;
    try { await connection.getBalance(new PublicKey(ADDRESS)); } catch (error) { failure = error; }
    observed("actual-solana-invalid-json", { requests, error: failure instanceof Error ? failure.name : null });
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(/JSON|Unexpected|position|property/i);
    expect(requests).toHaveLength(1);
  });

  it("fails visibly without crypto while retaining the explicit generator contract", () => {
    vi.stubGlobal("crypto", undefined);
    const send = vi.fn(() => { throw new Error("Raw request must not send"); });
    const defaultClient = new RpcClient(send);
    expect(() => defaultClient.request("getSlot", [])).toThrow(/crypto.*unavailable/i);
    const injected = new RpcClient(send, { generator: () => "synthetic-explicit-id" });
    const request = injected.request("getSlot", []);
    observed("crypto-unavailable-and-generator", request);
    expect(request).toEqual({ method: "getSlot", jsonrpc: "2.0", params: [], id: "synthetic-explicit-id" });
    expect(send).not.toHaveBeenCalled();
  });

  it("retains actual cn class precedence with the Tailwind4-compatible merge implementation", () => {
    const actual = {
      background: cn("p-2 bg-primary/10", "p-4 bg-primary/20"),
      ring: cn("ring-1", "ring-[length:var(--cfx-ring-width)]"),
      shadow: cn("shadow-sm", "shadow-lg"),
    };
    observed("actual-class-merge", actual);
    expect(actual).toEqual({ background: "p-4 bg-primary/20", ring: "ring-[length:var(--cfx-ring-width)]", shadow: "shadow-lg" });
  });
});
