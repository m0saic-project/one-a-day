# Critique — 2026-09-27

Judged from `variants/a|b/report.json` (every render exit 0, 12 s, the right
dimensions, not degraded; tutorial exit 0, 65 s), the stills (a: portrait
10/50/90, square 10/50, landscape 50/90; b: portrait 10, square 50/90,
landscape 50; tutorial pages 2, 3, 4, 5 and 6 viewed), the four CSV stills in
`variants/b/extra/`, the source and the build logs. The two variants differ
in one default (`units`) and the words that describe it.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 1 | 1 | 2 | 1 | 2 | 15 | no |
| b | 2 | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 2 | 14 | no |

## What each variant gets right / wrong

**a (kilograms, big)**
- Right: portrait-10 is a scoreboard for one person that a stranger reads
  in a glance (three lifts, three tries, eight green, one red frame, 8/9,
  392.5); the weights are the biggest thing in every cell at every canvas,
  square included (square-10: 122 px cells, 56 px numbers).
- Right: portrait-50 shows the mechanism working: the ring on the third
  bench, five lifts landed, the deadlifts waiting dark, the total caught
  mid-count at 230.8, two segments of the bar.
- Wrong: the lifter the scout read writes in pounds ("352", "385", "407");
  at the defaults they have to flip `units` to see their own numbers.

**b (kilograms over pounds in every cell)**
- Right: it prints both languages of the sport at once, and the pounds
  match what a lifter says out loud (160 kg is "352 lb", rounded down).
- Wrong: it pays for that in size. square-90: the label column becomes
  three lines at about 20 px ("best 150 kg", "330 lb") and the pounds in
  the cells about 22 px, which is 7 pt on a phone; that costs line 3.
- Wrong: for the lifters who think in kilograms, which is the unit on the
  bar and on every score table, half of each cell is noise.

**Both, on line 5:** thirteen props, above the brief's own "five to ten".
There are two ways in (the six typed props, or `csv` + `row`), and `row`
means nothing without `csv`. Typed, defaulted and validated, but a lot.

**Both, on line 6:** a lifter would post this as the closing card of the
reel, not instead of it: what they post is the lifts themselves, and the
nine cells do not hold video yet. From the CLI a CSV still travels inside a
JSON wrapper. The demo shows the idea; it is not the replacement.

**Line 8, both:** the rubric's five points hold (renders, the rule, the
CSV, nothing clips, the counted total ends exact). But the brief drew the
lift names on strips above the cells everywhere, and the square now puts
them beside the cells; the result line became two cells (place, points);
the accent default moved from #ffb020 to #ffd23f to stay clear of the
deadlift's orange. Improvements, not what was promised.

**Line 9, both:** the problem page quotes what the scout quoted and lists
the five URLs it opened (the lifter's page the scout also read is left out
of the template on purpose: a tutorial card should not carry a private
person's name). Each solution page describes its own variant. Page 5 is the
template. Page 6 shows the four phases that had run when it rendered,
self-reported; the ship phase replaces it with the measured timeline.

Fatal checks: none. No degraded render; the tests assert behaviour (the
rule, the CSV rows, the gates evaluated at t, the total read back out of
its expression, the refusals); every prop has a default;
`sports/powerlifting-meet-recap` says what it is; no source on the problem
page that the scout did not open; no feature claimed that is not there.

## Decision: SHIP a

One unit, big, is the better card, and a lifter who thinks in pounds gets
a clean pounds card with `units: "lb"` (or both, with `"both"`): the losing
idea stays one prop away.

## If ship: what a human polish pass should look at first
1. The total is drawtext in the machine's font (a monospace here) beside
   the bundled Roboto of everything else: decide whether that is the
   scoreboard look or a mismatch.
2. The nine cells are where the lifter's clips belong. `bindPropPath` has a
   "media" leaf kind (a drop target): `clips: { squat: [..], .. }` with the
   weight and the outcome drawn over each clip is the v2, and it is what
   makes this a replacement for the hand-cut reel.
3. Feed it real files: only a fixture in the documented format has
   exercised the parser. Fourth attempts are ignored, and points other
   than Dots (Wilks, IPF GL) are not printed.
4. Colour alone never says good or no lift (solid against hollow does), but
   the green and the red were picked by eye; check them against the common
   colour-vision deficiencies.
5. The batch: a meet director's export is one row a lifter. A loop over
   `row` from 1 to N is the whole production tool; nobody has run it.
