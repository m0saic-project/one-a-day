# Brief — 2026-10-08

## The use case (two sentences, from the scout)
Deep-sky astrophotographers who run unattended N.I.N.A. imaging nights post each finished image with a hand-typed block of acquisition numbers ("Ha 128 x 180 s, OIII 123 x 120 s, SII 105 x 180 s = 15.8 h"). The NINA Session Metadata plugin already writes the numbers (`ImageMetaData.csv`: one row per light frame with FilterName, ExposureStartUTC, Duration), so the picture of how the hours per filter stacked up night by night can be made from the rows instead of typed.

Sources are in `10-scout.md`. Demand is inferred from the hand-typed blocks, not quoted from a thread; the template should not claim more.

## The template
- id: `@one-a-day/science/astro-integration-summary/v1`
  - New pack `science`: it is in the vocabulary and the shelf has no pack for instrument or observation data; `community` and `events` are about clubs and gatherings, not acquisition numbers.
- title: Astro Integration Summary (scaffold prefixes the date)
- kind: video. Canvas hint 1920x1080. Must also work, and be swept, at 1080x1920 and 1080x1080 (plus the seven contract canvases down to 480x270).
- duration: `clipSec * 1000` ms, default 12 s. `resolvePinnedDurationMs(ctx)` wins when the user pins one; every beat below is a fraction of the clip, so a shorter or longer `--durationMs` just rescales. `ctx.target.durationMs` is the only clock.

## Layout (regions, ratios, what goes where)
One page, no media. Background is `document.backgroundColor` (deep night navy), never a full-canvas rect.

```
landscape 16:9                          portrait 9:16 (same regions, restacked)
+-------------------------------------+ +-----------------------+
| TARGET NAME             15.8 h      | | TARGET NAME           |
| equipment line          total       | | equipment line        |
+-------------------------------------+ |        15.8 h  total  |
| Ha   [######## n1 n2 n3 n4 ]  6.4 h | +-----------------------+
|      128 x 180 s                    | | Ha    128 x 180 s 6.4 |
| OIII [#####  ]                4.1 h | | [######## ........   ]|
| SII  [###### ]                5.3 h | | OIII ...              |
|  (one row per filter, shared scale) | | ...                   |
+-------------------------------------+ +-----------------------+
| night ruler: | N1 | N2 | N3 | N4 |   | night ruler            |
| footer: Sample data ...             | | footer                 |
+-------------------------------------+ +-----------------------+
```

Regions (fractions of the canvas height unless noted; the build may tune within the invariants):
- **Header** ~20% (portrait ~24%): target name (largest text, left), equipment line under it, running total in hours at the right (landscape) or under the equipment line (portrait). The total is the hero number.
- **Chart** ~58%: one row per filter, in the order given (first appearance in the data). Each row = filter name + frames x seconds caption, a bar track, and the hours value. Landscape: name left (~16% width), track middle (~66%), value right (~18%). Portrait: each row is two stacked lines (name, caption and hours on the first; the full-width track on the second) so the track keeps its length.
- **Night ruler + footer** ~22% (bottom 40% holds both): a full-width ruler with one cell per night, widths proportional to that night's hours, each labelled "N1 09-12" (ordinal + MM-DD) when it fits and just the ordinal when not; above 12 nights only first and last are labelled. Below it the footer line.

