# Build - 2026-09-21

## Template: `@one-a-day/dev/bench-delta/v1`

A still, hinted 1600x900, nine props (only `rows` required, and it carries a
default). `layoutBenchDelta(rows, opts, W, H)` is exported as a pure function so
the test asserts the rects without parsing m0; `verdictOf(row, smallerIsBetter)`
is exported separately because the verdict is the product and deserved its own
unit tests.

## Variant a - the verdict as coloured words

gate: clean (`npm run build` green, 7-canvas contract sweep green) - render: ok
(exit 0 at 1920x1080 / 1080x1920 / 1080x1080, image kind) - tutorial: ok, 59s,
six pages.

Stills show the shape working: four rows, every baseline bar ending at one
vertical rule, the `cold start` candidate visibly crossing it, and the
run-to-run range drawn as a lighter stripe over each bar. The verdicts read as
coloured text at the right - legible at full size, weak in a thumbnail.

## Variant b - the verdict as a filled pill on every row

ONE idea different: the verdict column becomes a filled rounded rect with
on-colour ink, sized to the measured text. gate: clean - render: ok - tutorial:
ok.

Much stronger at thumbnail size, which is where a browse card and a README
preview actually live. But it exposed a semantic bug that variant a had hidden:
**a filled pill on "no spread given" asserts something.** The pill is a claim,
drawn in the same visual language as "2.41x better"; putting one on the row that
deliberately makes no claim turns the template's own opinion into a fourth
verdict. The stills make it obvious - `gzip 4MB` reads as confidently as the
rows above it.

## Variant c - pills for the three verdicts, nothing behind the fourth

ONE idea different from b: `unknown` keeps quiet dim type with no fill. gate:
clean - render: ok - tutorial: ok.

This is the one in place. The visual hierarchy and the semantics now agree:
three claims are blocks of colour, the absence of a claim is an absence of
colour.

## Why-tutorial

- **The problem page** cites what the scout actually found, in the evidence's
  own words: `github-action-benchmark`'s row shape verbatim, esbuild committing
  two SVGs by hand, hyperfine's six plotting scripts behind numpy/matplotlib/
  scipy, and a GNU coreutils co-maintainer on benchmarks "thrown out without any
  methodology or citations, because they are often trusted without question".
  Ten sources, all opened this run, all listed in `10-scout.md`.
- **The solution page** describes what this variant does, not what the brief
  hoped: one shared rule, the range as a second rectangle, the verdict from the
  overlap - and it states the animation decision with its citation, because that
  decision is the most likely thing for a reader to think is an oversight.

## Verified, not asserted: does the render agree with the geometry?

The sharpest criticism of this design is that the gap between the pair is a
**difference of two quantized lengths**, so the error doubles exactly where the
card makes its claim. That is worth a measurement rather than an opinion, so
the build rendered the card and read the painted pixels back
(`logs/quantization-check.json`):

| canvas | worst drawn-vs-true ratio error |
|---|---|
| 1600x900 | 0.078 % |
| 1920x1080 | 0.096 % |
| 640x360 | 0.234 % |

Painted bar edges match the computed rects to within 1px (the rounded corner).
The reason is `placeInsetPieces`: cells quantize **outward** to the lattice and
each source carries a recovery `inset` that paints it back on the exact rect -
zero drift. The doubling worry is real for `weightedSplit` construction and does
not apply here. 0.23 % at the 640x360 contract floor is two orders of magnitude
below anything a reader could see.

## What was hard (for whoever runs tomorrow)

- **Two official animated cards render a near-blank browse still.**
  `m0saic make @m0saic/github/year-card/v1 --format image` and the same for
  `@m0saic/agents/trace-timeline/v1` both come back with the chrome drawn and
  the data missing, because their motion builds from nothing and the browse
  still is frame 0. `tools/gen-previews.mjs` can fix it per-id
  (`STILL_FROM_VIDEO` + `STILL_AT_SEC`), but `tools/` is off limits to a day
  agent - so a day that ships a reveal ships a blank card it is not allowed to
  repair. Design around it: make frame 0 the finished picture.
