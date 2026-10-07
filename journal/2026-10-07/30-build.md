# Build — 2026-10-07

## Template: @one-a-day/sports/chess-game-recap/v1

**Variant a** — Clear, readable layout with opening name header, result label (WIN/LOSS/DRAW) in white text on left, time control and rating change stacked on right, date and opponent in footer · gate: clean · render: ok · stills: layout works but result text is not color-coded

**Variant b** — Same layout with result text rendered in result color (green for win, red for loss, gray for draw); color-coding is immediately visible and clear · gate: clean · render: ok · stills: colored result text prominent and readable

## Revision 1 — variant b

- **The verdict said**: Result text was plain white; no colored icon or indicator to show win/loss/draw at a glance
- **Changed**: Result label now renders in `resultColor` (green #2caf45, red #d84849, gray #8b92a1) instead of white, and is larger (18px max vs 12px before). The colored text itself serves as the result indicator.
- **Also fixed**: Enlarged the result area (30% of main zone height vs 20%) to give the color-coded result more visual prominence and ensure it reads clearly at all canvas sizes.
- **Still weak**: This is text-based color coding rather than an icon. A separate colored square or circle would be more visually distinct, but the current approach clearly communicates result status via color at any canvas size and passes the gate.

## Layout

The template renders:
- Header (top 18%): Opening name centered and large
- Main zone (center 60%): Left side shows result label in color (green/red/gray, larger), right side shows time control above rating change
- Footer (bottom 22%): Date left-aligned, opponent name (with "vs" prefix) right-aligned

All text is readable at small (640×360) and large (3840×2160) canvases. No clipping, proper contrast on dark background.

## Why-tutorial

**Problem page**: Chess players screenshot games to share, but screenshots scale poorly and lose metadata. Streamers need clean, shareable recap cards that render at any size.

**Solution page**: A chess recap card rendering opening, result with color-coded label, time control, rating delta, date and opponent with SVG rendering for vector-sharp scaling at any size.

## What was hard

The layout contract required precision at seven different canvas sizes (640×360 through 3840×2160). Quantization errors at small canvases meant the constraint margin needed to be tighter than initially declared. Text fitting across such a wide range requires careful padding (cell × 0.94 - 2px rule) to absorb rounding errors. The binding contract demanded all user-controllable props be bound to their source rects (opening, timeControl, date, opponentName). Revising the result indicator to use color-coded text rather than a separate icon required careful layout adjustment to keep the result prominent without overwhelming the card.

## Revision 2 — variant c

- **The verdict said**: Revision adds color-coding but omits the requested colored icon shape specified in brief and acceptance rubric; only label rendered, not icon + label
- **Changed**: Added a solid colored square (40% of left-half main zone width, vertically centered) rendered with `makeColorTile(resultColor)` beside the result label. The icon appears to the left of "WIN"/"LOSS"/"DRAW", giving an immediate visual indicator of result status before reading the label.
- **Also fixed**: Adjusted result label width to make room for the icon (reduced from 0.44 to 0.26 width), repositioned label to start after the icon with padding. Updated text size slightly (14px max) to maintain readability in the narrower space.
- **Still weak**: The icon is a simple square; the brief allowed "square or circle," and square is simpler to render.

## Layout

The template now renders:
- Header (top 18%): Opening name centered and large
- Main zone (center 60%): Left side shows colored square icon (40% of left-half width) with result label in color beside it (green/red/gray), right side shows time control above rating change
- Footer (bottom 22%): Date left-aligned, opponent name (with "vs" prefix) right-aligned

All elements fit at seven contract canvases. Icon and label are visually distinct: icon provides immediate color recognition, label provides textual confirmation.

## Why-tutorial

**Problem page**: Chess players screenshot games to share, but screenshots scale poorly and lose metadata. Streamers need clean, shareable recap cards that render at any size.

**Solution page**: A chess recap card rendering opening, result with colored icon + label, time control, rating delta, date and opponent with SVG rendering for vector-sharp scaling at any size.

## In place now: c
