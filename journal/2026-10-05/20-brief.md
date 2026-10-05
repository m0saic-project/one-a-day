# Brief — 2026-10-05

## The use case (two sentences, from the scout)
Music directors at college and community radio stations rank their 30 most-played recent releases every week, report the rows (`Artist / Title / Label`) to NACC by Tuesday, and then publish the same chart on the station blog and socials: [WDCE](https://create.richmond.edu/parsons/tag/slippers/) posts it as a picture of a table, [KWVA](https://kwva.uoregon.edu/charts?page=4) and [WUSC](https://www.wusc.fm/article/2021/08/top-30-chart-08-24-21) retype it as a list. This template turns the rows the MD already has into the week's chart card: station, `TOP 30`, week-of date, thirty ranked rows, one render per aspect.

## The template
- id: `@one-a-day/music/radio-top-30-chart/v1`. New pack `music`: it is in the pipeline's vocabulary, nothing on the shelf is a music artifact (`community` holds a ham QSL card, `social` a podcast clip and a review card), and a station chart is the first of a kind that will recur.
- title: Radio Top 30 Chart
- kind: image; canvas hint 1080x1080 (the feed post). 1080x1920 (story) and 1920x1080 (blog header) must work, and the contract's other four canvases must hold.
- duration: still.

Neighbours read: `@one-a-day/events/bird-walk-sightings/v1` (day 9; a list of rows from someone's export; its critique is where "a JSON array of objects is not what the user has" comes from), `@one-a-day/sports/cubing-average-card/v1` (day 15; `solves` as a list of strings, a canvas-relative size floor that refuses instead of clipping, the wide / stacked switch at `w/h >= 1.3`, the accented-Latin character rule), `@one-a-day/sports/swim-time-drop-card/v1` (day 12; equal rows that share one font size).

What is new against those: thirty rows on one card with no paging, three unbounded strings per row, and no number or bar to carry the picture. The card is type and rectangles; the fit rule is the template.

## The design decisions

**1. All thirty rows on one card, every time.** No paging, no "top 10 big, the rest small" in the baseline. The artifact the station publishes is the whole chart; WDCE's weekly picture is the whole table. The count in the title is computed from the rows (`TOP 30`, `TOP 10`), never typed, so the title cannot contradict the list.

**2. A row is two lines, not a table line.** Line 1 is the artist, bold. Line 2 is the title, then the label in dimmer ink on the same line. Each string gets the full width of its column instead of a third of it, which is what lets a 50-character title live on a square post. The rank sits in its own narrow cell to the left, with the movement marker under it.

**3. The grid follows the aspect, the rows stay equal.** Wide canvases (`w/h >= 1.3`): up to 10 rows per column, so 30 rows are 3 columns. Square and portrait: up to 15 rows per column, so 30 rows are 2 columns. Ranks read down a column, then the next column (1-10, 11-20, 21-30). Every row cell is the same size.

**4. Long strings: shared size first, the long row alone second, refusal last.** In order:
   1. Every artist line shares one size and every title/label line shares one size, so columns read as columns. Both start at their caps and come down together until every row fits, but not below about 80% of the cap. One long row may cost the others a fifth of their size, no more.
   2. A row that still does not fit shrinks alone, to no less than about 55% of the cap.
   3. Past that the render refuses, naming the row, the field and the canvas (`row 7 title cannot be fitted on 1080x1080: shorten it`). No ellipsis, no clipping, no silently dropped label.

   Caps and floors are fractions of the canvas, with no absolute pixel minimum, so the card is the same picture at every size and a 480x270 render is a thumbnail of the 1920x1080 one. That is a deliberate choice and a weakness (below). The builder may tune 80% / 55% by a few points; the order of the ladder is the spec.

**5. Rows come in as lines, the way the chart is typed.** `rows` is a list of strings, `Artist | Title | Label` with an optional fourth field for last week (`| 4`, `| NEW`, `| RE`). A music director pastes thirty lines; nobody builds JSON objects. Rank is the position in the list.

**6. Movement is text, not arrows.** The bundled font has no arrow glyphs. With a last-week field the rank cell shows `+3`, `-2`, `=`, `NEW` or `RE` under the numeral: up, `NEW` and `RE` in the accent, down and `=` in dim ink. No red, no green. If no row has the field, no row has a marker and the numerals centre in their cells.

## Layout (regions, ratios)

Regions, not pixels. Three bands top to bottom in both arrangements: header (about 12-14% of the height), the chart grid (everything between, at least 75%), footer line (about 4-5%).

```
square / portrait: 2 columns x 15             wide (w/h >= 1.3): 3 columns x 10
+-----------------------------------------+   +----------------------------------------------------+
| KOAD 91.6 FM                     TOP 30 |   | KOAD 91.6 FM                                TOP 30 |
| Week of Oct 6, 2026                     |   | Week of Oct 6, 2026                                |
+--------------------+--------------------+   +----------------+----------------+------------------+
|  1  Paper Lanterns | 16  The Understud. |   |  1 Paper Lant. | 11 Mothwing    | 21 Quiet Motors  |
| +1  Night Bus Ho.. | -5  Second String..|   | +1 Night Bus.. | -3 Porchlight..| -5 Idle  Night.. |
|  2  Glass Orchard  | 17  Pilot Light    |   |  2 Glass Orch. | 12 Tall Grass..| 22 Marble Run    |
| -1  Slow Weather.. | -4  Embers  Low .. |   | ...            | ...            | ...              |
| ...                | ...                |   | 10 Vera & the..| 20 Anya Brook  | 30 The Long We.. |
| 15  Sunday Arcade  | 30  The Long Week. |   | +5 Last Call ..|NEW "Cold Cof.. | -6 Monday  Bra.. |
+--------------------+--------------------+   +----------------+----------------+------------------+
| Sample chart: artists, titles, labels.. |   | Sample chart: artists, titles and labels invented  |
+-----------------------------------------+   +----------------------------------------------------+
```
(The sketch abbreviates with dots for width; the render never does.)

- **Header**: the station (`KOAD 91.6 FM`) is the largest text on the card, bold, left. The chart title (`TOP 30`, or `LOUD ROCK TOP 10` with a `genre`) is on the same band, right-aligned, in the accent. The week-of line sits under the station, smaller and dim. A full-width rule or a change of tone separates header from grid.
- **Grid**: `columns = ceil(n / cap)` with cap 10 (wide) or 15 (otherwise); rows per column `ceil(n / columns)`; the last column may be short and its empty cells stay empty. Columns are equal width with a gutter wide enough that one column's label never sits against the next column's rank (day 9's landscape defect).
- **Row cell**, left to right: rank cell (narrow, fixed for the card: wide enough for `30` and for `NEW`), then the text stack. Rank numeral bold in the accent; marker under it, small. Artist bold in full ink; title regular in full ink; label dimmer, after the title with a fixed gap. Adjacent rows are told apart by a hairline rule or an alternating row tint, one of the two, the builder's pick.
- **Few rows**: with 15 or fewer rows on a square or portrait canvas (10 or fewer on a wide one) the grid is a single column. Cap the row height so a Top 5 does not become slabs; the rows group at the top of the grid band.
- **Footer**: one dim line, left, full width: the station's URL or a credit.

Mechanism: static svg text in the bundled font plus plain colour tiles. No media. Splits above 12 (15 rows, bands) must be 5-smooth: `weightedSplit(..., { precision: 120 })`.

## Layout contract (the invariants the build sweeps)
At the seven contract canvases at defaults, and in the test at the stress copy below:
- every text fits its box: station, chart title, week-of, footer, and per row the rank, marker, artist, title and label (a label per row and field; the copy differs). Measured fits (`textFitsMeasured`), fitted at `cell * 0.94 - 2px`.
- the header lives at the top: station and chart title `within yFrac [0, 0.2]`. The footer lives at the bottom: `within yFrac [0.9, 1]`.
- the chart is the card: every row cell `within yFrac [0.08, 0.97]`, all row cells the same size (`equal: "size"`), each at least a quarter of the canvas width (`minWidthFrac: 0.25`).
- presence: a row cell, a rank, an artist and a title for every row given.
- no pinned fractions; the use case does not ask for one.

In the test, not the contract: exactly `n` row cells; rank `i` is in column `floor((i-1) / perColumn)` and the ranks descend a column in order; the shared sizes are shared (one artist size and one title size across all rows that did not shrink alone); the marker text for each default row; the computed chart title; determinism; each validation error.

## Props (name - type - default - what it changes - required?)
All optional; every default is part of the picture.

| prop | type | default | what it changes |
|---|---|---|---|
| `station` | string | `"KOAD 91.6 FM"` | the header mark: call sign and frequency, free text, 1-32 characters |
| `weekOf` | string | `"Week of Oct 6, 2026"` | the line under the station, free text (no date parsing); empty removes it |
| `genre` | string | `""` | prefix of the chart title: `"Loud Rock"` gives `LOUD ROCK TOP 10`; empty gives `TOP 30` |
| `rows` | string[] | the 30 lines below | the chart, 1-30 lines of `Artist \| Title \| Label` or `Artist \| Title \| Label \| LW`; the count sets the title and the grid |
| `footer` | string | `"Sample chart: artists, titles and labels are invented"` | the bottom line (a URL, `As reported to NACC`); empty removes the line, not the band |
| `accent` | #rrggbb | builder's pick (one saturated station colour) | rank numerals, chart title, up / `NEW` / `RE` markers |
| `preset` | `"dark"` \| `"light"` | `"dark"` (variant c: `"light"`) | page and ink |
| `lead` | boolean | `false` (variant b: `true`) | rank 1 as a full-width lead row above the grid (see variants) |
| `debugLayout` | boolean | `false` | draws the contract over the render |

Rules, not props:
- A row line is split on `|`, fields trimmed. Three or four fields, artist / title / label all non-empty (NACC requires all three); anything else is refused with the line number and what was found. Artist and title up to 80 characters, label up to 40.
- Fourth field: an integer 1-200 (last week's rank), `NEW`, `RE` (case-insensitive), or empty for "no marker on this row". Marker: `lw - rank > 0` prints `+d`, `< 0` prints `-d` with an ASCII hyphen, `0` prints `=`.
- Characters: printable ASCII plus accented Latin (U+00C0-U+017F), the same rule and regex day 15 shipped; a chart without `Sigur Ros` spelled properly is not a chart. Anything else is refused by name. Defaults are ASCII only.
- NACC's copy conventions pass through untouched: `"Title" [Single]`, `Title [EP]`. The template does not add or strip them.
- More than 30 rows is refused (the message says a station chart is 30 and a longer list needs a second card). `accent` must be `#rrggbb`. `station` must be non-empty.
- The template does not sort, dedupe or re-rank. The list order is the chart.

Default rows (invented; an even-tenth frequency like 91.6 is not a US FM channel, on purpose, so the default cannot be mistaken for a real station's chart; any match with a real act is accidental):

```
Paper Lanterns | Night Bus Home | Tidewater | 2
Glass Orchard | Slow Weather | Half Moon Recordings | 1
The Marigolds | Kitchen Radio | Fern & Flint | 5
Delta Kiosk | Parking Lot Hymns | Low Tide | 4
Nora Vance | "Blue Receipt" [Single] | Self-Released | NEW
Static Bloom | Greenhouse | Tidewater | 3
Hollow Pines | A Field Guide to Leaving Early Without Saying Goodbye | Brass Key | 12
Juno Park | Soft Machines [EP] | Night Shift | 6
Cardigan Sea | Postcards | Half Moon Recordings | 9
Vera & the Lowlights | Last Call | Brass Key | 15
Mothwing | Porchlight | Fern & Flint | 8
Tall Grass Choir | Everything Is Fine Here | Low Tide | NEW
Okapi | Signal Hill | Night Shift | 7
Rosa Calloway | Late Bloomer | Tidewater | 10
Sunday Arcade | High Score [EP] | Self-Released | 22
The Understudies | Second String | Brass Key | 11
Pilot Light | Embers | Low Tide | 13
Ferris | Midway | Half Moon Recordings | RE
Lakehouse Tapes | Volume Two | Self-Released | 14
Anya Brook | "Cold Coffee" [Single] | Fern & Flint | NEW
Quiet Motors | Idle | Night Shift | 16
Marble Run | Gravity Songs | Tidewater | 19
The Night Clerks | Room 12 | Brass Key | 17
Wren Abbott | Small Hours | Low Tide | 27
Copper Wire | Loose Ends | Half Moon Recordings | 18
Day Camp | Bug Juice | Self-Released | 20
Sister Static | AM Gold | Night Shift | 30
Halloway | Winter Coat | Fern & Flint | 21
Plum Street | Corner Store | Tidewater | NEW
The Long Weekend | Monday | Brass Key | 24
```

Markers these produce, for the test: ranks 1-10 `+1 -1 +2 = NEW -3 +5 -2 = +5`; 11-20 `-3 NEW -6 -4 +7 -5 -4 RE -5 NEW`; 21-30 `-5 -3 -6 +3 -7 -6 +3 -7 NEW -6`. Row 7's title is 53 characters on purpose: the same length class as the real KWVA row the scout quoted, so the defaults show what the fit ladder does.

Stress copy for the test sweep: all 30 rows with a 60-character artist and an 80-character title (the fit is proportional, so the outcome should be the same per aspect at every size: pin whether each aspect fits or refuses, and that a refusal names row 1); one 80-character title among normal rows at all seven canvases; a 40-character label; `station` of 32 characters; `genre: "Loud Rock"` with 10 rows; 1, 5, 11, 15, 16 and 29 rows; rows with no fourth field at all; emptied `weekOf` and `footer`; an accented artist (`Sigur Rós`).

## Beats
None: a still. The station posts a picture. A reveal clip (30 to 1) is a follow-up, not today's question.

## Defaults must show
At 1080x1080, with no inputs: a dark card headed `KOAD 91.6 FM`, `TOP 30` in the accent, `Week of Oct 6, 2026`; two columns of fifteen equal rows, ranks 1-15 down the left and 16-30 down the right; each row a bold artist over a title with its label in dimmer ink; under each rank a small marker (`+1`, `-1`, `=`, four `NEW`, one `RE`); row 7 visibly smaller than its neighbours on its second line because its title is 53 characters; a footer saying the chart is a sample. A stranger reads it as a radio station's weekly chart and can find number one, what is new, and who put each record out.

Honest weakness the defaults will show: at 1080 square the artist line is about 22 px and the title line about 17 px. That is small for a phone feed and it is what thirty rows cost; variant b spends some of it on a hierarchy.

## Acceptance rubric (the critic scores against this)
1. Renders at defaults at 1080x1080, 1920x1080 and 1080x1920, exit 0, no error mosaic, and the square still reads to a stranger as a station's weekly Top 30: station, computed `TOP 30`, week-of, thirty ranked rows of artist / title / label in the grid the brief names (2 x 15 square and portrait, 3 x 10 wide), ranks reading down the columns.
2. Text is whole everywhere. In the stills, not just in the layout report: no clipped, overlapping or ellipsized string at the three aspects; a column's label never touches the next column's rank; row 7's long title is complete. The fit ladder behaves as written: shared sizes, a long row shrinks alone, and an unfittable row is refused by name (the test pins one refusal).
3. Rows are a chart, not a paragraph: equal row cells, one artist size and one title size down every column, rank numerals aligned, artist / title / label told apart by weight and ink at a glance, markers correct for the default rows (`=` at 4 and 9, `NEW` at 5, 12, 20, 29, `RE` at 18) and absent when no row has a last-week field.
4. It holds off the defaults: 10 rows with a `genre`, 5 rows without slabs, 16 and 29 rows (short last column), a 40-character label, an 80-character title among normal rows, emptied `weekOf` and `footer`, at the seven contract canvases, with nothing clipping or colliding.
5. The props are what the MD has: thirty pasted lines, a station, a week. The template does not read a NACC or Spinitron export and neither the ship note nor the tutorial says it does; the ship note shows the mapping from a typed chart line (`1. CLAIRO Album: Charm Label: Virgin` becomes `Clairo | Charm | Virgin`). The tutorial says the evidence for a hand-made picture is one station (WDCE) and that the default chart is invented.

## Variants worth trying (up to 3, each ONE idea different)
- a: `lead: false`, `preset: "dark"`. The uniform grid above. The baseline, and the most literal chart.
- b: `lead: true`. Rank 1 leaves the grid and becomes a full-width lead row under the header (about twice a row's height: a large `1`, artist, title, label, its marker); ranks 2-30 fill the grid (wide 10 / 10 / 9, otherwise 15 / 14, the empty last cell stays empty). Tests whether one step of hierarchy makes the card read faster in a feed without costing the other 29 rows more than a few percent of their size. If the 29 rows lose more than about 10% of their text size at 1080x1080, drop b.
- c: `preset: "light"` as the default: white paper, near-black ink, the accent only on ranks, title and markers. The picture a station prints and tapes to the studio door, and the closest to WDCE's table. Build only if a and b are done and looked at.

If more than one variant is built, leave the one intended to ship last in place and make its choices the defaults; the others stay one prop away.

## What is weak in this plan
- Evidence for the picture is one station. Three of the four opened stations publish typed lists; this card is an offer to them, not a thing they asked for.
- No pixel floor: the fit is proportional, so at 480x270 the title line is around 6 px and row 7 smaller. That canvas is a thumbnail, and legibility is only claimed from 1080 on the short side. If the rasterizer or a gate refuses sizes that small, the fallback is for the builder to say so in `30-build.md`, not to shorten row 7 quietly.
- Thirty rows on a square are small type. Paging (15 + 15 as a two-image carousel) may be what a station actually wants on Instagram; it is a `page` prop and a v2.
- No "adds" list, although NACC reporting has one and stations post it with the chart. Second card, another day.
- No cover art. WDCE's picture has none either, but the charts people stop scrolling for usually do.
- `|` as the separator fails for an artist or title that contains one. Rare, refused with a clear message, not solved.
- The template does not check `LW` values against each other (two rows both claiming last week's 4 render as given).
- Invented artist, title and label names were not checked against real ones.
