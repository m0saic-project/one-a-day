# Build — 2026-10-06

## Template: @one-a-day/community/weekly-run-report/v1

`src/community/weekly-run-report/v1/` (scaffolded by `npm run new`), registry
row in `src/community/registry.ts`. A still PNG, hinted at 1080x1080. A pure
`layoutWeeklyRunReport` (the qsl-card shape) places every rect; `render` turns
them into pieces. 14 unit tests: the default strings, bindings (six
`bindPropPath` counts plus the header props, footer, accent and band), the
layout sweep at the seven contract canvases for 13 prop sets (ten clubs from
640x360 up), hierarchy and one label size at every canvas, reflow, the
milestone band (0 / 6 / 10 clubs, and 6-10 clubs on six mid-size canvases),
the runstats parser, number and date formats, every refusal by message, the
no-"parkrun" grep, determinism, and the child-document rule below.

Build ran in two calls: call 1 built a, b and c, put a back and started a
review, then hit the session limit. Call 2 (this one) finished the review
fixes (below) and re-rendered a.

Final gate for the variant in place (a), call 2: `npm run build` clean (the
one render-time warning is `social/episode-audiogram`, a frozen template),
`npx eslint .` clean, `npm test` 368 jest + 61 node tests pass, fingerprints
unchanged (19 unchanged, 0 written).

## Variant a — two headline numbers over four smaller tiles, light paper, green accent · gate: clean · render: ok · stills: as promised

The brief's baseline. Re-rendered in call 2 from the final source:
landscape, portrait and square exit 0 with `"warnings": []` in all three
`renders/*.output.json`; tutorial exit 0 (59 s). `variants/a/src/` is
byte-identical to `src/`.

Stills, string by string:
- Header `WILLOWMERE PARK 5K`; `#312 | SAT 03 OCT 2026` under it (to the right
  on landscape); the accent rule under both.
- `214 finishers` and `31 volunteers` in green, the largest text on every
  canvas. Under them `38 new PBs`, `27 first timers`, `19 visitors`,
  `4 first-time volunteers`: in one row on the square (that label breaks in
  two), 2x2 in portrait, and a 2x2 grid right of the stacked pair on landscape.
- `MILESTONE CLUBS` with green 25 `4 runners`, 50 `3 runners`, 100 `1 runner`
  and a grey 25 `2 volunteers`.
- The footer `Sample week: event and numbers are invented`.

Every claim in the header comment, the `description` and `WHY.solution` is in
the picture: the hierarchy, the commas, the weekday, the kept band, no
parkrun word.

Type sizes in px (hero / stat is the ratio the header comment promises):

| canvas | headline | stat | ratio | label | club | caption |
|---|---|---|---|---|---|---|
| 1080x1080 | 140 | 87 | 1.61 | 22 | 69 | 22 |
| 1080x1920 | 211 | 130 | 1.62 | 28 | 68 | 23 |
| 1920x1080 | 109 | 68 | 1.60 | 37 | 68 | 37 |
| 480x270 | 27 | 16 | 1.69 | 9 | 16 | 9 |

Stress renders through the CLI, all re-rendered in call 2 from the final
source (`variants/a/extra/`, props in `*.props.json`). All 16 exit 0 with no
engine warning:
- `ten`: 10 clubs make two rows of 5 at 1920x1080, 1080x1080, 1080x1920,
  1280x720 (90x54 badges, 13 px captions) and 640x360. At 640x360 the
  captions are 6 px, the badge floor there: the club numbers read, the
  captions barely do.
- `empty`: the band stays and says `No milestone clubs this week`; with
  `footer ""` the space goes back to the card.
- `long`: a 40-character name wraps to two lines in portrait, with `1,204`,
  `#1043`, six clubs and a 70-character footer. Six clubs are 3 + 3 on every
  canvas now, including 1920x1080 (144x81 badges). On the wide band that
  leaves empty space either side of the badges.
- `maxed`: all counts `9,999` at 1080x1080 and 480x270. Defaults at 1080x1080,
  3840x2160, 640x360 and 480x270.

## Variant b — six equal tiles, no headline pair · gate: clean · render: ok · stills: as promised

One idea changed: all six counts are equal tiles in the runstats order
(finishers, new PBs, first timers, visitors, volunteers, first-time
volunteers). They are 3x2 on square and wide, 2x3 in portrait, all ink, one
number size (122 px on the square, 162 in portrait). The header comment,
description, WHY solution and tests were rewritten for b, and its snapshot is
internally true. It reads as a tidy stats board, but "214 ran, 31
volunteered" no longer jumps out: 31 sits mid-grid in row two. Rubric 1
(headline at least 1.5x the stats) cannot hold by construction.

b was built and rendered in call 1, before the review fixes below. Its
snapshot shows the layout idea, not the final validation or badge sizing.

## Variant c — a's layout on a night page · gate: clean · render: ok · stills: as promised

One palette change on a: page `#14211a`, ink `#eef2ee`, labels `#b4beb7`,
neutral dark tiles `#2c2c2c`. The accent family is lightened to `#3fae74`
(5.0:1 on the tiles). Badge text flips to the dark ink on the light green.
The volunteer badge is `#5a5a5a` with white text. Contrast: labels 7.3:1 on
the tiles, badge text 6.0-6.9:1. Tiles against the page are only 1.19:1, so
the cards are quiet. It stands out in a photo feed but does not print. Also
built before the review fixes.

## Review (end of call 1, fixed or settled in call 2)

A three-lens review (code, brief, pictures) with one verifier per finding ran
on a. In call 2 one more agent re-checked the fixes against `dist/` with
316 `settleLayout` calls.

