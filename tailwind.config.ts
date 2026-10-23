import { createRequire } from "node:module";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const require = createRequire(import.meta.url);
const coachfiPreset = require("./styles/coachfi/tailwind.preset.cjs");

// Keep the v3 sRGB families used by existing screens. Tailwind 4's defaults
// use a different palette; dependency maintenance must not recolour the app.
const legacyPalette = {
  "slate": {
    "50": "#f8fafc",
    "100": "#f1f5f9",
    "200": "#e2e8f0",
    "300": "#cbd5e1",
    "400": "#94a3b8",
    "500": "#64748b",
    "600": "#475569",
    "700": "#334155",
    "800": "#1e293b",
    "900": "#0f172a",
    "950": "#020617"
  },
  "gray": {
    "50": "#f9fafb",
    "100": "#f3f4f6",
    "200": "#e5e7eb",
    "300": "#d1d5db",
    "400": "#9ca3af",
    "500": "#6b7280",
    "600": "#4b5563",
    "700": "#374151",
    "800": "#1f2937",
    "900": "#111827",
    "950": "#030712"
  },
  "red": {
    "50": "#fef2f2",
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
    "800": "#991b1b",
    "900": "#7f1d1d",
    "950": "#450a0a"
  },
  "orange": {
    "50": "#fff7ed",
    "100": "#ffedd5",
    "200": "#fed7aa",
    "300": "#fdba74",
    "400": "#fb923c",
    "500": "#f97316",
    "600": "#ea580c",
    "700": "#c2410c",
    "800": "#9a3412",
    "900": "#7c2d12",
    "950": "#431407"
  },
  "amber": {
    "50": "#fffbeb",
    "100": "#fef3c7",
    "200": "#fde68a",
    "300": "#fcd34d",
    "400": "#fbbf24",
    "500": "#f59e0b",
    "600": "#d97706",
    "700": "#b45309",
    "800": "#92400e",
    "900": "#78350f",
    "950": "#451a03"
  },
  "emerald": {
    "50": "#ecfdf5",
    "100": "#d1fae5",
    "200": "#a7f3d0",
    "300": "#6ee7b7",
    "400": "#34d399",
    "500": "#10b981",
    "600": "#059669",
    "700": "#047857",
    "800": "#065f46",
    "900": "#064e3b",
    "950": "#022c22"
  },
  "sky": {
    "50": "#f0f9ff",
    "100": "#e0f2fe",
    "200": "#bae6fd",
    "300": "#7dd3fc",
    "400": "#38bdf8",
    "500": "#0ea5e9",
    "600": "#0284c7",
    "700": "#0369a1",
    "800": "#075985",
    "900": "#0c4a6e",
    "950": "#082f49"
  },
  "violet": {
    "50": "#f5f3ff",
    "100": "#ede9fe",
    "200": "#ddd6fe",
    "300": "#c4b5fd",
    "400": "#a78bfa",
    "500": "#8b5cf6",
    "600": "#7c3aed",
    "700": "#6d28d9",
    "800": "#5b21b6",
    "900": "#4c1d95",
    "950": "#2e1065"
  }
};

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
    return `rgb(var(--cfx-${name}-tint) / min(var(--cfx-${name}-tint-cap, 1), calc(${opacityValue} * var(--cfx-tint-boost))))`;
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
  darkMode: "class",
  presets: [coachfiPreset],
  // Source roots are explicit @source directives in app/globals.css.
  theme: {
    extend: {
      colors: {
        ...legacyPalette,
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
        primary: fill("primary")({}),
        secondary: fill("secondary")({}),
        accent: fill("accent")({}),
        success: fill("success")({}),
        warning: fill("warning")({})
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.375rem",
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
        DEFAULT: "3px",
        2: "var(--cfx-ring-width)"
      },
      ringColor: { DEFAULT: "rgb(59 130 246 / 0.5)" },
      boxShadow: {
        soft: "var(--cfx-shadow-soft)",
        glow: "var(--cfx-shadow-glow)"
      },
      fontFamily: {
        sans: ["var(--font-ui)", "var(--font-noto-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [plugin(({ addUtilities, matchUtilities }) => {
    // A v3 backgroundColor callback is not loaded as a v4 theme value. Register
    // these five existing names explicitly, retaining their original formulas.
    // The modifier map converts named percentages; arbitrary modifiers already
    // carry their literal CSS alpha (including [1] and [var(--alpha)]).
    // v3 emitted only its configured opacity steps. Existing markup also uses
    // /3,/4,/8,/12,/18, which v4 now recognizes. Admit these numeric utilities
    // through the same pastel formula, never the text-ink color fallback.
    const modifiers = Object.fromEntries(
      Array.from({ length: 101 }, (_, index) => [String(index), String(index / 100)]),
    );
    const fillNames = ["primary", "secondary", "accent", "success", "warning"];
    // Use the SAME functional root as the built-in bg utility, registered
    // afterwards. Separate bg-primary roots are sorted before core bg and lose
    // their declaration. Keep type=any: type=color would pre-apply color-mix.
    matchUtilities({ bg: (name, { modifier }): Record<string, string> => {
      // Arbitrary colors and every other background stay with the core utility.
      if (!fillNames.includes(name)) return {};
      return { backgroundColor: fill(name)({ opacityValue: modifier ?? undefined }) };
    } }, { values: Object.fromEntries(fillNames.map(name => [name, name])), modifiers });

    const shadow = (value: string) => ({
      "--tw-shadow": value,
      boxShadow: "var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
    });
    const backdrop = (pixels: number) => ({
      "--tw-backdrop-blur": `blur(${pixels}px)`,
      "-webkit-backdrop-filter": "var(--tw-backdrop-blur, ) var(--tw-backdrop-brightness, ) var(--tw-backdrop-contrast, ) var(--tw-backdrop-grayscale, ) var(--tw-backdrop-hue-rotate, ) var(--tw-backdrop-invert, ) var(--tw-backdrop-opacity, ) var(--tw-backdrop-saturate, ) var(--tw-backdrop-sepia, )",
      backdropFilter: "var(--tw-backdrop-blur, ) var(--tw-backdrop-brightness, ) var(--tw-backdrop-contrast, ) var(--tw-backdrop-grayscale, ) var(--tw-backdrop-hue-rotate, ) var(--tw-backdrop-invert, ) var(--tw-backdrop-opacity, ) var(--tw-backdrop-saturate, ) var(--tw-backdrop-sepia, )",
    });
    addUtilities({
      ".rounded": { borderRadius: "0.25rem" },
      ".shadow-sm": shadow("0 1px 2px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.05))"),
      ".shadow": shadow("0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1))"),
      ".outline-none": { "--tw-outline-style": "solid", outline: "2px solid transparent", outlineOffset: "2px" },
      ".backdrop-blur": backdrop(8),
      ".backdrop-blur-sm": backdrop(4),
      ".backdrop-blur-xl": backdrop(24),
    });

    // v4 moves spacing to logical margins on the preceding child. Preserve the
    // old following-visible-sibling contract used by existing forms/cards.
    const spacing = Object.fromEntries(
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96]
        .map(value => [String(value), value === 0 ? "0px" : `${value / 4}rem`]),
    );
    matchUtilities({ "space-y": value => ({
      "& > :not(:last-child)": { marginBlockStart: "0", marginBlockEnd: "0" },
      "& > :not([hidden]) ~ :not([hidden])": {
        "--tw-space-y-reverse": "0",
        marginTop: `calc(${value} * calc(1 - var(--tw-space-y-reverse)))`,
        marginBottom: `calc(${value} * var(--tw-space-y-reverse))`,
      },
    }) }, { values: spacing, supportsNegativeValues: true });
  })]
};

export default config;
