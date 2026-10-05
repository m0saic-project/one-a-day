# Brief — 2026-10-04

## The use case (two sentences, from the scout)
Speedcubers on SpeedSolving.com race threads and forum competitions report progress by pasting the csTimer block (`avg of 5: 27.59`, the solves with the best and worst dropped in parentheses, scramble strings and timestamps) and by typing PB tables by hand. This template turns one average (Mo3, Ao5 or Ao12) into a card: the solves as bars, the dropped best/worst in parentheses with a hollow bar, the average as the headline, and the delta against the old PB, so a PB gets a picture instead of a wall of text.

## The template
- id: `@one-a-day/sports/cubing-average-card/v1`. Existing pack `sports` (days 8, 12, 13 live there); no new pack. Cubing is a timed competitive sport and the card is a results card like the swim one.
- title: Cubing Average Card
- kind: image; canvas hint 1080x1080 (a forum attachment or a post image; square survives both). 1920x1080 and 1080x1920 must work, and the contract's small canvases (640x360, 480x270) must hold.
- duration: still.

Neighbours read: `@one-a-day/sports/swim-time-drop-card/v1` (day 12; rows of times with bars and a printed delta; its brief is the house shape for "a bar says what it measures" and "a slower result is printed, not drawn red"), `@one-a-day/sports/lap-telemetry-card/v1` (day 13; its NO SHIP is the warning, below), `@one-a-day/gaming/speedrun-pb-recap/v1` (PB deltas).

What is new against day 12: the construct. The headline is a COMPUTED number whose rule is community knowledge (drop the best and the worst, DNF rules, Mo3 for 3 solves), the dropped solves are shown as dropped, and the bar is per solve, not per event. Scramble strings are noise and are left out.

## The design decisions

**1. The card computes the average; the user supplies solves.** `kind` is not a prop: 3 solves is Mo3 (mean of all three, nothing dropped, the format blindfolded events use), 5 is Ao5, 12 is Ao12 (best and worst dropped; the average of the rest). Any other count is refused. This removes the one way a card can contradict itself (a "Mo3" label over five solves). Arithmetic is integer hundredths of a second throughout.

**2. Dropped solves stay on the card.** A dropped solve is printed in parentheses with a hollow bar (outline, page colour inside); counting solves have a solid bar. This is the one visual a generic chart tool gets wrong and the reason the template exists.

**3. A worse average is printed, not drawn red.** Same ruling as day 12: faster than the old PB gets a `NEW PB` chip and a minus sign; slower gets a plus sign in ordinary ink and no chip; no warning colour. The reader is a cuber having a bad session.

**4. Day 13's lesson: the picture must contain what the brief promises.** Day 13 shipped a "bar" card whose layout contract said bars and whose render had none; the critic read the stills and said NO SHIP. Here the bars are the template, so: the test asserts every non-DNF solve has a bar tile with width proportional to its time, and the build phase LOOKS at the stills (`stills/*.png`) before it writes `30-build.md`.

## Layout (regions, ratios)

Regions, not pixels. Two arrangements, picked from the target's aspect: `w/h >= 1.3` is two columns; anything narrower is stacked. Seven contract canvases: 1920x1080, 1280x720, 3840x2160, 640x360, 480x270 are 16:9 (two columns), 1080x1920 (stacked, tall), 1080x1080 (stacked, square).

```
stacked (square / portrait)                    two columns (16:9)
+------------------------------------------+   +--------------------+---------------------------+
| [AO5] 3x3                  mira_cubes    |   | [AO5] 3x3          | 1  ======(hollow)   (24.19)|
| Oct 4, 2026                              |   | mira_cubes         | 2  ===========       27.84 |
|                                          |   | Oct 4, 2026        | 3  ============     29.50+ |
|   27.80                       [NEW PB]   |   |                    | 4  ==============  (31.62) |
|   -0.55 vs previous Ao5 PB 28.35         |   |  27.80   [NEW PB]  | 5  ==========        26.07 |
+------------------------------------------+   |  -0.55 vs previous |                           |
| 1  [======= hollow  ]            (24.19) |   |  Ao5 PB 28.35      |                           |
| 2  [==============  ]             27.84  |   |                    |                           |
| 3  [================]            29.50+  |   | footnote           |                           |
| 4  [=================]          (31.62)  |   +--------------------+---------------------------+
| 5  [============     ]            26.07  |
+------------------------------------------+
| Best and worst dropped (in parentheses).
| Average of the middle 3, rounded to hundredths. + = +2 included.
+------------------------------------------+
```

