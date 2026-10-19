"use strict";
// No package imports at module load. Built-in assertions only; real packages arrive through ctx.require.
const assert = require("node:assert/strict");
const compatibilityIds = Object.freeze(["C72-TW-01", "C72-TW-02", "C72-NESTED-01", "C72-NESTED-02"]);
const securityMapping = [
  {
    "id": "C72-SEC-01",
    "originalName": "healthy-depth-ten",
    "body": "\n      const input = nest(10);\n      assert.equal(parser().processSync(input), input);\n      assert.equal(ast(10).toString(), input);\n      return { depth: 10, roundTrip: true };\n    ",
    "bodySHA256": "cc5e484439d5458a4e2f28cb582a667af5cd878745acef99056c0564b145f790"
  },
  {
    "id": "C72-SEC-02",
    "originalName": "parse-default-limit",
    "body": "\n      return controlledDepthError(() => parser().astSync(nest(257)), \"parse\", 256);\n    ",
    "bodySHA256": "e15517b42b7da3de4dbe7265047d40af74b3d3921fe4a721cf44e8d99b558e06"
  },
  {
    "id": "C72-SEC-03",
    "originalName": "parse-configured-limits",
    "body": "\n      const lower = controlledDepthError(() => parser().astSync(nest(5), { maxNestingDepth: 4 }), \"parse-lower\", 4);\n      const zero = controlledDepthError(() => parser().astSync(nest(1), { maxNestingDepth: 0 }), \"parse-zero\", 0);\n      assert.equal(parser().processSync(nest(4), { maxNestingDepth: 4 }), nest(4));\n      assert.equal(parser().processSync(nest(257), { maxNestingDepth: 300 }), nest(257));\n      return { lower, zero, raisedDepth: 257, trustedLimit: 300 };\n    ",
    "bodySHA256": "ec29756b0e3065721abbe9d62409c8ed808ddb95b40dba5f1d524065927f99f6"
  },
  {
    "id": "C72-SEC-04",
    "originalName": "parse-invalid-limits",
    "body": "\n      const details = [];\n      for (const invalid of [NaN, Infinity, -1, 1.5, \"256\", null]) {\n        details.push(controlledDepthError(() => parser().astSync(nest(257), { maxNestingDepth: invalid }), \"parse-invalid-\" + String(invalid), 256));\n      }\n      return { controls: details };\n    ",
    "bodySHA256": "f58bc76b02fc28098a92539da4c1dbe792cd83410ff14d729c6b8d3067b1e82c"
  },
  {
    "id": "C72-SEC-05",
    "originalName": "serialize-default-limit",
    "body": "\n      return controlledDepthError(() => ast(257).toString(), \"serialize\", 256);\n    ",
    "bodySHA256": "90f652e57befdc38a99a0a79568d5aa8165f13ed19d666bb81ae344d187c761b"
  },
  {
    "id": "C72-SEC-06",
    "originalName": "serialize-configured-limit",
    "body": "\n      assert.equal(ast(4).toString({ maxNestingDepth: 4 }), nest(4));\n      return controlledDepthError(() => ast(5).toString({ maxNestingDepth: 4 }), \"serialize-lower\", 4);\n    ",
    "bodySHA256": "f0b6086d029e03b0f5cb694d9e8d12136f8f5b9356ad7240c3eb3aabf2836d54"
  },
  {
    "id": "C72-SEC-07",
    "originalName": "clone-default-limit",
    "body": "\n      return controlledDepthError(() => ast(257).clone(), \"clone\", 256);\n    ",
    "bodySHA256": "9e3609ac75f8b01a86f50fe0b269f49eb579f1990ca88f1f61adcf9dd41dea08"
  },
  {
    "id": "C72-SEC-08",
    "originalName": "walk-default-limit",
    "body": "\n      let visits = 0;\n      const error = controlledDepthError(() => ast(257).walk(() => { visits++; }), \"walk\", 256);\n      assert.ok(visits > 0 && visits < 516, \"walk must stop before traversing the entire bounded tree\");\n      return { ...error, visits };\n    ",
    "bodySHA256": "9637ca7619e33ffd4c7cda107ef4cd8f0fa0e2ad6d1699fa40ed48bd51d864e5"
  }
];
const securityIds = Object.freeze(securityMapping.map(row => row.id));
const caseIds = Object.freeze([...compatibilityIds, ...securityIds]);
const securitySourcePath = "./tests/cycle38-selector-security.test.ts";
const securitySourceSHA256 = "724912489b2c68cdf18f0239e618514a105680b685b46ccebc746e2bff90b43a";
const securitySharedPrelude = "const nest = depth => \":not(\".repeat(depth) + \"main\" + \")\".repeat(depth);\nfunction ast(depth) {\n  let branch = parser.tag({ value: \"main\" });\n  for (let level = 0; level < depth; level++) {\n    const inner = parser.selector({});\n    inner.append(branch);\n    const pseudo = parser.pseudo({ value: \":not\" });\n    pseudo.append(inner);\n    branch = pseudo;\n  }\n  const outer = parser.selector({});\n  outer.append(branch);\n  const root = parser.root({});\n  root.append(outer);\n  return root;\n}\nfunction controlledDepthError(action, phase, limit) {\n  let caught;\n  try { action(); } catch (error) { caught = error; }\n  assert.ok(caught instanceof Error, phase + \" must reject beyond its limit\");\n  assert.notEqual(caught.name, \"RangeError\", phase + \" must not overflow the stack\");\n  assert.match(caught.message, /nesting depth.*maximum/i);\n  assert.ok(caught.message.includes(String(limit)), phase + \" must identify its limit\");\n  return { phase, name: caught.name, message: caught.message };\n}";
const securitySharedPreludeSHA256 = "7c0ae331b86ed5de029a60c283a4984232ba17afa9e8f58b0b06e98d9d7d2f31";
const formats = Object.freeze([
  { format: ":merge(.group):hover &", respectPrefix: true },
  { format: ":merge(.group):focus &", respectPrefix: true },
]);
const variantCandidate = "group-hover:group-focus:bg-[rgb(1,2,3)]";
const variantBase = "bg-[rgb(1,2,3)]";
const variantSelectors = Object.freeze([
  String.raw`.bg-\[rgb\(1\,2\,3\)\]`,
  String.raw`.bg-\[rgb\(1\2c 2\2c 3\)\]`,
]);
const inlineCandidates = Object.freeze([
  "tw-p-4", "tw-w-1/2", "hover:tw-opacity-50", "data-[state=open]:tw-opacity-100",
  "group-hover:group-focus:tw-bg-[rgb(1,2,3)]", "before:tw-block", "tw-w-[calc(100%-2rem)]",
]);
const pipelineCSS = "@tailwind utilities;\n.probe { @apply tw-p-4; }";

