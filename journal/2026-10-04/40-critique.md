# Critique — 2026-10-04

Template: `@one-a-day/sports/cubing-average-card/v1`. Variant c is what is in `src/sports/cubing-average-card/v1/` (checked: `diff -r` against `variants/c/src` is empty).

What I did: read the scout, the brief and the build note; opened every still of c (square, portrait, landscape, tutorial 1-6), the square of a, the portrait of b, and the builder's `scratch/stress.png` and `mo3.png`; read `cubing-average-card.ts` and the test; diffed the variants; ran `npx jest src/sports/cubing-average-card` (33 passed, 159 s), `node tools/check-registry.mjs --json` (ok, 0 errors, fingerprints unchanged), `check-layout` (ok at 7 canvases) and `check-why` (ok). The build call itself timed out (`state`/`run.json`: `timedOut: true`, exit null) but the code, test and `30-build.md` are complete and every gate I ran is green.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a (length bars) | 2 | 1 | 1 | 2 | 2 | 1 | 2 | 2 | 2 | 15 | no |
| b (length + tick) | 2 | 1 | 1 | 2 | 2 | 1 | 2 | 2 | 2 | 15 | no |
| c (spread bars, in place) | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 17 | no |

Line 9 is a 2 for all three on the condition in "Honest weakness" below: `tutorial-6` currently shows two phases (scout, plan) and no build. The WHY spec says the timeline is copied from `trace.json` in the ship phase, so that is the ship phase's job, not a build defect. It must include the build phase, including that it timed out.

## What each variant gets right / wrong
**a - length bars, tick off.**
- Right: every claim of the brief is in the square still: `(24.19)` and `(31.62)` hollow, `29.50+` solid, `27.80`, `NEW PB`, `-0.55 vs previous Ao5 PB 28.35`; the arithmetic is the brief's.
- Wrong: the five bars are 77-100% of the track and say almost nothing (the brief predicted this); a stranger learns the order of the times, not who carried the average.
- Wrong: footnote `+ = +2 included.` wraps as `+` / `= +2 ...` in tall canvases (the builder fixed the wording only for c; b's portrait still shows the broken wrap, a's code has the same string).

**b - length bars + tick at the average.**
- Right: the tick in `b/stills/portrait.png` puts a reference in every track and the footnote names it (`Tick = the average.`).
- Wrong: the tick sits in the last quarter of every track and the bars still read as "all the same"; the reference line does not fix the sameness, it only marks it.
- Wrong: same `+` / `= +2` orphan wrap in the portrait footnote.

**c - spread bars (distance from the average), centre line, in place.**
- Right: `c/stills/square.png` shows the thing the card is for: `27.84` is a sliver on the line, `(24.19)` a hollow bar to the left, `29.50+` solid to the right, `(31.62)` hollow filling the right half, `26.07` solid left. Dropped best and worst are the ends of the spread, which is true. Decimal points stack, `29.50+` and `(24.19)` hang their `+` and `)` past the digit edge.
- Right: the test checks real tile widths against the numbers (length and spread, 7 canvases, within 1%), hollow = hole tile in track colour, DNF row has no bar, vectors 27.80 / 28.35 (Ao12 half-up) / Mo3 19.18 / DNF are pinned, error messages name the value. A slower average is a plus sign in ordinary ink, no chip (tested).
- Wrong (all are for the polish pass, none blocks): see below.

Defects found, string by string, in c (the builder's worklist if this were rejected, and the polish list as it is):
1. The card does not explain its own bars where a reader looks. The only statement of "left = faster" is the footnote, about 22 px dim grey on the 1080 square. A stranger who skips the footnote reads `(31.62)`'s long bar as "long = good". A tiny `faster` / `slower` caption under the two ends of one track, or a bigger footnote, would fix it.
2. `landscape.png`: the footnote wraps to four lines and breaks as `... left =` / `faster.` (orphan `faster.`); the left column has about 350 px of dead space between the delta line and the footnote.
3. `portrait.png`: rows are 56 px bars on a 200 px pitch and there is about 230 px of empty page between row 5 and the footnote; the rows look sparse. The row-height cap leaves the page unbalanced, not broken.
4. `27.84` is 0.04 s from the average, which is 3.6 px of the half-track, but the 1% floor draws 7 px. The bar is about twice its true length. Within the test's tolerance, but it is the one place the picture is not strictly proportional; the footnote does not say so.
5. The `NEW PB` chip floats 16% down from the headline top and sits 60 px right of the digits; it reads as a separate badge, not as the headline's label. Fine, but loose.
6. `scratch/stress.png` (Ao12, 1:02.45 as the single non-dropped outlier) shows the real limit of spread bars: the one slow solve fills half the track and eleven others are slivers 2-10 px wide, with `(25.98)` a 20 px outline. Correct, but it is a poor picture of a normal Ao12. The builder's "30-character handle" in the test is 28 characters (`the_quick_brown_fox_jumps_ov`); the 32-character limit is checked only as a refusal at 160x90.
7. Rows and `previousPb` are real; the `solves` prop is a list of strings the cuber has to extract from csTimer by hand. The tutorial and the build note say so honestly.

## Honest weakness (carried to the ship phase)
- `tutorial-6` ("How this template was made") says `2 phases - 5m 26s ... $1.27` and shows scout and plan only. The day's build phase ran 54 minutes and was killed by the timeout. The ship phase must copy the full timeline from `trace.json` (`check-why` enforces agreement with the trace) so the page does not claim the template was made in 5 minutes.
- Tutorial 2 quotes only what the scout wrote from the two thread URLs, no member names, no source the scout did not list. Tutorial 3 describes what c does (distance bars, hollow dropped, plus sign not red, three weak spots, no csTimer parsing). Tutorial 5 is c at its defaults.

## Decision: SHIP c

Reason: it renders at defaults on all seven contract canvases with exit 0 and no degraded flag, its bars exist and are asserted against the numbers, the arithmetic and DNF/Mo3 rules match the brief's vectors, the why-tutorial tells the truth about c, and it is the only variant whose default picture answers "who carried the average". a and b are one prop away (`bar: "length"`, `avgLine: true`), so nothing is lost.

## If ship: what a human polish pass should look at first
1. Add a "faster / slower" caption or enlarge the footnote so the spread bars explain themselves (defect 1); stop the `left =` / `faster.` split (defect 2).
2. Look at the portrait and landscape balance (defects 2 and 3): cap the row pitch or let the band centre, and use the left-column dead space.
3. Decide if the 1% floor bar for a solve within 1% of the average should be hidden or noted (defect 4).
4. In the ship note, show the csTimer `Time List` to `solves` mapping and do not claim parsing; copy the full timeline into `WHY.timeline` including the timed-out build.
5. Look at the light preset and `bar: "length"` at 1920x1080 with an Ao12 once by eye (`scratch/mo3.png` is clean; I did not view an Ao12 in light).

## If no ship: the one thing that would have changed the verdict
Not applicable. A missing bar (day 13's failure) or a clipped or malformed number would have: none was found; every time in every still (`27.84`, `(24.19)`, `29.50+`, `(31.62)`, `26.07`, `1:02.45`, `(DNF)`, `28.90+`) is well-formed and correctly signed.
