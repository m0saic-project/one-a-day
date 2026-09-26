# Critique — 2026-09-26

Judged from `variants/a|b/report.json` (every render exit 0, 20 s, the right
dimensions, not degraded; tutorial exit 0), the stills (portrait 10/50, square
50/90, landscape 50/90, tutorial pages 2, 3 and 6 viewed), the source and the
build log. The two variants differ in one default (`graph`), so they are
identical wherever the graph is absent: the square canvas at ten rows.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 1 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 15 | no |
| b | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 16 | no |

## What each variant gets right / wrong

**a (cumulative delta graph)**
- Right: portrait-10 is a complete recap a stranger reads as a speedrun PB
  (ten named splits, LiveSplit's colours, NEW PB, 21:11.27, "PB by 12.34s");
  portrait-50 shows the mechanism working (Aqueduct highlighted, five landed,
  five pending in dim with the old PB times, clock 12:42.76).
- Wrong: the graph re-draws the delta column the table already prints. A
  fifth of the portrait frame says nothing new; that costs line 2.
- Wrong (shared): square at ten rows drops the graph the brief drew there.

**b (time saved per segment)**
- Right: the graph carries what the table does not show at a glance: where
  the time came from. landscape-90 reads as a story in one look (one deep red
  bar at the Clocktower, then the gains, the tall bars capped gold).
- Right: the gold caps now coincide with the biggest savings, so the table's
  gold deltas and the graph agree instead of speaking in two units.
- Wrong (shared): square drops the graph at ten rows; the tutorial and the
  ship note must not promise a graph on every canvas.

**Both, on line 6:** a runner would post this over a screenshot, but the path
is friction: paste the `.lss` into Make, or wrap it in JSON for the CLI. The
demo proves the idea; it is not yet one drag-and-drop.

**Line 8, both:** the brief sketched a graph band in square (dropped at ten
rows for legible rows) and did not list `graph` as a prop (it became one so
the losing variant's idea stays reachable). Both are improvements, but they
are not what was promised.

Fatal checks: none. No degraded render; the tests assert behaviour (the
colour rule, the .lss rebuild, the gates evaluated at t, the refusals); every
prop has a default; `gaming/speedrun-pb-recap` says what it is; the problem
page cites only the five URLs the scout opened, and b's solution page
describes b's graph.

## Decision: SHIP b

## If ship: what a human polish pass should look at first
1. The numbers are drawtext in the machine's font (a monospace here) beside
   the bundled Roboto of the names: decide whether that is the timer look or
   a mismatch.
2. Feed it real runners' files: the previous-PB rebuild trusts SegmentHistory,
   and only a fixture has exercised it.
3. The CLI path for a `.lss` needs a one-line JSON wrapper (in 50-ship.md);
   a file prop would need the engine to hand templates file contents.
4. Square at many rows: a compact graph (a strip of per-segment ticks) could
   stay where the full graph drops out.
5. v2, the forum's recurring ask: the same props over the recorded run at
   1:1, gameplay in a slot and the splits beside it.