function errorView(error) {
  return { name: String(error?.name ?? "UnknownError"),
    message: String(error?.message ?? "Unknown failure").slice(0, 1024),
    reason: typeof error?.reason === "string" ? error.reason.slice(0, 256) : null };
}
function capture(label, fn) {
  try { return { label, ok: true, value: fn() }; }
  catch (error) { return { label, ok: false, error: errorView(error) }; }
}
async function captureAsync(label, fn) {
  try { return { label, ok: true, value: await fn() }; }
  catch (error) { return { label, ok: false, error: errorView(error) }; }
}
function cssView(result) {
  const rules = [], atRules = [];
  result.root.walkRules(rule => {
    const ancestors = [];
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === "atrule") ancestors.unshift({ name: parent.name, params: parent.params });
    }
    rules.push({ selector: rule.selector, selectors: rule.selectors,
      declarations: (rule.nodes ?? []).filter(node => node.type === "decl")
        .map(node => ({ property: node.prop, value: node.value, important: Boolean(node.important) })), ancestors });
  });
  result.root.walkAtRules(rule => atRules.push({ name: rule.name, params: rule.params }));
  return { css: result.css, rules, atRules, warnings: result.warnings().map(w => String(w.text)) };
}
// Normalize ONLY equivalent hex spellings of the fixed escaped punctuation in these fixtures.
// Raw CSS remains in observations; unescaped syntax is never turned into an escaped identifier.
function fixedEscapes(text) {
  const punctuation = new Set([":", ",", "(", ")", "[", "]", "/", "=", "%"]);
  return String(text).replace(/\\([0-9a-fA-F]{1,6})(?:[ \t\r\n\f])?/g, (whole, hex) => {
    const code = Number.parseInt(hex, 16);
    if (code > 0x10ffff) return whole;
    const value = String.fromCodePoint(code);
    return punctuation.has(value) ? "\\" + value : whole;
  }).trim();
}
function operation(observation, label) {
  const rows = observation.operations.filter(row => row.label === label);
  assert.equal(rows.length, 1, "exactly one observation: " + label);
  return rows[0];
}
function success(observation, label) {
  const row = operation(observation, label);
  assert.equal(row.ok, true, JSON.stringify(row));
  return row.value;
}
function ruleFor(view, allowedSelectors) {
  const selected = view.rules.filter(rule => allowedSelectors.includes(fixedEscapes(rule.selector)));
  assert.equal(selected.length, 1, "expected one literal selector: " + JSON.stringify(allowedSelectors));
  return selected[0];
}
function declaration(rule, property, expected) {
  const values = rule.declarations.filter(row => row.property === property).map(row => row.value);
  assert.deepEqual(values, [expected], property + " for " + rule.selector);
}
function verifySecurityCopies(ctx) {
  const fs = ctx.require("node:fs"), crypto = ctx.require("node:crypto");
  const bytes = fs.readFileSync(ctx.require.resolve(securitySourcePath));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), securitySourceSHA256);
  const text = bytes.toString("utf8"), start = text.indexOf("const nest = depth =>");
  const end = text.indexOf("\n`;", start);
  assert.ok(start >= 0 && end > start);
  assert.equal(text.slice(start, end), securitySharedPrelude);
  const matches = [...text.matchAll(/isolatedOracle\("([^"]+)", `([\s\S]*?)`\);/g)];
  assert.equal(matches.length, 8);
  for (let index = 0; index < matches.length; index++) {
    assert.equal(matches[index][1], securityMapping[index].originalName);
    assert.equal(matches[index][2], securityMapping[index].body);
  }
}

