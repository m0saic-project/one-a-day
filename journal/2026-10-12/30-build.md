# Build — 2026-10-12

## Template: @one-a-day/sports/climbing-send-pyramid/v1

## Variant a — centered bars, flash/onsight as a cap inside the bar · gate: clean · render: ok · stills: a pyramid
Square and landscape read immediately: Mara Ellison, SPORT chip, 65 clean sends, eight grades from 5.12a (a chalk dot) down to 5.10b (the wide bar), cream cap on the left of every row that has flashes, `(1)` through `(7)` beside the counts, footer naming both inks. The first portrait pass jammed `12` into `(4)` against the bar; the count column is now measured and guttered, and the re-render has air between the bar and `18 (7)`. Exit 0 on landscape, portrait, square and the tutorial. No error mosaic.

Variant b (cap as a second bar under the send) was not built. The brief said to try it only if the cap read as one blob. It does not: the cream share is obvious on every row that has one, and 5.12a has none.

## Why-tutorial
Problem page quotes the forum ("only red points" / "two histograms on their side") and lists the four opened sources. Solution page says centered bars, no sort, cap is the flash share, and the 65 sends are invented.

## What was hard
- A color that works as a bar on both a dark page and a light one. Chalk on cream disappeared, so the send bar is rust and the cap is cream, sitting on the bar rather than on the page.
- Portrait counts. A fixed 16% column was enough on a square and not on a story. The column is now the measured width of the longest count, plus a gutter.
- `placeInsetPieces` refuses a float width. `widthOf` returns floats; every reserved column has to be ceiled.

## In place now: a
