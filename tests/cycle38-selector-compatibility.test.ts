import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import postcss, { type Rule } from "postcss";
import type selectorParser from "postcss-selector-parser";
import tailwindcss from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";

import projectConfig from "../tailwind.config";

// Resolve the parser from Tailwind's dependency boundary, including a nested
// installation if npm ever stops hoisting this dependency to the project root.
const projectRequire = createRequire(import.meta.url);
const tailwindRequire = createRequire(projectRequire.resolve("tailwindcss"));
const parse = tailwindRequire("postcss-selector-parser") as typeof selectorParser;

const componentSources = [
  "components/AppNavigation.tsx",
  "components/ui/button.tsx",
  "components/ui/dialog.tsx",
  "components/ui/progress.tsx",
  "components/AccessibilityToggle.tsx",
] as const;

// These are compatibility probes for supported selector grammar, rather than a
// claim that these exact variant combinations currently occur in product code.
const syntheticCandidates = [
  "aria-pressed:bg-primary/10",
  "data-[state=open]:opacity-100",
  "group-aria-expanded:rotate-180",
  "[&:is(:hover,:focus-visible)]:text-primary",
  "[&:is(button,a):not([aria-disabled=true])]:focus-visible:outline-none",
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
  rule.css.walkDecls(property, (node) => { values.push(node.value); });
  return values;
}

function ruleFor(candidate: string): ParsedRule {
  // Class values are decoded by the actual parser: escaped slashes, brackets,
  // colons and parentheses must still identify the complete utility candidate.
  const found = rules.find((rule) => classValues(rule).includes(candidate));
  expect(found, `Tailwind omitted the CSS utility ${candidate}`).toBeDefined();
  if (!found) throw new Error(`Missing CSS utility: ${candidate}`);
  return found;
}

function requireDeclaration(rule: ParsedRule, property: string): string {
  const value = declarations(rule, property)[0];
  expect(value, `Missing ${property} in ${rule.css.selector}`).toBeDefined();
  if (value === undefined) throw new Error(`Missing declaration: ${property}`);
  return value;
}

function requireDescendant(rule: ParsedRule): void {
  const combinators: string[] = [];
  rule.selector.walkCombinators((node) => { combinators.push(node.value); });
  expect(combinators).toContain(" ");
}

describe("C38 selector compatibility with the actual Tailwind pipeline", () => {
  beforeAll(async () => {
    const rawComponents = componentSources
      .map((path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8"))
      .join("\n");
    const probeMarkup = `<div class="${syntheticCandidates.join(" ")}"></div>`;
    const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    // Preserve the real theme, preset and plugins. Bound content to these fixed
    // local sources; this test does not invoke Next, external imports or a server.
    const result = await postcss([
      tailwindcss({
        ...projectConfig,
        content: [{ raw: `${rawComponents}\n${probeMarkup}`, extension: "tsx" }],
        safelist: [],
      }),
    ]).process(globals, { from: undefined });

    rules = [];
    result.root.walkRules((css) => {
      rules.push({ css, selector: parse().astSync(css.selector) });
    });
  }, 30_000);

  it("retains the actual navigation group-open selector and rotation", () => {
    const rule = ruleFor("group-open:rotate-180");
    expect(classValues(rule)).toContain("group");
    expect(attributes(rule)).toContainEqual({ name: "open", value: null });
    requireDescendant(rule);
    expect(requireDeclaration(rule, "--tw-rotate")).toBe("180deg");
    expect(requireDeclaration(rule, "transform")).toContain("var(--tw-rotate)");
  });

  it("retains the actual disabled button interaction and opacity rules", () => {
    const interaction = ruleFor("disabled:pointer-events-none");
    const opacity = ruleFor("disabled:opacity-50");
    expect(pseudos(interaction)).toContain(":disabled");
    expect(pseudos(opacity)).toContain(":disabled");
    expect(requireDeclaration(interaction, "pointer-events")).toBe("none");
    expect(requireDeclaration(opacity, "opacity")).toBe("0.5");
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
    expect(background).toContain("0.1");
    expect(background).toContain("var(--cfx-tint-boost)");
  });

  it("compiles an aria-pressed compatibility variant without dropping its state", () => {
    const rule = ruleFor("aria-pressed:bg-primary/10");
    expect(attributes(rule)).toContainEqual({ name: "aria-pressed", value: "true" });
    expect(requireDeclaration(rule, "background-color")).toContain("var(--cfx-primary-tint)");
  });

  it("compiles an arbitrary data-state compatibility variant without dropping its state", () => {
    const rule = ruleFor("data-[state=open]:opacity-100");
    expect(attributes(rule)).toContainEqual({ name: "data-state", value: "open" });
    expect(requireDeclaration(rule, "opacity")).toBe("1");
  });

  it("compiles a group aria-expanded compatibility variant with descendant scope", () => {
    const rule = ruleFor("group-aria-expanded:rotate-180");
    expect(classValues(rule)).toContain("group");
    expect(attributes(rule)).toContainEqual({ name: "aria-expanded", value: "true" });
    requireDescendant(rule);
    expect(requireDeclaration(rule, "--tw-rotate")).toBe("180deg");
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
    expect(requireDeclaration(rule, "outline")).toContain("transparent");
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
    expect(rule.selector.nodes.map((selector) => selector.toString().trim())).toEqual([
      'body:has([role="dialog"][aria-modal="true"]) .mila-launcher-dock',
      `${typingScope} .mila-launcher-dock`,
      `${typingScope} .mode-switcher-dock`,
    ]);
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
});
