# Build — 2026-10-10

## Template: @one-a-day/sports/golf-round-scorecard/v1

The golfer's paper scorecard as a deterministic card: two nine-hole strips of
hole / par / score rows (the score row the tallest), OUT and IN columns, a
totals band (nines on the left, the round total in the accent with its to-par
on the right), and the paper card's own notation as masked marks around the
scores - one ring one under par, two rings two or more under, one square one
over, two squares two or more over, a filled ring in the accent for an ace,
the digit over it in the readable ink. Shape alone carries the meaning; no
traffic-light colours.

## Variant a - pencil marks on the dark page · gate: clean · render: ok · stills: (see below)

The default preset (dark, a green-tinted page), every mark in the page ink.
All three canvases exit 0, not degraded; the why-tutorial renders 59 s h264.

## Variant b - the paper card · gate: clean · render: ok

The same geometry with `preset: "light"` as the default: warm paper
background, graphite ink - literally the paper card, cleaned up. Rendered
clean on all three canvases. Left as the recorded alternative; a ships (see
"In place now").

## This session could not view images

The model running today (glm-5.3 via opencode) has no image input, so the
still-by-still audit was done the way the build prompt's fallback directs:
against the flattened layout and the rendered sources, string by string.
`journal/2026-10-10/dump-sources.mjs` (kept) renders the defaults at
1920x1080, 1080x1920, 1080x1080 and 640x360 and prints every tagged source -
97 at each canvas, identical structure across aspects:

- every number on the card is present and well-formed: hole 1-18, the pars
  (OUT 36, IN 36), the scores (OUT 42, IN 47), `total "89"` bound to the
  accent at 135 px, `vspar "+17 vs par"` with its sign, the nines line
  "OUT 42 (+6) - IN 47 (+11) - par 72" - the brief's tabulation exactly
- 13 mark tiles exactly where the deltas put them: the birdie ring on hole
  7, squares on the six bogeys, double squares on holes 8, 10, 16, 17, 18;
  the five level-par holes (1, 3, 10, 12, 14) carry no mark tile
- the legend's four marks are always drawn (with their labels), so the
  notation decodes even on a round that earned no marks; the footnote says
  the filled ring is a hole in one
- every font size clears its floor at 640x360 (gutter 6 px, holes 7 px,
  scores 10 px, legend 9 px) and the unit test sweeps all seven contract
  canvases for 9-hole, eagle-round, ace-round, long-copy and light-preset
  cases

## Why-tutorial

The problem page says who was found (paper-scorecard golfers on r/golf and
the golf forums), what they do today (TheGrint's picture service with "a team
of real humans", the Scorephoto giveaway push, Golf GameBook's in-app share)
- the scout's evidence in its own words, with the sources. The solution page
says what THIS card does (two strips, OUT/IN/TOTAL, the paper card's own
marks in the page ink like pencil) and names the one design decision.

## What was hard

- placeInsetPieces takes integer rects only: the first build died on a
  fractional mark rect (256.95). Every flow-layout width (gutter, mark side,
  legend label, the totals pair) is now rounded before any rect is built
  from it.
- The mark must enclose its number AND fit its cell at every canvas, so the
  score size is fitted to the ring budget (min of column and score row,
  0.96, with doubles 30% larger) with a uniform size for the whole card -
  fitting to the cell alone clips the two-digit scores on narrow canvases.
- The 9-hole case broke the `gutter-1-score` presence check (no second
  strip); every strip-2 constraint is now declared only when there are two
  strips.

## In place now: a
