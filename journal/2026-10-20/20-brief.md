# Brief — 2026-10-20

## The use case

Geocachers hitting a find-count milestone want one clean, deterministic "I hit
1,000 finds" share card, built from the numbers their own My Finds pocket-query
GPX already contains (find count, cache-type mix, FTFs, difficulty/terrain),
instead of a hand-built profile banner. The moment repeats at every milestone
and every year-in-review, and it is served today by Project-GC's Milestones tab
and hand-made banners, not by a reproducible per-milestone render.

## The template

- id: `@one-a-day/community/geocache-milestone-card/v1` — pack `community`, no new
  pack: geocaching is a hobby community that makes cards for its own members from
  the record it already keeps (the My Finds GPX), which is exactly the pack's
  description.
- title: `Geocache Milestone Card` (the scaffold prefixes `2026-10-20 · `, tags
  `day-031`).
- kind: image (still PNG); canvas hint `1080x1080`; must also render cleanly at
  landscape (`1920x1080`) and portrait (`1080x1920`) — and pass the build's
  7-canvas layout sweep (1920x1080 · 1280x720 · 1080x1920 · 1080x1080 · 3840x2160
  · 640x360 · 480x270).
- duration: still (no clock; `outputHints.format { kind: "image", container: "png" }`).

## Layout (regions, ratios — no pixels)

Square/portrait stack four bands; landscape puts the header and the hero side by
side and the mix and the tiles below.

```
+------------------------------------------+
| GEOCACHING              NAME (caps)      |  header ~16% : name, "GEOCACHING",
| caching since YYYY      [accent rule]    |  "caching since YYYY", accent rule
+------------------------------------------+
|                                          |
|   1,000                                   |  hero ~42% : the find count,
|   1,000th find  [ MILESTONE ]             |  the derived ordinal line,
|                                          |  badge only when it IS a milestone
+------------------------------------------+
| ##### ==== ## ##                          |  mix ~20% : full-width stacked bar
| Trad 812 · Mystery 121 · Multi 38 ...     |  (top types, "Other" = remainder),
|                                          |  one legend line under it
+------------------------------------------+
|   FTF    |  Avg D   |  Avg T              |  tiles ~16% : three equal stat tiles
|    24    |   2.3    |   1.8               |
+------------------------------------------+
|  footer line (optional, "" drops it)      |  footer ~6%
+------------------------------------------+
```

The one design decision: **the milestone is computed, never typed.** The big
number is the find count; the card derives the ordinal ("1,000th", "1,042nd") and
whether that count is a Project-GC milestone, and shows the `MILESTONE` badge
only when it is. Nobody hand-writes the thing the whole post is about, so the
card cannot disagree with itself.

## Layout contract (the invariants the build sweeps at 7 canvases)

- Every text fits its box — `textFitsMeasured` on each text source; `svgLabel`
  legend copy under `textFitsAll`.
- Header in the top band: `name` within `yFrac [0, 0.24]`.
- The hero count is present and is the largest text on the card; the derived
  ordinal line sits directly under it (`find-count` and `milestone-line` present,
  `milestone-line` within `yFrac [0.15, 0.6]`).
- The mix bar is full-width: `type-mix-bar` `minWidthFrac: 0.9`, within `yFrac
  [0.3, 0.78]`.
- The three stat tiles are one size: `equal: "size"` over `tile-ftf`, `tile-d`,
  `tile-t` (tolerance 2px).
- Footer band: `footer` within `yFrac [0.86, 1]` when present; when `""` the
  space returns to the card (band never reserved empty).
- A square `MILESTONE` badge `aspect: 1` when present (findCount is a milestone).

## Props (8 + debugLayout)

| name | type | default | what it changes | required |
|---|---|---|---|---|
| `cacherName` | string | `"geohiker55"` | header name, drawn in capitals | no |
| `findCount` | number | `1000` | hero number; drives the derived ordinal + badge | no |
| `ftfCount` | number | `24` | first-to-find stat tile | no |
| `avgD` | number | `2.3` | average difficulty tile (1.0–5.0, one decimal) | no |
| `avgT` | number | `1.8` | average terrain tile (1.0–5.0, one decimal) | no |
| `sinceYear` | number | `2015` | "caching since YYYY" header subline (2000–2026) | no |
| `typeMix` | json | 5 entries | the mix bar + legend; top 5 by count, remainder = "Other" | no |
| `accent` | string color | `#4a8f3c` | hero number, badge fill, header rule | no |
| `debugLayout` | boolean | `false` | draws the layout contract over the card | no |

`typeMix` is a list of `{ "type": "<name>", "count": <int> }`. Recognized types
and their fixed palette (bar segments use this, not `accent`): Traditional,
Multi, Mystery, Letterbox, Earthcache, Virtual, Webcam, Event, CITO, Wherigo,
Adventure Lab. A type name outside this set is refused by name (with a
"did you mean" hint); counts are integers >= 0; only the top 5 by count render,
and the bar's remainder (`findCount - sum of the shown`) draws as a gray
`Other` segment so the bar always spans the full width.

Derived helper (pure, exported, unit-tested): `isMilestone(n)` follows
Project-GC — 1, 10, 50, 100; then `n % 100 == 0` for 100 < n <= 1000; then
`n % 500 == 0` for 1000 < n <= 5000; then `n % 1000 == 0` for n > 5000.
`ordinal(n)` formats with thousands separators and the right suffix
("1,000th", "1,042nd", "11th", "21st").

## Beats

Still — no beats.

## Defaults must show

A viewer with no inputs sees an invented geocacher (`geohiker55`) at **1,000
finds**: the big "1,000", the derived "1,000th find" line and the `MILESTONE`
badge (1000 is a milestone), a full-width five-type mix bar with no `Other`
segment (the default counts sum exactly to 1000), and the three tiles (24 FTF,
2.3 avg D, 1.8 avg T), on the light paper with the green accent. The sample is
labelled invented in the schema copy, like the neighbours.

## Acceptance rubric (the critic scores against this)

1. At defaults the card renders complete — name, hero count, ordinal + badge,
   mix bar + legend, three tiles — with no clipped or overlapping text at any of
   the seven contract canvases.
2. The milestone is correct: `findCount` 1000 -> "1,000th" + badge; 1042 ->
   "1,042nd", no badge; the ordinal suffix and `isMilestone` ladder match
   Project-GC exactly (1, 10, 50, 100, 200...1000, 1500...5000, 6000...).
3. The mix is honest: top 5 types by count, unknown type refused by name,
   remainder drawn as gray "Other" so the bar always spans full width; the legend
   copy fits its cell at every canvas.
4. Deterministic and fail-fast: identical props give an identical document; no
   clock, no `Math.random`; a bad value (non-integer findCount, avgD outside
   1–5, a misspelled type) throws an error naming the field.
5. The layout contract holds (text fits, header top band, full-width mix bar,
   three equal tiles, footer band), and all default copy is printable ASCII.

## Variants worth trying (each ONE idea different)

- **a — hero posture:** the baseline left-aligns the hero count under the header;
  variant a centres the count and blows it up, collapsing the header to just the
  name line. Same data, different hierarchy.
- **b — mix as rows:** replace the horizontal stacked bar with a vertical list of
  per-type rows (name + proportional count bar), which gives long type names room
  on portrait. Same data, different mix rendering.
- **c — night-cache preset:** add a `preset` "dark" | "light" with a navy page
  and retuned contrast (the "night cache"), versus the light paper baseline.
  Same layout, different palette.
