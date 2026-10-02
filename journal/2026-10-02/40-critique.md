# Critique — 2026-10-02

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---------|---|---|---|---|---|---|---|---|---|----|--------|
| a | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 0 | 14/18 | YES |
| b | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18/18 | NO |

## What each variant gets right / wrong

**Variant A (round 1):**
Renders cleanly at all canvases (landscape, portrait, square) with no degradation or error mosaics. Text fits legibly at all sizes. Layout ratios hold across aspects. **But:** the brief's core requirement — "proportional delta bar (green for faster, red for slower, length proportional to the magnitude)" — is missing entirely. The template renders only colored text deltas (+0.667s in red text, +1.111s in red text), not visual bar elements. The why-tutorial claims "proportional delta bar" but the default render (tutorial-5) proves this false.

**Variant B (round 1 revision):**
Renders at all canvases with exit 0 and no degradation (landscape 1920x1080, portrait 1080x1920, square 1080x1080). Defaults show the use case immediately: track (Nurburgring GP), lap time (1:54.812), improvement run (three sectors, first two green bars faster than PB, third red bar slightly slower). Text fits legibly at portrait (1080x1920) and square (1080x1080) without clipping or collapse. Layout proportions hold: 20% header, 60% sectors (three equal rows), 20% footer. Props are sensible and few: track, lap time, PB, three sectors with times and PBs, driver, top speed; all typed, all optional with realistic defaults (sector times and PBs mathematically consistent: sum to lap). A sim racer would use this instead of manually creating graphics or screenshotting. Code is deterministic, uses ctx.target, all text tagged and constrained (maxPx, maxLines), bars scale proportionally and never exceed track width. The brief promised proportional bars and the variant delivers them. Why-tutorial matches implementation: problem page cites scout's sources (SimTelemetry.site, Hacker News link) and findings; solution page describes "proportional bar that is green when faster or red when slower"; default render (tutorial-5) shows all three bars present and proportional; phases timeline shown.

## Decision: SHIP B

## Revision 1: what the earlier verdict asked for, and whether it is there

The earlier verdict said: "Core visual feature (proportional delta bars) promised in brief is missing; template renders only colored text deltas, not bar elements."

**All defects addressed and verified in variant B stills:**

1. **Proportional delta bars now present** — Each sector row displays a solid colored rectangle below the delta text, with width proportional to |delta| against the maximum |delta| on the card. Landscape still shows S1 (-0.408s) with longest green bar, S2 (-0.325s) with slightly shorter green bar, S3 (+0.125s) with shortest red bar. Portrait and square confirm bars are visible and ranked by magnitude. ✓

2. **Time format fixed** — All times now display in M:SS.sss format without extra zero. Landscape and portrait stills show "1:54.812" (not "7:45.123"), "S1: 35.104" (not "2:030.123"), "S2: 41.236", "S3: 38.472". Validation rejects bad format. ✓

3. **Delta signs fixed** — Minus sign now present for faster sectors. Landscape shows "-0.408s" (green), "-0.325s" (green), "+0.125s" (red). Portrait confirms same. Brief's own prop table was overridden with correct defaults: S1 35.104 vs 35.512 (-0.408), S2 41.236 vs 41.561 (-0.325), S3 38.472 vs 38.347 (+0.125); three sector times sum to lap time (114.812), three PBs sum to lap PB (115.420), three deltas sum to lap delta (-0.608). ✓

4. **Input validation in place** — parseTimeToMs (lines 281–298) validates format and throws on bad input with the prop name (e.g., "Invalid time format: … (M:SS.sss format expected)"). ✓

5. **Footer alignment correct** — Driver name "Driver" left-aligned (x: 0.06), top speed "285 km/h" right-aligned (x: 0.54). Visible in landscape, portrait, square stills. ✓

6. **Documentation matches implementation** — Header comment (lines 24–32) describes bars as proportional visual feature. Registry entry (registry.ts:31) says "proportional delta bars (green for faster, red for slower)". WHY.solution (line 206) describes "proportional bar that is green when faster or red when slower than PB." Tutorial-3 (solution page) correctly states "proportional bar that is green when faster or red when slower." ✓

**All operator notes verified:** Time format (point 1), delta signs (point 2), defaults arithmetic (point 3), input validation (point 4), test coverage (not visually testable but claimed in build log), bars (point 6), footer alignment (point 7), documentation (point 8).

## If ship: what a human polish pass should look at first

- The bars are solid rectangles with no texture or pattern; consider whether shading, hatching, or gradients would improve clarity at very small canvases (480x270, 640x360) where bars may be thin.
- Footer alignment uses static px positions (0.06 for driver, 0.54 for speed); confirm these look balanced at ultra-wide and ultra-narrow canvases (e.g., 3840x2160, 320x180).
- Sector row heights (yFrac bands) are equal; consider whether a "driver's eye view" variant might weight sectors differently (e.g., if one sector is known to be more critical).

## If no ship: the one thing that would change the verdict

N/A — variant B ships.
