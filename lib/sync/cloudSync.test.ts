import { describe, expect, it, vi } from "vitest";
import { pushEntity } from "./cloudSync";

describe("local-only diagnosis cannot escape through the legacy sync bridge", () => {
  it.each([
    { score: 50, answers: { monthlyIncome: 4000 }, createdAt: "2026-10-14T00:00:00.000Z" },
    { schemaVersion: 2, source: "local_diagnosis", score: 50, answers: { monthlyIncome: 4000 } },
    { schemaVersion: 2, source: "legacy_recomputed", score: 50, answers: { monthlyIncome: 4000 } },
    null,
  ])("drops legacy/v2 health events before any database operation", async (payload) => {
    const from = vi.fn(() => { throw new Error("Unexpected database operation"); });
    const db = { from } as unknown as Parameters<typeof pushEntity>[0];
    await expect(pushEntity(db, "synthetic-test-user", "healthCheck", payload)).resolves.toBeUndefined();
    expect(from).not.toHaveBeenCalled();
  });

  it("does not inspect or serialize an untrusted financial payload", async () => {
    const payload = new Proxy({}, { get: () => { throw new Error("Unexpected payload access"); } });
    const from = vi.fn(() => { throw new Error("Unexpected database operation"); });
    const db = { from } as unknown as Parameters<typeof pushEntity>[0];
    await expect(pushEntity(db, "synthetic-test-user", "healthCheck", payload)).resolves.toBeUndefined();
    expect(from).not.toHaveBeenCalled();
  });
});
