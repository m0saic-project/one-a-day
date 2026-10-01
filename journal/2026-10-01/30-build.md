# Build — 2026-10-01

## Template: @one-a-day/sports/swim-time-drop-card/v1

One swimmer, one meet, one still. Source:
[`src/sports/swim-time-drop-card/v1/`](../../src/sports/swim-time-drop-card/v1/swim-time-drop-card.ts),
test beside it. Canvas hint 1080x1080. Three variants were built in place;
each one passed `npm run build` on its own before it was rendered. A snapshot
of each variant's source is in `variants/<x>/src/`.

What all three share:

- Props are a results row and nothing more: `swims: [{ event, entry, final,
  standard? }]`, 1 to 8 rows, plus `swimmer`, `club`, `meet`, `details`,
  `course`, `bar`, `accent`, `preset`, `debugLayout`.
- Times are parsed to integer hundredths (`parseSwimTime`), printed back as
  `SS.hh` or `M:SS.hh`, and the drop is `entry - final` with its sign. The
  defaults give `5 of 6 swims faster` and `14.82 s dropped`.
- A slower swim gets `+0.42` in the same ink as a faster swim's minus, and an
  empty track. `NT` prints `first swim`, `DQ` prints no drop; neither is
  counted. `vs entry time` is on every card; "PB" and "best time" are not
  (the test greps the rendered sources).
- Square and portrait put the bar under the row's text line at the full
  content width; canvases 4:3 and wider put it in a column between FINAL and
  DROP.
- Accented Latin names are drawn (U+00C0-U+017F: the test walks the range in
  both font weights). Anything else is refused by name, never tofu.

## Variant a — bar = share of the entry time dropped · gate: clean · render: ok · stills: thin bars, the footnote alone explains them

`bar: "percent"`. Stills in [`variants/a/stills/`](variants/a/stills/). The
card reads as a swim meet at a glance. The weak spot is the one the brief
predicted: `-0.87` sits over a longer bar than `-4.01`, and nothing near the
bar says why. The explanation is one small line at the bottom
(`Bars: share of the entry time dropped; the longest is 4.2%.`).

## Variant b — bar = seconds dropped · gate: clean · render: ok · stills: bars agree with the printed number, the 50s are stubs

`bar: "seconds"` as the default; nothing else changed. Stills in
[`variants/b/stills/`](variants/b/stills/). The bar and the number beside it
are the same unit, so nothing needs explaining. The cost is visible: the 50
Free (a 2.7% drop) is a stub next to the 200 IM (2.3%), which is the
unfairness the brief set out to avoid.

## Variant c — variant a with each bar's percent printed at its end · gate: clean · render: ok · stills: every bar carries its own number

`bar: "percent"`, and each bar prints its share (`2.7%`, `4.2%`) just past
its end on the track, or inside the bar when the bar is too long to leave
room. The track is taller to hold the label; the footnote becomes
`vs entry time. Bars and their percentages: share of the entry time dropped.`
Stills in [`variants/c/stills/`](variants/c/stills/). In landscape and
portrait this is clearly the most readable of the three. In the square the
labels are the smallest data on the card (23 px with six rows, 16 px with eight) but they fit
at every contract canvas. In `bar: "seconds"` no label is drawn: the row
already prints that number as the drop.

Stress renders of variant c are in [`scratch/`](scratch/) with their props
(`long.json`: eight rows, a 30-character name, `1650 Freestyle` with a drop
of `-1:02.33`, `AAAA` on every row, an NT, a DQ, an equal swim and a slower
one; `one.json`: two rows, an accented name, light preset, seconds bars).

## Why-tutorial: the problem page and the solution page

- Problem (`stills/tutorial-2.png`): coaches and parents type the recap by
  hand; it quotes the Wave and CATCC recaps with the children's names
  replaced by `[swimmer]`, Maverick's written definition of a time drop, and
  the Hy-Tek export that already holds the numbers. All six sources listed.
  Nothing clips.
- Solution (`stills/tutorial-3.png`): one card per swimmer from the rows a
  results file holds; the one decision is that a bar says what it measures
  (share of the entry time, percent printed at its end, seconds one prop
  away) and a slower swim is printed, not drawn. Three caveats: it does not
  read `.hy3`/`.cl2`, the entry time is not always the fastest earlier swim,
  eight rows and no relays.

The scaffold's `who` line was 161 characters against a limit of 160; I
dropped "best times" from it (which also keeps that phrase off every page).

## What was hard (two or three lines an author would want tomorrow)

- A `relations: [{ equal: "size" }]` entry needs at least two nodes. A
  one-row card has one track, and the contract fails with "relation needs
  >= 2 nodes" unless the relation is left out for that case.
- One shared font size for a whole table row lets a single long event name
  shrink every time on the card. Two sizes (one for all event names, one for
  all times) keeps the numbers large; fitting the times to 88% of their
  column keeps a gutter between ENTRY and FINAL.
- `const X: Union = "b"` narrows to `"b"`, so a later `p.bar !== "a"` check
  fails to compile once the default changes. `"b" as Union` does not.
- The footnote's length changes with `bar`, which can add a line and move
  the rows band by a few pixels. "Changing `bar` changes nothing else" is
  true for the columns, not for the heights; the test says so.

## What is weak

- Variant c's labels in the square are the smallest text that carries data.
- With one or two swims the rows sit at the top of their band and the middle
  of a square card is empty (the brief asked for that over slabs).
- A 21-character event name (`400 Individual Medley`) drops the event column
  to 24 px in the square with eight rows. Clubs write `400 IM`; the template does not
  abbreviate for them.
- Copy that cannot fit at the floor is refused with an error naming the
  field and the canvas, not shrunk further. That only triggers on canvases
  far below the contract's smallest (the test uses 160x90).
- No results-file reader. The mapping for the ship note: one `.hy3`/`.cl2`
  individual result gives `event` (distance + stroke), `entry` (the seed
  time, `NT` when absent), `final` (the swum time, `DQ` when disqualified);
  `standard` is looked up by the caller.

## Checks run

- `npm run build`: clean for this template (the two warnings printed belong
  to `dev/og-card` and `social/episode-audiogram`, both frozen).
- `npm test`: 16 suites, 261 tests pass; 56 pipeline tests pass. This
  template's suite is 33 tests.
- `render-variant` for a, b and c: exit 0, no degraded render, tutorial
  rendered (six pages).
- Through the CLI, nine rows and a malformed time both exit 1 with the
  template's own message (`swims has 9 rows; one card holds at most 8 -
  split the meet across two cards.`).

## In place now: c
