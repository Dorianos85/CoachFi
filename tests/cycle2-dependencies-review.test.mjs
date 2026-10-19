import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const { satisfies } = createRequire(import.meta.url)("semver");

// Independent acceptance checks: package metadata only, no network, secrets or
// application/provider initialization. Run after the author's npm install ends.
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8"));

function versionParts(version) {
  assert.match(version, /^\d+\.\d+\.\d+$/, "Acceptance expects stable SemVer metadata.");
  return version.split(".").map(Number);
}
function atLeast(version, minimum) {
  const actual = versionParts(version);
  const lower = versionParts(minimum);
  for (let index = 0; index < 3; index++) {
    if (actual[index] !== lower[index]) return actual[index] > lower[index];
  }
  return true;
}
function instances(name) {
  return Object.entries(lock.packages).filter(([path]) => path.endsWith(`/node_modules/${name}`) || path === `node_modules/${name}`);
}

test("all ws instances satisfy the maintainer's patched version for their own major", () => {
  const found = instances("ws");
  assert.ok(found.length > 0, "Existing CDP/Solana dependencies still require ws metadata.");
  const minimumByMajor = { 5: "5.2.5", 6: "6.2.4", 7: "7.5.11", 8: "8.21.0" };
  for (const [path, entry] of found) {
    const major = versionParts(entry.version)[0];
    const minimum = minimumByMajor[major];
    assert.ok(minimum, `${path}: review a new major separately instead of assuming compatibility.`);
    assert.ok(atLeast(entry.version, minimum), `${path}: ${entry.version} is below GHSA-96hv-2xvq-fx4p's fixed ${minimum}.`);
    const installed = JSON.parse(readFileSync(resolve(root, path, "package.json"), "utf8"));
    assert.equal(installed.version, entry.version, `${path}: installed tree must match lock.`);
  }
  // A global v8 override would also migrate consumers which require ws v7.
  if (typeof manifest.overrides?.ws === "string") {
    assert.notEqual(versionParts(manifest.overrides.ws)[0], 8, "Use scoped overrides when v7 consumers remain.");
  }
});

test("every Browserslist instance stays on v4 and includes both advisory fixes", () => {
  const found = instances("browserslist");
  assert.ok(found.length > 0);
  for (const [path, entry] of found) {
    assert.equal(versionParts(entry.version)[0], 4);
    assert.ok(atLeast(entry.version, "4.28.7"), `${path}: both reviewed Browserslist advisories require >=4.28.7.`);
    assert.equal(JSON.parse(readFileSync(resolve(root, path, "package.json"), "utf8")).version, entry.version);
  }
});

test("retired wallet adapter declarations and lock root dependencies are removed", () => {
  for (const name of ["@solana/wallet-adapter-base", "@solana/wallet-adapter-phantom", "@solana/wallet-adapter-react", "@solana/wallet-adapter-react-ui"]) {
    for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
      assert.equal(manifest[section]?.[name], undefined, `${name}: retired direct declaration remains.`);
      assert.equal(lock.packages[""][section]?.[name], undefined, `${name}: lock root still declares retired adapter.`);
    }
  }
  const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
  assert.doesNotMatch(css, /@import\s+["']@solana\/wallet-adapter-react-ui\//, "Removed package must not leave a CSS import.");
});

test("prior critical fixes and the runtime floor survive this dependency change", () => {
  assert.equal(manifest.dependencies.next, lock.packages[""].dependencies.next);
  assert.match(manifest.dependencies.next, /^15\.5\.\d+$/);
  assert.ok(atLeast(manifest.dependencies.next, "15.5.27"));
  assert.equal(lock.packages["node_modules/next"].version, manifest.dependencies.next);
  for (const [name, minimum] of [["shell-quote", "1.11.0"], ["postcss", "8.5.30"], ["sharp", "0.35.5"]]) {
    const found = instances(name);
    // Removing the retired React Native consumer can remove shell-quote too;
    // absence closes this dependency path and must not force it back into Git.
    if (name !== "shell-quote") assert.ok(found.length > 0);
    for (const [path, entry] of found) assert.ok(atLeast(entry.version, minimum), `${path}: prior P0 fix regressed.`);
  }
  assert.equal(manifest.engines.node, "^20.19.0 || ^22.12.0 || >=24.0.0");
  assert.equal(lock.packages[""].engines.node, manifest.engines.node);
  assert.ok(atLeast(process.versions.node, "20.9.0"));
  assert.ok(satisfies(process.versions.node, manifest.engines.node));
});

test("the declared runtime rejects versions unsupported by the full test toolchain", () => {
  for (const version of ["20.19.0", "20.20.0", "22.12.0", "24.0.0", "24.19.0"]) assert.ok(satisfies(version, manifest.engines.node), version);
  for (const version of ["18.20.0", "20.9.0", "20.18.0", "21.7.0", "22.11.0", "23.0.0"]) assert.equal(satisfies(version, manifest.engines.node), false, version);
});

test("Baseline Browser Mapping stays on its reviewed major and the Vitest family is coherent", () => {
  for (const [path, entry] of instances("baseline-browser-mapping")) {
    assert.equal(versionParts(entry.version)[0], 2);
    assert.ok(atLeast(entry.version, "2.11.0"), `${path}: reviewed baseline mapping fix is missing.`);
    assert.equal(JSON.parse(readFileSync(resolve(root, path, "package.json"), "utf8")).version, entry.version);
  }
  assert.equal(manifest.devDependencies.vitest, "4.1.11");
  assert.equal(lock.packages["node_modules/vitest"].version, "4.1.11");
  const ownFamily = Object.entries(lock.packages).filter(([path]) => /^node_modules\/@vitest\//.test(path) || /\/node_modules\/@vitest\//.test(path));
  assert.ok(ownFamily.length > 0);
  for (const [path, entry] of ownFamily) {
    assert.equal(entry.version, "4.1.11", `${path}: a mixed Vitest implementation family remains.`);
    assert.equal(JSON.parse(readFileSync(resolve(root, path, "package.json"), "utf8")).version, entry.version);
  }
});
