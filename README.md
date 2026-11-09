# Currency 2.0 — Design Tokens

Foundations for the DOKU e-Wallet design system **Currency**: color, typography, spacing, radius, border width and elevation.

- **Figma (source of truth for design):** [[WIP] New — Currency Design System](https://www.figma.com/design/TORXr3LEX2YXuMkSOQ2C8C/) — pages *Color, Typography, Spacing, Radius & Border, Elevation, Migration map*
- **Token source (source of truth for code):** `tokens/*.tokens.json` ([W3C DTCG format](https://tr.designtokens.org/format/))
- **Status:** `2.0.0-alpha.1` — Light theme only. Values are under design review.

## Quick start

```bash
npm install
npm run build
```

| Output | Path | Use in |
|---|---|---|
| CSS custom properties | `build/css/variables.css` | Web Storybook, web views |
| JS/TS (unitless numbers) | `build/js/tokens.js`, `tokens.d.ts`, `tokens.json` | React Native, Storybook for RN |
| Swift | `build/ios/CurrencyTokens.swift`, `CurrencyElevation.swift` | iOS native |
| Android XML | `build/android/currency_colors.xml`, `currency_dimens.xml`, `currency_elevation.xml` | Android native |

The `build/` folder is generated. Edit only `tokens/`, then rebuild.

## Storybook (docs site)

```bash
npm run storybook          # local docs at http://localhost:6006
npm run build-storybook    # static site in storybook-static/ — host it anywhere (Chromatic, GitHub Pages, internal server)
```

Both commands rebuild the tokens first, so the docs always match the generated Swift / XML.

| Section | Contents |
|---|---|
| Introduction | Rules of use, status, links |
| Foundations | Color, Typography, Spacing, Radius & Border, Elevation: live previews plus copy-ready names for iOS / Android / Web / Figma |
| Guides | iOS and Android setup with code samples, migrating from 1.x |
| Components | Roadmap; each component gets its own page as it moves over from Figma |

Docs source: `stories/` (MDX pages) and `storybook/` (React components that read `tokens/` directly).
To add a component later, create `stories/components/<Name>.mdx` (or `<Name>.stories.tsx`) using only `var(--…)` tokens.

## Token architecture

```
Primitives (raw values, never used directly in UI)
  color/red/60 = #CC000B       dimension/16 = 16px      font/size/14 = 14px
        │                               │                        │
        ▼                               ▼                        ▼
Semantic (what components use)
  color/bg/brand → red/60      spacing/md → dimension/16   typography/body/md/regular
```

**Rule for components:** use semantic tokens only (`color/*`, `spacing/*`, `layout/*`, `radius/*`, `border-width/*`, `typography/*`, `elevation/*`). Never use `color/red/60` or `dimension/16` in a component.
In Figma, primitives are hidden from the variable pickers for the same reason.

### What's in it

| Group | Count | Notes |
|---|---|---|
| Color — brand & extended | 8 ramps × 11 steps (05–100; neutral also 00 = white): red, blue, cyan, turquoise, green, orange, lime, neutral | Exact values from Figma *New Color — DOKU by Antom*; step names match Figma (`Red/50` = `red/50`) |
| Color — status | 4 ramps × 11 steps: success, warning, error, info | Generated (OKLCH) around the source swatches #16A34A, #F59E0B, #DC2626, #2563EB, which stay exact at success/50, warning/40, error/60, info/60 |
| Color — alpha | 3 alpha colors | Overlay scrim, pressed state |
| Semantic color | 63 | `bg/*`, `text/*`, `icon/*`, `border/*`, `accent/*` |
| Spacing | 12 + 4 layout | 4 px grid: `none 0 · 3xs 2 · 2xs 4 · xs 8 · sm 12 · md 16 · lg 20 · xl 24 · 2xl 32 · 3xl 40 · 4xl 48 · 5xl 64` |
| Radius | 7 | `none 0 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · full 9999` |
| Border width | 3 | `none 0 · thin 1 · thick 2` |
| Typography | 24 styles | Inter. display ×3, heading ×4, body ×12 (regular, medium, semibold, bold), label ×3, caption ×2 |
| Elevation | 5 | `1–4` + `sheet` (casts upward for bottom sheets / bottom nav) |

### Naming across platforms

Each Figma variable carries its code names (Dev Mode shows them):

| Figma | CSS | JS / RN | iOS | Android |
|---|---|---|---|---|
| `color/bg/brand` | `var(--color-bg-brand)` | `ColorBgBrand` | `colorBgBrand` | `@color/color_bg_brand` |
| `spacing/md` | `var(--spacing-md)` | `SpacingMd` | `spacingMd` | `@dimen/spacing_md` |
| `typography/body/md/regular` | `--typography-body-md-regular-font-size`, `…-line-height`, … | `TypographyBodyMdRegularFontSize`, … | same pattern | same pattern (font size in `sp`) |

## Figma library

Every foundation is a Figma variable, so the file can be published as a library and used in any DOKU Figma file.

| Collection | Variables | Shown in pickers |
|---|---|---|
| Primitives | 158 (color ramps, alpha, dimensions) | hidden: used only through aliases |
| Color | 63 semantic (Light mode) | fills, text, strokes |
| Spacing | 16 | gap / padding |
| Radius & Border | 10 | corner radius, stroke width |
| Typography | 120 per-style (`typography/body/md/font-size`, …) + 24 hidden building blocks | font family, weight, size, line height, letter spacing |
| Elevation | 50 (`elevation/2/layer-1/y`, …/color) | effect values |

The 24 text styles and 5 elevation effect styles are linked to these variables.
In Figma, letter spacing is stored in px (display styles: −1% × size, e.g. display/lg = −0.36). In code it stays `-0.01em`.

## Implementation notes

1. **Units.** Dimensions are authored in px and output as 1:1 `pt` (iOS), `dp`/`sp` (Android) and unitless numbers (RN). Text sizes use `sp` on Android so they follow the user's font scale.
2. **Letter spacing is in `em`.** Only the display styles use it (`-0.01em`). React Native and iOS take letter spacing in points, so convert with `letterSpacing × fontSize` (for example, display/lg: `-0.01 × 36 = -0.36`). Android `TextView.letterSpacing` already takes em, so use the value as-is. It is left out of `currency_dimens.xml` because Android dimens require a unit.
3. **Font weights.** `fontWeight` outputs 400/500/600/700. Bundle Inter Regular, Medium, SemiBold and Bold.
4. **Amounts.** Turn on tabular figures for balances and prices so digits don't shift: `fontVariant: ['tabular-nums']` (RN), `font-variant-numeric: tabular-nums` (CSS), `.monospacedDigit()` (SwiftUI).
5. **Elevation.** CSS gets full `box-shadow` values. On RN/Android, map each level to `elevation` / `shadow*` props: `elevation/1→2dp`, `2→4dp`, `3→8dp`, `4→16dp`. The two-layer shadow values in `semantic.tokens.json` are the visual reference for iOS.
6. **radius/full = 9999.** Use it for pills and circles; platforms clamp it to half the height.
7. **Brand red: fill vs. accent.** `bg/brand` and `text/brand` use red/60 (#CC000B) because white text on the pure brand red/50 (#FF000E) is only 3.99:1. Pure red/50 is for `icon/brand`, `border/brand`, logos and decoration.
8. **Brand vs. error.** Error states use the separate `error/*` ramp (#DC2626) rather than brand red. Still pair errors with an icon and text so they don't rely on color alone.
9. **On `bg/muted`**, use `text/secondary`. `text/tertiary` drops to 4.26:1 there.

## Contrast

All text/background pairs used by the semantic tokens meet WCAG AA (4.5:1), and icon and focus colors meet 3:1. See `tokens/contrast-report.json` (35 checks, all passing). Key ones:
- White on `bg/brand` (#CC000B) — 5.88:1
- White on `bg/success` / `bg/error` / `bg/info` — 4.63 / 4.83 / 5.17:1
- `text/primary` on `bg/warning` (#F59E0B) — 6.77:1 (warning fills take dark text, never white)
- `text/tertiary` on `bg/canvas` — 4.79:1 (lowest; don't go lighter for readable text)

`text/disabled` and `icon/disabled` are intentionally below AA, which WCAG allows for disabled controls.

## Migrating from Currency 1.x

See `docs/migration-color.csv` and `docs/migration-type-spacing-radius.csv`, or the *Migration map* page in Figma.

- The palette is redrawn (DOKU by Antom), so colors shift on purpose: median ΔE 3.8.
- Legacy hue → new family: Neutral → `neutral` (now a pure gray), Red → `red`, Blue → `blue`, Cyan and Green (it was teal) → `cyan`, Yellow → `orange`.
- **Pink and Purple are retired** and have no successor. Re-pick those uses from the `accent/*` tokens.
- Status colors now come from the dedicated `success/warning/error/info` ramps, not from green/orange/red/blue.
- `danger` tokens are renamed **`error`** (`bg/error`, `text/error`, `icon/error`, `border/error`).
- Step names keep the Figma scale `05 … 100` (higher = darker); neutral adds `00` (white).
- Text line heights move to a 4 px grid: 12/18→12/16, 20/26→20/28 (16/20 is unchanged).
- Off-grid spacing (10, 14, 9.5, 23…) and the 13 legacy radii map to the nearest token.

## Regenerating the palette

`scripts/palette_v2.py` holds the source ramps and generates the status ramps (the OKLCH helpers are in `scripts/palette.py`). `scripts/build_tokens.py` writes `tokens/*.json` and runs the contrast checks:

```bash
python3 scripts/palette_v2.py scripts/palette.json
python3 scripts/build_tokens.py scripts/palette.json tokens /tmp/figma-payload.json
```
 If a ramp changes, update the Figma variables to match. Figma and this package must stay in sync.

## Not in this release (planned)

- Dark theme. The `Color` collection is ready for a `Dark` mode with no renames.
- Component tokens (`button/primary/bg`, …), to be added when components are rebuilt on these foundations.
- Motion, iconography sizes, grid/breakpoints.
