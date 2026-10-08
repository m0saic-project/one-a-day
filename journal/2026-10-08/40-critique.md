# Critique - 2026-10-08

Template: `@one-a-day/science/astro-integration-summary/v1`. Two variants (a navy spec, b light "observing log" page); the brief's c and the portrait-first towers variant were not built (30-build.md says so). The in-place source is byte-identical to `variants/a/src` (diffed). Variants a and b differ only in `THEME`, the colour tables, the tint mix target and the tag list.

What I looked at: every a still I could open (landscape 50/90, portrait 10/90, square 90, tutorial 2/3/5/6), b landscape-90 and portrait-50, the build's scratch stress render (8 filters, 30 nights, long names; landscape and portrait) and the code (`layoutContract`, props schema, WHY block). `node tools/check-registry.mjs --json`: ok, 23 rendered, 0 errors, the one warning is another template's. All six renders exit 0, not degraded. No `Date.now` / `Math.random` / env reads in the template (`Date.UTC` is on parsed input only).

I re-did the arithmetic: nights are 3.0 / 4.15 / 3.5 / 5.1 h of 15.75 h, and the ruler cells in landscape-90 are 340 / 470 / 396 / 580 px of 1800, so they match. Ha segments are 400/480/400 px of a 1280 px track (2.0 / 2.4 / 2.0 h). Mid-clip (night 3): Ha 4.4, OIII 2.5, SII 3.75 -> "3.8" (half up), total 10.65 -> "10.7". All match what the stills print.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a (navy, in place) | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 1 | 15 | no |
| b (paper page) | 2 | 2 | 2 | 1 | 2 | 1 | 1 | 1 | 1 | 13 | no |

## What each variant gets right / wrong

### a
- Right: the numbers are correct everywhere I checked (6.4 / 4.1 / 5.3 / 15.8, mid-clip 10.7, ruler widths proportional to hours), the scale is fixed from t=0 (reset still shows empty tracks, the final still fills Ha exactly), and the stress copy holds: a 22-character filter name fits, captions step down to "715 frames", the 30-night ruler labels only "N30", the long title goes to two lines, nothing clips at portrait or landscape. Props are few and typed (`sessions`, `csv`, `filterColors`, `clipSec`, `footer`, `equipment`, `target`, `debugLayout`), all with defaults, bad input is refused by name.
- Wrong, the reading of the nights: the tint alternation on a bar is by that filter's own segment index, the ruler alternates by night index. Ha (nights 1, 2, 4) shows dark / light / dark but its last segment sits under a LIGHT ruler cell (N4); OIII (nights 1, 3, 4) shows dark / light / dark and its second segment is night 3, a DARK ruler cell. Nothing in any still links a segment to a night, so "nights visible as steps within each bar" (brief rubric 2) is only half true: you see steps, you cannot say which night each is.
- Wrong, layout: portrait-90 and portrait-10 leave ~270 px of empty navy between the header and the first row and ~300 px between the SII track and the ruler, with the three rows floating in the middle; the title and equipment lines are nearly touching. The contract's `night-ruler` is `minWidthFrac 0.85` where the brief said 0.9 (the rendered ruler is 0.92-0.94 of the width, so 0.9 would have passed; it was loosened for no reason I can see). The hours use a monospace face that looks different from every other string on the card ("15.8 h" with wide-spaced digits).
- Wrong, use: the CSV path is the whole pitch, and it was only exercised on a synthetic file the builder wrote (`scratch/csv.json`, "2026-10-01 02:00:00"). 30-build.md admits no real `ImageMetaData.csv` was opened; if the plugin's timestamps differ (e.g. 7-digit fractional seconds, offset suffixes) the user's first paste is refused. Honest, but unproven for the person it is for. No object image, by design.
- Why-tutorial: `tutorial-3` (solution) describes what a does and lists its weak spots, good. `tutorial-2` (problem): the five sources are exactly the pages the scout opened, quotes are verbatim, and it says AstroBin could not be read, but the "Who" line still names "AstroBin, NINA Discord" as where these people post - the scout never opened either - and "Every finished image is posted with typed numbers" generalises from two observatory pages. "one imager built a log analyzer" is the NINA log, not these CSVs, and the page runs the two together ("Other tools read these files, and one imager built..."). `tutorial-6` shows "2 phases - 5m 59s" (scout, plan): build is missing, because the timeline was copied from trace.json while build was still running (AGENTS.md line ~196 says to refresh it; the ship phase should).

### b
- Right: the paper page is a real, usable alternative for a white AstroBin caption or print. Ha vs SII are clearly separate (#e4431d vs #7d1426), the amber "now" cell has good contrast on dark ink (portrait-50 N3), and it renders clean at all canvases (exit 0, not degraded).
- Wrong: same defects as a (tint/ruler mismatch, portrait voids, 0.85, tutorial-2/6) because it is the same code. It also drops the descriptive tags (`["science","2026-10-08","day-019"]` vs a's six extra), which hurts discovery, and the brief called a the default; b is not what was left in place.
- It is a palette swap, as 30-build.md says, and not a different idea. It is a candidate for a `theme` prop later, not a variant to ship now.

## Decision: SHIP a

The default is no-ship and I looked for a reason. I did not find a fatal one: no degraded render, tests assert real numbers (66 `expect`s, 14 cases, including the 6.4/4.1/5.3/15.8 arithmetic, the fixed scale, the stress contract and determinism), every prop has a default, pack and slug say what it is, the problem page names no source the scout did not open, and the solution page claims nothing the code lacks. What is wrong is polish plus one unproven input path, and none of it makes the card wrong. The risk I am accepting is that the CSV timestamp format is a guess; the template says so, refuses by row, and the sample/`sessions` path is the default.

## If ship: what a human polish pass should look at first
1. Make bar tints follow the NIGHT (parity of the night index), not the filter's segment index, so each segment matches its ruler cell; or print "N1".. on segments when they are wide enough.
2. Open a real NINA `ImageMetaData.csv` (the plugin repo has samples/issues) and check `ExposureStartUTC` and `Duration` parse; widen the reader to what the plugin writes, keep refusing the rest by row.
3. Portrait: use the vertical slack (taller rows or a larger gap budget) and give the title/equipment lines a gap; consider the brief's `minWidthFrac 0.9`.
4. Refresh `WHY.timeline` from `trace.json` so tutorial-6 includes build; drop "AstroBin, NINA Discord" from `who` or mark it as unread; split the log-analyzer sentence from the CSV sentence.
5. Consider a `theme` prop (navy | paper) instead of shipping b as a separate variant, and a proportional (not monospace) face for the hours if one is available.

## If no ship: the one thing that would have changed the verdict
n/a (ship). The thing closest to flipping it was the tint-to-ruler mismatch: if the human thinks the nights are the point of the picture, it is a no-ship until segments and ruler agree.
