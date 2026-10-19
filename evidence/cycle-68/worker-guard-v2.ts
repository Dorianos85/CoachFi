import { createRequire } from "node:module";
import { relative } from "node:path";
import { afterAll, expect, vi } from "vitest";

const db = vi.hoisted(() => ({ attempts: 0, fatal: process.exit.bind(process), deny: null as null | ((kind: string) => never) }));
// A denied DB call is durably recorded before throwing; setup failure cannot be caught into a green test.
vi.mock("@/lib/dev-db", () => {
  const deny = (kind: string): never => { db.attempts++; const writer = db.deny; if (!writer) { db.fatal(87); throw new Error("C68 database guard is not ready"); } return writer(kind); };
  return { getDevDb: () => deny("dev-db.getDevDb"), devDbPath: () => deny("dev-db.devDbPath") };
});
const install = createRequire(import.meta.url)("./network-guard-v2.cjs") as () => {
  attempts: string[]; runId: string;
  record: (event: { event: "worker-ready"; file: string; devDbDeny: true } | { event: "db-denial"; kind: string }) => void;
};
const state = install(), offset = state.attempts.length;
db.deny = (kind: string): never => { state.record({ event: "db-denial", kind }); throw new Error("C68 developer database access is disabled"); };
const file = relative(process.cwd(), expect.getState().testPath ?? "unknown").replaceAll("\\", "/");
state.record({ event: "worker-ready", file, devDbDeny: true });
process.stdout.write("C68_WORKER_GUARD_READY " + JSON.stringify({ file, pid: process.pid, runId: state.runId, devDbDeny: true }) + "\n");
afterAll(() => process.stdout.write("C68_WORKER_BOUNDARY " + JSON.stringify({ file, pid: process.pid, runId: state.runId, blockedNativeNetwork: state.attempts.slice(offset), blockedDevDb: db.attempts }) + "\n"));
process.once("exit", () => process.stdout.write("C68_WORKER_DB_EXIT " + JSON.stringify({ file, pid: process.pid, runId: state.runId, blockedDevDb: db.attempts }) + "\n"));
