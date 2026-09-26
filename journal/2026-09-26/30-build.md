# Build — 2026-09-26

## Template: @one-a-day/gaming/speedrun-pb-recap/v1

New pack `gaming` (scaffolded by `npm run new`). 12 unit tests: LiveSplit's
time formats, the delta colour rule on the defaults, a real-shaped `.lss`
(seven attempts, a subsplit, a section, the previous PB rebuilt from the
attempt and segment history), frame 0 = the finished recap and the last
frame = the first (the gates evaluated at t), the clock expression, both
children 5-smooth, the pinned duration, and every validation error.

## Variant a — the graph is the cumulative delta at each split (LiveSplit's Graph) · gate: clean · render: ok · stills
Build clean on the first full run (12 s): no warning for this template (the
audiogram and talk-timer each carry an overlayDepth posture warning; this
one does not). Renders: landscape, portrait, square and the tutorial all
exit 0, 1 m 44 s for the set. Stills: at 10% (the cold open) the whole
recap - ten splits in LiveSplit's colours, the graph, 21:11.27, NEW PB, "PB
by 12.34s"; at 50% the Aqueduct row highlighted, five splits landed, five
still showing the old PB dim, the graph half grown, the clock at 12:42.76,
stamp and verdict hidden; at 90% the finish again. The first square render
starved the table (rows at ~15 px under a 140 px clock); fixed before the
set above was kept (see What was hard).

## Variant b — the graph is the time saved or lost on each segment · gate: clean · render: ok · stills
One idea changed: the default `graph` is "segments" (the other stays a
prop value), and the solution page says so. Same timings, same exits. The
graph now carries information the table does not: the Clocktower mistake is
one deep red bar, the late golds are the tall bars, instead of re-drawing
the delta column the table already prints.

## Why-tutorial
The problem page quotes the LiveSplit README ("share a screenshot of your
splits to Imgur"), issue #2543 (splits.io shut down on March 31, 2025, and
speedrun.com's splits lived there), the author's post ("It always lost money
as a side project") and the analytics project ("LiveSplit itself does not
provide any built-in analytics features"), with the five URLs the scout
opened. The solution page says the .lss is the prop, how the clip loops, what
the graph shows for this variant, and the weak spots.

## What was hard
- `src/index.ts` is `export *` of every pack, so exported names collide
  across days: MAX_ROWS, MIN_CLIP_SEC, Fit and fiveSmoothDown were taken
  (tsc TS2308). Today's are prefixed (`RECAP_*`, `RecapFit`) or private.
- A `json` prop cannot be bound whole: `bindProp(src, "segments")` is
  rejected with `path-required`. `bindPropPath(src, "segments", [i, "name"],
  "string")` binds each row's name leaf, so Make edits a segment name in place.
- A tile that shows in the cold open AND after its split needs one gate for
  two windows: `lt(t,hook)+gte(t,land)` with NO `window` twin.
  `parseEnableWindow` (packages/platform/src/ffexpr/window.ts:121) returns
  null for a sum, so the engine gates per frame and never trims the lifetime.
- The cheap way to change text over time is drawtext layers: one video-mode
  text source per column, one layer per row per state, each with its own
  `overlay.enable` (the official lyric-video's mechanism; it caps at 60
  layers a source). 16 rows cost two overlays.
- Square: the clock sized by min(W, H) alone ate the table. The clock is now
  min(0.13 S, 0.085 H), rows get a legible minimum first, and the graph takes
  only what is left (dropped when that is under 5% of the height).

## In place now: b