The bars are the data:
- **One shared scale**: track length = hours / (largest filter's final hours). The scale is fixed at the FINAL max from t=0, so bars grow into position and never rescale.
- **Bars are stacked by night**: each bar is segments, one per night that filter was imaged, alternating two tints of the filter colour so the nights read as steps. Segment length is that night's hours for that filter on the same scale.
- Filter colours (fixed palette, name match is case-insensitive): Ha bright red-orange, SII dark maroon, OIII teal, L light grey, R red, G green, B blue; any other name takes the next colour from a fixed 6-colour fallback cycle. The filter name is always printed on its row, so colour is never the only cue (Ha and SII are both reds). `filterColors` overrides per filter.

## Layout contract (the invariants the build sweeps)
Swept at 1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, 480x270, at defaults, and in the test for the stress copy (8 filters, 30 nights, longest names).
1. **Every text fits its box.** Tag every text source and give each a `textFits`: `title`, `equipment`, `total`, `filter-name` (one-to-many), `filter-value` (one-to-many; the caption and hours), `night-label` (one-to-many), `footer`. Long target names shrink to 70% then take two lines; they are never ellipsized at the floor. Degrade ladders, not clipping: caption "128 x 180 s" -> "128 fr" -> dropped; night label "N1 09-12" -> "N1" -> dropped; equipment line dropped last-but-one, footer last.
2. **Chrome lives where the design says.** `title` and `total` within `yFrac [0, 0.3]`; `night-ruler` and `footer` within `yFrac [0.6, 1]`; `night-ruler` full width (`minWidthFrac 0.9`); the chart region never overlaps either band.
3. **Presence.** `title`, `total`, `chart`, `night-ruler` always render; one `bar-track` and one `filter-name` per filter (up to 8), checked as one-to-many labels.
4. **Rows are uniform.** `bar-track` heights equal across rows (`relations: equal size` on height or the same row height), even gutters between rows.
5. Not pinned: exact fractions beyond the bands above. (The unit test, not the contract, asserts that each bar's final length equals hours/maxHours within the quantization tolerance.)

## Props (name · type · default · what it changes · required?)
All optional; at defaults the gate renders a complete sample. Defaults are ASCII.
1. `target` · string · "IC 1396 Elephant's Trunk" · header title (1-60 chars). No.
2. `equipment` · string · "RedCat 51 - ASI2600MM Pro - HEQ5" · the header sub-line; "" drops it. (This is a hand-typed line because AcquisitionDetails.csv fields differ per rig.) No.
3. `sessions` · json (array or its JSON string) · four invented nights (below) · rows `{ night: "YYYY-MM-DD", filter: "Ha", frames: 40, exposureSec: 180 }`; frames whole 1-9999, exposureSec 1-3600, up to 30 nights and 8 filters; repeated (night, filter) rows add up. No.
4. `csv` · string · "" · paste of an NINA `ImageMetaData.csv`. When non-empty it replaces `sessions`. Reads only `FilterName`, `ExposureStartUTC`, `Duration` (header lookup, case-insensitive; every other column of the ~30 is ignored); a missing needed column or an unparsable row is refused by name and row number. A new night starts when the gap between consecutive frames exceeds 6 h (timezone-independent); the night's date label is the UTC date of its first frame. No.
5. `filterColors` · json · {} · per-filter `#rrggbb` overrides, e.g. `{"Ha":"#ff5533"}`. No.
6. `clipSec` · number · 12 · clip length in seconds, 4-60 (a pinned `--durationMs` overrides). No.
7. `footer` · string · "Sample data: target and numbers are invented" · bottom line; "" removes it. No.
8. `debugLayout` · boolean · false · draws the contract. No.

Default `sessions` (totals come out to Ha 128 x 180 s = 6.4 h, OIII 123 x 120 s = 4.1 h, SII 105 x 180 s = 5.3 h, total 15.8 h):
- 2026-09-12: Ha 40 x 180, OIII 30 x 120
- 2026-09-13: Ha 48 x 180, SII 35 x 180
- 2026-09-19: OIII 45 x 120, SII 40 x 180
- 2026-09-20: Ha 40 x 180, OIII 48 x 120, SII 30 x 180

Arithmetic (all integer seconds, no float drift): hours shown with one decimal, round half up on total seconds (56 700 s -> 15.75 h -> "15.8 h"). Caption is "128 x 180 s" when the filter's exposure is uniform, otherwise "128 frames". Filter names are taken as given; dual-band filters are NOT split. Empty data, a zero-frame filter or a non-calendar date is refused with a message naming the row.

## Beats (video only)
Fractions of the clip (12 s at defaults):
- **0 - 6% (hook)**: the finished card, so frame 0 and the preview are a complete picture.
- **6 - 14%**: reset: bars empty, total "0.0 h", ruler cells drawn but unfilled; filter names and the header stay.
- **14 - 82% (replay)**: nights land in order, equal time per night. Night k: its segments appear in each filter row (stepwise, one gated tile per segment, not a smooth tween), its ruler cell fills and its label lights, and the running total counts up to the cumulative hours. The current night's ruler cell is highlighted.
- **82 - 100% (hold)**: the finished card again, per-filter hours and the total settled; the clip ends on the same picture it began with, so it loops.
Motion is data, not keyframes: segment k lands at `replayStart + replayLen * (k / nightCount)`. The speedrun-pb-recap clip is the shape to copy for gating and the cold open.

## Defaults must show
Without any input: "IC 1396 ELEPHANT'S TRUNK" over the equipment line, three bars (Ha red-orange 6.4 h, OIII teal 4.1 h, SII maroon 5.3 h) each in alternating-tint night segments, a ruler with four cells labelled N1 09-12 ... N4 09-20, the total 15.8 h, and the footer admitting the numbers are invented. Over 12 s the bars grow night by night and end on the same card.

## Acceptance rubric (the critic scores against this)
1. **The numbers are right.** Per-filter hours, the total and the caption match the arithmetic above for the defaults (6.4 / 4.1 / 5.3 / 15.8) and for a pasted CSV; bar lengths are proportional to hours on one shared scale, fixed from t=0.
2. **It reads as acquisition data at a glance.** Filter name always printed (colour never the only cue), hours legible at phone size, nights visible as steps within each bar and in the ruler; the total is the hero number.
3. **Layout contract holds at all seven canvases and in portrait/square** (no clipped text, no overlapping chart/bands, tracks keep useful length in portrait), including 8 filters / 30 nights / long names via the degrade ladders.
4. **Motion is deterministic and meaningful.** The clip opens and closes on the finished card, nights land in order with the running total in step, the clip rescales with `--durationMs`, two renders match, no clock or `Math.random`.
5. **Props and honesty.** Defaults render a complete sample labelled as invented; `sessions` and `csv` both work and bad input is refused by name; only the three CSV columns are read; the why-tutorial tells the truth (inferred demand, no AstroBin evidence, dual-band convention, no image).

## Variants worth trying (up to 3, each ONE idea different)
- **a (the spec above)**: horizontal night-stacked bars on a dark navy page, stepwise by night.
- **b (layout)**: portrait-first. Vertical columns (one per filter, rising from a shared baseline) with the hours on top and the ruler running down the side; hint 1080x1920. Same data, props and contract; tests whether the stack reads better as towers.
- **c (palette)**: light "observing log" page (paper background, dark ink) with the same filter palette retuned for contrast, for printing or an AstroBin-style white caption. Same layout as a.
