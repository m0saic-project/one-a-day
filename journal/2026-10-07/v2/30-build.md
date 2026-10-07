# Build - 2026-10-07 v2

`@one-a-day/sports/chess-game-recap/v2`, built in one interactive session
(Claude Opus 5.5) after the founder's three calls (see 20-brief.md).

## What is in the folder

- `chess.ts` - the PGN reader and move replayer. Headers, movetext with
  comments, NAGs, `!`/`?` suffixes, variations (skipped), `[%eval]` (kept),
  `SetUp`/`FEN`. Every SAN move is resolved against the position: piece rules,
  disambiguation, a pinned piece is not a candidate, castling refuses through
  check, en passant, promotion. The check suffix is COMPUTED (`Rd8#` because
  the replay found mate, not because the PGN said so). Errors name the move:
  `move 2 for White: Ke3 is not legal here - no White king can go to e3.`
- `story.ts` - the moments (the brief's scoring rule, deterministic), the
  plain-words line per move, the graph series (material, or eval as winning
  chances when 60% of plies carry `[%eval]`).
- `pieces.ts` - the board and a piece set drawn for this template (flat,
  100 x 100 per square, light set outlined dark, dark set with light detail
  lines) as SVG text, shipped as `data:image/svg+xml` assets.
- `chess-game-recap.ts` - copy from the headers, the beats, three
  arrangements, the graph SVG, the document.
- tests: `chess.test.ts` (12: the Opera Game replays to its known final FEN
  `1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k -`, castling both ways,
  en passant, a pin, ambiguity, illegal and unparseable moves, promotion,
  comments/evals/NAGs/variations, ASCII folding; the automatic moments of the
  Opera Game; named moments; the series) and `chess-game-recap.test.ts` (10:
  copy, beats, frame 0, the slide offsets and gates, flip, 5-smooth children,
  long copy, the layout sweep at all seven canvases, errors, determinism).

## How the motion works (and what it rests on)

A probe first (scratchpad, not committed): one 80 px image tile with
`overlay.xExpr` - the expression is an OFFSET from the tile's own rect,
evaluated per frame, and the tile is not clipped to its rect. Commas in the
expression go in bare; `\,` broke the filter graph.

So every board image covers the whole board in a CHILD document (5-smooth
side), back to front: the final board (cold open + ending, an OR gate), then
per moment the board before the move (moving piece hidden, from-square lit,
fading in over the last board), the moving piece alone on a transparent
full-board image with `xExpr`/`yExpr` = squares x (S/8) x smoothstep(t), and
the board after the move. A slide lands exactly where the next image draws
the piece because they share one rect and one pixel size. Castling slides
the rook too. The graph is a second child: one image per moment with its
marker. Captions are root text, one per moment, gated.

Overlay depth: v2 is not in check-registry's costBudget warnings (the board
child stacks images only - no inline masks at any depth).

## Things that bit

1. **The manifest generator refused a second version of a slug**
   ("Duplicate pack-scoped slug") - it predates any vN+1 in this repo. Now
   unique per slug AND version (`src/gen-template-manifest.ts`).
2. **The board cell was 972x992 at 1080x1920.** `placeInsetPieces` quantizes
   cells outward to the 1/120 lattice (16 px vertically there) and paints the
   source back on the exact rect with an inset - the picture was square, the
   flattened check measured the cell. The board's corner now snaps to the
   lattice (`snapCorner`).
3. **A 73-character event line at 480x270** needed 205 px in a 192 px box at
   the floor size. Compacted rather than clipped: drop the time control, then
   the event's name (`eventLine`).
4. **A heredoc ate two backslashes** in `tools/check-why.mjs` (a `"\n"` and a
   regex) - the repo note about Git Bash heredocs holds. Fixed with the Edit
   tool.
5. **A wrap widow** ("gives a knight for a / pawn") on the square canvas:
   wrapped blocks now rebalance to the narrowest measure that keeps the
   line count (variant b).

## Variants

- **a** - first full render: three canvases, stills, tutorial; all exit 0,
  not degraded. Slides verified on frames cut across 16. Qb8+ (hold, three
  mid-slide frames, after). Weak: the widow above; empty space at the bottom
  of the portrait; the landscape graph short with a gap above it.
- **b** - a's code plus balanced wraps, the portrait's spare height spread
  between its sections (and some into the graph), the landscape graph grown
  into the space above it.

## The record around it (maintenance, not template)

- `pipeline/config.json`: `claude-haiku` sits out (commit 5e2c793, before
  this build started).
- `tools/record-dir.mjs` (new), `tools/check-why.mjs`, `tools/gen-gallery.mjs`:
  a vN (N >= 2) with `journal/<date>/vN/run.json` is credited and checked
  against that folder, not the day's runner record.
- `src/sports/index.ts`: v1 is handed to hosts with
  `deprecated: { replacement: v2 }` - the frozen v1 file is untouched.
