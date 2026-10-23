import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Progress } from "@/components/ui/progress";

function rootAttributes(value: number | null | undefined) {
  const markup = renderToStaticMarkup(
    React.createElement(Progress, { value, valueLabel: "Learning progress" }),
  );
  const root = markup.match(/<div\b[^>]*role="progressbar"[^>]*>/)?.[0];
  expect(root, "actual Radix progressbar root is rendered").toBeDefined();
  return root!;
}

describe("C20 actual shared Progress accessibility contract", () => {
  it.each([
    [0, "loading"],
    [33, "loading"],
    [100, "complete"],
  ] as const)("exposes numeric progress %s and state %s on the actual root", (value, state) => {
    const root = rootAttributes(value);
    expect(root).toContain('aria-label="Learning progress"');
    expect(root).toContain('aria-valuemin="0"');
    expect(root).toContain('aria-valuemax="100"');
    expect(root).toContain(`aria-valuenow="${value}"`);
    expect(root).toContain(`data-state="${state}"`);
  });

  it("keeps explicitly unknown progress indeterminate without a numeric ARIA value", () => {
    const root = rootAttributes(null);
    expect(root).toContain('data-state="indeterminate"');
    expect(root).not.toContain('aria-valuenow=');
  });

  it("keeps the existing omitted-value default at numeric zero", () => {
    const root = rootAttributes(undefined);
    expect(root).toContain('aria-valuenow="0"');
    expect(root).toContain('data-state="loading"');
  });
});
