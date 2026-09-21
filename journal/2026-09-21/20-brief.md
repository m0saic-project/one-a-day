# Brief - 2026-09-21

## The use case (two sentences, from the scout)

Maintainers of libraries, compilers, runtimes and dev tools re-measure and
re-publish the same performance claim every release, from rows their bench
harness already prints (`github-action-benchmark` needs only `name`, `unit`,
`value`, plus an optional `range` for variance). The picture that claim needs
is either hand-committed SVG (esbuild ships `benchmark-light.svg` and
`benchmark-dark.svg`), a Python scientific stack (hyperfine's `plot_whisker.py`
wants numpy + matplotlib + scipy), or a markdown table that loses the
comparison entirely.

## The template

- **id:** `@one-a-day/dev/bench-delta/v1` - existing pack `dev` (day 001's
  og-card lives there); no new pack.
- **title:** `Bench Delta` (the scaffold prefixes the date:
  `2026-09-21 - Bench Delta`)
- **kind:** image. Canvas hint 1600x900 - a README-shaped still that downsamples
  cleanly to GitHub's ~880px column. Must also hold at 1920x1080, 1080x1920,
  1080x1080 and the contract's 640x360 / 480x270 floors.
- **duration:** still. See "The one design decision" below - this is the
  deliberate answer to the operator note, not an oversight.

## The one design decision

The scout found the constraint before it found the opportunity. This audience
distrusts animated charts: "Animated charts are like that. They're
entertainment, not a tool for seriously comparing data" (HN 30268920,
2022-02-09); "A bar chart race forces you to wait for the animation to finish"
(HN 21535972). A search for anyone asking for an animated benchmark clip
returned nothing, while the demand for the still is documented in four places.

So: **the still is the product.** A variant may add motion, and if it does, the
motion is a reading aid that moves no data rectangle - the first frame and the
last frame are the same picture, byte for byte, and that picture is the one you
commit to the README.

This also fixes a real defect the day found while surveying the substrate: two
official animated cards (`@m0saic/github/year-card/v1`,
`@m0saic/agents/trace-timeline/v1`) render a near-blank browse card, because
their motion builds the picture from nothing and the browse still is frame 0.
A template whose first frame is complete cannot have that bug.

## The second design decision: one shared rule, not one shared scale

Every angle that proposed this use case also flagged the same risk: benchmark
rows span orders of magnitude and mix units (ns and MB and percent on one
card), so a single shared linear scale is a lie. The fix is to make the shared
channel the RATIO, not the magnitude:

- every row's **baseline bar ends at the same x** - one vertical rule down the
  whole card;
- the **candidate bar is drawn relative to its own baseline**, so its length is
  the speedup and nothing else;
- anything that **crosses the rule is a regression**, readable as a shape
  before a single label is read;
- the magnitudes stay as printed numbers in the label column, where mixed units
  are fine.

The rule's x is chosen so the longest bar on the card (including its interval)
still fits the track, so no bar is ever clipped and the scale is stated.

## The third design decision: the interval is the verdict

`github-action-benchmark` calls a result a regression when it is "worse than
the previous exceeding 200% threshold" - a ratio test with no notion of noise.
Hyperfine's users reach for `plot_whisker.py` precisely because the whisker is
the honest part. So this template takes the optional `range` the action already
supports and draws it, then derives the verdict from it:

| intervals | verdict |
|---|---|
| disjoint, candidate better | `faster` |
| disjoint, candidate worse | `slower` |
| overlapping | `within noise` |
| no range given on either side | `no spread given` |

The last row is the opinion: **given no variance, the template will not say a
change is real.** That is a stance, and it is the reason this is not
`@m0saic/charts/bar-graph/v2` with different colours.

## Layout (regions, ratios)

```
+--------------------------------------------------------------------+
| Bench Delta title                          2 faster . 1 slower     |  header
| best of 10 runs . M4 Pro . 2026-09-21      1 within noise          |
+--------------------------------------------------------------------+
|                                    | rule                          |
| parse 1MB json     | [========== baseline ==========]|             |
| 412 -> 171 ms      | [=== candidate ===]  |          |  2.41x faster
|                    |      [~~ iv ~~]      |          |             |
|                    |                      |          |             |
| render 10k rows    | [========== baseline ==========]|             |
| 88.2 -> 84.6 ms    | [========= candidate ========]  |  within noise
|                    |    [~~~~~~ iv ~~~~~~]|          |             |
|                    |                      |          |             |
| cold start         | [========== baseline ==========]|             |
| 1240 -> 1395 ms    | [============ candidate ===========]| 1.13x slower
|                    |                      |    [~ iv ~]|            |
+--------------------------------------------------------------------+
| v1.4 baseline  |  v1.5 candidate  |  run-to-run interval           |  legend
| ratios are per row; the rule is the baseline                       |  footer
+--------------------------------------------------------------------+
```

