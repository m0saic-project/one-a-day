# Critique — 2026-10-14

Method, honestly: this model rejects image input, so I could not view a
single still (the builder could not either). I judged from what can be read
and re-run: every `report.json` (exit 0 / degraded:false on landscape,
portrait, square, validate and the 59 s tutorial, all three variants),
`node tools/check-registry.mjs --json` re-run by me (29/29 rendered, 0
errors, 0 skipped; the only warnings are the standing og-card /
episode-audiogram posture notes), the three `src/tenxten-challenge-card.ts`
and their `.layout.m0` fingerprints, `node journal/2026-10-14/verify-doc.mjs`
re-run by me against the in-place dist (26/26 PASS - every text literal,
binding, mask subpath count and the arithmetic recomputed from the list),
`npx jest src/gaming/tenxten-challenge-card` re-run by me (11/11), the
builder's `geom.json` lattice dump, and `git status` (exactly one new
template folder plus its wiring; no frozen template touched). The strings
below were checked string by string the way a stranger would read them:
"10 x 10 CHALLENGE", "- 2026", "@cardboard_kim", "81 / 100", "6 / 10",
"2 ahead", ten names, ten counts, the footnote's pace formula.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18 | no |
| b | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 0 | 14 | yes - why lies |
| c | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18 | no |

## What each variant gets right / wrong

**a (in place) - three stat tiles over the pip grid.**
- Right: every claim I could execute passes - exit 0 on all canvases,
  byte-equal double render, 26/26 doc claims, 11/11 tests, gate clean;
  `landscape.png`'s lattice probed at all 100 pip centres (accent 81, track
  19, pitch 99, row pitch 61); the contract is the brief's invariants
  verbatim (tiles one size in [0.14, 0.36], rows and both pip masks in
  [0.3, 0.94], footnote in [0.9, 1], pace-mark present when ahead).
- Wrong: nothing fatal found. Two weak spots: `stills/tutorial-6.png` shows
  scout + plan only - the build phase (two calls, 137 tool calls in the
  second, the day's real cost) is missing because the timeline was copied
  before build ran; and at `dayOfYear: 1` the sample reads "81 ahead",
  honest arithmetic that looks odd to a stranger (documented in the
  caveats as the January-start assumption).
- Note: the brief's rubric line 6 calls the row anatomy "day 025's climbing
  pyramid" - that is the brief's typo (it is day-023, 2026-10-12); the
  template's header credits the right day, so line 8 does not suffer.

**b - the stat band as ONE full-width strip line.**
- Right: the one change is exactly the brief's variant b - the strip reads
  "81 / 100 plays - 6 / 10 games done - 2 ahead of pace" (verified in the
  doc), the accent pace bar sits under the measured pace tail, the grid
  gains a row; exit 0 everywhere, gate clean, test order updated.
- Wrong (fatal): the WHY `solution` claims "three stat tiles" twice
  (variants/b/src/tenxten-challenge-card.ts lines 409 and 418) and the
  layout docstring still says "three stat tiles" (line 251) - b renders a
  strip and has no tiles; a solution page that claims a feature the
  variant does not have is a fatal, and `tutorial-3.png`/`tutorial-5.png`
  would contradict each other. Also: `mix` (line 243) is now dead code
  (the tiles were its only callers), and the strip's contract
  `minWidthFrac: 0.85` under-promises a full-width strip (the design says
  full width; 0.98 would promise it).
- Weak: the strip trades the three-tile glance (the brief's own "day 22
  shape") for one line - day 24's trade, but the brief chose tiles as the
  baseline for a reason.

**c - pip material: empty pips as rings, filled solid circles.**
- Right: the lattice and fingerprint are IDENTICAL to a (verified: only the
  `pipPath` function differs - the ring is outer circle + counter-wound
  hole, filled pips solid circles inscribed in the same squares); the test
  asserts the ring path counts (19 rings = 38 M, 81 solid = 81 M + 81 a);
  exit 0 everywhere, gate clean, `probe-pixels` found all 100 centres and
  19 mid-stroke ring samples the expected colours on landscape, portrait,
  square and the tutorial's template page.
- Wrong: nothing fatal. But the WHY `solution` never mentions the ring
  material - the one and only thing that distinguishes c is untold in its
  own why-tutorial, so `tutorial-3.png` describes a, not c.
- Weak: the ring stroke is `max(1, round(0.16 x side))` - at the smallest
  promised canvas (480x270, `outputHints.note` says "Minimum tested canvas
  480x270") pipSide is ~11 px and the stroke degenerates to 2 px; readable
  on the hero canvases, marginal at the floor.

## Decision: SHIP a

a and c tie at 18 with identical geometry (identical fingerprints) - the
pip material is taste, and taste tips to a: solid squares are the fridge
chart's own metaphor (the scout's leminal evidence: "color in every time we
played"), they stay fully readable at every canvas down to 480x270 where
c's rings thin to 2 px, rectangles in one inline mask are the most
conservative render surface (the crossword's lesson), and a's why tells
its whole story while c's omits its only distinction. b's why disqualifies
it on its own.

## If ship: what a human polish pass should look at first

1. LOOK at the stills - `journal/2026-10-14/variants/a/stills/` (landscape,
   portrait, square, tutorial-1..6). Nobody has seen them with eyes today:
   both the builder and I are image-blind, and every claim above rests on
   pixel probes at chosen points, not on the picture as a picture.
2. Re-copy the trace at ship
   (`node pipeline/lib/trace.mjs --timeline journal/2026-10-14/trace.json`
   into `WHY.timeline`, then rebuild) so `tutorial-6.png` shows the phases
   that actually ran - today that includes a build call that timed out at
   94 minutes / 22.5 M tokens / $6.70; the card should carry the day's real
   cost, not the pre-build snapshot.
3. Scan the portrait still for the name column: `nameFrac` jumps 0.28 ->
   0.42 between aspect classes, and `Lost Ruins of Arnak` at a shared
   `namePx` is the first string to feel it.
4. If a human prefers the wood-board warmth, c is on the shelf
   (`variants/c/src/`) with the same fingerprint - a v2 material swap is a
   future day, not an edit to v1.

## If no ship: the one thing that would have changed the verdict

Not applicable - a ships. (For the record, b was one honest WHY rewrite
away: fix the solution page to describe the strip and it clears every
other line except the dead `mix` and the 0.85 width promise.)
