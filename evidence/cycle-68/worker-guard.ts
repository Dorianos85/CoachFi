import { createRequire } from "node:module";
import { relative } from "node:path";
import { afterAll, expect, vi } from "vitest";

const db = vi.hoisted(() => ({ attempts: 0 }));
// A call fails loudly instead of opening existing or new developer database contents.
vi.mock("@/lib/dev-db", () => ({
  getDevDb: () => { db.attempts++; throw new Error("C68 developer database access is disabled"); },
  devDbPath: () => { db.attempts++; throw new Error("C68 developer database path access is disabled"); },
}));
const install = createRequire(import.meta.url)("./network-guard.cjs") as () => { attempts: string[] };
const state = install(), offset = state.attempts.length;
const file = relative(process.cwd(), expect.getState().testPath ?? "unknown").replaceAll("\\", "/");
process.stdout.write("C68_WORKER_GUARD_READY " + JSON.stringify({ file, pid: process.pid, devDbDeny: true }) + "\n");
afterAll(() => process.stdout.write("C68_WORKER_BOUNDARY " + JSON.stringify({ file, pid: process.pid, blockedNativeNetwork: state.attempts.slice(offset), blockedDevDb: db.attempts }) + "\n"));
process.once("exit", () => process.stdout.write("C68_WORKER_DB_EXIT " + JSON.stringify({ file, pid: process.pid, blockedDevDb: db.attempts }) + "\n"));
