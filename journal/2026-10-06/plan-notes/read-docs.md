**Digest of the m0saic knowledge docs: rules the PLAN brief has to respect (parkrun event-summary still)**

Path shorthand: `K` = `C:/src/m0saic-production/one-a-day/node_modules/@m0saic/knowledge/docs`, `R` = `C:/src/m0saic-production/one-a-day`. Authority order (`K/../README.md`): handbook > skills > templates, and code beats every doc. Items marked [precedent] come from this repo's code, not the docs.

## (1) Hard constraints for the brief

1. **Rects first.** Every region whose rect is known at author time is a real m0 cell, built with `weightedSplit`, `placeRects`/`placeInsetPieces` or `grid`. It must not be a full-canvas source positioned with xExpr/yExpr. Smell test: "if your `m0` is `buildOverlayStack(N)` with `N == element count` and every source is full-canvas … Rebuild with real cells" (`K/templates/construction-strategy.md:48-80`).
2. **Small elements are carved cells.** Badges, chips, rules and swatches get their own cell, never `size:{wExpr,hExpr}` shrinking (`construction-strategy.md:140-156`). Non-rect shapes use `makeColorTile(color,{mask})` with `circleMask`/`roundedRectMask`/`pillMask`. The mask `bounds` aspect must equal the cell aspect (`:179-246`).
3. **Background.** Use `document.backgroundColor`, not a base `1{...}` overlay layer (`:248-266`).
4. **Feasibility.** Below `computeFeasibility(m0)` the render fails with `SPLIT_EXCEEDS_AXIS`. That is "render-or-error" (`K/handbook/feasibility-precision-quantization.md:14-35`). The layout gate sweeps all 7 canvases at defaults, including 480x270 and 640x360 (`R/src/_shared/layout.ts:38-46`, `R/tools/check-layout.mjs:20-24`). So defaults must render, not error, at 480x270.
5. **Split counts above 12 must be 5-smooth (2ᵃ3ᵇ5ᶜ).** Convention `latticeSmooth` has throw posture. Recipe: "Cap weighted bands with weightedSplit(…, { precision: 120 }) — never round each weight to a cap on its own, that sums to 120 ± 1 (119/121)" (`template-utils/dist/template/templateConventions.js:97`).
   - Kit line: `weightedSplit(latticeWeights(weights,{cap:120}), axis, {claimants})` (`K/templates/standalone-pack-authoring.md:226-233`).
   - Counts ≤12 with a rough factor (7, 11) pass. A larger content count is declared as `lattice:{allow:[{count,reason}]}` (`K/templates/reference/template-flags.md:130-165`).
   - The universal basis menu is `divisors(120)` = 1,2,3,4,5,6,8,10,12,15,20,24,30,40,60,120 (`K/handbook/composition-arithmetic.md` §2).
6. **Exactness at the small canvases.** 480=2⁵·3·5, 270=2·3³·5, 640=2⁷·5, 360=2³·3²·5.
   - At 270px tall, row counts 4/8/12/20/24 do not divide exactly. At 640 wide, column counts 3/6/12/15 do not divide exactly.
   - Remainder goes outside-in. That is deterministic quantization, "not a bug" (`feasibility…md:72-95`). Expect ≤1px spread.
7. **Pixels per weight.** Keep px-per-weight ≥ ~4 (`MIN_PX_PER_WEIGHT = 4`, `feasibility…md:139-141`). For hairlines: "≥ 2.5px per weight unit, never a 1-unit band in a ~1px/unit split … `units = floor(bandH / 2.5)` … below 3 units drop the rule" (`:142-149`).
   - A 120-unit basis over 270px is 2.25 px/unit, so it is below the hairline floor at 480x270.
   - Gate 33 example: "A 1-unit rule inside a 13-unit band at 480×270 … quantized to a 0-size frame → the CLI refused the whole render."
8. **Chrome sizing.** Size bars off `min(H, 0.75·W)`, not a fraction of H (`K/templates/layout-contract.md:133-135`, `construction-strategy.md:281-290`). That gives S = 270 at 480x270, 360 at 640x360, 810 at 1080x1920 and 1080x1080, and 1080 at 1920x1080.
9. **Text never wraps or shrinks.** "No rasterizer in m0saic wraps text" (`K/skills/text-in-templates.md:7-23`). Pre-break copy and fit every text to a width budget.
   - Budget = `cell × 0.94 − 2px`; with that budget declare `textFits.padPx: 0` (`layout-contract.md:119-123`; `R/src/_shared/text.ts:13-15` `budget()` = `max(8, floor(cellW*0.94-2))`).
   - Degrade ladder: "Title: shrink to 70% of the design size, THEN ellipsize. Pills: full → compact wording. Status strips: drop trailing metrics (whole ones). Captions: blank at the floor. Tile marks: drop the dims line, keep the number" (`:124-127`).
   - AGENTS.md: "never ellipsis at the floor."
