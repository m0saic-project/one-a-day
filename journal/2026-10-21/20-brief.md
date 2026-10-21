# Brief — 2026-10-21

## The use case

Monkeytype users hit personal bests on a recurring, app-institutionalized
schedule (a new Discord role "every time you achieve a new personal best in
a 60 second test") and share them today as screenshots of the result screen.
The numbers are already structured - the result object carries wpm, rawWpm,
acc, consistency, mode, language and per-second chartData.wpm - so the share
can be one deterministic card from the result itself, with the PB computed,
never retyped.

## The template

- id: `@one-a-day/gaming/typing-pb-card/v1` — pack `gaming`, no new pack:
  Monkeytype is a game-like skill test with leaderboards, XP and PB roles,
  the same shelf as the osu! scorepost and the speedrun PB recap.
- title: `Typing PB Card` (the scaffold prefixes `2026-10-21 · `, tags
  `day-032`).
- kind: image (still PNG); canvas hint `1080x1080`; must also render cleanly
  at landscape (`1920x1080`) and portrait (`1080x1920`) — and pass the
  build's 7-canvas layout sweep (1920x1080 · 1280x720 · 1080x1920 ·
  1080x1080 · 3840x2160 · 640x360 · 480x270).
- duration: still (no clock; `outputHints.format { kind: "image",
  container: "png" }`).

## Layout (regions, ratios — no pixels)

Square/portrait stack five bands; landscape puts the header beside the hero
and the chart and tiles below.

```
+------------------------------------------+
| TYPING TEST        KEYRUNNER             | header ~14% : the sport label,
| english - time 60      [accent rule]     | handle in caps, mode line
+------------------------------------------+
|                                          |
|   102 WPM                                | hero ~36% : the wpm + unit,
|   +3 vs PB  [ NEW PB ]                   | the derived delta line,
|                                          | badge only when wpm > pb
+------------------------------------------+
|  | | || || ||| |||| ||| || ||| || |      | chart ~24% : per-second wpm
|  wpm each second - peak 118 at 41s       | as full-width bars on a track,
|                                          | peak second in accent, caption
+------------------------------------------+
|   ACC    |   CONS   |   RAW              | tiles ~16% : three equal stat
|  98.2%   |   84.5   |   108              | tiles (acc, consistency, raw)
+------------------------------------------+
|  footer line (optional, "" drops it)      | footer ~8%
+------------------------------------------+
```

The one design decision: **the PB is computed, never typed.** The hero is
the wpm; the card derives whether it beats `pb` and by how much, and shows
the `NEW PB` badge and the `+3 vs PB` line only when it does. Nobody
hand-writes the thing the whole post is about, so the card cannot disagree
with itself.

## Layout contract (the invariants the build sweeps at 7 canvases)

- Every text fits its box — `textFitsMeasured` on each text source.
- Header in the top band: `handle` within `yFrac [0, 0.24]`.
- The hero wpm is present and the largest text on the card; the derived
  delta line sits directly under it (`delta-line` within `yFrac [0.15,
  0.6]`).
- The chart track is full-width: `chart-track` `minWidthFrac: 0.9`, within
  `yFrac [0.3, 0.82]`; `chart-bar` present when the chart is non-empty.
- The three stat tiles are one size: `equal: "size"` over the three tiles
  (tolerance 2px).
- Footer band: `footer` within `yFrac [0.86, 1]` when present; when `""`
  the space returns to the card (band never reserved empty).
- A square `NEW PB` badge `aspect: 1` when present (wpm > pb).

## Props (10 + debugLayout)

| name | type | default | what it changes | required |
|---|---|---|---|---|
| `handle` | string | `"keyrunner"` | header handle, drawn in caps (1-16 chars, the site's own name limit) | no |
| `wpm` | number | `102` | hero number, net wpm (0.1-400, one decimal) | no |
| `raw` | number | `108` | RAW tile; must be >= wpm (raw counts mistakes) | no |
| `acc` | number | `98.2` | ACCURACY tile, one decimal + % (0-100) | no |
| `consistency` | number | `84.5` | CONSISTENCY tile, one decimal (0-100) | no |
| `mode` | string | `"english - time 60"` | header mode line (<= 28 ASCII) | no |
| `pb` | number | `99` | the best before this test; drives the computed NEW PB badge + delta | no |
| `chart` | json | 60 values | the per-second wpm bar row (2-120 numbers, 0-400); peak second in accent | no |
| `accent` | string color | `#e2b714` | hero number, badge fill, header rule, peak bar | no |
| `footer` | string | sample line | bottom line; "" removes it | no |
| `debugLayout` | boolean | `false` | draws the layout contract over the card | no |

Derived helpers (pure, exported, unit-tested): `formatWpm(n)` prints an
integer as-is and a fraction to one decimal; `pbLine(wpm, pb)` returns
`+3 vs PB` / `ties PB` / `3 under PB` and `isNewPb(wpm, pb)`; `peakOf(chart)`
returns the peak value and its second for the accent bar and the caption.

`chart` mirrors `chartData.wpm` from the result object: a plain array of
per-second wpm numbers, 2 to 120 of them (a 15s test holds 15, a 60s test
60). Values are numbers 0-400. The bars share one full-width track; the
height of each is its share of the peak, with a 2px floor so a slow second
still shows; the tallest second draws in the accent and the caption prints
the derived peak ("wpm each second - peak 118 at 41s").

## Beats

Still — no beats.

## Defaults must show

A viewer with no inputs sees an invented typist (`keyrunner`) at **102 WPM**
against a 99 WPM best: the big "102" + "WPM", the derived "+3 vs PB" line
and the `NEW PB` badge (102 > 99), a full-width 60-second bar row rising
from the 90s to a 118 peak at 41s (the peak bar in the serika-yellow accent)
with its caption, and the three tiles (98.2% ACC, 84.5 CONS, 108 RAW), on
the dark page the app itself defaults to. The sample is labelled invented in
the footer, like the neighbours.

## Acceptance rubric (the critic scores against this)

1. At defaults the card renders complete — label, handle, mode line, hero
   wpm + unit, derived delta + badge, chart + caption, three tiles — with
   no clipped or overlapping text at any of the seven contract canvases.
2. The PB is correct: `wpm` 102 vs `pb` 99 -> "+3 vs PB" + badge; `wpm` 98
   vs `pb` 99 -> "1 under PB", no badge; `wpm` 99 vs `pb` 99 -> "ties PB",
   no badge. The badge never appears when the hero does not beat the pb.
3. The result is honest: `raw` >= `wpm` is refused the other way around
   (raw counts mistakes), `acc` and `consistency` stay 0-100, the chart
   values stay 0-400, and every bad value throws an error naming the field.
4. The chart is honest: bars share one full-width track, heights are
   value / peak with a 2px floor, the peak second is the accent bar, and
   the caption's peak value and second match the chart.
5. Deterministic and fail-fast: identical props give an identical document;
   no clock, no `Math.random`; a misspelled prop is refused by name; all
   default copy is printable ASCII; the layout contract holds at every
   canvas.

## Variants worth trying (each ONE idea different)

- **a — dark result card:** the baseline above, the app's own dark page
  with the serika-yellow accent; hero left-aligned under the header.
- **b — light preset:** the same layout on a light page with the ink
  recoloured (the "paper" posture some users prefer for prints).
- **c — curve only:** drop the tiles, give the chart band the space, and
  print acc/consistency inside the delta row — the minimal scorepost.
