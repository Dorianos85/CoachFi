import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import postcss, { type Rule } from "postcss";
import type selectorParser from "postcss-selector-parser";
import tailwindcss from "@tailwindcss/postcss";
import { beforeAll, describe, expect, it } from "vitest";

// Tailwind 4 has its own selector implementation. The exact direct 7.1.6
// dependency remains an independent output inspector and the C38 guard subject;
// it is not represented as a transitive Tailwind 4 runtime dependency.
const projectRequire = createRequire(import.meta.url);
const parse = projectRequire("postcss-selector-parser") as typeof selectorParser;

// These are compatibility probes for supported selector grammar, rather than a
// claim that these exact variant combinations currently occur in product code.
const syntheticCandidates = [
  "aria-pressed:bg-primary/10",
  "data-[state=open]:opacity-100",
  "group-aria-expanded:rotate-180",
  "[&:is(:hover,:focus-visible)]:text-primary",
  "[&:is(button,a):not([aria-disabled=true])]:focus-visible:outline-none",
  "bg-primary/3", "bg-primary/4", "hover:bg-primary/8", "bg-primary/12",
  "bg-success/12", "bg-accent/18", "bg-primary/90", "bg-primary/[1]",
  "bg-primary/[var(--synthetic-alpha)]",
] as const;

type ParsedRule = { css: Rule; selector: selectorParser.Root };
let rules: ParsedRule[] = [];

function classValues(rule: ParsedRule): string[] {
  const values: string[] = [];
  rule.selector.walkClasses((node) => { values.push(node.value); });
  return values;
}

function pseudos(rule: ParsedRule): string[] {
  const values: string[] = [];
  rule.selector.walkPseudos((node) => { values.push(node.value); });
  return values;
}

function attributes(rule: ParsedRule): { name: string; value: string | null }[] {
  const values: { name: string; value: string | null }[] = [];
  rule.selector.walkAttributes((node) => {
    values.push({ name: node.attribute, value: node.value ?? null });
  });
  return values;
}

function declarations(rule: ParsedRule, property: string): string[] {
  const values: string[] = [];
  // A utility's own block, not a nested rule with another state/scope.
  rule.css.each(node => {
    if (node.type === "decl" && node.prop === property) values.push(node.value);
  });
  return values;
}

function ruleFor(candidate: string): ParsedRule {
  // Class values are decoded by the actual parser: escaped slashes, brackets,
  // colons and parentheses must still identify the complete utility candidate.
  // The compatibility plugin can follow a built-in utility with the same class.
  // Inspect its last declaration in cascade order, rather than an earlier rule.
  const found = rules.flatMap(rule => rule.selector.nodes.flatMap(selector => {
    const classes: string[] = [];
    selector.walkClasses(node => { classes.push(node.value); });
    if (!classes.includes(candidate) || !classes.every(name => name === candidate
      || (candidate.startsWith("group-") && name === "group")
      || (candidate.startsWith("peer-") && name === "peer"))) return [];
    // LightningCSS can merge several selectors into a shared block. Preserve
    // this candidate's own complete selector for state/descendant assertions.
    return [{ css: rule.css, selector: parse().astSync(selector.toString()) }];
  })).at(-1);
  expect(found, `Tailwind omitted the CSS utility ${candidate}`).toBeDefined();
  if (!found) throw new Error(`Missing CSS utility: ${candidate}`);
  return found;
}

function requireDeclaration(rule: ParsedRule, property: string): string {
  // Merged core/compat utility blocks may retain an earlier fallback. The last
  // direct declaration is the effective ordinary utility, not the first one.
  const value = declarations(rule, property).at(-1);
  expect(value, `Missing ${property} in ${rule.css.selector}`).toBeDefined();
  if (value === undefined) throw new Error(`Missing declaration: ${property}`);
  return value;
}

function requireDescendant(rule: ParsedRule): void {
  const combinators: string[] = [];
  rule.selector.walkCombinators((node) => { combinators.push(node.value); });
  expect(combinators).toContain(" ");
}

