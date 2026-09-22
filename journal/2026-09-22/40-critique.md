# Critique - 2026-09-22

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a | 0 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 0 | 13/18 | no |

## What each variant gets right / wrong

### Variant a

- `stills/square.png`, `portrait.png`, and `landscape.png` are clear testimonial cards: the selected quote dominates, while `SAMPLE REVIEW`, Maya R., `***** 5 / 5`, Garden refresh, and the verification footer are legible.
- The code is deterministic, uses `ctx.target`, measures the rendered text, binds the useful props, and its focused tests assert bindings, feasibility, optional-row removal, layout sweeps, and invalid input failures. The registry gate is clean.
- The deliverable is incomplete: `report.json` has `ok: false` because the tutorial render exited 1 with `FFMPEG_STALLED`; there is no `tutorial.mp4` or `tutorial-2.png` through `tutorial-6.png`. In addition, the declared layout contract only promises 50% minimum widths for the accent rule and footer, where the brief requires full-width/98% bands, and its WHY timeline stops at scout and plan although build ran.

## Decision: NO SHIP

## If no ship: the one thing that would have changed the verdict

A complete, current six-page why-tutorial artifact that renders at exit 0 (including an accurate build phase on page 6) would have made the otherwise strong receipt-card variant eligible to ship.
