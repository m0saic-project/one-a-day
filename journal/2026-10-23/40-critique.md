# Critique - 2026-10-23

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 17 | no |
| b | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 17 | no |
| c | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 16 | no |

Line 9 is 1 on all three for one shared reason: tutorial-6 ("How this template
was made") shows only scout + plan (2 phases, 20m 25s, 40 tool calls, 1.3M tok,
$0.11). The build phase that wrote the template (2 calls, ~2h45m per run.json)
is absent. The numbers are honest for the trace as it stood when the template
was authored - the build's own trace lands after its call - but the page a
viewer sees does not show the phases that actually ran. c loses a second point:
its tutorial-3 renders the shared solution copy and never names c's one idea.

## What each variant gets right / wrong

### a (in place)

- stills/landscape.png + portrait + square tell the brief's gap story at
  defaults: 18 chips name + real flight numbers (Firebird 9 3 0 4, Wraith
  11 5 -1 3 - all 18 numbers are the real molds'), the US-PUTTER hole, the
  one-deep CONTROL column and the lone Firebird in BEEF read at phone size,
  and the footer's "20 SLOTS - 13 FILLED - 7 EMPTY" matches a hand count.
- Slotting is computed and true at every aspect (Berg over Pig in OS-PUTTER,
  Teebird over Thunderbird, Tern at s = -3 + 2 = -1 in US-DISTANCE); props are
  the brief's seven all defaulted, discs[] validation refuses 31 entries and a
  6-deep slot with the count in the error, and the test asserts both.
- Nothing broken in the stills; the weak spots are polish-level and listed
  below (row labels flush to the grid edge, unbound chip number line,
  tutorial-6 timeline).

### b

- stills/landscape.png keys perfectly: every numbered chip maps to its list
  row (2 Berg over 3 Pig in name order, 14 Firebird alone in BEEF-FAIRWAY,
  18 Tern US-DISTANCE) and all 18 list rows carry the real flight numbers.
- Exactly the brief's one idea (DiscField's numbered-points look); the
  chipDetail prop text and WHY solution page were adapted to the keyed list,
  so tutorial-3 describes b, not the baseline - this variant is honest.
- At square.png the list takes ~35% of the width and the matrix cells shrink
  to ~125px vs a's ~180px: the chart b exists to serve is the least readable
  of the three at the canvas the phone shows; same flush row-label strip.

### c

- stills/square.png + landscape.png are the most legible gap story of the
  three - on paper the empty slots read clearly (terracotta/khaki/sage/blue
  class tints), same correct slotting, same 13/7 counts, nothing clipped.
- Its default preset "light" breaks the brief's "Defaults must show: a
  complete dark share card"; the brief's own variant list invited the paper
  idea, so the conflict is in the brief, but shipping c would break the pin -
  scored on line 8.
- tutorial-3 never names the palette idea that is c's entire reason to exist
  (it renders the shared solution copy); a viewer cannot tell c from a on
  page 3, and page 6 has the same timeline gap.

## Checked and cleared (do not relitigate)

- Row labels LOOK cut at the grid edge in every still ("BEEF", "OS", "s >= 4",
  "s 2-3" ...). I measured: rendered ink bounding boxes match measureText
  widths within side bearings (BEEF 63px ink vs 64.7 measured; s >= 4 39 vs
  39.7; OS 35 vs 36.5), right edges at x 212-215 with the band at 216. The
  glyphs are whole - flush, not clipped. 30-build.md's "they look cut at low
  zoom; they are not" is correct.
- The brief's sketch says "20 SLOTS - 12 FILLED - 8 EMPTY" and "eight faint
  empty slots"; its own default bag fills 13 slots (18 discs, max stack 2).
  The template computes the truth (13/7) and 30-build.md documents the
  divergence - right call, brief-side miscount.
- All 6 tutorial-2 sources match 10-scout.md's opened list and the quotes are
  the evidence's own words ("Feeling like I'm missing something today", "You
  are missing 4 or 5 14 speeds", DiscField's "numbered points", the Marshall
  Street spreadsheet line). No invented sources.

## Decision: SHIP a

a and b tie at 17; c is 16. Pick a: its defaults are literally what the
brief's "Defaults must show" asks for (all 18 chips readable, name + flight
numbers, in the grid), the name-on-chip card answers the scouted use - a
thread-reader sees "you are missing a flippy control driver" without decoding
a key - and a is the variant already in place. b is the right pick for a
30-disc bag where cells get dense; it can be a future variant idea.

## If ship: what a human polish pass should look at first

1. Row-label strip gutter: nameRect/hintRect right-align flush to the grid
   edge (1-4px clearance; "s >= 4" and "s 2-3" touch it). Shrink the label
   rects by ~6px on the right - the look is "cut" at low zoom and cost this
   critique a false no-ship lead.
2. WHY.timeline: refresh from the full trace (build + critique) and re-render
   the tutorial - "how this template was made" should show every phase, with
   the build's 2h45m and its tokens/dollars where the runner reports them.
3. Empty slots share one row tint, so adjacent holes merge (the BEEF row
   reads as one strip, not 4 empty slots). Per-cell tints or hairline cell
   edges would make "20 SLOTS - 13 FILLED - 7 EMPTY" countable from the
   picture.
4. The chip number line shows four props in one string and is unbound in Make
   (chip-name is bound via bindPropPath; double-clicking "9 3 0 4" edits
   nothing). Binding one of the four is the least a user expects.
