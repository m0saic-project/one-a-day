# Build — 2026-10-11

## Template: @one-a-day/personal/reading-goal-recap/v1

First use of the `personal` pack (the brief's one-sentence justification: the
shelf had team, hobby and tool cards but nothing for a person's own numbers).
Still PNG, hinted 1920x1080, works on landscape, portrait and square.

## Variant a — goal-bar hero, stat tiles row · gate: clean · render: ok · stills:

All three aspects exit 0, no degraded. Landscape reads exactly like the brief:
"October 2026" over "@leah_reads / MONTHLY WRAP-UP", three equal stat tiles
(15 books / 4,703 pages / 4.3 avg rating), the goal line "YEAR GOAL - 46 of
52", the bar filled to 88% with the pace tick visibly inside the fill at 83%,
the delta "3 ahead of pace - 88% of goal" in accent, "day 304 of 365" right,
four shelf titles with ratings, the computed-not-typed footnote. String check:
every number consistent (46/52 = 88%, tick at 304/365 of the bar, delta = 46
- 43.3 = "3 ahead").

First render exposed a real defect: on portrait the S-derived sections
huddled in the top 40% with a dead band above the pinned footnote. Fixed by
spreading the free space across the four inter-section gaps (a quarter each)
- pure function of props and canvas, so determinism holds. Landscape geometry
is untouched (slack = 0 there; the layout fingerprint did not move). Second
render: portrait uses the full height, square is compact and balanced.

## Variant b — pace-forward: the delta is the hero, the stats an inline strip · gate: clean · render: ok · stills:

(stills checked after render) One idea different from a: the tiles become one
inline strip ("15 books - 4,703 pages - 4.3 avg rating", the numbers still
bound), and the pace line prints at display size with "88% of goal" and
"day 304 of 365" stacked beside it. Same goal line, bar, tick, shelf,
footnote. The tile equal-size relation went with the tiles; the contract's
text and band promises are unchanged.

## Why-tutorial

Problem page: who (book bloggers and the 52book crowd) plus the two quotes -
Leah's hand-tabulated "Books read: 43 ... Pages read per day: 125.33" and
Kami's "16 books behind schedule. (88/125)" - and the three sources the scout
opened. Solution page: the one decision (pace is computed, never typed;
dayOfYear is a prop) and the three honest weak spots (no covers, no genre
table, invented defaults).

## What was hard

- The layout contract's budget is exact: a snug cell of `measured + px * 0.12`
  is NOT safe at large sizes - the delta line clipped by 4px at three
  canvases. The safe formula is `ceil((measured + 2) / 0.94)`. Write it once,
  use it for every snug cell.
- Portrait is a different card, not a scaled one: sizing everything off
  `min(W, H)` stacks the sections in the top half of a tall canvas. Spreading
  the slack across the gaps (not centering the stack - that left a dead band
  above the pinned footer) kept every aspect honest with one rule.
- `npm test` is slower than two minutes here; run it detached and poll.

## In place now: b

Variant b (the pace-forward layout) is in `src/`; variant a's source snapshot
is `variants/a/src/`. The critic picks.