function opacityNumber(value: string): number {
  return value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value);
}

function selectorSpelling(value: string): string {
  // LightningCSS may remove optional attribute quotes and insignificant comma
  // whitespace. Keep the complete selector scope/order, not merely substrings.
  return value.replace(/\[([\w-]+)="([^"\\]*)"\]/g, "[$1=$2]")
    .replace(/\s+/g, " ").replace(/,\s*/g, ",").trim();
}

describe("C38 selector compatibility with the actual Tailwind pipeline", () => {
  beforeAll(async () => {
    const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    // Compile the actual v4 entry/config/preset with explicit app/components/lib
    // roots, plus the same fixed grammar probes. No Next/server/provider runs.
    const result = await postcss([
      tailwindcss({ base: process.cwd(), optimize: { minify: false } }),
    ]).process(`${globals}\n@source inline(${JSON.stringify(syntheticCandidates.join(" "))});`, {
      from: fileURLToPath(new URL("../app/globals.css", import.meta.url)),
    });

    rules = [];
    result.root.walkRules((css) => {
      rules.push({ css, selector: parse().astSync(css.selector) });
    });
    // Bounded actual CSS diagnostics collected before case assertions. These
    // are observations, not extra test cases or a full stylesheet dump.
    const diagnostics = ["group-open:rotate-180", "group-aria-expanded:rotate-180",
      "bg-primary/10", "aria-pressed:bg-primary/10", "bg-primary/3", "bg-primary/4",
      "hover:bg-primary/8", "bg-primary/12", "bg-success/12", "bg-accent/18",
      "bg-primary/90", "bg-primary/[1]", "bg-primary/[var(--synthetic-alpha)]"].map(candidate => ({
      candidate,
      rules: rules.flatMap(rule => rule.selector.nodes.flatMap(selector => {
        const classes: string[] = [];
        selector.walkClasses(node => { classes.push(node.value); });
        if (!classes.includes(candidate)) return [];
        return [{ selector: selector.toString().slice(0, 2048),
          background: declarations(rule, "background-color").map(value => value.slice(0, 1024)),
          rotate: declarations(rule, "rotate"),
        }];
      })).slice(0, 8),
    }));
    console.log("C38_CSS_COMPATIBILITY_OBSERVATION", JSON.stringify(diagnostics));
  }, 30_000);

  it("retains the actual navigation group-open selector and rotation", () => {
    const rule = ruleFor("group-open:rotate-180");
    expect(classValues(rule)).toContain("group");
    expect(attributes(rule)).toContainEqual({ name: "open", value: null });
    requireDescendant(rule);
    // v4 uses the CSS individual transform property instead of v3's internal
    // --tw-rotate + transform chain; the same open-state half-turn is required.
    expect(requireDeclaration(rule, "rotate")).toBe("180deg");
  });

  it("retains the actual disabled button interaction and opacity rules", () => {
    const interaction = ruleFor("disabled:pointer-events-none");
    const opacity = ruleFor("disabled:opacity-50");
    expect(pseudos(interaction)).toContain(":disabled");
    expect(pseudos(opacity)).toContain(":disabled");
    expect(requireDeclaration(interaction, "pointer-events")).toBe("none");
    expect(opacityNumber(requireDeclaration(opacity, "opacity"))).toBe(0.5);
  });

  it("retains the actual dialog escaped calc width utility", () => {
    const rule = ruleFor("w-[calc(100%-2rem)]");
    expect(requireDeclaration(rule, "width").replace(/\s+/g, "")).toBe("calc(100%-2rem)");
  });

  it("retains the actual focus-visible arbitrary ring width token", () => {
    const rule = ruleFor("focus-visible:ring-[length:var(--cfx-ring-width)]");
    expect(pseudos(rule)).toContain(":focus-visible");
    expect(requireDeclaration(rule, "--tw-ring-shadow")).toContain("var(--cfx-ring-width)");
  });

  it("retains the actual escaped slash background and custom opacity tokens", () => {
    const rule = ruleFor("bg-primary/10");
    const background = requireDeclaration(rule, "background-color");
    expect(background).toContain("var(--cfx-primary-tint)");
    expect(background).toMatch(/(?:^|[^0-9.])0?\.1(?:[^0-9.]|$)/);
    expect(background).toContain("var(--cfx-tint-boost)");
    // A real unlayered high-contrast override is a different mode, not the
    // ordinary utility declaration. Retain that deliberate important override.
    const contrast = rules.find(entry => classValues(entry).includes("high-contrast")
      && classValues(entry).includes("bg-primary/10"));
    expect(contrast).toBeDefined();
    if (!contrast) throw new Error("Missing explicit high-contrast background override");
    const overrides: Array<{ value: string; important: boolean }> = [];
    contrast.css.walkDecls("background-color", node => { overrides.push({ value: node.value, important: Boolean(node.important) }); });
    expect(overrides).toContainEqual({ value: "#111827", important: true });
  });

  it("compiles an aria-pressed compatibility variant without dropping its state", () => {
    const rule = ruleFor("aria-pressed:bg-primary/10");
    expect(attributes(rule)).toContainEqual({ name: "aria-pressed", value: "true" });
    expect(requireDeclaration(rule, "background-color")).toContain("var(--cfx-primary-tint)");
  });

  it("compiles an arbitrary data-state compatibility variant without dropping its state", () => {
    const rule = ruleFor("data-[state=open]:opacity-100");
    expect(attributes(rule)).toContainEqual({ name: "data-state", value: "open" });
    expect(opacityNumber(requireDeclaration(rule, "opacity"))).toBe(1);
  });

  it("compiles a group aria-expanded compatibility variant with descendant scope", () => {
    const rule = ruleFor("group-aria-expanded:rotate-180");
    expect(classValues(rule)).toContain("group");
    expect(attributes(rule)).toContainEqual({ name: "aria-expanded", value: "true" });
    requireDescendant(rule);
    expect(requireDeclaration(rule, "rotate")).toBe("180deg");
  });

  it("compiles nested is hover and focus-visible grammar with the real text token", () => {
    const rule = ruleFor("[&:is(:hover,:focus-visible)]:text-primary");
    expect(pseudos(rule)).toEqual(expect.arrayContaining([":is", ":hover", ":focus-visible"]));
    expect(requireDeclaration(rule, "color")).toContain("var(--cfx-primary-ink)");
  });

  it("compiles combined is not attribute and focus-visible grammar with its outline", () => {
    const rule = ruleFor("[&:is(button,a):not([aria-disabled=true])]:focus-visible:outline-none");
    expect(pseudos(rule)).toEqual(expect.arrayContaining([":is", ":not", ":focus-visible"]));
    const tags: string[] = [];
    rule.selector.walkTags((node) => { tags.push(node.value); });
    expect(tags).toEqual(expect.arrayContaining(["button", "a"]));
    expect(attributes(rule)).toContainEqual({ name: "aria-disabled", value: "true" });
    expect(requireDeclaration(rule, "outline")).toContain("2px");
    expect(requireDeclaration(rule, "outline")).toMatch(/transparent|#0000/);
    expect(requireDeclaration(rule, "outline-offset")).toBe("2px");
  });

  it("preserves the actual global not-disabled hover selector and important background", () => {
    const rule = rules.find((entry) =>
      classValues(entry).includes("wallet-adapter-button") &&
      pseudos(entry).includes(":not") && pseudos(entry).includes(":hover"));
    expect(rule).toBeDefined();
    if (!rule) throw new Error("Missing global wallet hover rule");
    expect(attributes(rule)).toContainEqual({ name: "disabled", value: null });
    const backgrounds: { value: string; important: boolean }[] = [];
    rule.css.walkDecls("background", (node) => {
      backgrounds.push({ value: node.value, important: Boolean(node.important) });
    });
    expect(backgrounds).toContainEqual({ value: "var(--cf-primary-strong)", important: true });
  });

  it("preserves the actual dialog and typing has-not selector list hiding the launcher", () => {
    const rule = rules.find((entry) =>
      classValues(entry).includes("mila-launcher-dock") &&
      pseudos(entry).includes(":has") && pseudos(entry).includes(":not"));
    expect(rule).toBeDefined();
    if (!rule) throw new Error("Missing global launcher visibility rule");
    expect(requireDeclaration(rule, "visibility")).toBe("hidden");
    // Incoming main adds typing-only visibility for its mode-switcher dock.
    // Admit exactly that third branch while preserving both original Mila branches.
    const typingScope = 'body:has(input:focus:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea:focus, [contenteditable="true"]:focus)';
    expect(rule.selector.nodes.map((selector) => selectorSpelling(selector.toString()))).toEqual([
      'body:has([role="dialog"][aria-modal="true"]) .mila-launcher-dock',
      `${typingScope} .mila-launcher-dock`,
      `${typingScope} .mode-switcher-dock`,
    ].map(selectorSpelling));
    expect(rule.selector.nodes).toHaveLength(3);
    expect(pseudos(rule).filter((value) => value === ":not")).toHaveLength(6);
    expect(attributes(rule)).toEqual(expect.arrayContaining([
      { name: "role", value: "dialog" },
      { name: "aria-modal", value: "true" },
      { name: "type", value: "checkbox" },
      { name: "type", value: "radio" },
      { name: "type", value: "range" },
      { name: "contenteditable", value: "true" },
    ]));
  });

  it("preserves the healthy legacy replaceWith array contract used by Tailwind merge", () => {
    const ast = parse().astSync(":merge(.group):hover .compat-token");
    ast.walkPseudos((pseudo) => {
      if (pseudo.value !== ":merge") return;
      // Intentionally pass the ARRAY as one argument, as Tailwind 3 does. The
      // installed legacy declaration describes only spread Node arguments; this
      // erased type adapter keeps the real legacy call and receiver unchanged.
      const replaceArray = pseudo.replaceWith as unknown as (
        this: selectorParser.Pseudo,
        nodes: readonly selectorParser.Selector[],
      ) => selectorParser.Node;
      replaceArray.call(pseudo, pseudo.nodes);
    });
    expect(ast.toString()).toBe(".group:hover .compat-token");
  });

  it("uses the explicit pastel admission for newly recognized numeric alpha classes and retains solid alpha modifiers", () => {
    // v3 rejected named steps 3/4/8/12/18 because they were not in theme.opacity.
    // Their v4 admission is a small visible correction, not claimed old CSS
    // parity. Numeric values use the preexisting tint formula, not ink colors.
    for (const [candidate, name, alpha] of [
      ["bg-primary/3", "primary", "03"], ["bg-primary/4", "primary", "04"],
      ["hover:bg-primary/8", "primary", "08"], ["bg-primary/12", "primary", "12"],
      ["bg-success/12", "success", "12"], ["bg-accent/18", "accent", "18"],
    ]) {
      const value = requireDeclaration(ruleFor(candidate), "background-color");
      expect(value).toContain(`var(--cfx-${name}-tint)`);
      expect(value).toContain("var(--cfx-tint-boost)");
      expect(value).toMatch(new RegExp(`(?:^|[^0-9.])0?\\.${alpha}(?:[^0-9.]|$)`));
    }
    const strong = requireDeclaration(ruleFor("bg-primary/90"), "background-color");
    expect(strong).toContain("var(--cfx-primary-hover)");
    expect(strong).toContain("var(--cfx-tint-floor)");
    expect(strong).toMatch(/(?:^|[^0-9.])0?\.9(?:[^0-9.]|$)/);
    const arbitraryOne = requireDeclaration(ruleFor("bg-primary/[1]"), "background-color");
    expect(arbitraryOne).toContain("var(--cfx-primary-hover)");
    expect(arbitraryOne).toContain("var(--cfx-tint-floor)");
    const variable = requireDeclaration(ruleFor("bg-primary/[var(--synthetic-alpha)]"), "background-color");
    expect(variable).toContain("var(--cfx-primary-fill)");
    expect(variable).toContain("var(--synthetic-alpha)");
  });
});
