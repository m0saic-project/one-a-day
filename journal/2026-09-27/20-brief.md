# Brief — 2026-09-27

## The use case (two sentences, from the scout)
After every meet a powerlifter posts the day: nine attempts, what was made
and missed, the total, and they write it out or cut it by hand, while what
exists as graphics serves the live stream. This template turns the row the
lifter already has (their OpenPowerlifting CSV, or the meet software's
export) into a recap card and clip: the 3 x 3 board, the bests, the total.

## The template
- id: `@one-a-day/sports/powerlifting-meet-recap/v1`. New pack `sports`
  (in the preferred vocabulary; nothing under `src/` names a sport yet, and
  the niche direction will bring more: lifting, cubing, racing).
- title: Powerlifting Meet Recap
- kind: video; canvas hint 1080x1920 (the reel where recaps are posted);
  1920x1080 and 1080x1080 must hold too.
- duration: `clipSec` (default 12 s, 6..30) from props; an explicit
  `--durationMs` pin becomes the clip. `ctx.target` is the canvas.

## Layout (regions, ratios)
```
portrait / square                   landscape
+----------------------------+      +-------------------------------------+
| MARA VOSS          [ 8/9 ] |      | MARA VOSS                   [ 8/9 ] |
| Harbor City Open           |      | Harbor City Open - details          |
| USAPL - 2026-09-12 - F 69  |      +----------------------+--------------+
+----------------------------+      | SQUAT  [ ] [ ] [ ]   | TOTAL        |
| SQUAT              best 150|      | BENCH  [ ] [ ] [ ]   | 392.5 kg     |
| [ 140 ] [ 147.5 ] [ 150 ]  |      | DEADL  [ ] [ ] [ ]   | [S | B | D ] |
| BENCH             best 82.5|      |                      | 1st - Dots   |
| [ 77.5 ] [ 82.5 ] [ 85 x ] |      +----------------------+--------------+
| DEADLIFT           best 160|
| [ 145 ] [ 155 ] [ 160 ]    |
+----------------------------+
| TOTAL  392.5 kg            |
| [ squat | bench | deadl ]  |   <- the total as a stacked bar, to scale
| 1st place - 398.12 Dots    |
+----------------------------+
```
Header ~16% of the height; the board takes what the header and footer
leave; the footer ~24% (portrait/square) or the right ~36% of the width
(landscape). One row per lift that was contested (a bench-only meet is one
row), three equal cells a row; an attempt not taken is a dim cell.

Mechanism (what keeps it cheap): every label and every weight is static svg
text in the bundled font. What changes over time is colour and one number:
the cell fills and the "now lifting" rings are plain colour tiles in a
mask-free CHILD document, the total bar's segments in another (both canvases
5-smooth, day 4's mechanism), each gated by its own `overlay.enable`; the
total is ONE drawtext expression evaluated per frame (yesterday's clock
mechanism) that counts up as each good lift lands.

## Layout contract
- every text fits its box: lifter, meet, details, the stamp, each lift
  label and best, each cell's weight, the total (its widest string, widened
  15% for the system font), the result line.
- the header lives in the top 30% (`within yFrac [0, 0.3]` on the stamp);
  the total in the bottom 45% (portrait/square) - in landscape it sits
  beside the board, so the promise there is presence; the board's cells are
  present.
- no pinned fractions: the use case does not ask for them.

## Props (name - type - default - what it changes)
- `lifter` - string - "Mara Voss" - the header (the CSV's Name).
- `meetName` - string - "Harbor City Open" - second line (MeetName).
- `details` - string - "USAPL - 2026-09-12 - F 69 kg - Raw" - third line;
  from a CSV it is composed: Federation - Date - Sex WeightClassKg - Equipment.
- `attempts` - json - `{ squat: [140, 147.5, 150], bench: [77.5, 82.5, -85],
  deadlift: [145, 155, 160] }` - kilograms, the CSV's own convention: a
  negative number is a failed attempt, null or 0 an attempt not taken. A
  lift left out (or empty) drops its row.
- `place` - string - "1" - the CSV's Place: a number, or G, DQ, DD, NS.
- `dots` - number - 398.12 - the Dots points; 0 hides them.
- `csv` - string (multiline, mono) - "" - paste an OpenPowerlifting CSV:
  the header row and one or more result rows (a lifter's download, or a
  meet's export). When set it wins over the six props above.
- `row` - string - "1" - which row of the CSV: a 1-based number, a Date
  (2026-09-12) or a lifter's Name.
- `units` - "kg" | "lb" | "both" - the weights as the CSV has them, in
  pounds, or both.
- `clipSec` - number 6..30 - 12 - the clip length.
- `accent` - #rrggbb - "#ffb020" - the stamp, the ring, the total.
- `preset` - "dark" | "light" - "dark".
- `debugLayout` - boolean - false.
Good and no lift are a rule, not props: green and red, the score table's
colours. The CSV carries no referee lights, so the board draws none.

## Beats (clipSec 12)
- t = 0 .. 1.5 s: the finished board (cold open): nine cells in their
  colours, the bests, the total, the bar, the stamp (8/9), the result line.
  Frame 0 is the browse still and the social thumbnail.
- t = 1.5 s: the day restarts: every cell pending (dark, its weight
  waiting), total 0, bar empty, stamp and result hidden.
- 1.5 .. 9 s: the attempts land in meet order (squat 1, 2, 3, bench ...,
  deadlift 3), evenly spaced: the ring moves to the attempt, the cell turns
  green or red; a good lift that raises the best grows its segment of the
  bar and the total counts up to the new subtotal.
- 9 s: the last attempt lands; stamp and result return. 9 .. 12 s: hold.
  The last frame equals the first: the clip loops.

## Defaults must show
A believable day for a lifter who does not exist: 8 for 9, a missed third
bench, 392.5 kg total in the 69 kg class, first place, 398.12 Dots. A
stranger sees a scoreboard for one person: three lifts, three tries each.

## Acceptance rubric (the critic scores against this)
1. Renders at defaults at 1080x1920, 1920x1080 and 1080x1080, exit 0, no
   error mosaic; the clip is 12 s and frame 0 is the finished board.
2. The board is honest to the data: a negative weight is red, a good lift
   green, the best of each lift is named, the total is the sum of the
   bests, the stamp counts good lifts over attempts taken; no total (a
   bomb-out or a DQ) is said, not hidden.
3. `csv` really reads an OpenPowerlifting file: the header names the
   columns, `row` picks the meet or the lifter, bench-only and bests-only
   rows render (a unit test with a fixture in the documented format).
4. Nothing clips from one lift to three, with long names, half-kilo
   weights, pounds, and both units.
5. The replay lands the attempts in meet order and the counted total ends
   on the exact total.

## Variants worth trying (up to 3, each ONE idea different)
- a: the weights as the CSV has them (kilograms), big.
- b: every cell speaks both units (kg over lb): the write-ups the scout
  read are told in pounds, the data is in kilograms.
