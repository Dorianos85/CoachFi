import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { projectDependencySecurityPatchMetadata } from "./dependency-security-patch-admission";
import { GET as certificatesGet, POST as certificatesPost } from "@/app/api/certificates/route";
import { POST as mintPost } from "@/app/api/mint-nft/route";
import { GET as vaultGet } from "@/app/api/vault/route";
import { isFeatureEnabled, isRouteEnabled } from "@/lib/product-scope";

type Entry = { version?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }>; [key: string]: unknown };
type Lock = { packages: Record<string, Entry>; [key: string]: unknown };
type Snapshot = { before: { package: { fullText: string; sha256: string }; lock: { fullText: string; sha256: string };
  helper: { path: string; sha256: string } }; removedRootEdges: string[];
  independentGraph: { beforePackages: number; beforeReachable: number; afterReachable: number; exclusiveRemoved: number; sharedWitnesses: string[] };
  literalSourceWitnesses: Array<{ path: string; sha256: string }>; sourceScan: { roots: string[]; extensions: string[]; tokens: string[] } };
const traps = vi.hoisted(() => ({ authConfigured: vi.fn(() => { throw Error("C63 auth initialization forbidden"); }),
  verify: vi.fn(() => { throw Error("C63 auth/provider forbidden"); }), env: vi.fn(() => { throw Error("C63 provider environment access forbidden"); }),
  storeConfigured: vi.fn(() => { throw Error("C63 account store initialization forbidden"); }),
  getAccount: vi.fn(() => { throw Error("C63 data/provider forbidden"); }), deleteAccount: vi.fn(() => { throw Error("C63 data mutation forbidden"); }) }));
// These denied boundaries stay uncalled: the actual disabled routes import only their actual scope guard.
vi.mock("@/lib/cdp-server", () => ({ cdpAuthConfigured: traps.authConfigured, verifyCdpUser: traps.verify }));
vi.mock("@/lib/server-env", () => ({ getOptionalEnv: traps.env }));
vi.mock("@/lib/account-store", () => ({ accountStorageConfigured: traps.storeConfigured, getAccount: traps.getAccount, deleteAccount: traps.deleteAccount }));

const model = JSON.parse(readFileSync(resolve("evidence/cycle-63/validation-plan.json"), "utf8")) as Snapshot;
const originalPackage = JSON.parse(model.before.package.fullText) as Entry;
const originalLock = JSON.parse(model.before.lock.fullText) as Lock;
const ROOTS = ["@metaplex-foundation/mpl-core", "@metaplex-foundation/umi", "@metaplex-foundation/umi-bundle-defaults"] as const;
const GROUPS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"] as const;
const LIMITS = "Declared package/lock graph and bounded literal production-source inspection only, independently derived from frozen before JSON rather than author proposal. Conservative all-peer and nonoptional-peer ancestor closures distinguished; existing optionalDependencies retained in both, optional-annotated peers omitted only in required-consumer closure; not npm reification, semver compatibility, physical node_modules removal, clean install or advisory/CVE closure. Actual four deferred Web3 route methods and real guard/product-scope execute; no actual SDK/RPC/auth/account/provider or browser. Auth/store/env adapters and global fetch are deny traps, not simulated successful SDK clients. No real profiles, data, sessions, env values, provider keys or npm/network operations. Existing installed extraneous packages may remain, including YAML. Original conservative19 model remains immutable; revised20 admits YAML only after independent optional-peer/configuration assessment, not a second npm run. Current metadata additionally admits only C73 two scoped parser overrides and the retained parser version/resolved/integrity tuple through pinned immutable evidence; the independently derived C63 graph/removals and all other package/lock fields remain exact.";
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const readPackage = () => JSON.parse(historicalMetadata("package.json")) as Entry;
const readLock = () => JSON.parse(historicalMetadata("package-lock.json")) as Lock;
function removeRoots(entry: Entry) { const copy = structuredClone(entry); for (const name of ROOTS) delete copy.dependencies?.[name]; return copy; }

