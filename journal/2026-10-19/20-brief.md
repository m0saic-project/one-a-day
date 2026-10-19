# Brief - 2026-10-19

## The use case (two sentences, from the scout)

HYROX athletes post a race-day graphic after every event, and the artifact they have is the official workout summary on results.hyrox.com: athlete, race, division, finish time, division rank, eight run-plus-station pairs in a fixed order, then Roxzone, run total and best lap. The page is a wide timing table, so the current fix is a screenshot or retyping every split; the card is that summary as one still, not a race photo and not the race-replay in/out tape.

Shape source: Matthew Luxton, 2023 Barcelona, finish 01:12:40, rank 87 (https://results.hyrox.com/season-5/?content=detail&fpid=list&pid=list&idp=JGDMS4JI63FAA&lang=EN_CAP&event=H_JGDMS4JI466). That page's own lines do not sum (the eight running times add to 36:57; Run Total prints 00:36:53; parts plus Roxzone miss the finish by a few seconds). The card must not "fix" that.

## The template

- id: `@one-a-day/sports/hyrox-split-card/v1` (pack `sports` exists - swim, lap telemetry, golf, erg; no new pack)
- title: `HYROX Split Card` (scaffold renders `2026-10-19 · HYROX Split Card`)
- kind: image (PNG); canvas hint 1080x1080; 1920x1080 and 1080x1920 must work, and the contract's seven canvases down to 480x270
- duration: still

The directory title names the sport so a search finds it. The pixels are a data graphic: no wordmark, no logo, no black-and-yellow lockup. Default copy does not contain `HYROX` or `SkiErg`. Station 1's label is `Ski`, not the erg brand.

## The one decision

The finish time is the hero (the number a screenshot buries), and the body is a named-station race tape, not another time list. Eight rows, fixed order, one shared scale: the slowest run-plus-station pair fills the track, every other pair is shorter in proportion, and within a pair the run and the station split that length by their times. A long burpee reads as a long accent bar; a short farmers carry reads as a short one. No delta, no PB, no green/red - that is the lap card. No single pace track - that is the erg card.

The card computes no claim it cannot verify. Bars come only from the sixteen split times. Roxzone, run total and best lap are printed as entered and are not checked against the splits or the finish. Rank is entered. Doubles, relay and the race-replay in/out list are a different shape and are not drawn.

## Layout

One stack at every aspect. Do not switch to two columns on landscape - the rows have to stay comparable. Chrome sizes off `min(H, 0.75*W)`. Portrait gives the hero air; landscape and 480x270 stay one line per row.

```
+--------------------------------------------------------------+
| JORDAN HALE                              1:11:40             |
| Harbor Open                              FINISH         #64  |  header
| Open, 35-39                                         RANK     |
|--------------------------------------------------------------|
| 1 [======run======][====ski====]    4:20  4:05  Ski      42  |
| 2 [======run======][==push==]       4:24  2:30  Push    110  |
| 3 [======run======][===pull===]     4:28  3:40  Pull     88  |
| 4 [======run======][=====burpee====] 4:32  5:12  Burpee  240 |  longest
| 5 [======run======][====row====]    4:36  4:02  Row      12  |
| 6 [======run======][=carry=]        4:34  1:52  Carry   190 |  shortest
| 7 [======run======][===lunge===]    4:40  3:35  Lunge    64  |
| 8 [======run======][====balls===]   4:46  4:18  Balls    55  |
|--------------------------------------------------------------|
| ROXZONE          |       RUN TOTAL       |       BEST LAP    |
| 6:06             |       36:20           |       4:20        |  footer
+--------------------------------------------------------------+
```

Row, left to right, fixed fractions of the row so the columns align: index (~6%), tape track (~40%), run time, station time, station name, place. The name is always in the name column, never inside the bar (a short bar must not own its label). Place omitted or 0 leaves that cell empty - do not print a dash.

Tape scale, so the critic can check it: `maxPair` is the largest of the eight (run + station) sums. That pair's two bars fill the track. Any other pair fills `pair / maxPair` of the track, split inside by the two times. A dim rail shows the full track behind every row. Run bar is muted ink; station bar is the accent. On the defaults, lap 4 (4:32 + 5:12 = 584s) is the full track and its station bar is longer than its run bar (312 > 272); lap 6 (4:34 + 1:52 = 386s) is 386/584 of the track. A bar has a minimum height of 4px so it is still a bar at 480x270.

Station labels are baked in, in this order, these exact words: `Ski`, `Push`, `Pull`, `Burpee`, `Row`, `Carry`, `Lunge`, `Balls`. Full names (1000m ski, 50m sled push, 50m sled pull, 80m burpee broad jump, 1000m row, 200m farmers carry, 100m sandbag lunges, wall balls) live in the WHY, not in the row - they will not fit the floor.

Times print compact, no leading zeros: `4:20`, `1:11:40`. Hours only when the value is at least one hour.

## Layout contract (the invariants the build sweeps at the seven canvases)

- every text fits its box: `tag` every text source, `textFitsMeasured`, fit at `cell * 0.94 - 2px`, refuse below the floor, never ellipsis. Defaults are ASCII. Names may use printable ASCII plus accented Latin (U+00C0-U+017F), the set the golf and erg cards already proved.
- header texts (`athlete`, `race`, `division`, finish figure, `FINISH`, rank) `within yFrac [0, 0.30]`
- the finish figure is the tallest text on the card (a relation, not a pixel size), including at 480x270 - shrink the row type before the finish
- eight row bands `within yFrac [0.22, 0.86]`, `equal: "size"`; each row present (index, both times, station name)
- each tape rail present, `minWidthFrac: 0.32`; each run bar and each station bar present and inside its row
- footer band `within yFrac [0.78, 1]`; the three cells present and `equal: "size"`
- page colour is `document.backgroundColor`, never a full-canvas rect
- splits stay small-basis (8 rows, 3 footer cells) - nothing near the 5-smooth threshold

Do not pin "the header is 18% tall". The bands above are the promise.

## Props (9 user props + 3 chrome; every optional one shows its default)

| name | type | default | what it changes | required |
|---|---|---|---|---|
| `athlete` | string | `"Jordan Hale"` (invented) | header name | no; `""` hides it; max 32 |
| `race` | string | `"Harbor Open"` (invented) | second header line | no; `""` hides it; max 40 |
| `division` | string | `"Open, 35-39"` | third header line; age group lives here | no; `""` hides it; max 32 |
| `finish` | string | `"1:11:40"` | the hero figure | no; a bad format fails fast, naming `finish` |
| `rank` | number | `64` | the `#64` chip; `0` hides it | no; integer 0-99999 |
| `splits` | 8 objects `{run, station, place?}` | the eight rows below | the tape; order is the race order, not a user label | no; length other than 8 fails fast |
| `roxzone` | string | `"6:06"` | footer cell | no; bad format fails fast |
| `runTotal` | string | `"36:20"` | footer cell, as entered | no; bad format fails fast |
| `bestLap` | string | `"4:20"` | footer cell, as entered | no; bad format fails fast |
| `accent` | `#rrggbb` | `#c45c26` (clay - not brand yellow) | station bars and the rank chip | no |
| `preset` | `"dark"` or `"light"` | `"dark"` | page and ink | no |
| `debugLayout` | boolean | `false` | draws the contract | no |

Default `splits`, in order. `place` is the station's division place; runs have none on the official summary, so there is no run-place field.

| # | run | station | place |
|---|---|---|---|
| 1 | 4:20 | 4:05 | 42 |
| 2 | 4:24 | 2:30 | 110 |
| 3 | 4:28 | 3:40 | 88 |
| 4 | 4:32 | 5:12 | 240 |
| 5 | 4:36 | 4:02 | 12 |
| 6 | 4:34 | 1:52 | 190 |
| 7 | 4:40 | 3:35 | 64 |
| 8 | 4:46 | 4:18 | 55 |

Time grammar: one colon is `m:ss` (minutes may exceed 59, so `71:40` is legal), two colons is `h:mm:ss`, leading zeros allowed (`00:04:20`). Seconds must be 0-59. No decimal - the workout-summary split column is whole seconds; a `62:36.58` finish fails fast rather than rounding. `place` is an integer 1-9999, or omitted or 0 to hide. `bindProp` / `bindPropPath` on every prop-driven string (name, race, division, finish, rank, each time, each place, the three footer times).

Checksum for the test, not a render-time check: the eight runs sum to 36:20, the eight stations to 29:14, plus Roxzone 6:06 is 1:11:40, and the fastest run is 4:20. A user paste that does not checksum still renders.

## Beats

Still. The need is a picture for a post, not a count-up. No motion variant unless the still fails the rubric.

## Defaults must show

With no inputs, a viewer sees an invented athlete at an invented race: Jordan Hale, Harbor Open, Open 35-39, finish `1:11:40` as the largest figure, rank `#64`, eight named rows on one scale with lap 4 the longest tape and lap 6 the shortest, the burpee bar longer than its run, the carry bar clearly short, and a footer of Roxzone `6:06`, run total `36:20`, best lap `4:20`. No logo, no yellow lockup, no `HYROX` or `SkiErg` on the card. The WHY says the person is invented and points at the Luxton page for the column shape.

## Acceptance rubric (the critic scores against this)

1. **Finish first, tape second.** On 1080x1080, 1920x1080 and 1080x1920 the finish time is the largest text. The eight rows read as a named race: station names in a fixed column, bar length the time. Lap 4's tape is the longest and lap 6's is visibly shorter (386/584). Not a time list, not a sector-delta card, not an erg pace track.
2. **Entered, not invented.** Every figure comes from a prop. Footer lines are not recomputed. A splits array whose parts miss the finish still renders. The default's own sums do match, and the test asserts that plus the bar rule (longer time, longer bar; station accent, run muted).
3. **Text at all seven canvases.** One line per row, the eight short labels, compact times, no clip, no ellipsis, no en-dash. A 32-character name and a hidden rank still pass. ASCII defaults.
4. **Not a brand piece.** No wordmark, no logo, no official black-and-yellow lockup. Default pixels do not contain `HYROX` or `SkiErg`.
5. **Fail fast and deterministic.** Bad time, a decimal, a splits length other than 8, a place outside 0-9999, or a rank outside 0-99999 throws, naming the field. Two renders from the same props are identical. Doubles, relay and race-replay rows are absent.

## Variants worth trying (one idea each, same id and folder)

- **a. Shared scale** (this brief). Ship this unless the stills read as a bar chart.
- **b. Within-row split** (layout): every row's track is full, and the run and the station split that width by their own times. Same props, same bands. The other reading of "width from the split". Loses "which lap was long"; gains a full-width tape. Try only if (a) looks like the swim card.
- **c. Slowest-row rule** (palette): same scale as (a), but the slowest station's row keeps the accent and the other station bars go muted, with a thin accent rule on that row. No new props - the slowest station is `max` of the eight station times (on the defaults, Burpee). A "where the time went" read. Do not also change the scale.

## Notes for the build

- `npm run new -- sports/hyrox-split-card --title "HYROX Split Card"`
- Registry description, one line: "A race-day split card from the workout summary: finish time and division rank as the header, eight run-and-station pairs as a tape whose length is the split, and roxzone, run total and best lap as entered."
- Tags after `sports`, the date and `day-030`: `hyrox, race, splits, stations, recap, card`.
- Mirror `golf-round-scorecard` for the array prop and `erg-pb-card` for the hero figure, the themes, and `withLayoutIntent`. Page colour is `document.backgroundColor`.
- Weak spots worth a line in the WHY: the official summary does not sum; tenths are refused; doubles and relay are out; the row names are abbreviations so the floor holds.