async function observeCase(id, ctx) {
  if (!caseIds.includes(id) || !ctx || typeof ctx.require !== "function" || typeof ctx.parser !== "function") {
    throw new TypeError("C72 fixed case/context required");
  }
  if (securityIds.includes(id)) {
    const mapping = securityMapping.find(row => row.id === id);
    // Original assertions remain intrinsic to these eight bodies. Capture their outcome/error
    // for durable output before the runner's final assertCase gate; do not claim assertion-free observation.
    const observed = capture("original-security-body", () => {
      verifySecurityCopies(ctx);
      const run = new Function("parser", "assert", securitySharedPrelude + "\nreturn (() => {" + mapping.body + "\n})();");
      return run(ctx.parser, assert);
    });
    return { id, family: "security", originalName: mapping.originalName,
      originalSourceSHA256: securitySourceSHA256, operations: [observed] };
  }
  const operations = [];
  if (id === "C72-TW-01") {
    const context = { tailwindConfig: { prefix: "tw-", separator: ":" } };
    for (let index = 0; index < variantSelectors.length; index++) {
      const input = variantSelectors[index];
      operations.push(capture("unesc-" + index, () => {
        const unesc = ctx.require("postcss-selector-parser/dist/util/unesc");
        return { exportType: typeof unesc, decoded: unesc(input.slice(1)) };
      }));
      operations.push(capture("finalize-" + index, () => {
        const consumer = ctx.require("tailwindcss/lib/util/formatVariantSelector");
        return consumer.finalizeSelector(input, formats, { context, candidate: variantCandidate, base: variantBase });
      }));
    }
  } else if (id === "C72-TW-02") {
    operations.push(await captureAsync("pipeline", async () => {
      const postcss = ctx.require("postcss"), tailwind = ctx.require("tailwindcss");
      const result = await postcss([tailwind({ content: [{ raw: '<div class="tw-group ' + inlineCandidates.join(" ") + '"></div>', extension: "html" }],
        safelist: [], prefix: "tw-", important: "#scope",
        corePlugins: ["padding", "width", "opacity", "backgroundColor", "backgroundOpacity", "display", "content"] })])
        .process(pipelineCSS, { from: undefined });
      return cssView(result);
    }));
  } else if (id === "C72-NESTED-01") {
    operations.push(await captureAsync("cross-product", async () => {
      const postcss = ctx.require("postcss"), nested = ctx.require("postcss-nested");
      return cssView(await postcss([nested()]).process(".a, .b { &:hover, .child, :is(&,.x) { color: red } }", { from: undefined }));
    }));
  } else if (id === "C72-NESTED-02") {
    operations.push(await captureAsync("media", async () => {
      const postcss = ctx.require("postcss"), nested = ctx.require("postcss-nested");
      return cssView(await postcss([nested()]).process(".a { @media (min-width:30rem) { &:focus { color: blue } } }", { from: undefined }));
    }));
    operations.push(await captureAsync("malformed-selector", async () => {
      const postcss = ctx.require("postcss"), nested = ctx.require("postcss-nested");
      const root = postcss.root(), parent = postcss.rule({ selector: ".a" });
      const child = postcss.rule({ selector: "&:not(" });
      child.append(postcss.decl({ prop: "color", value: "black" }));
      parent.append(child); root.append(parent);
      const result = await postcss([nested()]).process(root, { from: undefined });
      return cssView(result);
    }));
  }
  return { id, family: "compatibility", operations };
}

