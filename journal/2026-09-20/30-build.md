# Build — 2026-09-20

## Template: @one-a-day/dev/og-card/v1

Scaffolded with `npm run new -- dev/og-card --title "OG Card"` (new pack
`dev`; titled by its date since the naming convention landed the same day). The scaffold's shape is kept: typed props with
deterministic defaults, every drawn prop bound to its rect, svg-rasterized
copy measured before it is placed, geometry from `ctx.target`, fail-fast
validation in `render()`, `outputHints.format = png`. The geometry is a pure
exported function (`layoutOgCard(copy, W, H)`) so the test asserts rects, not
pixels: inside the canvas, no overlaps, footer where the brief says, a
106-character title in at most three lines at all four canvases, balanced
wraps (no one-word widow), rows removed when their prop is emptied,
determinism, and thrown errors for an empty title and a bad colour. Seven
tests, all green on every variant.

Each variant was rendered at 1920x1080 / 1080x1920 / 1080x1080 by
`render-variant.mjs` (exit 0 everywhere, no error mosaic) plus the real
1200x630 hint by hand (`stills/og-1200x630.png`). Variant c also has a
stress still: 106-char title, 170-char summary, light preset, pale yellow
accent (`stills/stress-light-1200x630.png`).

## Variant a — accent bar across the top · gate: clean (1 note) · render: ok · stills: the brief's card

A 4-8px full-width accent bar on the top edge; kicker / title / summary
left-aligned, block centred between bar and footer; site left, author right
on the bottom margin. Reads as a link preview at a glance. Weak point: at
link-preview size (a ~500px thumbnail in Slack or X) the bar is under 2px and
all but disappears, so the accent does little work.

## Variant b — accent as a vertical rule on the left of the block · gate: clean (1 note) · render: ok · stills: editorial

The one change: the bar becomes a `0.012 * S` rule beside the text block,
spanning kicker top to summary bottom; the block shifts right by rule + gap;
the top edge is plain. Looks the most "designed"; the rule anchors the block
on portrait. Same thumbnail weakness as a (thin accent), and the rule's
length depends on which optional rows are present.

## Variant c — accent band across the bottom carrying the footer · gate: clean (1 note) · render: ok · stills: the strongest brand presence

The one change: no bar; the footer sits inside a full-width accent band on
the bottom edge, site and author in on-colour ink (relative luminance picks
white or near-black). The band survives thumbnail scaling, which is where OG
images actually live, and it makes the site name the second thing you read.
With no footer copy the band degrades to a thin bottom rule. Weak point: the
kicker still uses the raw accent as ink, so a pale accent on the light preset
(the stress still) is low-contrast there.

## What was hard

- **1200x630 is not 5-smooth** (630 = 2*3^2*5*7). The first build failed
  `latticeSmooth`: `placeInsetPieces` at the default basis 120 picked pitch 6
  and a 105-row split. Fix in two parts: `basis: 90` makes the pitch 7 (90
  rows, smooth; 1080 / 1200 / 1920 stay smooth), and `lattice: { canvas:
  "physical" }` tells the gate the rough factor is the platform's standard
  size, not the construction's. The type's doc gives print trims as the
  example; an externally mandated pixel size is the same situation, but it is
  a judgment call a human should confirm. The alternative was hinting 1200x600
  (2:1, X / GitHub style) and losing the number everyone types.
- **`fitSvgText` measures the regular weight only.** A bold title measured
  regular would clip by a few percent, so the template carries its own fitter
  (`fitCopy`): same greedy wrap + binary search, but `measureText` with the
  bold font file from `resolveFontFile({ weight: "bold" })`. Then a balance
  pass (narrowest width that keeps the line count) removed the widows the
  max-size search produces ("... for every" / "post").
- **Scout tooling:** `pipeline/research/reddit.mjs` gets HTTP 403 from this
  machine for every subreddit (reddit blocks anonymous JSON); the scout used
  HN's Algolia API, web search and `fetch-text.mjs` instead.

## Why-tutorial (added with the convention, same day)

The problem page quotes dev.to's "hand-craft social images for every blog
post ... Twitter shows the old version" and names the three 2026 Show HNs
that rebuilt the same plumbing, with six of the nine scout sources listed
(the rest pointed at `10-scout.md`). The solution page says what shipped:
front matter in, PNG out, measured text, the band that survives thumbnails.

## Layout contract + timeline (added with the conventions, same day)

`layoutContract()` declares measured `textFits` for every text label, the
band's full width and bottom position, the title's margins; the test sweeps
it at seven canvases for four prop cases; `tools/check-layout.mjs` sweeps
the defaults on every build. The tutorial's sixth page is the harness
agent-timeline card; day 001 ran interactively, so its numbers are
self-reported (phase boundaries from the journal's timestamps, tool calls
counted by the agent, no tokens, no cost) and the card says so.

## In place now: c
