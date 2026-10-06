**Stat-tile / KPI-grid shapes for the parkrun event-summary card (header band, 6 stat tiles, badge row)**

**0. Two constraints to know first**
- **Allowed imports.** `dep-allowlist.json` allows template code to import only `@m0saic/types`, `@m0saic/template-utils`, `@m0saic/dsl-stdlib`, `@m0saic/platform` and `@m0saic/dsl`.
  - `@m0saic/templates` and `@m0saic/text` cannot be imported. The alpine kit and pulse-chrome below have to be copied as patterns.
  - `measureText` and `resolveFontFile` are re-exported from template-utils (`dist/text/textToPath.d.ts`: `export * from "@m0saic/text"`).
- **community-m has no templates.** `node_modules/@m0saic/community-m` is the 33-tile brand-M claim repo (`index.json`, `geometry/m-33.m0c`, `ms/001/slots`).

**1. Official library (`node_modules/@m0saic/templates/template-manifest.json`, 108 entries): the stat/KPI matches**
- `@m0saic/hero/ffmpeg-pulse/kpi-overview/v1`: "aspect-adaptive grid of KPI stat cards (4×2 desktop, 2×4 square/mobile)". This is the closest match.
- `@m0saic/hero/ffmpeg-pulse/fin/v1`: "KPI strip of the week's signature numbers". Aspect-adaptive.
- `@m0saic/github/year-card/v1`: "four KPI tiles … handle + year in the header".
- `@m0saic/benchmark/report/v1`: "machine-specs header, three headline KPIs".
- `@m0saic/alpine/stat-card/v1` (Hero KPI Stat Card), `@m0saic/charts/stat-card/v1` (KPI Stat Card), `@m0saic/alpine/kpi-card/v2`.
- `@m0saic/alpine/leaderboard/v1` ("gold/silver/bronze rank badges"), `@m0saic/alpine/progress-card/v1` (tags include milestone), `@m0saic/alpine/timeline/v2` (milestones).
- Other pulse beats with "a rail of … stat tiles": activity-trend, top-contributors, changes-breakdown, contributions, notable-commits.

**2. Geometry of the three most relevant** (paths under `node_modules/@m0saic/templates/dist/m0saic/`)

**A. `hero/ffmpeg-pulse/kpi-overview/v1/kpi-overview.js`**
- **Layout table per aspect** (L13-23), in native pixels, scaled by `sx=W/nativeW, sy=H/nativeH` (L73-74):
  - desktop 1920×1080: `grid: { x0:140, y0:380, cols:4, cw:386, ch:266, gx:32, gy:32 }`, margin 140
  - square 1080×1080: `cols:3, cw:309, ch:222, gx:20`, margin 56
  - mobile 1080×1920: `cols:2, cw:446, ch:300, gx:28`, margin 80
  - The header cluster (beat chip, logo, title, subtitle) and the footer are fixed rectangles in each table entry.
- **Aspect rule:** `classify(W,H)` in `_shared/pulse-chrome.js` L77: `ar >= 1.3 ? "desktop" : ar < 0.85 ? "mobile" : "square"`.
- **Cells:** placed row-major. A partial last row is centred: `rowX0 = x0 + (fullRowW - (inRow*cw+(inRow-1)*gx))/2` (L80-88). Cards are capped at `cols*4` (L76).
- **Tiles are nested child documents.** Each one is `renderNestedTemplate("@m0saic/alpine/stat-card/v1", …, { slot })` (L97-113).
  - The slot comes from `insetSlot(r,W,H)` (pulse-chrome L185). It predicts the quantized cell (`latticeWeights` cap 120, then `quantizedSections`) and nudges w/h by up to -40/+16 px until both are 5-smooth.
  - Placement uses `insetSafe(node, rect, W, H)`: an EMPTY-margin row/col split (L132).
- **Layout contract:** `PULSE_CHROME_CONSTRAINTS` plus `{ label:"grid-panel", within:{ yFrac:[0.14,0.98] } }` (L157).

