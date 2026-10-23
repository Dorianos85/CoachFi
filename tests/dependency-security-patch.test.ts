import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { projectDependencySecurityPatchMetadata } from "./dependency-security-patch-admission";
import admission from "./fixtures/dependency-security-patch-admission.json";

const require = createRequire(import.meta.url);
const read = (file: string) => readFileSync(resolve(file), "utf8");
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const canonical = (value: unknown) => JSON.stringify(value, null, 2).replaceAll("\n", "\r\n") + "\r\n";
const names = ["vitest", "@vitest/expect", "@vitest/mocker", "@vitest/pretty-format",
  "@vitest/runner", "@vitest/snapshot", "@vitest/spy", "@vitest/utils"];
const nextNames = ["next","@next/env","@next/swc-darwin-arm64","@next/swc-darwin-x64","@next/swc-linux-arm64-gnu","@next/swc-linux-arm64-musl","@next/swc-linux-x64-gnu","@next/swc-linux-x64-musl","@next/swc-win32-arm64-msvc","@next/swc-win32-x64-msvc"];
const cohortNames = [...names, ...nextNames];
const reject = (file: string, raw: string) => expect(() => projectDependencySecurityPatchMetadata(file, raw)).toThrow(/strict metadata admission.*exact current later bytes/);
type Lock = { packages: Record<string, { version: string; resolved?: string; integrity?: string;
  dependencies?: Record<string, string>; devDependencies?: Record<string, string>; peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string> }>; [key: string]: unknown };

