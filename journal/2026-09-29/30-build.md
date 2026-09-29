# Build — 2026-09-29

(in progress - call 1)

## Template: @one-a-day/gaming/crossword-grid-card/v1

Construction decision (call 1): the brief asked for Recipe 3 (a `grid()` with
index-aligned overlay grids for fills, letters and numbers). The gate's
`costBudget` caps a render at 400 frames and 400 sources
(`COST_BUDGETS` in `@m0saic/template-utils`), and a 15x15 as per-cell grids is
225 fills + ~190 letters + ~70 numbers. So the board is drawn instead as:

- paper: one tile under the board;
- theme: one tile masked (inline-mask) to the theme cells;
- ink: one tile masked to "board minus paper cells", which gives the border,
  the rules and the blocks in one path;
- rings: one tile masked to the circled cells' annuli;
- letters and numbers: one multi-layer svg text source per row, each layer
  placed by a pixel `xExpr`/`yExpr` (probe render in `scratch/probe/`).

Every rect goes through `placeInsetPieces`; the cell lattice is authored as
integer lines `X_k = round(x0 + k*pitch)`, so cells are equal within 1 px and
no split count depends on the grid size (13, 17, 19, 23 need no `lattice.allow`).
