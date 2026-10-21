# Critique — 2026-10-21

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 16 | no |

## What each variant gets right / wrong (specific)

Variant a (dark result card, the only variant):

- RIGHT: every render exits 0 with no degraded flag (report.json, 3 canvases
  + tutorial 59s/6 pages); the layout contract is machine-swept at all seven
  contract canvases by the test (12/12), and the scratch probe of the built
  dist shows the promised geometry at four canvases — track 0.91-0.95 of the
  width, 59 plain bars + the accent peak at second 41, a square 70x70 NEW PB
  badge, three equal 311x205 tiles, hero 109px over handle 35px and tile
  values 90px, every default string present and well-formed.
- RIGHT: the PB is computed, never typed — "+3 vs PB" and the badge appear
  at 102 vs 99 and vanish at 98 vs 99 and 99 vs 99 (tested), and raw < wpm is
  refused by name with the reason, which is the one rule the header comment
  teaches.
- WRONG (line 6): the incumbent is strong. The app's own result screen is
  one screenshot away and Monkeytype already institutionalizes the PB
  moment; a member adopts this only for a branded, batchable PB post, and
  the caveats admit the numbers are retyped, not imported.
- WRONG (line 9): the "how it was made" page lists five self-reported phase
  estimates, rendered before the critique and ship phases had actually run
  — disclosed as self-reported in the caveats (no runner trace.json exists
  this day), but it is still a projection at render time.
- NOT SEEN: the stills themselves. This model takes no image input, so the
  render was judged from report.json, the probe, the code and the test
  sweep — the same fallback the critic prompt prescribes; a human polish
  pass must start with the eyes.

## Decision: SHIP a

## If ship: what a human polish pass should look at first

1. The pictures: square/portrait/landscape stills and the tutorial pages —
   no one with eyes has seen the serika-yellow-on-dark page, the bar ramp,
   or the cramping at 640x360 and 480x270 (several strings sit at the 6px
   floor there).
2. The prop count: 10 data props + debugLayout sits at the brief's own
   ceiling ("five to ten, not thirty") — a v2 could fold `raw` into a
   derived line or `mode` into a preset.
3. The adoption story: whether the computed-PB angle beats the screenshot
   for this community, or whether v2 needs a one-step import (result JSON)
   to close the gap the caveats admit.

## If no ship: the one thing that would have changed the verdict

n/a — shipped.
