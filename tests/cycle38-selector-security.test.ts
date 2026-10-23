import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRequire = createRequire(resolve(process.cwd(), "package.json"));
const parserPath = projectRequire.resolve("postcss-selector-parser");
const parserPackagePath = projectRequire.resolve("postcss-selector-parser/package.json");

// Exercise only the installed parser in a disposable process. No application,
// account, remote endpoint, hostile HTTP request or large allocation is involved.
const prelude = `
const assert = require("node:assert/strict");
const parser = require(${JSON.stringify(parserPath)});
const packageInfo = require(${JSON.stringify(parserPackagePath)});
const nest = depth => ":not(".repeat(depth) + "main" + ")".repeat(depth);
function ast(depth) {
  let branch = parser.tag({ value: "main" });
  for (let level = 0; level < depth; level++) {
    const inner = parser.selector({});
    inner.append(branch);
    const pseudo = parser.pseudo({ value: ":not" });
    pseudo.append(inner);
    branch = pseudo;
  }
  const outer = parser.selector({});
  outer.append(branch);
  const root = parser.root({});
  root.append(outer);
  return root;
}
function controlledDepthError(action, phase, limit) {
  let caught;
  try { action(); } catch (error) { caught = error; }
  assert.ok(caught instanceof Error, phase + " must reject beyond its limit");
  assert.notEqual(caught.name, "RangeError", phase + " must not overflow the stack");
  assert.match(caught.message, /nesting depth.*maximum/i);
  assert.ok(caught.message.includes(String(limit)), phase + " must identify its limit");
  return { phase, name: caught.name, message: caught.message };
}
`;

function isolatedOracle(name: string, body: string): void {
  const source = `${prelude}
(async () => {
  try {
    const details = await (async () => { ${body} })();
    process.stdout.write(JSON.stringify({ ok: true, name: ${JSON.stringify(name)}, version: packageInfo.version, details }));
  } catch (error) {
    process.stdout.write(JSON.stringify({ ok: false, name: ${JSON.stringify(name)}, version: packageInfo.version, error: { name: error?.name, message: error?.message } }));
  }
})();
`;
  const child = spawnSync(process.execPath, ["--max-old-space-size=128", "-e", source], {
    cwd: process.cwd(),
    env: {} as NodeJS.ProcessEnv,
    shell: false,
    windowsHide: true,
    timeout: 4_000,
    killSignal: "SIGKILL",
    maxBuffer: 128 * 1024,
    encoding: "utf8",
  });
  const stdout = child.stdout ?? "";
  const telemetry = {
    name,
    childStatus: child.status,
    signal: child.signal,
    processError: child.error?.message ?? null,
    stdout,
    stderr: child.stderr ?? "",
  };
  console.log("C38_SELECTOR_SECURITY_OBSERVATION", JSON.stringify(telemetry));
  expect(child.error?.message ?? null, JSON.stringify(telemetry)).toBeNull();
  expect(child.signal, JSON.stringify(telemetry)).toBeNull();
  expect(child.status, JSON.stringify(telemetry)).toBe(0);
  const result: unknown = JSON.parse(stdout);
  expect(result).toMatchObject({ ok: true, name });
}

describe("independent C38 bounded selector security", () => {
  it("round-trips a healthy depth-ten selector", () => {
    isolatedOracle("healthy-depth-ten", `
      const input = nest(10);
      assert.equal(parser().processSync(input), input);
      assert.equal(ast(10).toString(), input);
      return { depth: 10, roundTrip: true };
    `);
  });

  it("rejects parsing beyond the default depth with a controlled error", () => {
    isolatedOracle("parse-default-limit", `
      return controlledDepthError(() => parser().astSync(nest(257)), "parse", 256);
    `);
  });

  it("honors lower, zero and raised trusted parse limits", () => {
    isolatedOracle("parse-configured-limits", `
      const lower = controlledDepthError(() => parser().astSync(nest(5), { maxNestingDepth: 4 }), "parse-lower", 4);
      const zero = controlledDepthError(() => parser().astSync(nest(1), { maxNestingDepth: 0 }), "parse-zero", 0);
      assert.equal(parser().processSync(nest(4), { maxNestingDepth: 4 }), nest(4));
      assert.equal(parser().processSync(nest(257), { maxNestingDepth: 300 }), nest(257));
      return { lower, zero, raisedDepth: 257, trustedLimit: 300 };
    `);
  });

  it("retains a safe parse default for invalid limit configuration", () => {
    isolatedOracle("parse-invalid-limits", `
      const details = [];
      for (const invalid of [NaN, Infinity, -1, 1.5, "256", null]) {
        details.push(controlledDepthError(() => parser().astSync(nest(257), { maxNestingDepth: invalid }), "parse-invalid-" + String(invalid), 256));
      }
      return { controls: details };
    `);
  });

  it("guards default serialization of an AST built without parsing", () => {
    isolatedOracle("serialize-default-limit", `
      return controlledDepthError(() => ast(257).toString(), "serialize", 256);
    `);
  });

  it("honors a lower serialization limit independently of parsing", () => {
    isolatedOracle("serialize-configured-limit", `
      assert.equal(ast(4).toString({ maxNestingDepth: 4 }), nest(4));
      return controlledDepthError(() => ast(5).toString({ maxNestingDepth: 4 }), "serialize-lower", 4);
    `);
  });

  it("guards cloning of an AST built without parsing", () => {
    isolatedOracle("clone-default-limit", `
      return controlledDepthError(() => ast(257).clone(), "clone", 256);
    `);
  });

  it("guards walking of an AST built without parsing", () => {
    isolatedOracle("walk-default-limit", `
      let visits = 0;
      const error = controlledDepthError(() => ast(257).walk(() => { visits++; }), "walk", 256);
      assert.ok(visits > 0 && visits < 516, "walk must stop before traversing the entire bounded tree");
      return { ...error, visits };
    `);
  });
});
