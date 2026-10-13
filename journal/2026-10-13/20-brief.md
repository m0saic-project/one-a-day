# Brief — 2026-10-13

## The use case (from the scout)
VATSIM pilots flying a phpVMS virtual airline file a PIREP per flight and end
the month tallying the same line by hand ("13 flights, 32.7 h") to post it in
the Discord or group. The month's log rows already exist in every VA profile;
what does not exist is a shareable card of them.

## The template
- id: @one-a-day/gaming/vatsim-monthly-log/v1 (existing pack: `gaming` already
  holds speedrun and crossword recap cards; online flight sim is that family)
- title: VATSIM Monthly Log (scaffold prefixes "2026-10-13 · ")
- kind: image (still PNG); canvas hint 1920x1080; must also work at 1080x1920
  and 1080x1080 (the gate's three renders) and the seven contract canvases
- duration: still

## Layout
Regions, top to bottom, landscape:

```
+--------------------------------------------------------------+
| PILOT · CID                                  SEPTEMBER 2026  |  header
| Virtual airline name, dim                          (accent)  |
+--------------------------------------------------------------+
| [ FLIGHTS ]  [  HOURS  ]  [ LONGEST  ]  [ AVG TOUCHDOWN ]    |  stat band (4 tiles, one size)
+--------------------------------------------------------------+
| FLIGHT OPERATIONS LOG                                        |  caption
| date  flight   sector      type  block    vs      score      |  column heads (dim)
| 01 Sep  UA1612  MMGL-KIAH  A319  02:38    -307    100        |  rows, 1..10, one height
|  ...                                                         |
+--------------------------------------------------------------+
| career 415 h -> next milestone 500 h  [=========   ] 85 h    |  milestone bar (optional)
| totals computed from the log rows - sample data is invented  |  footnote (bottom band)
+--------------------------------------------------------------+
```

Portrait/square: same stack; the table columns keep their fractions; type
gets smaller with the canvas (no pixel floors). The four stat tiles stay one
row.

## Core concept (the ONE derived number idea)
The totals are never typed. The card parses the month's PIREP rows and
computes: flight count, block hours, longest flight (with its sector), and
average touchdown rate. `careerHours` (last month's figure, the one number
the pilot knows by heart) plus the month's computed hours drive the
milestone bar: next hundred, hours to go — the line everybody writes by
hand in a "just reached 400 hours!" post.

## Props
| prop | type | default | changes | required |
|---|---|---|---|---|
| pilot | string | "Orest R - First Officer" | header name/callsign line | no |
| airline | string | "Delta Virtual - DAL0013" | dim line under the pilot | no |
| month | string | "September 2026" | the accent word right of the header | no |
| rows | string[] | 10 invented PIREP lines "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | fpm | score" | the log table + ALL computed totals | no |
| careerHours | number | 415 | milestone bar: prior career hours (month hours are added, not double-entered) | no |
| footer | string | invented credit | bottom dim line | no |
| accent | color | #37c4a6 | month word, tile values' underline rules, bar fill, head rule | no |
| preset | dark/light | dark | page and ink | no |
| debugLayout | bool | false | draw the contract | no |

Row grammar (fail-fast, names the row): 1..10 lines, 7 pipe fields.
date "DD Mon" (Mon from a fixed 3-letter table); flight 1-9 chars A-Z0-9/;
sector exactly "XXXX-YYY" ICAO-ish 3-4 letters each; type 2-5 chars A-Z0-9;
block "H:MM" (H 0-15, MM 00-59); fpm integer -2000..-1 or "--" (then it does
not count into the average); score integer 0-100 or "--".

## Layout contract (invariants the build sweeps at the 7 canvases)
- every text fits its box: all row cells, tile values/labels, header lines,
  footnote — `textFitsMeasured` per cell (measured, as in reading-goal-recap)
- the header (pilot, airline, month) lives in the top band `yFrac [0, 0.2]`
- the footnote sits in the bottom band `yFrac [0.85, 1]`
- the four stat tiles exist and are one size (`equal: size`, tolerancePx 2)
- the head rule spans the card (`minWidthFrac 0.9`)
- the log rows sit between the tiles and the footnote (`yFrac [0.3, 0.95]`)
- the milestone bar exists only when `careerHours` is given, in the bottom
  band; its fill width is a pure fraction of the month's progress

## Defaults must show
With no inputs: a full September card — 4 invented PIREPs on the 1st + 6 more
across the month, computed FLIGHTS 10 / HOURS 26.1 / LONGEST 6:38 KJFK-EHAM /
AVG TOUCHDOWN -272 fpm, the milestone bar at 85 h to 500, the invented-data
credit. It must read as a VA ops log even to a non-pilot.

## Acceptance rubric
1. The card looks like an operations log the community recognises: PIREP
   columns (date, flight, sector, type, block, vs, score) with a head rule.
2. Every total shown is computed from `rows`; nothing typed can contradict
   the list (verified by the test recomputing from the defaults).
3. The milestone bar: fill + "x h to go" match `careerHours + month hours`
   exactly; clamps at the next hundred, never past 100%.
4. All seven contract canvases pass the layout sweep; a row over 10 or a bad
   field is refused by name, no clipping, no ellipsis.
5. Same props + canvas render byte-identical twice (gate renders twice).
6. WHY tells the truth about today's sources (the forum thread, the VA
   profile, the FB group post), the six pages render, ASCII only.
7. portrait/square renders are the same card, not a different design.

## Variants worth trying (max 3)
- a: the baseline above (tiles above table, milestone bar above footnote).
- b: one change — stat band as a single full-width strip line ("10 flights -
  26.1 h - longest 6:38 -272 fpm avg") instead of 4 tiles, giving the table
  one more row of height.
- c: one change — preset light (paper ops log) with the same geometry.
The critic picks from the stills; a is what `npm run new` ships first.