/** Node package lookup from the consumer's directory, including nested and scoped ancestors. Ranges are intentionally not solved here. */
function locate(packages: Record<string, Entry>, from: string, name: string): string | null {
  let directory = from;
  for (;;) {
    if (directory.split("/").at(-1) !== "node_modules") {
      const candidate = (directory ? directory + "/" : "") + "node_modules/" + name;
      if (Object.hasOwn(packages, candidate)) return candidate;
    }
    if (!directory) return null;
    const slash = directory.lastIndexOf("/"); directory = slash < 0 ? "" : directory.slice(0, slash);
  }
}
function graph(packages: Record<string, Entry>, root: Entry = packages[""], includeOptionalPeers = true) {
  const reachable = new Set<string>(), pending = [""], unresolved: Array<{ from: string; group: string; name: string; optionalPeer: boolean }> = [];
  for (let at = 0; at < pending.length; at++) {
    const consumer = pending[at]; if (reachable.has(consumer)) continue; reachable.add(consumer);
    const entry = consumer === "" ? root : packages[consumer];
    for (const group of GROUPS) for (const name of Object.keys(entry[group] ?? {})) {
      const optionalPeer = group === "peerDependencies" && entry.peerDependenciesMeta?.[name]?.optional === true;
      if (!includeOptionalPeers && optionalPeer) continue;
      const found = locate(packages, consumer, name);
      if (found === null) unresolved.push({ from: consumer, group, name, optionalPeer }); else if (!reachable.has(found)) pending.push(found);
    }
  }
  return { reachable: [...reachable].sort(), unresolved };
}
const beforeGraph = graph(originalLock.packages), projectedRoot = removeRoots(originalLock.packages[""]);
const conservativeGraph = graph(originalLock.packages, projectedRoot);
const requiredBeforeGraph = graph(originalLock.packages, originalLock.packages[""], false);
const expectedGraph = graph(originalLock.packages, projectedRoot, false);
const optionalPeerOnlyAfter = conservativeGraph.reachable.filter(path => !expectedGraph.reachable.includes(path));
const expectedRemoved = beforeGraph.reachable.filter(path => !expectedGraph.reachable.includes(path));
const expectedLock = structuredClone(originalLock); expectedLock.packages[""] = projectedRoot;
for (const path of expectedRemoved) delete expectedLock.packages[path];

// C73 is an explicit immutable follow-up; current files are observations, never the expected-state oracle.
type C73State = { path: string; beforeSHA256: string; afterSHA256: string; fullBefore: string; fullAfter: string };
const c73Text = readFileSync(resolve("evidence/cycle-73/dependency-change.json"), "utf8");
function admitC73(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error("C63/C73 strict metadata admission: " + label);
}
admitC73(sha(c73Text) === "9e2161040f9ff6a8a5cbe38431bdd39628ad2230d046eefbf76054ec4a8bc932", "immutable C73 evidence");
const c73 = JSON.parse(c73Text) as { cycle: string; changes: C73State[] };
admitC73(c73.cycle === "C73" && c73.changes.length === 3, "C73 identity and three metadata records");
const C73_PARSER_PATH = "node_modules/postcss-selector-parser";
const C73_PARSER_TUPLE = {
  version: "7.1.6",
  resolved: "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-7.1.6.tgz",
  integrity: "sha512-7qASPzhKF2l2KLboRZux8CCTRMdGiV08vWmyKzPz22qZ7ZjQBOeY7rNzNoCLSUiftJ7HUq0GERHmxw/t0dCdMw==",
};
const currentExpectedPackage = removeRoots(originalPackage);
currentExpectedPackage.overrides = { ...(currentExpectedPackage.overrides as Record<string, unknown>),
  tailwindcss: { "postcss-selector-parser": "7.1.6" }, "postcss-nested": { "postcss-selector-parser": "7.1.6" } };
const currentExpectedLock = structuredClone(expectedLock);
admitC73(Object.hasOwn(currentExpectedLock.packages, C73_PARSER_PATH), "existing retained parser placement");
currentExpectedLock.packages[C73_PARSER_PATH] = { ...currentExpectedLock.packages[C73_PARSER_PATH], ...C73_PARSER_TUPLE };
for (const [file, baseline, expected, beforePin, afterPin] of [
  ["package.json", removeRoots(originalPackage), currentExpectedPackage,
    "e99a76fceda4b293af26d414231bf373340d486968c807577e1307eac662f109", "679f4f2e960546799e8995715a5e3f7adba8c52792ddf92eecadf6823f5201b6"],
  ["package-lock.json", expectedLock, currentExpectedLock,
    "3f981656236872e8db5d21fafbd6edc7b0ecd92c3755abc8caa562cf7e94b703", "9637bfbc2cb2db77c7a0e8d33fd65bcd4fe6c565f39145ac36c61261f1e2f150"],
] as const) {
  const matches = c73.changes.filter(row => row.path === file);
  admitC73(matches.length === 1, "one evidence record for " + file);
  const state = matches[0]!;
  admitC73(state.beforeSHA256 === beforePin && state.afterSHA256 === afterPin
    && sha(state.fullBefore) === beforePin && sha(state.fullAfter) === afterPin, "whole metadata pins for " + file);
  admitC73(isDeepStrictEqual(JSON.parse(state.fullBefore), baseline), "independent C63 projection equals C73 before for " + file);
  admitC73(isDeepStrictEqual(JSON.parse(state.fullAfter), expected), "only exact C73 delta admitted for " + file);
}

