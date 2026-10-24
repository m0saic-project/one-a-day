# Build — 2026-10-24

## Template: @one-a-day/sports/orienteering-split-analysis/v1

One racer's IOF XML 3.0 result row as a shareable split-analysis card. Finish time is
the hero with course and place beside it; each leg is a tape whose length is
`split / slowest`, and any leg with time loss (`loss > 0`, the WinSplits per-leg number)
is pink in bar and signed loss text. Footer computes `TIME W/O MISTAKES = finish - sum(loss)`,
`TOTAL LOSS = sum(loss)`, `BEST LEG = min(split)` from the entered numbers only.

## Variant a — bar = split, pink = mistake · gate: clean · render: ok · stills: layout-verified

The primary. Dark card, split tape whose length is the split over the slowest leg, mistake
legs pink (bar + signed loss text), clean legs neutral with a blank loss cell. No legend.

- Build gate clean for this template (the two warnings in the log are pre-existing on
  `@one-a-day/dev/og-card/v1` and `@one-a-day/social/episode-audiogram/v1`, not mine).
- Rendered landscape/portrait/square all exit 0, not degraded; tutorial 6 pages exit 0.
- **I could not open the PNG stills** (this model does not take image input). I verified
  every claim against the flattened layout instead: hero is the largest text at all five
  canvases (118px @1920, 79px @1280, 178px @1080x1920, 117px @1080x1080, 29px @480x270);
  header cells all end above y=0.26, body rows sit in [0.26, 0.80], footer in [0.80, 1];
  tape rail is 0.34 W (>= 0.32); exactly 3/13 bars accent; clean legs have no loss cell;
  footer reads `42:04 / +2:58 / 1:32`.

## Variant b — loss-first · gate: clean · render: ok

One change from a: the time-loss column becomes the emphasised figure — split time dims
(dim, not bold), the loss text goes bold accent, and the whole mistake row gets a thin
pink left rule plus a pink wash. Rendered clean at all canvases and passes the test suite.
It loses the "split is the bold number" default read, so it stays out of place.

## Why-tutorial

- Problem page: quotes the WinSplits help line ("Some split times have pink background
  colour... a mistake has probably been made") and notes that analysis lives in a table
  page nobody can post, so orienteers hand-make the World of O plot.
- Solution page: states the one decision — time loss is a prop, never re-derived — and that
  the finish is printed as entered, never checked against the split sum.

## What was hard

- The three pinned bands (0-0.26 / 0.26-0.80 / 0.80-1) leave only ~141px for the body at
  480x270, so 13 legs squeeze to a 6px floor and 18 legs fail-fast there (fits everywhere
  else). The `club · class` line had to split into two bound cells to avoid a `bindingsCover`
  warning on `className`, and the cell widths needed the `/0.94` margin or `textFitsMeasured`
  flagged a <1px clip.

## In place now: a