**B. `alpine/stat-card/v1/stat-card.js`: one tile with a big number and a small label**
- **Row bands** as weights: `BANDS = { padY:9, header:22, gap1:4, value:42, gap2:4, delta:18, padYb:9 }` (L18).
- **Font caps:** `LABEL_FRAC = 0.11, VALUE_FRAC = 0.30, DELTA_FRAC = 0.115, SUB_FRAC = 0.085` of card H (L20). `PAD_FRAC = 0.085·min(W,H)` (L21).
- **Width cap:** `capFont = max(minPx, min(round(H*frac), floor(cellW / (textEmUnits(text)*em))))` (L156), with em 0.7 for labels and 0.66 for the value. A floor-bound string is cut with `fitEmUnits`.
- **Icon chip:** `iconSide = min(headerH, round(min(W,H)*0.18))` (L127). The comment explains why: tall portrait cards were minting a "~195px chip".
- **Placement:** every element is a rect, placed with `placeInsetPieces({ rootW, rootH, pieces })` (L244).
- **Text:** fixed font and never `fit:"contain'`. The comment says contain "scales text to the cell HEIGHT and then clips the width".

**C. `github/year-card/v1/year-card.js`: header plus a row of KPI tiles, as a ratio tree**
- **KPI band:** `kpiH = content.h*0.24`, `kpiGap = content.h*0.06` (L294).
- **`smoothTileRow(n, gapFrac)`** (L136). It searches 5-smooth totals ≤120 for n equal tiles plus n-1 equal gutters. Its reason, quoted: "4×24 + 3×2 = 102 → a 51 = 3·17 basis".
- **`kpiTile`** (L169-180):
  - rowSplit weights `[10 pad, 50 value, 26 label, 14 pad]` over a rounded tile with radius 0.12
  - value font `capFont(h*0.42)`, label font `capFont(h*0.16)`
  - `capFont = min(px, floor((boxPx*0.94-2)/(textEmUnits*0.72)))` (L165)
  - value is `textCell(value,…,"center","bottom")`, label is `"center","top"`
- **Number formatting:** `fmtCount` is local (L125): `≥1e6 → x.xM`, `≥1e4 → x.xk`, else `toLocaleString("en-US")`.
- **Not aspect-adaptive.** It declares `aspectRatio: { ideal:16/9, min:1.3, max:2.4, mode:"warn" }` (L240).
- **Header** comes from the alpine kit `alpineCard()` (`alpine/_shared/alpine-card.js`):
  - title font `H*0.05`, subtitle `H*0.026`, both width-capped at 0.72 em
  - `headerH = titleFont*1.25 + subFont*1.6 + H*0.018`
  - pad `min(W,H)*0.055`
  - The kit's `split()` runs `weightedSplit(latticeWeights(weights,{cap:120}), axis)`.

**Two more references**
- **fin/v1:** the KPI strip is `cols:4` on desktop and `cols:2` (2×2) on square and mobile. It reuses the same `classify` and `insetSlot`.
- **benchmark/report/v1** (L215-218): rows `weightedSplit([22,20,58],"row")` for header / KPI band / bars, and the KPI band `weightedSplit([13,29,29,29],"col")`.

**Pill / badge recipes**
- pulse-chrome `pill(label, fill, textColor, fontSize)` (L87): `makeColorTile(fill, { effects:{ rounding:{ cornerStyle:"rounded", borderRadius:0.34 } } })` with centred text overlaid.
- Repo cubing card (`src/sports/cubing-average-card/v1/cubing-average-card.ts` L400-404):
  - `chipH = S*(wide?0.07:0.06)*k`, `chipPx = chipH*0.5`, `chipPad = chipH*0.3`
  - `chipW = cellFor(text, chipPx, true) + 2*chipPad`, `radius: 0.5`
  - ink chosen by contrast: `onColor(fill)` (L348)

**3. Helpers you can import** (all from `@m0saic/template-utils` unless noted)

**Placement and grids**
- `placeInsetPieces({ rootW, rootH, pieces: { rect:{x,y,w,h,importance?}, source }[], basis?=120, minFill?=0.5, onHostile?="exact" }) → { m0, sources, expectations, hostile }`. This is the house default for flat rect layouts: zero drift, and the helper picks the split counts.
- `latticeCellInset({ cols, rows, canvasW, canvasH, gutterXPx, gutterYPx, marginPx, cells:[{unit:{c0,r0,cs,rs}, raw}] }) → { insetAt(i), targets, columnEdges, rowEdges, maxClampPx }`. Exact gutters on a gutterless `grid()` m0.
- `gridCellInset({ rows, cols, gridW, gridH, gapPx, outerMargin?, skipFirstRowTop? })` is **@deprecated** (±1 px gap wobble). Do not use it.

