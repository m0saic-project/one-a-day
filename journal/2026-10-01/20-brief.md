# Brief — 2026-10-01

## The use case (two sentences, from the scout)
After every meet an age-group swim club's coach or parent volunteer types a
recap onto the club site by hand: who dropped how much time in which event,
and who reached a new standard (B, BB, A ...). This template turns one
swimmer's rows from the meet results (entry time and final time per event)
into a time-drop card: one card per swimmer per meet, a batch from one file.

## The template
- id: `@one-a-day/sports/swim-time-drop-card/v1`. Existing pack `sports`
  (day 8's powerlifting recap lives there); no new pack.
- title: Swim Time Drop Card
- kind: image; canvas hint 1080x1080 (it goes into a club news post and a
  family's phone; square survives both). 1920x1080 and 1080x1920 must work,
  and the contract's small canvases (640x360, 480x270) must hold.
- duration: still.

Neighbours read before writing this: `@one-a-day/dev/bench-delta/v1` (rows
with bars against a baseline; its lesson is below), `@one-a-day/gaming/
speedrun-pb-recap/v1` (delta rows), `@one-a-day/sports/powerlifting-meet-
recap/v1` (one athlete, one meet). The delta row is not new to this repo;
what is new is the construct (entry time against swum time, per event, with
a standard) and the two decisions below.

## The two design decisions

**1. What the bar measures is stated, and it is one of two honest things.**
The scout sketched "a bar whose width is the drop in seconds". Seconds are
the community's own language ("dropped 6.2 seconds"), but a card mixes a 50
and a 200: in seconds the long event always wins, and a strong 50 looks like
nothing. Day 2 met the same problem and made the ratio the shared channel.
So the drop is always PRINTED in seconds, and the bar is drawn either as the
share of the entry time dropped (percent) or as seconds. The footnote names
which, and names the scale. That choice is the variant pair, and the loser
stays one prop away (`bar`).

The full track is this card's largest drop. Bars compare one swimmer's swims
with each other, not swimmers with each other: the card is for a family, not
a leaderboard, and a child with small drops still gets one full bar.

**2. A slower swim is printed, not drawn.** It gets a plus sign and its
number in the ordinary ink, an empty track, no red, no warning colour. The
reader is a ten-year-old and their parents. Honest means the number is
there; it does not mean the card shouts it.

## Layout (regions, ratios)

```
square / portrait                            landscape
+----------------------------------------+   +------------------------------------------------------+
| TESSA MARLOW                   [ SCY ] |   | TESSA MARLOW                               [ SCY ]   |
| Larkmoor Swim Club                     |   | Larkmoor Swim Club - October Kickoff - Oct 3-4       |
| October Kickoff Invitational           |   +------------------------------------------------------+
| Oct 3-4, 2026                          |   | EVENT     ENTRY    FINAL    (bar track)   DROP       |
+----------------------------------------+   | 50 Free   31.84    30.97    [======    ]  -0.87  BB  |
| EVENT     ENTRY    FINAL     DROP      |   | 100 Free  1:10.52  1:08.31  [=======   ]  -2.21  BB  |
| 50 Free   31.84    30.97    -0.87  BB  |   | 200 Free  2:36.40  2:29.85  [==========]  -6.55  B   |
| [========                            ] |   | 100 Back  1:19.77  1:20.19  [          ]  +0.42      |
| 100 Free  1:10.52  1:08.31  -2.21  BB  |   | ...                                                  |
| [==========                          ] |   +------------------------------------------------------+
| ... (N rows, 1..8)                     |   | 5 of 6 swims faster - 14.82 s dropped                |
+----------------------------------------+   | vs entry time. Bars: share of the entry time ...     |
| 5 of 6 swims faster                    |   +------------------------------------------------------+
| 14.82 s dropped                        |
| vs entry time. Bars: share of ...      |
+----------------------------------------+
```

- Three bands, top to bottom: header (about a fifth of the height), the rows
  (what the other two leave, at least half), the summary band (about a
  fifth). These are targets, not pins.
- Header: the swimmer's name is the largest text on the card; club, meet and
  the details line under it; the course (`SCY` / `SCM` / `LCM`) as a small
  chip at the top right, because times in different courses do not compare
  and the card must say which it is.
- A thin column-head line (`EVENT`, `ENTRY`, `FINAL`, `DROP`) so nobody has to
  guess which time is which.
- One row per swim, in the order given (meet order). Cells: event, entry
  time, final time, drop, standard chip. Times and drops are right-aligned so
  the decimal points stack.
- The bar track: in landscape it is a column between FINAL and DROP; in
  square and portrait it is a strip under the row's text line, the full
  width of the row (narrow canvases need the width for the text cells, and
  the bar gets more resolution there). Every track has the same size and the
  same left edge; a bar grows from the left.
- The standard chip sits at the row's right end. A row without a standard
  keeps the space empty (the columns must not shift between rows).
- Summary band: the count and the total as the card's second-largest text,
  then one small footnote line (or two when it wraps) that carries the
  honesty: `vs entry time` and what the bar means.
- Few rows: cap the row height (a card with one or two swims must not turn
  into slabs); the rows group sits at the top of its band.

Mechanism: everything is static svg text in the bundled font plus plain
colour tiles. No drawtext, no children needed, no media.

## Layout contract (the invariants the build sweeps)
- every text fits its box: swimmer, club, meet, details, the course chip,
  the four column heads, each row's event / entry / final / drop (a label per
  row and cell, since the copy differs), each standard chip, the summary, the
  footnote.
- the swimmer's name lives in the top 35% (`within yFrac [0, 0.35]`); the
  summary and the footnote live in the bottom 35% (`within yFrac [0.65, 1]`).
- every row has a bar track (presence), every track is at least a fifth of
  the canvas width (`minWidthFrac: 0.2`), and the tracks are the same size
  (`equal: "size"` relation on the track label).
- a bar is present for every faster swim. That a slower, equal, NT or DQ row
  has NO bar is asserted in the test, not in the contract.
- no pinned fractions: the use case does not ask for one.

## Props (name - type - default - what it changes - required?)
All optional; every default is part of the picture.

| prop | type | default | what it changes |
|---|---|---|---|
| `swimmer` | string | `"Tessa Marlow"` | the header name (invented; not a real swimmer) |
| `club` | string | `"Larkmoor Swim Club"` | second line; empty removes it |
| `meet` | string | `"October Kickoff Invitational"` | third line; empty removes it |
| `details` | string | `"Oct 3-4, 2026"` | free line for date, age group, session; empty removes it |
| `course` | `"SCY"` \| `"SCM"` \| `"LCM"` | `"SCY"` | the course chip |
| `swims` | json list | the six rows below | the data: `[{ event, entry, final, standard? }]`, 1..8 rows |
| `bar` | `"percent"` \| `"seconds"` | variant a: `"percent"`; variant b: `"seconds"` | what the bar length means, and the footnote with it |
| `accent` | #rrggbb | builder's pick, a pool blue-green | bars, the course chip, the standard chips (the club's colour) |
| `preset` | `"dark"` \| `"light"` | `"dark"` | page and ink |
| `debugLayout` | boolean | `false` | draws the contract over the render |

One `swims` row is what a results row gives, nothing more:
- `event`: string, as the club says it (`"50 Free"`, `"200 IM"`,
  `"100 Breaststroke"`).
- `entry`: the entry (seed) time as `"31.84"`, `"1:10.52"` or `"19:58.44"`,
  or `"NT"` / empty for no time (a first swim of that event).
- `final`: the swum time in the same formats, or `"DQ"`.
- `standard`: optional, up to 4 characters (`"B"`, `"BB"`, `"AAAA"`). The
  caller supplies it; the template does not compute standards (the tables
  change by season, age and sex).

Rules, not props:
- Times are parsed to integer hundredths; all arithmetic is integer. Printed
  back as `SS.hh` under a minute and `M:SS.hh` above. Drop = entry - final,
  printed with a sign: `-0.87` faster, `+0.42` slower, `0.00` equal. ASCII
  hyphen-minus.
- `NT` entry: the entry cell says `NT`, the drop cell says so in words (for
  example `first swim`), no bar, and the swim is not counted in the summary.
- `DQ` final: the final cell says `DQ`, no drop, no bar, no chip, not counted.
- Summary: `<f> of <m> swims faster` where m counts swims that have both
  times, and `<total> s dropped` where the total is the sum of the drops of
  the faster swims (slower swims are not netted against it; each is printed
  on its row). With no comparable swim the band says that instead of `0 of 0`.
- Fail fast, naming the row and the value: a time that does not parse, a
  missing `final`, zero rows, more than 8 rows (the message says to split the
  meet across two cards), a `standard` longer than 4 characters.
- Names: these are people's names, and yesterday's critique faulted an
  ASCII-only refusal. Check whether the bundled font draws Latin-1 letters
  (the glyph-coverage gate is the judge); accept what it draws. If that
  cannot be settled inside the build, refuse the unsupported character with
  a clear error (never tofu) and write it down as a weak spot.

## Beats
None: a still. The scout called a clip where the bars grow "the obvious
variant"; it is left as a follow-up on purpose. Changing the kind is not one
idea different, the card is posted and sent as an image, and the open
question today is what the bar should mean.

## Defaults must show
A believable meet for a swimmer who does not exist, at 1080x1080:

| event | entry | final | drop | standard |
|---|---|---|---|---|
| 50 Free | 31.84 | 30.97 | -0.87 | BB |
| 100 Free | 1:10.52 | 1:08.31 | -2.21 | BB |
| 200 Free | 2:36.40 | 2:29.85 | -6.55 | B |
| 100 Back | 1:19.77 | 1:20.19 | +0.42 | |
| 50 Fly | 36.10 | 34.92 | -1.18 | B |
| 200 IM | 2:58.03 | 2:54.02 | -4.01 | |

Summary: `5 of 6 swims faster`, `14.82 s dropped`. A stranger sees a swim
meet result for one child: six events, two times each, five drops with bars,
one honest slower swim, four standard chips.

The rows were chosen so the two variants disagree visibly: in percent the 50
Free (2.7%) is a longer bar than the 200 IM (2.3%); in seconds the IM (4.01)
is more than four times the 50 Free (0.87).

The defaults name no age group or sex: the chips are illustrative and have
not been checked against any season's standards table, so the card must not
imply one.

## Acceptance rubric (the critic scores against this)
1. Renders at defaults at 1080x1080, 1920x1080 and 1080x1920, exit 0, no
   error mosaic, and the square still reads to a stranger as a swimmer's
   meet: events, entry and final times, drops, chips, the summary.
2. The arithmetic is honest: integer hundredths, drop = entry - final, the
   summary's count and total as defined above (the defaults give 5 of 6 and
   14.82). A slower swim shows a plus sign, no bar and no warning colour;
   NT and DQ rows make no claim. `vs entry time` is on the card; the words
   "PB" and "best time" are nowhere on it.