Column ratios of the content width: label `0.28`, track `0.56`, verdict `0.16`.
Chrome scales with `min(H, 0.75 * W)` so portrait does not grow a slab.

## Layout contract (the invariants the build sweeps)

- every text fits its box - `textFitsMeasured` on every label, value line,
  verdict, header, legend and footer cell, with per-cell labels so one row's
  calibration cannot excuse another's clip;
- `rule` is a full-height element inside the rows band: `minHeightFrac >= 0.3`,
  `within: { yFrac: [0.1, 0.95] }` - if the rule is missing or collapsed the
  card no longer states its own scale;
- `bar-base` and `bar-cand` stay inside the track: `within: { xFrac: [0.25, 1] }`;
- `header` is a full-width band in the top fifth: `minWidthFrac: 0.98`,
  `within: { yFrac: [0, 0.3] }`;
- presence checks for `legend-base`, `legend-cand`, `legend-iv`.

Nothing pins an exact fraction: the use case does not ask for one.

## Props (name . type . default . what it changes . required?)

| prop | type | default | what it changes |
|---|---|---|---|
| `rows` | list | 4 sample rows (one win, one noise, one regression, one with no spread) | the data. Each row: `name` (string, req), `unit` (string), `base` (number, req), `baseRange` (number), `value` (number, req), `range` (number) |
| `title` | string | `"v1.5 vs v1.4"` | the headline |
| `subtitle` | string | `"best of 10 runs . 8-core M4 Pro . cold caches"` | the conditions caveat |
| `baselineLabel` | string | `"v1.4"` | legend + the rule's label |
| `candidateLabel` | string | `"v1.5"` | legend |
| `smallerIsBetter` | boolean | `true` | which direction wins (mirrors the action's `customSmallerIsBetter`) |
| `showInterval` | boolean | `true` | draw the run-to-run interval rectangles |
| `preset` | string | `"dark"` | hand-tuned dark / light trio |
| `accent` | string | `"#3fb950"` | the colour a win is drawn in |
| `debugLayout` | boolean | `false` | check the contract and draw it over the card |

Ten props, every optional one with a default that shows what it does. `rows` is
required but carries a default so the card shows itself with no inputs.

## Defaults must show

With no inputs a reader sees four benchmark rows with all four verdicts on one
card: a clear win with disjoint intervals, a 4% "improvement" that is
**within noise**, a regression that visibly crosses the rule, and a row with no
`range` at all whose verdict reads **no spread given**. The defaults are the
argument.

## Acceptance rubric (the critic scores against this)

1. Renders at defaults on every canvas, exit 0, no error mosaic - and the
   1600x900 still is the browse card with nothing hidden.
2. A stranger reading the default card can say what the template is for
   without the title: four verdicts, one rule, intervals drawn.
3. Every text fits at 1080x1920 and 480x270, including a 46-character
   benchmark name; the degrade ladder is shrink then compact then drop, never
   ellipsis at the floor.
4. The rule is one shared x across all rows, and a regression crosses it. Bar
   lengths are the ratio, verified in the test against the numbers.
5. The verdict is derived from the intervals, never from the ratio alone. A
   row with no `range` says so rather than claiming a win.
6. `smallerIsBetter: false` inverts the verdicts and nothing else.
7. The props are the rows a harness already prints - a `github-action-benchmark`
   entry maps with no renaming beyond adding the baseline side.
8. Code quality against AGENTS.md: deterministic, `ctx.target`, bound text,
   measured fits, ASCII, 5-smooth splits.
9. The why-tutorial tells the truth, including the animation decision and its
   two citations.

## Variants (each ONE idea different)

- **a** - the brief as written: still, stacked baseline/candidate bars per row,
  interval as a stripe, verdict text at the right.
- **b** - one idea different: the verdict becomes a filled **pill** whose width
  is the ratio's magnitude, and the row is tinted by verdict. Tests whether
  colour carries the verdict better than words at thumbnail size.
- **c** - one idea different: an opt-in `readThrough` knob that renders the same
  card as a clip, with a focus band walking the rows and a caption naming each
  verdict. No data rectangle moves; frame 0 equals the last frame. Tests
  whether motion can be added without breaking the still.