**Lattice arithmetic**
- `latticeWeights(weights, { cap?, smallBasis? }) → number[]`
- `latticePrecision(weights, opts) → number | undefined`
- `quantizedSections(totalPx, weights) → number[]`
- `isSmooth(n)`, `roughPart(n)`, `smoothDivisors(n)`, `nearestSmooth(n, max?)`, `ceilToSmooth`, `floorToSmooth`
- `snapSlot(rect, W, H)`, `FAMILY_GCD = 120`, `FAMILY_BASIS_MENU`, `splitCounts(m0) → { cols, rows }`

**Aspect**
- `isPortraitField(W, H): boolean` is in the brand helpers; there is no general orientation classifier.
- From `@m0saic/dsl-stdlib`:
  - `aspectSafeGrid({ landscapeW, landscapeH, portraitW, portraitH, minCols, maxCols, minRows, maxRows, gutter?, priority? })` keeps the same cell count with a matched cell aspect. It does a portrait search, not a transpose: 4×3 landscape pairs with 2×6 portrait.
  - `weightedSplit(weights, axis, { claimant?, claimants?, precision?, mode? })`
  - `equalSplit(count, axis, claimant?)`
  - `strip(count, axis, { cellWeight, gutterWeight?, outerGutters?, claimant? })`
  - `grid({ rows, cols, gutter?, outerGutters?, outputWidth?, outputHeight? })`
  - `formatTick(value)`

**Text**
- `svgLabel(text, boxW, boxH, { color?, maxPx?=round(boxH*0.5), maxLines?=2, vAlign?, padding? })`. It calls `fitSvgText`, which uses a 0.72 width share and **minPx 12**.
- `fitSvgText(text, boxW, boxH, { maxPx, minPx?=12, maxLines, widthFrac?=0.72, heightFrac?=0.66 })`
- `fitSvgLines(lines, boxW, boxH, { maxPx, widthFrac?, heightFrac? })` has a **hard-coded 12 px floor** (`lo = 12`, `best = 12` in `dist/text/fitText.js` L170-172) and no minPx option.
- `wrapMeasured(text, fontSize, maxWidthPx)`, `svgTextSource(layers)`
- `measureText(text, { fontSize, lineHeight?, letterSpacing?, fontPath? }) → { width, height, lines, ascent, descent }`
- `resolveFontFile({ family?, weight?: number|"bold", style? }) → { path, faux } | null`
- `textEmUnits(text)` (Latin = length; Cyrillic 1.55, CJK 1.6), `fitEmUnits(text, maxUnits)`

**Everything else**
- `makeColorTile(color, { overlay?, mask?, placement?, effects? })` (`effects.rounding.borderRadius`)
- `tag(src, label)`, `bindProp(src, propKey)`, `bindProps`
- `withLayoutContract`, `animateNumbersInText` / `countUpExpr` (video only)
- There is no number-formatting helper in template-utils.

**Repo-local helpers** (`src/_shared`)
- `text.ts`:
  - `budget(cellW) = max(8, floor(cellW*0.94-2))` (L13)
  - `textCell({ text, fontSize, color, hAlign, bold?, vAlign?, label })`: svg rasterizer (L18)
  - `widthOf(text, px, bold)`: measured, uses the bold file (L43)
  - `fitLine(text, maxW, maxPx, minPx, bold)` (L49), `wrapFit` (L60), `ellipsize` (L76)
- `layout.ts`:
  - `CONTRACT_CANVASES` (L38), `TEXT_EM = { prose:0.52, caps:0.66, url:0.6 }` (L56)
  - `textFitsAll` (L59), `textFitsMeasured(label, text, px, measuredW)` (L71)
  - `withLayoutIntent(doc, ctx, { templateId, constraints, relations?, flatten?, debug? })` (L81)
  - `sweepLayout(render, id, props, makeCtx, canvases?)` (L143)