// Keep the historical C63/C73 expected graph independent and intact. Invert
// only the exact later dependency migration and the separately accepted b162
// provider delta. Every current byte must match its reviewed fullAfter; unknown
// changes never become a wider ignore or an expected value read from current.
type LaterState = C73State & { reason: string };
type LockChange = { path: string; kind: "added" | "removed" | "changed"; before: Entry | null; after: Entry | null };
const laterText = readFileSync(resolve("tests/fixtures/dependency-upgrade-admission.json"), "utf8");
admitC73(sha(laterText) === "bfeb0f91ab6afb891723ab18747eb81832f26e704c00fba56e0b396bb5070044", "immutable finite later admission");
const later = JSON.parse(laterText) as { schemaVersion: number; records: LaterState[]; lockChanges: LockChange[] };
admitC73(later.schemaVersion === 1, "later schema");
admitC73(isDeepStrictEqual(later.records.map(row => row.path), ["package.json", "package-lock.json", "postcss.config.mjs", "app/providers.tsx"]), "only four explicit later paths");
const oldPins: Record<string, string> = {
  "package.json": "679f4f2e960546799e8995715a5e3f7adba8c52792ddf92eecadf6823f5201b6",
  "package-lock.json": "9637bfbc2cb2db77c7a0e8d33fd65bcd4fe6c565f39145ac36c61261f1e2f150",
  "postcss.config.mjs": "6ebe6241f8347bbea31480fed02d50db4b7232f4d0070dda3d231aa4a6b78ddc",
  "app/providers.tsx": "78fe7cbd3414532ef70f1066a74c48322d57ff8495d0ca060fc94c43515defa9",
};
for (const state of later.records) {
  admitC73(state.beforeSHA256 === oldPins[state.path] && sha(state.fullBefore) === state.beforeSHA256
    && sha(state.fullAfter) === state.afterSHA256, "full later bytes for " + state.path);
  admitC73(state.reason === (state.path === "app/providers.tsx"
    ? "PRIOR_ACCEPTED_ADULT_FAMILY_B162_NOT_THIS_DEPENDENCY_PATCH" : "DEPENDENCY_MIGRATION_2026_10_20"), "separate later scope");
}
function historicalMetadata(file: string, raw = readFileSync(resolve(file), "utf8")): string {
  raw = projectDependencySecurityPatchMetadata(file, raw);
  const state = later.records.find(row => row.path === file);
  admitC73(state && sha(raw) === state.afterSHA256 && raw === state.fullAfter, "exact current later bytes for " + file);
  return state.fullBefore;
}
const historicalPackage = JSON.parse(later.records[0].fullBefore);
const historicalLock = JSON.parse(later.records[1].fullBefore) as Lock;
admitC73(isDeepStrictEqual(historicalPackage, currentExpectedPackage), "later manifest inverse matches independent C63/C73 model");
admitC73(isDeepStrictEqual(historicalLock, currentExpectedLock), "later lock inverse matches independent C63/C73 model");
const upgradedLock = JSON.parse(later.records[1].fullAfter) as Lock;
const reversedLock = structuredClone(upgradedLock), seenPaths = new Set<string>();
for (const row of later.lockChanges) {
  admitC73(!seenPaths.has(row.path), "unique lock delta"); seenPaths.add(row.path);
  const old = historicalLock.packages[row.path] ?? null, next = upgradedLock.packages[row.path] ?? null;
  admitC73(isDeepStrictEqual(row.before, old) && isDeepStrictEqual(row.after, next), "whole lock entry transition " + row.path);
  admitC73(row.kind === (old === null ? "added" : next === null ? "removed" : "changed") && !isDeepStrictEqual(old, next), "nonempty correctly classified delta");
  if (row.before === null) delete reversedLock.packages[row.path]; else reversedLock.packages[row.path] = structuredClone(row.before);
}
admitC73(isDeepStrictEqual(reversedLock, historicalLock), "complete full-object lock inverse, including unrelated fields");
// This later route extraction is independently reviewed. Preserve the original
// witness only after exact current route AND gate bytes pass finite admission.
type AccountRouteAdmission = C73State & { schemaVersion: number; scope: string; commit: string;
  gate: { path: string; sha256: string; fullText: string } };
