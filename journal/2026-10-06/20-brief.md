# Brief — 2026-10-06

## The use case (two sentences, from the scout)

Every Saturday a free, timed, volunteer-run 5k (parkrun, in 20+ countries)
gets the same numbers: finishers, new PBs, first timers, visitors, volunteers
and the milestone clubs reached. The run director or report writer turns them
into "this week at our event" for the Facebook page and the results/news
page, today by hand in PowerPoint
([ear1grey/parkrun-event-summary](https://github.com/ear1grey/parkrun-event-summary):
"quite cumbersome") or as plain text
([eventuate](https://github.com/johnsyweb/eventuate),
[parkrun-runstats](https://github.com/rwkura/parkrun-milestones)).

## Neighbours read

Plan call 1 ran four readers and was cut off. The three digests that finished
are in [`plan-notes/`](plan-notes/): docs, neighbours, official shapes. The
parkrun facts reader did not finish, so the domain facts below come from the
scout.

- `community/qsl-card/v1`: a fixed 6-cell table that reflows by aspect, with a
  pure layout function placed by `placeInsetPieces`. Reflowing comes first and
  shrinking is the second resort. Its lesson: chrome you cannot remove
  (`ADIF QSO CARD`) is a defect.
- `music/radio-top-30-chart/v1`: the `w*10 >= h*13` wide switch and invented
  sample data labelled in the footer. Its lesson: about 30 tile and text
  layers tripped `OVERLAY_CHAIN_DEEP`, and the dim ink was invisible in a feed.
- `sports/cubing-average-card/v1` and `sports/swim-time-drop-card/v1`: in
  portrait, extra height turned into dead air. Tiles capped against becoming
  slabs left half a square empty.
- Official `hero/ffmpeg-pulse/kpi-overview/v1` and `github/year-card/v1`: a KPI
  grid of 4x2 / 3 / 2 columns by aspect, each tile a big number over a small
  label (value about 0.42-0.5 of tile height, label about 0.16-0.2).

What is new against those: no card on the shelf is a group's week. This one
has a hierarchy across tiles (two headline numbers over four supporting ones)
and a variable badge row (0 to 10 milestone clubs) that needs an empty-week
rule.

## The template

- id: `@one-a-day/community/weekly-run-report/v1`. The pack exists: "Cards a
  hobby community makes for its own members, filled from the records the hobby
  already keeps". A weekly card made by event volunteers from the results page
  fits it word for word. `sports` holds only one athlete's PB cards.
- title: Weekly 5k Run Report
- kind: image (still PNG). Canvas hint 1080x1080 (the Facebook feed square).
  It must also work at 1920x1080 (results page, slide), 1080x1920 (story) and
  the seven contract canvases, down to 480x270, with no refusal at defaults.
- duration: still (`outputHints` `{ width: 1080, height: 1080, fps: 30,
  durationMs: 2000, format: { kind: "image", container: "png" }, note }`)

## The design decisions

1. **Two headline numbers, not six equal ones.** Finishers and volunteers get
   the two big tiles, side by side and the same size. An event has no run
   without either, and the run report thanks both. New PBs, first timers,
   visitors and first-time volunteers sit under them as four smaller tiles.
   Six equal tiles is variant b, so the critic can compare.
2. **Numbers are props, never fetched, never computed.** The card prints what
   the RD types. It derives no percentages, no "record week" and no ranking.
   The only computation is formatting (thousands comma) and the weekday from
   the date.
3. **The milestone band never moves.** With no milestones, the band stays and
   holds one line, "No milestone clubs this week". The card keeps the same
   shape every Saturday, which matters for a weekly series. More than 5 clubs
   wrap to two rows inside the same band.
4. **No parkrun marks.** The title, the defaults and the labels never use the
   word "parkrun", a logo, or the purple/apricot palette. The user's own
   `eventName` may say "Rushmoor parkrun"; that is their copy. Labels use
   plain words: "finishers", "volunteers", "first timers".
5. **Labels are fixed copy, broken in advance.** "first-time volunteers" is
   the long label and sets the tile label size. It is written as two lines,
   `first-time` / `volunteers`, so a 4-wide row fits at 480x270. All tile
   labels share one size (the minimum across tiles), as qsl-card does.
6. **Any mark is a prop.** The only free line is `footer`, and `""` removes
   it. The template prints no credit and no pitch of its own.

## Layout

Margin `m = 0.05 * S`, gap `0.025 * S`, with `S = min(H, 0.75 * W)`. Bands
are fractions of the content height, given as targets, not pins. The wide
switch is `W * 10 >= H * 13`, as in the radio and cubing cards. Place every
region as a real rect with `placeInsetPieces` from a pure layout function, the
qsl-card shape. There are no full-canvas sources and no `size` exprs. Text is
static svg text in the bundled font, over a `makeColorTile` where there is a
fill. The page colour goes in `document.backgroundColor`.

Square and portrait (stacked), at 1080x1080:

```
+--------------------------------------------+
| WILLOWMERE PARK 5K                         |  header ~15%
| #312  |  SAT 03 OCT 2026                   |
+---------------------+----------------------+
|        214          |         31           |  hero row ~28%
|     finishers       |      volunteers      |  (2 equal tiles)
+----------+----------+----------+-----------+
|   38     |   27     |   19     |    4      |  stat row ~20%
| new PBs  | first    | visitors | first-time|  (4 equal tiles;
|          | timers   |          | volunteers|   2x2 when portrait)
+----------+----------+----------+-----------+
| MILESTONE CLUBS                            |  milestone band ~25%
|  [25] [50] [100] [25]                      |
|  4 runners 3 runners 1 runner 2 volunteers |
+--------------------------------------------+
| Sample week: event and numbers are invented|  footer ~5%
+--------------------------------------------+
```

- Square (`0.8 <= W/H < 1.3`) puts the four stat tiles in one 4x1 row.
- Portrait (`W/H < 0.8`) makes the stat grid 2x2, and the bands grow with H
  (hero about 26%, stats about 26%). Values are capped by width as well as
  height, so 1080x1920 gets bigger numbers instead of dead air. Cap tile
  heights so a tile is never taller than about 1.3x its width. Put the slack
  between bands as equal gaps, not under the footer.

Wide (`W * 10 >= H * 13`), at 1920x1080:

```
+------------------------------------------------------------+
| WILLOWMERE PARK 5K                 #312  |  SAT 03 OCT 2026 |  header ~16%
+-------------------+----------------------------------------+
|       214         |    38 new PBs     |   27 first timers   |
|    finishers      |-------------------+---------------------|  middle ~52%
|-------------------|    19 visitors    |  4 first-time vols  |
|        31         |                   |  (two lines)        |
|    volunteers     |                   |                     |
+-------------------+-------------------+---------------------+
| MILESTONE CLUBS  [25] [50] [100] [25]                       |  band ~24%
| Sample week: event and numbers are invented                 |  footer ~5%
+------------------------------------------------------------+
```

- The left column is about 36% of the width and holds the two hero tiles
  stacked. The right is a 2x2 stat grid.
- The run number and date move to the right end of the header line. If the
  line does not fit, they drop to a second line, the same as square.

Milestone badges:

- A badge is a rounded tile (`roundedRectMask`, or the `effects.rounding` of
  `makeColorTile`) with the club number big and a caption below:
  `4 runners` / `1 runner` / `2 volunteers` / `1 volunteer`.
- Run clubs fill with the accent. Volunteer clubs fill with a neutral
  (light: a tinted grey; ink flips with `onColor`), so the two kinds differ by
  fill AND by caption word, never by colour alone.
- Order: run clubs ascending, then volunteer clubs ascending.
- All badges are the same size. At most 5 per row: 6-10 badges make two rows
  of `ceil(n/2)` and `floor(n/2)`. A row narrower than the band is centred.

Overlay depth: about 6 tiles x 3 layers, 10 badges x 3 and the header and
footer come to near 50 sources. Keep each text in its own tile's cell, as a
2-layer stack (fill plus text), never a full-canvas chain. Check the CLI for
`OVERLAY_CHAIN_DEEP` at 10 badges, and use child documents per band if it
fires (the powerlifting fix).

## Layout contract (the invariants the build sweeps)

Labels are the build's to name; these are the promises.

- Every text fits its box (`textFitsMeasured`, budget `cell * 0.94 - 2px`).
  That covers event name, run line, each value, each label line, the band
  title, each badge number and caption, the empty-week line and the footer.
  Use one label per field and tile, since the copy differs.
- Header at the top: event name `within yFrac [0, 0.25]`.
- Footer at the bottom when present: `within yFrac [0.9, 1]`.
- Hero tiles: exactly 2, `equal: "size"` (tolerancePx 2), each
  `within yFrac [0.1, 0.8]`.
- Stat tiles: exactly 4, `equal: "size"` (tolerancePx 2), each
  `minWidthFrac 0.15`.
- Milestone band: `within yFrac [0.55, 1]`, `minWidthFrac 0.85`. It is
  present every week. Badges are `equal: "size"` when there are 2 or more,
  each `within` the band's y range. With 0 badges the contract declares the
  empty-week line instead of the badge label, so there is no `missing-label`
  and no `too-few`.
- Presence: a value and a label for all six counts; one badge per milestone
  entry.
- No pinned fractions. The use case does not ask for one.

In the test, not the contract:

- The hero value px is at least 1.5x the stat value px, at every contract
  canvas.
- All tile labels share one px size.
- Badge order and captions are as listed in the test vectors.
- Determinism, and each validation error by message.
- A grep over the defaults and labels finds no "parkrun".

## Props (name · type · default · what it changes · required?)

| # | prop | type | default | what it changes |
|---|---|---|---|---|
| 1 | `eventName` | string | `"Willowmere Park 5k"` | Header title, drawn in caps. Up to 40 characters. |
| 2 | `runNumber` | number | `312` | `#312` in the run line. Integer 1-9999. |
| 3 | `date` | string | `"2026-10-03"` | `SAT 03 OCT 2026` in the run line. `""` drops the date and its separator. |
| 4 | `counts` | json | `{"finishers":214,"newPbs":38,"firstTimers":27,"visitors":19,"volunteers":31,"firstTimeVolunteers":4}` | The six tiles. |
| 5 | `milestones` | string | `"4xR25, 3xR50, 1xR100, 2xV25"` | The badges. `""` shows the empty-week line. |
| 6 | `footer` | string | `"Sample week: event and numbers are invented"` | The bottom line. `""` removes it, and the slack goes to the gaps. |
| 7 | `accent` | string (colour) | `"#1f7a4d"` | Run-club badge fill, the header rule and the hero numbers. |
| 8 | `debugLayout` | boolean | `false` | Draws the layout-intent overlay. |

All props are optional and every default renders a full card.

Rules, not props:

- **`counts`**:
  - It must hold exactly the six keys above, each an integer >= 0.
    `finishers` must be >= 1.
  - An unknown key is refused by name ("counts: unknown key 'pb'; use
    finishers, newPbs, ..."), because a silently ignored key is the QSL lesson.
  - A missing key is refused by name. An invented default never fills a real
    week.
  - Sanity checks:
    - `newPbs`, `firstTimers` and `visitors` are each <= `finishers`.
    - `firstTimeVolunteers` <= `volunteers`.
    - Values go up to 9999.
  - Each field is bound with `bindPropPath(cell, "counts", [key], "number")`.
- **Number format**: a thousands comma from 1000 up (`1204` -> `1,204`). Use
  ASCII digits, and no "k" abbreviation; the RD wants the exact count.
- **`milestones`**:
  - Comma-separated entries `<count>x<R|V><club>`, case-insensitive, with
    whitespace tolerated. This is the
    [parkrun-runstats](https://github.com/rwkura/parkrun-milestones) line
    (`4xR25, 4xR50, 1xR100`) plus `V` for volunteer clubs.
  - Clubs are 25, 50, 100, 250, 500 or 1000. Counts are 1-999.
  - At most 10 entries. Each club and kind appears at most once.
  - Each refusal names the bad entry: "milestones: 'R30' is not a club (25,
    50, 100, 250, 500, 1000)"; "milestones: R25 appears twice"; "milestones:
    11 entries, at most 10 fit one card".
- **`date`**: `YYYY-MM-DD` and a real calendar date. The weekday is computed
  from the date (Zeller or day count), never from a clock. Any weekday is
  accepted, because junior events and specials run on other days.
- **Character set**: `eventName` and `footer` accept printable ASCII plus
  Latin-1 and Latin Extended-A (U+00C0-U+017F, the `DRAWN` set the swim,
  cubing and radio cards use). Anything else is refused, naming the
  character.
- **Fit ladder**:
  - Event name: shrink to 70% of its design size, then refuse.
  - Footer: shrink alone to the floor, then refuse.
  - Never ellipsis.
  - The floor is `max(6, round(S * 0.022))`. Defaults must clear it on all
    seven contract canvases.
- **`accent`**: `isColor` plus `colorPicker`, validated `#rrggbb`, with `""`
  falling back to the default. Hero numbers in the accent must keep 4.5:1
  contrast against the page. If the user's accent fails that, the numbers go
  to ink and only fills use the accent.
- **Page**: light paper (`#f6f4ee`) and ink (`#1b1f1c`). It prints, and it
  reads on Facebook's light and dark themes because the card is its own
  rectangle.

Test vectors:

| input | expected |
|---|---|
| `4xR25, 3xR50, 1xR100, 2xV25` | badges 25 `4 runners`, 50 `3 runners`, 100 `1 runner`, 25 `2 volunteers` (volunteer fill) |
| `1xr100,4xR25` | 25 `4 runners`, then 100 `1 runner` |
| `""` | no badges; line `No milestone clubs this week` |
| `4xR30` | refused, names `R30` |
| `4xR25, 2xR25` | refused, duplicate |
| 6 entries | two rows, 3 + 3 |
| 10 entries | two rows, 5 + 5 |
| 11 entries | refused |
| `counts.finishers 1204` | `1,204` |
| `date "2026-10-03"` | `SAT 03 OCT 2026` |
| `date "2026-02-30"` | refused |

Stress copy for the sweep:

- `eventName "Great Salterns Nature Reserve 5k"` (32 characters) and a
  40-character name.
- All counts at 9999 (`9,999`).
- 10 badges.
- A 70-character footer.

## Beats

None; it is a still. No intro animation: the frame is the finished card.

## Defaults must show

At 1080x1080, with no inputs, a stranger sees:

- The header `WILLOWMERE PARK 5K` with `#312  |  SAT 03 OCT 2026` under it,
  and an accent rule.
- Two big tiles: `214` / `finishers` and `31` / `volunteers`.
- Four smaller tiles: `38` / `new PBs`, `27` / `first timers`, `19` /
  `visitors`, `4` / `first-time volunteers`.
- The band `MILESTONE CLUBS` with four badges: 25 `4 runners`, 50
  `3 runners`, 100 `1 runner`, then a neutral 25 `2 volunteers`.
- The footer `Sample week: event and numbers are invented`.

All of it is ASCII. Nothing says "parkrun", yet a run director knows the
layout at a glance: these are their results-page numbers in their order.

Honest weakness the defaults will show: at 480x270 the stat labels are near
the floor (about 7-8 px), and that canvas is a thumbnail.

## Acceptance rubric (the critic scores against this)

1. **The week reads in two seconds.** The two hero numbers are clearly the
   largest text on the card at every canvas (at least 1.5x the stat values).
   A viewer can say "214 ran, 31 volunteered" before reading anything else.
   The four supporting tiles read as one row or grid of equals.
2. **Every number is exactly what was typed.** Six counts, run number, date
   and badge counts appear exactly as given, with `1,204` style commas and a
   correct weekday. There are no invented derived stats, no `k` and no
   malformed digits. Every bad input is refused with a message that names
   the field and the value: unknown counts key, missing key, PBs above
   finishers, bad club, duplicate club, 11 badges, bad date.
3. **The milestone band holds in every week.** It works with 0, 1, 4, 6 and
   10 badges at 1080x1080, 1080x1920 and 1920x1080. The empty week shows the
   one line and keeps the band. Badges are equal, centred and ordered run
   then volunteer, ascending. Run and volunteer badges differ by caption word
   as well as fill.
4. **Balanced at all three aspects.** There is no band of dead air bigger
   than one gap plus one tile row at 1080x1920 or 1920x1080. No tile is a
   slab (taller than about 1.3x its width). Text fits everywhere, with no
   refusal at defaults on the seven contract canvases. Labels are one shared
   size.
5. **It is the RD's card, not ours.** It has no parkrun word, logo or
   palette, and no template credit. The `footer` sample line goes away with
   `""`, and the space goes back into the layout. The props mirror the
   runstats field names closely enough to fill from that list in a minute.
   The registry description says the numbers are typed in, not fetched.

## Variants worth trying (each ONE idea different)

- **a (baseline):** as specified, with the two hero tiles, light paper and
  the green accent.
- **b (layout: six equals):** no hero row. All six counts are equal tiles in
  a qsl-style reflow: 3x2 wide and square, 2x3 portrait. Everything else is
  unchanged. This tests whether the hierarchy earns its space.
- **c (palette: dark page):** night paper (`#14211a`) with light ink and the
  same accent family (lightened to keep 4.5:1). Badges are tuned for dark. It
  is for event pages whose feed is photo-heavy, where a dark card stands out.
  This is one palette change, not a `preset` prop.

Leave the one intended to ship last in place, with its choices as the
defaults. The tests and WHY must follow that variant's `DEFAULTS`: swim b
died on a WHY that described a.

## What is weak in this plan

- The demand is one Chrome extension's README and two text tools. I have
  not seen a PowerPoint original (the Rushmoor and Great Salterns pages were
  not opened). The tile set mirrors the tools, not a seen design.
- There is no importer. The RD retypes six numbers and a milestones line
  each week. The `milestones` syntax is runstats' syntax, but `counts` is
  JSON, which is friction for a volunteer in a hurry.
- The `V` prefix for volunteer clubs is my extension; runstats prints run
  milestones only.
- Without the trademark, the card looks like any 5k's weekly summary. That
  makes it reusable, but a little anonymous at defaults.
- 480x270 is a thumbnail. The labels there will be near the floor.
