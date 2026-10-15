# Brief - 2026-10-15

## The use case (two sentences, from the scout)

osu! players on r/osugame and Discord post screenshots of their result screen dozens of times a day, and existing generators already exist only to turn a score link into a shareable image. The osu! API v2 score object is a clean, typed rectangle: player, beatmap, accuracy, combo, rank, score, pp, mods and hit statistics - exactly the fields a card needs.

## The template

- **id:** `@one-a-day/gaming/osu-scorepost-card/v1`
- **title:** `osu! Scorepost Card` (scaffold prefixes the date: "2026-10-15 · osu! Scorepost Card")
- **kind:** image; canvas hint **1920x1080**; aspects that must work: **landscape 16:9**, **portrait 9:16**, **square 1:1**
- **duration:** still

## Layout (regions, ratios, what goes where)

The card is a full-bleed background with a dark overlay, like the osu! result screen.

```
+--------------------------------------------------+
|  BEATMAP TITLE                                   |  <- top band, ~18% of height
|  Artist - Difficulty                             |
+--------------------------------------------------+
|                                                  |
|         [ RANK ]      [ACC ] [COMBO]            |  <- middle band
|                       [SCORE] [ PP ]            |     rank ~30% of min(W,H)
|                                                  |
+--------------------------------------------------+
|  300  100   50   MISS              [mods]        |  <- bottom band, ~18%
+--------------------------------------------------+
```

- **Background:** a generated gradient/spot pattern from a single `backgroundColor` prop. No remote beatmap art in v1 - network dependencies are a risk the scout flagged.
- **Header band (top ~18%):** beatmap title largest, artist and difficulty underneath.
- **Rank badge (center):** a large square tile showing the grade (SS, S, A, B, C, D), coloured by rank tier.
- **Stat tiles (middle-right in landscape, below rank in portrait/square):** four equal tiles for accuracy, max combo, score, pp.
- **Bottom band (~18%):** four small hit-count tiles (300 / 100 / 50 / miss) left, mods right.
- **Portrait adaptation:** rank sits in the upper-middle, stats form a 2x2 grid below it, hit counts stay at the bottom.
- **Square adaptation:** rank centered, stats in one row under it, hit counts in a bottom row.

## Layout contract (the invariants the build sweeps)

- Every text source is `tag`-ged and has a `textFitsMeasured` constraint; default copy is ASCII.
- Header text (title, artist-difficulty) lives in the top band (`yFrac: [0, 0.25]`).
- Rank badge is a square mark (`aspect: 1`) and is present in the middle band (`yFrac: [0.18, 0.75]`).
- The four stat tiles are equal size (`equal: "size"`) and live in the middle/bottom band (`yFrac: [0.35, 0.88]`).
- Hit-count tiles and mods live in the bottom band (`yFrac: [0.78, 1]`).
- No element is clipped at any of the seven contract canvases (1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, 480x270).

## Props

| name | type | default | what it changes | required? |
|---|---|---|---|---|
| `playerName` | string | `"WhiteCat"` | small credit line under the title | no |
| `beatmapTitle` | string | `"Freedom Dive"` | main header line | no |
| `beatmapArtist` | string | `"xi"` | artist sub-line | no |
| `difficulty` | string | `"Another"` | difficulty sub-line | no |
| `rank` | string | `"S"` | the large grade badge; one of `SS`, `S`, `A`, `B`, `C`, `D` | no |
| `accuracy` | number | `98.72` | accuracy stat tile, shown as `"98.72%"` | no |
| `maxCombo` | number | `2385` | max combo stat tile | no |
| `score` | number | `987654321` | score stat tile, comma-separated | no |
| `pp` | number | `786` | pp stat tile | no |
| `hits` | string | `"2000/50/10/5"` | hit counts as `"300/100/50/miss"`; parsed and validated | no |
| `mods` | string | `"HD HR"` | mod acronyms in the bottom-right; empty removes | no |
| `backgroundColor` | string | `"#2a1a3e"` | base colour for the generated background gradient | no |
| `preset` | string | `"dark"` | `"dark"` (classic result screen) or `"light"` (osu!lazer-style) | no |
| `debugLayout` | boolean | `false` | draws the layout-contract overlay | no |

## Defaults must show

With no inputs, the card renders a fictional S-rank scorepost: "Freedom Dive" by "xi" on "Another", 98.72% accuracy, 2385 combo, 987,654,321 score, 786 pp, hit counts 2000/50/10/5, mods HD HR. A viewer immediately recognises it as an osu! result card and can see what every prop controls.

## Acceptance rubric (the critic scores against this)

1. `npm run build` and `npm test` pass; the template renders at defaults with no inputs.
2. Every text label passes `textFitsMeasured` at all seven contract canvases; default copy uses only ASCII.
3. `rank` accepts only `SS`, `S`, `A`, `B`, `C`, `D` and colours the badge by tier.
4. `hits` parses strictly as `300/100/50/miss` with non-negative integers and displays four counts.
5. Layout adapts to landscape, portrait and square without clipping or overlapping; stat tiles stay equal size.
6. No remote image assets are fetched in v1; the background is generated from `backgroundColor`.
7. Validation errors are fail-fast with the prop name and rule, never silent clipping.

## Variants worth trying

1. **a - Split layout:** rank badge on the left 40%, stats stacked on the right 60%, closer to the official result screen.
2. **b - Light preset:** osu!lazer-style light theme with a different rank colour palette.
3. **c - Video beat:** a short clip where the rank badge scales in and the stat tiles count up; not today's ship, but tests whether the data works in motion.
