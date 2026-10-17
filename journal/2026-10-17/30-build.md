# Build — 2026-10-17

## Template: @one-a-day/sports/erg-pb-card/v1

The brief's base layout: stacked bands at fixed fractions of the content
height (header / split hero / result / pace track / stat band / footnote),
chrome sized off `min(H, 0.75*W)`, the split as the tallest text on the card.
One folder under `src/` (`sports/erg-pb-card/v1`), scaffolded once
(`npm run new` mis-cased the title as "Erg Pb Card"; fixed to "Erg PB Card" in
the template label, WHY title and the registry row).

**This agent cannot view images** (no image input in this session), so every
visual claim below was verified two ways instead of by eye: the deterministic
geometry inventory (`journal/2026-10-17/debug-geometry.mjs` — every string,
px size, rect, color, per canvas) and targeted pixel probes of the rendered
PNGs through ffmpeg rawvideo crops (`probe-pixels.mjs`, `probe-pixels-b.mjs`,
`probe-chip-b.mjs`, `probe-tutorial.mjs`). 24 probes on variant a, 10 on
variant b, 5 on the tutorial pages — all PASS; the probe scripts are kept in
this folder as the evidence.

## Variant a — the base layout (split hero, filled chip, plain stat band) · gate: clean · render: ok · stills: verified by probe

- Gate: `npm run build` clean end to end (check-freeze, conventions,
  check-registry, check-layout at the 7 contract canvases, check-why), lint
  clean, 34 unit tests + the full suite (543 jest + 68 pipeline) green,
  fingerprint minted (`erg-pb-card.layout.m0`, 31 frames).
- Render: `render-variant.mjs` → 3 stills + tutorial.mp4, all exit 0, none
  degraded (`report.json`: ok, degraded false).
- What the stills show (geometry + probes agree): square 1080 — "1:58.8" at
  211px bold (3.3x the next figure) with "/500m" directly under it; "7:55.0"
  at 63px captioned "2,000 m"; a 990px track with five equal ticks labeled
  1:00/1:30/2:00/2:30/3:00 and the accent marker centered at 49% (probe:
  accent pixel at the computed spot on square, landscape and portrait alike),
  just left of the 2:00 tick; 26 / 209 / 110 in three equal cells labeled
  SPM/WATTS/DRAG; "Marcus Alder" + "the 2026 season's median 2k" left, the
  accent chip "50TH PERCENTILE" with "2026 rower ranking" right-aligned under
  it at the margin; the footnote at the bottom. Portrait 1080x1920 stretches
  the split to 263px; landscape keeps the same bands.

## Variant b — the accent band (the brief's variant b) · gate: clean · render: ok · kept as exploration, reverted

- One idea: the stat band becomes an accent-filled strip (light values over
  it, tinted rules between cells) and the chip drops its fill for an outlined
  pill (page fill + accent ring + ink text). Same layout, same contract, plus
  a `stat-strip` bar in the equal-width relation with the rule and the track.
- Gate: clean (re-minted fingerprint, 32 frames); render ok; probes: the strip
  fills 95% of its band, the outlined chip renders as ring + fill + ink text.
- Why reverted: the probes quantify the trade — accent coverage of the canvas
  goes 0.9% → 8.7%. The band competes with the split hero for the first
  glance, and the outlined chip demotes the percentile, which is this
  community's distinctive claim (the ranking page prints the bands). The
  brief's own guidance: "ship the base by default". The snapshot lives in
  `variants/b/`; restoring variant a's source reproduced its fingerprint
  byte-for-byte, confirming the revert is exact.

## Why-tutorial

- Problem page: the community's records are typed numbers — the PB thread's
  own words ("show off hard work & progress", a signature that IS the ladder,
  "5k 18:42,2 81 drag rate 37"), the Logbook's "shout it to the world" pitch
  with a CSV but no picture, and the ranking page printing percentile bands
  with nothing to post.
- Solution page: one card from one PM5 result, every figure as entered; the
  one decision — the split is the hero because /500m is the unit rowers
  compare in — with the marker on a fixed 1:00-3:00 track that claims nothing
  about ranking, and the percentile as a chip the rower supplies.
- (Pages verified by text-presence probes and check-why's six-step structure
  check; page 5 probed as the card itself at defaults, page 6 as the timeline.)

## What was hard (two or three lines an author would want tomorrow)

- No image input in this session: "open the stills" had to become geometry
  dumps + ffmpeg pixel probes. The probe scripts in this folder are reusable —
  they caught nothing broken today, but they are the only reason these claims
  are more than green exit codes.
- Band ratios are fractions of the CONTENT height, not of `min(H, 0.75W)`: at
  480x270 the header band is 38px and the name+note nearly overflowed it until
  the rule moved inside the band and the content centered below it. S-based
  text sizes inside CH-based bands is what keeps the seven contract zones
  true at every aspect.
- The clamped marker: edge-flush vs center-on-scale. Center-on-scale won
  (the marker straddles the track's end; the printed split never moves), but
  an odd marker width leaves a half-pixel — the test tolerance had to know that.

## In place now: a
