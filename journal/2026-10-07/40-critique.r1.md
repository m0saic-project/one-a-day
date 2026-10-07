# Critique — 2026-10-07

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---------|---|---|---|---|---|---|---|---|---|-------|--------|
| a       | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 0 | 2 | 15    | YES    |

## What variant a gets right / wrong

**Right**: Layout is structurally sound—header, main zone, footer proportions hold across landscape/portrait/square. Text fits at all canvases (landscape 1920×1080, portrait 1080×1920, square 1080×1080) with no clipping. Props are well-typed with sensible defaults (opening, result, timeControl, ratingChange, date, opponentName). Code is deterministic, uses `ctx.target`, and binds all user-supplied props correctly. Test suite is comprehensive.

**Wrong**: The brief and acceptance rubric (line 2) explicitly require "result icon (colored square or circle) + label" with colors "unambiguous (green = win, red = loss, gray = draw)". The renders show only the text label "WIN" in white—no colored icon. The code computes `resultColor` (lines 250–255 of chess-game-recap.ts) but never renders it; the result label uses `color: INK` (white) with no icon shape. Brief promised clear visual color-coding; the render delivers text only.

**Why-tutorial**: Pages match the brief and scout evidence accurately (tutorial-2 cites all four sources, tutorial-3 describes what the template does, tutorial-5 shows defaults). Tutorial-6 shows scout and plan phases; build phase will be added in ship.

## Decision: NO SHIP

The template fails criterion 8 (brief honesty) and the acceptance rubric's explicit requirement for color-coded result indicators. Without the icon, the card cannot signal win/loss/draw at a glance—a core feature of the use case (Lichess streamers and players need instant result clarity in shared cards).

## If no ship: the one thing that would have changed the verdict

Add a colored square or circle (40% of left-half width, vertically centered in the main zone) beside or above the result label, with fill color from `resultColor` (green, red, or gray) and stroke/interior rendering to stand out against the dark background. Render it in the `resultLabelBox` area or as a separate inset piece with importance weight.