10. **Text px floor.** No doc gives a numeric minimum font size. The only doc example is `titleFontSize = clamp(16..48, round(targetH * 0.022))` (`K/templates/patterns/case-study-lessons.md:59-65`).
    - [precedent] Repo templates use `minPx = max(5..8, round(0.014..0.02·S))`, e.g. `R/src/events/bird-walk-sightings/v1/bird-walk-sightings.ts:108` uses `max(8, floor(S*0.02))`. At S = 270 that is 7-8px.
11. **ASCII only** in rendered copy and defaults. Convention `svgGlyphCoverage` (throw): "Use an ASCII stand-in ("->" for an arrow)". Never draw shapes with glyphs (▲, →, emoji); they render as tofu.
12. **Blank lines are not spacing.** The rasterizer drops them; gaps are geometry (AGENTS.md "Rules that fail silently").
13. **Static text uses the svg rasterizer.** `rasterizer:"svg"` with `renderMode:{kind:"image"}`; drawtext only for per-frame text (`K/templates/patterns/perf-authoring-rules.md:74-80` R9). Svg text has no background; pair it with a `makeColorTile` underneath (`template-utils/dist/sources/svgTextSource.d.ts`).
14. **Cost ceilings** (`COST_BUDGETS`, `template-utils/dist/template/auditRenderedTemplate.d.ts:110`): frames 400, sources 400, overlayDepth 20, inlineMasks 200. Inline masks drop past ~25 overlay layers.
15. **Determinism** (throw): no `Math.random`, clock or ambient state; seeds are props. Geometry comes from `ctx.target`, never `ctx.output` (`K/templates/philosophy-and-contract.md:92-105`).
16. **Fail-fast validation** in `render()` returns `makeErrorMosaic`, which makes the CLI exit 3. The critic treats a 3 on any canvas as fatal (`R/pipeline/prompts/40-critique.md`). Validation must never trip at defaults on the 7 canvases.

## (2) Layout-contract vocabulary

Source: `template-utils/dist/geometry-contract/layoutConstraint.d.ts:209-311`.

