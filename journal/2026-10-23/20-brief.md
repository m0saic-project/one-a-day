# Brief - 2026-10-23

## The use case (two sentences, from the scout)

Disc golfers on r/discgolf and r/mydiscbag post "rate my bag" / "bag check"
charts several times a season, and today that picture is a screenshot of a bag
site or a hand-built spreadsheet plot. Every disc already carries the four
flight numbers (speed, glide, turn, fade), so the bag chart - the speed x
stability matrix - can be rendered deterministically from props instead of
screenshotted: no account, no spreadsheet, one card per bag.

## The template

- id: `@one-a-day/sports/disc-bag-matrix/v1` (existing `sports` pack - 10
  neighbours, no new pack)
- title: Disc Golf Bag Matrix (scaffold prefixes the date)
- kind: image; canvas hint 1920x1080; aspects that must work: 1080x1920 and
  1080x1080 (plus the seven contract canvases the build sweeps)
- duration: "still"

## Layout (regions, ratios, what goes where)

Regions top to bottom, as fractions of the canvas - the grid region is what
flexes; header and footer are fixed bands:

- Header band, top ~12-14%: bag title (largest text), subtitle line under it
  (empty prop removes it), disc count right-aligned in the band.
- Matrix region, ~70-75%: the chart. 4 stability rows x 5 speed columns.
  Row-label strip on the left of the grid (~8-10% width), column-label strip
  below the grid. Chips are rectangles inside their cells; empty cells keep a
  faint slot tint so the holes in the bag are visible by construction.
- Footer band, bottom ~8-10%: the map's caption ("STABILITY = TURN + FADE")
  and slot coverage ("20 SLOTS - 12 FILLED - 8 EMPTY"), which is the gap
  story the "what am I missing" thread is about.

Axes - the handedness the bag sites already use (speed right, overstable up),
so a reader recognizes their own chart:

- X = speed bands, left to right: 1-3 PUTTER | 4-5 MID | 6-9 FAIRWAY |
  10-11 CONTROL | 12-14 DISTANCE.
- Y = stability bands, bottom to top, s = turn + fade (integer):
  s <= -1 US | s 0..1 STABLE | s 2..3 OS | s >= 4 BEEF.

Chip slotting: one chip per disc entry, placed at (speed band, s band).
Within a cell chips stack deterministically (order: name, then input order);
chips never collide and never leave their cell. Chip size is uniform across
the grid and set by the densest cell, so overflow cannot happen silently; if
the bag's densest cell cannot fit at the chip floor, validation refuses the
bag with the count in the error. Chip copy is two-tier, chosen per cell (all
chips in a cell share a tier): tier A name line + dim flight-numbers line
("9 5 -1 2"), tier B name only. Never ellipsize.

```
+--------------------------------------------------------------+
| Dana Kovac                                    18 DISCS       |
| league bag - Oct 2026                                        |
+--------------------------------------------------------------+
| BEEF   |      |       | Firebird  |        |          |      |
| OS     | Berg | Roc3  | Teebird   | Wraith | Destroyer |      |
|        | Pig  |       | Thunderb. |        |          |      |
| ST     |Aviar | Buzzz | River     |        | Shryke   |      |
|        | Pure |       |           |        |          |      |
| US     |      | Comet | Leopard3  |        | Tern     |      |
|        |      |Meteor | Sidewinder|        |          |      |
+--------------------------------------------------------------+
|        | 1-3  | 4-5   | 6-9       | 10-11  | 12-14    |      |
|        |PUTTER| MID   | FAIRWAY   |CONTROL | DISTANCE |      |
+--------------------------------------------------------------+
| STABILITY = TURN + FADE              20 SLOTS - 12 FILLED    |
+--------------------------------------------------------------+
```

Blank slots above are the faint empty cells (putter/US, the whole BEEF row
except Firebird, the control row except Wraith) - that emptiness is the
picture's point.

## Layout contract (the invariants the build sweeps)

- Every text fits its box: title, subtitle, disc count, row labels (two tiers:
  "US / STABLE / OS / BEEF" plus the dim s-range hint where it fits), column
  labels (class + speed range + count, tiered down to the range alone), every
  chip label at its cell's tier, footer caption and counts. `tag` every text
  source; use measured fits for chips and wrapped copy.
- Chrome lives where the design says: header band at the top, footer band at
  the bottom (~bottom 10%), the matrix body between them and never over
  either; row-label strip left of the grid; column-label strip below the grid.
- Presence: one chip per disc entry (exactly once); 5 speed columns and 4
  stability rows labeled; empty cells show the slot tint; the disc count in
  the header equals the chips drawn and the footer slot count equals 20 (or
  5 columns x 4 rows of the fixed banding).
- No pinned fractions beyond the bands above; the matrix flexes with the
  canvas and the grid keeps its 5x4 banding at every aspect.

## Props (name - type - default - what it changes - required?)

- `discs` - list of {name, speed, glide, turn, fade} - 18-disc sample bag
  (below) - the chips; the only required prop; 3..30 entries. `name` 1..20
  ASCII; `speed` int 1..14; `glide` int 1..7; `turn` int -5..2; `fade` int
  0..5. Stability slot is derived (turn + fade), never a user field.