describe("exact Vitest 4.1.12 and Next 15.5.28 security backports and historical admission", () => {
  it("resolves all eight actual installed cohort packages at 4.1.12 while requiring the independently reviewed Next and Sharp patches", () => {
    const manifest = JSON.parse(read("package.json"));
    expect(manifest.devDependencies.vitest).toBe("4.1.12"); expect(manifest.dependencies.next).toBe("15.5.28");
    expect(manifest.overrides.sharp).toBe("0.35.5");
    expect(JSON.parse(readFileSync(resolve("node_modules/sharp/package.json"), "utf8")).version).toBe("0.35.5");
    for (const name of names) {
      const installed = JSON.parse(readFileSync(require.resolve(name + "/package.json"), "utf8"));
      expect({ name: installed.name, version: installed.version }).toEqual({ name, version: "4.1.12" });
    }
  });

  it("inverts the complete metadata and leaves every unrelated field and lock placement unchanged", () => {
    for (const record of admission.records) {
      const raw = read(record.path), projected = projectDependencySecurityPatchMetadata(record.path, raw);
      expect(projected).toBe(record.fullBefore); expect(hash(projected)).toBe(record.beforeSHA256);
      expect(hash(raw)).toBe(record.afterSHA256);
    }
    const oldManifest = JSON.parse(admission.records[0].fullBefore), manifest = JSON.parse(read("package.json"));
    manifest.devDependencies.vitest = oldManifest.devDependencies.vitest; manifest.dependencies.next = oldManifest.dependencies.next; expect(manifest).toEqual(oldManifest);
    const oldLock = JSON.parse(admission.records[1].fullBefore) as Lock, lock = JSON.parse(read("package-lock.json")) as Lock;
    expect(Object.keys(lock.packages)).toEqual(Object.keys(oldLock.packages));
    expect(admission.packageChanges.map(row => row.path)).toEqual(cohortNames.map(name => "node_modules/" + name));
    lock.packages[""].devDependencies!.vitest = oldLock.packages[""].devDependencies!.vitest;
    lock.packages[""].dependencies!.next = oldLock.packages[""].dependencies!.next;
    for (const name of cohortNames) lock.packages["node_modules/" + name] = oldLock.packages["node_modules/" + name];
    expect(lock).toEqual(oldLock);
  });

  it("rejects stale files, an extra byte and an unreviewed line-ending conversion", () => {
    for (const record of admission.records) {
      reject(record.path, record.fullBefore); reject(record.path, read(record.path) + " ");
      reject(record.path, read(record.path).replaceAll("\r\n", "\n"));
    }
  });

  it("rejects an unrelated manifest change, widened Vitest range or altered script/override", () => {
    for (const mutation of ["next", "range", "script", "override"] as const) {
      const value = JSON.parse(read("package.json"));
      if (mutation === "next") value.dependencies.next = "15.5.29";
      if (mutation === "range") value.devDependencies.vitest = "^4.1.12";
      if (mutation === "script") value.scripts.test += " --passWithNoTests";
      if (mutation === "override") value.overrides.sharp = "0.35.6";
      reject("package.json", canonical(value));
    }
  });

  it("rejects unrelated lock tuples, added or removed placements and a mismatched root pin", () => {
    for (const mutation of ["tuple", "add", "remove", "root"] as const) {
      const value = JSON.parse(read("package-lock.json")) as Lock;
      if (mutation === "tuple") value.packages["node_modules/next"].version = "15.5.29";
      if (mutation === "add") value.packages["node_modules/unreviewed"] = { version: "1.0.0" };
      if (mutation === "remove") delete value.packages["node_modules/react"];
      if (mutation === "root") value.packages[""].devDependencies!.vitest = "4.1.11";
      reject("package-lock.json", canonical(value));
    }
  });

  it("rejects a wrong version, archive origin or integrity for any retained cohort node", () => {
    for (const name of cohortNames) for (const field of ["version", "resolved", "integrity"] as const) {
      const value = JSON.parse(read("package-lock.json")) as Lock, node = value.packages["node_modules/" + name];
      node[field] = field === "version" ? (nextNames.includes(name) ? "15.5.27" : "4.1.11") : field === "resolved"
        ? String(node.resolved).replace("registry.npmjs.org", "synthetic.invalid") : "sha512-UNREVIEWED";
      reject("package-lock.json", canonical(value));
    }
  });

  it("rejects cohort edge drift including the upstream optional WebdriverIO peer range", () => {
    const original = JSON.parse(read("package-lock.json")) as Lock;
    expect(original.packages["node_modules/vitest"].peerDependencies!["@vitest/browser-webdriverio"]).toBe("^4.1.11");
    for (const mutation of ["dependency", "peer", "extra"] as const) {
      const value = structuredClone(original), node = value.packages["node_modules/vitest"];
      if (mutation === "dependency") node.dependencies!["@vitest/mocker"] = "4.1.11";
      if (mutation === "peer") node.peerDependencies!["@vitest/browser-webdriverio"] = "4.1.12";
      if (mutation === "extra") node.dependencies!["unreviewed"] = "1.0.0";
      reject("package-lock.json", canonical(value));
    }
  });


  it("resolves actual Next/env and the installed current-platform SWC package at 15.5.28", () => {
    for (const name of ["next", "@next/env"]) {
      const installed = JSON.parse(readFileSync(require.resolve(name + "/package.json"), "utf8"));
      expect({ name: installed.name, version: installed.version }).toEqual({ name, version: "15.5.28" });
    }
    const platformPrefix = "@next/swc-" + process.platform + "-" + process.arch + "-";
    const candidates = nextNames.filter(name => name.startsWith(platformPrefix));
    // Darwin's package has no ABI suffix; only exact current-platform names qualify.
    const darwin = "@next/swc-darwin-" + process.arch;
    if (process.platform === "darwin" && nextNames.includes(darwin)) candidates.push(darwin);
    const installed = candidates.filter(name => existsSync(resolve("node_modules", name, "package.json")));
    expect(installed.length).toBeGreaterThan(0);
    for (const name of installed) expect(JSON.parse(readFileSync(resolve("node_modules", name, "package.json"), "utf8")))
      .toMatchObject({ name, version: "15.5.28" });
  });

  it("rejects Next env/SWC edge, Sharp requirement and optional platform-flag drift", () => {
    for (const mutation of ["env", "swc", "sharp", "flag"] as const) {
      const value = JSON.parse(read("package-lock.json")) as Lock;
      const entry = value.packages["node_modules/next"];
      if (mutation === "env") entry.dependencies!["@next/env"] = "15.5.27";
      if (mutation === "swc") entry.optionalDependencies!["@next/swc-linux-x64-gnu"] = "15.5.27";
      if (mutation === "sharp") entry.optionalDependencies!.sharp = "^0.34.3 || ^0.35.4";
      if (mutation === "flag") Object.assign(value.packages["node_modules/@next/swc-win32-x64-msvc"], { optional: false });
      reject("package-lock.json", canonical(value));
    }
  });

  it("does not project unrelated historical source paths", () => {
    expect(projectDependencySecurityPatchMetadata("app/providers.tsx", "UNCHANGED\r\n")).toBe("UNCHANGED\r\n");
    expect(projectDependencySecurityPatchMetadata("postcss.config.mjs", "UNCHANGED\r\n")).toBe("UNCHANGED\r\n");
  });
});