function assertCase(id, observation) {
  assert.ok(caseIds.includes(id));
  assert.equal(observation.id, id);
  if (securityIds.includes(id)) {
    assert.equal(observation.family, "security");
    assert.equal(observation.operations.length, 1);
    success(observation, "original-security-body");
    return;
  }
  assert.equal(observation.family, "compatibility");
  if (id === "C72-TW-01") {
    assert.equal(observation.operations.length, 4);
    const allowed = [
      String.raw`.tw-group:focus:hover .group-hover\:group-focus\:bg-\[rgb\(1\,2\,3\)\]`,
      String.raw`.tw-group:hover:focus .group-hover\:group-focus\:bg-\[rgb\(1\,2\,3\)\]`,
    ];
    const normalized = [];
    for (let index = 0; index < 2; index++) {
      assert.deepEqual(success(observation, "unesc-" + index), { exportType: "function", decoded: variantBase });
      const result = success(observation, "finalize-" + index);
      assert.equal(typeof result, "string");
      normalized.push(fixedEscapes(result));
      assert.ok(allowed.includes(normalized[index]), "fixed hand-derived merged selector: " + result);
    }
    assert.equal(normalized[0], normalized[1], "equivalent input escapes keep identical selector semantics");
  } else if (id === "C72-TW-02") {
    assert.equal(observation.operations.length, 1);
    const view = success(observation, "pipeline");
    declaration(ruleFor(view, [String.raw`#scope .tw-p-4`]), "padding", "1rem");
    declaration(ruleFor(view, [String.raw`#scope .tw-w-1\/2`]), "width", "50%");
    declaration(ruleFor(view, [String.raw`#scope .hover\:tw-opacity-50:hover`]), "opacity", "0.5");
    declaration(ruleFor(view, [String.raw`#scope .data-\[state\=open\]\:tw-opacity-100[data-state="open"]`]), "opacity", "1");
    const background = ruleFor(view, [
      String.raw`#scope :is(.tw-group:focus:hover .group-hover\:group-focus\:tw-bg-\[rgb\(1\,2\,3\)\])`,
      String.raw`#scope :is(.tw-group:hover:focus .group-hover\:group-focus\:tw-bg-\[rgb\(1\,2\,3\)\])`,
    ]);
    declaration(background, "background-color", "rgb(1 2 3 / var(--tw-bg-opacity, 1))");
    declaration(background, "--tw-bg-opacity", "1");
    const before = ruleFor(view, [String.raw`#scope .before\:tw-block::before`]);
    declaration(before, "display", "block"); declaration(before, "content", "var(--tw-content)");
    const width = ruleFor(view, [String.raw`#scope .tw-w-\[calc\(100\%-2rem\)\]`]);
    const widthValues = width.declarations.filter(row => row.property === "width").map(row => row.value.replace(/\s+/g, ""));
    assert.deepEqual(widthValues, ["calc(100%-2rem)"]);
    declaration(ruleFor(view, [".probe"]), "padding", "1rem");
    assert.equal(view.atRules.filter(row => row.name === "apply").length, 0);
    assert.ok(!view.css.includes(":merge(")); assert.ok(!view.css.includes("[object Object]"));
  } else if (id === "C72-NESTED-01") {
    assert.equal(observation.operations.length, 1);
    const view = success(observation, "cross-product");
    assert.equal(view.rules.length, 1);
    assert.deepEqual(view.rules[0].selectors.map(s => s.replace(/,\s*/g, ",").trim()),
      [".a:hover", ".a .child", ":is(.a,.x)", ".b:hover", ".b .child", ":is(.b,.x)"]);
    declaration(view.rules[0], "color", "red");
    assert.equal(view.atRules.length, 0); assert.ok(!view.css.includes("&"));
  } else if (id === "C72-NESTED-02") {
    assert.equal(observation.operations.length, 2);
    const view = success(observation, "media");
    assert.deepEqual(view.atRules, [{ name: "media", params: "(min-width:30rem)" }]);
    assert.equal(view.rules.length, 1); assert.deepEqual(view.rules[0].selectors, [".a:focus"]);
    assert.deepEqual(view.rules[0].ancestors, [{ name: "media", params: "(min-width:30rem)" }]);
    declaration(view.rules[0], "color", "blue");
    const bad = operation(observation, "malformed-selector");
    assert.equal(bad.ok, false, "malformed selector must not create successful CSS");
    assert.equal(bad.error.name, "CssSyntaxError"); assert.equal(bad.error.reason, "Missed semicolon");
  }
}

module.exports = Object.freeze({ caseIds, compatibilityIds, securityIds, securityMapping,
  securitySourcePath, securitySourceSHA256, securitySharedPreludeSHA256, observeCase, assertCase });
