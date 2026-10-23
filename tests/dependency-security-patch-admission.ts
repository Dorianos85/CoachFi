import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

type Entry = { version?: string; resolved?: string; integrity?: string;
  dependencies?: Record<string, string>; devDependencies?: Record<string, string>; optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>; [key: string]: unknown };
type Lock = { packages: Record<string, Entry>; [key: string]: unknown };
type RecordState = { path: string; beforeSHA256: string; afterSHA256: string; fullBefore: string };
type Patch = { schemaVersion: number; scope: string; baseCommit: string; versionBefore: { next: string; vitest: string }; versionAfter: { next: string; vitest: string };
  records: RecordState[]; packageChanges: Array<{ name: string; path: string; before: Entry; after: Entry }> };
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error("C63/dependency strict metadata admission: " + message);
}
const text = readFileSync(resolve("tests/fixtures/dependency-security-patch-admission.json"), "utf8");
check(sha(text) === "e06f8d59c571f3770582aaf782877724b4b764eb9ae80c5e6dc28dc10fed56ef", "immutable patch receipt");
const patch = JSON.parse(text) as Patch;
check(patch.schemaVersion === 1 && patch.scope === "REVIEWED_NEXT_15_5_28_VITEST_4_1_12_BACKPORT_2026_10_23"
  && patch.baseCommit === "d1f4eb0c17fcbd995a0d374a44b6fb78ffa97475"
  && patch.versionBefore.next === "15.5.27" && patch.versionAfter.next === "15.5.28"
  && patch.versionBefore.vitest === "4.1.11" && patch.versionAfter.vitest === "4.1.12", "exact patch identity");
check(isDeepStrictEqual(patch.records.map(row => row.path), ["package.json", "package-lock.json"]), "two exact metadata paths");
const records = patch.records;
const pins = [
  ["880284057e48158240e1ee65da58f5a1b6680ee482c81f7c6d91404d5afffe06", "e82331da939c7d7a3361f9a90f6d1420b00c498c00728a817c333a9ce55fa138"],
  ["7da5a471776e4dc29978cae8cd171cd9fb50d6f1fec9220f4aa03746e7b56b12", "38239fb1bdec3e0044a3629e767741ffe65f72d2699e4fb9f4abca27563ce065"],
];
for (const [index, record] of records.entries()) {
  check(record.beforeSHA256 === pins[index][0] && record.afterSHA256 === pins[index][1]
    && sha(record.fullBefore) === record.beforeSHA256, "whole archived metadata " + record.path);
}
// Fixed official npm integrity values, independently checked against the
// Vitest 4.1.12 and Next/env/SWC 15.5.28 technical metadata receipts. Expected state never comes from live files.
const integrity = {
  vitest: "sha512-5eWdz2yb3ajxWF3C8C4TjkXl7FGm3n2E/VlazALrQHzK7nYMSGFnCZto0bbPNl77AwkOZVLk0YnBAejUu0NiWA==",
  "@vitest/expect": "sha512-vFlTt+YEu9WBpNjdGayNmlMVzrWPi1+sv853/7t2FU7hpO5gAFBKHzQmkCq5Xjpr+evegF2994LQT3hF3mRlqQ==",
  "@vitest/mocker": "sha512-fKShNpKZzupWZuY0z7egydvL0sqW4INEZBEExMBMAa6izlENEVHwoXgdaTCaBZ5fwlr4xf2o1wXC83n9RpO+NA==",
  "@vitest/pretty-format": "sha512-XW9O8+Mxx4VpCtkYdMJLZQQwsVryP9wk7cPKDxtXFfwSak6yRh5+2fep/Y0XF/ElBvJHq8bcYdi6aeuai0opZA==",
  "@vitest/runner": "sha512-NKlVKCr5QnCe8jijdMnmkpHHU+WTqiLFR6G0pHji9uRjXK9xJl1k1nTw6F3pOOj2PDcsDt2GKQMI7wIsaT491w==",
  "@vitest/snapshot": "sha512-ko1y1Qgb/slzQ9mr+b89Cuqud8WG1TKtsPD8r7ZUBdvVOGt85Af2HwCqHujrhwJq95hs/9RM7fcAPg57o1vlzw==",
  "@vitest/spy": "sha512-RGq9x4JNGNTZHEJxvN0oSiJjeSCExm0n2gZKKJZHY9cX5AVA6M7VJILBT3ZJ/tJ/0J9uWT7fETV9/btoi//vSg==",
  "@vitest/utils": "sha512-Q3awXrwOfEV+qc3WmO5ONyE0yO7Q1gQ9/oyHxGLZ/pl7N3NO/ZztqQwKLuwMkV+CA1JYSIeO3gkHnRDIo4AVaA==",
  "next": "sha512-JjhLBBY1PNnuwPtcZ7t8yxVeJVYvD2Jyp633J+gRCNbzSt7N0E+xqCf6uQiff3+3qmUkwcF/ksfSsK1xsZ76Tw==",
  "@next/env": "sha512-xxW5EBI8fMPuVTPBW7LL980IRbuDXlbkUAwp9DDhtb4Lnich3nJ13uYpvrX4VE74hWPf6AvHHAMmGCidcHjbfg==",
  "@next/swc-darwin-arm64": "sha512-dPoQYXcfSIqx5o+TOXVXO7kONK5qbtNRDeiTfII0bT3puGIT6VF5e0QwmxNZfEZ5Zety5f3m9P/p4xqwfiLlPg==",
  "@next/swc-darwin-x64": "sha512-RgCJ7buBivTH+6sddqaVm+/v8kwMHlFkobvdt3DfETutws5HrxnToMIWSN9X3MZ3aAi7BbKrGZZWUDQLEycXqw==",
  "@next/swc-linux-arm64-gnu": "sha512-OHXQe13olE59aKe++zHavGcJPh5SLHXi6Anret3BBeq1+qhSuOJDNAli/EDDfxs6UTqA4Qddo4uyYry2slyjiQ==",
  "@next/swc-linux-arm64-musl": "sha512-nTB7bB6vfn4ezCJNYP43ukt2o8L3+WxKF/sTcTxepdXsJh3SM9RhlU7wrZYbH7L4HO5M87dqDTwm8587vAkCiw==",
  "@next/swc-linux-x64-gnu": "sha512-WXCfVI32rW3xCusoUX1RpZKtyChWU2Zwe27JUDmM3KrXwcDNc9vV4zEq0GKFAURnuQ/Ouo/XqPvB0yh445XZCg==",
  "@next/swc-linux-x64-musl": "sha512-Miq+NDb/HWsXuxseYxMM6fuEOQXgTziarkKIRpVKCn8W69cEfhQaQr+90pO+u4q2CbJR2wzXmUuCFyZaJs/Nng==",
  "@next/swc-win32-arm64-msvc": "sha512-5LR79lemgDlgxvG7MQJ+zHCkVcrUoQuO7CiIvq3I58vNW4goSOE2b+19Z6FujRWMouvni4gvudYFuFuNxolGWA==",
  "@next/swc-win32-x64-msvc": "sha512-GNipvXUYROSTf4PXEyH95FrWImIB5zdaK6uEOg0RP1/X2drnvoMwiBkJ0VWdzX7w3iiBm3y5g2TxkKDGVTOQcg==",
};
const names = Object.keys(integrity) as Array<keyof typeof integrity>;
check(isDeepStrictEqual(patch.packageChanges.map(row => row.name), names), "only eighteen retained cohort packages");
const beforeManifest = JSON.parse(records[0].fullBefore) as Entry;
const beforeLock = JSON.parse(records[1].fullBefore) as Lock;
const manifest = structuredClone(beforeManifest), lock = structuredClone(beforeLock);
check(manifest.devDependencies?.vitest === "4.1.11"
  && manifest.dependencies?.next === "15.5.27" && lock.packages[""].devDependencies?.vitest === "4.1.11", "retained manifest baseline");