- **A clip cannot be a pipeline today.** `tools/check-layout.mjs` skips any
  `mosaic_pipeline` ("the layout gate checks documents only"), so a pipeline
  forfeits the seven-canvas sweep, and `gen-previews` renders un-listed ids with
  `--format image`, which an `emit:"single"` pipeline cannot produce at all.
  The only shippable moving template is a SINGLE document whose t=0 frame is
  already complete.
- **Order the layout pass by what depends on what.** The header summary counts
  verdicts, but only over the rows actually DRAWN - and how many are drawn
  depends on the band height, which depends on the header. The first cut counted
  8 and drew 7. Reserve the header's HEIGHT (a summary is at most two lines)
  before its TEXT exists, measure the band, settle `shown`, then word the
  summary and the footer from it.
- **Fit a column, not a cell.** Fitting each row's name independently left
  neighbouring rows at different type sizes, which reads as a rendering bug. One
  shared size per column, found by shrinking until every string fits, then an
  individual degrade only for a row that still cannot.
- **The ellipsis has to be honest.** The floor fallback originally returned more
  lines than the box could hold (so the name overflowed), and when it did drop
  lines it ellipsized only the kept line - which fits, so no "..." was drawn and
  the name silently lost its tail. Drop lines to what the box holds, then
  ellipsize the whole REMAINDER so the truncation is visible.
- **Size a cell through the same budget the fit used.** A rect cut to the exact
  measured width realizes one pixel short after quantization and the contract
  correctly calls it a clip. `ceil(width / 0.94) + 4`.
- **Two exported names collided with day 001 through the pack barrel.**
  `src/dev/index.ts` is `export *`, and og-card already exports `Rect`, `Fit`
  and `layoutContract`. Shipped templates are frozen, so the new day renames.
  Worth knowing before naming anything generic in an existing pack.
- **`npm run fingerprints:update` reads `dist/`, not `src/`.** Running it before
  `tsc` re-mints the OLD layout and the next build fails on a diff that looks
  like a phantom. Build first (it may fail on the fingerprint), then update,
  then build again.
- **A decorative rect can cost you your glyphs.** A full-track wash under every
  bar kept the tiles off the engine's grid sheet, and the overlay chain hit 27
  at five rows - past the ~25 where ffmpeg SILENTLY degrades inline masks, and
  every svg glyph is an inline mask. `m0saic doctor` reports ok; the warning
  only appears on a real `m0saic make`. Watch for `OVERLAY_CHAIN_DEEP`, and
  suspect the rect that overlaps everything.
- **Browse metadata lives in `src/<pack>/registry.ts`, not in the template.**
  Editing `tags` and `description` on the template file alone leaves
  `template-manifest.json` - what hosts actually read - carrying the scaffold's
  three tags. Two places; change both.
- **`reddit.mjs` is 403 from this machine** - see `10-scout.md`. Seven of ten
  scout angles lost their primary source.

## What was pruned from this day's folder, and why

The adversarial critique rendered several hundred PNGs and a few clips while
trying to break the card. Those are reproducible from the scripts beside them,
and committing ~13 MB of them every day would grow the repo faster than the
templates do, so the media was deleted and **everything else was kept**: every
attack script, every JSON finding, every log, and one representative render -
`logs/attack-make-it-clip/kept/worst-case-480x270.png`, eight rows of 200-char
names at the contract's smallest canvas, which is the picture that shows the
degrade ladder holding.

Kept in full, because they are evidence rather than by-products: the 202 scout
captures under `logs/research/` (every URL the day cites was opened, and this
is the proof), and all three variants with their renders, stills and tutorials.
The day's folder is ~15 MB, against day 001's 2.8 MB; most of the difference is
the research captures from ten search angles instead of one agent's.

## Deviation from the brief, recorded

The brief's prop table listed ten props including `showInterval` (a knob to
hide the run-to-run rectangles). It was dropped: the interval IS the product,
and a switch that turns it off is a switch that turns the template back into
the chart it exists to replace. A user with no variance data simply omits
`range`, and the card says `no spread given` - which is the honest version of
the same state. Nine props shipped.

## In place now: c

The template that ships is variant c plus the fixes the critique earned -
nine changes, none of them to the one idea. They are listed in
`40-critique.md` under "Decision: SHIP c", and the reason variants a and b
score higher on paper than the thing that shipped is explained there too.
