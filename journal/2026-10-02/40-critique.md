# Critique — 2026-10-02

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---------|---|---|---|---|---|---|---|---|---|----|--------|
| a | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 0 | 14/18 | YES |

## What variant A gets right / wrong

**Right:**
- Renders cleanly at all canvases (landscape, portrait, square) with no degradation or error mosaics. Exit 0 everywhere and layout contract passes across all seven contract sweeps.
- Sector-by-sector breakdown is immediately clear: track, lap time, three sectors with times, PB, and deltas, driver name, and top speed. A sim racer can see at a glance which sector cost time and by how much.
- Text fits legibly at portrait (1080x1920) and square (1080x1080) formats. No clipping or collapse. Layout ratios (header ~20%, sectors ~60%, footer ~20%) hold across all aspects.

**Wrong:**
- The brief's core requirement — "proportional delta bar" (green for faster, red for slower, length proportional to the magnitude) — is nowhere in the render. The template renders *only* colored text deltas (+0.667s in red, +1.111s in red, +0.643s in red), not visual bars. The acceptance rubric demands: "delta bars are immediately readable" and "proportional bar length is accurate (longer bar = larger delta)." The stills (landscape, portrait, square, tutorial-3) show no bar elements at all.
- The brief's ASCII sketch and the build plan both promise "delta: -0.667s (green bar)" as a visual element, not just text. The brief variant suggestions confirm bars were intended (variant 3 mentions "bar colors based on team/driver accent"). The template went silent on this feature rather than delivering it or noting it as a constraint.
- The why-tutorial page 3 (solution) claims "each with a proportional delta bar (green/red)" but the default render (page 5) proves this false: the deltas are text only. The tutorial's promise does not match the template's delivery.

## Decision: NO SHIP

## The one thing that would change the verdict

Implement proportional delta bars as visual rectangles (e.g., background bars behind the delta text, or foreground bars scaled by |deltaMs|) so that longer deltas produce visibly longer bars. The template meets every other requirement — the math is right, the layout is solid, the copy fits — but silently drops a promised feature that is core to the card's purpose: "at a glance which sector was the bottleneck."