**4. Repo templates that already switch layout by aspect** (`src/`)
- `community/qsl-card/v1/qsl-card.ts` L339-340. A 6-cell table:
  - rule: `aspect >= 1.25 ? "wide" : aspect >= 0.8 ? "square" : "tall"`
  - grid: wide `{rows:1, cols:6}`, square `{rows:2, cols:3}`, tall `{rows:3, cols:2}`
  - floor `round(S*10/270)`, about 10 px at 270 (L341)
  - band fractions `{ wide:[0.4,0.15,0.31], square:[0.33,0.19,0.36], tall:[0.28,0.17,0.47] }` for header / strip / table, with the footer taking the rest (L347)
  - a pure `layoutQslCard(props, W, H)` builds rects; `render()` (L616-653) places them with `placeInsetPieces` plus `textFitsMeasured`
- `gaming/crossword-grid-card/v1` L461: `a >= 1.25 ? "landscape" : a <= 0.8 ? "portrait" : "square"`
- `dev/app-store-screenshot-frame/v1` L262: `W/H > 1.15 ? landscape : H/W > 1.15 ? portrait : square`
- `music/radio-top-30-chart/v1` L342: `wide = W*10 >= H*13`; 3×10 when wide, 2×15 otherwise
- `sports/cubing-average-card/v1` L380: same `W*10 >= H*13`, plus `k = clamp(H/W, 1, 1.25)` to scale type on portrait
- `events/bird-walk-sightings/v1` L105: `W/H >= 1.35`, 2 columns × 4 versus 1 × 8
- `events/homebrew-serving-card/v1` L225: `W/H >= 4/3`
- `gaming/speedrun-pb-recap/v1` L671 and `sports/powerlifting-meet-recap/v1` L641: `landscape = W >= 1.25*H`

**5. Geometry recipes**

All three are measured with the bundled Roboto through `measureText`, at the rule `fit ≤ cell*0.94 - 2`. Values were sized as bold `"1,234"` with a cap of 0.5·tileH. Labels were capped at 0.2·tileH.

**Recipe 1 (recommended): QSL-style reflow, a flat pure-layout function plus `placeInsetPieces`**
- **Classification:** shape `aspect>=1.25` wide, `>=0.8` square, else tall.
  - Tiles: wide 3 cols × 2 rows, square 3×2 (2×3 is the alternative), tall 2×3.
  - Margin `m = 0.05·S`, gap `0.025·S`. Header band 0.20·H (wide), 0.18 (square), 0.14 (tall). Badge band 0.20 / 0.20 / 0.16·H.

Measured tile sizes and font limits:

| Canvas | Grid | Tile (px) | Value max | Labels max | "FIRST-TIME VOLUNTEERS" |
|---|---|---|---|---|---|
| 1920×1080 | 3×2 | 586×229 | 114 px | 45 px (all) | 45 px |
| 1080×1080 | 3×2 | 306×240 | 112 px | 44-48 px ("FIRST-TIME VOLS" 36) | 24 px |
| 1080×1080 | 2×3 | 472×151 | 75 px | 30 px (all) | 30 px |
| 1080×1920 | 2×3 | 472×376 | 173 px | 69-75 px | 38 px |
| 480×270 | 3×2 | 146×56 | 28 px | 11 px (all, height-bound) | 11 px |

- **Do not use 6×1.**
  - 480×270: tile 69×120; "FIRST TIMERS" ≤9 px, "FIRST-TIME VOLUNTEERS" ≤5 px.
  - 1080-wide canvases: tile 139 px wide, value ≤50 px.
- **Badge row of 5** (one row): 344×173 at 1920×1080, 176-wide at 1080-wide, 86×43 at 480×270 (bold "500" ≤22 px, "x12" ≤18 px).
- **Ten badges in one row at 480×270:** 40×43, so "500" ≤9 px. Wrap to 5 per row (2 rows), or show only clubs with a nonzero count.
- **Labels:** use one shared label size, the min across tiles, as the qsl-card does. The long label sets the size, so prefer short copy such as "FIRST-TIME VOLS" or a 2-line label.
- **480×270 floor:** set a floor like qsl's `round(S*10/270)` (10 px) or cubing's `max(6, round(S*0.016))`. Refuse with `fail()` naming the prop rather than ellipsizing.

