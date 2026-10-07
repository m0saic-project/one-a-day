# Brief - 2026-10-07 v3 (founder-directed)

v2 shipped at `98e0177`. The founder opened it and asked for two things:

1. **A `platform` prop** - "so I can swap between mobile, square, desktop
   easily ... while still adhering to the templates' flow".
2. **Explicit geometry** - v2 is "a lot of overlay stacks rendering SVGs";
   he would "love it if we could have individual rects for everything ...
   every cell is unique, every element is unique, like every piece. That's
   just typically how I design mosaic templates." He accepted that it might
   cost render time and asked; and noted nothing on the canvas is editable
   ("maybe fine, this is more of a headless template").

v2 is frozen, so this is `v3`, and v2 is deprecated in its favour (v1's
pointer moves to v3 too).

## What v3 keeps

v2's PGN reader and replayer, the moments rule, the captions, the piece
drawings, the copy, the beats and the three arrangements - imported from
the frozen v2 files, not copied.

## What v3 changes

- **platform**: `desktop` 1920x1080 (default) | `square` 1080x1080 |
  `mobile` 1080x1920, through `resolveOutputHints` (the demo-lab pattern): a
  host that follows the template's canvas re-seeds when it changes; an
  explicit size still wins.
- **The board is the canvas**: 64 square cells (`sq-a1` .. `sq-h8`), the
  lit squares their own tiles (`lit-e4`), every piece its own rect on its
  square (`e4-wp`), the moving piece its own rect that slides
  (`slide-3-0`). A square holds ONE layer per piece that ever stands on it,
  enabled over the union of the stretches it does - a piece that does not
  move is the same layer staying on.
- **Exact cells**: the board side is a multiple of the split lattice's
  pitch on both axes and its corner sits on the lattice, so every square
  cell is exactly its square (no inset recovery) on all seven canvases.
- **The graph is rects**: a panel, the zero line, one bar per ply (binned to
  60 for a long game), a marker rect per moment.
- **Editable on the canvas**: `white`, `black`, `event` override the PGN's
  values and are bound to their rects; the rest stays derived (declared in
  `bindings.unbound` with reasons).

## Acceptance

1. Every square cell exact (no inset) at all seven canvases.
2. At every shown moment each square shows exactly the game's piece, never
   two (test samples every state).
3. Slides land on the target square; castling slides two rects.
4. Platform knob: hints follow it; an explicit size wins; junk throws in
   render and falls back in the hint.
5. Names/event editable in place; the overrides show; the PGN still rules
   the moves.
6. Render cost measured against v2.
7. Everything v2's rubric asked still holds (frame 0, captions true, text
   fits, determinism, the tutorial tells the truth).
