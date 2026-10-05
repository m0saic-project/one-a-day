# Build - 2026-10-04

## Template: @one-a-day/sports/cubing-average-card/v1

Pack `sports`, folder `src/sports/cubing-average-card/v1/`. One template; the three variants share the id and the folder. The code supports all three bar meanings from the start (`bar`, `avgLine` props); a variant is the set of defaults it was rendered with, so `variants/a|b|c/src/` differ only in `DEFAULTS` (and, for a and b, a footnote sentence reworded later, see below).

Stills were opened and read (square, landscape, portrait of every variant, `tutorial-2/3` of c) and checked claim by claim, not just the green build. Extra renders of the stress copy (12 solves, `1:02.45`, a DNF, 30-char handle, `3x3 One-Handed`, `previousPb` `1:05.00`) and a light Mo3 are in `scratch/stress.png` and `scratch/mo3.png`.

## Variant a - `bar: "length"`, `avgLine: false` (bars from zero) - gate: clean - render: ok - stills: five solves as bars, `(24.19)` and `(31.62)` outlined with a hollow bar, `29.50+`, headline `27.80`, `NEW PB`, `-0.55 vs previous Ao5 PB 28.35`
The baseline. Every claim is in the picture, and the brief's honest weakness shows: the five bars are 77-100% of the track and look alike. (The brief says 76% for solve 2; 24.19 / 31.62 is 76.5%, which rounds to 77; the test pins 77.)

## Variant b - `bar: "length"`, `avgLine: true` (a tick at the average in every track) - gate: clean - render: ok - stills: variant a plus a thin white tick at 27.80 in all five tracks
The tick helps a little: you see who is left and right of it. But the bars still start at zero and end within a few percent of each other, so the tick sits in the last quarter of every track and the eye reads "all about the same". Footnote gets `Tick = the average.`.

## Variant c - `bar: "spread"`, `avgLine: false` (distance from the average) - gate: clean - render: ok - stills: a centre line in every track, 27.84 a 4-hundredths sliver, `(24.19)` a hollow bar to the left, `29.50+` solid right, `(31.62)` hollow, filling the right half, `26.07` solid left
The one that answers "who carried the average and who dragged it". Dropped bars are the ends of the spread, which is the true picture of a dropped best and worst. Cost: the bar is not the time (the number beside it is), a solve exactly on the average has no bar (tested), and the footnote has to say so (`Bars: distance from the average, left = faster.`). With a DNF average there is no centre and it falls back to length bars and says so in the footnote (tested). Centre line vs labels: the texts live in their own columns, nothing collides (tested at the seven canvases).

## Why-tutorial
- Problem page: who (SpeedSolving.com cubers pasting csTimer blocks), what was observed in the threads' own words ("avg of 5: 27.59", dropped solves in parentheses, scrambles, hand-typed PB tables; "a PB notification pops up the moment you set a new record"; Mo3 because one DNF wipes out an Ao5), and the two thread URLs. It does not name members. Read as a still: nothing clips.
- Solution page: count decides Mo3/Ao5/Ao12, best and worst dropped (parentheses, hollow bar), integer hundredths, delta against the old PB; the one decision is that dropped solves stay on the card and a slower average is printed with a plus sign, never red; three weak spots (no csTimer parsing, only 3/5/12 solves, spread bars are distance not time plus the half-up rounding choice). Read as a still: nothing clips.
- It never claims the template parses the csTimer block; the caveat shows the mapping (`1. 27.39 <scramble> @...` becomes `27.39`).

## What was hard
- Decimal points that stack. Parentheses and a trailing `+` make a right-aligned column ragged. Each time cell ends at its own digit edge plus its own hang (`+`, `)`, `+)`), measured, so every row's last digit sits on one edge `R`; the test pins this at all canvases.
- A hollow bar is two tiles (an accent bar, a track-coloured hole inset by an edge width). The hole colour is the TRACK colour, not the page colour the brief wrote: with the page colour the hollow reads as a cut-out darker than the track around it. A tiny dropped bar needs room for its hole, so a dropped bar has a floor width of `2 * edge + 2` px; a solid bar's floor is 1% of the track. Both only matter for tiny distances.
- The delta line is two cells (`-0.55 vs previous Ao5 PB`, then `28.35`) so the old PB's own number can be bound to `previousPb` (the gate warns `bindingsCover` for a prop drawn as text but not bound). The words are derived and unbound.
- The `+ = +2 included` footnote clause wrapped as `... +` / `= +2 ...` in variants a and b; reworded to `A trailing + is a +2, already included.` before c was rendered (stills of a and b still show the old wording).
- Test cost: the cubing test sweeps 16 stress cases x 7 canvases and takes about 5 minutes.
- Changing a default changes the layout fingerprint (`.layout.m0`), so the build fails once after a variant switch; `npm run fingerprints:update` then `npm run build` is the loop.

## In place now: c

`bar: "spread"` is the default; `avgLine: false`; the length bars and the tick are one prop away. `state.json`: variants `["a","b","c"]`, inPlace `c`.
