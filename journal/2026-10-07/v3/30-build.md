# Build - 2026-10-07 v3

`@one-a-day/sports/chess-game-recap/v3`, the same interactive session
(Claude Opus 5.5), after the founder's ask (20-brief.md). One file,
`v3/chess-game-recap.ts`, plus its test; everything chess is imported from
the frozen v2 files.

## How the board is built

- **States**: the positions the clip shows, in order - the cold open (final
  position), then for each moment the position before the move (moving
  piece hidden, from-square lit) and after it (both squares lit)
  (`chessV3States`).
- **Layers per square** (`chessV3SquareLayers`): for each square, every
  value it takes - a piece key (`wq`, `bp`, ...) or `lit` - with the
  stretches it holds, adjacent stretches merged. One source per (square,
  value): `e4-wp`, `lit-d8`. Enabled over the union of its stretches
  (`lt(t,1.4)+gte(t,12.75)`), or not gated at all when it holds the whole
  clip (`a2-wp`) - the perf rule "one layer per distinct value, never one per
  change".
- **Sliders**: per moment, the moving piece's own rect on the from-square
  with `xExpr`/`yExpr` = the square offset in pixels x smoothstep (castling:
  the rook too), over the hidden from-square.
- **Graph**: panel, zero line, one bar rect per ply (binned to 60), one gold
  marker rect per moment.

## Exact cells - what bit

1. `placeInsetRects` wants integer rects; the bars were fractional. Rounded
   by EDGE in the one `piece()` helper, so neighbours stay flush.
2. **At 1920x1080 all 64 squares came back with an inset** (the cell was not
   the square) while 1080x1920, 1080x1080 and 1280x720 were exact. The board
   was on the basis-360 lattice (pitch 6 x 3), but a 1 px zero line and thin
   bars are smaller than half a cell, so `placeInsetPieces`' `minFill` guard
   fell to a finer pitch - and the board's corner was no longer on it. Fix:
   no rect thinner than one lattice cell (`piece()` floors w/h at the pitch).
   Now 0 of 64 squares need an inset on all seven canvases (tested).

## Cost of explicit geometry (measured, same machine, back to back)

| | sources | gated | embedded art | 1920x1080 render | clip |
| --- | ---: | ---: | ---: | ---: | ---: |
| v2 (whole-board SVGs, 2 child docs) | 44 | 30 | 244 KB | 74 s | 340 KB |
| v3 (64 cells, per-piece rects, bars) | 162 | 50 | 13 KB | 70 s | 280 KB |

More cells, no slower: the static squares and pieces are composited once,
and the gated layers are scalar `enable` gates (cheap when off). The
document's embedded art fell from 31 whole-board images to 12 piece
drawings.

## What was lost

v2 cross-faded whole-board images between moments; v3 changes square by
square with a cut at each moment's start (unchanged squares do not flicker
- they are the same layer). A per-layer fade would need one source per
stretch instead of per value; not done.

## Tests

`v3/chess-game-recap.test.ts` (9): the platform hints (and junk), 64 exact
squares at seven canvases, the per-square truth at the start, middle and end
of every shown state, the static layer and the slide offsets (flipped too),
castling's two sliders, the gate writer, the in-place bindings and the
overrides, the bar graph and markers, the layout sweep (default and long
copy), errors and determinism.