**Recipe 2: Pulse-style per-aspect table**
- `classify` 1.3 / 0.85. Native-pixel table per variant, scaled by sx/sy, partial last row centred.
- For 6 tiles: desktop 3×2, square 3×2, mobile 2×3.
- **Drawbacks:**
  - Separate sx/sy scaling distorts at aspects off the table, e.g. 1280×720 is fine but 4:3 is not.
  - Using nested child documents per tile needs 5-smooth slots (`insetSlot` / `snapSlot`). At 480×270 a 146-px tile width is 2·73, a rough factor.
  - Flatten tiles instead of nesting.

**Recipe 3: Year-card ratio tree**
- `rowSplit([header, gap, grid, gap, badges])` with `latticeWeights` cap 120.
- Each tile row is `colSplit` with `smoothTileRow(n, gapFrac)` weights:
  - n=3, gapFrac 0.02 → tile 32, gap 2, total 100
  - n=2, gapFrac 0.02 → tile 49, gap 2, total 100
  - n=5, gapFrac 0.02 → tile 10, gap 1, total 54
  - n=6, gapFrac 0.02 → tile 15, gap 2, total 100
  - n=7, gapFrac 0.02 → tile 12, gap 2, total 96
  - n=10, gapFrac 0.02 → tile 9, gap 2, total 108
- Each tile is `kpiTile` weights `[10, 50, 26, 14]`.
- It composes, but the kit has to be re-implemented locally (import blocked), and the year-card uses drawtext `fit:"contain"`, not svg text.

**6. Split-count limits that apply here**
- **Rule (`latticeSmooth`, throw):** "every split count above 12 in the rendered layout … must be 5-smooth". `LATTICE_SMALL_BASIS = 12` (`template-utils/dist/lattice/latticeReport.js` L16; `knowledge/docs/templates/reference/template-flags.md` L132-136).
- **Equal splits of 2, 3, 5 or 6 are safe:** all ≤12 and 5-smooth, so 2×3, 3×2 and 6×1 are fine. 7 and 11 also pass as small-basis fill.
- **More than 12 equal badges breaks:** 13 is rough and `latticeWeights` leaves equal weights unchanged (measured). It would need `lattice: { allow: [...] }`.
- **Hand-written item/gutter pixel weights are what bite.** Measured raw totals:
  - `[586,32,586,32,586]` → 911
  - six tiles at 279/27 → 201
  - five badges `[80,7,…]` → 428
  - `[20,1]×5` → 104 = 8·13
  - `[10,1]×7` → 76 = 4·19

  All are rough. `latticeWeights(..., { cap:120 })` rewrote them to 50 / 100 / 54 / 64 / 48 (smooth), up to about 2% drift.
- **`placeInsetPieces` avoids the problem.** Measured: no rough count above 12 at 1920×1080, 1280×720, 640×360, 480×270, 1080×1920 and 1080×1080. That covers 3×2, 2×3 and 6×1 with 5, 6 or 7 badges, max count 120, `hostile` false.
- **Exact divisibility:**
  - 3 and 6 columns don't divide 1280 or 640 (426.67, 213.33), so equal splits there spread pixels outside-in. Rect placement absorbs this.
  - 120 does not divide 270. The 5-smooth divisors of 270 are 1,2,3,5,6,9,10,15,18,27,30,45,54,90,135,270, so a 120-basis split quantizes at 2.25 px per slot. That is feasible, just not exact.
  - Feasibility is `computeFeasibility(m0)` ≤ the target size, or the render fails with `SPLIT_EXCEEDS_AXIS`.
- **Text floor that bites at 480×270:** svg text helpers floor at 12 px. Labels in 146×56 tiles max out at 11 px, so `svgLabel` / `fitSvgText` (default minPx 12) and `fitSvgLines` (hard 12) will overflow there.
  - `fitSvgText` "Emit[s] it WRAPPED at the floor anyway" (fitText.js L95-98).
  - Use the repo's `widthOf` / `fitLine` / `textCell` with `textFitsMeasured` instead (the qsl/cubing pattern), or pass `fitSvgText({ minPx })` explicitly.