const accountRouteText = readFileSync(resolve("tests/fixtures/staging-account-route-admission.json"), "utf8");
function admitAccountRoute(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error("C63/account strict source admission: " + label);
}
admitAccountRoute(sha(accountRouteText) === "1dbd67f152c12fff6303dca8c09b6e3ac104f0d9e105836a2d247fe86dcd0800", "immutable account route admission");
const accountRoute = JSON.parse(accountRouteText) as AccountRouteAdmission;
admitAccountRoute(accountRoute.schemaVersion === 1 && accountRoute.scope === "REVIEWED_ACCOUNT_GATE_AND_EXPORT_2026_10_21"
  && accountRoute.commit === "6aa79f7df7cb62a236b55021d331faa4d76a154a" && accountRoute.path === "app/api/account/route.ts", "exact later scope");
admitAccountRoute(accountRoute.beforeSHA256 === "12d7e177976df007a7049e4042c4ede40a87020081b03414485899f1d6f1e33d"
  && sha(accountRoute.fullBefore) === accountRoute.beforeSHA256
  && model.literalSourceWitnesses.find(pin => pin.path === accountRoute.path)?.sha256 === accountRoute.beforeSHA256, "independent original route witness");
admitAccountRoute(accountRoute.afterSHA256 === "c206801887bf7fdbbeb6b5e8c7902b4d10545c04305cef9f3e34da313c60a50e"
  && sha(accountRoute.fullAfter) === accountRoute.afterSHA256 && accountRoute.gate.path === "lib/server/account-access.ts"
  && accountRoute.gate.sha256 === "71b849da8f4bb5d15e9af06adef494bafe70dcddbd7a55560c74b257cb92335b"
  && sha(accountRoute.gate.fullText) === accountRoute.gate.sha256, "reviewed route and extracted gate fingerprints");
function historicalAccountRoute(raw = readFileSync(resolve(accountRoute.path), "utf8"), gate = readFileSync(resolve(accountRoute.gate.path), "utf8")) {
  admitAccountRoute(raw === accountRoute.fullAfter && sha(raw) === accountRoute.afterSHA256, "exact current route bytes");
  admitAccountRoute(gate === accountRoute.gate.fullText && sha(gate) === accountRoute.gate.sha256, "exact current gate bytes");
  return accountRoute.fullBefore;
}
// Finite admission for the independently reviewed initial-read deadline only.
const deadlineText = readFileSync(resolve("tests/fixtures/account-sync-deadline-admission.json"), "utf8");
function admitAccountDeadline(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error("C63/deadline strict source admission: " + label);
}
admitAccountDeadline(sha(deadlineText) === "5389f9d25733e115d1281d3861d6a56d8ff81c1b33b8e408122957d47d12befd", "immutable deadline admission");
const deadline = JSON.parse(deadlineText) as { schemaVersion: number; scope: string; path: string;
  beforeSHA256: string; afterSHA256: string; fullBefore: string; changes: Array<{ before: string; after: string }> };
admitAccountDeadline(deadline.schemaVersion === 1
  && deadline.scope === "REVIEWED_INITIAL_ACCOUNT_READ_DEADLINE_2026_10_22"
  && deadline.path === "lib/account-sync.ts" && deadline.changes.length === 3, "exact finite deadline scope");
admitAccountDeadline(deadline.beforeSHA256 === "a0753a0105f28684c95fb83d73f2ccd349046250c26e07319b0e6d95efdf9317"
  && sha(deadline.fullBefore) === deadline.beforeSHA256
  && model.literalSourceWitnesses.find(row => row.path === deadline.path)?.sha256 === deadline.beforeSHA256,
  "unchanged historical account witness");