manifest.devDependencies.vitest = "4.1.12";
manifest.dependencies!.next = "15.5.28";
lock.packages[""].devDependencies!.vitest = "4.1.12";
lock.packages[""].dependencies!.next = "15.5.28";
for (const [index, name] of names.entries()) {
  const location = "node_modules/" + name, original = beforeLock.packages[location];
  const nextCohort = name === "next" || name.startsWith("@next/");
  const version = nextCohort ? "15.5.28" : "4.1.12";
  check(original?.version === (nextCohort ? "15.5.27" : "4.1.11"), "retained cohort location " + name);
  const expected = structuredClone(original), leaf = name.split("/").at(-1);
  Object.assign(expected, { version,
    resolved: `https://registry.npmjs.org/${name}/-/${leaf}-${version}.tgz`, integrity: integrity[name] });
  for (const group of ["dependencies", "peerDependencies", "optionalDependencies"] as const) {
    for (const [edge, old] of Object.entries(expected[group] ?? {})) {
      if (edge.startsWith("@vitest/") && old === "4.1.11") {
        expected[group]![edge] = group === "peerDependencies" && edge === "@vitest/browser-webdriverio" ? "^4.1.11" : "4.1.12";
      } else if (name === "next" && edge.startsWith("@next/") && old === "15.5.27") {
        expected[group]![edge] = "15.5.28";
      } else if (name === "next" && group === "optionalDependencies" && edge === "sharp") {
        expected[group]![edge] = "^0.34.3 || ^0.35.5";
      }
    }
  }
  const receipt = patch.packageChanges[index];
  check(receipt.path === location && isDeepStrictEqual(receipt.before, original)
    && isDeepStrictEqual(receipt.after, expected), "only exact official cohort transition " + name);
  lock.packages[location] = expected;
}
const canonical = (value: unknown) => JSON.stringify(value, null, 2).replaceAll("\n", "\r\n") + "\r\n";
const expected = [canonical(manifest), canonical(lock)];
for (const [index, value] of expected.entries()) check(sha(value) === records[index].afterSHA256, "complete derived patch bytes");

/** Invert only this pinned patch before the unchanged C63 historical graph. */
export function projectDependencySecurityPatchMetadata(file: string, raw: string): string {
  const index = records.findIndex(row => row.path === file);
  if (index < 0) return raw;
  check(raw === expected[index] && sha(raw) === records[index].afterSHA256, "exact current later bytes for " + file);
  return records[index].fullBefore;
}