Fixed:
- **Misspelled props.** `count` for `counts` silently printed the sample
  week's numbers under a real event name. Unknown top-level props are now
  refused by name, with "did you mean 'counts'?".
- **Impossible clubs.** Milestone counts are checked against the week:
  run-club counts add up to at most the finishers, volunteer-club counts to
  at most the volunteers.
- **Badge vs stat size.** A club number was larger than the stat numbers on
  landscape (76 vs 68). Now headline > stat >= club, and a test pins it.
- **Rows.** Six clubs drew one row of 6 on every wide canvas, against the
  brief's "at most 5 per row". Now always two rows, and one long row only
  when two rows fall below the floor (a thumbnail).
- **Badges refused on mid-size canvases.** 6-10 clubs were refused at
  1000x800, 1200x900, 1290x1000 and 1440x900 while 960x540 took them. The
  lattice snap trimmed a badge by one step (64 to 60 px) and pushed a caption
  that just fitted under the floor. Now the caption is sized first (up to 0.3
  of the badge) and the club number takes the rest of the padded height.
  The re-check found no refusal on any canvas whose shorter side is 300 px or
  more, and no case where a larger canvas refuses what a smaller one takes.
  Ten clubs now also fit 640x360.
- **counts as a string.** A json prop may arrive as its raw JSON string
  (`docs/templates/reference/json-prop-type.md`). It is parsed now; bad JSON
  is refused as "counts is not valid JSON".
- **Footer cap.** A 70-character cap the brief never had is gone. The footer
  shrinks alone to the floor and is refused only there.
- **Tutorial copy.** The "Use it" example now carries `date` and
  `footer ""` (it printed the sample date and the "invented" footer under a
  real week). The caveat now says what was measured: on a thumbnail such as
  480x270, seven or more clubs may be refused. Seven clubs with two-digit
  volunteer counts are refused there; eight with short captions are too.

Not changed, on purpose:
- `newPbs + firstTimers <= finishers` is not checked. The brief asks only
  for each <= finishers, and nobody opened a source this phase showing that a
  first timer can never also get a PB.
- Child canvases are 5-smooth on the contract canvases (a test checks that).
  On an odd canvas where the parent lattice pitch is itself 7 or 13 (e.g.
  1001x1001 with `date ""`), the child sides are multiples of it and rough.
  Those renders still exit 0 with no warning. The `snapGroup` comment now
  says so.

## Why-tutorial

- Problem page (2/6): who (event teams, run directors, report writers), then
  ear1grey's PowerPoint quote ("quite cumbersome"), Eventuate's "to celebrate
  our community on the Facebook page", runstats' "list format", and the four
  opened sources. Nothing clips.
- Solution page (3/6): one card per event per week, typed in, never fetched,
  props mirroring runstats; the decision is that two numbers carry the week
  and the milestone band never moves. Three caveats: no importer, six to ten
  clubs make smaller badges and thumbnails may refuse seven or more, no
  parkrun marks. Nothing clips.

## What was hard

- **Text over a fill never lowers onto the grid sheet.** The first default
  render was 26-27 overlays deep (45 with ten clubs), past the ~25 where
  glyph masks silently degrade. The build gate stayed green; only the CLI's
  `OVERLAY_CHAIN_DEEP` showed it. Each tile and badge is now a child
  document (fill + text, 3-4 deep), and the parent barely overlaps.
- **Child documents fight the layout contract, and the fix costs pixels.**
  The checker's flatten inlines a child into its lattice-quantized cell and
  ignores the ref's inset, so `settleLayout` finds the parent's placement
  pitch (basis 360) and `snapGroup` puts every tile and badge on that lattice
  with a 5-smooth number of steps. That snap can take a step off a badge. Any
  size decided before the snap has to leave room for it, or a canvas between
  two that work gets refused (the mid-size bug above).
- **A still's child is encoded 4:2:0 with no alpha.** Rounded tile corners
  showed the child's own cream a shade off the page. Pure white clipped into
  a grey 16x16 block in each corner. What worked: square tiles, and a
  neutral `#fbfbfb` fill that comes out flat at 251,251,251. A faint block
  (248-253) still shows beside the `214` on the 640x360 render, 1-3 levels
  off the tile, visible only zoomed in.

## Departures from the brief (on purpose)

- Event name: one line down to 70% of its size, then two lines, then smaller
  down to the floor. The brief says refuse after 70%, but it also lists a
  40-character name as stress copy that must render.
- Badge copy has its own floor of `max(6, 1.4% of S)` (15 px at 1920x1080,
  11 at 1080x1080), below the page floor. A thumbnail may take one long row
  of 6-10 badges when two rows would fall below it.
- `first-time volunteers` is one line wherever that costs no size; it breaks
  in two only on the square. The brief draws it as two lines everywhere.
- With `footer ""` the freed height goes to the bands (taller tiles and
  band), not to the gaps as the brief's props table says.
- Unknown top-level props are refused (the brief only asks for unknown count
  keys). A props file with a typo fails instead of rendering the sample week.
- Tiles are square-cornered and near-white (see above). Tiles snap to the
  lattice, so their edges can sit 3-6 px inside the band edges (visible on
  the square's stat row).

## In place now: a

`src/community/weekly-run-report/v1/` is byte-identical to
`variants/a/src/`, and the registry row carries a's description. Scratch
(edit scripts `scratch-review-fixes*.cjs`, `probe.cjs`, `scratch/`,
`scratch/verify/`) is under `journal/2026-10-06/`.
