# CoachFI design system v6 (pastel) — handoff package

- `DESIGN.md` — the implementation spec (brand, Mila, tokens, components, screens, voice, accessibility). Start here.
- `CLAUDE_CODE_PROMPT.md` — ready-to-paste prompt for Claude Code.
- `tokens/` — `tokens.json`, `tokens.css` (CSS variables, 5 themes), `tailwind.preset.js`.
- `assets/` — logo, Mila states, app icons (SVG + store PNGs), Kids pets.
- `reference/boards/` — the design canvas boards as HTML for exact spacing/sizes. They were made for the canvas runtime, so loops and live values (`{{…}}`) won’t render on their own — read the markup, don’t ship it.

Launch scope: Adult mode · US · English · free. Teen and Kids themes are included so the theme system is ready, not for launch.