- `title` - string - "Dana Kovac" - the header's largest line; 1..40 ASCII.
- `subtitle` - string - "league bag - Oct 2026" - second header line; empty
  removes it; 0..48 ASCII.
- `chipDetail` - enum "name+numbers" | "name" | "numbers" - "name+numbers" -
  what chips print (tier A forces on; dense cells still tier down to fit).
- `preset` - enum "dark" | "light" - "dark" - page and ink.
- `accent` - color #rrggbb - "#e8b33c" - header mark and ramp anchor.
- `debugLayout` - boolean - false - dev-only contract overlay.

Default bag (real molds used nominatively as sample data; numbers are their
real flight numbers - disc golfers check):

| name | speed | glide | turn | fade | slot |
| --- | --- | --- | --- | --- | --- |
| Aviar | 2 | 3 | 0 | 1 | putter/ST |
| Berg | 1 | 1 | 0 | 2 | putter/OS |
| Pig | 3 | 1 | 0 | 3 | putter/OS |
| Pure | 3 | 3 | -1 | 1 | putter/ST |
| Buzzz | 5 | 4 | -1 | 1 | mid/ST |
| Roc3 | 5 | 4 | 0 | 3 | mid/OS |
| Comet | 4 | 5 | -2 | 1 | mid/US |
| Meteor | 5 | 5 | -3 | 1 | mid/US |
| Teebird | 7 | 5 | 0 | 2 | fairway/OS |
| Leopard3 | 7 | 5 | -2 | 1 | fairway/US |
| River | 7 | 7 | -1 | 1 | fairway/ST |
| Thunderbird | 9 | 5 | 0 | 2 | fairway/OS |
| Sidewinder | 9 | 5 | -3 | 1 | fairway/US |
| Firebird | 9 | 3 | 0 | 4 | fairway/BEEF |
| Wraith | 11 | 5 | -1 | 3 | control/OS |
| Destroyer | 12 | 5 | -1 | 3 | distance/OS |
| Shryke | 13 | 6 | -2 | 2 | distance/ST |
| Tern | 12 | 6 | -3 | 2 | distance/US |

18 discs in 12 of 20 slots, max stack 2. The gaps are the demo: nothing
flippy in the putters, the control row is one Wraith deep, BEEF is a lone
Firebird. A viewer with no inputs sees a believable league bag and can say
"you are missing a flippy control driver" from the picture alone.

## Beats (video only: t=0...end, what moves)

Still - no beats. (If a later day wants a clip, the natural motion is chips
landing class by class; not today.)

## Defaults must show: what a viewer sees with no inputs

A complete dark share card: header with name, subtitle and "18 DISCS"; the
5x4 matrix with all 18 chips readable (name + flight numbers), eight faint
empty slots making the holes obvious; axis labels with class names and
counts; footer caption plus "20 SLOTS - 12 FILLED - 8 EMPTY". No empty
regions, no placeholder text, nothing that needs an input to look like the
product.

## Acceptance rubric (the critic scores against this)

1. Slotting is computed and true: every disc lands in the cell its speed and
   turn + fade say; the stack order is deterministic (re-render diffs clean);
   two discs in one slot stack, never overlap or escape the cell.
2. Text fits everywhere, at 1920x1080, 1080x1920 and 1080x1080, including a
   20-char mold name and a 5-deep cell: nothing clipped, nothing ellipsized,
   no chip text below the font floor.
3. The gap story reads at defaults: empty cells visible as slot tints, and
   the footer's filled/empty counts match what the grid shows.
4. The defaults look like something a disc golfer would post: correct flight
   numbers on the sample molds, ASCII copy, community axis words (US/BEEF)
   glossed in the footer, dark preset legible at phone size.
5. The why-tutorial and journal tell the truth: day 34, the scout's sources,
   the honest weak spots (below), and the render one-liner works with no
   props.

## Variants worth trying (up to 3, each ONE idea different)

- a. Baseline: banded matrix, chips name + numbers, dark, cool-to-warm row
  ramp (US cool to BEEF warm) anchored on `accent`.
- b. One idea: label strategy - numbered chips in the grid plus a keyed disc
  list on the right (DiscField's own "numbered points correspond to the disc
  list" look); same grid, same props. Trades inline names for crowding-proof
  cells.
- c. One idea: palette - light "printed chart" paper preset with muted class
  tints instead of the heat ramp; same layout, scoreboard-credit look.

## Risks to keep honest (from the scout, still open)

- Bag websites already draw versions of this chart; the template wins only as
  the clean deterministic share render (no account, no screenshot, your own
  props). The brief and the why must say exactly that and not oversell.
- Long mold names stress text fit (20-char cap + per-cell tiering is the
  defense; a 30-disc bag with a 6-deep cell must fail validation cleanly,
  not clip).
- Banded matrix discards the exact (speed, s) coordinate inside a cell - a
  deliberate simplification for readability. Variant b is the pressure valve;
  if the critic thinks the banding lies, that is the variant to ship.
- Sample mold names are real product names used nominatively (house practice:
  WH40k roster, commander deck); the player name is invented. Numbers must be
  the real flight numbers or the audience will call it out.
- It must stay the bag composition chart, not drift into a PDGA rating card
  (day 33's rejection) or a flight-path render (out of scope for rectangles).
