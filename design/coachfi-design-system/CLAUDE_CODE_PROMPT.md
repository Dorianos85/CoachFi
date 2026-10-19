# Prompt for Claude Code — visual reskin of the live CoachFI app

Before pasting: commit or stash your work, then unzip this package into the repo as `design/coachfi-design-system/`. Paste everything below the line into Claude Code, opened in the repo root.

---

You are applying the new CoachFI visual identity (design system v6 "pastel" + the new Mila squirrel logo) to this **live, working app**. The package is in `design/coachfi-design-system/` — `DESIGN.md` (spec), `tokens/` (tokens.json, tokens.css, tailwind.preset.js), `assets/` (logo, Mila, app icons, favicons), `reference/boards/` (HTML mockups; read the markup for exact values, they don't render standalone).

## The one hard rule: visual only — no functional change
This is a reskin. Every feature, flow, screen, route, API call, data model, state, analytics event, auth flow, notification, reward mechanic, NFT certificate flow, Solana/wallet integration, voice/AI logic, feature flag and test must behave exactly as it does now.
- Change only: colours, fonts, spacing, radii, shadows, icons, the logo and brand assets, and the styling/markup of presentational components.
- Do NOT: change business logic, props or public APIs of components, routes, env vars, backend, DB, dependencies' major versions, i18n keys, `data-testid`s, or user-facing copy (except brand name/logo text). Do not add or remove features or screens.
- `DESIGN.md` §5 (screens), §6 (voice rules), §8 (engagement rules) and any "remove"/"never" product rules are **out of scope** for this task — they describe a future product, not this reskin. Where the spec describes a screen or component the app doesn't have, skip it and list it in the final report as backlog.
- If a visual change would require a logic change, stop and ask me.

## Safety
- Work on a new branch `design/v6-reskin` from the current main branch. Never push to or merge into main. Small commits, one per step below, with clear messages.
- Before editing, record a baseline: install, lint, type-check, run the full test suite, and build. Note any failures that already exist — they are not yours to fix, but you must not add new ones.
- Prefer aliasing over renaming: map the existing theme variables / Tailwind colour names / theme object keys to the new tokens, so existing class names and imports keep working.
- If styling is centralised (one theme file / CSS variables), put the new look behind a theme switch (`data-theme="adult-light"` vs the current theme, or a `DESIGN_V6` flag defaulting to on) so it can be turned off without a revert. If that is not practical, say so and rely on the branch.

## Steps
1. **Explore and plan (no edits yet).** Identify: framework (Next.js / Vite / React Native-Expo / other), styling system (Tailwind, CSS modules, styled-components, RN StyleSheet, UI kit), where colours, fonts and the theme live, every place the logo/app name/favicon/app icon/OG image is used, the existing Mila/mascot visuals, and the list of screens. Run the baseline. Then show me a short plan: files you will touch, how you'll map old tokens → new tokens, and anything risky. **Wait for my OK.**
2. **Baseline screenshots.** If it's a web app, use Playwright to screenshot the main screens at 390 px and 1440 px into `design/screenshots/before/`. For a native app, list the screens and skip screenshots.
3. **Tokens.** Web: import `tokens/tokens.css` globally and, if Tailwind is used, add `tokens/tailwind.preset.js` to `presets`; then point existing colour names at the new variables. React Native: generate `src/theme/coachfi.ts` from `tokens/tokens.json` (adult-light as default; keep adult-dark for dark mode) and map the existing theme object onto it. Teen, Kids and high-contrast themes: include the tokens only — do not build anything with them.
4. **Fonts.** Nunito (400–900) everywhere via the existing font-loading mechanism (next/font, @fontsource, expo-font…). Keep fallbacks. Money amounts: `font-variant-numeric: tabular-nums` where they're already displayed — don't change number formatting logic.
5. **Logo & brand assets.** Copy `assets/logo`, `assets/mila`, `assets/app-icons` to the static folder as `/brand/...`. Build a `Logo` component exactly as in DESIGN.md §2.2 (symbol = squirrel whose tail is the "C" + live text "oach" in Nunito 800 + FI book SVG + small "AI" in `var(--cf-grape)`), accessible name "CoachFI AI". Replace every old logo usage with it (header, sidebar, splash, auth screens, emails/templates only if they use the same asset). Update favicon (`favicon.svg` + PNGs), apple-touch-icon (`favicon-180.png`), web manifest icons, and for native apps the app icon/splash (`app-icon-adult-store-1024.png`, full-bleed). Logo background is always flat (`#EBE1FF` default). Don't change the app's name in config, store IDs or bundle IDs.
6. **Mila visuals.** Where the app already shows Mila/the assistant avatar, swap the image for the matching state from `assets/mila/` (neutral, listen, think, talk, happy, sleep) using the states the app already has. Do not change the voice/AI logic or add new states.
7. **Components — restyle in place.** Buttons, inputs, cards, chips, switches, tabs/nav, modals/sheets, toasts, progress bars/rings, badges, NFT certificate cards — same components, same props, new styles per DESIGN.md §3–§4. Key rules: cream background `--cf-bg`; ink text `--cf-text`; primary button = `--cf-primary` (#CDBEFF) with ink text, 2 px ink border and `0 3px 0` ink shadow; links/progress/charts = `--cf-grape`; feature areas use the area pastels; no white text on pastels; visible focus ring (3 px `--cf-focus`). Use `var(--cf-*)` / theme tokens, not raw hex.
8. **Screens.** Go screen by screen and apply the new tokens/components to what already exists. Same layout structure and content; adjust only spacing, colour, type and imagery to match the reference boards where the screen exists.
9. **Verify.** Re-run lint, type-check, tests and build — no new failures. Take `after` screenshots of the same screens. Check contrast of any new colour pairs (≥ 4.5:1 text, ≥ 3:1 UI) and run axe on web pages; fix only styling-level issues. Grep for leftover old brand colours/old logo files and remove now-unused style assets only (not code paths).
10. **Report.** Open a PR (do not merge) with: summary, before/after screenshots, list of changed files, how to switch the theme off, things skipped (spec items the app doesn't have), and any visual question for me.

Ask me before: any change outside styling/assets/presentational markup, adding a dependency (fonts and dev-only tooling are fine), or deleting any file that isn't a superseded style or brand asset.
