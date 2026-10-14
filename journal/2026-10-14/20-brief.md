# Brief — 2026-10-14

## The use case (two sentences, from the scout)
Board gamers running the yearly 10x10 challenge - pick 10 games, play each 10
times before the year ends, "runs on the honor system tracked by each player
themselves" - already log every play on BGG or in BG Stats and owe the guild a
progress update all year. That artifact is still made by hand: a chart colored
in on the fridge, a $35 wood board with meeples, a Google Sheet, or a wall of
text edited into a geeklist.

## The template
- id: @one-a-day/gaming/tenxten-challenge-card/v1 (existing pack: `gaming`
  already holds the speedrun, crossword and VATSIM recap cards; tabletop is
  that family)
- title: 10x10 Challenge Card (scaffold prefixes "2026-10-14 - ")
- kind: image (still PNG); canvas hint 1920x1080 (the forum, geeklist and
  Discord attachment shape); must also work at 1080x1920 and 1080x1080, and
  at the seven contract canvases down to 480x270
- duration: still
- registry row: description "The yearly 10x10 board game challenge as a
  progress card: ten games x ten plays as a pip grid - per-game fill, the
  plays and games-done totals and the year pace computed from the list, never
  typed." Tags: gaming, 2026-10-14, day-025, board-games, 10x10, challenge,
  progress, plays, bgg.

## Layout (regions, ratios, what goes where)
One stack on every aspect; landscape is the reference:

```
+----------------------------------------------------------------------+
| 10 x 10 CHALLENGE - 2026                               @cardboard_kim|
+----------------------------------------------------------------------+
| [ 81 / 100 ]      [  6 / 10  ]      [ 2 ahead ]                      |
|  plays logged      games done        of year pace                    |
+----------------------------------------------------------------------+
| Pandemic Legacy S1   (*)(*)(*)(*)(*)(*)(*)(*)(*)(*)            10     |
| Brass Birmingham     (*)(*)(*)(*)(*)(*)(*)(*)(*)(*)            10     |
| Wingspan             (*)(*)(*)(*)(*)(*)(*)(*)(*)(*)            10     |
| ...six full rows...                                                  |
| Everdell             (*)(*)(*)(*)(*)(*)(*)( )( )( )             8     |
| The Crew             (*)(*)(*)(*)( )( )( )( )( )( )             6     |
| Scythe               (*)(*)(*)( )( )( )( )( )( )( )             4     |
| Lost Ruins of Arnak  ( )( )( )( )( )( )( )( )( )( )             3     |
+----------------------------------------------------------------------+
| totals, done count and pace computed from the list · pace = 100 x    |
| day 287/365 · sample list invented                                  |
+----------------------------------------------------------------------+
```

- Header band, top ~16%: the challenge wordmark and year left, the
  challenger's handle right. No second line unless one is needed.
