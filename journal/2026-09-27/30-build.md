# Build — 2026-09-27

## Template: @one-a-day/sports/powerlifting-meet-recap/v1

New pack `sports` (scaffolded by `npm run new`). 13 unit tests: the bindings
(nine weights, each bound to its own leaf of `attempts`), the layout contract
at seven canvases for ten prop sets, the weight and pound maths, the day's
rule (negative = no lift, best, total, bomb-out, disqualification), an
OpenPowerlifting CSV in the documented 42-column format (a full meet, a
bench-only meet, a bests-only row, a bomb-out; `row` by number, date and
name), frame 0 = the finished board and the last frame = the first (the
gates evaluated at t), the counted total read back out of its drawtext
expression, both children 5-smooth with every ring inside the child, the
readable accent, the pinned duration, and every validation error.

## Variant a — the weights as the CSV has them, kilograms, big · gate: clean · render: ok · stills
Build clean on the first full run: no warning for this template (no
overlayDepth posture; the gated tiles all live in the two children).
Renders: landscape, portrait, square and the tutorial all exit 0, 12 s
each, 2 min 2 s for the set. Stills: at 10% (the cold open) the whole day -
nine cells, eight solid green, the missed third bench a red frame around a
dark cell, 8/9, 392.5, the bar in three colours, "1st place", "398.12
Dots"; at 50% the ring is on the third bench, the five lifts before it have
landed, the deadlifts wait dark with their weights, the total is caught
mid-count at 230.8 on its way from 227.5 to 232.5, the bar has two
segments, the stamp and the result are hidden; at 90% the finish again. The
first square render starved the cells (69 px under a label strip); fixed
before the set above was kept (see What was hard).

## Variant b — every cell speaks both units, kilograms over pounds · gate: clean · render: ok · stills
One idea changed: the default `units` is "both" (the other two stay prop
values), and the solution page says so. Same timings, same exits, 2 min
14 s. Each cell carries the kilograms bold and the whole pounds under them;
the best reads "best 150 kg / 330 lb"; the total counts in kilograms and
the pounds are said once, beside the points ("865 lb - 398.12 Dots"). On
the square the label column becomes three short lines (name, best, pounds).
Four more stills through the CLI from a fictional CSV
(`variants/b/extra/`): the full meet, the bench-only meet (one row), the
bests-only row in pounds on the light page (one wide cell a lift), the
bomb-out (three red frames, "NO TOTAL", "Disqualified").

Snapshot note: variant b was re-rendered from the final source. Variant a's
snapshot is one step older: it differs from b in the default unit and its
words (the one idea), and it predates the unit-explicit assertions in the
test and the readable-accent fix, which changes no pixel at the defaults.

## Why-tutorial
The problem page quotes a lifter's write-up ("This time, I went
three-for-three, making 226, 253, and 259"; Instagram "for videos of my
heaviest successful lifts and a recap of my attempted weights"), the
OpenPowerlifting documentation ("Negative values indicate failed
attempts"; the total as the sum of the three bests), the OpenLifter guide
(audiences like "something to look at") and the LiftingCast overlay starter
("graphic overlays" for OBS, behind the meet's API key), with the five URLs
the scout opened. The solution page says the results row is the prop, how
the clip replays the day and loops, what this variant prints in a cell, and
the weak spots.

## What was hard
- A square runs out of height before width. With the lift's name on a
  strip above its cells the cells were 69 px tall under a 108 px total. On
  a canvas that is neither tall nor wide the name now sits BESIDE the
  cells (a quarter of the board's width), so the cells keep 122 px.
- A static number on a cell that changes colour needs one ink for every
  state. The weights are svg text that never moves (bundled font, no
  gating); the three faces behind them (pending, good, no lift) were
  chosen so that one ink reads on all of them, which is also why a no lift
  is a red FRAME around the pending face and not a red fill: the shape
  says it as well as the colour.
- The counted total is a sum of ramps in one drawtext expression:
  `inc*clip((t-at)*k\,0\,1)` per good lift that raises a best, inside
  `if(lt(t\,hook)\,final\,...)`. Eight terms, printed through two `%{eif}`
  (whole and tenths). Pounds must end on the converted total, so each
  step is the difference of two converted subtotals, not a converted step.
- The build checks the layout fingerprint against `dist/`, so after a
  layout change the order is build (fails on the fingerprint, but compiles)
  -> `fingerprints:update` -> build. Updating first reads the stale dist
  and writes nothing.
- The accent is picked for the dark page. On the light page a yellow total
  vanished (contrast 1.3); the total and the ring now use the accent pulled
  toward the ink until it clears 3:1, and the stamp keeps the accent as its
  box.
- Heredocs through the harness shell lost their backslashes; edits that
  carry regexes or escapes went through a script file instead.

## In place now: b