- **Stacked** bands, top to bottom: header + headline (about 30% of the height), the solve rows (what the other two leave, at least half), the footnote (about 10-12%). Targets, not pins.
- **Two columns**: left about 38-40% of the width (header, headline, delta, footnote at its foot), right the solve rows over the full height.
- Header: the `[AO5]` / `[MO3]` / `[AO12]` chip and the event, then the cuber's name and the date in smaller text. The chip comes from the solve count, never from a prop.
- Headline: the average is the largest text on the card by a clear margin. Beside or under it the `NEW PB` chip (only when strictly faster than `previousPb`) and one delta line: `-0.55 vs previous Ao5 PB 28.35`. With no `previousPb` the delta line and chip are absent and the headline simply stands.
- Rows, in the order the solves were given (solve 1 first): index, track, time. The index column is narrow, the time column is right-aligned so the decimal points stack, and the time carries a trailing `+` for a +2 solve and parentheses for a dropped one. Every row has the same height, the same track size and the same left edge; a bar grows from the left. All row texts share one font size (the smallest any row needs), so the column reads as a column.
- Bars: length proportional to the solve time, scale zero to the slowest non-DNF solve, which fills its track. DNF rows have a time cell (`DNF`, or `(DNF)` when it is the dropped worst) and an empty track, no bar. If every solve is DNF there is no scale and no bars.
- Few rows: cap the row height so a Mo3 does not become slabs; the rows group sits at the top of its band (stacked) or vertically at the top of the column (two columns).
- Footnote, at most two short lines, built from what the card has: the rule that applies (`Best and worst dropped (in parentheses). Average of the middle 3.` / `Mean of all 3 solves.`), `rounded to hundredths`, `+ = +2 included` only when a `+` solve is present, `Bars are drawn from zero; the slowest fills the track.` (or the variant's own sentence), and for a DNF average the rule that caused it.

Mechanism: static svg text in the bundled font plus plain colour tiles. No media, no children needed. The builder should expect splits above 12 (12 rows plus bands): 5-smooth, `weightedSplit(..., { precision: 120 })` (AGENTS.md, rules that fail silently).

## Layout contract (the invariants the build sweeps)
At the seven contract canvases, at defaults, and in the test at the stress copy below:
- every text fits its box: chip, event, name, date, the headline, the delta line, the `NEW PB` chip, each row's index and time (a label per row, the copy differs), the footnote. Use `textFitsMeasured` / `textFitsAll`, fit at `cell * 0.94 - 2px`.
- the headline (the average) lives in the top half (`within yFrac [0, 0.5]`) in both arrangements; the footnote lives in the bottom fifth (`within yFrac [0.8, 1]`).
- every row has a track (presence), every track is at least a fifth of the canvas width (`minWidthFrac: 0.2`) and the tracks are the same size (`equal: "size"` on the track label).
- a bar label is present for every non-DNF solve. That a DNF row has none, that bar widths are proportional, and that dropped bars are hollow is asserted in the test, not in the contract.
- no pinned fractions: the use case does not ask for one.

## Props (name - type - default - what it changes - required?)
All optional; every default is part of the picture.

| prop | type | default | what it changes |
|---|---|---|---|
| `event` | string | `"3x3"` | the event next to the chip; free text (`"OH"`, `"3BLD"`, `"Skewb"`); empty removes it |
| `solves` | string[] | `["27.84","24.19","29.50+","31.62","26.07"]` | the data, 3, 5 or 12 entries; decides Mo3 / Ao5 / Ao12 |
| `previousPb` | string | `"28.35"` | the old PB for the same kind of average; sets the delta and the `NEW PB` chip; empty removes both |
| `cuber` | string | `"mira_cubes"` | the handle or name under the event; empty removes it |
| `date` | string | `"Oct 4, 2026"` | free line next to the name; empty removes it |
| `bar` | `"length"` \| `"spread"` | variants a, b: `"length"`; c: `"spread"` | what the bar means (see variants); the footnote follows it |
| `avgLine` | boolean | a: `false`, b: `true` | a thin tick at the average's position in every track (`bar: "length"` only) |
| `accent` | #rrggbb | builder's pick (a cube-sticker colour) | counting bars, the chips, the headline |
| `preset` | `"dark"` \| `"light"` | `"dark"` | page and ink |
| `debugLayout` | boolean | `false` | draws the contract over the render |

The shipped defaults are the winning variant's; the others stay one prop away.

Rules, not props:
- Solve strings: `27.84`, `1:02.45`, a trailing `+` (the +2 is ALREADY in the number, as csTimer prints it), `DNF`, and csTimer's `DNF(15.20)` (read as DNF; the number is ignored). Parsed to integer hundredths; printed back `SS.hh` under a minute and `M:SS.hh` above, ASCII only.
- Drops (Ao5, Ao12): drop the best (first of equal fastest) and the worst (last of equal slowest; a DNF is always the worst; with several DNFs the last DNF), so the two are always different solves.
- Average: sum of the counting solves in hundredths divided by their count, rounded to the nearest hundredth, halves up, in integers: `floor((2 * sum + n) / (2 * n))`. If any DNF is still among the counting solves (Ao5/Ao12: two or more DNFs; Mo3: one), the average is `DNF`: the headline says `DNF`, no `NEW PB`, no delta (the non-DNF solves still get bars). The scout did not open the WCA regulations: state the rounding choice in the template's header comment, do not cite a regulation number from memory.
- Delta = average - previousPb in hundredths, printed with a sign: `-0.55`, `+0.31`, and `ties previous Ao5 PB 28.35` when equal. `previousPb` is a plain time (no `+`), or `DNF` / empty meaning "no PB": no delta, no chip. `NEW PB` only when the average is not DNF and strictly less than the old PB.
- Fail fast, naming the value: a solve that does not parse, a count other than 3, 5 or 12 (the message says what a count of 7 would need), a parenthesised solve (the message says to drop the parentheses: the template works out which solves are dropped), a bad `previousPb`, a malformed `accent`.

Test vectors for the build (all worked by hand; the test should pin them):
- Defaults: hundredths 2784, 2419, 2950, 3162, 2607. Best 2419, worst 3162, counting sum 8341, /3 = 2780.33, average `27.80`; PB 2835, delta `-0.55`, `NEW PB`.
- Ao12 rounding edge: `27.39 29.10 26.55 31.02 DNF 28.44 25.98 27.71 30.36 26.83 28.90 27.15`. One DNF is the worst, best is 25.98, ten counting, sum 28345, 28345/10 = 2834.5, average `28.35` (half up). A float implementation can print `28.34`.
- Mo3: `19.04 18.50 20.00` is `19.18`; `19.04 18.50 DNF` is `DNF`.
- Ao5 with two DNFs: average `DNF`, both DNFs shown, the other three have bars.
- Stress copy for the sweep: 12 solves, one over a minute (`1:02.45`), a 30-character handle, an `OH` and a `3x3 One-Handed` event, a `previousPb` of `1:05.00`, `DNF` average, emptied name / date / event lines.

## Beats
None: a still. The scout called the clip a possibility ("one solve per beat"); it is a follow-up on purpose. Changing the kind is not one idea different, the card is pasted into a thread as an image, and today's open question is what the bar should mean.

## Defaults must show
At 1080x1080, a cuber who does not exist after a decent Ao5:

| solve | time | shown as | bar (share of the 31.62 track) |
|---|---|---|---|
| 1 | 27.84 | `27.84` | 88% solid |
| 2 | 24.19 | `(24.19)` best, dropped | 76% hollow |
| 3 | 29.50+ | `29.50+` | 93% solid |
| 4 | 31.62 | `(31.62)` worst, dropped | 100% hollow |
| 5 | 26.07 | `26.07` | 82% solid |

Headline `27.80`, chip `AO5`, `NEW PB`, `-0.55 vs previous Ao5 PB 28.35`, footnote with the `+ = +2 included` clause. A stranger sees a five-solve average, which two solves did not count, and that it beat the old record. The solves are invented; the name is a made-up handle.

Honest weakness the defaults will show: drawn from zero, the five bars are 76-100% of the track, so they look alike. That is the correct picture of a 24-32 second spread and it is why variants b and c exist.

## Acceptance rubric (the critic scores against this)
1. Renders at defaults at 1080x1080, 1920x1080 and 1080x1920, exit 0, no error mosaic, and the square still reads to a stranger as a cubing average: five solves as bars, two in parentheses with hollow bars, `27.80` as the headline, `NEW PB` and the delta against 28.35.
2. The arithmetic is honest: integer hundredths, the drop rule, the rounding rule and the DNF rules as written above (the test pins the vectors: 27.80, the Ao12 edge 28.35, Mo3 19.18 and DNF). A slower average has a plus sign, no chip and no warning colour. The footnote states the rule that was used.
3. The bars are there and say what the footnote says. The stills, not just the layout intent, show one bar per non-DNF solve; lengths are proportional to the stated quantity (a unit test checks tile widths against the numbers within the pixel or two quantization takes); the slowest fills its track; dropped bars are hollow and counting bars solid; a DNF row has no bar; all tracks share one size and left edge. (Day 13 failed exactly here.)
4. Nothing clips or collides from Mo3 to Ao12 at the seven contract canvases, with `1:02.45`, a `DNF` average, a 30-character handle, `3x3 One-Handed`, `previousPb` of `1:05.00` and emptied name / date / event lines. A Mo3 does not become three slabs.
5. The props are what the artifact holds and nothing more: solves, an old PB, an event, a name, a date. The template does not read a csTimer export; the ship note shows how a csTimer `Time List` maps onto `solves` (`1. 27.39 <scramble> @...` becomes `27.39`, `DNF(15.20)` is accepted as is) and neither it nor the tutorial claims it parses the block. The tutorial quotes the thread's own words without naming the members.

## Variants worth trying (up to 3, each ONE idea different)
- a: `bar: "length"`, `avgLine: false`. Bars from zero, the slowest fills the track. The baseline and the most literal picture.
- b: `bar: "length"`, `avgLine: true`. Same bars plus a thin tick at the average in every track, named in the footnote (`Tick = the average.`). Tests whether a reference line rescues the 76-100% sameness without distorting the axis.
- c: `bar: "spread"`. The bar is the distance from the average: a centre line in each track, counting and dropped solves growing left (faster) or right (slower), the largest distance fills its half. Footnote says `Bars: distance from the average, left = faster.` Shows who carried the average and who dragged it; with a `DNF` average there is no centre, so it falls back to `length` and the footnote says so. If the centre line collides with any label, drop c.

If more than one variant is built, leave the one intended to ship last in place (the critic judges the last-left variant last) and make its choices the defaults.

## What is weak in this plan
- Timer apps already draw their own share cards (search results only, not opened). The angle is "from the text people already paste", which only works if the ship note makes the mapping from a csTimer block obvious.
- The template does not parse the csTimer block; `solves` is a list of strings someone has to extract. A paste-the-whole-block prop would be the better UX and is a v2.
- Only 3, 5 and 12 solves. Ao50 / Ao100 (the other averages the forum timer tracks) do not fit a one-bar-per-solve card; refused, not solved.
- Times of ten minutes and over are formatted but not rounded to whole seconds as the WCA does for those; not handled today, written down.
- The WCA's Bo3 events and multi-blind are out.
- Bars from zero are low-contrast for a tight session; that is the point of variants b and c, not a bug to hide.
