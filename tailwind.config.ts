import { createRequire } from "node:module";
import type { Config } from "tailwindcss";

const require = createRequire(import.meta.url);
const coachfiPreset = require("./styles/coachfi/tailwind.preset.cjs");

// Design tokens as RGB channels (styles/coachfi/channels.css) so opacity modifiers work.
const token = (name: string) => `rgb(var(--cf-${name}-rgb) / <alpha-value>)`;
// Legacy colour names aliased onto tokens (styles/coachfi/aliases.css).
const ink = (name: string) => `rgb(var(--cfx-${name}-ink) / <alpha-value>)`;

// Background for a legacy colour name: solid → fill token, strong opacity (hover) → hover token,
// low opacity → boosted pastel tint.
const fill =
  (name: string) =>
  ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined || opacityValue.startsWith("var(")) {
      return `rgb(var(--cfx-${name}-fill) / ${opacityValue ?? 1})`;
    }
    if (Number.parseFloat(opacityValue) >= 0.5) {
      return `rgb(var(--cfx-${name}-hover) / max(${opacityValue}, var(--cfx-tint-floor)))`;
    }
    return `rgb(var(--cfx-${name}-tint) / min(1, calc(${opacityValue} * var(--cfx-tint-boost))))`;
  };

const tokenNames = [
  "bg",
  "surface",
  "surface-brand",
  "text",
  "text-muted",
  "primary-strong",
  "primary-soft",
  "on-primary",
  "primary-border",
  "grape",
  "on-grape",
  "on-accent",
  "mascot",
  "mascot-deep",
  "area-learn",
  "area-goals",
  "area-progress",
  "area-mila",
  "area-rewards",
  "area-care",
  "on-area",
  "on-goals-strong",
  "attention",
  "border",
  "border-subtle",
  "focus"
];

const config: Config = {
  darkMode: ["class"],
  presets: [coachfiPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(tokenNames.map((name) => [name, token(name)])),
        "primary-fill": token("primary"),
        coral: token("accent"),
        chart: {
          1: token("chart-1"),
          2: token("chart-2"),
          3: token("chart-3"),
          highlight: token("chart-highlight")
        },
        background: token("bg"),
        card: token("surface"),
        muted: token("text-muted"),
        primary: ink("primary"),
        secondary: ink("secondary"),
        accent: ink("accent"),
        success: ink("success"),
        warning: ink("warning")
      },
      backgroundColor: {
        primary: fill("primary") as unknown as string,
        secondary: fill("secondary") as unknown as string,
        accent: fill("accent") as unknown as string,
        success: fill("success") as unknown as string,
        warning: fill("warning") as unknown as string
      },
      borderRadius: {
        lg: "var(--cfx-radius-lg)",
        xl: "var(--cfx-radius-xl)",
        "2xl": "var(--cfx-radius-2xl)",
        "3xl": "var(--cfx-radius-3xl)",
        input: "var(--cf-radius-input)",
        button: "var(--cf-radius-button)",
        card: "var(--cf-radius-card)",
        sheet: "var(--cf-radius-sheet)"
      },
      borderWidth: {
        control: "var(--cfx-control-border)"
      },
      ringWidth: {
        2: "var(--cfx-ring-width)"
      },
      boxShadow: {
        soft: "var(--cfx-shadow-soft)",
        glow: "var(--cfx-shadow-glow)"
      },
      fontFamily: {
        sans: ["var(--font-ui)", "var(--font-noto-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
