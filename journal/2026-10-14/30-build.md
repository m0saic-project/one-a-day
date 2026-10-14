# Build — 2026-10-14

## Template: @one-a-day/gaming/tenxten-challenge-card/v1

The yearly 10x10 board game challenge as one progress card: one row per game
(name | a track of `goal` pips with the first `plays` filled | the count),
the derived "10 x 10 CHALLENGE - 2026" wordmark, three stat tiles
(81 / 100 plays logged, 6 / 10 games done, 2 ahead of year pace at day 287)
and the computed-from footnote - every number falls out of `games`, `goal`
and `dayOfYear` (day-022's "the card cannot disagree with itself", with the
pip lattice as the hero). The pip lattice is two masked colour tiles - one
path holding every filled pip (accent, bound), one every empty - on one
integer lattice X_k = round(x0 + k * pitch), so any goal and games count is
a handful of overlays, not 100 pieces. The row anatomy (label | track |
count) is day-023's climbing pyramid's; the track is a discrete tally.

I could NOT open the stills: this model build rejects image input. So every
claim was checked two other ways, both kept in this folder as evidence:

- `verify-doc.mjs` - 25 claims against the rendered document itself (the
  same dist the CLI renders): every text literal (wordmark, "- 2026",
  handle, three tile values and labels, 10 names, 10 counts, the footnote's
  pace formula), every binding (challenger, year, 20 game cells, accent 2x:
  the pip mask + the pace bar, 0 rejected), the mask paths (81 filled / 19
  empty subpaths), one pip size, fill = min(plays, goal), the three tiles
  one size, determinism (two renders byte-equal), printable ASCII, and the
  arithmetic recomputed from the list.
- `dump-geometry.mjs` + `probe-pixels.ps1` (System.Drawing) - the stills
  sampled pixel by pixel at the exact lattice: all 100 pip centres the
  expected colour (accent filled / track empty) on landscape, portrait,
  square AND the tutorial's template page at 1280x720, the accent pace bar,
  the stat tile fill, the page colour, and dark-ink counts inside every text
  band (wordmark, handle, tile value + label, first and last name, count,
  footnote). 0 failures for each variant.

Plus the gates: `npm run build` clean (the only warnings are the standing
posture notes on og-card/episode-audiogram, not this template);
`check-layout` swept the contract at the seven canvases and the template's
own test swept defaults, a 32-character name (ten rows), an empty
challenger, both presets, goal 5, over-goal 12 + zero plays, and day 366
(behind: no pace bar); `check-why` validated the six tutorial steps at two
canvases; `npm test` 492 + 68 green; every `m0saic make` render exited 0,
`report.json` degraded:false on all three variants; the layout fingerprint
is minted (`tenxten-challenge-card.layout.m0`).

## Variant a — the baseline: three stat tiles over the pip grid · gate: clean · render: ok · stills (probed, not viewed): six full accent rows and an 8-6-4-3 tail verified pip by pip, counts right-aligned, the "2 ahead" tile with an accent bar under it on the page, the computed-from footnote with the pace formula

## Variant b — one change: the stat band as ONE full-width strip line, "81 / 100 plays - 6 / 10 games done - 2 ahead of pace", the accent bar under the pace tail, the grid gains a row of height · gate: clean · render: ok · stills: the strip drawn (3075 ink px at 1920x1080), lattice unchanged, pace bar accent under the tail

## Variant c — one change: pip material — empty pips as rings (the wood board's routed holes: the hole is the page colour, the stroke probed mid-stroke in track colour), filled pips solid circles, same lattice and geometry · gate: clean · render: ok · stills: all 100 pip centres and 19 ring strokes the expected colours

## Why-tutorial: the problem page quotes the evidence's own words ("pick 10 games ... for 100 total plays", "runs on the honor system tracked by each player themselves", the fridge chart "color in every time we played", the $35 wood board's meeples) with the six scout sources; the solution page states the computed arithmetic and the two-mask-lattice decision and names the January-start weak spot in the caveats. 59 s h264, six steps, exit 0, pages 2-4 probed as drawn, page 5 probed as the template itself.

## What was hard (two or three lines an author would want tomorrow)

- The brief's bands are card-height fractions but section sizes are
  short-side-derived: on portrait the tiles sat at 0.079H. The stat band is
  now pinned to >= 0.15H and the grid band structurally clamped into
  [0.31, 0.935]H - a portrait canvas with goal 5 (wide pips, rowPitch under
  the 1.9*pitch cap) otherwise fills the band from 0.25H and escapes the
  promised [0.3, 0.94].
- The brief's accent rule cannot both hold with one accent on light AND
  dark pages: #c94f3d clears 3:1 against both but 4.5:1 against neither, so
  it is pip ink only - "ahead-of-pace ink" is a bar under the pace tile on
  the page, never coloured copy. The 4.5:1 clause never fires.
- placeInsetPieces demands integer rects: the strip variant's measured
  pace-tail x (757.89) had to be rounded. And a and c mint IDENTICAL layout
  fingerprints - the pip material is mask content, not rects - so only b
  changed the fingerprint.
- At dayOfYear 1 the sample list is honestly "81 ahead" (81 plays against a
  0.27-play pace); "19 behind" needs day 366. The test asserted the wrong
  one first.

## In place now: a