let deadlineExpected = deadline.fullBefore;
for (const change of deadline.changes) {
  admitAccountDeadline(change.before.length > 0 && deadlineExpected.split(change.before).length === 2,
    "unique reviewed deadline replacement");
  deadlineExpected = deadlineExpected.replace(change.before, change.after);
}
admitAccountDeadline(deadline.afterSHA256 === "5ff80296c17815be61ceb8c6aa95b8eed3c1aaafdc64292d798e79261b10422d"
  && sha(deadlineExpected) === deadline.afterSHA256, "only the reviewed deadline delta");
let deadlineInverse = deadlineExpected;
for (const change of deadline.changes.toReversed()) {
  admitAccountDeadline(change.after.length > 0 && deadlineInverse.split(change.after).length === 2,
    "unique reviewed deadline inverse");
  deadlineInverse = deadlineInverse.replace(change.after, change.before);
}
admitAccountDeadline(deadlineInverse === deadline.fullBefore && sha(deadlineInverse) === deadline.beforeSHA256,
  "complete historical deadline inverse");
function historicalAccountRead(raw = readFileSync(resolve(deadline.path), "utf8")): string {
  admitAccountDeadline(raw === deadlineExpected && sha(raw) === deadline.afterSHA256, "exact current deadline bytes");
  return deadline.fullBefore;
}
const readSourceWitness = (file: string) => file === deadline.path ? historicalAccountRead()
  : file === accountRoute.path ? historicalAccountRoute()
  : later.records.some(row => row.path === file) ? historicalMetadata(file) : readFileSync(resolve(file), "utf8");
function productionFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? productionFiles(path) : model.sourceScan.extensions.includes(extname(entry.name)) ? [path] : [];
  });
}
function observe(name: string, data: unknown) { console.log("C63_DEPENDENCY_OBSERVATION " + JSON.stringify({ name, data, limits: LIMITS,
  laterQualification: "C63/C73 graph counts, equality and optional YAML witnesses describe the independently reconstructed historical state. Current migration metadata must first match the pinned exact later fullAfter/inverse; actual current dependency behavior/closure is exercised in dependency-upgrade.test.ts. The separately admitted b162 provider delta predates this dependency patch." })); }