3. The bar says what the footnote says: bar lengths are proportional to the
   stated quantity (a unit test checks them against the numbers, within the
   pixel or two quantization takes), the largest fills its track, all tracks
   share one size and left edge, and `bar` switches the lengths and the
   footnote together.
4. Nothing clips or collides from 1 to 8 rows at the seven contract
   canvases, with a 30-character swimmer name, `100 Breaststroke`, a distance
   swim (`19:58.44`, a drop of `-1:02.33`), `AAAA` chips on every row, and
   emptied club / meet / details lines. One or two rows do not become slabs.
5. The props are a results row and nothing more: no field a parsed results
   file would not hold except `standard`. The ship note shows how parsed
   rows map onto `swims`, and neither it nor the tutorial claims the
   template reads `.hy3` / `.cl2`.

Also for the builder (the critic's own line 9 will look): the scout's
evidence quotes real children by name. The why-tutorial's problem page
quotes the recaps with the names removed ("[swimmer] dropped 40 seconds in
the 200 Free!"), following day 8's ruling that a tutorial card does not
carry a private person's name.

## Variants worth trying (up to 3, each ONE idea different)
- a: `bar: "percent"`. The bar is the share of the entry time dropped; fair
  between a 50 and a 200. Footnote along the lines of `vs entry time. Bars:
  share of the entry time dropped; the longest is 4.2%.`
- b: `bar: "seconds"`. The bar is the seconds dropped, the scout's sketch
  and the recaps' own unit; the long events dominate. Footnote names the
  longest in seconds.
- No c is asked for. If a and b are both clean and there is time, the one
  further idea worth a render is variant a with each bar's percent printed
  at the bar's end, to test whether a bar in percent beside a number in
  seconds confuses without it. Drop it if any label fails to fit.

## What is weak in this plan
- The template does not read the results file. Someone has to parse `.hy3`
  (flipturn does) and look up standards before the batch works; the day
  delivers the card, not the pipeline.
- Eight rows is a cap, and a three-day championship meet with prelims and
  finals can exceed it. The error says so; it does not solve it.
- Relays are out: a relay result has no entry time per swimmer.
- A bar in percent next to a number in seconds asks the reader to hold two
  units. The footnote is the only thing that explains it; that is the risk
  variant b exists to measure.