**`LayoutConstraint` fields:**
- `label: string`: matches every source tagged with that label (one-to-many).
- `aspect?: number`, `aspectTolerance?` (default 0.02): width/height of the box.
- `minWidthFrac?`, `maxWidthFrac?`: box width / canvas width.
- `minHeightFrac?`, `maxHeightFrac?`: box height / canvas height.
- `within?: { xFrac?: [lo,hi], yFrac?: [lo,hi] }`: the whole box extent must sit inside, EPS 1e-9 (`layoutConstraint.js:349-360`).
- `xCenters?` / `yCenters?: number[]` (px, order-matched) with `centerTolerancePx` (default 4).
- `xCentersFrac?` / `yCentersFrac?` (fractions of the group's own center span) with `centerToleranceFrac` (default 0.015). The count must match the box count, otherwise a `center-count` violation.
- `textFits?: { charWidthEm? (default 0.72), padPx? (default 2) }`.
  - It checks width only: `longestLine textEmUnits × fontSize × em + pad > box.w`.
  - Literal text layers only; expr text is skipped (`layoutConstraint.js:542-569`). ASCII `textEmUnits` equals `.length`.
- A bare `{ label }` is a presence check.
- Boxes are measured after `placement.inset` (`boxAt`, `:453-457`).

**Zero-match rule.** Any constraint whose label has no tagged source raises `missing-label` ("no source tagged … label didn't land in this m0", `:463-470`). A flatten failure turns every constraint into `missing-label`.

**`RelationalConstraint` fields:**
- `label: string | string[]`.
- `equal?: "width"|"height"|"aspect"|"size"`, with `tolerance` (default 0.02) or `tolerancePx`.
- `gutter?: { axis, target?, tolerance? (default 0.01) }`: 1-D only.
- `lattice?: { gutterXPx?, gutterYPx?, tolerancePx? (default 2) }`.
- `coverage?: { expectedNullFrac, tolerance? (default 0.01) }`.
- `equal`, `gutter` and `lattice` need ≥2 nodes, otherwise `too-few`; `coverage` needs ≥1 (`:584-594`).

**Repo wrappers** (`R/src/_shared/layout.ts`):
- `TEXT_EM = { prose: 0.52, caps: 0.66, url: 0.6 }` (`:56`). These are calibrated for bundled Roboto; the 0.72 default "flags a full-width Roboto line that fits". (Docs list dsl-tutorial ems prose 0.62 / digits 0.68 / caps 0.76 at `layout-contract.md:114-118`; the repo uses `TEXT_EM`.)
- `textFitsAll(labels, {charWidthEm})` (`:59`).
- `textFitsMeasured(label, text, px, measuredW)`: exact em +2%, padPx 0 (`:71-75`).
- `withLayoutIntent(doc, ctx, {templateId, constraints, relations?, flatten?, debug})` stamps `doc.editor.layoutIntent` on every render (`:81-99`).
- `mergeTextFits` keeps the widest em per label (`:110-122`): "Prefer unique labels for cells with different copy."
- `sweepLayout(render, id, props, makeCtx, canvases=CONTRACT_CANVASES)` renders at each canvas and runs `assertLayout` on the stamped intent; it throws if a render has no intent (`:143-157`).

**Gate checks** (`R/tools/check-layout.mjs:9-24`):
- Every `type:"text"` source is tagged and covered by `textFits`.
- A `debugLayout` boolean knob exists, default false.
- The intent holds at the 7 canvases at defaults.

Separately, `check-registry`'s `textFits` convention (throw) measures every svg text layer with the real font at the hinted canvas, "after inset and padding".

AGENTS.md guidance: `within:{yFrac:[0.6,1]}` for a footer, `minWidthFrac: 0.98` for a full-width bar, `aspect: 1` for a mark, a bare `{label}` for presence. "pin an exact fraction … only when the observed use case asks for it."

## (3) Variable-count rows (0..N items)

No doc covers 0..N rows directly. What applies:

- **Props may change the m0.** "Core is dynamic — but pure": a template "may generate different m0 strings from props, branch on numeric inputs" (`philosophy-and-contract.md:132-141`). Launder rung 1: "return a DIFFERENT ratio m0 for the canvas" (`feasibility…md:343-346`).
- **Uniform row of N equal cells** uses Recipe 3: gutterless `grid({rows:1, cols:N})` → `"4(1,1,1,1)"`, gap as `latticeCellInset` per-cell `placement.inset`, precision = cell count. "Bar row/column → Recipe 3 with a non-zero `marginPx` on the layout axis" (`K/templates/geometry-recipes.md:11-23, 105-174`; `K/templates/reference/grid.md:8-23`). `placeInsetPieces` is Recipe 2, for independent chips and badges (`geometry-recipes.md:73-103`).
- **Grammar limits** (`K/handbook/dsl-rules.md`):
  - `N ≥ 2` per split, so one item is a bare `1`, not `1(1)` (`ILLEGAL_ONE_SPLIT`).
  - Exactly N slots per split.
  - `-` is a null tile: "Consumes space, renders nothing, does not donate."
  - `0` donates forward and cannot be the last slot (`PASSTHROUGH_TO_NOTHING`).
  - The root must contain at least one `1` (`NO_SOURCES`).
  - Center or letterbox with a null node `{ weight: LB, node: EMPTY }`, never absolute offsets (`geometry-recipes.md:140-141`).
- **Counts.** 5 milestone clubs, or any N ≤ 12, need no smoothness. Above 12, the count must be 5-smooth or declared in `lattice.allow`.
- **Contract with an empty row.** Build constraints conditionally in `render()`. Declaring `{label:"club"}` or `textFits` on a label with zero items gives `missing-label`; `equal`/`gutter` on fewer than 2 items gives `too-few`. One label per KIND; `{label, equal:"size"}` / `gutter:{axis:"x"}` hold uniformity (`layout-contract.md:38-62`).
- **Text helpers.** `multilineTextLayers` returns `[]` for empty input: "check and omit the source" (`text-in-templates.md:77-78`). Degrade by dropping whole items, never by ellipsis.
- **Props for lists.** Array bounds `minItems`/`maxItems`/`lengthOf` (`philosophy-and-contract.md:182-187`).
  - Array of primitives → `string[]`/`number[]`.
  - Array of objects → `json` with `control.flavor:"objectRows"` (+ `columns`, `palette`). Parse and validate in `render()`; the validator accepts any value (`K/templates/reference/json-prop-type.md:10-60`).
  - Binding a list element: `bindProp(src, key, i)`, or `bindPropPath(src, key, [i,"field"], "string"|"number")` with optional `onClear:"remove-element"`, using the ORIGINAL index. Whole lists, booleans and enums are never bindable (`K/templates/reference/prop-bindings.md:36-60`).

## (4) Colour and enum props

- **Colour prop** (convention `colorProps`, throw): it "declares BOTH constraints.isColor: true and control.colorPicker: true."
  - Optional `control.defaultColor` shows a ghost swatch for unset.
  - Every colour knob goes through `resolveColor(value, fallback)`: `""` must fall back, otherwise the mark becomes invisible (`standalone-pack-authoring.md:131-133`).
  - Validate with `toMosaicColor`/`isMosaicColor` and never widen to `string`. Use `as const` on ternary literals (`K/templates/reference/mosaic-color.md`).
  - Text on coloured fills uses `onColor(hex, light, dark)` luminance auto-flip.
  - "Dark is not an afterthought": retune every wash for dark.
- **Enum / closed set**: `constraints.oneOf` and/or `control.options:[{value,label?,description?}]`.
  - It MUST carry a `defaultProps` value. "A closed set must contain the unset state" (add `"none"`, default it, normalise in `render()`) (`philosophy-and-contract.md:189-235`).
  - `defaultsValidate` (throw): defaults must sit inside `oneOf`, `min`/`max` and list bounds.
  - [precedent] `preset: oneOf ["dark","light"]`, with colour overrides `placeholder:"preset background"` (`R/src/dev/og-card/v1/og-card.ts:152-169`).
- **Plain string/number**: needs a default, OR `meta.control.placeholder` naming the unset behaviour.
- **Every visible prop gets `meta.ui.label`** (`propLabels`, record). Other ui fields: `order`, `primary`, `hidden`, `consumer`, `visibleWhen:{prop,equals}`.
- **`debugLayout`**: boolean, default false, ui label "Debug layout".
- **Theming** (`K/templates/theming.md`) is optional: a full `LOCAL_THEME: MosaicThemeTokens` (21 keys), an opt-in `theme?: ThemeSourceConfig` prop and `resolveThemeTokens`. No repo template uses it; grep for `resolveThemeTokens`/`applyTheme` in `src/` finds nothing.

## (5) Still vs video

- **Declare `outputHints.format`.** For a still: `{ kind: "image", container: "png" }`, plus `pixelFormat:"rgba"` only when it ships alpha. Without it the CLI names the output `out.mp4` (`philosophy-and-contract.md:60-75`; `output-resolution-tree.md` §format).
- **Add `outputHints.note`** describing intended resolutions.
- **`resolveOutputHints(props)`** only if the canvas is a knob.
- [precedent] Every repo still uses `{ width, height, fps: 30, durationMs: 2000, format: { kind:"image", container:"png" }, note }`, e.g. `R/src/community/qsl-card/v1/qsl-card.ts:598-603` and `R/src/harness/agent-timeline/v1/agent-timeline.ts:187-193` ("A still. Any canvas; lanes and type scale with min(H, 0.75 * W)").
- `render-variant` renders 1920x1080, 1080x1920 and 1080x1080. For an image template the PNG itself is the still (`R/pipeline/render/render-variant.mjs:34, 93-96`).
- **No intro animation.** A still frame of an animated reveal is blank (the hello-world note at `standalone-pack-authoring.md:95-99`). The plan template's "Beats" section is video-only; write "duration: still".

## (6) What a template must show at defaults

- **AGENTS.md:** "Every optional prop shows its default — the gate renders with no inputs; a template that needs a file to look like anything gets skipped, not shipped."
- **Contract-level rule (2026-09-05):** "a knob shows what it does." Fallbacks that live only in `render()` make the Make panel lie; the schema is the truth. Exemptions: required, `ui.hidden`, `consumer:"human"`, media, json, lists, m0-family (`philosophy-and-contract.md:189-206`).
  - Even though json/list props are exempt, the gate renders with no inputs, so the default list must be populated for the card to show anything.
- **Render-time conventions at defaults on the hinted canvas** (`R/tools/check-registry.mjs:1-21`):
  - `rendersAtDefaults` (throw)
  - `deterministic` (renders twice and diffs)
  - `bindingsSound` (throw)
  - `bindingsCover` (record): bind every prop drawn as text to its rect, even when empty
  - `svgGlyphCoverage` (throw)
  - `textFits` (throw)
  - `noLocalPaths` (throw)
  - `browseSurface` (throw): description and tags, set in the registry row, not the template file
  - `layoutFingerprint` (throw)
  - `latticeSmooth` (throw)
- **Planning prompt** (`R/pipeline/prompts/20-plan.md`): 5-10 props, deterministic defaults, ASCII defaults, and a "Defaults must show" section.
- **Critic** (`R/pipeline/prompts/40-critique.md`):
  - Line 2: "The defaults SHOW the use case — a stranger sees what it is for."
  - Line 3: text fits at portrait and square.
  - Fatal: a prop with no default, or defaults that contradict the brief's "Defaults must show".
  - Malformed numbers or units in the stills are scored as defects; the critic reads every string.