function noProvider() { for (const trap of Object.values(traps)) expect(trap).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); }

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_ENABLE_WEB3", "true");
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("C63 network/RPC forbidden"); })); });
afterEach(() => { noProvider(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("C63 minimal deferred chain dependency removal", () => {
  it("removes exactly the three dead runtime declarations while preserving all other package fields", () => {
    const actual = readPackage(), expected = currentExpectedPackage;
    observe("manifest-edges", { scope: "Historical C63/C73 projection after exact later inverse; not the current dependency versions", rootEdges: ROOTS.map(name => ({ name, before: originalPackage.dependencies?.[name], current: actual.dependencies?.[name] ?? null })),
      actualDependencies: actual.dependencies, originalSHA: sha(model.before.package.fullText), expectedModelSHA: model.before.package.sha256 });
    expect(sha(model.before.package.fullText)).toBe(model.before.package.sha256); expect(model.removedRootEdges).toEqual([...ROOTS]);
    expect(actual).toStrictEqual(expected);
  });

  it("prunes only independently exclusive lock entries and retains the complete CDP/Solana shared graph", () => {
    const actual = readLock(), actualPaths = Object.keys(actual.packages).sort(), originalPaths = Object.keys(originalLock.packages).sort();
    const removed = originalPaths.filter(path => !Object.hasOwn(actual.packages, path)), added = actualPaths.filter(path => !Object.hasOwn(originalLock.packages, path));
    const retainedChanges = actualPaths.filter(path => path !== "" && Object.hasOwn(originalLock.packages, path) && !isDeepStrictEqual(actual.packages[path], originalLock.packages[path]));
    const currentGraph = graph(actual.packages), expectedConservativeCurrent = graph(expectedLock.packages);
    const yamlIncoming = Object.entries(actual.packages).flatMap(([from, entry]) => GROUPS.flatMap(group => entry[group]?.yaml === undefined ? [] : [{
      from, group, range: entry[group]!.yaml, optionalPeer: group === "peerDependencies" && entry.peerDependenciesMeta?.yaml?.optional === true,
    }])).sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : 0);
    const missingYaml = currentGraph.unresolved.filter(edge => edge.name === "yaml").sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : 0);
    observe("lock-graph", { scope: "Historical C63/C73 projection after exact later inverse", observedCurrentEntries: Object.keys(upgradedLock.packages).length, beforeEntries: originalPaths.length, beforeReachable: beforeGraph.reachable.length, originalConservativeAfter: conservativeGraph.reachable.length,
      requiredBefore: requiredBeforeGraph.reachable.length, expectedRequiredAfter: expectedGraph.reachable.length, optionalPeerOnlyAfter,
      currentEntries: actualPaths.length, currentReachable: currentGraph.reachable.length, expectedRemoved: expectedRemoved.map(path => ({ path, version: originalLock.packages[path].version })),
      actualRemoved: removed, added, retainedChanges, unresolvedBefore: beforeGraph.unresolved.length,
      expectedConservativeUnresolvedAfter: expectedConservativeCurrent.unresolved.length, unresolvedCurrent: currentGraph.unresolved.length, yamlIncoming, missingYaml,
      shared: model.independentGraph.sharedWitnesses.map(path => ({ path, present: Object.hasOwn(actual.packages, path), literal: isDeepStrictEqual(actual.packages[path], originalLock.packages[path]) })) });
    expect(sha(model.before.lock.fullText)).toBe(model.before.lock.sha256); expect(beforeGraph.reachable).toEqual(originalPaths);
    expect([originalPaths.length, conservativeGraph.reachable.length, requiredBeforeGraph.reachable.length, expectedGraph.reachable.length, expectedRemoved.length]).toEqual([628, 609, 628, 608, 20]);
    expect(optionalPeerOnlyAfter).toEqual(["node_modules/yaml"]);
    expect(added).toEqual([]); expect(retainedChanges).toEqual([C73_PARSER_PATH]); expect(removed).toEqual(expectedRemoved);
    expect(actual).toStrictEqual(currentExpectedLock); expect(currentGraph.reachable).toEqual(actualPaths);
    expect([beforeGraph.unresolved.length, expectedConservativeCurrent.unresolved.length, currentGraph.unresolved.length]).toEqual([50, 52, 52]);
    const yamlConsumers = ["node_modules/postcss-load-config", "node_modules/vite"];
    expect(yamlIncoming).toEqual(yamlConsumers.map(from => ({ from, group: "peerDependencies", range: "^2.4.2", optionalPeer: true })));
    expect(missingYaml).toEqual(yamlConsumers.map(from => ({ from, group: "peerDependencies", name: "yaml", optionalPeer: true })));
    for (const path of model.independentGraph.sharedWitnesses) expect(actual.packages[path]).toStrictEqual(originalLock.packages[path]);
  });

  it("removes the uncalled helper without changing active CDP or the disabled route policy", () => {
    const files = model.sourceScan.roots.flatMap(root => productionFiles(resolve(root)));
    const references = files.flatMap(path => {
      const name = relative(process.cwd(), path).replaceAll("\\", "/"); if (name === model.before.helper.path) return [];
      const source = readFileSync(path, "utf8"); return model.sourceScan.tokens.filter(token => source.includes(token)).map(token => ({ path: name, token }));
    });
    const configPins = [
      { path: "postcss.config.mjs", sha256: "6ebe6241f8347bbea31480fed02d50db4b7232f4d0070dda3d231aa4a6b78ddc" },
      { path: "vitest.config.ts", sha256: "71efb74ff79bc8a66be70cfa69ff9f2933fe7519e010e9178351a12e9a52597c" },
    ];
    const witnesses = [...model.literalSourceWitnesses, ...configPins].map(pin => ({ ...pin, actualSHA: sha(readSourceWitness(pin.path)),
      qualification: pin.path === deadline.path ? "Exact reviewed account deadline inverse; current bytes also checked"
        : pin.path === accountRoute.path ? "Exact reviewed account route inverse; current route and extracted gate bytes both checked"
        : later.records.some(row => row.path === pin.path) ? "Exact pinned later inverse; current bytes also checked" : "Literal current source" }));
    const yamlConfigs = [".postcssrc", ".postcssrc.yaml", ".postcssrc.yml", "postcss.config.yaml", "postcss.config.yml",
      "vite.config.yaml", "vite.config.yml", "vitest.config.yaml", "vitest.config.yml"].filter(path => existsSync(resolve(path)));
    observe("dead-helper-and-source-boundary", { helperExists: existsSync(resolve(model.before.helper.path)), helperOriginalSHA: model.before.helper.sha256,
      scannedSourceFiles: files.length, roots: model.sourceScan.roots, literalReferences: references, witnesses, yamlConfigs,
      optionalYamlQualification: "Existing MJS PostCSS and TS Vitest configs pinned; installed YAML loader imports lazily for YAML configuration. This is a bounded config admission, not physical parser absence or clean-install proof." });
    expect(existsSync(resolve(model.before.helper.path))).toBe(false); expect(references).toEqual([]); expect(yamlConfigs).toEqual([]);
    for (const pin of witnesses) expect(pin.actualSHA).toBe(pin.sha256);
    expect(isFeatureEnabled("web3")).toBe(false); for (const href of ["/vault", "/vault/nested?synthetic=1", "/achievement"]) expect(isRouteEnabled(href)).toBe(false);
  });

  it("admits only the reviewed account deadline and refuses stale, extended, extra-byte or write changes", () => {
    expect(historicalAccountRead()).toBe(deadline.fullBefore);
    const mutations = [deadline.fullBefore,
      deadlineExpected.replace("30_000", "30_001"), deadlineExpected + " ",
      deadlineExpected.replace('method: "GET"', 'method: "PUT"')];
    for (const raw of mutations) {
      expect(raw).not.toBe(deadlineExpected);
      expect(() => historicalAccountRead(raw)).toThrow(/exact current deadline bytes/);
    }
  });

  it("refuses unreviewed manifest or lock mutations instead of widening the historical admission", () => {
    for (const file of ["package.json", "package-lock.json"]) {
      const raw = readFileSync(resolve(file), "utf8");
      expect(() => historicalMetadata(file, raw + " ")).toThrow(/exact current later bytes/);
      const changed = JSON.parse(raw) as { version: string };
      changed.version = "unreviewed-synthetic-version";
      expect(() => historicalMetadata(file, JSON.stringify(changed))).toThrow(/exact current later bytes/);
    }
  });

  it("refuses any unreviewed account route or extracted gate instead of replacing the old witness", () => {
    expect(sha(historicalAccountRoute())).toBe("12d7e177976df007a7049e4042c4ede40a87020081b03414485899f1d6f1e33d");
    expect(() => historicalAccountRoute(accountRoute.fullAfter + " ", accountRoute.gate.fullText)).toThrow(/exact current route bytes/);
    expect(() => historicalAccountRoute(accountRoute.fullBefore, accountRoute.gate.fullText)).toThrow(/exact current route bytes/);
    expect(() => historicalAccountRoute(accountRoute.fullAfter, accountRoute.gate.fullText + " ")).toThrow(/exact current gate bytes/);
    expect(() => historicalAccountRoute(accountRoute.fullAfter, "unreviewed gate")).toThrow(/exact current gate bytes/);
  });
});

describe("C63 unchanged actual deferred Web3 routes deny before provider boundaries", () => {
  const methods: Array<[string, (request: Request) => Promise<Response>]> = [
    ["certificates GET", certificatesGet], ["certificates POST", certificatesPost], ["mint POST", mintPost], ["vault GET", vaultGet],
  ];
  it.each(methods)("%s stays literal disabled despite spoofed authorization and enable flag", async (name, handler) => {
    const method = name.endsWith("GET") ? "GET" : "POST";
    const request = new Request("https://synthetic.invalid/api/c63", { method, headers: { authorization: "Bearer synthetic.payload.signature",
      "x-user-id": "C63-synthetic-owner", "x-coachfi-consent": "blockchain", "content-type": "application/json" },
      body: method === "POST" ? '{"consent":true,"owner":"C63-synthetic-owner"}' : undefined });
    const response = await handler(request), body: unknown = await response.json();
    observe("route-" + name, { status: response.status, body, cache: response.headers.get("cache-control"), web3Enabled: isFeatureEnabled("web3"),
      authCalls: traps.verify.mock.calls.length, configuredCalls: traps.authConfigured.mock.calls.length, providerEnvCalls: traps.env.mock.calls.length,
      storeCalls: traps.getAccount.mock.calls.length, fetchCalls: vi.mocked(fetch).mock.calls.length });
    expect(response.status).toBe(404); expect(body).toStrictEqual({ ok: false, code: "FEATURE_DISABLED", error: "This feature is not available in the current release." });
    expect(response.headers.get("cache-control")).toBe("no-store"); expect(isFeatureEnabled("web3")).toBe(false); noProvider();
  });
});
