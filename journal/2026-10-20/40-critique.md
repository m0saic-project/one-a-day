# Critique — 2026-10-20

The critic cannot take image input (the model returns an error on the stills), so
this is judged the same way the builder did: `report.json` exit codes and degraded
flags, `node tools/check-registry.mjs --json`, the rendered `square.output.json`
(feasible, 25 sources, no warnings), the flattened layout, and a line-by-line read
of `src/community/geocache-milestone-card/v1/*.ts` and its test. The milestone
ladder was re-checked against Project-GC's Milestones tab verbatim: "1, 10, 50 and
100 ... up to 1000 every hundredth ... between 1000 and 5000 every five hundredth
... beyond that every thousandth" — `isMilestone` matches it exactly, including
the 1000 boundary (hundreds tier) and 1500 (five-hundreds tier).

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 16 | no |
| b | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 16 | no |

## What each variant gets right / wrong

**a (in place).** Right: the one concept is real and correct — `isMilestone` /
`ordinal` are pure, exported, unit-tested, and match Project-GC exactly, so the
"1,000th find" + MILESTONE badge cannot disagree with the typed 1,000. Fail-fast
is genuinely adversarial (misspelled type with a did-you-mean, mix that sums past
findCount, non-integer findCount, unknown prop) and the test asserts the actual
messages. The layout contract is not a widened ruler — header top band, full-width
mix bar, three `equal: "size"` tiles, footer band, square badge all name what the
brief promised, and the default mix sums to exactly 1000 (no grey Other).

Wrong / weak: the why-tutorial's `timeline` still lists only scout (x3) + plan —
the build phase (109 calls, $0.99 in `trace.json`) is missing, so `tutorial-6`
"how it was made" under-reports the run; that is a ship-phase re-mint
(`node pipeline/lib/trace.mjs --timeline`), not a blocker. The brief's props table
says "8 + debugLayout" but the template ships a 9th data prop (`footer`), which the
brief's layout section describes but the table omits — harmless, mildly untidy.
The value angle is the honest weak spot (line 6): the scouted artifact is the My
Finds GPX, but the card retypes numbers instead of importing, and Project-GC /
CacheSleuth already surface the milestone — only the clean deterministic share card
differentiates it, and the caveats say so.

**b (night-cache preset).** Its `src` snapshot carries the `preset` knob (37 KB vs
36 KB), but it was reverted and its `report.json` + stills are byte-identical to a
(the light default); the only evidence of the idea is
`variants/b/renders/dark.png`. It adds nothing distinct over a at defaults, so it
is judged the same and contributes no reason to prefer it.

## Decision: SHIP a

No fatal. No degraded render (exit 0 on all three canvases, `check-registry`
renders all 35 with zero errors/warnings on this template), every prop has a
default, the pack/slug describe it, the problem page cites only sources the scout
actually opened, and the solution page claims only what the variant does.

## What a human polish pass should look at first

1. The why-tutorial timeline (ship phase re-mints it — make sure build lands in
   `WHY.timeline` before `npm run verify`).
2. `footer` is an undocumented 9th prop in the brief's "8 + debugLayout" table —
   add it to the brief or drop it, so the count matches.
3. Visual cramping at 640x360 / 480x270: the contract proves text fits, but a
   human eye on the legend line and the badge at the floor is the one thing the
   builder could not do.