- Stat band, ~14%: three tiles, one size (day 22's shape): PLAYS `81 / 100`,
  GAMES DONE `6 / 10`, PACE `2 ahead` / `on pace` / `3 behind`.
- Grid band, the hero at >= ~55% of card height on landscape: one row per
  game, rows equal height, row = name cell (~28% of content width) | pip
  track (~56%) | count (~16%, right-aligned). Portrait widens the name cell;
  square sits between.
- Pip track: exactly `goal` cells on one integer lattice (pitch =
  trackW/goal), pip side ~0.72 x min(pitch, rowH) so pips stay square with
  air; the first `min(plays, goal)` pips fill in accent, the rest stay empty
  (dim). All pips one size across the whole grid.
- Footnote band, bottom ~10%: the computed-from line, dim.

Draw note (feasibility, the crossword's lesson): the pip lattice is masked
color TILES, not 100 pieces - one inline-mask path holding every filled pip,
one holding every empty pip, on the one lattice - so any goal and games count
is a handful of overlays. Names and counts are per-row text sources (~36
sources total, well under budget; day 24 shipped 70 row cells).

## Core concept (the ONE derived-number idea)
The challenge's own arithmetic is never typed. The headline shape (`10 x 10`
= games.length x goal), the plays total (`81 / 100`), the done count
(`6 / 10`, rows with plays >= goal) and the year pace (pace = games x goal x
dayOfYear / 365, then ahead / on-pace / behind) all fall out of `games`,
`goal` and `dayOfYear` - day 22's "the card cannot disagree with itself",
with the pip lattice as the hero instead of a bar. `dayOfYear` is a prop, not
a clock, so the card stays deterministic.

## Layout contract (the invariants the build sweeps)
- Every text fits its box, measured (`textFitsMeasured`): one-to-many labels
  `game-name-<i>` and `game-count-<i>` per row, plus header, stat and
  footnote labels. A name that cannot fit its cell at that canvas is refused
  naming `games[i].name` - shrink to a floor, then refuse; never clip, never
  ellipsis.
- Header band within `yFrac [0, 0.2]`; wordmark left, handle right.
- The three stat tiles exist, one size (`equal: size`, tolerancePx 2), within
  `yFrac [0.14, 0.36]`.
- Every game row inside `yFrac [0.3, 0.94]`; rows equal height; name cells
  share the left edge, counts share the right edge.
- Pips square (`aspect: 1`, tolerance ~0.15) and one size across the grid
  (relational `equal: size`); exactly `goal` pips per row - the test asserts
  both from the layout function's own lattice.
- Footnote in the bottom band `yFrac [0.9, 1]`.
- Nothing else pinned: the use case asks for bands and a lattice, not pixel
  positions.

## Props (name · type · default · what it changes · required?)
| prop | type | default | changes | required |
|---|---|---|---|---|
| challenger | string | "@cardboard_kim" (invented; schema says so) | header right; "" removes it | no |
| year | number | 2026 | the year in the wordmark | no |
| games | list of { name, plays } | ten real games, invented counts: Pandemic Legacy S1 10, Brass Birmingham 10, Wingspan 10, Spirit Island 10, 7 Wonders Duel 10, Azul 10, Everdell 8, The Crew 6, Scythe 4, Lost Ruins of Arnak 3 (plays-desc) | the grid and every derived number | no |
| goal | number | 10 | pips per row and the headline's second number - 5 makes an honest 10x5 | no |
| dayOfYear | number | 287 | the pace stat and delta line; a prop, not a clock | no |
| accent | #rrggbb | "#c94f3d" | filled pips; ahead-of-pace ink | no |
| preset | "dark" / "light" | light | page and ink (light = the paper fridge chart; dark = the forum card) | no |
| debugLayout | boolean | false | draw the contract over the card | no |

Validation, fail-fast, field named: `games` 1-10 entries; `name` 1-40
printable ASCII, trimmed; `plays` integer 0-99 (over-goal allowed - pips
clamp, the count tells); `goal` integer 1-10; `dayOfYear` 1-366; `year`
integer 1900-2999; `challenger` 0-32 printable ASCII; accent must clear 3:1
against the page for pips and 4.5:1 anywhere it colors text, refused naming
the measured ratio (the crossword's rule). A mid-year challenge start is not
modeled - pace assumes January; that is a WHY caveat, not a ninth prop.

## Beats
still

## Defaults must show
With no inputs: the sample challenger's October card - "10 x 10 CHALLENGE -
2026", three stat tiles (81/100 plays, 6/10 done, 2 ahead of pace at day
287), ten named rows with six full accent tracks and an 8-6-4-3 tail, counts
right, the computed-from footnote. Every default number agrees with every
other (81 = the sum, 6 = rows at goal, pace 78.6 -> "2 ahead"). A stranger
says "board game challenge tracker" without reading the journal.

## Acceptance rubric (the critic scores against this)
1. Still PNG at defaults renders clean (exit 0, no error mosaic; exit 3 is a
   failure) on landscape, portrait and square, and byte-identical on the
   gate's second render.
2. The grid is the hero and reads at a glance: at 1920x1080 a viewer sees the
   six finished rows and the tail without reading a number - filled vs empty
   pips clearly contrasted, pips square and one size, rows one height.
3. Nothing typed can lie: the "10 x 10" headline, 81/100, 6/10 and the pace
   delta are derived; the test recomputes them from the defaults, and a
   5-entry list renders "5 x 10" while goal 5 renders "10 x 5".
4. Over-goal and zero: plays 12 with goal 10 renders ten full pips and the
   count "12"; plays 0 renders an empty track and "0".
5. Text fits at all seven contract canvases at defaults, and the template's
   own test sweeps a stress list (a 32-character name, ten rows) through
   `sweepLayout` - fitted above the floor or refused with `games[i].name`
   named; no clipping, no ellipsis, no blank-line spacing.
6. It mirrors the family without cloning: the row anatomy is day 025's
   climbing pyramid (label | track | count) but the track is a discrete tally
   lattice - exactly goal cells, fill = plays, a row completes - and the
   derived arithmetic is day 022's; both debts named in the header comment.
7. WHY tells the truth: the wood board and the fridge chart as the hand-made
   artifacts, BGG/BG Stats as the data path, the sample card declared
   invented where it is, six pages, ASCII only, every URL one the scout
   opened.

## Variants worth trying (up to 3, each ONE idea different)
- a: the baseline above - rows of tracks (the wood-board shape), stat tiles
  above, footnote below. This is what `npm run new` ships first.
- b: one change - the stat band as one full-width strip line ("81 / 100
  plays - 6 / 10 games done - 2 ahead of pace") instead of three tiles; the
  grid gains a row of height (day 24's b, the same trade).
- c: one change - pip material: empty pips as rings (the routed holes of the
  wood board), filled pips solid, same lattice and geometry - a warmer read
  on the light preset.

Rejected before it costs a render: the fridge-chart column layout (games as
columns, pips stacking upward) - ten wrapped column headers cannot fit a
480x270 canvas without a shortName prop the challenge does not have.
